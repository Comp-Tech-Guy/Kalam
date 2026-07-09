import os
import sys
import json
import shutil
import subprocess
import ctypes
import tempfile
import psutil
import time
import yaml
import winreg

_NO_WINDOW = subprocess.CREATE_NO_WINDOW


def get_running_processes():
    names = set()
    for process in psutil.process_iter(['name']):
        try:
            if process.info['name']:
                names.add(process.info['name'].lower())
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return names


def is_process_running(exe_name: str, running_names=None) -> bool:
    if running_names is not None:
        return exe_name.lower() in running_names
    target_lower = exe_name.lower()
    for process in psutil.process_iter(['name']):
        try:
            if process.info['name'] and process.info['name'].lower() == target_lower:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return False


def kill_process(exe_name: str, running_names=None):
    target_lower = exe_name.lower()

    if running_names is not None and target_lower not in running_names:
        return

    if target_lower == "glazewm.exe":
        subprocess.run(["glazewm.exe", "exit"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                       creationflags=_NO_WINDOW)
        time.sleep(0.5)

    found = False
    for process in psutil.process_iter(['name', 'pid']):
        try:
            if process.info['name'] and process.info['name'].lower() == target_lower:
                found = True
                process.terminate()
                try:
                    process.wait(timeout=2)
                except psutil.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=1)
                break
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    if found:
        time.sleep(0.3)


def set_wallpaper_all_desktops(image_path):
    from pyvda import get_virtual_desktops
    for d in get_virtual_desktops():
        d.set_wallpaper(image_path)


def rainmeter(path, layout, running_names=None):
    if not is_process_running("Rainmeter.exe", running_names):
        subprocess.Popen([path], creationflags=_NO_WINDOW)

    time.sleep(1)
    subprocess.run([path, "!LoadLayout", layout], creationflags=_NO_WINDOW)


def yasb_code_inject(yaml_content, css, yasb_config_path, yasb_exe_path, running_names=None):
    if not is_process_running("yasb.exe", running_names):
        subprocess.Popen([yasb_exe_path], creationflags=_NO_WINDOW)

    css_file = os.path.join(yasb_config_path, "styles.css")
    yaml_file = os.path.join(yasb_config_path, "config.yaml")
    formatted_yaml = yaml.safe_load(yaml_content)
    with open(yaml_file, 'w') as f:
        yaml.dump(formatted_yaml, f)
    with open(css_file, 'w') as f:
        f.write(css.strip())


def glaze_wm_apply(config_yaml, config_path, exe_path="", running_names=None):
    config_file = os.path.join(config_path, "config.yaml")
    with open(config_file, 'w') as f:
        f.write(config_yaml.strip())

    glaze_exe = exe_path or "glazewm.exe"
    if is_process_running("glazewm.exe", running_names):
        subprocess.run([glaze_exe, "exit"], creationflags=_NO_WINDOW)
        time.sleep(0.5)
    subprocess.Popen([glaze_exe], creationflags=_NO_WINDOW)


def zebar_apply(config_json, config_path, running_names=None):
    config_file = os.path.join(config_path, "settings.json")
    formatted = json.loads(config_json)
    with open(config_file, 'w') as f:
        json.dump(formatted, f, indent=2)

    kill_process("zebar.exe", running_names)
    subprocess.Popen(["zebar.exe"], creationflags=_NO_WINDOW)


def _read_mod_subkey(mod_subkey, mod_id):
    entry = {"id": mod_id, "name": mod_id, "enabled": 0}
    try:
        disabled, _ = winreg.QueryValueEx(mod_subkey, "Disabled")
        entry["enabled"] = 0 if disabled else 1
    except (FileNotFoundError, OSError):
        entry["enabled"] = 1
    try:
        settings_key = winreg.OpenKey(mod_subkey, "Settings")
        try:
            j = 0
            settings = {}
            while True:
                try:
                    val_name, val_data, val_type = winreg.EnumValue(settings_key, j)
                    settings[val_name] = val_data
                    j += 1
                except OSError:
                    break
            entry["settings"] = settings
        finally:
            winreg.CloseKey(settings_key)
    except (FileNotFoundError, OSError):
        pass
    return entry


def _scan_portable_mods(windhawk_path):
    mods = []
    windhawk_dir = os.path.dirname(windhawk_path) if windhawk_path else ""
    if not windhawk_dir or not os.path.isdir(windhawk_dir):
        return mods

    ini_path = os.path.join(windhawk_dir, "windhawk.ini")
    app_data = "AppData"
    if os.path.exists(ini_path):
        try:
            with open(ini_path) as f:
                for line in f:
                    if line.startswith("AppDataPath="):
                        val = line.split("=", 1)[1].strip()
                        if os.path.isabs(val):
                            app_data = val
                        else:
                            app_data = os.path.normpath(os.path.join(windhawk_dir, val))
                        break
        except OSError:
            pass

    mods_dir = os.path.join(app_data, "Mods")
    if os.path.isdir(mods_dir):
        for mod_id in os.listdir(mods_dir):
            mod_path = os.path.join(mods_dir, mod_id)
            if os.path.isdir(mod_path):
                mods.append({"id": mod_id, "name": mod_id, "enabled": 1})
    return mods


def _enumerate_windhawk_registry():
    seen_ids = set()
    entries = []
    for key_path in [r"SOFTWARE\Windhawk\Engine\Mods", r"SOFTWARE\Windhawk\Mods"]:
        for root_key in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
            try:
                key = winreg.OpenKey(root_key, key_path)
            except (FileNotFoundError, PermissionError, OSError):
                continue
            try:
                i = 0
                while True:
                    try:
                        mod_id = winreg.EnumKey(key, i)
                        if mod_id not in seen_ids:
                            seen_ids.add(mod_id)
                            try:
                                mod_subkey = winreg.OpenKey(key, mod_id)
                                try:
                                    entry = _read_mod_subkey(mod_subkey, mod_id)
                                finally:
                                    winreg.CloseKey(mod_subkey)
                            except OSError:
                                entry = {"id": mod_id, "name": mod_id, "enabled": 1}
                            entries.append(entry)
                        i += 1
                    except OSError:
                        break
            finally:
                winreg.CloseKey(key)
            if entries:
                return entries
    return entries


def scan_windhawk_registry(folder_path, user_settings=None):
    manifest_path = os.path.join(folder_path, "windhawkManifest.json")
    mods = _enumerate_windhawk_registry()

    if not mods and user_settings:
        wh_type = user_settings.get("Windhawk-Type", "Installed")
        wh_path = user_settings.get("Windhawk-Path", "")
        if wh_type == "Portable" and wh_path:
            mods = _scan_portable_mods(wh_path)

    with open(manifest_path, 'w') as f:
        json.dump({"installedMods": mods}, f, indent=2)
    return mods


def _reg_format_value(name, value):
    if isinstance(value, bool):
        return f'"{name}"=dword:{int(value):08x}'
    if isinstance(value, int):
        return f'"{name}"=dword:{value:08x}'
    escaped = str(value).replace("\\", "\\\\").replace('"', '\\"')
    return f'"{name}"="{escaped}"'


def _is_elevated():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except AttributeError:
        return False


def _run_elevated(file, params):
    if _is_elevated():
        result = subprocess.run([file, params], capture_output=True, text=True, creationflags=_NO_WINDOW)
        if result.returncode != 0:
            raise PermissionError(f"Elevated command failed: {result.stderr or result.stdout}")
        return True

    class _SHELLEXECUTEINFO(ctypes.Structure):
        _fields_ = [
            ('cbSize', ctypes.c_ulong),
            ('fMask', ctypes.c_ulong),
            ('hwnd', ctypes.c_void_p),
            ('lpVerb', ctypes.c_wchar_p),
            ('lpFile', ctypes.c_wchar_p),
            ('lpParameters', ctypes.c_wchar_p),
            ('lpDirectory', ctypes.c_wchar_p),
            ('nShow', ctypes.c_int),
            ('hInstApp', ctypes.c_void_p),
            ('lpIDList', ctypes.c_void_p),
            ('lpClass', ctypes.c_wchar_p),
            ('hKeyClass', ctypes.c_void_p),
            ('dwHotKey', ctypes.c_ulong),
            ('hMonitor', ctypes.c_void_p),
            ('hProcess', ctypes.c_void_p),
        ]
    sei = _SHELLEXECUTEINFO()
    sei.cbSize = ctypes.sizeof(sei)
    sei.fMask = 0x00000040
    sei.lpVerb = 'runas'
    sei.lpFile = file
    sei.lpParameters = params
    sei.nShow = 0
    if not ctypes.windll.shell32.ShellExecuteExW(ctypes.byref(sei)):
        raise PermissionError("User cancelled or failed to elevate")
    ctypes.windll.kernel32.WaitForSingleObject(sei.hProcess, 60000)
    exit_code = ctypes.c_ulong()
    ctypes.windll.kernel32.GetExitCodeProcess(sei.hProcess, ctypes.byref(exit_code))
    ctypes.windll.kernel32.CloseHandle(sei.hProcess)
    if exit_code.value != 0:
        raise PermissionError(f"Elevated script failed with exit code {exit_code.value}")
    return True


def _get_current_windhawk_settings():
    entries = _enumerate_windhawk_registry()
    return {e["id"]: e for e in entries}


def _windhawk_settings_changed(mods, current_mods):
    mod_ids = {m.get("id", "") for m in mods}

    for mod in mods:
        mod_id = mod.get("id", "")
        if mod_id not in current_mods:
            return True
        cur = current_mods[mod_id]
        if cur.get("enabled", 0) != mod.get("enabled", 0):
            return True
        desired_settings = mod.get("settings", {})
        if desired_settings:
            if cur.get("settings", {}) != desired_settings:
                return True

    for cur_id in current_mods:
        if cur_id not in mod_ids:
            return True

    return False


def _apply_windhawk_hklm(mods):
    current_mods = _get_current_windhawk_settings()
    if not _windhawk_settings_changed(mods, current_mods):
        return

    reg_lines = ['Windows Registry Editor Version 5.00', '']
    for mod in mods:
        mod_id = mod.get("id", "")
        enabled = mod.get("enabled", 0)
        mod_path = rf"HKEY_LOCAL_MACHINE\SOFTWARE\Windhawk\Engine\Mods\{mod_id}"
        reg_lines.append(f'[{mod_path}]')
        disabled_val = 0 if enabled else 1
        reg_lines.append(f'"Disabled"=dword:{disabled_val:08x}')
        reg_lines.append(f'"SettingsChangeTime"=qword:{int(time.time()):016x}')
        reg_lines.append('')
        settings = mod.get("settings", {})
        if isinstance(settings, dict) and settings:
            settings_path = rf"{mod_path}\Settings"
            reg_lines.append(f'[{settings_path}]')
            for sk, sv in settings.items():
                reg_lines.append(_reg_format_value(sk, sv))
            reg_lines.append('')

    reg_content = '\r\n'.join(reg_lines) + '\r\n'
    td = tempfile.gettempdir()
    reg_file = os.path.join(td, 'kalam_windhawk.reg')
    bat_file = os.path.join(td, 'Kalam_Update_Windhawk_Settings.bat')
    try:
        with open(reg_file, 'w', encoding='utf-16le') as f:
            f.write('\ufeff' + reg_content)
        with open(bat_file, 'w') as f:
            f.write('@reg import "' + reg_file + '" >nul 2>&1\n')
            f.write('@net stop Windhawk >nul 2>&1\n')
            f.write('@net start Windhawk >nul 2>&1\n')
            f.write('@exit /b 0\n')

        _run_elevated(bat_file, '')
    finally:
        for p in [reg_file, bat_file]:
            try:
                os.remove(p)
            except OSError:
                pass


def apply_windhawk_profile(profile, user_settings, folder_path):
    profile_mods = profile.get("Windhawk-Mods", [])
    profile_ids = {m["id"] for m in profile_mods}

    manifest_path = os.path.join(folder_path, "windhawkManifest.json")
    installed_ids = []
    try:
        with open(manifest_path) as f:
            installed_ids = [m["id"] for m in json.load(f).get("installedMods", [])]
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        pass

    mods = list(profile_mods)
    for iid in installed_ids:
        if iid not in profile_ids:
            mods.append({"id": iid, "enabled": 0, "settings": {}})

    if not mods:
        return

    wh_type = user_settings.get("Windhawk-Type", "Installed")

    if wh_type == "Installed":
        _apply_windhawk_hklm(mods)
    else:
        wh_path = user_settings.get("Windhawk-Path", "")
        windhawk_dir = os.path.dirname(wh_path) if wh_path else ""

        # Portable Windhawk stores mod settings in files under AppData/, not in registry.
        # The exact file format is undocumented, so we apply changes directly via HKLM
        # (the officially documented mechanism per the Windhawk maintainer).
        try:
            _apply_windhawk_hklm(mods)
        except PermissionError:
            print("WARNING: Could not write Windhawk settings to registry (not admin). "
                  "For portable mode, pre-configure mods in Windhawk UI.")
        except Exception as e:
            print(f"WARNING: Failed to apply Windhawk settings: {e}")

        if wh_path and os.path.exists(wh_path):
            kill_process("windhawk.exe")
            subprocess.Popen([wh_path], creationflags=_NO_WINDOW)
        else:
            print("WARNING: Windhawk path not configured or not found for portable mode")


def _parse_rainmeter_ini(ini_path):
    for encoding in ['utf-16-le', 'utf-8']:
        try:
            with open(ini_path, encoding=encoding) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('ActiveLayoutFile='):
                        val = line.split('=', 1)[1].strip().strip('"')
                        if val.endswith('.ini'):
                            val = val[:-4]
                        if '\\' in val:
                            val = val.rsplit('\\', 1)[1]
                        return val
        except (OSError, UnicodeDecodeError):
            continue
    return ""


def scan_rainmeter_layouts(folder_path):
    manifest_path = os.path.join(folder_path, "rainmeterManifest.json")
    layouts = []

    appdata = os.environ.get('APPDATA', '')
    rainmeter_appdata = os.path.join(appdata, 'Rainmeter')
    layouts_dir = os.path.join(rainmeter_appdata, 'Layouts')

    if os.path.isdir(layouts_dir):
        for entry in sorted(os.listdir(layouts_dir)):
            entry_path = os.path.join(layouts_dir, entry)
            if os.path.isdir(entry_path) and not entry.startswith('@'):
                layouts.append(entry)

    rainmeter_ini = os.path.join(rainmeter_appdata, 'Rainmeter.ini')
    current_layout = ""
    if os.path.exists(rainmeter_ini):
        current_layout = _parse_rainmeter_ini(rainmeter_ini)

    with open(manifest_path, 'w') as f:
        json.dump({"layouts": layouts, "currentLayout": current_layout}, f, indent=2)
    return layouts


def scan_yasb_configs(folder_path, user_settings):
    manifest_path = os.path.join(folder_path, "yasbManifest.json")
    result = {"yaml": "", "css": ""}

    yasb_path = user_settings.get("Yasb-Config-Path", "")
    if yasb_path and os.path.isdir(yasb_path):
        yaml_file = os.path.join(yasb_path, "config.yaml")
        css_file = os.path.join(yasb_path, "styles.css")
        if os.path.exists(yaml_file):
            with open(yaml_file) as f:
                result["yaml"] = f.read()
        if os.path.exists(css_file):
            with open(css_file) as f:
                result["css"] = f.read()

    with open(manifest_path, 'w') as f:
        json.dump(result, f, indent=2)
    return result


def scan_glazewm_configs(folder_path, user_settings):
    manifest_path = os.path.join(folder_path, "glazewmManifest.json")
    result = {"config": ""}

    glaze_path = user_settings.get("GlazeWM-Config-Path", "")
    if glaze_path and os.path.isdir(glaze_path):
        config_file = os.path.join(glaze_path, "config.yaml")
        if os.path.exists(config_file):
            with open(config_file) as f:
                result["config"] = f.read()

    with open(manifest_path, 'w') as f:
        json.dump(result, f, indent=2)
    return result


def scan_zebar_configs(folder_path, user_settings):
    manifest_path = os.path.join(folder_path, "zebarManifest.json")
    result = {"config": ""}

    zebar_path = user_settings.get("Zebar-Config-Path", "")
    if zebar_path and os.path.isdir(zebar_path):
        config_file = os.path.join(zebar_path, "settings.json")
        if os.path.exists(config_file):
            try:
                with open(config_file) as f:
                    result["config"] = f.read()
            except OSError:
                pass

    with open(manifest_path, 'w') as f:
        json.dump(result, f, indent=2)
    return result


def _first_existing(paths_iter):
    for p in paths_iter:
        if p and os.path.exists(p):
            return p
    return ""

def _program_files_dirs():
    dirs = []
    for var in ["ProgramW6432", "ProgramFiles", "ProgramFiles(x86)"]:
        val = os.environ.get(var)
        if val and os.path.isdir(val):
            dirs.append(val)
    return dirs

def autodetect_paths():
    paths = {}
    pf_dirs = _program_files_dirs()

    rainmeter_checks = [shutil.which("Rainmeter.exe")]
    for pf in pf_dirs:
        rainmeter_checks.append(os.path.join(pf, "Rainmeter", "Rainmeter.exe"))
    rainmeter_checks.append(os.path.join(os.environ.get("LOCALAPPDATA", ""), "Rainmeter", "Rainmeter.exe"))
    found = _first_existing(rainmeter_checks)
    if found:
        paths["rainmeter-Path"] = found

    windhawk_checks = [shutil.which("windhawk.exe")]
    for pf in pf_dirs:
        windhawk_checks.append(os.path.join(pf, "Windhawk", "Windhawk.exe"))
    windhawk_checks.append(os.path.join(os.environ.get("LOCALAPPDATA", ""), "Windhawk", "windhawk.exe"))
    found = _first_existing(windhawk_checks)
    if found:
        paths["Windhawk-Path"] = found

    wh_type = "Portable"
    for root_key in [winreg.HKEY_LOCAL_MACHINE]:
        try:
            key = winreg.OpenKey(root_key, r"SOFTWARE\Windhawk\Engine")
            winreg.CloseKey(key)
            wh_type = "Installed"
            break
        except (FileNotFoundError, PermissionError, OSError):
            pass
    paths["Windhawk-Type"] = wh_type

    user_home = os.path.expanduser("~")
    appdata = os.environ.get("APPDATA", "")

    yasb_exe = shutil.which("yasb.exe")
    if not yasb_exe:
        for pf in pf_dirs:
            candidate = os.path.join(pf, "YASB", "yasb.exe")
            if os.path.exists(candidate):
                yasb_exe = candidate
                break
    if not yasb_exe:
        yasb_exe = _first_existing([
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "YASB", "yasb.exe"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Links", "yasb.exe"),
        ])
    if yasb_exe:
        paths["Yasb-Exe-Path"] = yasb_exe

    yasb_config_home = os.environ.get("YASB_CONFIG_HOME", "")
    yasb_config = _first_existing([
        yasb_config_home,
        os.path.join(user_home, ".config", "yasb"),
        os.path.join(user_home, ".yasb"),
    ])
    if yasb_config:
        paths["Yasb-Config-Path"] = yasb_config
    elif yasb_exe:
        yasb_dir = os.path.dirname(yasb_exe)
        parent = os.path.dirname(yasb_dir)
        fallback = os.path.join(parent, ".config", "yasb") if parent else ""
        if fallback and os.path.isdir(fallback):
            paths["Yasb-Config-Path"] = fallback

    glaze_exe = shutil.which("glazewm.exe")
    if not glaze_exe:
        for pf in pf_dirs:
            candidate = os.path.join(pf, "GlazeWM", "glazewm.exe")
            if os.path.exists(candidate):
                glaze_exe = candidate
                break
    if not glaze_exe:
        glaze_exe = _first_existing([
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "GlazeWM", "glazewm.exe"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet", "Links", "glazewm.exe"),
        ])
    if glaze_exe:
        paths["GlazeWM-Exe-Path"] = glaze_exe

    glaze_config = _first_existing([
        os.path.join(user_home, ".glzr", "glazewm"),
        os.path.join(user_home, ".glazewm"),
    ])
    if os.path.isdir(glaze_config):
        paths["GlazeWM-Config-Path"] = glaze_config

    zebar_config = os.path.join(appdata, "zebar") if appdata else ""
    if zebar_config and os.path.isdir(zebar_config):
        paths["Zebar-Config-Path"] = zebar_config
    else:
        zebar_config2 = os.path.join(user_home, ".zebar")
        if os.path.isdir(zebar_config2):
            paths["Zebar-Config-Path"] = zebar_config2

    return paths


def load_json(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)


def get_profile_name(profile):
    return profile.get("name") or profile.get("Name") or ""


def apply_profile(folder_path, profile, user_settings):
    settings_path = os.path.join(folder_path, "userSettings.json")
    running_names = get_running_processes()

    active_profile_id = user_settings.get("activeProfile")
    if active_profile_id == profile["id"]:
        needs_apply = False

        for field, exe in [
            ("RainmeterLayoutName", "Rainmeter.exe"),
            ("GlazeWM-Config", "glazewm.exe"),
            ("Zebar-Config", "zebar.exe"),
        ]:
            has_it = field in profile and profile[field]
            running = exe.lower() in running_names
            if (has_it and not running) or (not has_it and running):
                needs_apply = True

        has_yasb_yaml = "Yasb-Yaml" in profile and profile["Yasb-Yaml"]
        has_yasb_css = "Yasb-CSS" in profile and profile["Yasb-CSS"]
        yasb_running = "yasb.exe" in running_names
        if (has_yasb_yaml and has_yasb_css and not yasb_running) or ((not has_yasb_yaml or not has_yasb_css) and yasb_running):
            needs_apply = True

        has_windhawk = "Windhawk-Mods" in profile and profile["Windhawk-Mods"]
        if has_windhawk:
            needs_apply = True

        if not needs_apply:
            return

    rainmeter_layout = profile.get("RainmeterLayoutName", "")
    if rainmeter_layout:
        rain_path = user_settings.get("rainmeter-Path", "")
        if rain_path:
            rainmeter(rain_path, rainmeter_layout, running_names)
        else:
            print("WARNING: Rainmeter path not configured in settings")
    elif "Rainmeter.exe" in running_names:
        kill_process("Rainmeter.exe", running_names)

    wallpaper_path = profile.get("Wallpaper-Path", "")
    if wallpaper_path:
        set_wallpaper_all_desktops(wallpaper_path)

    yasb_yaml = profile.get("Yasb-Yaml", "")
    yasb_css = profile.get("Yasb-CSS", "")
    if yasb_yaml and yasb_css:
        yasb_config_path = user_settings.get("Yasb-Config-Path", "")
        yasb_exe_path = user_settings.get("Yasb-Exe-Path", "")
        if yasb_config_path and yasb_exe_path:
            yasb_code_inject(yasb_yaml, yasb_css, yasb_config_path, yasb_exe_path, running_names)
        else:
            print("WARNING: YASB paths not configured in settings")
    elif "yasb.exe" in running_names:
        kill_process("yasb.exe", running_names)

    glaze_wm_config = profile.get("GlazeWM-Config", "")
    if glaze_wm_config:
        glaze_path = user_settings.get("GlazeWM-Config-Path", "")
        glaze_exe = user_settings.get("GlazeWM-Exe-Path", "")
        if glaze_path:
            glaze_wm_apply(glaze_wm_config, glaze_path, glaze_exe, running_names)
        else:
            print("WARNING: GlazeWM config path not configured in settings")
    elif "glazewm.exe" in running_names:
        kill_process("glazewm.exe", running_names)

    zebar_config = profile.get("Zebar-Config", "")
    if zebar_config:
        zebar_path = user_settings.get("Zebar-Config-Path", "")
        if zebar_path:
            zebar_apply(zebar_config, zebar_path, running_names)
        else:
            print("WARNING: Zebar config path not configured in settings")
    elif "zebar.exe" in running_names:
        kill_process("zebar.exe", running_names)

    apply_windhawk_profile(profile, user_settings, folder_path)

    user_settings["activeProfile"] = profile["id"]
    with open(settings_path, 'w') as f:
        json.dump(user_settings, f, indent=2)


if __name__ == "__main__":
    try:
        folder_path = sys.argv[1]
        target_arg = sys.argv[2]

        if target_arg == "scan":
            settings_path = os.path.join(folder_path, "userSettings.json")
            scan_settings = None
            try:
                with open(settings_path) as f:
                    scan_settings = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                pass
            scan_windhawk_registry(folder_path, scan_settings)
            scan_rainmeter_layouts(folder_path)
            if scan_settings:
                scan_yasb_configs(folder_path, scan_settings)
                scan_glazewm_configs(folder_path, scan_settings)
                scan_zebar_configs(folder_path, scan_settings)
            sys.exit(0)

        if target_arg == "autodetect":
            result = autodetect_paths()
            print(json.dumps(result))
            sys.exit(0)

        if target_arg == "stop-all":
            stopped = []
            names = get_running_processes()
            for exe in ["Rainmeter.exe", "yasb.exe", "glazewm.exe", "zebar.exe"]:
                if exe.lower() in names:
                    kill_process(exe, names)
                    stopped.append(exe)

            settings_path = os.path.join(folder_path, "userSettings.json")
            wh_type = "Installed"
            wh_path = ""
            try:
                with open(settings_path) as f:
                    s = json.load(f)
                wh_type = s.get("Windhawk-Type", "Installed")
                wh_path = s.get("Windhawk-Path", "")
            except (FileNotFoundError, json.JSONDecodeError):
                pass

            manifest_path = os.path.join(folder_path, "windhawkManifest.json")
            try:
                with open(manifest_path) as f:
                    manifest = json.load(f)
                installed_mods = manifest.get("installedMods", [])
                if installed_mods:
                    if wh_type == "Installed":
                        mods = [{"id": m["id"], "enabled": 0, "settings": {}} for m in installed_mods]
                        _apply_windhawk_hklm(mods)
                        stopped.append("Windhawk-mods")
                    elif wh_path and os.path.exists(wh_path):
                        kill_process("windhawk.exe", names)
                        stopped.append("Windhawk")
            except (FileNotFoundError, json.JSONDecodeError, KeyError):
                pass

            if stopped:
                print(f"Stopped: {', '.join(stopped)}")
            else:
                print("Nothing to stop")
            sys.exit(0)

        if target_arg == "list":
            profiles_path = os.path.join(folder_path, "userProfiles.json")
            try:
                user_profiles = load_json(profiles_path)
                listings = [{"id": p["id"], "name": get_profile_name(p)}
                            for p in user_profiles.get("profiles", [])]
                print(json.dumps(listings))
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"ERROR: {e}")
                sys.exit(1)
            sys.exit(0)

        if target_arg == "current":
            settings_path = os.path.join(folder_path, "userSettings.json")
            profiles_path = os.path.join(folder_path, "userProfiles.json")
            try:
                user_settings = load_json(settings_path)
                active_id = user_settings.get("activeProfile")
                if active_id is None:
                    print("null")
                else:
                    user_profiles = load_json(profiles_path)
                    profile = None
                    for p in user_profiles.get("profiles", []):
                        if p["id"] == active_id:
                            profile = {"id": p["id"], "name": get_profile_name(p)}
                            break
                    print(json.dumps(profile) if profile else "null")
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"ERROR: {e}")
                sys.exit(1)
            sys.exit(0)

        if target_arg == "apply-by-name":
            if len(sys.argv) < 4:
                print("ERROR: Missing profile name argument. Expected: appDataDir apply-by-name \"Profile Name\"")
                sys.exit(1)
            profile_name = sys.argv[3]
            profiles_path = os.path.join(folder_path, "userProfiles.json")
            settings_path = os.path.join(folder_path, "userSettings.json")
            try:
                user_profiles = load_json(profiles_path)
                user_settings = load_json(settings_path)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"ERROR: {e}")
                sys.exit(1)
            profile = None
            for p in user_profiles.get("profiles", []):
                if get_profile_name(p) == profile_name:
                    profile = p
                    break
            if profile is None:
                print(f"ERROR: Profile with name \"{profile_name}\" not found")
                sys.exit(1)
            apply_profile(folder_path, profile, user_settings)
            sys.exit(0)

        target_profile_id = int(target_arg)

        profiles_path = os.path.join(folder_path, "userProfiles.json")
        settings_path = os.path.join(folder_path, "userSettings.json")

        user_profiles = load_json(profiles_path)
        user_settings = load_json(settings_path)

        profile = None
        for p in user_profiles["profiles"]:
            if p["id"] == target_profile_id:
                profile = p
                break

        if profile is None:
            print(f"ERROR: Profile with id {target_profile_id} not found")
            sys.exit(1)

        apply_profile(folder_path, profile, user_settings)

    except IndexError:
        print("ERROR: Missing arguments. Expected: appDataDir profileId")
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"ERROR: File not found — {e}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON — {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
import os
import sys
import json
import subprocess
import ctypes
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


def is_process_running(exe_name: str) -> bool:
    target_lower = exe_name.lower()
    for process in psutil.process_iter(['name']):
        try:
            if process.info['name'] and process.info['name'].lower() == target_lower:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return False


def kill_process(exe_name: str):
    target_lower = exe_name.lower()

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
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    if found:
        time.sleep(0.3)


def set_wallpaper_all_desktops(image_path):
    from pyvda import get_virtual_desktops
    for d in get_virtual_desktops():
        d.set_wallpaper(image_path)


def rainmeter(path, layout):
    if not is_process_running("Rainmeter.exe"):
        subprocess.Popen([path], creationflags=_NO_WINDOW)

    time.sleep(1)
    subprocess.run([path, "!LoadLayout", layout], creationflags=_NO_WINDOW)


def yasb_code_inject(yaml_content, css, yasb_config_path, yasb_exe_path):
    if not is_process_running("yasb.exe"):
        subprocess.Popen([yasb_exe_path], creationflags=_NO_WINDOW)

    css_file = os.path.join(yasb_config_path, "styles.css")
    yaml_file = os.path.join(yasb_config_path, "config.yaml")
    formatted_yaml = yaml.safe_load(yaml_content)
    with open(yaml_file, 'w') as f:
        yaml.dump(formatted_yaml, f)
    with open(css_file, 'w') as f:
        f.write(css.strip())


def glaze_wm_apply(config_yaml, config_path):
    config_file = os.path.join(config_path, "config.yaml")
    with open(config_file, 'w') as f:
        f.write(config_yaml.strip())

    if is_process_running("glazewm.exe"):
        subprocess.run(["glazewm.exe", "exit"], creationflags=_NO_WINDOW)
        time.sleep(0.5)
    subprocess.Popen(["glazewm.exe"], creationflags=_NO_WINDOW)


def zebar_apply(config_json, config_path):
    config_file = os.path.join(config_path, "settings.json")
    formatted = json.loads(config_json)
    with open(config_file, 'w') as f:
        json.dump(formatted, f, indent=2)

    kill_process("zebar.exe")
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


def scan_windhawk_registry(folder_path, user_settings=None):
    manifest_path = os.path.join(folder_path, "windhawkManifest.json")
    mods = []
    seen_ids = set()

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
                            mods.append(entry)
                        i += 1
                    except OSError:
                        break
            finally:
                winreg.CloseKey(key)
            if mods:
                break
        if mods:
            break

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


def _apply_windhawk_hklm(mods):
    import tempfile as _tempfile
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
    td = _tempfile.gettempdir()
    reg_file = os.path.join(td, 'kalam_windhawk.reg')
    bat_file = os.path.join(td, 'Kalam_Update_Windhawk_Settings.bat')
    try:
        with open(reg_file, 'w', encoding='utf-16le') as f:
            f.write('\ufeff' + reg_content)
        with open(bat_file, 'w') as f:
            f.write(f'@reg import "{reg_file}" >nul 2>&1\n')
            f.write('@sc query WindhawkEngine | find "RUNNING" >nul 2>&1\n')
            f.write('@if not errorlevel 1 (\n')
            f.write('    net stop WindhawkEngine >nul 2>&1\n')
            f.write('    net start WindhawkEngine >nul 2>&1\n')
            f.write(')\n')
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


def autodetect_paths():
    paths = {}

    rainmeter_checks = [
        r"C:\Program Files\Rainmeter\Rainmeter.exe",
        r"C:\Program Files (x86)\Rainmeter\Rainmeter.exe",
    ]
    for p in rainmeter_checks:
        if os.path.exists(p):
            paths["rainmeter-Path"] = p
            break

    windhawk_checks = [
        r"C:\Program Files\Windhawk\Windhawk.exe",
        r"C:\Program Files (x86)\Windhawk\Windhawk.exe",
    ]
    for p in windhawk_checks:
        if os.path.exists(p):
            paths["Windhawk-Path"] = p
            break

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
    yasb_config = os.path.join(user_home, ".yasb")
    if os.path.isdir(yasb_config):
        paths["Yasb-Config-Path"] = yasb_config

    glaze_config = os.path.join(user_home, ".glazewm")
    if os.path.isdir(glaze_config):
        paths["GlazeWM-Config-Path"] = glaze_config

    zebar_config = os.path.join(user_home, "AppData", "Roaming", "zebar")
    if os.path.isdir(zebar_config):
        paths["Zebar-Config-Path"] = zebar_config
    else:
        zebar_config2 = os.path.join(user_home, ".zebar")
        if os.path.isdir(zebar_config2):
            paths["Zebar-Config-Path"] = zebar_config2

    return paths


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
            sys.exit(0)

        if target_arg == "autodetect":
            result = autodetect_paths()
            print(json.dumps(result))
            sys.exit(0)

        target_profile_id = int(target_arg)

        profiles_path = os.path.join(folder_path, "userProfiles.json")
        settings_path = os.path.join(folder_path, "userSettings.json")

        with open(profiles_path, 'r') as f:
            user_profiles = json.load(f)
        with open(settings_path, 'r') as f:
            user_settings = json.load(f)

        profile = None
        for p in user_profiles["profiles"]:
            if p["id"] == target_profile_id:
                profile = p
                break

        if profile is None:
            print(f"ERROR: Profile with id {target_profile_id} not found")
            sys.exit(1)

        running_names = get_running_processes()

        active_profile_id = user_settings.get("activeProfile")
        if active_profile_id == target_profile_id:
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
                sys.exit(0)

        rainmeter_layout = profile.get("RainmeterLayoutName", "")
        if rainmeter_layout:
            rain_path = user_settings.get("rainmeter-Path", "")
            if rain_path:
                rainmeter(rain_path, rainmeter_layout)
            else:
                print("WARNING: Rainmeter path not configured in settings")
        elif "Rainmeter.exe" in running_names:
            kill_process("Rainmeter.exe")

        wallpaper_path = profile.get("Wallpaper-Path", "")
        if wallpaper_path:
            set_wallpaper_all_desktops(wallpaper_path)

        yasb_yaml = profile.get("Yasb-Yaml", "")
        yasb_css = profile.get("Yasb-CSS", "")
        if yasb_yaml and yasb_css:
            yasb_config_path = user_settings.get("Yasb-Config-Path", "")
            yasb_exe_path = user_settings.get("Yasb-Exe-Path", "")
            if yasb_config_path and yasb_exe_path:
                yasb_code_inject(yasb_yaml, yasb_css, yasb_config_path, yasb_exe_path)
            else:
                print("WARNING: YASB paths not configured in settings")
        elif "yasb.exe" in running_names:
            kill_process("yasb.exe")

        glaze_wm_config = profile.get("GlazeWM-Config", "")
        if glaze_wm_config:
            glaze_path = user_settings.get("GlazeWM-Config-Path", "")
            if glaze_path:
                glaze_wm_apply(glaze_wm_config, glaze_path)
            else:
                print("WARNING: GlazeWM config path not configured in settings")
        elif "glazewm.exe" in running_names:
            kill_process("glazewm.exe")

        zebar_config = profile.get("Zebar-Config", "")
        if zebar_config:
            zebar_path = user_settings.get("Zebar-Config-Path", "")
            if zebar_path:
                zebar_apply(zebar_config, zebar_path)
            else:
                print("WARNING: Zebar config path not configured in settings")
        elif "zebar.exe" in running_names:
            kill_process("zebar.exe")

        apply_windhawk_profile(profile, user_settings, folder_path)

        user_settings["activeProfile"] = target_profile_id
        with open(settings_path, 'w') as f:
            json.dump(user_settings, f, indent=2)

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
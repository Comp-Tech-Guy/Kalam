import os
import sys
import json
import subprocess
import ctypes
import psutil
import time
import yaml

_NO_WINDOW = subprocess.CREATE_NO_WINDOW


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

    # Try graceful exit first for apps that support it
    if target_lower == "glazewm.exe":
        subprocess.run(["glazewm.exe", "exit"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                       creationflags=_NO_WINDOW)
        time.sleep(1)

    # Try psutil terminate/kill for any remaining instances
    for process in psutil.process_iter(['name', 'pid']):
        try:
            if process.info['name'] and process.info['name'].lower() == target_lower:
                process.terminate()
                try:
                    process.wait(timeout=2)
                except psutil.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=2)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    time.sleep(0.5)


def set_wallpaper_all_desktops(image_path):
    SPI_SETDESKWALLPAPER = 20
    SPIF_UPDATE_INI_FILE = 0x01
    SPIF_SENDCHANGE = 0x02
    ctypes.windll.user32.SystemParametersInfoW(
        SPI_SETDESKWALLPAPER, 0, image_path, SPIF_UPDATE_INI_FILE | SPIF_SENDCHANGE
    )


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


if __name__ == "__main__":
    try:
        folder_path = sys.argv[1]
        target_profile_id = int(sys.argv[2])

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

        active_profile_id = user_settings.get("activeProfile")
        if active_profile_id == target_profile_id:
            needs_apply = False

            for field, exe in [
                ("RainmeterLayoutName", "Rainmeter.exe"),
                ("GlazeWM-Config", "glazewm.exe"),
                ("Zebar-Config", "zebar.exe"),
            ]:
                has_it = field in profile and profile[field]
                running = is_process_running(exe)
                if (has_it and not running) or (not has_it and running):
                    needs_apply = True

            has_yasb_yaml = "Yasb-Yaml" in profile and profile["Yasb-Yaml"]
            has_yasb_css = "Yasb-CSS" in profile and profile["Yasb-CSS"]
            yasb_running = is_process_running("yasb.exe")
            if (has_yasb_yaml and has_yasb_css and not yasb_running) or ((not has_yasb_yaml or not has_yasb_css) and yasb_running):
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
        else:
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
        else:
            kill_process("yasb.exe")

        glaze_wm_config = profile.get("GlazeWM-Config", "")
        if glaze_wm_config:
            glaze_path = user_settings.get("GlazeWM-Config-Path", "")
            if glaze_path:
                glaze_wm_apply(glaze_wm_config, glaze_path)
            else:
                print("WARNING: GlazeWM config path not configured in settings")
        else:
            kill_process("glazewm.exe")

        zebar_config = profile.get("Zebar-Config", "")
        if zebar_config:
            zebar_path = user_settings.get("Zebar-Config-Path", "")
            if zebar_path:
                zebar_apply(zebar_config, zebar_path)
            else:
                print("WARNING: Zebar config path not configured in settings")
        else:
            kill_process("zebar.exe")

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
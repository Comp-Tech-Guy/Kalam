# Kalam

Profile-based desktop environment manager for Windows.

Bundles configurations for Rainmeter, YASB, GlazeWM, Zebar, Wallpaper, and Windhawk into profiles. Apply any profile with one click.

## Tech Stack
- **Frontend:** Tauri v2 + React 19 + Vite
- **System logic:** Python 3 sidecar (compiled to .exe)
- **Storage:** JSON files in `%APPDATA%/Kalam/`

## Getting Started
```powershell
cd app
npm install
npm run tauri dev
```

## Documentation
- [Developer Docs](../DEVELOPER.md) — architecture, schema, Windhawk details, build guide

## AutoHotKey Integration

You can switch profiles and stop-all from AutoHotKey scripts without opening the GUI. The Python sidecar (`kalam-Sidecar.exe`) is a standalone CLI that AHK calls via `RunWait`.

### Commands

| Command | Args | What it does |
|---------|------|-------------|
| `list` | `appDataDir list` | Prints JSON array `[{id, name}, ...]` to stdout |
| `current` | `appDataDir current` | Prints `{id, name}` of active profile or `null` |
| `apply-by-name` | `appDataDir apply-by-name "Profile Name"` | Looks up profile by name and applies it |
| `stop-all` | `appDataDir stop-all` | Stops all managed tools |

`appDataDir` is `%APPDATA%\Kalam`.

### Example AHK Script

```autohotkey
; kalam_switch.ahk — edit paths and profile names to match your setup
Sidecar := "C:\Program Files\Kalam\binaries\my-sidecar\kalam-Sidecar-x86_64-pc-windows-msvc.exe"
AppData := A_AppData . "\Kalam"

; Win+1 → Gaming profile
#1:: RunWait %Sidecar% %AppData% apply-by-name "Gaming"

; Win+2 → Work profile
#2:: RunWait %Sidecar% %AppData% apply-by-name "Work"

; Ctrl+Win+S → Stop all
^#s:: RunWait %Sidecar% %AppData% stop-all
```

# Kalam

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB)
![License](https://img.shields.io/badge/license-MIT-green)

**Profile-based desktop environment manager for Windows.**

Bundle configurations for Rainmeter, YASB, GlazeWM, Zebar, Wallpaper, and Windhawk into profiles. Apply any profile with one click.

## Why the name "Kalam"?

**Kalam** comes from the Tamil word **களம்**, which means **"field"** or **"space"**. 

Think of it like switching between different desktop environments in Linux. Kalam treats your monitor as a blank canvas—a dedicated digital *space*—giving you the freedom to seamlessly store, manage, and switch between completely different customized Windows setups in a single click.

---

## Features

| Tool | What Kalam Manages |
|------|-------------------|
| **Rainmeter** | Layout selection and activation |
| **YASB** | Config YAML + styles CSS injection |
| **GlazeWM** | Window manager config |
| **Zebar** | Status bar settings |
| **Wallpaper** | Desktop background (across virtual desktops) |
| **Windhawk** | Mod enable/disable + per-mod settings via registry |

- **One-click profile switching** — apply a full desktop layout instantly
- **Auto-detect paths** — finds installed tools automatically
- **Auto-update** — updates delivered via GitHub Releases
- **Import/Export** — share profiles as JSON files
- **AHK integration** — switch profiles from AutoHotKey scripts without opening the GUI

## Installation

Download the latest installer from [GitHub Releases](https://github.com/Comp-Tech-Guy/Kalam/releases):

1. Go to **Releases** and download the latest `.msi` or `.exe` (NSIS) installer
2. Run the installer
3. Kalam checks for updates automatically on startup

## Quick Start

1. **Open Kalam** — the onboarding wizard walks you through your first profile
2. **Create a profile** — enable the tools you want, configure each one
3. **Apply** — click Run on any profile to switch your entire desktop setup

Profiles are stored in `%APPDATA%/Kalam/` as JSON files.

## Supported Tools

| Tool | Config Path | What's Managed |
|------|------------|----------------|
| Rainmeter | `%APPDATA%/Rainmeter/Layouts/` | Layout files (subdirectories) |
| YASB | `~/.config/yasb/` or `~/.yasb/` | `config.yaml` + `styles.css` |
| GlazeWM | `~/.glzr/glazewm/` or `~/.glazewm/` | `config.yaml` |
| Zebar | `%APPDATA%/zebar` or `~/.zebar/` | `settings.json` |
| Windhawk | Registry (Installed) or portable path | Mod enabled state + settings |
| Wallpaper | Any image path | Desktop wallpaper across all virtual desktops |

## AutoHotKey Integration

Switch profiles and stop all tools from AutoHotKey scripts without opening the GUI. The Python sidecar (`kalam-core.exe`) is a standalone CLI that AHK calls via `RunWait`.

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
Sidecar := "C:\Program Files\Kalam\kalam-core.exe"
AppData := A_AppData . "\Kalam"

; Win+1 → Gaming profile
#1:: RunWait %Sidecar% %AppData% apply-by-name "Gaming"

; Win+2 → Work profile
#2:: RunWait %Sidecar% %AppData% apply-by-name "Work"

; Ctrl+Win+S → Stop all
^#s:: RunWait %Sidecar% %AppData% stop-all
```

## Documentation

- **[Website](https://comp-tech-guy.github.io/Kalam/)** — landing page and full documentation
- **[Internals](INTERNALS.md)** — architecture, sidecar logic, build guide, CI/CD

## Contributing

See [INTERNALS.md](INTERNALS.md) for project structure, build instructions, and development setup.

```powershell
cd app
npm install
npm run tauri dev
```

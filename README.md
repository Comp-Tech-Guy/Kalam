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

# Kalam — Developer Documentation

## Overview

Kalam is a desktop **profile manager** for Windows customization tools. Users create profiles that bundle configurations for Rainmeter, YASB, wallpapers, GlazeWM, and Zebar. A single click applies everything at once.

**Tech stack:**
- **Desktop shell:** Tauri v2 (Rust backend + WebView frontend)
- **Frontend:** React 19 + Vite + React Router 7
- **System logic:** Python 3 sidecar (compiled to standalone .exe via PyInstaller)
- **Storage:** JSON files in `%APPDATA%/Kalam/`

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Tauri App (WebView)                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  React Frontend                                         │ │
│  │                                                         │ │
│  │  main.jsx (entry)                                       │ │
│  │    └── <BrowserRouter>                                  │ │
│  │          └── <Routes>                                   │ │
│  │                └── <AppLayout> (shell)                  │ │
│  │                      ├── Titlebar (min/max/close)       │ │
│  │                      ├── Sidebar (nav links)            │ │
│  │                      ├── <Outlet /> (page content)      │ │
│  │                      │    ├── Dashboard (profile list)  │ │
│  │                      │    ├── CreateProfile (add/edit)  │ │
│  │                      │    └── Settings (global paths)   │ │
│  │                      └── <Onboarding /> (conditional)   │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  Services Layer                                  │   │ │
│  │  │  ┌───────────────────┐  ┌──────────────────┐     │   │ │
│  │  │  │  storage.js       │  │  sidecar.js       │     │   │ │
│  │  │  │  - CRUD + cache   │  │  - Command.sidecar│     │   │ │
│  │  │  │  - initializeFS   │  │  - autoDetectPaths│     │   │ │
│  │  │  └───────────────────┘  └────────┬─────────┘     │   │ │
│  │  └──────────────────────────────────┼───────────────┘   │ │
│  └─────────────────────────────────────┼───────────────────┘ │
└────────────────────────────────────────┼─────────────────────┘
                                         │ Tauri shell plugin
┌────────────────────────────────────────┼─────────────────────┐
│  Python Sidecar (kalam-Sidecar.exe)    │                     │
│                                        ▼                     │
│  1. Read userProfiles.json + userSettings.json               │
│  2. Apply or kill each app based on profile config:          │
│     • Rainmeter — load layout / kill                         │
│     • Wallpaper — set via pyvda (per-virtual-desktop)        │
│     • YASB — inject config.yaml + styles.css / kill          │
│     • GlazeWM — write config.yaml, restart / kill            │
│     • Zebar — write settings.json, restart / kill            │
│     • Windhawk — Registry injection (.reg file + elevation)  │
│  3. "stop-all": Kills all managed apps (Rainmeter, YASB,      │
│     GlazeWM, Zebar). Wallpaper unchanged. Windhawk skipped.  │
│  4. Write activeProfile to settings                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Frontend Deep Dive

### Entry Point — `app/src/main.jsx`

Mounts the React tree. Uses `BrowserRouter` with a flat route hierarchy:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="profile" element={<CreateProfile />} />
      <Route path="setting" element={<Settings />} />
    </Route>
  </Routes>
</BrowserRouter>
```

`AppLayout` is the persistent shell. Child routes swap in/out of `<Outlet />`.

### AppLayout — `app/src/layouts/AppLayout.jsx`

The main application shell. Responsibilities:

1. **Onboarding gating** — On mount, calls `initializeFS()` then `getData("userSettings.json")`. Uses a three-state pattern:
   - `showOnboarding === null` → loading state (renders empty `<main>`)
   - `showOnboarding === true` → renders `<Onboarding />` overlay z-index 1000
   - `showOnboarding === false` → renders normal titlebar + sidebar + `<Outlet />`
   
   This three-state pattern prevents the flash-of-dashboard bug: the sidebar and outlet never mount until the onboarding check completes.

2. **Titlebar** — Custom window chrome (since `decorations: false` in `tauri.conf.json`). Minimize, maximize/restore, and close buttons use `onClick` handlers calling `getCurrentWindow()` methods directly. The maximize button toggles its SVG icon based on `isMaximized` state, updated via `tauri://resize` event listener.

3. **Sidebar** — Three `NavLink` entries (Home, New Profile, Settings). Active state styled via CSS `.active` class.

### Dashboard — `app/src/pages/Dashboard/Dashboard.jsx`

Displays all saved profiles as a grid of `ProfileCard` components.

**Data loading pattern:**
- `dataRecieve` is a `useCallback` (stable reference) wrapping `getData("userProfiles.json")`
- `useEffect` calls it on mount
- `refresh()` forces a cache-busting re-fetch by passing `forceRefresh=true`
- The `refresh` callback is passed down to each `ProfileCard` as `onRecieve`

This pattern ensures the list updates after deletion (ProfileCard calls `onRecieve` after `removeData`).

### CreateProfile — `app/src/pages/CreateProfile/CreateProfile.jsx`

A form for creating or editing profiles. Dual-mode: add new vs. edit existing.

**Edit mode** is triggered by navigating with state: `navigate("/profile", { state: { profile: data } })`. The `useLocation` hook reads this state, pre-fills all fields and toggles.

**Windhawk mod integration:** On mount, calls `sidecar("scan")` which triggers the Python sidecar to read the Windows registry. The resulting `windhawkManifest.json` is read into `installedMods` state, rendered as toggleable cards with JSON settings editors.

### Settings — `app/src/pages/Settings/Settings.jsx`

Global paths for each managed tool. Features:
- **Auto-detect** — Calls `autoDetectPaths()` from sidecar, which spawns the Python process to scan common install locations. Results are merged into the form fields.
- **Manual input** — Each tool path is an editable text field.
- **Save** — Calls `editData("userSettings.json", data)` which merges new values over existing.
- **Reset onboarding** — Calls `setOnboardingComplete(false)`. Takes effect on next app launch.

### ProfileCard — `app/src/components/ProfileCard/ProfileCard.jsx`

Individual card in the dashboard grid. Three actions:
- **Run** — Calls `sidecar(profileId)` to apply the profile via Python
- **Edit** — Navigates to `/profile` with profile data in `location.state`
- **Remove** — Calls `removeData("userProfiles.json", id)` then `onRecieve()` to refresh the dashboard

---

## Services Layer

### `storage.js` — Data Persistence & Caching

All read/write to `%APPDATA%/Kalam/` JSON files via `@tauri-apps/plugin-fs`.

#### Caching System

An in-memory module-scoped object cache avoids redundant file reads:

```js
const cache = {};
```

- **`getData(fileName, forceRefresh=false)`**: Returns `cache[fileName]` if present and `forceRefresh` is false. Otherwise reads the file from disk, stores it in `cache`, and returns.
- **`bustCache(fileName)`**: `delete cache[fileName]` — called after every write operation.
- **`clearCache()`**: Nukes the entire cache.

The cache is session-scoped — it lives only as long as the WebView. On app restart, it starts empty.

**Important:** All `update()` calls within `addData`, `removeData`, and `editData` must be `await`ed before `bustCache()` runs. Otherwise the file write is still in-flight when the cache entry is deleted, and a subsequent `getData()` will read the stale file. See [Bug History](#bug-history).

#### `initializeFS()`

Called once on every `AppLayout` mount. Idempotent. Seeds `%APPDATA%/Kalam/` directory and default files:
- `userSettings.json` — merges `{ ...defaults, ...existing }` so existing keys are preserved
- `userProfiles.json` — creates with empty `profiles: []` if missing

#### CRUD Functions

| Function | File | Behavior |
|----------|------|----------|
| `addData(fileName, data)` | userProfiles.json | Appends to `profiles` array |
| `removeData(fileName, id)` | userProfiles.json | Filters out by `id` |
| `removeData(fileName, key)` | any other | Sets key to `""` |
| `editData(fileName, data)` | userProfiles.json | Maps/replaces matching `id` |
| `editData(fileName, data)` | any other | Merges spread over existing |
| `setOnboardingComplete(bool)` | userSettings.json | Force-writes `onboardingComplete` |

All functions follow: read → mutate → `await update()` → `bustCache()`.

### `sidecar.js` — Python Bridge

Uses `@tauri-apps/plugin-shell` `Command.sidecar()` to spawn the compiled Python `.exe`.

```js
const command = Command.sidecar('binaries/my-sidecar/kalam-Sidecar', [folder, profileId]);
const output = await command.execute();
```

Exports three functions:
- **default `SideCar(profileId)`** — Applies a profile by ID (or `"scan"` for Windhawk registry scan)
- **`autoDetectPaths()`** — Discovers installed tool paths on the system
- **`stopAll()`** — Kills all managed apps (Rainmeter, YASB, GlazeWM, Zebar), wallpaper untouched

The sidecar binary path is configured in `tauri.conf.json` via `externalBin` and allowed in `capabilities/default.json` via `shell:allow-execute`.

---

## Sidecar — Python Backend

File: `sidecar/kalam-Sidecar-x86_64-pc-windows-msvc.py` (~465 lines, all logic in one file).

### Entry Point

Receives two CLI args: `[appDataPath] [profileId]`. Reads `userSettings.json` for global paths, `userProfiles.json` for the requested profile, then runs each tool's apply function based on which fields are non-empty in the profile.

Special commands (instead of profileId): `"scan"` (Windhawk registry scan), `"autodetect"` (auto-detect tool paths), `"stop-all"` (kill all managed apps without changing wallpaper).

### Tool Apply Functions

| Function | Tool | Mechanism |
|----------|------|-----------|
| `rainmeter(path, layout)` | Rainmeter | Starts process if not running, sends `!LoadLayout` command |
| `yasb_code_inject(...)` | YASB | Writes config.yaml + styles.css, starts process |
| `glaze_wm_apply(config, path)` | GlazeWM | Writes config.yaml, exits and restarts process |
| `zebar_apply(config, path)` | Zebar | Writes settings.json, kills and restarts process |
| `set_wallpaper_all_desktops(path)` | Wallpaper | pyvda: iterates `get_virtual_desktops()`, calls `d.set_wallpaper()` per desktop |
| `stop-all` (CLI command) | All | `get_running_processes()` → cached set → `kill_process` for each managed exe |
| `apply_windhawk_profile(...)` | Windhawk | Generates .reg file, elevates via .bat |

### Windhawk Registry Integration

Windhawk stores mod state in `HKLM\SOFTWARE\Windhawk\Engine\Mods\{ModID}`. The sidecar:
1. **Scan:** Reads registry subkeys → writes `windhawkManifest.json`
2. **Apply:** Generates a `.reg` file with `Disabled`, `Settings`, `SettingsChangeTime` → wraps in `.bat` → elevates via `ShellExecuteExW(runas)` → 1 UAC prompt

Supports both Installed (HKLM registry) and Portable (file-based, limited) modes.

### Process Management (Optimized)

Uses `psutil` for process discovery and lifecycle:
- `get_running_processes()` — single pass, returns `set[str]` of lowercase exe names (call once, cache the result)
- `is_process_running(exe_name)` — iterates `psutil.process_iter` (use cached set instead when possible)
- `kill_process(exe_name)` — graceful exit, terminate, kill fallback; only sleeps if it found a process to kill

**Performance rule:** Never call `psutil.process_iter` more than once per sidecar invocation. The main apply flow calls `get_running_processes()` once at the top and uses O(1) set lookups for all running-checks. Tools not mentioned in the profile skip all process iteration entirely.

---

## Data Flow Walkthrough

### Apply Profile Flow

```
User clicks "Run" on ProfileCard
  → ProfileCard.onStart(id)
    → sidecar(profileId)
      → Command.sidecar('kalam-Sidecar', [appDataPath, profileId])
        → Python reads userProfiles.json, userSettings.json
        → For each non-empty config field in profile:
            → Call tool-specific apply function
        → Write activeProfile to userSettings.json
      → Return stdout to frontend
    → setStarted("Done!")

### Stop All Flow

```
User clicks "Stop All" on Dashboard
  → Dashboard.handleStopAll()
    → stopAll()
      → Command.sidecar('kalam-Sidecar', [appDataPath, 'stop-all'])
        → Python: get running processes
        → Kill Rainmeter.exe, yasb.exe, glazewm.exe, zebar.exe (if running)
        → Read windhawkManifest.json → disable all mods via HKLM registry
          (elevated .bat, same mechanism as apply)
        → Wallpaper unchanged
      → Return stdout to frontend
    → Button returns to idle state
```
```

### Add Profile Flow

```
User fills form on CreateProfile, clicks "Add Profile"
  → storeData()
    → addData("userProfiles.json", data)
      → getData(forceRefresh=true) — reads current file
      → Mutate: append new profile to profiles[]
      → await update() — write to disk
      → bustCache() — delete cache entry
    → setAdded(true), reset form
```

### Delete Profile Flow

```
User clicks "Remove" on ProfileCard
  → ProfileCard.onRemove(id)
    → removeData("userProfiles.json", id)
      → getData(forceRefresh=true)
      → Filter out profile by id
      → await update() — write to disk
      → bustCache()
    → onRecieve() — calls refresh() on Dashboard
      → getData(forceRefresh=true) — reads fresh file, re-caches
      → setData(json) — triggers re-render
```

### Navigation & Remounting

React Router's `<Outlet />` swaps child components on route change. Since Dashboard, CreateProfile, and Settings are different components, navigating between them triggers full unmount/remount. Each page's `useEffect` re-runs on mount, fetching fresh data (with cache semantics).

---

## Onboarding System

### Overview

A 5-step first-run wizard shown as a full-screen overlay on top of the normal app layout. Tracked via `onboardingComplete` (bool) in `userSettings.json`.

### Files

| File | Role |
|------|------|
| `app/src/pages/Onboarding/Onboarding.jsx` | Wizard component — all 5 steps + navigation logic |
| `app/src/pages/Onboarding/Onboarding.css` | Glassmorphism overlay styles, step indicator, animations |
| `app/src/services/storage.js` | `setOnboardingComplete(bool)` — writes flag to `userSettings.json` |
| `app/src/layouts/AppLayout.jsx` | Reads flag on mount, conditionally renders `<Onboarding />` |
| `app/src/pages/Settings/Settings.jsx` | "Show Onboarding Again" button (resets flag to `false`) |

### Flow

```
AppLayout mounts
  └─ initializeFS()          ← seeds onboardingComplete: false if key missing
  └─ getData(userSettings)
       ├─ onboardingComplete === false  →  render <Onboarding onDone={...} />
       └─ onboardingComplete === true   →  render normal sidebar + <Outlet />

Onboarding completion / skip:
  └─ setOnboardingComplete(true)
  └─ onDone() called  →  overlay unmounts
  └─ navigate("/") or navigate("/profile")
```

### Steps

| # | Title | Content |
|---|-------|---------|
| 1 | Welcome | Kalam logo, app description, "Get Started →" |
| 2 | Tools You Can Manage | Cards: Rainmeter, YASB, GlazeWM, Zebar, Windhawk, Wallpaper |
| 3 | Need Help? | Documentation link, Discord link |
| 4 | Your Workspace | Tour cards for Home / New Profile / Settings |
| 5 | Ready to Get Started? | "Create My First Profile" → `/profile` \| "Go to Dashboard" → `/` |

### Key Details

- The overlay is `position: fixed; inset: 0; z-index: 1000` — covers the entire window.
- Animated background grid (CSS `@keyframes gridPan`) gives depth.
- Step indicator uses an expanding pill dot for the active step.
- Each step uses `@keyframes stepIn` (fade + slide from right) for transitions.
- Step 5 has its own CTA buttons instead of the standard footer nav.
- "Skip setup" is always visible on steps 1–4 (bottom-left of footer).

### Re-triggering

Users can reset via **Settings → "Show Onboarding Again"**. The wizard will appear on the next app launch (next mount of `AppLayout`). This calls `setOnboardingComplete(false)` which force-writes the flag — it does NOT navigate to onboarding immediately, only on next mount.

---

## Windhawk Integration

See `sidecar/kalam-Sidecar-x86_64-pc-windows-msvc.py` for full implementation.

### Installed Mode (HKLM Registry)

- `scan_windhawk_registry()`: Reads `HKLM\SOFTWARE\Windhawk\Engine\Mods` → writes `windhawkManifest.json`
- `apply_windhawk_profile()`: Generates `.reg` file → wraps in `.bat` → `reg import` → `sc query` check → conditional `net stop/start` (only if service is RUNNING) → elevates via `ShellExecuteExW(runas)`
- **Optimization:** The batch skips the slow `net stop/start` (~3-4s) when the service isn't running, and suppresses all stdout/stderr to avoid false exit code errors

### Registry Layout

```
HKLM\SOFTWARE\Windhawk\Engine\Mods\{ModID}/
  ├── Disabled          REG_DWORD   (1=disabled, 0=enabled)
  ├── SettingsChangeTime REG_QWORD   (timestamp → triggers reload)
  └── Settings/          KEY
      └── setting_name = REG_SZ/DWORD value
```

### Key Details

- `Disabled` DWORD is INVERTED from `enabled` field in profile (1=disabled, 0=enabled)
- `.reg` files require UTF-16 LE with BOM
- `SettingsChangeTime` must be QWORD type
- Windhawk service name is `WindhawkEngine`
- `_run_elevated` detects if already admin (`IsUserAnAdmin`) to skip UAC

---

## Configuration

### `tauri.conf.json`

Key settings:
- `decorations: false` — Custom titlebar
- `externalBin` — Points to `binaries/my-sidecar/kalam-Sidecar` for the sidecar

### `capabilities/default.json`

Required permissions:
- `core:window:allow-*` — Window controls (minimize, maximize, close, start-dragging)
- `shell:allow-execute` — Sidecar execution with arg validator `.+`
- `fs:*` — Filesystem access to `$APPDATA` for JSON storage
- `dialog:default` — File picker for wallpaper selection

---

## Build & Deploy

### Frontend

```powershell
cd app
npm install
npm run tauri dev    # Development
npm run tauri build  # Production
```

### Sidecar

```powershell
cd sidecar
python -m PyInstaller kalam-Sidecar-x86_64-pc-windows-msvc.spec --noconfirm
Copy-Item dist/kalam-Sidecar-x86_64-pc-windows-msvc.exe app/src-tauri/binaries/my-sidecar/ -Force
Copy-Item dist/kalam-Sidecar-x86_64-pc-windows-msvc.exe app/src-tauri/target/debug/kalam-Sidecar.exe -Force
```

---

## Bug History

### Onboarding Flash (Fixed)

**Symptoms:** On first launch, the dashboard briefly appears before the onboarding overlay shows.

**Root cause:** `showOnboarding` was initialized to `false`. React rendered the full layout (sidebar + `<Outlet />` rendering `<Dashboard />`) immediately. The async `useEffect` then waited for `initializeFS()` + `getData()` to complete before setting `showOnboarding = true`. The dashboard was mounted and visible during this gap.

**Fix:** Changed initial state from `false` to `null`. Added early return: when `null`, render an empty container. Once the async check resolves, set either `true` (show onboarding) or `false` (show normal layout). The sidebar/outlet never mount until the state is known.

### Window Controls Broken (Fixed)

**Symptoms:** Minimize, maximize, close buttons stopped working.

**Root cause:** The old code used `useRef` + `useEffect` with `[]` deps to manually add `click` event listeners. The early return for onboarding (see above) meant the titlebar buttons weren't in the DOM on first render — refs were null, so the effect exited without attaching listeners. The empty dep array meant it never re-ran.

**Fix:** Replaced ref-based event listeners with inline `onClick` handlers on each button (`onClick={onMinimize}`, etc.). React binds events automatically when elements mount, regardless of conditional rendering.

### Dashboard Stale After Add/Remove (Fixed)

**Symptoms:** Dashboard showed outdated profile list after adding or removing profiles until manual refresh.

**Root cause:** `update()` (writes JSON file to disk) was called without `await` in `addData`, `removeData`, and `editData`. The subsequent `bustCache()` ran before the file write completed. When Dashboard's `getData("userProfiles.json")` read the file, it got stale data, re-cached it, and returned it.

**Fix:** Added `await` to all 6 `update()` calls across all three CRUD functions, ensuring the file write completes before the cache entry is deleted.

### Caching Race Condition (Education)

The in-memory cache (`const cache = {}`) is session-scoped. The async flow is:
1. Read file → `cache[file] = data` → return data
2. Mutate data → `await writeFile()` → `delete cache[file]`
3. Next read → cache miss → read file → `cache[file] = freshData`

Step 2's `await` is critical. Without it, step 3 reads the old file and re-caches stale data. This race condition affected all three write operations.

### Wallpaper Only Applied to Current Desktop (Fixed)

**Symptoms:** Wallpaper only appeared on the current virtual desktop. Switching desktops showed the old wallpaper.

**Root cause:** Used Win32 `SystemParametersInfoW(SPI_SETDESKWALLPAPER)` which only affects the current desktop. Windows stores per-desktop wallpaper in registry at `...\VirtualDesktops\Desktops\{GUID}\Wallpaper`. Each desktop is independent.

**Fix:** Replaced with `pyvda.get_virtual_desktops()` + per-desktop `d.set_wallpaper()`. Removed the SPU call that clobbered per-desktop registry state.

### Profile Apply Too Slow (Optimized)

**Symptoms:** Applying a wallpaper + Windhawk-only profile took 8-10 seconds.

**Root causes & fixes:**
1. **4 redundant process iterations** — `kill_process` called for Rainmeter, YASB, GlazeWM, Zebar even when not in profile, each calling `psutil.process_iter` independently. **Fix:** Single `get_running_processes()` call caches all process names in a set for O(1) lookups. Tools not in the profile skip process iteration entirely.
2. **Unconditional Windhawk service restart** — `net stop/start` ran every time (~3-4s). **Fix:** Batch checks `sc query WindhawkEngine | find "RUNNING"` first; only restarts if the service is currently running.
3. **Unconditional sleep in kill_process** — `time.sleep(0.5)` ran even when nothing was killed. **Fix:** Sleep only when `found == True`, reduced to 0.3s.
4. **GlazeWM 1s sleep** — Reduced to 0.5s.

### Windhawk "Exit code 2" Error (Fixed)

**Symptoms:** ProfileCard displayed "Elevated script failed with exit code 2".

**Root cause:** `net stop WindhawkEngine` / `net start WindhawkEngine` returns exit code 2 when service is already stopped/started. The `.bat` propagated this exit code to `_run_elevated`, which treated non-zero as failure.

**Fix:** Added `>nul 2>&1` to suppress net.exe stderr/stdout. Forced `@exit /b 0` at end of batch so exit code is always 0 regardless of net.exe behavior.

### PyInstaller "Failed to load Python DLL" (Fixed)

**Symptoms:** Sidecar crashed immediately when launched by Tauri.

**Root cause:** The spec used onedir mode (COLLECT) which outputs as a folder `_internal/`. Tauri's sidecar expects a single `.exe` file; the folder wasn't resolved.

**Fix:** Switched to onefile mode (EXE without COLLECT). Added pyvda submodules to `hiddenimports`. Sidecar binary is now copied to both `binaries/my-sidecar/` (Tauri resolution) and `target/debug/` (dev builds).

---

## Roadmap

- [x] **Onboarding Wizard** — 5-step first-run flow
- [x] **Windhawk Integration** — HKLM registry (Installed) + file-based (Portable, limited)
- [ ] **Komorebi Support**
- [ ] **Global Color Sync** (Accents across all tools)
- [ ] **Auto-Discovery of tool paths**

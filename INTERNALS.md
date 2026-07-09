# Kalam Internals

Technical reference for how Kalam works under the hood.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                     Tauri v2 Shell                        │
│               (Rust backend + WebView2)                   │
├───────────────────────┬───────────────────────────────────┤
│   React 19 Frontend   │       Python 3 Sidecar            │
│   (Vite + Router)     │       (kalam-core.exe)            │
│                       │                                   │
│  ┌───────────────┐    │   ┌──────────────────────────┐    │
│  │  Dashboard    │    │   │  Tool Apply Functions    │    │
│  │ CreateProfile │────│──>│  rainmeter()             │    │
│  │   Settings    │    │   │  yasb_code_inject()      │    │
│  └───────────────┘    │   │  glaze_wm_apply()        │    │
│                       │   │  zebar_apply()           │    │
│   Sidecar Service     │   │  apply_windhawk_profile()│    │
│   (shell plugin)      │   └──────────────────────────┘    │
├───────────────────────┴───────────────────────────────────┤
│                     Tool Configs                          │
│   Rainmeter · YASB · GlazeWM · Zebar · Windhawk · Wall.   │
└───────────────────────────────────────────────────────────┘
```

- **Tauri** provides the desktop shell, window management, and native API access (filesystem, dialogs, process control, updater)
- **React frontend** handles all UI — profile management, settings, onboarding
- **Python sidecar** (`kalam-core.exe`) is compiled via PyInstaller and invoked as a CLI for all system-level operations (tool process management, config file writing, Windhawk registry manipulation)
- Communication between frontend and sidecar is via `@tauri-apps/plugin-shell` `Command.sidecar()`

## Project Structure

| Purpose | Path |
|---------|------|
| React entry | `app/src/main.jsx` |
| App shell | `app/src/layouts/AppLayout.jsx` |
| App shell CSS | `app/src/layouts/AppLayout.css` |
| Dashboard | `app/src/pages/Dashboard/Dashboard.jsx` |
| Dashboard CSS | `app/src/pages/Dashboard/Dashboard.css` |
| CreateProfile | `app/src/pages/CreateProfile/CreateProfile.jsx` |
| Settings | `app/src/pages/Settings/Settings.jsx` |
| Shared form styles | `app/src/styles/forms.css` |
| Sidecar service | `app/src/services/sidecar.js` |
| Storage service | `app/src/services/storage.js` |
| Update checker hook | `app/src/services/useUpdateChecker.js` |
| Python sidecar source | `sidecar/kalam-core.py` |
| SelectMenu component | `app/src/components/SelectMenu/SelectMenu.jsx` |
| ResizableTextarea | `app/src/components/ResizableTextarea/ResizableTextarea.jsx` |
| ImportExportModal | `app/src/components/ImportExportModal/ImportExportModal.jsx` |
| UpdateBanner | `app/src/components/UpdateBanner/UpdateBanner.jsx` |
| ProfileCard | `app/src/components/ProfileCard/ProfileCard.jsx` |
| Tauri config | `app/src-tauri/tauri.conf.json` |
| Capabilities | `app/src-tauri/capabilities/default.json` |
| Rust lib | `app/src-tauri/src/lib.rs` |
| Cargo manifest | `app/src-tauri/Cargo.toml` |
| Vite config | `app/vite.config.js` |
| PyInstaller spec | `sidecar/kalam-core.spec` |

---

## Frontend

### Routing

All three page routes are lazy-loaded via `React.lazy()` in `main.jsx`, wrapped in `<Suspense>` with a `.loader` spinner fallback:

```jsx
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const CreateProfile = React.lazy(() => import("./pages/CreateProfile/CreateProfile"));
const Settings = React.lazy(() => import("./pages/Settings/Settings"));
```

`AppLayout` is the persistent shell. Child routes swap via `<Outlet />`.

### Layout System

```
┌─────────────────────────────────────┐
│  Titlebar (40px, sticky, z-index 10)│
├────────┬────────────────────────────┤
│ Nav    │  PageContainer (flex: 1)   │
│ 200px  │  ┌──────────────────────┐  │
│ (56px  │  │  <AppPg>             │  │
│ narrow)│  │  padding: 32px 40px  │  │
│        │  │  24px 20px @800px    │  │
│        │  │  16px 12px @500px    │  │
│        │  └──────────────────────┘  │
├────────┴────────────────────────────┤
│  height: calc(100vh - 40px)         │
└─────────────────────────────────────┘
```

- **Nav collapses** from `200px` to `56px` at `800px` window width — text labels hide via `max-width: 0; opacity: 0` (no layout reflow)
- **Anti-jitter rule:** No CSS transitions on layout properties (width, padding). Only visual-only properties (opacity, max-width) transition.
- **Content padding** steps down: `32px 40px` → `24px 20px` @800px → `16px 12px` @500px

### Vite Build Config

`rollupOptions.output.manualChunks` splits:
- **`vendor`** — `react` + `react-dom`
- **`router`** — `react-router-dom`

### CSS Architecture

Shared form/page styles live in `app/src/styles/forms.css` (imported by CreateProfile and Settings). `Dashboard.css` only contains Dashboard-specific styles (header, buttons). Six duplicate `@import "../../index.css"` lines were removed from component CSS files — Vite handles CSS injection automatically.

### Tauri Window Config

- Default size: `1000x800`
- Minimum size: `700x500`
- Decorations: `false` (custom titlebar)

---

## Components

### SelectMenu (`app/src/components/SelectMenu/`)

Custom dropdown replacing native `<select>`, used for the Rainmeter layout picker on CreateProfile.

| Behaviour | Detail |
|-----------|--------|
| Opening | `menuIn` animation: opacity 0→1, translateY -4px→0, 120ms ease-out |
| Closing | `menuOut` animation: opacity 1→0, translateY 0→-4px, 120ms ease-in, `forwards` fill |
| Dismiss | Click-outside closes with animation. Uses `exiting` state + 120ms `setTimeout` to keep element in DOM during exit. |
| API | `value`, `onChange`, `options` (string array), `placeholder` — matches native `<select>` interface |

### ResizableTextarea (`app/src/components/ResizableTextarea/`)

Custom resizable textarea replacing native `<textarea>` resize. The native Windows resize handle is an OS-drawn widget that cannot be fully styled with CSS — `::-webkit-resizer` only partially overrides it, leaving a white box at the bottom-right corner.

- Wraps `<textarea>` in a `<div>` container with `position: relative`
- Native resize disabled (`resize: none`), height controlled by the wrapper
- A small drag handle (chevron icon) at `bottom: 0; right: 0`
- `onMouseDown` on the handle adds `mousemove`/`mouseup` listeners to `document`
- Height set directly via `wrapperRef.current.style.height` — **no React state updates during drag** (zero re-renders)
- `useEffect` cleanup removes stray listeners on unmount

| Property | Detail |
|----------|--------|
| Min height | 80px (clamped in JS) |
| Handle visibility | `opacity: 0` → `0.6` on wrapper hover → `1` on handle hover |
| Cursor | `ns-resize` during active drag |
| Theme | `var(--text-muted)`, turns `var(--accent)` on hover |
| Performance | Direct DOM manipulation during drag, no React re-renders |

### ImportExportModal (`app/src/components/ImportExportModal/`)

Full-screen modal overlay with backdrop blur for importing/exporting profiles.

**Export flow:** Radio toggle (single/all) → Tauri `save` dialog → `writeTextFile`

**Import flow:** Tauri `open` dialog → read JSON → auto-detect single vs `{ profiles: [...] }` wrapper → merge into `userProfiles.json`

Requires `fs:allow-read-text-file` and broad fs scopes (`$DESKTOP/**`, `$DOWNLOAD/**`, `$DOCUMENT/**`, `$HOME/**`) in capabilities.

### UpdateBanner (`app/src/components/UpdateBanner/`)

Floating toast at bottom-right driven by `useUpdateChecker` hook.

| Status | Shows |
|--------|-------|
| `available` | Version + release notes, Download / Later buttons |
| `downloading` | Percentage + progress bar (on its own line via `flex-wrap: wrap`) |
| `downloaded` | Restart & Install / Later buttons |

**Dismiss:** Adds `update-banner--exit` class → slide right 30px + fade out 250ms → `transitionEnd` → `dismiss()` → remove from DOM. Only `transform` and `opacity` animated (GPU-composited, no layout jank).

### ProfileCard (`app/src/components/ProfileCard/`)

Displays profile name and active tool badges (emoji icons for each tool). Three action buttons: Run (calls sidecar), Edit (navigates to `/profile`), Remove.

### Form Layout

The CreateProfile and Settings forms use `app/src/styles/forms.css`:

- `.profileCont` / `.settingCont`: `grid-template-columns: 200px 1fr` with `align-items: start`
- `.form-group`: `display: grid; grid-template-columns: subgrid` — prevents textarea resize from affecting adjacent rows
- At `800px`: collapses to single-column flex layout

---

## Python Sidecar

The sidecar (`sidecar/kalam-core.py`, compiled to `kalam-core-x86_64-pc-windows-msvc.exe`) handles all system-level operations.

### CLI Reference

| Command | Args | Output | Description |
|---------|------|--------|-------------|
| `list` | — | JSON `[{id, name}]` | List all profiles |
| `current` | — | `{id, name}` or `null` | Currently active profile |
| `apply-by-name` | `"Profile Name"` | (none) | Look up and apply by name |
| `<numeric_id>` | — | (none) | Apply profile by numeric ID |
| `scan` | — | (writes manifest files) | Scan all tool configs |
| `autodetect` | — | JSON paths | Auto-detect tool install paths |
| `stop-all` | — | Status text | Stop all managed tools |

### Profile Application Flow

`apply_profile()` orchestrates the full sequence:

1. Fetch running processes once (cached as `running_names` set)
2. Apply each tool in order: Rainmeter → Wallpaper → YASB → GlazeWM → Zebar → Windhawk
3. For each tool: check if config exists → write config → start/restart process
4. If a tool is not in the profile but is running → kill it
5. Set `activeProfile` in settings

### Process Scan Optimization (`running_names`)

`apply_profile()`, `kill_process()`, `is_process_running()`, and all tool-apply functions accept an optional `running_names` parameter (set of lowercase exe names). When provided, they skip redundant `psutil.process_iter` scans and use the pre-computed set instead.

### Tool-Specific Logic

| Tool | Apply Function | What It Does |
|------|---------------|--------------|
| Rainmeter | `rainmeter()` | Starts exe if not running, loads layout via `!LoadLayout` |
| YASB | `yasb_code_inject()` | Writes `config.yaml` + `styles.css`, starts exe if needed |
| GlazeWM | `glaze_wm_apply()` | Writes `config.yaml`, kills with graceful `exit` command, restarts |
| Zebar | `zebar_apply()` | Writes `settings.json`, kills and restarts |
| Windhawk | `apply_windhawk_profile()` | Installed: writes `.reg` file, runs elevated via `ShellExecuteExU` with `runas`; Portable: kills and restarts |
| Wallpaper | `set_wallpaper_all_desktops()` | Uses `pyvda` to set wallpaper across virtual desktops |

### Windhawk Smart Restart

When applying profiles with `Windhawk-Mods`, the sidecar compares desired settings against current registry via `_windhawk_settings_changed()`. If nothing changed — re-applying the same profile or switching between profiles with identical Windhawk configs — the registry write, elevation, and service restart are skipped entirely.

Both `scan_windhawk_registry()` and `_get_current_windhawk_settings()` share `_enumerate_windhawk_registry()`, which reads from `HKLM` and `HKCU` under `SOFTWARE\Windhawk\Engine\Mods` and `SOFTWARE\Windhawk\Mods`, returning a deduplicated list.

### Auto-Detect Paths

`autodetect_paths()` resolves tool paths dynamically using environment-aware lookups:

| Helper | Purpose |
|--------|---------|
| `_first_existing(iterable)` | Returns first path that `os.path.exists()`, or `""` |
| `_program_files_dirs()` | Reads `%ProgramW6432%`, `%ProgramFiles%`, `%ProgramFiles(x86)%` — called once and reused |

**Detection order per tool:** `shutil.which()` → `_program_files_dirs()` + tool name → `%LOCALAPPDATA%\Programs\<Tool>` → `%LOCALAPPDATA%\Microsoft\WinGet\Links\<Tool>`

**Known config paths:**
- **YASB:** `YASB_CONFIG_HOME` env → `~/.config/yasb/` → `~/.yasb/`
- **GlazeWM:** `~/.glzr/glazewm/` → `~/.glzewm/`
- **Zebar:** `%APPDATA%/zebar` → `~/.zebar/`

### Sidecar Internal Refactors

- **`_enumerate_windhawk_registry()`** — shared helper, eliminates duplicate registry enumeration
- **`_parse_rainmeter_ini()`** — handles both UTF-16-LE and UTF-8 encodings of `Rainmeter.ini`
- **`_program_files_dirs()`** — called once per `autodetect_paths()` instead of per tool
- **`kill_process()`** — `break` after successful kill to avoid scanning remaining processes
- **`scan_zebar_configs()`** — removed redundant `json.loads()` validation

### Building the Sidecar

```powershell
cd sidecar
python -m PyInstaller kalam-core.spec --noconfirm
Copy-Item dist/kalam-core-x86_64-pc-windows-msvc.exe app/src-tauri/binaries/kalam-core/ -Force
Copy-Item dist/kalam-core-x86_64-pc-windows-msvc.exe app/src-tauri/target/debug/kalam-core.exe -Force
```

Rebuild whenever `sidecar/kalam-core.py` changes.

---

## Auto-Update System

Kalam uses Tauri v2's built-in updater (`tauri-plugin-updater`).

### Architecture

```
GitHub Releases latest.json  →  updater plugin  →  useUpdateChecker hook  →  UpdateBanner component
```

The `latest.json` is auto-generated by `tauri-apps/tauri-action@v0` during CI (via `includeUpdaterJson: true`).

### Signing Keys (One-Time Setup)

```powershell
npm run tauri signer generate -- -w $HOME\.tauri\kalam.key
```

Creates:
- `$HOME\.tauri\kalam.key` — **PRIVATE KEY**. Store in GitHub Secrets. Never commit.
- `$HOME\.tauri\kalam.key.pub` — **PUBLIC KEY**. Embedded in `tauri.conf.json` `plugins.updater.pubkey`.

### Building with Signing (Local)

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "C:\Users\You\.tauri\kalam.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password"
npm run tauri build -- --bundles msi
```

`.env` files do NOT work — you must use real environment variables.

### GitHub Secrets Needed

| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | **Base64-encoded** content of `kalam.key` (use `[Convert]::ToBase64String(...)`) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password chosen during key generation |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |

### Testing the Update UI Locally

1. Create a `latest.json` and serve it locally:
```powershell
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m http.server 8765" -WorkingDirectory "path\to\dir"
```
2. Temporarily change the endpoint in `tauri.conf.json` to `http://localhost:8765/latest.json`
3. Bump the version in `latest.json` above the local `tauri.conf.json` version
4. Run `npm run tauri dev` — the UpdateBanner should appear

HTTP is only allowed in dev mode. Release builds require HTTPS.

---

## CI/CD

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:** `workflow_dispatch` (manual version input) or push tag `v*`.

**Steps:**
1. Extract version from tag / manual input
2. Write version into `tauri.conf.json`
3. Decode base64 signing key to temp file
4. **Rust dependency cache** (`Swatinem/rust-cache@v2`) — cuts compile from ~20 min to ~2-3 min
5. **Single `tauri-action` step** — builds, creates draft GitHub Release, uploads MSI + `.sig`, generates `latest.json`

### Release Process

1. Update version in `app/src-tauri/tauri.conf.json` and `app/package.json`
2. Commit: `git commit -m "v0.2.0"`
3. Tag and push: `git tag v0.2.0 && git push origin v0.2.0`
4. GitHub Actions handles the rest
5. **Manually publish** the draft on GitHub Releases page

### CI Signing Fix

**Problem:** GitHub YAML strips newlines when expanding `${{ secrets.X }}` in `env:` blocks, breaking PEM keys.

**Fix:** Store the key as base64 in the secret, decode to a temp file in a workflow step, and set `TAURI_SIGNING_PRIVATE_KEY` to that file path:

```yaml
- name: Decode signing key
  shell: pwsh
  run: |
    $bytes = [Convert]::FromBase64String("${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}")
    $path = Join-Path $env:RUNNER_TEMP "kalam.key"
    [IO.File]::WriteAllBytes($path, $bytes)
    echo "TAURI_SIGNING_PRIVATE_KEY=$path" >> $env:GITHUB_ENV
```

### Common Pitfalls

- **No `.sig` files**: `TAURI_SIGNING_PRIVATE_KEY` not set during build, or `createUpdaterArtifacts` missing
- **Signature rejected**: Public key in config doesn't match the private key used to sign
- **Update not detected**: Endpoint must match `https://github.com/Comp-Tech-Guy/Kalam/releases/latest/download/latest.json`
- **Lost private key**: All existing installs permanently unable to receive updates
- **Private repo**: The endpoint URL is unauthenticated — make repo public or host `latest.json` elsewhere
- **Known Tauri bug**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` sometimes ignored — add `TAURI_PRIVATE_KEY` and `TAURI_KEY_PASSWORD` as fallbacks

---

## Build

### Rust Release Profile

The release profile in `app/src-tauri/Cargo.toml`:

```toml
[profile.release]
opt-level = "s"    # optimize for size
lto = true         # link-time optimization
codegen-units = 1  # single codegen unit for better optimization
strip = true       # strip debug symbols
panic = "abort"    # no unwinding
```

Additional cleanup:
- `tauri-plugin-opener` removed (unused) along with its capability and the template `greet` command from `lib.rs`
- Bundle targets restricted from `"all"` to `["nsis", "msi"]`

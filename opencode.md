# Kalam — Context for AI Assistants

## Overview

Profile-based desktop environment manager for Windows. Bundles configurations for Rainmeter, YASB, GlazeWM, Zebar, Wallpaper, and Windhawk into profiles. Apply any profile with one click.

- **Desktop shell:** Tauri v2 (Rust backend + WebView frontend)
- **Frontend:** React 19 + Vite + React Router 7
- **System logic:** Python 3 sidecar (compiled to standalone .exe via PyInstaller)
- **Storage:** JSON files in `%APPDATA%/Kalam/`

## Key Files

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
| Python sidecar source | `sidecar/kalam-core.py` |
| SelectMenu component | `app/src/components/SelectMenu/SelectMenu.jsx` |
| ResizableTextarea | `app/src/components/ResizableTextarea/ResizableTextarea.jsx` |
| ImportExportModal | `app/src/components/ImportExportModal/ImportExportModal.jsx` |
| ImportExportModal CSS | `app/src/components/ImportExportModal/ImportExportModal.css` |
| Tauri config | `app/src-tauri/tauri.conf.json` |
| Capabilities | `app/src-tauri/capabilities/default.json` |

## Frontend Structure

### Routes (`app/src/main.jsx`)

```jsx
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const CreateProfile = React.lazy(() => import("./pages/CreateProfile/CreateProfile"));
const Settings = React.lazy(() => import("./pages/Settings/Settings"));

<BrowserRouter>
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Suspense fallback={<div className="loader" />}><Dashboard /></Suspense>} />
      <Route path="profile" element={<Suspense fallback={<div className="loader" />}><CreateProfile /></Suspense>} />
      <Route path="setting" element={<Suspense fallback={<div className="loader" />}><Settings /></Suspense>} />
    </Route>
  </Routes>
</BrowserRouter>
```

All three page routes are lazy-loaded with `React.lazy` and wrapped in `<Suspense>` with a `.loader` spinner fallback. `AppLayout` is the persistent shell. Child routes swap via `<Outlet />`.

### AppLayout (`app/src/layouts/AppLayout.jsx`)

Three-state onboarding gating (`null` = loading, `true` = show onboarding, `false` = show app). Custom titlebar (min/max/close) since `decorations: false`. Sidebar with three NavLinks. Content area renders `<Outlet />`. Renders `<UpdateBanner />` at the bottom.

Onboarding is lazy-loaded with `React.lazy` and wrapped in `<Suspense fallback={<div className="loader" />}>` — only fetched when `showOnboarding` is true (first launch).

### Dashboard (`app/src/pages/Dashboard/Dashboard.jsx`)

Profile grid with `ProfileCard` components. Header has:
- **"Stop All"** button — calls `stopAll()` from sidecar, positioned `absolute; top: 0; right: 0`
- **"Export"** and **"Import"** buttons — open the `ImportExportModal`

### ImportExportModal (`app/src/components/ImportExportModal/`)

Modal overlay with backdrop blur for importing/exporting profiles. Supports:
- **Export**: Radio toggle between "Single Profile" (dropdown to pick one) or "All Profiles". Uses Tauri's `save` dialog for file path.
- **Import**: Uses Tauri's `open` dialog for file selection. Auto-detects single profile object vs `{ profiles: [...] }` wrapper.
- Backend storage functions in `storage.js`: `exportProfile()`, `exportAllProfiles()`, `importSingleProfile()`, `importAllProfiles()`.

## Layout & Responsive System

### Layout Structure

```
┌─────────────────────────────────────┐
│  Titlebar (40px, sticky, z-index 10)│
├────────┬────────────────────────────┤
│ Nav    │  PageContainer (flex: 1)   │
│ 200px  │  ┌──────────────────────┐  │
│ (56px  │  │  <AppPg>             │  │
│ narrow)│  │  padding: 32px 40px  │  │
│        │  │  ↓ responsive ↓      │  │
│        │  │  24px 20px @800px    │  │
│        │  │  16px 12px @500px    │  │
│        │  └──────────────────────┘  │
├────────┴────────────────────────────┤
│  height: calc(100vh - 40px)         │
└─────────────────────────────────────┘
```

### Nav Sidebar Breakpoint

At `800px` window width the nav collapses from `200px` to `56px`:
- **Wide (200px):** `padding: 16px 10px`, links have `padding: 0 10px`, icons at `20px` from nav left edge
- **Narrow (56px):** `padding: 16px 10px` (same left padding), links have `padding: 0 0 0 10px`, icons stay at `20px` from nav left edge
- **Icon position never changes** between modes — stays at `20px` from left edge of nav
- Text labels (`<span>`) hide via `max-width: 0; opacity: 0` with CSS transitions (visual-only, no layout reflow)
- Active indicator (`::before` accent bar) stays at `left: -1px` in both modes

### Anti-Jitter Rule

**No CSS transitions on layout properties** (width, padding) that would fight against live window resize. The nav snaps instantly on the breakpoint. Only visual-only properties (opacity, max-width) use transitions. This prevents the jitter feedback loop where a transitioning layout property constantly changes target during a drag.

### Content Padding

`.AppPg` padding steps down at breakpoints (no transition to avoid jitter):
- `32px 40px` → (below 800px) → `24px 20px` → (below 500px) → `16px 12px`

### Tauri Window Config

- Default size: `1000×800`
- Minimum size: `700×500`
- Decorations: `false` (custom titlebar)
- Resizable, maximizable, minimizable, closable

## CreateProfile Page (`app/src/pages/CreateProfile/CreateProfile.jsx`)

Create or edit profiles that bundle tool configs. Key behaviors:

- **Edit mode**: Detected via `location.state.profile`. Pre-fills all fields from the profile object.
- **New profile**: All fields start empty. All tools are **auto-populated** from the current system state via `sidecar("scan")`.
- **CSS**: Imports `../../styles/forms.css` (shared with Settings), not Dashboard.css.
- **Windhawk auto-import**: Scans Windows registry for installed mods. Loads them into the form with toggles and editable settings JSON. Auto-checks Windhawk in the tool checklist if any mods exist.
- **Rainmeter auto-import**: Scans `%APPDATA%/Rainmeter/Layouts/` for layout subdirectories. Renders a custom `<SelectMenu>` dropdown (see below) with available layouts, pre-selecting the current active one. Falls back to a text input if no layouts detected.
- **YASB / GlazeWM / Zebar auto-import**: Reads the current config files from the paths configured in Settings. Pre-fills textareas with the file contents.
- **Cancel (edit mode)**: When editing (`location.state.profile` exists), a Cancel button appears next to Save that navigates to `/` without saving.
- **Saving**: Uses `addData` (new) or `editData` (edit) on `userProfiles.json` with `id = Date.now()` for new profiles.

### SelectMenu Component (`app/src/components/SelectMenu/SelectMenu.jsx`)

Custom styled dropdown replacing native `<select>`. Fully themed with app CSS variables. Features:
- Animated open (fade + slide down) and close (fade + slide up) over 120ms
- Click-outside to close
- Dark sidebar background for the menu panel, accent glow for hover/selected states
- Chevron arrow rotates on open and changes to accent color
- Falls back gracefully when options array is empty

### ResizableTextarea Component (`app/src/components/ResizableTextarea/ResizableTextarea.jsx`)

Custom resizable textarea replacing native `<textarea>` resize. Completely removes the native white resize handle (OS-drawn, unstylable) and replaces it with a themed drag handle:
- **Drag handle**: Small chevron at bottom-right, hidden by default, fades in on hover (`opacity 0 → 0.6 → 1`)
- **Resize direction**: Vertical only (height), matches the native `resize: vertical` behavior
- **Min height**: 80px, can't be squished smaller
- **Cursor**: `ns-resize` during drag for clear affordance
- **Theme**: Uses `var(--text-muted)` / `var(--accent)` on hover, fully dark-themed
- **Safe resizing**: JavaScript-controlled via `mousedown`/`mousemove`/`mouseup` handlers, no layout jank
- **Zero re-renders during drag**: Height set directly on DOM ref, not React state
- **Cleanup on unmount**: `useEffect` removes stray listeners if component unmounts mid-drag

### Windhawk Mod Schema (inside `Windhawk-Mods` array)
```json
{
  "id": "modernflyouts",
  "enabled": 1,
  "settings": { "show-labels": true, "animation-speed": 200 }
}
```

## Sidecar Service (`app/src/services/sidecar.js`)

Wraps `@tauri-apps/plugin-shell` `Command.sidecar()`:

| Export | Type | Description |
|--------|------|-------------|
| `default` (`SideCar`) | async function(profileId) | Applies a profile by ID, or `"scan"` / `"stop-all"` |
| `autoDetectPaths` | async function() | Auto-detects tool install paths |
| `stopAll` | async function() | Kills all managed apps via `SideCar('stop-all')` |

```js
export async function stopAll() {
    return SideCar('stop-all');
}
```

The Python sidecar handles `"stop-all"` by:
1. Getting all running processes (cached as a set of lowercase names)
2. Killing `Rainmeter.exe`, `yasb.exe`, `glazewm.exe`, `zebar.exe` if running (using the cached set to skip redundant `psutil.process_iter` scans)
3. Reading `windhawkManifest.json` → if Windhawk is **Installed**, disables all mods via HKLM registry (elevated); if **Portable**, kills `windhawk.exe`
4. Wallpaper is left unchanged

### Process Scan Optimization (`running_names`)

All tool-apply functions (`rainmeter()`, `yasb_code_inject()`, `glaze_wm_apply()`, `zebar_apply()`) and `kill_process()` / `is_process_running()` accept an optional `running_names` parameter (a set of lowercase exe names). When provided, they skip redundant `psutil.process_iter` scans. The process list is fetched once at the start of `apply_profile()` or `stop-all` and threaded through all downstream calls.

## Common Issues

### "stopAll" Export Missing → SyntaxError

**Error:** `Uncaught SyntaxError: The requested module '/src/services/sidecar.js' does not provide an export named 'stopAll'`

**Fix:** Add `stopAll` named export to `sidecar.js`:
```js
export async function stopAll() {
    return SideCar('stop-all');
}
```

### Rainmeter Scan Returns No Layouts

**Error:** Rainmeter layout dropdown is empty on CreateProfile even though layouts exist in Rainmeter.

**Cause:** Rainmeter stores layouts as **subdirectories** in `%APPDATA%/Rainmeter/Layouts/` (e.g. `Mond`, `illustro default`), not flat `.ini` files. The original scan code only looked for `*.ini` files.

**Fix:** Changed `scan_rainmeter_layouts()` in the sidecar to use `os.path.isdir()` instead of `f.endswith('.ini')`, and skip `@`-prefixed entries (like `@Backup`).

### Native White Resize Handle on Textareas

**Problem:** White box at the bottom-right corner of textareas in CreateProfile (YASB, GlazeWM, Zebar, Windhawk settings).

**Cause:** The native Windows resize handle is an OS-drawn widget. The CSS pseudo-element `::-webkit-resizer` cannot fully override it in WebView2 — background color bleeds through with lowered opacity.

**Fix:** Replaced native resize with the `ResizableTextarea` component:
1. `resize: none` on the textarea
2. Wrapper `<div>` with a custom drag handle (chevron icon) at bottom-right
3. JS-driven vertical resize via `mousedown`/`mousemove`/`mouseup` on `document`
4. Height set directly on DOM ref (zero React re-renders during drag)
5. `useEffect` cleanup prevents listener leaks on unmount

### Stale Sidecar Binary → "invalid literal for int() with base 10: 'stop-all'"

**Error:** `Error: ERROR: invalid literal for int() with base 10: 'stop-all'`

**Cause:** The compiled `.exe` at `app/src-tauri/binaries/kalam-core/` was built from an older Python source that didn't have the `stop-all` handler.

**Fix:** Rebuild the sidecar binary.

## Building the Sidecar

```powershell
cd sidecar
python -m PyInstaller kalam-core.spec --noconfirm
Copy-Item dist/kalam-core-x86_64-pc-windows-msvc.exe app/src-tauri/binaries/kalam-core/ -Force
Copy-Item dist/kalam-core-x86_64-pc-windows-msvc.exe app/src-tauri/target/debug/kalam-core.exe -Force
```

### When to Rebuild

Rebuild whenever `sidecar/kalam-core.py` changes, including:
- Adding new special commands (`"scan"`, `"stop-all"`, `"autodetect"`)
- Modifying tool apply functions
- Changing Windhawk registry logic
- Adding new tool integrations

## Auto-Detect Paths

`autodetect_paths()` in the sidecar finds tool installations dynamically:

| Tool | Detection method |
|------|-----------------|
| Rainmeter | `shutil.which`, `%ProgramFiles%`, `%LOCALAPPDATA%` |
| Windhawk | `shutil.which`, `%ProgramFiles%`, `%LOCALAPPDATA%` + registry for install type |
| YASB exe | `shutil.which`, `%ProgramFiles%\YASB`, `%LOCALAPPDATA%\Programs\YASB`, winget links |
| YASB config | `YASB_CONFIG_HOME` env var, `~/.config/yasb/`, `~/.yasb/` (fallback) |
| GlazeWM exe | `shutil.which`, `%ProgramFiles%\glzr.io\GlazeWM\cli`, `%LOCALAPPDATA%\Programs\GlazeWM`, winget links |
| GlazeWM config | `~/.glzr/glazewm/`, `~/.glazewm/` (fallback) |
| Zebar config | `%APPDATA%/zebar`, `~/.zebar/` (fallback) |

Helper functions: `_first_existing(paths_iter)` returns the first path that exists, `_program_files_dirs()` reads `%ProgramW6432%`, `%ProgramFiles%`, `%ProgramFiles(x86)%` from environment (not hardcoded). `_program_files_dirs()` is called once at the start of `autodetect_paths()` and reused across all tool lookups.

## Auto-Update System

Built with `@tauri-apps/plugin-updater`. The app checks for updates on start and can be manually triggered from Settings.

### Architecture

```
GitHub Releases latest.json  →  updater plugin  →  useUpdateChecker hook  →  UpdateBanner component
```

The `latest.json` is **auto-generated** by `tauri-apps/tauri-action@v0` during CI (via `includeUpdaterJson: true`) and uploaded as a release asset — no manual manifest management needed.

### Files

| Purpose | Path |
|---------|------|
| Checker hook | `app/src/services/useUpdateChecker.js` |
| Banner component | `app/src/components/UpdateBanner/UpdateBanner.jsx` |
| Banner CSS | `app/src/components/UpdateBanner/UpdateBanner.css` |
| Release workflow | `.github/workflows/release.yml` |

### How It Works

1. `useUpdateChecker` calls `check()` from `@tauri-apps/plugin-updater` on mount
2. If an update is available, `UpdateBanner` renders a toast at bottom-right
3. User can **Download**, **Later** (dismiss via close X or Later button), or trigger **Check for Updates** from Settings
4. After download, a **Restart & Install** button appears
5. On click, it calls `update.install()` then `relaunch()`

### Banner States

| Status | Shows |
|--------|-------|
| `available` | "Update available" with version + release notes, Download / Later buttons |
| `downloading` | "Downloading update..." with percentage + progress bar (below text) |
| `downloaded` | "Download complete" with Restart & Install / Later buttons |

### Dismiss & Animation

Every banner has an X close button at top-right. Clicking it (or "Later"):
1. Adds `update-banner--exit` class → triggers CSS transition
2. Banner slides right 30px and fades out over 250ms
3. Only `transform` and `opacity` are animated — GPU-composited, no layout jank
4. On `transitionEnd`, calls the hook's `dismiss()` and removes from DOM

Banner stays dismissed until next app start or manual "Check for Updates" from Settings.

### Progress Bar Fix

The progress bar in `downloading` state sits on its own line below the text (not inline). The flex container uses `flex-wrap: wrap` and the bar has `flex: 0 0 100%` to force a new row.

### CSS Structure

| Class | Purpose |
|-------|---------|
| `.update-banner-stack` | Fixed-position flex column container at bottom-right |
| `.update-banner` | Card background, border, shadow, `max-width: 420px` |
| `.update-banner--exit` | `transform: translateX(30px); opacity: 0; pointer-events: none` |
| `.update-banner-close` | Absolute-positioned X button at top-right corner |

### Tauri Configuration (`tauri.conf.json`)

```json
{
  "bundle": { "createUpdaterArtifacts": true },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://github.com/Comp-Tech-Guy/Kalam/releases/latest/download/latest.json"],
      "dialog": false,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEZFM0FGNkNBM0QzRTg3NkUKUldSdWh6NDl5dlk2L3BmanBHRGNLa3I2N2tKQUUvam1TWWZiYitOUllBVzFSWmVGL2QrRE93b2QK"
    }
  }
}
```

- `createUpdaterArtifacts: true` — required for `.sig` file generation during build
- `dialog: false` — disables Tauri's default dialog so custom React banner is used
- `pubkey` — full contents of the `.key.pub` file, not a path

### Signing Keys (One-Time Setup)

Generate an Ed25519 keypair for update verification:

```powershell
npm run tauri signer generate -- -w $HOME\.tauri\kalam.key
```

Creates:
- `kalam.key` — **PRIVATE KEY**. Store as `TAURI_SIGNING_PRIVATE_KEY` GitHub secret. **Never commit.**
- `kalam.key.pub` — **PUBLIC KEY**. Contents go into `tauri.conf.json` `plugins.updater.pubkey`.

### Build Locally with Signing

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "C:\Users\You\.tauri\kalam.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "your-password"
npm run tauri build -- --bundles msi
```

`.env` files do NOT work — you must use real environment variables.

### GitHub Secrets Needed

| Secret | Value |
|--------|-------|
| `TAURI_SIGNING_PRIVATE_KEY` | **Base64-encoded** content of `kalam.key` (use `[Convert]::ToBase64String(...)`) — avoids YAML newline mangling |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password chosen during key generation |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |

### Signature: CI-Specific Fix (Important)

**Problem:** "failed to decode secret key" / "Missing comment in secret key" error in CI.

**Root cause:** GitHub YAML strips newlines when expanding `${{ secrets.X }}` directly in the `env:` block. The PEM key (`-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----`) gets truncated to just the first line.

**Fix in workflow:**
1. Store the key as **base64** in the GitHub secret
2. In a workflow step, decode and write to a temp file
3. Set `TAURI_SIGNING_PRIVATE_KEY` to that file path (not to the secret directly)

```yaml
- name: Decode signing key
  shell: pwsh
  run: |
    $bytes = [Convert]::FromBase64String("${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}")
    $path = Join-Path $env:RUNNER_TEMP "kalam.key"
    [IO.File]::WriteAllBytes($path, $bytes)
    echo "TAURI_SIGNING_PRIVATE_KEY=$path" >> $env:GITHUB_ENV
```

The `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` stays in the `env:` block directly since it's a single-line value.

**Also:** Known Tauri bug where `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` env var is sometimes ignored. Add old names as fallbacks if needed:
```yaml
TAURI_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
TAURI_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

### Release Workflow (`.github/workflows/release.yml`)

Uses [`tauri-apps/tauri-action@v0`](https://github.com/tauri-apps/tauri-action) — one action handles build, sign, release creation, artifact upload, and `latest.json` generation.

**Triggers:** `workflow_dispatch` (manual version input) or push tag `v*`.

**What the workflow does:**
1. Extract version from tag / manual input
2. Write version into `tauri.conf.json`
3. Decode base64 signing key to temp file
4. **Rust dependency cache** (`Swatinem/rust-cache@v2`): caches `~/.cargo` and `app/src-tauri/target` keyed by `Cargo.lock` hash + `rustc` version. Cuts Rust compile from ~20 min to ~2-3 min on cache hit.
5. **Single `tauri-action` step**: builds with key, creates draft GitHub Release, uploads MSI + `.sig`, generates `latest.json`

**Release Process:**
1. Trigger via `workflow_dispatch` with version number (or push tag `v*`)
2. GitHub Actions builds, signs, creates draft release
3. **Manually publish** the draft on GitHub Releases page
4. App detects update on next start

**Note:** The `latest/download/latest.json` URL requires the repo to be **public** (or auth token in the URL). If the repo is private, the updater cannot fetch `latest.json`.

### Common Pitfalls

- **No `.sig` files**: `TAURI_SIGNING_PRIVATE_KEY` not set during build, or `createUpdaterArtifacts` missing
- **Signature rejected**: Public key in config doesn't match the private key used to sign
- **Update not detected**: Endpoint must match exactly — `https://github.com/Comp-Tech-Guy/Kalam/releases/latest/download/latest.json`
- **Lost private key**: All existing installs become permanently unable to receive updates. Store in password manager + GitHub secrets.
- **Private repo**: The endpoint URL is unauthenticated — make repo public or host `latest.json` elsewhere.
- **CI "Missing comment in secret key"**: Key newlines lost in YAML `env:` block. Use base64+temp file workaround (see above).

## AutoHotKey External Trigger

AHK scripts can switch profiles and stop-all without opening the GUI by calling the sidecar directly.

### Sidecar CLI Commands

| Command | Args | Output | What it does |
|---------|------|--------|-------------|
| `list` | `appDataDir list` | JSON array `[{id, name}]` | List all profiles |
| `current` | `appDataDir current` | `{id, name}` or `null` | Show active profile |
| `apply-by-name` | `appDataDir apply-by-name "Name"` | (none) | Look up profile by name and apply it |
| `stop-all` | `appDataDir stop-all` | Status text | Stop all managed tools |
| `<id>` | `appDataDir <id>` | (none) | Apply profile by numeric ID (existing) |

`appDataDir` is `%APPDATA%\Kalam`.

### Example AHK Script (v2)

```autohotkey
#SingleInstance
Sidecar := "C:\Program Files\Kalam\binaries\kalam-core\kalam-core-x86_64-pc-windows-msvc.exe"
AppData := A_AppData . "\Kalam"

; Win+1 → Gaming profile
#1:: RunWait('"' Sidecar '" "' AppData '" apply-by-name "Gaming"', , "Hide")

; Win+2 → Work profile
#2:: RunWait('"' Sidecar '" "' AppData '" apply-by-name "Work"', , "Hide")

; Ctrl+Win+S → Stop all
^#s:: RunWait('"' Sidecar '" "' AppData '" stop-all', , "Hide")
```

### Windhawk Smart Restart

When applying profiles with `Windhawk-Mods`, the sidecar compares the desired mod settings against the current registry state. If nothing changed (re-applying the same profile, or switching between profiles with identical Windhawk configs), the service restart is skipped entirely — no UAC prompt, no service interruption.

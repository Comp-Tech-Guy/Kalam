# Kalam — Roadmap

## Phase 1: Komorebi Support

**Goal:** Add Komorebi as a supported tiling window manager tool.

### Status: ✅ Completed (27 Jul 2026)

### What was done
- Added Komorebi config/applications file support to CreateProfile (checkbox, accordion, save/load)
- Added Komorebi tool badge icon to ProfileCard
- Added `Komorebi-Config-Path` field to Settings with auto-detect
- Implemented `scan_komorebi_configs()` and `komorebi_apply()` in Python sidecar
- Added Komorebi to `autodetect_paths()`, `apply_profile()`, `scan`, and `stop-all` handlers
- Updated `storage.js` default settings shape
- Rebuilt and deployed sidecar binary

---

## Phase 2: Python Backend Optimization

**Goal:** Optimize the Python sidecar for speed, security, and reliability.

### Tasks
- [ ] Audit all sidecar commands for latency bottlenecks
- [ ] Reduce redundant file I/O operations
- [ ] Add input validation and sanitization
- [ ] Consolidate repeated path resolution logic
- [ ] Add proper error handling and structured responses
- [ ] Minimize subprocess calls where possible
- [ ] Review and harden file permissions/security

---

## Phase 3: Windhawk Installed vs Portable Auto-Detection

**Goal:** Prevent silent failures when userSettings.json has the wrong Windhawk type.

### Status: ✅ Completed (27 Jul 2026)

### What was done
- `scan` falls back to registry if portable path doesn't exist
- `apply` falls back to registry-based disable if portable path doesn't exist
- `stop-all` falls back to registry-based disable if portable path doesn't exist

---

## Phase 3b: Auto-Detect Path Improvements

**Goal:** Fix incorrect auto-detection for Zebar and Windhawk.

### Status: ✅ Completed (27 Jul 2026)

### What was done
- Zebar: Config path uses `~/.glzr/zebar` (the only valid location in the glzr ecosystem)
- Windhawk: Autodetect checks what actually exists instead of defaulting to "Portable"
- Windhawk: Always checks registry as secondary installed indicator when ini is ambiguous

---

## Phase 4: Move Sidecar Build to GitHub Actions

**Goal:** Stop committing the 9.4MB Python sidecar binary to the repo. Build it inside CI instead.

### Tasks

#### Repo Cleanup
- [ ] Add `app/src-tauri/binaries/` to `.gitignore`
- [ ] Remove tracked binary: `git rm --cached app/src-tauri/binaries/kalam-core/kalam-core-x86_64-pc-windows-msvc.exe`

#### GitHub Actions Workflow
- [ ] Create or update `.github/workflows/release.yml` with a sidecar build step
- [ ] Add Python 3.12 setup step (`actions/setup-python@v5`)
- [ ] Add pip install step for dependencies: `pyinstaller psutil pyvda pyyaml`
- [ ] Run PyInstaller: `python -m PyInstaller kalam-core.spec --noconfirm`
- [ ] Copy built exe to `app/src-tauri/binaries/kalam-core/` before `tauri-action` runs

#### Workflow Order
```
1. Checkout repo
2. Setup Node.js
3. Setup Python 3.12
4. pip install pyinstaller psutil pyvda pyyaml
5. Build sidecar (PyInstaller in sidecar/)
6. Copy exe → app/src-tauri/binaries/kalam-core/
7. Decode signing key
8. tauri-action (builds frontend + Rust, bundles with sidecar)
```

#### Local Dev
- [ ] Document that developers must build sidecar locally before `npm run tauri dev`
- [ ] Add build instructions to INTERNALS.md
- [ ] Consider a `package.json` script for one-command sidecar build

---

## Phase 5: (TBD)

_No next phase defined yet._

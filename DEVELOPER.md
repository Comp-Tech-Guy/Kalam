# Kalam — Developer Notes

## Release Workflow (.github/workflows/release.yml)

Triggers: `workflow_dispatch` (manual with version input) or push tag `v*`.

### What the workflow does:
1. Extract version from tag/manual input
2. Write version into `tauri.conf.json`
3. `npm run tauri build`
4. Sign MSI via `TAURI_PRIVATE_KEY` env var → `tauri signer sign`
5. Create GitHub Release + upload MSI
6. Update `update.json` with version, signature, URL
7. Commit/push `update.json` to master

### Bugs Fixed (2026-06-22)
- MSI version mismatch — added `tauri.conf.json` version update step
- `npx tauri` not found — added `working-directory: app` to sign step
- MSI path broken after dir change — fixed path to `src-tauri/...`
- `base64:` prefix crash — switched from temp file to env var

### Open Issue
`TAURI_PRIVATE_KEY` GitHub secret still contains the `base64:` prefix. Edit the secret at Settings → Secrets → Actions to remove `base64:` (keep only the raw base64 string). Otherwise `tauri signer sign` crashes:
```
failed to decode base64 secret key: Invalid symbol 58, offset 1.
```

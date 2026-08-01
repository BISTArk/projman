# ProjMan repository guidance

## Product scope

ProjMan is a Tauri v2 desktop app supported on Windows and macOS. Changes to project scripts, terminals, Git operations, editor launching, filesystem access, window controls, or updates must work on both platforms. Do not add unguarded Windows-only commands such as `cmd`, `taskkill`, `.exe` paths, or Windows environment variables; use platform-specific Rust implementations behind `cfg` attributes.

## Required checks

Run these before handing off a change:

1. `npm run build`
2. `cargo check --manifest-path src-tauri/Cargo.toml`
3. `npm run build --prefix promo-site` when the landing page changes
4. On macOS packaging changes, `npm run build:macos`

Keep `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` on the same semantic version. Do not change `plugins.updater.pubkey` unless intentionally rotating the update key with a migration plan for existing installations.

## Releases

Desktop releases are created by `.github/workflows/release.yml` from `v*` tags. Every release must include Windows NSIS/MSI artifacts, a universal macOS DMG, signed updater artifacts, and a unified updater manifest. `src-tauri/tauri.release.conf.json` enables updater artifact generation only in the signed release workflow so ordinary local builds remain usable.

Required GitHub Actions secrets are `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Optional Apple Developer signing and notarization secrets are documented in `README.md`. Never commit signing keys, certificates, passwords, or notarization credentials.

## Landing page

The landing source is in `promo-site/` and builds into `docs/` for GitHub Pages. Preserve `docs/update.json` when rebuilding. Download controls must retain OS auto-detection, offer both Windows and macOS choices, and fall back to the latest release page if the GitHub asset lookup fails.

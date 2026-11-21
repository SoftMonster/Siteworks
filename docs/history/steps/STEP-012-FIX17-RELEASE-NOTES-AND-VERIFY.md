# STEP 012 — FIX17: Release notes and verification baseline

**Date:** 2026-11-21  
**Archive:** `Siteworks-1.6.9-R2-Hotfix-20-Andrew-Next-Task-FIX17.zip`  
**Purpose:** Document R2 Hotfix 19 and R2 Hotfix 20 accurately, and establish the automated verification baseline before attempting a live application smoke test.

## Work recorded
- Added the R2 Hotfix 20 operational/recovery-workflow notes beneath the existing 1.6.9 release entry. No extension version bump or new application feature is claimed.
- Preserved the R2 Hotfix 19 product notes describing numeric Steam app-ID eligibility, separate market-price enrichment, endpoint-specific cooldown behaviour and shared filedata price projection.
- Regenerated `release-notes.html` from `RELEASE_NOTES.md`.
- Regenerated `docs/RELEASE_FILE_MANIFEST.sha256`.
- Added the latest user-supplied manual screenshot showing PowerShell parser errors to the FIX17 evidence folder.

## Automated verification — model-side archive copy
Environment: Node.js v22.16.0, Linux container. This is not Andrew's Windows environment.

| Check | Result |
|---|---|
| JavaScript syntax | PASS — 37 files |
| Unit tests | PASS — 84 passed, 0 failed |
| Release manifest | PASS — 118 files verified |
| `npm run verify` | PASS — exit code 0 |

## Not established
- The current `Andrew_next_task.bat` has not been proven to run successfully in Windows PowerShell 5.1. The supplied screenshot records parser errors in the generated temporary launcher script.
- The Site Works extension has not yet been loaded and smoke-tested in Brave in this step.
- No live Steam inventory or market operation was performed.

## Next task
Run the application smoke test independently of the recovery launcher: load the unpacked `Siteworks` folder in Brave through `brave://extensions`, enable Developer mode, select **Load unpacked**, and choose the folder containing `manifest.json`. Confirm the extension appears, open its popup, then visit the Steam Community inventory page and report any extension errors. Do not run inventory synchronisation or price enrichment yet.

# STEP 014 — FIX19: Canonical TODO consolidation

**Date:** 2026-11-21  
**Baseline:** Site Works 1.6.9 / R2 Hotfix 20 / Skillset-OS integration FIX18  
**Scope:** Audit outstanding project work and establish one self-contained prioritised backlog. No application feature behaviour intentionally changed.

## Findings

- Outstanding work was split between the progress log, R1–R7 roadmap, R2 acceptance matrix, technical-debt register, rescue report and launcher handover.
- Historical status tables mixed current and superseded items; R2 live acceptance remained open.
- The archive filename/step identifies FIX18, while the visible and embedded launcher payload identify FIX16. This is recorded as P0 TODO-001 rather than silently treated as valid.
- FIX18 offline verification is recorded as 87 tests passed, 39 JavaScript files checked, 125 manifest entries and governance checks passed.

## Changes

- Added `docs/PROJECT_TODO.md` with 20 ordered work items, dependencies, priorities, status, ownership and acceptance criteria.
- Updated `ANDREW_NEXT_TASK.txt` to point to the canonical backlog and the immediate launcher-identity blocker.
- Updated README, progress log, technical-debt mapping, R2 acceptance matrix, handover pointers and Hotfix 20 operations document.
- Regenerated `docs/RELEASE_FILE_MANIFEST.sha256` (127 files).
- Preserved historical records and did not change product code, version 1.6.9, Steam behaviour or Git history.

## Verification

| Check | Result |
|---|---|
| `npm run verify` | PASS — 39 JavaScript files; 87/87 tests; 127 manifest files; governance check passed |
| `npm run helper-selftest` | BLOCKED — PowerShell 7 (`pwsh`) not present in this Linux environment |
| Windows PowerShell 5.1 / Brave / Steam | NOT TESTED — requires Andrew's machine |
| ZIP integrity | To be verified at packaging |

## Next action

Resolve TODO-001: reconcile the launcher build marker/payload with the next archive identity, then perform the Windows PowerShell 5.1 launcher and screenshot/clipboard acceptance run.

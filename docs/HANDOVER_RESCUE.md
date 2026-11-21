# Handover Rescue Report

**Date:** 2026-11-21 · **Baseline received:** `Siteworks (5).zip` (1.6.9 / R2 HF19) · **Result:** project is now reproducible, versioned and self-checking. **Live acceptance is still outstanding.**

## Verdict

The code was not the problem. 77/77 tests passed, syntax was clean, and a static read of the security-sensitive parts was better than the docs feared. The *handover* was failing: an incoming developer could not tell what was released, what had changed, or what to trust.

## What was wrong, and what was done

| # | Problem found | Fix |
|---|---|---|
| 1 | The ZIP contained a real git repo (`origin`: SoftMonster/Siteworks) at **1.5.0**, but 19 hotfixes (1.6.9) were uncommitted. The handover docs claimed no repo existed. | Committed 1.6.9 as-received (tag `handover-as-received`), then fixes on top. Tags `v1.5.0`, `v1.6.9`. Docs corrected with a notice. |
| 2 | No `.gitattributes`: CRLF/LF mismatch made git show **26 modified files / 3,194+ 2,063−**. Real change: **7 files / 1,220+ 89−**. | `.gitattributes` (LF; CRLF for `.cmd`/`.ps1`). Also makes the checksum manifest identical on every OS. |
| 3 | Popup showed **1.6.8 · HF18** on a 1.6.9 build; a test enforced the wrong text. | Popup fixed; stale test removed; `tests/consistency.test.cjs` derives expected values from `manifest.json` (verified it fails when the bug is reintroduced). |
| 4 | `release-notes.html` stopped at 1.6.8, duplicated a section, skipped 1.6.7 and 1.6.9, and was hand-edited. | Generated from `RELEASE_NOTES.md` (`npm run release-notes`); a test fails if it is stale. |
| 5 | README.md said 1.4.0, README.txt said 1.3 and listed a toolbox script that no longer exists. | Both corrected. |
| 6 | `helper/com.siteworks.helper.json` (tracked despite being gitignored) contained a local Windows user name and path. | Untracked, removed from release tree, test guards against recurrence. |
| 7 | Checksum manifest and evidence log made claims that were false (no repo) and could not be regenerated. | `npm run manifest` / `node scripts/manifest.cjs --check`; evidence log corrected and extended. |
| 8 | No CI. | `.github/workflows/ci.yml`: `npm run verify` on Node 18/20/22, and Windows PowerShell 5.1 index rebuild. |
| 9 | TD-05 (helper unaudited) | Static review recorded in `quality/SECURITY_REVIEW.md`: websites cannot reach the helper; path containment is sound. Residuals are low. Not executed. |

Tests: 77 → 84 passing. Syntax check now also covers the `.cjs` tooling.

## Read this before pulling onto the original machine

`helper/com.siteworks.helper.json` is now untracked. Pulling these commits will **delete** that file on the developer's PC, and the browser's native-messaging registration points at it. After pulling, double-click **`Install file helper.cmd`** once (it regenerates the file and registry entries), then reload the extension. Decisions and settings in the browser are unaffected.

## Still open (not fixable without a live environment)

1. **TD-04: no live acceptance.** Nobody has recorded a run on real Brave + a real Steam inventory. Everything under `sites/Steamworks/inventory/` is verified only by string/behaviour checks of its source, not by running it.
2. Helper: executed and abused on Linux/PowerShell 7 (93/93, see `quality/SECURITY_REVIEW.md`); **not yet on Windows PowerShell 5.1**, and the Windows install path is untested.
3. IndexedDB/localStorage consistency (TD-03) and Steam-internals dependence (TD-01).
4. Owner decisions: toolbox (TD-15), `.old`/`trash` files (TD-11), whether to keep `<all_urls>` (TD-06).

## First-day steps for the incoming developer

1. `git clone`, `git checkout v1.6.9`, `npm run verify` (expect all green).
2. Load unpacked in Brave; confirm the popup reads **1.6.9 · R2 Hotfix 19** and no errors on the extension page.
3. Run `Install file helper.cmd`; Manage should show helper **Connected**. Save a throwaway script from the editor, then trash it.
4. Work through `quality/R2_ACCEPTANCE_MATRIX.md` against a **small** Steam inventory first, recording evidence as described in `HANDOVER_EVIDENCE.md`. Do not run bulk-sell or listing removal until synchronisation and price enrichment are confirmed.
5. Close TD-04 and record it; only then plan R3.

## Commit map

- `v1.5.0` — last commit in the original history.
- `17ba208` — add `.gitattributes`.
- `9e68cf3` — 1.6.9 snapshot, exactly as received (includes the known defects).
- `3979042` — handover pack as received. Tag `handover-as-received`.
- next commit(s), tag `v1.6.9` — the rescue fixes above.

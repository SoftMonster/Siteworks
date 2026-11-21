# Handover Preparation — Evidence Log

**Baseline inspected:** supplied Site Works 1.6.9 / R2 Hotfix 19 ZIP with comprehensive handover.  
**Purpose:** record commands executed while preparing this documentation pack.

## Source inspection

- Archive entries inspected: 63 before this documentation expansion.
- `manifest.json`: Manifest V3, version 1.6.9, minimum Chrome 106, service worker `background.js`, permissions `scripting`, `webNavigation`, `storage`, `contextMenus`, `nativeMessaging`, `clipboardWrite`; host permissions `<all_urls>`.
- `package.json`: version 1.6.9; Node `>=18`; scripts `npm test` and `npm run check`.
- Main R2 script inspected: `sites/Steamworks/inventory/steam-inventory-prices.js` (approximately 101,417 bytes in inspected extraction).
- Architecture document inspected: `docs/WEBDATA_FILEDATA_ARCHITECTURE.md`.
- Release notes inspected: `RELEASE_NOTES.md`.
- Helper manifest inspected: `helper/com.siteworks.helper.json`; it contains an absolute path referencing a specific Windows profile/repository location.
- README version discrepancy observed: README.md identifies release 1.4.0; README.txt identifies 1.3; manifest/package identify 1.6.9.

## Offline commands actually executed

From the extracted `Siteworks` directory:

```text
npm test
```

Result:
- exit code 0
- 77 tests
- 77 passed
- 0 failed
- 0 skipped
- duration approximately 415 ms in the preparation environment

```text
npm run check
```

Result:
- exit code 0
- `Syntax OK: 22 JavaScript files checked.`

These results are specific to the preparation environment and this archive. They do not prove live browser/Steam behaviour.

## Not performed

- No live Brave/Chromium extension installation test.
- No live Steam inventory synchronisation.
- No live market-price request.
- No Windows native-messaging installation or invocation.
- No PowerShell static/security review by executing the helper.
- No failure-injection test for IndexedDB/localStorage consistency.
- No independent security penetration test.
- ~~No source-control commit/tag verification; archive contains no `.git` directory.~~ **Corrected:** the ZIP contains a `.git` directory (HEAD was 1.5.0; 1.6.9 was uncommitted). Resolved in the rescue pass; see `HANDOVER_RESCUE.md`.
- No lockfile: **not required**. `package.json` declares zero dependencies and no build step; the project runs from source. Reproducibility is provided by the git tag plus `npm run verify`.
- No user-data migration test against production data.

## Required next evidence

Record browser version, Windows version, Steam page/app/context, inventory size, test operator, start/end times, console output, extension logs, screenshots, journal/filedata snapshots and result for every live acceptance case. Redact account identifiers and personal data before sharing.

## Rescue-pass evidence (2026-11-21)

Executed on the delivered ZIP after extraction (Node v22):

- `git status` before changes: 26 files "modified", 3,194 insertions / 2,063 deletions. After adding `.gitattributes`: 7 files, 1,220 insertions / 89 deletions. The difference was CRLF/LF noise.
- `npm test` before changes: 77/77. `npm run check`: 22 files OK.
- Defect found: `popup.html` build identity read 1.6.8 / HF18 while manifest/package/release notes said 1.6.9 / HF19, and `tests/r2.8.test.cjs` asserted the stale text.
- After fixes: `npm test` 84/84; `npm run check` 36 files OK; consistency test confirmed to FAIL when the original defect is reintroduced.
- Original `RELEASE_FILE_MANIFEST.sha256` verified 77/77 before changes; regenerated afterwards by `npm run manifest`.
- Still **not** performed: live Brave/Chromium load, live Steam sync, Windows helper installation or execution, PowerShell run of any kind. The helper review in `SECURITY_REVIEW.md` is static reading only.

## Recovery Phase 3, step 1 (2026-11-21): helper executed

- Obtained PowerShell 7.7.0 (Linux x64) from the official GitHub release; ran `node scripts/helper-selftest.cjs`: **93 passed, 0 failed, 0 skipped**.
- Sabotage runs (each reverted afterwards; `git status` clean): symlink refusal removed -> 5 failures; `..`/empty-segment check removed -> still refused by other layers (4 unrelated failures on absolute/UNC/empty paths); all three traversal layers removed -> 10 failures including `../escape.js`; 4 MB cap removed -> caught only after the test was strengthened to send a complete valid oversized write.
- A first run had 1 failure caused by a faulty test (a filename containing `../`, which the helper correctly refused); the test was corrected, not the helper.
- Platform caveat: Linux, PowerShell 7. Not Windows. Not a browser. No Steam involved.

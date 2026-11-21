# Engineering Decisions and Technical Debt

## Decisions evidenced by current architecture/source documentation

### D-001 — Default-deny user-script execution
**Decision:** scripts require explicit permission before execution; remembered approvals are bound to script content using SHA-256.  
**Reason:** user agency and protection against silently changed scripts.  
**Evidence:** README, `background.js`, `match.js`, R1 tests.  
**Caution:** this is not a sandbox; approved scripts execute in page context.

### D-002 — Folder-driven site and path matching
**Decision:** site folder and ordered nested path folders determine script matching.  
**Reason:** user-maintainable routing without a central hard-coded URL map.  
**Evidence:** README and `match.js`.  
**Caution:** rebuild generated `sites/index.json` after source folder changes.

### D-003 — Steam native loader preferred when capabilities exist
**Decision:** use Steam's own page loader rather than independently reconstructing its request/continuation logic.  
**Reason:** delegate request construction, continuation and native merge/error handling to the page implementation.  
**Evidence:** `WEBDATA_FILEDATA_ARCHITECTURE.md`, R2 tests.  
**Caution:** Steam internals are undocumented and can change.

### D-004 — Journal plus materialised Filedata projection
**Decision:** capture serialisable webdata deltas in IndexedDB and maintain a localStorage projection for application use.  
**Reason:** retain captured source records and permit projection rebuild after reconciliation changes.  
**Evidence:** architecture document and R2 tests.  
**Caution:** IndexedDB/localStorage are not one atomic transaction; recovery interleavings require more tests.

### D-005 — Separate inventory acquisition from market-price enrichment
**Decision:** one inventory synchronisation operation; price enrichment is separate and optional.  
**Reason:** distinct sources, cooldowns and lifecycle.  
**Evidence:** architecture document, HF19 release notes and tests.  
**Caution:** missing price must not imply missing inventory or no listing.

### D-006 — Stop rather than retry after throttling
**Decision:** no automatic retries after HTTP 429 for the documented Steam trading/price workflows; respect cooldown and explicit user restart.  
**Reason:** avoid request hammering and respect server throttling.  
**Evidence:** README and tests.  
**Caution:** keep endpoint-specific cooldowns separate.

## Technical debt / risks

| ID | Item | Evidence | Priority | Suggested next action |
|---|---|---|---|---|
| TD-01 | Steam integration depends on undocumented page globals/methods | Architecture document | High | Adapter contract, fixtures, capability diagnostics and live compatibility tests |
| TD-02 | Large monolithic inventory script (~101 KB) | Source size/function inspection | Medium | Defer refactor until R2 acceptance; then split behind tests |
| TD-03 | Cross-store consistency not proven | IndexedDB + localStorage design | High | Failure-injection and replay/idempotency tests |
| TD-04 | No live acceptance evidence in supplied handover | Handover explicitly says live test outstanding | High | Execute live acceptance matrix |
| TD-05 | Native helper security not independently audited | Helper files present; no threat model | High | Audit message validation/path containment |
| TD-06 | Broad `<all_urls>` host permission | Manifest | Medium/High | Document necessity; assess optional permissions |
| TD-07 | Machine-specific absolute path in helper host JSON | `helper/com.siteworks.helper.json` | High | Verify installer-generated registration on clean Windows account |
| TD-08 | README version drift (README says 1.4.0; package/manifest 1.6.9) | Source files | Medium | Update release-facing documentation |
| TD-09 | README.txt says 1.3 and may be stale | Source file | Medium | Reconcile or label historical |
| TD-10 | No dependency lockfile/build pipeline/source revision in ZIP | Archive inventory | Medium | Establish repository/tag and reproducible release process |
| TD-11 | Archived `.old` scripts and trash content in release ZIP | Archive inventory | Low | Define packaging inclusion/exclusion policy |
| TD-12 | R3–R7 are not implementation specifications | Existing roadmap | Medium | Requirements and acceptance design before scheduling |

## Status after rescue pass (2026-11-21)

| ID | Status | Notes |
|---|---|---|
| TD-01 | Open | Unchanged. Needs adapter contract + live compatibility tests. |
| TD-02 | Open | Unchanged. Do not refactor before live R2 acceptance. |
| TD-03 | Open | Unchanged. Needs failure-injection tests. |
| TD-04 | **Open — the main blocker** | No live Brave/Steam evidence exists. See `HANDOVER_RESCUE.md` first-day steps. |
| TD-05 | Reduced, partly executed | Static review plus 93-check executed self-test on Linux/pwsh 7.7 (all pass, sensitivity verified by mutation). **Windows PowerShell 5.1 run still required.** |
| TD-06 | Open | Manifest unchanged. Note: there are no content scripts; injection is via `chrome.scripting` after the approval gate. Consider optional host permissions. |
| TD-07 | **Resolved** | Per-machine helper registration untracked and removed from the release tree; a test fails if absolute user paths reappear in source. |
| TD-08 | **Resolved** | README.md refreshed; version checked by `tests/consistency.test.cjs`. |
| TD-09 | **Resolved** | README.txt header and "Included" section corrected; historical sections retained. |
| TD-10 | **Resolved** | Git history committed, tags `v1.5.0` and `v1.6.9`, CI added. No lockfile needed (zero dependencies). |
| TD-11 | Open | `.old` files and `trash/` are still tracked. Decide: delete (git history keeps them) or keep. |
| TD-12 | Open | Unchanged. |
| TD-13 | New, **Resolved** | Popup showed 1.6.8/HF18 while the build was 1.6.9/HF19, and a test enforced the wrong string. |
| TD-14 | New, **Resolved** | `release-notes.html` stale (stopped at 1.6.8, duplicated a section, missing 1.6.7/1.6.9). Now generated from `RELEASE_NOTES.md`. |
| TD-15 | New, Open | Toolbox (`Alt+Shift+K`, menu entry) is wired in `background.js` but `sites/00-toolbox.js` was retired to `.old` in commit `8c3b683`; the feature only shows a notice. Owner decision: restore or remove the UI. |
| TD-16 | New, Open | 19 hotfixes (1.5.0 → 1.6.9) exist in git as one snapshot commit; per-hotfix history was never recorded. Release notes are the only per-hotfix record. |

## Decision record template

For future decisions, record: ID, date, owner, status, context, decision, alternatives, rationale, consequences, risks, implementation references, verification evidence and superseded decision (if any).


## Current baseline reconciliation — FIX18 (2026-11-21)

The earlier status table is retained as a historical rescue-pass record. Current work is governed by [`../PROJECT_TODO.md`](../PROJECT_TODO.md). In particular, the archive is labelled FIX18 while the visible and embedded `Andrew_next_task.bat` payload still carries the FIX16 build marker. Treat launcher identity as an open P0 issue; do not accept a Windows run until the maintainer reconciles the marker and payload.

Current mapping: TD-01 → TODO-009; TD-02 → TODO-015; TD-03 → TODO-007; TD-04 → TODO-003–008; TD-05 → TODO-004; TD-06 → TODO-010; TD-11 → TODO-012; TD-12 → TODO-016–020; TD-15 → TODO-011; TD-16 → TODO-013. TD-07–TD-10 and TD-13–TD-14 remain resolved as recorded above, subject to ordinary regression checks.

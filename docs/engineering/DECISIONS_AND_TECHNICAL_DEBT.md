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

## Decision record template

For future decisions, record: ID, date, owner, status, context, decision, alternatives, rationale, consequences, risks, implementation references, verification evidence and superseded decision (if any).

# Site Works — Project Progress Log

This is the cumulative status record. It is updated in every traceable archive. A task is not marked complete solely because an archive was built; Windows/live acceptance requires Andrew's returned feedback evidence.

## Recovery and automation

| Date | Work item | Status | Evidence / next action |
|---|---|---|---|
| 2026-11-21 | R2 recovery baseline and live snapshot captured | Recorded; reconciliation pending | See recovery plan and live-state summary |
| 2026-11-21 | Andrew Next Task self-extracting launcher introduced | Implemented in archive; iterative Windows validation | Preserve `.git`; back up working files; explicit REPLACE gate |
| 2026-11-21 | Mandatory text + screenshot feedback protocol | Implemented; Windows clipboard verification pending | Feedback ZIP, transcript, screenshot series, evidence board |
| 2026-11-21 | FIX12 Robocopy output clarity | Superseded | Detailed logs and concise exit codes |
| 2026-11-21 | FIX13 command-line size correction | Superseded | Short bootstrap; user feedback revealed PowerShell 5.1 parse errors |
| 2026-11-21 | FIX14 PowerShell 5.1 syntax correction | Package prepared; Windows validation pending | Run launcher, paste feedback board/text and attach feedback ZIP if clipboard fails |

## TODO plan progress

| Plan area | Current state | Next gate |
|---|---|---|
| Phase 1 — recovered baseline | Not yet independently reconciled on Andrew's machine | Run local verification after toolchain is available |
| Phase 2 — native helper | Pending | Install/test helper and provide results |
| Phase 3 — live browser/Steam acceptance | Pending | Controlled small-inventory acceptance |
| Phase 4 — engineering risks | Pending | Data-store recovery, Steam resilience, permissions, script structure |
| Phase 5 — product decisions | Pending | Toolbox, retired files, permission strategy |
| Phase 6 — roadmap/release | Suspended | Resume only after live acceptance and decisions |
| Additional R2 integrity TODOs | Open | Counters, unknown quantities, valuation, price freshness, migration, fixtures |
| Security/operations TODOs | Open | Independent review, clean profile, diagnostic bundle, rollback/migration |
| Documentation/provenance TODOs | Open | Architecture, Steam maintenance, experiments, debt, hotfix history, CI |
| R3–R7 feature proposals | Unapproved ideas | Prioritise only after recovery gates |
| Card Shelf top-button/dropdown UX | Remembered; not started | Preserve tabs and behaviour; test viewport/scroll |


| 2026-11-21 | FIX14 user feedback: same old parser error screenshot | Evidence retained; likely stale launcher/script was executed because screenshot shows expression absent from FIX14 payload | FIX15 adds build marker and removes call-operator expressions |
| 2026-11-21 | FIX15 PowerShell 5.1 hardening | Package prepared; Windows validation pending | Run only the launcher in FIX15 archive and verify visible build marker |

| 2026-11-21 | FIX16 manual screenshot review | Parser failure confirmed; screenshot retained; fix package prepared | Run FIX16 and confirm visible build ID `R2-HF20-FIX16`; return feedback ZIP/clipboard evidence |
| 2026-11-21 | FIX17 release notes and verification baseline | Complete in archive copy: 37 JS syntax checks, 84/84 tests, 118/118 release-manifest entries; `npm run verify` exit 0 | Windows launcher still unverified; next isolate the Site Works Brave smoke test from launcher work |

| 2026-11-21 | FIX18 Skillset-OS engineering-method integration | Implemented in archive; automated governance checks pending verification | Added project-specific AI development protocol and rules, wired a governance checker into `npm run verify`, and added checker regression tests. No application feature behaviour intentionally changed. |

| 2026-11-21 | FIX18 offline verification | PASS — 87/87 tests, 39 JavaScript files, 125 release-manifest files, governance checker and negative cases | `npm run verify` exit 0 in Node.js 22.16.0/Linux. Windows PowerShell 5.1, Brave and Steam remain untested. |


## Canonical TODO consolidation — 2026-11-21

| Work item | Status | Evidence / next action |
|---|---|---|
| Full outstanding-work audit and canonical backlog | Complete in FIX18 TODO update | `docs/PROJECT_TODO.md` consolidates 20 sequenced work items, dependencies, ownership, status and acceptance criteria. |
| Launcher identity reconciliation | Open | Archive is labelled FIX18; visible and embedded launcher payload still identify FIX16. See TODO-001. |
| R2 live acceptance | Open | Brave, Steam, Windows helper and storage recovery gates remain unproven. See TODO-003–008. |
| Owner decisions | Open | Toolbox, host permissions and historical packaging require explicit decisions. See TODO-010–012. |

The canonical backlog supersedes the fragmented TODO plan summary above for current task ordering. Historical status entries are retained as dated records, not treated as current acceptance evidence.

| 2026-11-21 | FIX19 canonical TODO consolidation | Complete in archive; `npm run verify` PASS (87 tests, 39 JS files, 127 manifest files) | `docs/PROJECT_TODO.md`; helper self-test BLOCKED because pwsh is unavailable; Windows/Brave/Steam remain untested. |


## FIX20 — Documentation framework consolidation (2026-11-21)

- Replaced the scattered handover documents with `docs/README.md` as the documentation entry point.
- Established `docs/PROJECT_TODO.md` as the sole active backlog; progress log, release notes, acceptance matrix and decision/experiment registers now have distinct roles.
- Consolidated the launcher workflow and mandatory screenshot/evidence protocol into `docs/operations/ANDREW_NEXT_TASK.md`; retained prior launcher iteration notes in `docs/history/LAUNCHER_CHANGE_HISTORY.md`.
- Consolidated architecture, component and data terminology references into `docs/architecture/ARCHITECTURE_REFERENCE.md`.
- Consolidated AI development procedure and project-specific engineering rules into `docs/engineering/ENGINEERING_STANDARD.md`.
- Removed redundant handover copies, obsolete protocol duplicates, superseded FIX14/FIX16 notes and a stale FIX16 checksum manifest. Release notes, Git history, specialist operational references, acceptance matrix, security review, architecture deep dive, decision/experiment registers and chronological step records remain.
- Added Andrew's Windows screenshot as `docs/evidence/launcher-parse-error-2026-11-21.png`.
- Updated TODO-001 to BLOCKED with the observed PowerShell parser failure. The launcher is not claimed fixed; code changes are outside this documentation-only pass.
- No application/runtime source files were intentionally changed.


## FIX21 — One-paste feedback contract (documentation-only) — 2026-11-21

- Added `docs/operations/FEEDBACK_LOOP_CONTRACT.md` as the detailed specification for the Andrew Next Task evidence exchange.
- Defined the FINAL FEEDBACK CAPSULE that must be visible in the final screenshot, plus a unique run folder containing `run.txt`, `run.json`, `final-screen.png` and `manifest.sha256`.
- Defined ordered launcher stages, fail-fast/NOT RUN semantics, environment and command evidence, clipboard read-back verification, manual screenshot fallback and redaction rules.
- Defined the assistant's intake obligations: identify the run, diagnose the earliest failure, request only materially missing evidence, preserve manual requests, update the canonical backlog and return one exact next action.
- Updated the root handover pointer, operator guide, documentation index, engineering standard and TODO-001 to use the same contract. No launcher or application source code was changed.
- **Current state remains BLOCKED:** the supplied Windows run failed during PowerShell parsing. Documentation alone cannot make the existing batch launcher produce the specified evidence. Next implementation step is to repair the generated PowerShell payload, then implement and validate this contract on Windows PowerShell 5.1.

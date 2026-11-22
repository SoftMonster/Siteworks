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


## FIX22 — Text-first clipboard hand-off correction (2026-11-21)

- Andrew pasted the clipboard result and it arrived as a single screenshot image. This is visual evidence only; it did not transfer the feedback report or the locally-created feedback ZIP.
- Review of the FIX21 embedded launcher confirms it attempts to place both image and text formats on the Windows clipboard and verifies their presence locally. That verification does not establish which format ChatGPT receives on paste.
- Corrected the feedback contract: the normal clipboard payload must be plain text only, containing a self-contained diagnostic report. Clipboard text must be read back and compared with the intended report.
- Clarified that screenshots, full transcript, JSON and feedback ZIP remain local supporting artifacts. A path displayed in pasted text is not file transfer; ChatGPT can inspect a bundle only when Andrew actually attaches it.
- Updated the operator guide, root hand-off instructions and TODO-001. The latest screenshot establishes the same parser failure and image-only paste; it does not establish whether the clipboard was cleared, whether a feedback ZIP exists, or whether downstream checks ran.
- No launcher or application source code was changed. The feedback loop remains BLOCKED pending implementation and Windows PowerShell 5.1 validation.


## FIX23 — Plain-text-only feedback implementation candidate (2026-11-21)

- Removed the evidence-board rendering and combined image+text clipboard path from the launcher payload.
- Added a text-only feedback report containing run/build identity, environment metadata, local artifact paths and the full captured transcript.
- Added exact clipboard text read-back comparison; clipboard failure retains the local report and prints its path.
- Added `run.json`, final screenshot copy, SHA-256 manifest and local feedback ZIP generation.
- Updated the operator guide, feedback contract and canonical TODO.
- Not yet verified on Windows PowerShell 5.1; actual ChatGPT paste remains an acceptance gate.


### FIX23 follow-up hardening

- Added a parser preflight to the small encoded batch bootstrap. The payload is decoded as UTF-16LE, written with a Unicode BOM, parsed using the PowerShell AST parser, and only executed when there are no parse errors. Parser failures produce a separate text report and clipboard read-back attempt before exit.
- Removed all image clipboard operations from the normal payload. Screenshots remain local evidence.
- Added first-failure/warning excerpts, bounded transcript-tail handling, and redaction of Windows profile path fragments from the pasted report.
- Added three launcher contract regression tests. Static verification currently passes; Windows PowerShell 5.1 and actual ChatGPT paste remain unverified.


## FIX24 — repair from first structured Windows diagnostic (2026-11-21)

- Andrew returned a plain-text `LAUNCHER PARSE FAILURE` report from Windows PowerShell 5.1.26100.9818, RUN ID `173357c1-7908-4934-a4be-7ce3ca639e64`.
- The bootstrap parser preflight worked: it stopped before executing the malformed embedded launcher and reported precise line/column diagnostics.
- Root cause: missing closing single quote in the diagnostic report array entry for `USER PROFILE`; the later `WINDOWS:` token and unmatched delimiters were cascading parser errors.
- FIX24 corrects the string, updates the launcher identity and adds a regression test for the exact defect.
- Still unverified: complete FIX24 PowerShell parse, normal launcher workflow, local artifact creation, clipboard read-back, and ChatGPT plain-text paste.


## FIX24 — first Windows execution evidence (2026-11-22)

- Andrew ran build `R2-HF20-FIX24` under Windows PowerShell 5.1.26100.9818. Parser preflight passed; launcher proceeded through deployment and reported `COMMANDS_COMPLETED_REVIEW_REQUIRED`.
- Backup and deployment Robocopy exit codes were 1 and 3; the launcher treats 0–7 as non-fatal. Deployment completed and backup was retained.
- Clipboard plain-text read-back was verified.
- Defect: `Start-Transcript -Path $log` held the same file that subsequent `Add-Content -LiteralPath $log` calls attempted to write. This caused repeated IOExceptions and noisy/incomplete event logging.
- FIX25 separates `$transcriptLog` from `$log`; transcript output is copied to `run.txt`, while writable launcher events are copied to `launcher-events.txt`. Both are retained as separate evidence.
- FIX25 Windows execution and ChatGPT plain-text paste acceptance remain pending.


## FIX25 — Windows feedback evidence (2026-11-22)

- Andrew returned run `8e3ed4c2-90da-488a-8cf8-43d844da2d28` using launcher build `R2-HF20-FIX25` under Windows PowerShell 5.1.26100.9818.
- Parser preflight passed; deployment completed; backup retained; Robocopy exit codes were 1 and 3 (non-fatal under the launcher's 0–7 rule).
- No repeated `Add-Content` file-lock warnings appeared. Clipboard plain-text read-back matched exactly.
- FIX25 outcome was `COMMANDS_COMPLETED_REVIEW_REQUIRED`; the transcript did not show a post-deployment `npm run verify`. Application-level live acceptance remains outstanding.

## FIX26 — deployed-project verification and outcome precision (2026-11-22)

- Added a post-deployment `npm run verify` stage against the deployed target when Node.js and `npm.cmd` are available. The exact exit code is captured; failure marks the run failed, and missing prerequisites are explicitly `NOT RUN`.
- Added explicit deployment, backup-copy, deployment-copy and project-verification fields to the text report and `run.json`. Outcome values now distinguish verified deployment, deployment-only, failure/blockage and cancellation.
- Corrected the toolchain branch's stale FIX23 identity warning to use the current launcher build dynamically.
- Added launcher regression tests for verification execution, exit-code capture and outcome classification.
- FIX25's Windows run is the evidence baseline; FIX26 still requires Andrew-side Windows execution. This offline archive does not establish PowerShell 5.1 acceptance or live Brave/Steam behaviour.


## FIX27 — opt-in Node.js prerequisite recovery (2026-11-22)

- Andrew returned FIX26 run `b14a4df5-d8f9-46d1-8632-ecdc0180b50b` under Windows PowerShell 5.1.26100.9818. Deployment completed; backup and deployment Robocopy exit codes were 1 and 3; clipboard read-back matched exactly.
- The new post-deployment check was correctly blocked because Node.js or `npm.cmd` was unavailable. The report did not establish that the machine lacked winget; it only established the runtime commands were not discoverable at verification time.
- FIX27 refreshes machine/user PATH and known Node.js install locations, then offers an explicit opt-in `winget` installation of Node.js LTS. It does not install software without an affirmative response.
- The report and `run.json` now include toolchain status and Node/npm versions. Declining installation or missing winget is reported as a blocked verification, not a deployment failure.
- Automated checks and offline archive integrity remain separate from Andrew-side PowerShell, toolchain and application acceptance.


## FIX27 — Windows deployment and project verification passed (2026-11-22)

- Andrew returned run `0e7c21fb-f784-40ad-a3ae-e5d00e8c4a4d` on Windows PowerShell 5.1.26100.9818.
- Deployment completed; backup and deployment Robocopy exit codes were 1 and 3 (non-fatal); backup retained.
- Node.js v26.13.1 and npm 11.20.0 were available after the explicit opt-in winget installation path.
- Deployed `npm run verify` exited 0: 40 JavaScript files syntax-checked; 96/96 tests passed; 125 manifest entries verified; project governance passed.
- Clipboard exact-text read-back verified.
- The report's first failure excerpt incorrectly selected a passing test title containing “failed”. This is a report-filter false positive; the test itself passed. No evidence of a project verification failure in this run.

## FIX28 — diagnostic classification and live-acceptance hand-off (2026-11-22)

- Excludes passing test names and informational package-manager notices from the actionable failure excerpt.
- Gives successful deployment + automated verification a precise outcome: `DEPLOYMENT_AND_PROJECT_VERIFY_PASSED_LIVE_ACCEPTANCE_PENDING`.
- Reports live application acceptance separately and explicitly; automated tests do not imply Brave, native helper, Steam or storage acceptance.
- Updates canonical TODO and operator handover from the stale FIX26/FIX27 instruction to the FIX28 report check followed by outstanding R2 acceptance work.


## FIX28 — Windows deployment and feedback-loop acceptance passed (2026-11-22)

- Andrew returned run `08e0cdcd-bb43-4e92-aa02-f719c09548bb` using launcher `R2-HF20-FIX28` on Windows PowerShell 5.1.26100.9818.
- Deployment completed; backup and deployment Robocopy exit codes were 1 and 3 (both non-fatal); backup retained.
- Node.js v26.13.1 and npm 11.20.0 were ready. Deployed `npm run verify` exited 0: 98/98 tests passed, 40 JavaScript files syntax-checked, 125 manifest entries verified and project governance passed.
- The corrected diagnostic excerpt reported no actionable error. Outcome explicitly remained `DEPLOYMENT_AND_PROJECT_VERIFY_PASSED_LIVE_ACCEPTANCE_PENDING`.
- Clipboard exact-text read-back verified, and the report arrived in ChatGPT as plain diagnostic text. Together with FIX27, this is the second consecutive successful Andrew-side hand-off; TODO-001 launcher/feedback-loop acceptance is closed.
- Transcript test glyphs appear as `Ô£ö`/`Ôä╣` in the pasted copy. Counts and exit status are intact; treat as a minor encoding/readability observation, not a test failure.
- Live application acceptance remains open: Brave/Chromium, native helper, Steam inventory/price behaviour and storage recovery have not been evidenced by this run.

## FIX29 — close feedback-loop gate and move to live acceptance (2026-11-22)

- Documentation/backlog hand-off only; no application behaviour changed.
- TODO-001 marked DONE based on the two consecutive FIX27/FIX28 Windows runs and actual plain-text ChatGPT hand-offs.
- TODO-002 moved to IN PROGRESS: runtime prerequisites and project verification are confirmed; Git working-tree/provenance evidence remains.
- Next operator action is TODO-003: clean-profile Brave/Chromium smoke test. Do not reinstall Node.js or repeat the launcher test unless a launcher defect is observed.

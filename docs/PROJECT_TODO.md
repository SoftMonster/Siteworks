# Site Works — Canonical Project TODO and Acceptance Backlog

**Baseline inspected:** 1.6.9 · R2 Hotfix 20 · feedback-loop implementation FIX29  
**Backlog date:** 2026-11-22 (updated from consecutive FIX27/FIX28 Windows PowerShell 5.1 runs)  
**Authority:** This is the single prioritised execution backlog. Older roadmap, handover, technical-debt and historical task records remain useful evidence, but this file controls current task ordering.  
**Product status:** R2 is implemented in substantial part, but is **not accepted as complete**. No R3–R7 implementation is authorised by this backlog.

## How to use this backlog

- Statuses: **OPEN**, **BLOCKED**, **IN PROGRESS**, **DONE**, **DEFERRED**, **OWNER DECISION**.
- A task is DONE only when its stated acceptance evidence exists in the project. Source inspection, passing offline tests, a prepared archive or a successful command exit code alone do not prove live behaviour.
- Keep evidence in `docs/evidence/` or the relevant dated `docs/history/` folder. Redact account IDs, personal paths, tokens and private inventory data.
- Work in dependency order. Do not skip a blocker merely because a later task is easier.
- Preserve the default-deny/hash-bound permission model, Steam request pacing, stop-on-429 behaviour, user confirmation for consequential actions, `.git`, user data and the stable launcher filename.
- Every project-changing iteration updates this backlog, `PROJECT_PROGRESS_LOG.md`, the dated history record and the next-task handover. The primary hand-off is a verified plain-text clipboard report; screenshots and the feedback ZIP are supporting local artifacts and are not transferred by pasting a clipboard image.

## P0 — Restore a trustworthy next-task feedback loop

### TODO-001 — Repair launcher and establish text-first one-paste diagnostics
**Status:** DONE · **Priority:** P0 · **Owner:** Maintainer (implementation) + Andrew (Windows acceptance)

**Finding:** FIX25 Windows run `8e3ed4c2-90da-488a-8cf8-43d844da2d28` (PowerShell 5.1.26100.9818) passed parser preflight and completed deployment. The backup was retained; Robocopy exit codes were 1 and 3 (within the launcher's 0–7 non-fatal range); no transcript/event-log file-lock warnings appeared; clipboard plain-text read-back matched exactly. Its generic `COMMANDS_COMPLETED_REVIEW_REQUIRED` outcome did not establish whether the deployed project's automated checks had run. FIX26 adds a post-deployment `npm run verify` stage and records deployment, backup/deployment Robocopy, and project-verification states and exit codes independently. A successful automated check remains distinct from live Brave, helper and Steam acceptance.

**Actions:**
1. FIX25 Windows run confirms parser preflight, deployment and clipboard read-back; no file-lock warnings were present. FIX26 runs `npm run verify` against the deployed target and records its exact exit code. Re-run the full workflow on Windows PowerShell 5.1.
2. Reconcile archive, visible launcher, embedded payload and extracted project build IDs.
3. FIX23 implements **plain-text-only** `feedback-report.txt` delivery.
4. Include build/run identity, environment, ordered stage results, exact commands, exit codes, first actionable failure, concise output excerpts, redactions and local artifact paths in the clipboard report.
5. FIX23 copies plain text only and verifies exact read-back equality. Do not use image presence as the success criterion.
6. Preserve existing clipboard contents until the final report is ready. On copy/verification failure, retain the report locally and state the failure.
7. Save `run.txt`, `run.json`, `final-screen.png`, relevant screenshots, `manifest.sha256` and `feedback-bundle.zip` in a unique run folder. Clearly distinguish local files from content transferred by clipboard paste.
8. Keep screenshot evidence local by default. Ask Andrew to attach the feedback ZIP or a named screenshot only when the pasted text report is insufficient.
9. Test success, parser failure, command failure, missing optional tools and clipboard failure. Dependent stages must be `NOT RUN` or `BLOCKED`, never falsely green.
10. Update the operator guide and feedback contract to match actual behaviour. Deliver one corrected archive and one exact run instruction. FIX25 regression assertions cover separate transcript/event logs. FIX26 adds regression assertions for post-deployment verification and truthful outcome classification. FIX27 adds opt-in Node.js prerequisite recovery and toolchain evidence.

**Acceptance:** exact generated payload parses under Windows PowerShell 5.1; build identities agree; no transcript/event-log sharing errors occur; both logs and required artifacts are created; clipboard contains only the complete plain-text report and read-back verification matches; a ChatGPT paste arrives as diagnostic text; forced failures are reported accurately; clipboard failure leaves a readable local report; two consecutive Andrew-side runs complete the hand-off; no secrets or unnecessary personal identifiers are exposed. FIX27 and FIX28 now provide two consecutive Andrew-side Windows PowerShell 5.1 runs with successful parser preflight, deployment, deployed `npm run verify` exit 0, exact plain-text clipboard read-back and successful ChatGPT text-paste hand-off. FIX27: 96/96 tests; FIX28: 98/98 tests; both: 40 JavaScript syntax files, 125 manifest entries and governance pass. FIX28 also confirms the corrected no-actionable-error excerpt and explicit live-acceptance-pending outcome. TODO-001 is DONE: the launcher/feedback loop acceptance criteria are met. This does not accept the Site Works product or close TODO-003–007.

### TODO-002 — Establish the local development prerequisites
**Status:** IN PROGRESS · **Priority:** P0 · **Owner:** Andrew

**Actions:** Confirm Windows version, PowerShell 5.1 availability, Node.js >=18, npm and Git. If tools are missing, use the installer's explicit opt-in path only after reviewing the prompt. Do not bypass policy or silently install software.

**Acceptance:** launcher log records executable paths and versions; `npm run verify` can execute from the intended working repository; Git working-tree state is recorded without altering it.

### FIX26 Windows evidence and FIX27 next action (2026-11-22)
- FIX26 run `b14a4df5-d8f9-46d1-8632-ecdc0180b50b`: deployment completed, Robocopy codes 1/3, no obvious transcript errors, clipboard read-back verified. `npm run verify` did not run because Node.js or `npm.cmd` was unavailable.
- FIX27 refreshes PATH and asks permission before installing Node.js LTS through winget. No software is installed unless Andrew answers Y.
- **Next action:** run FIX27's `Andrew_next_task.bat`; if prompted, choose Y only if Node.js LTS installation is acceptable. Paste the resulting report. If N, the report should record the declined installation and blocked verification.

## FIX27/FIX28 Windows acceptance evidence and FIX29 next action (2026-11-22)
- FIX27 run `0e7c21fb-f784-40ad-a3ae-e5d00e8c4a4d`: deployed project verification passed (96/96 tests, 40 JavaScript files, 125 manifest entries, governance pass); clipboard exact-text read-back verified.
- FIX28 run `08e0cdcd-bb43-4e92-aa02-f719c09548bb`: deployment completed; Robocopy exit codes 1/3 were non-fatal; Node.js v26.13.1/npm 11.20.0 ready; deployed verification exit 0; 98/98 tests, 40 JavaScript files, 125 manifest entries and governance passed; clipboard exact-text read-back verified.
- FIX28 correctly reported no actionable error and `DEPLOYMENT_AND_PROJECT_VERIFY_PASSED_LIVE_ACCEPTANCE_PENDING`. The two consecutive runs complete TODO-001 launcher/feedback-loop acceptance.
- The pasted FIX28 transcript renders Node test checkmarks as mojibake (`Ô£ö`/`Ôä╣`) in this copy. Test totals and exit status are intact; this is a transcript text-encoding/presentation issue, not a failed test. Preserve as a minor diagnostic readability observation; do not change runtime behaviour without reproducible evidence.
- **Next action:** TODO-003 clean-profile Brave/Chromium smoke test. Then TODO-004 native-helper Windows acceptance, TODO-005/006 Steam inventory and price acceptance, and TODO-007 storage failure-injection evidence. Do not reinstall Node.js. Keep R2 release blocked until TODO-008 owner decision.

## P1 — Complete R2 live acceptance (release blocker)

### TODO-003 — Run the clean-profile Brave/Chromium smoke test
**Status:** OPEN · **Priority:** P1 · **Owner:** Andrew

**Actions:** Load the unpacked extension in a clean/test browser profile; confirm manifest/build identity; inspect extension errors; test popup, Manage, pause/on-off controls, context menu and keyboard shortcuts. Confirm a script is not run before approval, rejection blocks it, remembered approval is scoped correctly, and a changed script hash requests approval again.

**Acceptance:** dated evidence records OS, browser/version, extension identity, each case, observed result and relevant screenshots/logs. Do not use the production profile as the only test environment.

### TODO-004 — Validate native helper on Windows PowerShell 5.1
**Status:** OPEN · **Priority:** P1 · **Owner:** Andrew + Maintainer

**Actions:** Run `Install file helper.cmd`; reload the extension; confirm Manage reports Connected; exercise ping, hosts, rebuild and a throwaway script write/edit/trash/reveal workflow where safe. Run `npm run helper-selftest` under Windows PowerShell 5.1. Confirm generated native-host registration is per-machine and absent from source control/release payload.

**Acceptance:** Windows PowerShell 5.1 self-test passes; real native-messaging connection works; valid operations work; hostile paths/messages are refused; no write escapes the approved `sites` root; evidence and residual limitations are recorded. Linux/PowerShell 7 evidence does not close this task.

### TODO-005 — Execute the R2 inventory synchronisation acceptance matrix
**Status:** OPEN · **Priority:** P1 · **Owner:** Andrew + Maintainer

**Actions:** Work through every row in `docs/quality/R2_ACCEPTANCE_MATRIX.md` using a small, known Steam inventory first. Verify the native loader and next-batch flow; multi-batch journal/Filedata persistence; complete-state criteria; partial stop/error/refresh/reload/resume; unknown quantities/descriptions; read-only search/sort/filter; and that price enrichment is independent of inventory acquisition.

**Acceptance:** each matrix row has PASS/FAIL/BLOCKED/SKIPPED/NOT TESTED plus dated evidence. Compare counts and known inventory facts; inspect journal and Filedata after at least two batches. Do not label partial data complete. Do not run bulk sell, listing removal or other consequential operations during acceptance.

### TODO-006 — Validate market-price enrichment and throttling safely
**Status:** OPEN · **Priority:** P1 · **Owner:** Andrew + Maintainer

**Actions:** On a small controlled dataset, confirm numeric app IDs, price parsing, currency/source/timestamp, persistence, freshness and legacy-record merge. Confirm a price failure does not invalidate inventory. Respect endpoint-specific cooldowns. Do not deliberately hammer Steam or force a 429; use fixtures/mocks for negative-path tests and observe live throttling only if it occurs naturally.

**Acceptance:** saved observations reload correctly; missing/stale/unknown values remain explicit; legacy data is preserved; 429/access-block states stop requests without automatic retry; explicit user restart is required after cooldown.

### TODO-007 — Prove storage recovery and replay safety
**Status:** OPEN · **Priority:** P1 · **Owner:** Maintainer

**Actions:** Add or extend deterministic failure-injection tests around IndexedDB journal commit, localStorage projection, interruption between stores, replay, duplicate batches, refresh and recovery. Test with copied fixtures, not Andrew's production browser data.

**Acceptance:** idempotent replay; no false complete state; committed batches remain recoverable; projection can be rebuilt/reconciled; failure states are visible; recovery instructions and tests are documented. This closes TD-03 only when evidence is repeatable.

### TODO-008 — Close the R2 acceptance decision
**Status:** BLOCKED by TODO-003–007 · **Priority:** P1 · **Owner:** Release owner

**Actions:** Reconcile all matrix rows, open defects and residual risks. Record the exact tested archive, commit/tag, environment, operator, date and evidence references. Decide whether any failures block release or require documented limitations.

**Acceptance:** signed/explicit release-owner decision; no critical data-integrity or safety defect open; matrix and project progress agree. Only then may R3 discovery be scheduled.

## P2 — Security, compatibility and maintainability

### TODO-009 — Formalise the Steam page adapter boundary
**Status:** OPEN · **Priority:** P2 · **Owner:** Maintainer

**Actions:** Document the Steam globals/methods/selectors used, capability detection, expected data shapes, failure modes and fallback behaviour. Add fixtures for missing/changed globals, malformed descriptions, pagination changes and blocked requests. Fail closed with visible diagnostics when required capabilities are absent.

**Acceptance:** adapter contract and fixture tests exist; live compatibility evidence is linked; no fabricated completion or silent fallback.

### TODO-010 — Review `<all_urls>` host permission
**Status:** OWNER DECISION · **Priority:** P2 · **Owner:** Product owner + Maintainer

**Actions:** Document why broad host access is needed for user-selected scripts. Assess whether optional host permissions can preserve the existing folder routing and approval UX without breaking supported workflows. Do not narrow permissions until a migration and compatibility plan exists.

**Acceptance:** recorded decision with alternatives, user impact, security rationale and tests. Manifest changes require explicit approval and regression coverage.

### TODO-011 — Resolve toolbox UI/implementation mismatch
**Status:** OWNER DECISION · **Priority:** P2 · **Owner:** Andrew

**Finding:** UI wiring exists, while `sites/00-toolbox.js` is retired as `.old`; the technical-debt register says the toolbox action currently shows a notice.

**Actions:** Choose restore or remove. If restore, recover/modernise the toolbox under current permission and test rules. If remove, remove dead menu/shortcut/UI affordances and update documentation. Do not silently choose on the owner's behalf.

**Acceptance:** explicit decision; no misleading dead-end control; behaviour and docs agree; relevant browser tests/evidence.

### TODO-012 — Decide packaging policy for `.old` and `trash/`
**Status:** OWNER DECISION · **Priority:** P2 · **Owner:** Andrew

**Actions:** Decide whether archived `.old` scripts and `trash/` are excluded from release ZIPs while remaining in Git history, or intentionally shipped. Preserve history and user material; do not delete without approval.

**Acceptance:** documented inclusion/exclusion policy and repeatable packaging check.

### TODO-013 — Reconstruct hotfix provenance where evidence exists
**Status:** OPEN · **Priority:** P2 · **Owner:** Maintainer

**Finding:** the rescue record says the 1.5.0→1.6.9 hotfix series was committed as a snapshot rather than as individual historical commits; release notes are the main per-hotfix record.

**Actions:** Preserve the existing history. Build a provenance table mapping each release-note hotfix to files/evidence where Git or retained history supports it. Mark unavailable details unknown; do not fabricate commits or dates.

**Acceptance:** provenance table distinguishes verified history, release-note-only claims and unknowns; no rewriting Git history.

### TODO-014 — Keep documentation and acceptance evidence current
**Status:** IN PROGRESS · **Priority:** P2 · **Owner:** Maintainer

**Actions:** Keep this TODO, progress log, R2 matrix, technical-debt register, handover evidence and README aligned. Update stale HF19 references where they describe the current baseline, while preserving historical references when clearly labelled. Regenerate release notes and checksum manifest using project scripts after relevant changes.

**Acceptance:** one current baseline identity; historical records remain historically accurate; generated files pass checks; each open task has a clear next action and evidence requirement.

### TODO-015 — Reassess the large inventory module after R2 acceptance
**Status:** DEFERRED · **Priority:** P2 · **Owner:** Maintainer

**Actions:** After TODO-008 only, map responsibilities in the large inventory script and propose a test-led modular split. Do not refactor before live acceptance or without regression coverage.

**Acceptance:** approved design, dependency map, tests and rollback plan before refactoring.

## P3 — Future product roadmap (not approved for implementation)

### TODO-016 — Specify R3 Market Intelligence & Trading
**Status:** DEFERRED · **Priority:** P3 · **Gate:** TODO-008

Define requirements, sources, currencies, retention, liquidity assumptions, cooldowns, safety confirmations and acceptance tests before any implementation.

### TODO-017 — Specify R4 Badge & Collection Management
**Status:** DEFERRED · **Priority:** P3 · **Gate:** R2 accepted and R4 requirements approved

Define badge/set sources, ownership versus catalogue semantics, quantities, unknown states and user-confirmed actions.

### TODO-018 — Specify R5 Steam Library Intelligence
**Status:** DEFERRED · **Priority:** P3 · **Gate:** privacy/data-source review and product approval

Define supported sources, privacy scope, provenance, timestamps and separation from trading inventory.

### TODO-019 — Specify R6 Automation & Data Management
**Status:** DEFERRED · **Priority:** P3 · **Gate:** R2 reliability evidence

Define durable job state, scheduling/cancellation consent, bounded requests, backup/export/import, migrations, retention and recovery.

### TODO-020 — Specify R7 Unified Steam Command Centre
**Status:** DEFERRED · **Priority:** P3 · **Gate:** stable R2–R6 contracts

Define navigation, dashboard aggregation, accessibility and domain isolation. Dashboard must not silently trigger operations or hide partial/blocked/stale states.

## FIX27 Windows evidence and FIX28 next action (2026-11-22)
- FIX27 run `0e7c21fb-f784-40ad-a3ae-e5d00e8c4a4d` on Windows PowerShell 5.1.26100.9818: deployment completed; Robocopy exit codes 1 and 3; Node.js 26.13.1 and npm 11.20.0 ready; deployed `npm run verify` exit 0; 96/96 tests passed; 40 JavaScript files checked; 125 manifest entries verified; governance passed; clipboard exact-text read-back verified.
- The report's first “failure/warning” excerpt selected a successful test title containing the word “failed” (“failed navigation or incomplete content preserves the current resume page”). This is a diagnostic-classification defect, not a test failure. FIX28 excludes test names and informational notices from actionable-error excerpts.
- FIX28 changes the successful outcome label to `DEPLOYMENT_AND_PROJECT_VERIFY_PASSED_LIVE_ACCEPTANCE_PENDING`, explicitly records live acceptance as pending, and updates the handover to the next real acceptance work.
- **Next action:** run FIX28 once to verify the corrected outcome/excerpt. Then proceed with TODO-003 Brave clean-profile smoke test, TODO-004 native-helper Windows PowerShell 5.1 test, TODO-005/006 Steam inventory and price acceptance, and TODO-007 storage failure-injection evidence. Do not repeat toolchain installation; Node/npm are now present.

## Completion dashboard

| Workstream | Status | Exit condition |
|---|---|---|
| Launcher / feedback loop | DONE | FIX27 and FIX28 consecutive Windows runs; deployed verification and exact text hand-off passed |
| Local toolchain | IN PROGRESS | Node 26.13.1/npm 11.20.0 and `npm run verify` exit 0 recorded; Git working-tree state remains to be verified |
| Brave smoke test | OPEN | Clean-profile browser evidence |
| Native helper | OPEN | Windows PowerShell 5.1 self-test + live native messaging |
| R2 inventory / price acceptance | OPEN | Every R2 matrix row evidence-backed |
| Storage recovery | OPEN | Failure-injection and replay tests pass |
| R2 release decision | BLOCKED | All prerequisite gates closed and owner sign-off |
| Security/product decisions | OWNER DECISION / OPEN | Explicit decisions and evidence |
| R3–R7 | DEFERRED | Approved specifications after R2 acceptance |

---

**Backlog maintenance rule:** every future iteration must update this file's statuses and current next action. Do not create a competing TODO list; link to this file from other documents instead.

# Site Works — Canonical Project TODO and Acceptance Backlog

**Baseline inspected:** 1.6.9 · R2 Hotfix 20 · TODO consolidation FIX19; documentation framework FIX20  
**Backlog date:** 2026-11-21 (updated after Windows launcher failure evidence)  
**Authority:** This is the single prioritised execution backlog. Older roadmap, handover, technical-debt and historical task records remain useful evidence, but this file controls current task ordering.  
**Product status:** R2 is implemented in substantial part, but is **not accepted as complete**. No R3–R7 implementation is authorised by this backlog.

## How to use this backlog

- Statuses: **OPEN**, **BLOCKED**, **IN PROGRESS**, **DONE**, **DEFERRED**, **OWNER DECISION**.
- A task is DONE only when its stated acceptance evidence exists in the project. Source inspection, passing offline tests, a prepared archive or a successful command exit code alone do not prove live behaviour.
- Keep evidence in `docs/evidence/` or the relevant dated `docs/history/` folder. Redact account IDs, personal paths, tokens and private inventory data.
- Work in dependency order. Do not skip a blocker merely because a later task is easier.
- Preserve the default-deny/hash-bound permission model, Steam request pacing, stop-on-429 behaviour, user confirmation for consequential actions, `.git`, user data and the stable launcher filename.
- Every project-changing iteration updates this backlog, `PROJECT_PROGRESS_LOG.md`, the dated history record and the next-task handover. Keep the final Windows screenshot-to-clipboard step in the launcher and verify that the clipboard contains an image; retain text logs if clipboard capture fails.

## P0 — Restore a trustworthy next-task feedback loop

### TODO-001 — Reconcile launcher build identity and verify the Windows launcher
**Status:** BLOCKED · **Priority:** P0 · **Owner:** Maintainer (repair) + Andrew (machine acceptance)

**Finding:** Earlier FIX18/FIX19 records identified an archive/launcher build-identity mismatch. New direct Windows evidence from Andrew on 2026-11-21 supersedes the assumption that identity reconciliation alone is the next step: the launcher now demonstrably fails during PowerShell parsing. The screenshot reports `The ampersand (&) character is not allowed` at generated temporary script line 139, character 36, followed by cascading missing-parenthesis/brace and unexpected-token errors; the process exits with code 1. The exact source expression must be traced in the launcher generator/payload. Treat all downstream diagnostics as not executed until parsing succeeds.

**Actions:**
1. Establish the one-paste feedback contract in `docs/operations/FEEDBACK_LOOP_CONTRACT.md` as the acceptance specification for all future launcher work. The console screenshot must contain a compact final feedback capsule; full diagnostics must be retained in a unique run folder as `run.txt` and `run.json`. Do not assume ChatGPT paste preserves both image and text clipboard formats.
2. Trace the reported generated-script line back to the source launcher; inspect the surrounding expression and quoting/escaping. Correct the parser defect, then run a Windows PowerShell 5.1 parser check against the exact generated payload.
3. Regenerate the launcher from its source-of-truth script, setting one consistent build identity matching the next archive.
4. Ensure the launcher still detects its own path safely, supports Windows PowerShell 5.1 syntax, creates a timestamped transcript, captures meaningful screenshots and attempts to place the final screenshot on the Windows clipboard.
5. Preserve existing clipboard content at startup; clear it only when already empty, as specified by the project protocol.
6. Verify clipboard image presence rather than merely reporting that capture was attempted. Retain the text log and report clipboard failure plainly.
7. Check embedded payload round-trip, marker uniqueness, ZIP integrity and the stable launcher filename.
8. Andrew runs the exact repaired launcher from the delivered archive on Windows and returns the log plus clipboard screenshot (or a manual screenshot if clipboard capture fails).

**Acceptance:** exact generated payload parses under Windows PowerShell 5.1; the feedback capsule contains all required run/build/environment/stage/exit-code/first-error/log-path fields; unique run folder contains `run.txt`, `run.json`, `final-screen.png` and `manifest.sha256`; clipboard image read-back succeeds; Andrew can paste the expected image into ChatGPT; failure fallback is explicit; visible and logged build ID matches the archive; no parser error; diagnostics identify Node/npm/Git accurately; screenshot file/image is verified on clipboard or failure is explicit; transcript and output are retained. No automatic installation: any winget install remains opt-in.

### TODO-002 — Establish the local development prerequisites
**Status:** BLOCKED pending TODO-001 feedback · **Priority:** P0 · **Owner:** Andrew

**Actions:** Confirm Windows version, PowerShell 5.1 availability, Node.js >=18, npm and Git. If tools are missing, use the installer's explicit opt-in path only after reviewing the prompt. Do not bypass policy or silently install software.

**Acceptance:** launcher log records executable paths and versions; `npm run verify` can execute from the intended working repository; Git working-tree state is recorded without altering it.

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

## Current next action

**Maintainer: repair the PowerShell parser failure shown in Andrew's 2026-11-21 screenshot, then validate the exact generated launcher under Windows PowerShell 5.1.** Andrew should not rerun the known-broken launcher. Once a corrected archive is supplied, Andrew runs that exact launcher and returns its transcript and clipboard screenshot (or a manual screenshot if clipboard capture fails). If the local toolchain is missing, record that as a separate blocker; do not manually edit source or manifests.

## Completion dashboard

| Workstream | Status | Exit condition |
|---|---|---|
| Launcher / feedback loop | OPEN | Matching build identity + Windows PowerShell 5.1 run + screenshot/clipboard evidence |
| Local toolchain | BLOCKED pending launcher feedback | Node/npm/Git versions and `npm run verify` evidence |
| Brave smoke test | OPEN | Clean-profile browser evidence |
| Native helper | OPEN | Windows PowerShell 5.1 self-test + live native messaging |
| R2 inventory / price acceptance | OPEN | Every R2 matrix row evidence-backed |
| Storage recovery | OPEN | Failure-injection and replay tests pass |
| R2 release decision | BLOCKED | All prerequisite gates closed and owner sign-off |
| Security/product decisions | OWNER DECISION / OPEN | Explicit decisions and evidence |
| R3–R7 | DEFERRED | Approved specifications after R2 acceptance |

---

**Backlog maintenance rule:** every future iteration must update this file's statuses and current next action. Do not create a competing TODO list; link to this file from other documents instead.

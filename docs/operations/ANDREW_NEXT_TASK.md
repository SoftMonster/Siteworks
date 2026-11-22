# Andrew Next Task — Operator Guide

**Stable entry point:** `Andrew_next_task.bat`  
**Purpose:** run one repeatable diagnostic workflow and return its results with one clipboard paste.

## Current state

The feedback loop is **not accepted**. Andrew's latest supplied message contains a screenshot of the same PowerShell parser failure, not a pasted diagnostic text report or an attached feedback ZIP. It confirms only that the visible run failed with the reported ampersand parser error and exit code 1. It does not establish whether the clipboard was cleared, whether the feedback ZIP was created, or whether later diagnostics ran.

The previous design verified that Windows clipboard contained both image and text formats, then pasted an image into ChatGPT. This is not a reliable text hand-off. The contract has therefore changed to **plain-text-first clipboard delivery**.

## Operator procedure (once a corrected launcher is issued)

1. Extract the newest archive fully to a normal folder.
2. Run the stable root file `Andrew_next_task.bat`.
3. Wait for the final feedback report and clipboard verification result.
4. Paste the clipboard contents directly into your next ChatGPT response.
5. Add any manual requests in ordinary language in the same message.
6. If the clipboard paste appears as an image, the text transfer did not succeed. Send the screenshot if useful; do not assume the feedback ZIP was transmitted.
7. Attach the feedback ZIP only when ChatGPT specifically requests it or the report says an artifact is required.

You should not need to interpret errors, locate log files, or explain technical output.

## What a successful run returns

The clipboard must contain a self-contained plain-text `feedback-report.txt` with archive/run identity, environment, stage results, commands, exit codes, first actionable error, concise log excerpts and local artifact paths. The launcher must read the clipboard text back and verify it.

The local run folder under `%TEMP%\\SiteWorks-Diagnostics\\<run-id>\\` retains `run.txt`, `run.json`, `final-screen.png`, screenshots, hashes and (where possible) `feedback-bundle.zip`. A local path is not an attachment; ChatGPT cannot inspect it until the file is actually uploaded.

## Current blocker

The supplied Windows screenshot records:
- `The ampersand (&) character is not allowed` in a generated temporary PowerShell script;
- cascading missing-parenthesis/brace and unexpected-token parser errors;
- process exit code 1.

This is a confirmed parser failure. It does not prove the clipboard was cleared or that a feedback archive exists. Do not rerun the same known-failing build. TODO-001 owns the repair and acceptance work.

## Safety

- No Administrator elevation or silent prerequisite installation.
- No Git reset, clean, checkout, commit, push or remote publication without explicit approval.
- No destructive browser/Steam data changes.
- No automatic Steam retry after HTTP 429.
- Preserve existing clipboard content until the final plain-text report is ready.
- Redact secrets, session tokens and unnecessary account identifiers.

## Maintainer responsibilities

Before issuing the next archive:
1. Repair and validate the actual generated PowerShell payload under Windows PowerShell 5.1.
2. Implement text-only clipboard delivery of the full diagnostic report.
3. Verify clipboard text by read-back equality/hash, not by checking only that text exists.
4. Save screenshots and a complete feedback ZIP locally; do not imply these are transferred by paste.
5. Test the clipboard failure fallback and preserve existing clipboard data.
6. Reconcile archive, launcher and payload build IDs.
7. Run offline regression checks and update TODO/progress evidence.
8. Give Andrew one exact next action.

The detailed specification and acceptance criteria are in [`FEEDBACK_LOOP_CONTRACT.md`](FEEDBACK_LOOP_CONTRACT.md).


## FIX23 hand-off
The launcher copies only the complete plain-text diagnostic report to the clipboard. It verifies exact read-back equality. Screenshots and `feedback-bundle.zip` remain local supporting artifacts. If verification fails, open `feedback-report.txt` from the printed run folder and copy its contents manually.


## FIX23 test instruction
Use only the FIX23 archive's `Andrew_next_task.bat`; do not use an older extracted launcher. The launcher now runs a PowerShell parser preflight before executing its main payload. If parsing fails, it attempts to put a compact plain-text parser report on the clipboard and writes the same report to `%TEMP%`. On a normal run it produces a text-only report, verifies exact clipboard read-back, and saves screenshots plus a feedback ZIP locally. Paste the clipboard directly into ChatGPT. If clipboard verification fails, open the printed `feedback-report.txt` path and copy its contents manually.


## FIX24 — parser defect repair
Andrew returned the FIX23 bootstrap's structured Windows PowerShell 5.1 parser report. The first actionable syntax defect was an unterminated single-quoted string in the diagnostic report array: `('USER PROFILE: [REDACTED]),`. FIX24 changes it to `('USER PROFILE: [REDACTED]'),` and adds a regression test for the exact line. The subsequent `WINDOWS:` token, missing parenthesis/brace and `finally` errors were parser cascades from that unterminated string, not independently established defects. Run only the FIX24 archive and return the next plain-text report. Do not declare the launcher accepted until Windows confirms the entire payload parses, the workflow completes or reports a truthful blocked state, clipboard read-back matches, and the report pastes into ChatGPT as text.


### FIX25 logging correction (2026-11-22)
FIX24 Windows evidence showed that `Start-Transcript` and `Add-Content` were writing to the same path, causing file-sharing IOExceptions. FIX25 uses a dedicated `SiteWorks-transcript-<run>.txt` for PowerShell transcript capture and a separate `SiteWorks-next-task-<run>.txt` for launcher event entries. The run bundle retains them as `run.txt` and `launcher-events.txt` respectively. A clean run must show no repeated file-lock warnings.


### FIX26 deployed-project verification (2026-11-22)
FIX25 Windows evidence confirms the transcript/event-log separation works: no file-lock warnings appeared, deployment completed, and clipboard read-back matched. It did not prove that the deployed project passed its own automated checks. FIX26 runs `npm run verify` from the deployed target when `node.exe` and `npm.cmd` are available. The report and `run.json` record deployment status, backup/deployment Robocopy exit codes, project verification status and its exit code. Outcomes distinguish a verified deployment, deployment without verification, failure/blockage and user cancellation. A passing offline verification remains separate from Brave, native-helper and Steam live acceptance.


### FIX26 opt-in Node.js recovery (2026-11-22)
FIX26's Windows report showed that deployment and clipboard hand-off succeeded but project verification was blocked because Node.js or `npm.cmd` could not be found. FIX26 refreshes PATH, checks common Node.js install locations, and asks before using winget to install Node.js LTS. No installation occurs without an explicit Y response. The report records toolchain status and Node/npm versions. If installation is declined or winget is unavailable, verification remains explicitly blocked; do not treat deployment as project acceptance.


### FIX27 opt-in Node.js recovery (2026-11-22)
FIX26's Windows report showed that deployment and clipboard hand-off succeeded but project verification was blocked because Node.js or `npm.cmd` could not be found. FIX27 refreshes PATH, checks common Node.js install locations, and asks before using winget to install Node.js LTS. No installation occurs without an explicit Y response. The report records toolchain status and Node/npm versions. If installation is declined or winget is unavailable, verification remains explicitly blocked; do not treat deployment as project acceptance.


### FIX27 evidence / FIX28 hand-off (2026-11-22)
FIX27 completed deployment and deployed-project verification on Windows PowerShell 5.1: Node v26.13.1, npm 11.20.0, `npm run verify` exit 0, 96/96 tests, 40 JavaScript syntax checks, 125 manifest entries, governance pass and clipboard read-back verified. A passing test title containing “failed” was incorrectly selected as a warning excerpt. FIX28 corrects that filter and distinguishes automated verification from pending live acceptance. Run FIX28 once, then continue TODO-003 through TODO-007; do not reinstall Node.js.


CURRENT STATUS — FIX28 WINDOWS ACCEPTANCE
  FIX27 and FIX28 are two consecutive successful Windows PowerShell 5.1 runs.
  Deployment, deployed npm run verify, manifest/governance checks and exact
  plain-text clipboard hand-off passed. TODO-001 launcher/feedback-loop
  acceptance is DONE. The Site Works application is not yet accepted.

NEXT TASK — TODO-003 BRAVE/CHROMIUM SMOKE TEST
  Use a clean/test browser profile. Load the unpacked extension and verify
  build identity, extension errors, popup, Manage, pause/on-off, context menu,
  keyboard shortcuts, approval/rejection, remembered approval scope and
  changed-script-hash reapproval. Record browser/version, each result and
  relevant screenshots. Do not use the production profile as the only test.
  Node.js v26.13.1 and npm 11.20.0 are already available; do not reinstall.

LIVE ACCEPTANCE REMAINS PENDING
  TODO-004 native helper; TODO-005/006 Steam inventory and price workflows;
  TODO-007 storage recovery. R2 release remains blocked until TODO-008.

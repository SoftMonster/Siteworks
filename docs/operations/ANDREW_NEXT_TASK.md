# Andrew Next Task — Operator Guide

**Stable entry point:** `Andrew_next_task.bat`  
**Owner:** Andrew  
**Purpose:** one repeatable hand-off point for the next safe project action.

## Current state

The launcher is **not currently accepted as operational**. On 2026-11-21, Andrew supplied a Windows Terminal screenshot showing PowerShell parser errors in the generated temporary script:

- `The ampersand (&) character is not allowed` at line 139, character 36.
- Cascading missing `)` / `}` and unexpected-token errors.
- Process ended with exit code 1.

This is a confirmed launcher failure, not a successful diagnostic run. See `../evidence/launcher-parse-error-2026-11-21.png` and TODO-001 in `../PROJECT_TODO.md`. The exact offending source expression must be traced in the launcher payload before a code correction is made. Do not infer that fixing only the reported ampersand will resolve all cascading parser errors.

## Operator procedure

1. Extract the newest project ZIP fully to a normal folder; do not run from the ZIP viewer.
2. Open the project root containing `Andrew_next_task.bat`.
3. Run the launcher only when the release identity and payload have been reconciled by the maintainer.
4. Do not manually edit scripts, manifests, Git state, browser storage or Steam data to bypass a failure.
5. Paste the final clipboard screenshot directly into your next ChatGPT response. Add any manual requests in ordinary text in the same message.
6. The screenshot must show the FINAL FEEDBACK CAPSULE and first failure. The full transcript/JSON remain in the printed run folder; attach them only if requested or if the screenshot is incomplete.
7. If no final capsule is produced, paste a manual screenshot of the last visible error. Do not try to diagnose it yourself.

## Evidence contract

The complete one-paste evidence schema, final-screen requirements, assistant intake contract and reliability acceptance gate are defined in [`FEEDBACK_LOOP_CONTRACT.md`](FEEDBACK_LOOP_CONTRACT.md). That document is the detailed contract; this guide remains the operator-facing summary.

Each run should capture:
- visible launcher/build identity;
- Windows and PowerShell version;
- Node.js, npm and Git availability and versions;
- repository path, branch, HEAD and working-tree status when Git is available;
- exact commands, output, exit codes and unresolved blockers;
- final screenshot, `run.txt`, `run.json` and artifact hashes under `%TEMP%\SiteWorks-Diagnostics\<run-id>\`.

The launcher must render a compact FINAL FEEDBACK CAPSULE, capture it as `final-screen.png`, attempt clipboard transfer and verify image presence by reading the clipboard back. Never assume ChatGPT paste carries text and image simultaneously: the screenshot itself must contain the key diagnostic summary. If clipboard verification fails, report it and retain the manual screenshot fallback.

## Safety boundaries

- Standard diagnostics should not require Administrator elevation.
- Any prerequisite installation must be opt-in and explained before execution.
- No Git reset, clean, checkout, commit, push or remote publication without explicit approval.
- No deletion or migration of browser/Steam data without explicit approval and a recovery plan.
- No automatic Steam retry after HTTP 429; respect cooldowns.
- Do not run selling, listing removal or other consequential trading actions during acceptance tests.
- Preserve the stable launcher filename across releases.

## Maintainer responsibilities

Before issuing a new archive:
1. Fix the actual parser defect and test the script under Windows PowerShell 5.1.
2. Run parser validation against the exact embedded script, not only a separately edited source file.
3. Verify batch syntax, payload marker uniqueness, embedded ZIP round-trip and outer ZIP integrity.
4. Confirm the embedded payload matches the shipped project tree.
5. Confirm build identity is consistent in archive name, launcher display, embedded payload and handover text.
6. Test screenshot capture and clipboard image verification.
7. Update TODO-001 and the progress log only with observed evidence.

## Feedback loop

Andrew pastes the clipboard screenshot and may add manual requests in the same message. The maintainer follows the assistant intake contract in `FEEDBACK_LOOP_CONTRACT.md`, diagnoses the earliest actionable defect, performs repository-side work, packages a new archive and gives one exact next action. Andrew should not need to diagnose PowerShell, locate logs unless asked, or edit project files independently.

Historical launcher iterations are retained in `../history/LAUNCHER_CHANGE_HISTORY.md`.

# Andrew Next Task — Launcher Change History

Historical behaviour notes retained from the former workflow guide. Current operating rules live in `../operations/ANDREW_NEXT_TASK.md`.

## Feedback iteration — prerequisite discovery (FIX2)

**Evidence received:** Windows PowerShell 5.1 diagnostic screenshot showed Node.js, npm and Git as "not found". The first diagnostic therefore could not execute the repository's npm test/check commands. This is an environment/prerequisite blocker, not a test failure.

**Updated behaviour behind the same `Andrew_next_task.bat`:**
- Searches PATH and common installation locations for Node.js, npm and Git.
- Checks for Git bundled with GitHub Desktop in common locations.
- If required tools remain missing and `winget` is available, asks Andrew whether to install Node.js LTS and Git for Windows.
- Installation is opt-in; no package is installed without an affirmative response.
- Does not request Administrator elevation itself. Windows installers may display their own approval/UAC prompts.
- If `winget` is unavailable or installation is declined, reports official download locations and stops the dependent checks.
- After discovery/installation, runs the existing npm tests, syntax check and manifest check, then captures Git status/history when available.

**Feedback loop:** Andrew may return screenshots, generated logs, copied terminal output, test results or plain-text observations. The maintainer analyses the evidence, performs remote-safe work, updates the workflow behind the same stable launcher filename and supplies one next action. The launcher is not renamed between iterations.

**Current blocker:** Node.js/npm and Git were not discoverable on the Windows machine at the time of the screenshot. FIX2 is intended to locate existing installations or offer an opt-in installation path. Windows execution remains to be confirmed by Andrew.
## FIX5 — dual-mode launcher and clipboard evidence

The stable launcher now has two modes:
- Run from the installed repository path: perform environment/repository checks and run available npm verification scripts.
- Run from an extracted distribution folder: self-extract the embedded project payload and offer the guarded repository refresh.

At the end of either mode, the launcher attempts to capture the full virtual desktop and place the screenshot image on the Windows clipboard. The batch starts PowerShell in STA mode for clipboard support. It also writes a text transcript to `%TEMP%\\SiteWorks-Diagnostics`.

Andrew can paste the screenshot directly into AI assistant and provide the transcript path or its contents. If clipboard capture is blocked by the Windows session, the launcher reports that limitation; the text log remains available.
## FIX16 — Manual screenshot and launcher identity
The user supplied a manual screenshot after moving the command window. It is retained under `docs/history/evidence/FIX16/`. FIX16 prints its build identifier before PowerShell starts; verify `R2-HF20-FIX16` before allowing the task to continue. Windows validation remains pending.

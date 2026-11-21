# Step 002 — Automated development toolchain setup

- Archive: `Siteworks-1.6.9-R2-Hotfix-20-Andrew-Next-Task-FIX7.zip`
- Trigger: Step 001 diagnostics reported Node.js, npm and Git missing (npm check exit code 127).
- Andrew's action: extract this archive, run `Andrew_next_task.bat` from the extracted `Siteworks` folder, inspect target/backup paths, type `REPLACE`; then run the installed launcher in the repository.
- Launcher action: in installed mode, detect `winget`; install Node.js LTS (`OpenJS.NodeJS.LTS`) and Git for Windows (`Git.Git`) silently with package/source agreements accepted; refresh PATH; verify commands; inspect Git repository state; run `npm run verify` if declared, otherwise `npm test` and `npm run check` when present.
- Safety: no Git reset, checkout, commit or push. Deployment backs up working files and preserves `.git`. Installation may invoke Windows elevation depending on package-manager policy.
- Evidence: transcript under `%TEMP%\SiteWorks-Diagnostics`; mandatory desktop screenshot copied to clipboard and verified.
- Acceptance: Andrew pastes the final screenshot into the project conversation. Tool installation and test outcomes are not considered successful until observed in that evidence.
- Status: prepared; Windows execution pending.

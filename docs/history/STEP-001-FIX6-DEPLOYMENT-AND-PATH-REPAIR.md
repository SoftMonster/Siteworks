# Step 001 — FIX6 deployment and launcher path repair

- Archive: `Siteworks-1.6.9-R2-Hotfix-20-Andrew-Next-Task-FIX6.zip`
- Purpose: correct FIX5 `$PSScriptRoot` failure under PowerShell `-EncodedCommand`.
- Evidence: Andrew supplied screenshot showing successful deployment copy and subsequent installed launcher diagnostics.
- Outcome: launcher reached local checks; PowerShell 5.1 available; Node.js, npm and Git absent.
- Next dependency: install Node.js LTS and Git for Windows.
- Status: completed as the prior traceable package; see Step 002 for automated toolchain installation.

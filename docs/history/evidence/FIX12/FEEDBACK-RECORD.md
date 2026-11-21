# FIX12 user feedback record

Date: 21 November 2026

## Evidence supplied

1. `01-user-feedback-robocopy-summary.png` — user-provided screenshot showing the launcher console over File Explorer at the Robocopy 100% / summary region. The visible portion does not show a conclusive final deployment result.
2. `02-user-feedback-exit-9020.png` — user-provided screenshot showing: `The system cannot execute the specified program.` followed by `Andrew Next Task finished with exit code 9020.`

## Diagnosis

The FIX12 launcher passed its entire PowerShell program to `powershell.exe -EncodedCommand`. The encoded command was approximately 50 KB, exceeding the Windows process command-line limit (32,767 characters including the terminating null). This explains why the launcher process could not be started and returned the reported execution failure. The Robocopy screenshot alone did not establish a Robocopy failure; the second screenshot identifies the actual launcher-startup failure.

## Corrective action in FIX13

The batch file now uses a short PowerShell bootstrap command. The bootstrap reads the self-contained batch file, extracts the separately marked Base64 PowerShell script to a temporary `.ps1` file, and runs it. The embedded project ZIP remains a separate payload. This keeps the process command line small while retaining the one-file self-extracting launcher.

The feedback bundle now also includes the timestamped Robocopy logs when they exist. The two supplied screenshots are preserved in this repository history folder.

## Validation boundary

The outer ZIP and embedded ZIP are checked for archive integrity here. The Windows launcher has not been executed in Andrew's environment; FIX13 must be tested there before this issue is marked resolved.

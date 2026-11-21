# Step 008 — FIX12 launcher command-line limit

- User evidence: Robocopy summary screenshot followed by exit code 9020 and `The system cannot execute the specified program.`
- Root cause: FIX12 placed the full PowerShell source in `-EncodedCommand`; its Base64 command was approximately 50 KB, beyond the Windows process command-line limit.
- Fix: short bootstrap command extracts the encoded PowerShell body from the self-contained BAT to a temporary script file and invokes it. The embedded ZIP remains a separate Base64 payload.
- Evidence: see `docs/history/evidence/FIX12/`.
- Additional improvement: include any timestamped Robocopy backup/deployment logs in the generated feedback ZIP.
- Status: FIX13 package integrity verified; Windows execution still required.

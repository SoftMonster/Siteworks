# STEP-015 — FIX22 text-first feedback hand-off correction

**Date:** 2026-11-21  
**Baseline:** Site Works 1.6.9 / R2 Hotfix 20 / FIX21  
**Change type:** Documentation and acceptance-contract correction only

## Triggering evidence

Andrew pasted the clipboard result into ChatGPT and it arrived as a single screenshot image. The image shows the known PowerShell parser failure and exit code 1. It is not the full diagnostic report and does not transfer a locally generated feedback ZIP.

## Finding

The prior launcher design attempted to place image and text formats on the Windows clipboard and checked that both formats existed locally. This does not guarantee the receiving application will choose the text format. A pasted image cannot carry the full ZIP or local diagnostic files.

## Decision

The normal one-paste hand-off is now plain text only. The clipboard report must be self-contained, include the earliest failure and all relevant run/environment/command metadata, and be verified by reading clipboard text back. Screenshots, transcript, JSON and ZIP remain local artifacts and are attached only when requested.

## Files updated

- `docs/operations/FEEDBACK_LOOP_CONTRACT.md`
- `docs/operations/ANDREW_NEXT_TASK.md`
- `docs/PROJECT_TODO.md`
- `docs/PROJECT_PROGRESS_LOG.md`
- `docs/README.md`
- `ANDREW_NEXT_TASK.txt`
- `RELEASE_NOTES.md`

## Verification boundary

No launcher or application source code was changed. No claim is made that the parser defect is repaired or that the text-first hand-off has been implemented. TODO-001 remains BLOCKED until the exact generated payload parses under Windows PowerShell 5.1 and Andrew completes two consecutive end-to-end text-paste runs.

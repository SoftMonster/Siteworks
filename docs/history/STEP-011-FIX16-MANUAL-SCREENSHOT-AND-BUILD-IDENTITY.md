# Step 011 — FIX16 manual screenshot and launcher identity

## Evidence received
The user manually moved the command window and supplied `evidence/FIX16/01-user-manual-screenshot-after-moving-window.png`.

## Observed result
The temporary launcher PowerShell script reports parser errors, including an ampersand token error and cascading missing delimiters. The launcher exits with code 1. This is a failed test.

## Response
FIX16 adds a visible build ID in the batch preamble before PowerShell starts, repeats it in the transcript, simplifies the evidence-board loop bound, and avoids sharing one redirect file for stdout/stderr. This is intended to distinguish the current launcher from stale copies and remove the reported parsing hotspot.

## Acceptance
Pending Windows PowerShell 5.1 run of FIX16. Require the returned feedback ZIP or the complete clipboard evidence. No success is claimed yet.

# Step 009 — FIX13 PowerShell 5.1 parser errors and clipboard handling

## User evidence
- `docs/history/evidence/FIX13/01-fix13-exit-9020.png`: prior launcher execution failure remains visible in the feedback sequence.
- `docs/history/evidence/FIX13/02-fix13-powershell-parse-errors.png`: PowerShell 5.1 reports parser errors around ampersand invocation inside an expression and subsequent cascading missing delimiters.

## Diagnosis
FIX13 successfully got past the oversized command-line launch failure and extracted a temporary `.ps1`, but the extracted script contained syntax not accepted by Windows PowerShell 5.1. The reported ampersand parse errors are at the version-probe invocation in `Show-Tool`; later missing-parenthesis/brace messages are cascading parser diagnostics, not independent confirmed defects.

## Corrective action
- Changed the version probe to invoke the command on a separate statement and capture its output afterward, compatible with Windows PowerShell 5.1.
- Added clipboard start-state handling. If the clipboard is empty, it is cleared at the start to establish a clean feedback state. If it contains text or an image, it is preserved and the operator is told.
- Updated clipboard instructions to refer generically to the AI conversation.
- Added archive-specific FIX14 change folder and versioned launcher retention.

## Validation
Outer and embedded ZIP integrity are checked at build time. Static review confirms the problematic `(& $cmd ...)` form is absent. Windows PowerShell 5.1 execution remains pending.

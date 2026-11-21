# Step 010 — FIX14 feedback: same parser error returned

## Evidence
`docs/history/evidence/FIX14/01-user-reported-repeat-of-fix13-parser-error.png`

## Finding
The screenshot still shows the old source expression `$v = (& $cmd --version ...)` at line 74. That exact expression is absent from the FIX14 launcher payload inspected in the delivered archive. The screenshot therefore does not demonstrate execution of the FIX14 payload; it is consistent with the previously extracted FIX13 temporary script or an older launcher copy being run.

This is why FIX15 adds an unmistakable `R2-HF20-FIX15` build identity at startup. It also removes call-operator expressions from the launcher script and uses `Start-Process` for tool-version probes, reducing ambiguity about PowerShell 5.1 parsing.

## Operator instruction
Run the `Andrew_next_task.bat` directly from the newly extracted FIX15 archive folder. Confirm the first screen says `R2-HF20-FIX15`. If that marker is absent, stop: an older launcher was executed. Do not copy an old launcher over the new one.

## Screenshot retention
The supplied screenshot is retained as evidence. Historical screenshots are never deleted by the protocol. Clipboard clearing applies only to the Windows clipboard at run start and only when it is already empty; existing clipboard contents are preserved.

# STEP-015 — FIX21 One-Paste Feedback Contract

**Date:** 2026-11-21  
**Scope:** Documentation and governance only.

## Change
Established `docs/operations/FEEDBACK_LOOP_CONTRACT.md` as the specification for the Andrew Next Task feedback loop. Updated the operator guide, root next-task pointer, documentation index, engineering standard, canonical TODO-001 and cumulative progress log.

## Intended operator experience
Andrew runs the stable batch file once, pastes the final clipboard screenshot into the next ChatGPT response, and adds any manual requests as ordinary text. The screenshot must display a concise diagnostic capsule; full logs and structured JSON remain in a unique run folder.

## Evidence requirements
The contract requires a run/build identity, timestamp, outcome, stage statuses, environment, tool versions, commands and exit codes, first failure, artifact paths and clipboard read-back result. It defines safe fallback behaviour when capture or clipboard transfer fails.

## Verification boundary
This is a documentation specification, not proof of implementation. The supplied launcher is still blocked by the observed PowerShell parser failure. No code changes were made and no Windows runtime claim is made.

## Next action
Repair the exact generated PowerShell payload, implement the contract in the launcher, and validate it on Andrew's Windows machine through repeated paste-and-response cycles.

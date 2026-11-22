# STEP-018 — FIX26 deployed-project verification

**Date:** 2026-11-22  
**Baseline:** FIX25 Windows run `8e3ed4c2-90da-488a-8cf8-43d844da2d28`  
**Build:** `R2-HF20-FIX26`

## Evidence-driven change

FIX25 demonstrated that the transcript/event-log file-lock defect was resolved. Windows PowerShell 5.1 parsed and ran the launcher, deployment completed, backup was retained, Robocopy exit codes 1 and 3 were accepted, and clipboard read-back matched. Its generic `COMMANDS_COMPLETED_REVIEW_REQUIRED` outcome did not tell the maintainer whether the deployed repository's automated checks had run.

## Implementation

- Run `npm run verify` from the deployed target after a successful copy when `node.exe` and `npm.cmd` are present.
- Capture the exact verification exit code and mark verification PASS/FAIL. Missing tools are recorded as NOT RUN, not PASS.
- Report deployment state and backup/deployment Robocopy exit codes independently.
- Classify outcomes so deployment-only cannot be mistaken for verified deployment. A passing automated check remains review-required because live Brave/Steam acceptance is separate.
- Update launcher identity and correct the stale FIX23 build warning in the toolchain branch.

## Validation

The previous FIX25 baseline passed `npm run verify` locally (93 tests, 40 JavaScript files, 124 manifest entries and governance checks). FIX26 adds regression coverage for the new launcher contract. Windows PowerShell 5.1 execution of FIX26 remains pending.

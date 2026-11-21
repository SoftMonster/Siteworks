# Site Works Documentation

This directory is the project's documentation system. It is intentionally organised around one authoritative source per kind of information.

## Start here

1. [`PROJECT_TODO.md`](PROJECT_TODO.md) — **the only active task backlog**. All work status and next-action priority lives here.
2. [`PROJECT_PROGRESS_LOG.md`](PROJECT_PROGRESS_LOG.md) — concise dated record of completed work and observed blockers.
3. [`operations/ANDREW_NEXT_TASK.md`](operations/ANDREW_NEXT_TASK.md) — how to run the stable launcher and return evidence.
4. [`operations/FEEDBACK_LOOP_CONTRACT.md`](operations/FEEDBACK_LOOP_CONTRACT.md) — exact one-paste feedback contract and reliability acceptance gate.
4. [`quality/R2_ACCEPTANCE_MATRIX.md`](quality/R2_ACCEPTANCE_MATRIX.md) — authoritative R2 release acceptance checklist.

## Reference library

| Area | Authoritative document | Purpose |
|---|---|---|
| Architecture | [`architecture/ARCHITECTURE_REFERENCE.md`](architecture/ARCHITECTURE_REFERENCE.md) | Runtime, components, data terms |
| Inventory persistence | [`WEBDATA_FILEDATA_ARCHITECTURE.md`](WEBDATA_FILEDATA_ARCHITECTURE.md) | Steam Webdata, journal and Filedata design |
| Engineering | [`engineering/ENGINEERING_STANDARD.md`](engineering/ENGINEERING_STANDARD.md) | Development method, project rules and safety invariants |
| Decisions/debt | [`engineering/DECISIONS_AND_TECHNICAL_DEBT.md`](engineering/DECISIONS_AND_TECHNICAL_DEBT.md) | Decision record and technical risks |
| Experiments | [`engineering/EXPERIMENT_REGISTER.md`](engineering/EXPERIMENT_REGISTER.md) | Evidence-qualified experiments and observations |
| Operations | [`operations/INSTALLATION_AND_DEVELOPMENT.md`](operations/INSTALLATION_AND_DEVELOPMENT.md) | Setup and local development |
| Diagnostics | [`operations/DIAGNOSTICS_AND_RECOVERY.md`](operations/DIAGNOSTICS_AND_RECOVERY.md) | Troubleshooting and recovery |
| Feedback loop | [`operations/FEEDBACK_LOOP_CONTRACT.md`](operations/FEEDBACK_LOOP_CONTRACT.md) | One-paste evidence format, launcher stages and assistant intake contract |
| Native helper | [`operations/FILE_HELPER_SECURITY_AND_INSTALL.md`](operations/FILE_HELPER_SECURITY_AND_INSTALL.md) | Helper install and trust boundary |
| Release | [`operations/RELEASE_AND_ROLLBACK.md`](operations/RELEASE_AND_ROLLBACK.md) | Packaging, release and rollback |
| Security | [`quality/SECURITY_REVIEW.md`](quality/SECURITY_REVIEW.md) | Source-based security review and open tests |
| Roadmap | [`roadmap/R1-R7_DELIVERY_PLAN.md`](roadmap/R1-R7_DELIVERY_PLAN.md) | Product direction; not an implementation backlog |
| Release history | [`../RELEASE_NOTES.md`](../RELEASE_NOTES.md) | Authoritative shipped-change narrative |
| Project history | [`history/ARCHIVE-INDEX.md`](history/ARCHIVE-INDEX.md) | Historical step records and evidence |

## Governance rules

- `PROJECT_TODO.md` is the sole active backlog. Do not create additional TODO lists or copy task statuses into other documents.
- `PROJECT_PROGRESS_LOG.md` records outcomes, not planned work.
- `RELEASE_NOTES.md` records changes included in a release; it is not a task tracker.
- The R2 acceptance matrix records test cases and evidence; the backlog owns task ordering.
- Decision and experiment registers record rationale/observations, not delivery status.
- Generated manifests and `sites/index.json` must be regenerated from their source tools.
- Historical records are immutable evidence. Correct current guidance in the current documents; do not silently rewrite old event records.
- A task is complete only when its acceptance evidence exists. Source inspection, a passing offline suite or a ZIP build does not prove live Windows/Brave/Steam behaviour.

## Evidence and retention

Keep relevant screenshots, logs and test outputs under `evidence/` or the dated history tree. Redact secrets and personal identifiers. Remove temporary, duplicate or superseded explanatory documents from the release package; Git history remains the provenance mechanism for tracked files.

## Status vocabulary

`PASS`, `FAIL`, `BLOCKED`, `SKIPPED`, `NOT TESTED`, `SOURCE OBSERVED`, `OPEN`, `IN PROGRESS`, `DONE`, `DEFERRED`, `OWNER DECISION`.

Use runtime statuses for checks and backlog statuses for work items. Do not conflate them.

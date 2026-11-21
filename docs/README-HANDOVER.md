# Site Works — Engineering Handover Pack

> **Correction notice (rescue pass, 2026-11-21).** Statements below that the package has no `.git` metadata, no source revision or no reproducible verification were true of the ZIP the pack was written against but are **no longer true**: the project is a git repository (`origin` = `github.com/SoftMonster/Siteworks`), 1.6.9 is committed and tagged `v1.6.9`, and `npm run verify` runs the syntax check, tests and checksum check. See [`HANDOVER_RESCUE.md`](HANDOVER_RESCUE.md). Live Brave/Steam acceptance is still **not** done.


**Baseline:** 1.6.9 · R2 Hotfix 19 (HF19)  
**Purpose:** enable a competent incoming developer to operate, diagnose, maintain and extend the supplied release without relying on the outgoing developer.  
**Evidence rule:** this pack distinguishes source-inspected facts, repeatable offline checks, historical release-note claims, design recommendations and live checks not performed.

## Start here

0. Read `HANDOVER_RESCUE.md` first: what was wrong with the first handover, what was fixed, what is still open.
1. Read `PROJECT_HANDOVER_R1-R7.md` for project history and the high-level transfer.
2. Read `architecture/SYSTEM_ARCHITECTURE.md` and `architecture/COMPONENT_CATALOGUE.md`.
3. Follow `operations/INSTALLATION_AND_DEVELOPMENT.md` to load the unpacked extension and run checks.
4. Follow `quality/R2_ACCEPTANCE_MATRIX.md` before accepting R2.
5. Use `operations/DIAGNOSTICS_AND_RECOVERY.md` when investigating failures.
6. Read `engineering/DECISIONS_AND_TECHNICAL_DEBT.md` before changing architecture.
7. Use `roadmap/R1-R7_DELIVERY_PLAN.md` for future planning.

## Pack contents

| File | Purpose |
|---|---|
| `HANDOVER_RESCUE.md` | Rescue report: defects found, fixes made, open items, next steps |
| `PROJECT_HANDOVER_R1-R7.md` | Existing project narrative and roadmap context |
| `architecture/SYSTEM_ARCHITECTURE.md` | Runtime, permission, data and trust-boundary overview |
| `architecture/COMPONENT_CATALOGUE.md` | File-by-file source inventory and responsibility |
| `architecture/DATA_DICTIONARY.md` | Inventory, journal and price terminology/data |
| `operations/INSTALLATION_AND_DEVELOPMENT.md` | Setup, load, build/index and test commands |
| `operations/DIAGNOSTICS_AND_RECOVERY.md` | Browser, Steam, persistence and helper diagnosis |
| `operations/RELEASE_AND_ROLLBACK.md` | Release preparation, verification and rollback checklist |
| `quality/R2_ACCEPTANCE_MATRIX.md` | Requirements, evidence and remaining acceptance work |
| `quality/SECURITY_REVIEW.md` | Manifest permissions, trust boundaries and threat questions |
| `engineering/DECISIONS_AND_TECHNICAL_DEBT.md` | Established decisions, assumptions and unresolved debt |
| `engineering/EXPERIMENT_REGISTER.md` | Evidence-backed experiment themes and evidence gaps |
| `roadmap/R1-R7_DELIVERY_PLAN.md` | Status-aware release roadmap and entry gates |
| `HANDOVER_EVIDENCE.md` | Commands actually run while preparing this pack |
| `RELEASE_FILE_MANIFEST.sha256` | SHA-256 inventory of files in this release package, excluding this manifest |

## Evidence labels

- **SOURCE-VERIFIED:** directly observed in the supplied HF19 source.
- **OFFLINE-VERIFIED:** command was executed in the preparation environment and its output is recorded.
- **HISTORICAL-CLAIM:** recorded in existing release notes or handover history; not independently reproduced here.
- **DESIGN-INTENT:** documented architecture or intended behaviour; not proof of runtime behaviour.
- **LIVE-REQUIRED:** requires Brave/Chromium, a Windows host helper, or a live Steam account/page.
- **PROPOSED:** recommendation for future work, not a current feature.

## Important limits

This pack was prepared from the supplied 1.6.9 HF19 ZIP. No live Steam account, browser session, production user data, or external build pipeline (the git repository was present in the delivered ZIP but not noticed when this pack was written; see the correction notice above) was available. No claim of successful live Steam acceptance, security certification, crash-consistency proof, or reproducible source-control build is made. A source ZIP is not a substitute for a version-controlled repository and signed release process.

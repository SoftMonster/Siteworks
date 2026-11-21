# Site Works — AI-assisted Engineering Protocol

**Status:** Mandatory project development procedure  
**Framework:** Adapted from Skillset-OS-GPT 1.4.1  
**Scope:** Every investigation, code change, test, documentation change, deployment package and release  
**Project owner:** Andrew

## 1. Purpose

This document applies the Skillset-OS development method to Site Works. It is a project operating procedure, not a claim that the full Skillset-OS runtime has been installed inside Site Works.

The governing principle is: **inspect first, make the smallest safe change, prove the result, preserve evidence, and report unknowns honestly.**

The project remains a browser extension with a Windows native helper and Steam page integrations. AI is a development assistant; Andrew retains control over product decisions, destructive actions, live Steam operations and publication.

## 2. Required workflow

Every task follows these stages in order. A task may stop at any stage when evidence is missing or a human decision is required.

1. **Intake** — restate the requested outcome, constraints, expected behaviour and acceptance criteria.
2. **Baseline** — identify the exact input archive/revision; preserve it; inspect Git state, versions, files and existing evidence.
3. **Orient** — read the relevant README, architecture, data dictionary, acceptance matrix, tests and implementation before editing.
4. **Route** — select the smallest relevant engineering practices: bug diagnosis, feature planning, implementation, refactoring, security review, documentation, Git/release management or test design.
5. **Plan** — list affected files, risks, compatibility concerns, test cases and any action requiring Andrew's approval.
6. **Implement** — make one coherent, minimal change. Preserve existing behaviour unless a change is explicitly approved.
7. **Test** — run focused tests and the full project verification. Include boundaries and failure cases. New checks must be shown to reject a deliberately broken fixture where practical.
8. **Review** — inspect the diff, generated files, versions, release notes, archive contents and data-safety implications.
9. **Evidence** — record commands, environment, observed results, screenshots, logs, pass/fail/blocked status and remaining unknowns.
10. **Package** — produce a new traceable ZIP, update the cumulative progress log and archive index, and retain the stable `Andrew_next_task.bat` entry point.
11. **Handover** — give Andrew the new archive first, then one clear next action and the exact evidence to return.
12. **Learn** — convert missed defects and repeated traps into regression tests, checker rules or documented gotchas.

No stage may be marked complete merely because a plan was written or an archive was created.

## 3. Evidence and status vocabulary

Use only these statuses:

- **PASS** — the stated check ran and the expected effect was observed.
- **FAIL** — the check ran and contradicted the expected result.
- **BLOCKED** — the check could not run because a prerequisite or environment was unavailable.
- **SKIPPED** — deliberately not run; state why.
- **NOT TESTED** — no execution evidence exists.
- **SOURCE OBSERVED** — code or configuration appears to implement the behaviour, but runtime behaviour was not demonstrated.

A command exit code is not sufficient by itself. Read the output and inspect the effect. For important checks, use a negative control or deliberately broken fixture to establish that the checker detects the fault. Keep unknown values visibly unknown; never convert missing data into zero or an estimate into a fact.

## 4. Site Works engineering rules

- Preserve Manifest V3 architecture and the existing browser/runtime support unless a change is approved.
- Preserve the default-deny, user-approved script execution model and SHA-256-bound remembered approvals.
- Treat scripts executing in page context as privileged: they are not sandboxed merely because they pass the approval gate.
- Preserve existing browser storage and compatibility. Schema or migration changes require copied-data tests and a recovery plan.
- Keep inventory acquisition separate from market-price enrichment.
- Preserve Steam throttling and stop-on-HTTP-429 behaviour. Do not force requests through cooldowns or add automatic retries without an explicit, reviewed product decision.
- Do not perform real quick-sell, bulk removal, listing, or other consequential Steam actions during routine tests. Use safe test data and require explicit confirmation for live actions.
- Preserve the native helper's filesystem boundary. Reject traversal, malformed messages and paths outside the approved sites area.
- Treat Steam page globals, DOM selectors and undocumented methods as unstable external dependencies. A missing capability must produce a clear blocked/error state, not fabricated success.
- Keep generated files generated from their source. Regenerate release notes, site index and checksum manifest using the repository scripts.
- Keep the version in `package.json`, `manifest.json`, popup, README files and release notes consistent.
- Do not commit machine-specific paths, user identifiers, credentials, tokens or private Steam account data.
- Preserve `.git` and uncommitted user work. Never reset, clean, commit or push without explicit authorisation.
- Keep the stable launcher name `Andrew_next_task.bat`; update its payload and archived versioned copy as part of each applicable release.

## 5. Project-specific development commands

Run from the repository root:

```powershell
npm run verify
npm run helper-selftest
```

`npm run verify` runs JavaScript syntax checks, the Node test suite, the release manifest check and the project governance checker.

The helper self-test is not a substitute for Windows PowerShell 5.1 execution. The following remain human-machine acceptance checks when applicable:

- Brave/Chromium extension load and popup/Manage behaviour.
- Windows PowerShell 5.1 launcher execution and clipboard screenshot verification.
- Native messaging registration and helper connection.
- Steam inventory, market response, persistence and UI behaviour.
- Any live action that could affect inventory, listings, funds or account state.

If Node.js/npm or Git is missing, record the exact blocked prerequisite. Do not silently install software or alter machine policy. Ask before any installation or elevated operation.

## 6. Site Works change routing

| Request type | Required method |
|---|---|
| Unfamiliar area or broad change | Codebase orientation and trace one real flow |
| Bug or regression | Reproduce, isolate root cause, add regression test, fix minimally |
| New feature | Requirements and acceptance criteria before implementation |
| Behaviour-preserving cleanup | Safety-net tests first; small refactoring steps |
| User-script / browser / Steam change | Review page-context security, permissions, external dependency and live-test boundary |
| Native helper / filesystem change | Security review, hostile-input tests and Windows PowerShell validation |
| Storage / schema change | Compatibility review, copied-data migration test and rollback plan |
| Documentation / release | Match documentation to implementation; regenerate generated artefacts |
| Claim of success | Independent verification and evidence review before reporting PASS |

## 7. Andrew_next_task and feedback loop

The stable launcher is the human-facing continuation mechanism. The detailed evidence schema and acceptance gate are defined in [`../operations/FEEDBACK_LOOP_CONTRACT.md`](../operations/FEEDBACK_LOOP_CONTRACT.md). Every run must:

- identify its own build before running the payload;
- create a timestamped text transcript;
- capture screenshots at meaningful pause, test, automation and final handover points;
- attempt to place the final screenshot on the Windows clipboard and verify the clipboard image;
- preserve pre-existing clipboard content at startup; clear it only when it is already empty, as previously agreed;
- report clipboard failure plainly and retain the text log;
- never claim screenshot capture succeeded unless it verifies the image is present.

Andrew should paste the final clipboard screenshot directly into the next ChatGPT response and may include manual requests in the same message. The development assistant must apply the intake contract, retain relevant evidence in the dated evidence folder, diagnose the earliest failure and update the next package. If clipboard capture fails, a manual screenshot is valid evidence and must not be discarded.

Each new archive must retain:
- root `Andrew_next_task.bat`;
- the standalone launcher protocol;
- this AI-assisted engineering protocol;
- cumulative progress and archive history;
- dated task records and relevant screenshots/logs;
- version-labelled historical launcher copies under `docs/launchers/`;
- task-specific repair files under `docs/fixes/<archive-name>/` where applicable.

## 8. Release and archive gates

Before handing over a changed archive:

1. Run `npm run verify` and report the actual output.
2. Run relevant focused tests and helper checks.
3. Review the source diff and confirm no unintended application behaviour changed.
4. Regenerate release notes, site index and checksum manifest where required.
5. Check archive contents and ZIP integrity.
6. Confirm the stable launcher and standalone protocols are present.
7. Confirm the archive history and cumulative progress log identify the exact archive.
8. State Windows/Brave/Steam checks that remain BLOCKED, SKIPPED or NOT TESTED.

Every development step that changes project files produces a new downloadable archive. Archive creation is a delivery requirement, not proof that the application works. Do not publish to GitHub or alter Git history without Andrew's explicit approval.

## 9. Current known boundaries

The AI development environment can inspect and modify the supplied archive and run Node-based offline checks. It cannot directly demonstrate Andrew's local Brave profile, Windows PowerShell 5.1, native messaging registration, or live Steam account behaviour. Those remain explicit human acceptance gates.

## 10. Source and adaptation note

This procedure adapts the relevant Skillset-OS-GPT 1.4.1 practices: repository orientation/adoption, software development best practices, test design, Git hygiene, evidence hygiene, verification, privacy stewardship and feedback processing. It intentionally records project-specific rules rather than copying the entire general-purpose skill library into the Site Works release.


---

# Site Works Project Rules and Engineering Map

# Site Works — Project Rules and Engineering Map

**Baseline inspected:** `Siteworks-1.6.9-R2-Hotfix-20-Andrew-Next-Task-FIX17.zip`  
**Application version:** 1.6.9  
**Operational hotfix:** R2 Hotfix 20  
**Purpose:** Project-specific rules used by the AI-assisted engineering protocol.

## What the project is

- A Manifest V3 Brave/Chromium extension that runs user-selected scripts on matching websites after an explicit permission decision.
- The extension uses a background service worker, popup, Manage page, script editor, clipboard tool and site scripts.
- A Windows PowerShell native-messaging helper provides constrained file operations for the `sites` directory.
- Steam integrations include inventory discovery, cached-price enrichment, quick-sell and listing-management workflows.
- Node.js 18 or later is the declared development runtime; tests use Node's built-in test runner.

## Important paths

| Path | Responsibility |
|---|---|
| `manifest.json` | Extension version, permissions, service worker and popup |
| `background.js`, `match.js` | Permission gate, routing, matching and extension orchestration |
| `popup.*`, `manage.*`, `editor.*`, `clip.*` | Extension UI |
| `config.js`, `steam-finance.js`, `inventory-intelligence.js`, `siteworks-services.js` | Shared configuration and page-side services |
| `sites/` | User scripts and generated `sites/index.json` |
| `helper/` | PowerShell native host and installer |
| `scripts/` | Syntax, release-note, manifest and helper checks |
| `tests/` | Offline Node regression tests |
| `docs/architecture/`, `docs/quality/`, `docs/operations/` | Architecture, acceptance and operational documentation |

## Runtime and environment limits

- Browser runtime: Manifest V3 Chromium/Brave extension APIs; minimum Chrome version is declared in `manifest.json`.
- Site scripts execute in the target page context. The permission gate controls whether a script may run; it is not a JavaScript sandbox.
- Native helper runtime: Windows PowerShell 5.1 is a required real-machine validation target.
- Offline Node tests do not prove browser extension APIs, Windows native messaging, Steam DOM selectors, Steam page globals or live network behaviour.
- The current launcher has previously produced Windows PowerShell parser errors. Do not mark it operational until tested on the target Windows environment.

## User-facing promises and invariants

1. **Default deny:** a site script does not run until allowed.
2. **Remembered approvals are content-bound:** remembered allow decisions are tied to the script SHA-256.
3. **User control:** users can pause/disable execution and manage decisions.
4. **Filesystem confinement:** native helper operations must remain inside the approved `sites` boundary.
5. **Data preservation:** existing browser storage and legacy records must remain readable unless a migration is explicitly designed and tested.
6. **Inventory/price separation:** inventory acquisition and market-price enrichment are distinct operations.
7. **Rate-limit respect:** HTTP 429 stops the relevant price workflow; no automatic retry or forced cooldown bypass.
8. **Trading safeguards:** quick-sell requires confirmation, respects configured caps and pacing; destructive listing removal leaves Steam confirmation under user control.
9. **Unknown data stays unknown:** unresolved quantities or prices must not be represented as zero or current.
10. **Provenance:** release versions, generated docs and checksums must agree with the actual shipped files.

## Existing commands

```powershell
npm test
npm run check
npm run manifest -- --check
npm run verify
npm run helper-selftest
```

Use `npm run verify` as the default offline gate. Use the narrower commands when diagnosing a failure.

## Tests and acceptance boundaries

Offline tests can cover pure calculations, state transitions, parsing, routing, persistence adapters, throttling decisions and generated-file consistency. Keep tests deterministic; do not call Steam or other live services from the normal test suite.

Human acceptance remains necessary for:
- Brave load-unpacked, popup, Manage and script permission flows;
- PowerShell 5.1 launcher and native helper installation/registration;
- real Steam inventory discovery, stop/resume, price enrichment, cooldown and persistence;
- any quick-sell or bulk listing operation.

Record browser/OS/PowerShell versions and redact account identifiers from shared evidence.

## Known documentation drift

`RELEASE_NOTES.md` is the release history source and `release-notes.html` is generated from it. The README and popup version claims are guarded by `tests/consistency.test.cjs`. Do not treat historic validation figures in older documentation as current results; use the latest dated task record and fresh test output.

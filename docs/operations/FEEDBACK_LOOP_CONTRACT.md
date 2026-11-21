# Andrew Next Task — One-Paste Feedback Loop Contract

**Purpose:** make one run of `Andrew_next_task.bat` produce enough trustworthy evidence for the maintainer to diagnose the next action without asking Andrew to interpret technical output.

**Authority:** this contract defines the evidence exchanged by the launcher and the development assistant. `ANDREW_NEXT_TASK.md` remains the operator guide; `PROJECT_TODO.md` remains the only backlog.

## 1. The intended loop

1. The maintainer prepares a release with one stable launcher entry point and a unique run/build identity.
2. Andrew extracts the archive, runs `Andrew_next_task.bat`, and does not edit project files to work around errors.
3. The launcher records its stages, exact commands, outputs, exit codes, environment and any first failure.
4. The launcher displays a compact **FINAL FEEDBACK CAPSULE** in the console and captures the final console/desktop screenshot.
5. The launcher attempts to place that screenshot image on the Windows clipboard and verifies that the clipboard actually contains an image.
6. Andrew pastes the clipboard image into the next ChatGPT response. Andrew may add ordinary-language requests in the same message.
7. The assistant reads the evidence, identifies the earliest actionable failure, updates the project and backlog, and returns a new archive plus one next action.
8. Repeat until the loop itself is reliable; only then use it to progress the wider R2 acceptance work.

A launcher run that fails before the final capsule is displayed is still useful evidence. The last visible error screenshot is valid; the assistant must not assume later stages ran.

## 2. What the one-paste screenshot must show

The final screenshot is the human-readable diagnostic hand-off. It must show, without scrolling where practicable:

- product name, archive/build ID and launcher ID;
- run ID and local timestamp;
- outcome: `PASS`, `FAIL`, `BLOCKED` or `PARTIAL`;
- last completed stage and first failed stage;
- Windows edition/build and PowerShell version;
- Node.js, npm and Git availability/version (or explicit `NOT FOUND` / `NOT CHECKED`);
- repository/project path and Git branch/HEAD/working-tree summary when available;
- each executed verification command and its exit code;
- the first actionable error, with file and line where available;
- transcript and screenshot paths;
- clipboard image verification result.

The capsule must be concise enough to fit on screen. Full command output belongs in the transcript, not in an endlessly scrolling terminal. The final screenshot should include the capsule and the last relevant error summary; it must not merely show a success banner that hides failures.

## 3. Required machine-readable transcript

Each run must create a unique folder beneath `%TEMP%\SiteWorks-Diagnostics\<run-id>\` containing:

| Artifact | Required content |
|---|---|
| `run.txt` | Human-readable transcript: environment, stages, commands, stdout/stderr, exit codes and final outcome |
| `run.json` | Stable structured record of run/build IDs, timestamps, environment, stage results, command results, error summary and artifact paths |
| `final-screen.png` | Final diagnostic capsule screenshot |
| `launcher-source.txt` | Launcher version/source identity and payload identity; never secrets |
| `manifest.sha256` | SHA-256 hashes of the run artifacts, excluding the manifest itself |

The launcher must print the exact run folder path in the final capsule. If any artifact cannot be created, it must record the failure and continue safely where possible.

### Minimum `run.json` fields

- `schemaVersion`, `runId`, `startedAt`, `finishedAt`, `outcome`;
- `archiveId`, `launcherId`, `payloadId`, `projectVersion`;
- `computerName` only if policy permits; do not include user account names in shared output;
- `osCaption`, `osVersion`, `osBuild`, `powershellVersion`, `processArchitecture`;
- `tools`: Node, npm, Git, and their executable paths and versions;
- `project`: resolved path, manifest/package version, Git branch, HEAD and dirty-state summary;
- `stages`: ordered name, start/end time, status and exit code;
- `commands`: exact command, working directory, start/end, exit code, stdout/stderr log references;
- `firstFailure`: stage, command, message, source file/line when known;
- `artifacts`: transcript, JSON, screenshot and checksum paths;
- `clipboard`: attempted, image verified, failure reason;
- `redactions`: categories removed from shared evidence.

Missing values must be `null` or explicitly `NOT CHECKED`; never fabricate a version, success, clean Git state or test result.

## 4. Stage model and fail-fast rules

The launcher should report these stages in order, marking non-applicable stages explicitly:

1. `BOOTSTRAP` — batch entry, temp workspace, run ID and launcher identity.
2. `PAYLOAD_VALIDATE` — embedded payload markers, extraction and payload identity.
3. `ENVIRONMENT` — OS, PowerShell, Node/npm/Git discovery.
4. `PROJECT_LOCATE` — project root, manifest/package identity and Git state.
5. `STATIC_CHECKS` — syntax, manifest, governance and test commands available in the project.
6. `HELPER_CHECK` — helper self-test only when the required PowerShell runtime is available; otherwise `BLOCKED`.
7. `EVIDENCE_FINALISE` — transcript/JSON, screenshot, hashes and final capsule.
8. `CLIPBOARD_VERIFY` — verify an image is actually present on the clipboard.

A failed parser/bootstrap/payload stage must stop dependent stages and mark them `NOT RUN`; do not emit misleading downstream success. A missing optional tool must be reported as `BLOCKED` for the dependent check, not as a launcher crash. Do not install prerequisites, elevate, modify Git state or change browser/Steam data automatically.

## 5. Clipboard and screenshot semantics

The final screenshot is the primary one-paste visual evidence. It must be captured after the final capsule is rendered. The launcher must verify clipboard image presence using an actual clipboard read-back, not merely a successful API call.

Do not assume that a ChatGPT paste will carry both text and image formats from a multi-format Windows clipboard. The screenshot itself must therefore contain the diagnostic capsule and first failure summary. The full transcript and JSON remain on disk and their paths are visible in the screenshot.

At startup, preserve existing clipboard content. The launcher must not overwrite useful user clipboard data before it has a verified final screenshot. If screenshot capture or clipboard transfer fails, leave the existing clipboard untouched, report the failure in the transcript and capsule, and allow Andrew to use a manual screenshot. Never state that clipboard capture succeeded unless read-back verification passed.

## 6. What Andrew sends back

Preferred response: paste the clipboard screenshot directly into the next ChatGPT message, then add any manual request in ordinary text. No diagnostic explanation is required from Andrew.

If clipboard paste fails: attach a manual screenshot of the final capsule/error. Include `run.txt` or `run.json` only if requested or if the screenshot does not show the first failure. Do not send browser cookies, Steam session data, passwords, API keys, authentication headers, full account IDs or unredacted private inventory exports.

Andrew's manual requests are independent input. The assistant must record them as user requirements and must not let an automated diagnostic task silently override them.

## 7. Assistant intake and response contract

On receipt of a paste or screenshot, the assistant must:

1. Read the visible run/build identity and compare it with the expected archive. If identity is absent or mismatched, treat the run as untrusted/stale and ask for the smallest necessary clarification.
2. Identify the earliest failed stage. Distinguish parser/bootstrap failure from checks that never ran.
3. Extract every visible environment value, command and exit code; label obscured or missing information as unknown.
4. Diagnose from the first actionable error, not the cascade. Do not infer successful tests from a launcher exit code or green summary alone.
5. If needed, request only the missing artifact that materially changes diagnosis (normally the named transcript/JSON); do not ask Andrew to repeat information already visible.
6. Make the smallest safe project-side correction, add a regression check where possible, and update the canonical TODO, progress log and dated step record.
7. Run offline verification and package a new archive. Clearly separate verified results from Windows-only checks still awaiting Andrew.
8. Give Andrew one exact next action: extract this archive and run the stable batch file, or provide one specifically requested artifact. Do not offer multiple competing test routes.

The assistant must preserve Andrew's additional manual requests and report how they were handled. Do not mark the feedback loop reliable until repeated Windows runs demonstrate successful transcript creation, final capsule display, screenshot capture, clipboard read-back verification and accurate run identity.

## 8. Reliability acceptance gate

The loop is accepted only after all of the following are demonstrated on Andrew's target Windows environment:

- two consecutive runs from the delivered archive produce unique, correctly identified run folders;
- the launcher parses and executes under Windows PowerShell 5.1;
- each executed command has captured output and an exit code;
- a forced/real failure is represented accurately, with dependent stages marked `NOT RUN`;
- the final capsule is readable and contains the required fields;
- `final-screen.png` exists and opens;
- clipboard read-back confirms an image, and pasting into ChatGPT displays the expected screenshot;
- when clipboard transfer is deliberately unavailable, the failure is explicit and manual screenshot fallback works;
- no secrets or unnecessary personal identifiers appear in shared evidence;
- the assistant can identify the run and next action from the paste without asking Andrew to interpret technical output.

Until these criteria are met, status remains `IN PROGRESS` or `BLOCKED`; a prepared document or untested launcher is not proof of a working loop.

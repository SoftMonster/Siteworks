# Andrew Next Task — One-Paste Feedback Loop Contract

**Purpose:** one run of `Andrew_next_task.bat` must produce a plain-text report that Andrew can paste into ChatGPT and that contains enough diagnostic evidence to select the next engineering action without Andrew interpreting errors.

**Authority:** this is the evidence-exchange contract. `ANDREW_NEXT_TASK.md` is the operator guide; `PROJECT_TODO.md` is the only backlog.

## 1. Critical correction: text-first, not screenshot-first

The previous contract treated a clipboard containing both image and text formats as a successful one-paste hand-off. Andrew's 2026-11-21 test disproves that assumption: ChatGPT received a single screenshot image, not the diagnostic report or feedback ZIP. Windows clipboard format availability does not guarantee which format the receiving application chooses when pasted.

Therefore:

- **The primary clipboard payload MUST be plain text**: a complete, self-contained diagnostic report with run identity, environment, stage results, exact commands, exit codes, first failure and relevant log excerpts.
- Do not put an image on the clipboard in the normal one-paste path. A receiving application may prefer the image format and discard/ignore the text representation.
- The launcher MUST set plain text only, read it back, and compare the entire string exactly. Image formats must not be placed on the clipboard in the normal hand-off.
- The launcher MUST save screenshots and the complete feedback ZIP locally. These are supporting artifacts, not something that a clipboard paste magically transmits.
- The assistant must not claim to have received or inspected a local feedback ZIP unless Andrew actually attaches it or provides its contents.
- If visual evidence is materially needed, the assistant asks Andrew to attach the specific screenshot or feedback ZIP in a separate message. This is an exception, not the normal loop.

**One-paste success means ChatGPT receives the diagnostic text.** It does not mean the entire ZIP archive has been transferred.

## 2. Intended loop

1. Maintainer prepares a release with one stable launcher entry point and consistent archive/launcher/payload identities.
2. Andrew extracts the archive and runs `Andrew_next_task.bat`.
3. Launcher records stages, commands, output, exit codes, environment and first failure.
4. Launcher writes a self-contained `feedback-report.txt`, copies that report as plain text to the clipboard and reads it back to verify the exact content.
5. Launcher saves a final screenshot, structured JSON, full transcript and checksums in a unique local run folder; it also creates a feedback ZIP when possible.
6. Andrew pastes the clipboard text into the next ChatGPT response and adds any manual requests in ordinary language.
7. Assistant diagnoses the earliest actionable failure, preserves manual requests, updates the project and returns one new archive plus one exact next action.
8. If text paste is incomplete or an image/log is essential, assistant requests only the named supporting artifact.

## 3. Required clipboard report

The plain-text clipboard report must be readable in ChatGPT and contain:

- product, archive/build, launcher and payload identities;
- unique run ID, local timestamp, project path and outcome (`PASS`, `FAIL`, `BLOCKED`, `PARTIAL`);
- last completed stage and first failed stage;
- Windows edition/version/build, PowerShell version and process architecture;
- Node.js, npm and Git availability, executable paths and versions (or explicit `NOT FOUND` / `NOT CHECKED`);
- project manifest/package versions and Git branch/HEAD/dirty-state summary when available;
- ordered stage results and every executed command with working directory and exit code;
- first actionable error, including file/line and a useful surrounding excerpt;
- concise stdout/stderr excerpts for failed and blocked checks;
- full local run-folder path and paths to transcript, JSON, screenshots and feedback ZIP;
- clipboard text verification result and redaction summary.

The report should be complete enough to diagnose the usual launcher, environment, syntax, test and packaging failures without a second artifact. Set a documented maximum size (target 50 KB; hard limit 100 KB). If the full report exceeds the limit, include all metadata and failure excerpts plus a clear list of omitted log sections and their local paths. Never silently truncate the first failure.

## 4. Local run bundle

Each run creates `%TEMP%\SiteWorks-Diagnostics\<run-id>\` containing:

| Artifact | Required content |
|---|---|
| `feedback-report.txt` | Exact plain-text report copied to clipboard |
| `run.txt` | Full human-readable transcript, including all captured command output |
| `run.json` | Structured run, environment, stage, command, error and artifact metadata |
| `final-screen.png` | Screenshot of the final diagnostic capsule |
| `screenshots\` | Relevant stage/failure screenshots, when captured |
| `launcher-source.txt` | Launcher version/source and payload identity; no secrets |
| `manifest.sha256` | SHA-256 hashes of run artifacts, excluding the manifest |
| `feedback-bundle.zip` | Optional portable bundle containing the above artifacts |

The final report must name the exact run folder and ZIP path. Local paths are references only; ChatGPT cannot read them from a pasted path.

## 5. Stage model and fail-fast rules

Report these stages in order, marking non-applicable stages explicitly:

1. `BOOTSTRAP` — batch entry, temp workspace, run ID and launcher identity.
2. `PAYLOAD_VALIDATE` — embedded payload markers, extraction and payload identity.
3. `ENVIRONMENT` — OS, PowerShell, Node/npm/Git discovery.
4. `PROJECT_LOCATE` — project root, manifest/package identity and Git state.
5. `STATIC_CHECKS` — syntax, manifest, governance and tests available in the project.
6. `HELPER_CHECK` — helper self-test only when required PowerShell runtime is available; otherwise `BLOCKED`.
7. `EVIDENCE_FINALISE` — transcript/JSON, screenshot, report and hashes.
8. `CLIPBOARD_TEXT_VERIFY` — copy report as plain text, read it back, compare and record the result.

A parser/bootstrap/payload failure stops dependent stages and marks them `NOT RUN`. Missing optional tools produce `BLOCKED` for dependent checks, not a launcher crash. Never install prerequisites, elevate, modify Git state or change browser/Steam data automatically.

## 6. Clipboard semantics and fallback

- Preserve existing clipboard content at startup. Do not clear or overwrite it until the diagnostic report is complete and ready to copy.
- At finalisation, copy **plain text only** for the normal hand-off. Do not set an image format alongside it.
- Read clipboard text back and verify it matches the report. Record the verified character count and report hash.
- If text copy/read-back fails, preserve `feedback-report.txt` and show an explicit failure. Andrew can open and copy that text manually, or attach the feedback ZIP if necessary.
- Screenshots are saved locally. Do not describe a screenshot as a diagnostic archive.
- Do not assume that pasting a file path, ZIP path, or clipboard image transfers the file's contents to ChatGPT.

## 7. What Andrew sends back

**Normal case:** paste the clipboard text directly into the next ChatGPT message, then add manual requests in ordinary text. No diagnostic explanation is required.

**If the paste is visibly an image rather than text:** say so briefly or send the screenshot; the assistant must recognise that the text hand-off did not occur and must not treat it as a complete report.

**If the report says a supporting artifact is required:** attach only the requested `feedback-bundle.zip`, `run.txt`, `run.json` or named screenshot. Do not send browser cookies, Steam session data, passwords, API keys, authentication headers, full account IDs or unredacted private inventory exports.

Andrew's manual requests are independent input. The assistant must record and address them; automated diagnostics must not silently override them.

## 8. Assistant intake contract

On receipt of pasted text or an attachment, the assistant must:

1. Identify archive/build/launcher/payload/run IDs. If absent or mismatched, flag stale/untrusted evidence.
2. Determine whether the message is a full text report, a screenshot only, or an actual attached bundle. Never conflate them.
3. Diagnose from the earliest actionable failure. Later parser messages may be cascades; downstream stages marked `NOT RUN` are not evidence of success.
4. Extract every visible environment value, command and exit code; label missing/obscured data as unknown.
5. Request only the smallest missing artifact that materially changes diagnosis. Do not ask Andrew to interpret logs or repeat visible information.
6. Preserve and explicitly account for Andrew's manual requests.
7. Make the smallest safe correction, add regression coverage, update the canonical backlog and progress record, and package a new archive.
8. State what is verified offline versus what still requires Andrew's Windows run.
9. Give one exact next action. Do not provide competing routes.

## 9. Reliability acceptance gate

The loop is not accepted until two consecutive Windows runs demonstrate:

- correct archive, launcher and payload identity;
- successful parsing and execution under Windows PowerShell 5.1;
- unique run folders and complete required artifacts;
- accurate command output and exit codes, including a failure/`NOT RUN` test;
- readable self-contained clipboard text report with all required fields;
- clipboard read-back equality/hash verification;
- a final screenshot and feedback ZIP that open successfully;
- a deliberate clipboard-failure fallback that does not destroy existing evidence;
- no secrets or unnecessary personal identifiers in shared output;
- assistant can identify the run, earliest failure and next action from the pasted text without asking Andrew to interpret technical output.

Until these criteria are demonstrated, status remains `IN PROGRESS` or `BLOCKED`. A specification, successful API call, local ZIP creation or image-only paste is not proof of a working one-paste feedback loop.


## 9. FIX23 implementation note

FIX23 removes the combined image+text evidence-board clipboard path. The launcher now builds `feedback-report.txt` from run metadata, a first-failure/warning excerpt and the complete transcript (or a clearly labelled tail excerpt when the clipboard size limit is reached), writes `run.json`, saves the final screenshot locally, creates a local feedback ZIP, sets only Unicode plain text on the clipboard, and verifies exact read-back equality. Clipboard failure leaves the report and ZIP on disk and prints the manual report path. This is an implementation candidate; Windows PowerShell 5.1 runtime acceptance and actual ChatGPT paste acceptance remain outstanding.


## 10. Bootstrap parser preflight (FIX23)

The batch bootstrap parses the extracted PowerShell payload with `System.Management.Automation.Language.Parser` before execution. If syntax errors exist, it writes a standalone parse-failure report to `%TEMP%`, copies plain text to the clipboard, reads it back for exact equality, and exits without executing the invalid payload. This protects the feedback loop against the exact class of parser failure previously observed. The bootstrap decodes the payload as UTF-16LE and writes it with a Unicode BOM before parsing. The bootstrap itself remains a small encoded PowerShell entry point and still requires Windows acceptance.


## 11. Self-extracting launcher checksum boundary

`Andrew_next_task.bat` embeds the deployment ZIP that is also represented in the outer project archive. Including a hash of the launcher inside the embedded ZIP would create a recursive checksum dependency. The project file manifest therefore excludes the launcher; the exact downloadable outer ZIP is verified by its externally supplied SHA-256. The embedded deployment ZIP is rebuilt from the current project tree on every launcher release.


## FIX24 — parser defect repair
Andrew returned the FIX23 bootstrap's structured Windows PowerShell 5.1 parser report. The first actionable syntax defect was an unterminated single-quoted string in the diagnostic report array: `('USER PROFILE: [REDACTED]),`. FIX24 changes it to `('USER PROFILE: [REDACTED]'),` and adds a regression test for the exact line. The subsequent `WINDOWS:` token, missing parenthesis/brace and `finally` errors were parser cascades from that unterminated string, not independently established defects. Run only the FIX24 archive and return the next plain-text report. Do not declare the launcher accepted until Windows confirms the entire payload parses, the workflow completes or reports a truthful blocked state, clipboard read-back matches, and the report pastes into ChatGPT as text.


### FIX25 logging correction (2026-11-22)
FIX24 Windows evidence showed that `Start-Transcript` and `Add-Content` were writing to the same path, causing file-sharing IOExceptions. FIX25 uses a dedicated `SiteWorks-transcript-<run>.txt` for PowerShell transcript capture and a separate `SiteWorks-next-task-<run>.txt` for launcher event entries. The run bundle retains them as `run.txt` and `launcher-events.txt` respectively. A clean run must show no repeated file-lock warnings.


### FIX26 deployed-project verification (2026-11-22)
FIX25 Windows evidence confirms the transcript/event-log separation works: no file-lock warnings appeared, deployment completed, and clipboard read-back matched. It did not prove that the deployed project passed its own automated checks. FIX26 runs `npm run verify` from the deployed target when `node.exe` and `npm.cmd` are available. The report and `run.json` record deployment status, backup/deployment Robocopy exit codes, project verification status and its exit code. Outcomes distinguish a verified deployment, deployment without verification, failure/blockage and user cancellation. A passing offline verification remains separate from Brave, native-helper and Steam live acceptance.


### FIX26 opt-in Node.js recovery (2026-11-22)
FIX26's Windows report showed that deployment and clipboard hand-off succeeded but project verification was blocked because Node.js or `npm.cmd` could not be found. FIX26 refreshes PATH, checks common Node.js install locations, and asks before using winget to install Node.js LTS. No installation occurs without an explicit Y response. The report records toolchain status and Node/npm versions. If installation is declined or winget is unavailable, verification remains explicitly blocked; do not treat deployment as project acceptance.


### FIX27 opt-in Node.js recovery (2026-11-22)
FIX26's Windows report showed that deployment and clipboard hand-off succeeded but project verification was blocked because Node.js or `npm.cmd` could not be found. FIX27 refreshes PATH, checks common Node.js install locations, and asks before using winget to install Node.js LTS. No installation occurs without an explicit Y response. The report records toolchain status and Node/npm versions. If installation is declined or winget is unavailable, verification remains explicitly blocked; do not treat deployment as project acceptance.


### FIX27 evidence / FIX28 hand-off (2026-11-22)
FIX27 completed deployment and deployed-project verification on Windows PowerShell 5.1: Node v26.13.1, npm 11.20.0, `npm run verify` exit 0, 96/96 tests, 40 JavaScript syntax checks, 125 manifest entries, governance pass and clipboard read-back verified. A passing test title containing “failed” was incorrectly selected as a warning excerpt. FIX28 corrects that filter and distinguishes automated verification from pending live acceptance. Run FIX28 once, then continue TODO-003 through TODO-007; do not reinstall Node.js.

# Site Works Recovery Plan

Prepared 21 November 2026 · Baseline: Site Works 1.6.9 (R2 Hotfix 19) · Status: engineering recovery complete, live acceptance outstanding

## 1. Purpose and summary

This plan takes Site Works from "handover failed" to "safe to hand to the next developer and safe to build on". It stands on its own: you do not need the repository to read it.

The original handover failed because the project could not be trusted, not because the code was broken. 77 of 77 tests passed on the delivered archive. The problems were in provenance and documentation. The repository was at version 1.5.0 while 19 hotfixes of work sat uncommitted. The handover pack claimed no repository existed. Git reported about 3,000 changed lines that were mostly line-ending noise. The popup showed the wrong build number. Several documents described versions that no longer existed.

The plan has four phases. Phase 1 is done. Phases 2 to 4 are what remain, and Phase 2 is the gate for everything else.

| Phase | Goal | Status |
| --- | --- | --- |
| 1. Stabilise the record | Make the project reproducible and its documents truthful | Done |
| 2. Prove it works live | Run the product on real Brave and a real Steam account and record evidence | Not started, blocks Phase 4 |
| 3. Close the engineering risks | Execute the helper, test persistence failure, settle owner decisions | Not started |
| 4. Resume the roadmap | Plan R3 onward from a verified base | Blocked on Phase 2 |

## 2. Phase 1: Stabilise the record (done)

Everything below was completed and verified from a fresh clone: 84 of 84 tests pass, the syntax check covers 36 files, and all 83 files match the checksum manifest.

- Committed 1.6.9 to git exactly as received, kept as a tagged snapshot, then applied fixes in a separate commit so the rescue changes can be reviewed on their own.
- Added line-ending rules so git shows 7 genuinely changed files instead of 26, and so checksums are identical on every operating system.
- Fixed the popup build label from 1.6.8 to 1.6.9, and replaced the test that enforced the wrong text with one that derives the expected value from the extension manifest.
- Generated the release-notes page from the release-notes source file so the two cannot drift. Brought both READMEs up to date.
- Removed a per-machine helper registration file that contained a Windows username and path. A test now fails if such a path reappears.
- Added a repeatable verification command and continuous integration covering three Node versions and a Windows PowerShell index rebuild.
- Corrected the false statements in the handover pack, recorded the helper's static security review, and updated the technical-debt register.

**Exit criterion met:** a stranger can clone the repository, check out the 1.6.9 tag, run one command and get an all-green result.

## 3. Phase 2: Prove it works live (the gate)

No one has recorded a run of the extension against real Steam. Inventory synchronisation, price enrichment and quick-sell are checked only by reading their source, not by running them. Until this phase is done, treat every claim about Steam behaviour as unproven.

### 3.1 Setup

1. Clone the repository, check out the 1.6.9 tag and run the verification command. Expect all green.
2. Load the extension unpacked in Brave and open the extension page. It should show no errors. The popup should read 1.6.9 · R2 Hotfix 19.
3. Run the file-helper installer, then reload the extension. The Manage page should report the helper as connected.
4. Use a throwaway Steam account or a small inventory first. Do not start with a large or valuable one.

### 3.2 Test order

Run the cases in the existing R2 acceptance matrix in this order, stopping at the first failure:

1. Permission gate: a script must ask before running, and a changed script must ask again.
2. Inventory synchronisation on a small inventory: counts of assets, unique designs and quantities are correct, and a saved snapshot is only marked complete when Steam reports completion.
3. Stop and resume: stopping preserves partial data and does not interfere with a Steam request already in flight.
4. Price enrichment: eligible designs are found (this was the Hotfix 19 bug), prices are saved, and a throttle response stops the batch with no automatic retry.
5. Persistence: reload the browser and the extension, then confirm saved data and the rebuild-from-journal function agree.
6. Quick-sell and bulk listing removal last, with the confirmation prompts and per-run cap checked. Do not run these on anything you cannot afford to lose.

### 3.3 Evidence to capture for every case

Browser and Windows versions, Steam page and app, inventory size, operator, start and end times, console output, screenshots and a snapshot of the saved data. Remove account identifiers before sharing.

**Exit criterion:** every matrix case has a recorded pass, or a logged defect with severity. Any failure in cases 1 to 4 is fixed and the case rerun before moving on.

## 4. Phase 3: Close the engineering risks

These can run alongside Phase 2, but none of them substitutes for it.

| Risk | Action | Done when |
| --- | --- | --- |
| Helper has only been read, never executed | Run it on a clean Windows account. Send malformed, oversized and unknown messages. Try a junction inside the sites folder. | Each hostile input is refused and nothing is written outside the sites folder |
| Saved data lives in two stores that are not updated together | Inject a failure between the two writes and confirm the rebuild path recovers | Recovery is repeatable and has a test |
| Steam's internals can change without notice | Define a small adapter around the page functions the script depends on, with a visible "blocked" state when they are missing | A change on Steam's side produces a clear message, not wrong data |
| Broad host permission across all websites | Document why it is needed and test whether optional permissions are workable | A written decision exists either way |
| One 100 KB inventory script | Leave it alone until Phase 2 passes, then split it behind the existing tests | Behaviour is unchanged after the split |

### Decisions needed from the project owner

1. **Toolbox.** The keyboard shortcut and menu entry still exist, but the script behind them was retired. Restore the script or remove the entry.
2. **Retired files.** Archived `.old` scripts and the trash folder are still tracked in git. Delete them (history keeps them) or keep them.
3. **Permissions.** Keep the all-websites permission as is, or move to optional permissions.

## 5. Phase 4: Resume the roadmap

R3 to R7 currently exist as themes, not requirements. Before scheduling any of them, write acceptance criteria and a test approach, and only start once Phase 2 has passed. New work follows the release routine: bump the version, add release notes, update the popup label, regenerate the release-notes page and checksum manifest, pass the verification command, commit and tag.

## 6. Rolling out the recovered repository

1. Take the rescued copy and, from its folder, push the branch and the tags to the GitHub origin. This should be a fast-forward from 1.5.0.
2. On the original developer's machine, pull the new history. **The helper registration file is now untracked, so the pull will delete it.** Run the helper installer once afterwards and reload the extension. Browser settings and saved decisions are not affected.
3. Keep the as-received tag. It is the evidence of what was actually handed over.

## 7. Rollback

The previous release is tagged 1.5.0 and the as-received snapshot is tagged separately. To roll back, check out the earlier tag and reload the extension. Saved decisions are stored in the browser and are not tied to the folder, but the extension ID is fixed by the manifest key, so no reinstall of the helper is needed unless the folder moves.

## 8. Risks to this plan

- **Steam changes mid-test.** Record the date and page structure with each run, and treat a new failure as a possible site change before assuming a code defect.
- **Throttling.** Price enrichment can be rate-limited. The design stops rather than retries, so budget for a test run to take several sessions on a large inventory.
- **Evidence gaps.** If a case is not recorded it did not happen. Do not mark Phase 2 complete on memory.
- **Scope creep.** The temptation after a rescue is to refactor. Hold all structural changes until live acceptance has passed.

## 9. Definition of recovered

The project counts as recovered when all of these are true: a fresh clone passes the verification command; the live acceptance matrix has recorded results with no open high-severity defect; the helper has been executed and abused on a clean Windows account; the three owner decisions are written down; and the next release was cut using the documented routine without needing the outgoing developer.

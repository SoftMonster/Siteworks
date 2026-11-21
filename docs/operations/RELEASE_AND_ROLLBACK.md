# Release and Rollback Procedure

## Current release facts

- Manifest version: 1.6.9.
- Package version: 1.6.9.
- Release lineage described by handover: 1.6.7 HF17 → 1.6.8 HF18 → 1.6.9 HF19.
- Package scripts: `npm test`, `npm run check`, `npm run verify`, `npm run release-notes`, `npm run manifest`.
- No bundler or dependencies, so no lockfile is needed.
- Source of truth: git, tag `v1.6.9`; the previous release is tag `v1.5.0`. Rollback = check out the earlier tag and Reload the extension.

## Cutting a release (repeatable)

1. Bump `version` in `manifest.json` and `package.json`.
2. Add a `# Site Works X.Y.Z — <label>` section to the end of `RELEASE_NOTES.md`.
3. Update the build-identity line in `popup.html` and the version in `README.md` / first line of `README.txt` (the consistency test tells you what is stale).
4. `npm run release-notes && npm run manifest`
5. `npm run verify` must pass (CI runs it on Node 18/20/22 and rebuilds the index on Windows PowerShell).
6. Commit, `git tag vX.Y.Z`, `git push --follow-tags`.
7. Do the live Brave/Steam checks in `quality/R2_ACCEPTANCE_MATRIX.md` and record the evidence.

## Before changing a release

1. Keep the previous known-good ZIP immutable.
2. Work in a separate directory.
3. Record the source revision if using a repository; if not, record the baseline ZIP SHA-256.
4. Identify changed files and expected behaviour.
5. Add/update tests.
6. Run tests and syntax check.
7. Rebuild generated `sites/index.json` if needed.
8. Inspect manifest permissions and native helper changes.
9. Perform a clean unpacked extension smoke test.
10. Perform relevant live Steam tests.
11. Update release notes and handover evidence.
12. Generate a file hash manifest and ZIP integrity test.

## Suggested release evidence

- Version and release identifier.
- Source revision / baseline archive hash.
- Build/package command and environment.
- Changed-file list.
- `npm test` output.
- `npm run check` output.
- Browser load smoke test.
- Native helper smoke test if changed.
- Steam acceptance results if inventory/market behaviour changed.
- Security/permission review.
- Known defects and rollback instructions.

## Rollback

1. Disable the current unpacked extension.
2. Preserve logs and local data before changing anything.
3. Load the prior known-good release folder as an unpacked extension.
4. Confirm extension ID and helper registration compatibility. The manifest's fixed key is intended to keep the ID stable, but verify in the target browser.
5. Do not delete IndexedDB/localStorage data during rollback unless a documented migration requires it.
6. Confirm old code can read the current data schema. If not, restore a matching data backup or use a tested migration/rollback procedure.
7. Re-test basic script matching and permission prompt behaviour.
8. Record the rollback reason and affected data.

**Warning:** application-code rollback does not automatically roll back browser storage schema changes. No general reverse-migration guarantee is established by this archive.

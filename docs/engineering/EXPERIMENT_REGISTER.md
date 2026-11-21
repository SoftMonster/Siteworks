# Experiment Register

## Evidence policy

The release notes and architecture document contain historical descriptions of experiments and observations. The supplied archive does not include a complete dated lab notebook, raw browser captures or all original experiment outputs. Therefore this register records what can be supported and identifies missing evidence. Do not invent numerical outcomes.

## E-001 — Steam inventory controller inspection

- **Question:** can Site Works observe Steam's active inventory controller and native loader?
- **Observed names:** `window.g_ActiveInventory`, `m_rgAssets`, `m_rgDescriptions`, `m_cItems`, `m_ulLastAssetID`, `m_bFullyLoaded`, `m_ActivePromise`, `LoadMoreAssets()`, `AddInventoryData(data)`.
- **Evidence:** `WEBDATA_FILEDATA_ARCHITECTURE.md`.
- **Conclusion:** native loader integration was adopted when capabilities are present.
- **Limitation:** one Steam page build observation, not a Valve API guarantee.
- **Missing:** raw captures, exact browser/Steam build, repeatability matrix.

## E-002 — Inventory counts and visual page counts

- **Recorded observations:** one sample showed 2,000 assets and 2,000 descriptions; a later sample showed 2,000 assets and 400 descriptions. Another inspection recorded 17,318 reported items, 693 visual pages and 25 visible tiles.
- **Conclusion:** asset, description, reported-item and visual-page counts are different concepts and must not be conflated.
- **Limitation:** session-specific figures, not constants or acceptance targets.
- **Missing:** raw evidence and exact sample conditions.

## E-003 — Stable page snapshot discovery

- **Question:** can design discovery safely read visual pages when content loads asynchronously?
- **Historical implementation/test evidence:** R2.8 tests cover complete stable page snapshots, visible tiles, incomplete-page handling, navigation failure and resumable progress.
- **Conclusion:** discovery waits for stable complete page snapshots rather than treating an incomplete page as zero new designs.
- **Missing:** live performance measurements and false-stability/timeout observations.

## E-004 — Native loader versus DOM fallback

- **Decision recorded:** native Steam loader preferred when required capabilities exist; DOM-page fallback retained as fallback.
- **Reason recorded:** native loader owns request construction, continuation and merge behaviour.
- **Risk:** fallback depends on visual controls and can be brittle.
- **Missing:** comparative reliability/performance results and fallback retirement criteria.

## E-005 — Inventory and market-price cooldown separation

- **Decision:** market-price cooldown must not block inventory synchronisation, local list viewing or journal reconstruction.
- **Evidence:** HF19 release notes and `r2.9.test.cjs`.
- **Conclusion:** independent endpoint lifecycle is represented in code/tests.
- **Missing:** live controlled test and full response-code fixture catalogue.

## E-006 — Numeric app ID eligibility correction (HF19)

- **Problem recorded:** escaped regular expression could reject numeric IDs and produce zero eligible designs despite existing inventory/price records.
- **Change recorded:** eligibility predicate corrected.
- **Evidence:** HF19 release notes and test `HF19 recognises numeric Steam app IDs for price eligibility`.
- **Conclusion:** regression covered offline.
- **Missing:** original failing production capture and live confirmation.

## E-007 — Stop and resume semantics

- **Historical tests:** R2.7/R2.8 cover progress persistence, resume cursor, Stop interruption and avoiding a new navigation after Stop.
- **Conclusion:** intended behaviour has regression coverage.
- **Missing:** live browser interruption/reload evidence.

## Required experiment record for future work

For every material experiment capture: ID, date/time, author, code revision, hypothesis, controlled variables, environment, input data, procedure, raw output/logs, result, interpretation, limitations, decision, linked code change and regression test. Keep observations separate from conclusions.

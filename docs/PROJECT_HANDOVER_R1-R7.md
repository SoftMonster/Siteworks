# Site Works — Project Handover: R1–R7

**From:** Mike, outgoing project lead  
**To:** Sandy, incoming project lead  
**Release baseline:** Site Works 1.6.9 · R2 Hotfix 19  
**Handover date:** 21 November 2026  
**Document status:** Revised handover following Sandy review; verified package facts, historical reported results, unperformed validation and proposed remediation are explicitly distinguished

---

## 1. Purpose and handover position

Sandy,

This document transfers the project context, technical decisions, release history, experiments, lessons learned, operating principles and proposed roadmap from R1 through R7. It is intended to let you continue the work without having to rediscover why the current architecture exists or repeat experiments that have already produced useful evidence.

The authoritative software baseline for this handover is the supplied **Site Works 1.6.9 — R2 Hotfix 19** release. The release notes and `docs/WEBDATA_FILEDATA_ARCHITECTURE.md` are the primary project records. The functional design and technical specification PDF is the earlier design reference; where implementation and earlier design differ, the current source and cumulative release notes describe the delivered behaviour.

A critical status distinction:

- **R1 is implemented** in 1.4.0.
- **R2 is implemented in substantial increments but is not yet accepted as complete.** The current baseline is 1.6.9 / Hotfix 19. Live Brave/Steam acceptance remains outstanding.
- **R3–R7 are roadmap proposals**, not delivered capabilities or approved commitments. Treat the descriptions below as a planning framework requiring product-owner confirmation and detailed specification.

Do not represent R2 as complete merely because automated tests pass. Do not begin R3 implementation until R2 has passed agreed live acceptance and the project owner has explicitly authorised the next release scope.

> **Evidence caution:** This revision does not convert outstanding work into completed work. The HF19 package reports 77 passing tests and 22 JavaScript files checked, but the commands have not been rerun as part of this document revision and live Brave/Steam acceptance remains outstanding.

## 2. Product overview

Site Works is a browser extension built around user-controlled site-specific tools. Its current delivered work includes shared extension infrastructure, configuration and permission controls, and Steam inventory/design/market-price intelligence.

The project has evolved from a set of site scripts into a more structured extension with shared services, a native file helper, site-specific modules, test coverage, release identity, cumulative release notes and documented data architecture.

The Steam R2 work distinguishes several concepts that must not be conflated:

- **Asset entry:** an individual Steam inventory asset record.
- **Design:** a unique `market_hash_name` identity.
- **Item quantity:** the sum of asset `amount` values grouped by design.
- **Description record:** metadata used to resolve an asset to a design; description count is not expected to equal asset count.
- **Webdata:** data currently exposed by the Steam webpage in memory.
- **Filedata:** Site Works' locally persisted, reconciled inventory model.
- **Saved price data:** independent market-price observations, sourced separately from inventory webdata.

The distinction between a design and an owned item is fundamental. A catalogue can contain designs with no known holding quantity; an inventory can contain multiple assets for one design; an asset can represent a stack with `amount > 1`; and a description dictionary can contain fewer records than there are assets.

## 3. Release and roadmap overview

| Release | Theme | Status at handover | Evidence / baseline |
|---|---|---|---|
| R1 | Reliability & Configuration | Implemented | 1.4.0 |
| R2 | Inventory Intelligence | Active; live acceptance outstanding | 1.5.0–1.6.9, HF19 |
| R3 | Market Intelligence & Trading | Proposed | Not implemented as a release |
| R4 | Badge & Collection Management | Proposed | Not implemented as a release |
| R5 | Steam Library Intelligence | Proposed | Not implemented as a release |
| R6 | Automation & Data Management | Proposed | Not implemented as a release |
| R7 | Unified Steam Command Centre | Proposed | Not implemented as a release |

### R1 — Reliability & Configuration (implemented)

R1 established the shared foundation on which later work depends. The 1.4.0 release notes record shared infrastructure, safety/reliability changes, compatibility and validation work. The key architectural intent is to make site tools operate through consistent shared services rather than each script inventing its own configuration, permission and execution conventions.

Handover expectations:

- Preserve the existing extension manifest and shared execution model.
- Treat user approval and configured permissions as explicit prerequisites, not implicit assumptions.
- Keep site-specific behaviour separate from shared infrastructure.
- Preserve backward compatibility unless a migration is deliberate, documented and tested.
- Consult the R1 release notes for the exact delivered feature inventory; do not infer additional features from the roadmap title.

### R2 — Inventory Intelligence (active; not yet accepted)

R2 extends the Steam-facing functionality with inventory discovery, holdings, design cataloguing, saved market prices, price history, valuation, filters and inventory comparisons. The work then concentrated on reliable acquisition from Steam's changing inventory page and runtime.

The current R2 baseline is **1.6.9 / Hotfix 19**. The central architecture is now webdata → journal → filedata, with saved market prices treated as separate enrichment data.

R2 acceptance must verify, in a real Brave/Steam session:

1. The extension identifies the active Steam inventory and reads the available webdata.
2. The current webdata is committed before requesting further batches.
3. Native Steam loading is used only when the required runtime capabilities are present.
4. Batches are journalled and reconciled without corrupting or duplicating filedata.
5. Partial state remains explicitly partial after stop, error, refresh or interrupted acquisition.
6. Completion is asserted only when Steam reports `m_bFullyLoaded === true` and all non-currency assets resolve to design identities.
7. Price enrichment operates independently and does not determine inventory completeness.
8. Existing saved price records/history are migrated and projected correctly.
9. UI tabs have the intended ownership: Design capture acquires inventory; Price capture enriches prices; Inventory list is read-only.
10. Endpoint throttling, Stop behaviour, reload/recovery and failure paths behave conservatively.

### R3 — Market Intelligence & Trading (proposed)

Potential direction: build on the R2 separation between owned inventory and market observations to provide stronger market intelligence and controlled trading workflows.

Candidate capabilities for investigation and specification:

- Price trend and freshness analysis across saved observations.
- Listing/buy-order spread and liquidity context, with currency validation.
- More useful valuation scenarios, clearly labelled as estimates rather than guaranteed proceeds.
- Identification of designs that may merit listing or repricing, without automatically initiating transactions.
- User-defined thresholds and review queues.
- Explicit transaction confirmation, audit records and safeguards around any action that changes a Steam account.

No trading automation should be assumed to exist. Any future implementation must distinguish read-only market analysis from actions that create, modify or cancel listings. Transaction fees, market liquidity, regional/currency differences, Steam policy and rate limits require explicit treatment.

### R4 — Badge & Collection Management (proposed)

Potential direction: manage Steam badge crafting and collection progress using reliable inventory/design information.

Candidate capabilities:

- Collection and badge progress views.
- Identification of owned, missing and duplicate trading-card designs.
- Foil versus non-foil distinctions where the source data supports them.
- Crafting readiness and missing-item summaries.
- Collection goals, exclusions and user-defined priorities.
- Read-only planning first; any crafting or market transaction must remain a separately authorised action.

Do not infer craftability from a design name alone. Validate app, set, card type, foil status, tradability and current Steam state before presenting an actionable recommendation.

### R5 — Steam Library Intelligence (proposed)

Potential direction: extend beyond inventory into the user's Steam game library and associated metadata.

Candidate capabilities:

- Library catalogue and metadata enrichment.
- Ownership, playtime and collection views where supported by available Steam data.
- Genre, franchise, completion and backlog organisation.
- Duplicate/edition awareness and wishlist/library comparisons.
- User-controlled filters, tags and exportable reports.

Treat privacy and data minimisation as design requirements. Do not assume that private profile data or unavailable API fields can be accessed. Separate observed data from inferred classifications.

### R6 — Automation & Data Management (proposed)

Potential direction: make recurring data maintenance and user-approved workflows more reliable and transparent.

Candidate capabilities:

- Scheduled or user-triggered refresh orchestration with visible status.
- Durable task state, pause/resume and idempotent operations.
- Import/export, backup, restore and schema migration tools.
- Data provenance, timestamps, source status and diagnostics.
- Configurable retention and cleanup policies.
- A central activity/audit history for significant operations.

Automation must not bypass the permission model, conceal requests, retry aggressively after throttling or perform account-changing actions without explicit user authorisation. A failed operation should leave a recoverable and accurately labelled state.

### R7 — Unified Steam Command Centre (proposed)

Potential direction: consolidate the Steam-facing capabilities into a coherent user experience once the underlying domains are stable.

Candidate capabilities:

- Unified dashboard across inventory, prices, badges, library and automation.
- Consistent navigation, search, filters, status and terminology.
- Cross-domain summaries without merging distinct sources of truth.
- User-configurable panels and workflows.
- Shared diagnostics and operation history.

R7 should be an integration and usability milestone, not a reason to prematurely couple the underlying data domains. The separate ownership boundaries established in R2 should remain explicit.

## 4. R2 evolution: experiments, approaches and lessons

The R2 history is important because several apparently simpler approaches proved unreliable. The following is a synthesis of the cumulative release notes and current architecture document.

### 4.1 Visual pagination and full-page scanning

Early iterations traversed Steam's visible Previous/Next inventory controls. The implementation introduced a minimum four-second interval between page navigations, explicit Stop behaviour, persistent progress and resumable discovery.

Experiments exposed several failure modes:

- A fixed delay did not prove that a page had finished loading.
- A tile changing did not prove that all descriptions for the page were ready.
- A page with no new designs did not prove that later pages contained no new designs.
- A failed or incomplete page must not be recorded as a successful zero-new-design page.
- A large page count or estimated item total is not proof of inventory completeness.

Hotfix 8 replaced the unreliable first-tile/fixed-delay assumption with a stable page snapshot. It waited until every rendered tile had a usable `market_hash_name` and the complete page snapshot remained unchanged across observations for at least 1.5 seconds, with a 30-second validation timeout. Incomplete or unstable pages were not committed as zero-new-design results.

Lesson: asynchronous interfaces require validation of the complete unit of work, not a convenient visual symptom. A timeout is a stop condition, not a licence to guess or automatically retry.

### 4.2 Stop, resume and partial success

Stop behaviour was refined so that a committed page advances the resume cursor, while a page that had not passed validation remains the next resume target. Later work made Stop interruptible during page-change waits, stability polling and inter-page delays.

Lesson: partial success is valuable only when its boundary is explicit and recoverable. Commit verified work incrementally; do not discard it because a later step fails; do not label it complete.

### 4.3 Independent throttling domains

Market-price requests and inventory-description/page loading developed separate cooldown state machines. HTTP 429 and other blocking/unavailable responses stop the relevant queue. Cooldowns are conservative local pauses, not claims about Valve's internal reset schedule. The extension avoids automatic retry loops.

The early releases included manual recovery probes. By HF19, the market-price recovery probe had been removed: after the endpoint-specific cooldown expires, the user may explicitly start another enrichment batch. A market-price cooldown must not block webdata reads, filedata rebuilds or inventory display.

Lesson: throttling belongs to the endpoint or operation that caused it. A market-price failure must not poison inventory state. Never hammer Steam after a 429; no automatic retry is the safer default.

### 4.4 Design catalogue versus inventory holdings versus price cache

The project initially had multiple overlapping stores and concepts: known designs, full inventory scans and cached prices. Iterations made the UI and data model distinguish catalogue designs, inventory holdings, quantities and price observations.

HF10 expanded the set of priceable candidates using the union of known designs, inventory holdings and cached price entries, while ensuring that valuation remained based only on actual holdings. Unknown quantity was shown as unknown, not zero.

HF14 separated the UI into Design capture, Price capture and Inventory list. HF15 corrected a persisted filter that could hide the visible catalogue. HF16 consolidated discovery and holdings scanning while retaining independent cooldown/error handling.

Lesson: a candidate for price lookup is not necessarily an owned item; a design count is not an item count; and unknown quantity is not zero. Data model distinctions must be visible in the UI.

### 4.5 Native Steam inventory loader investigation

HF17 made Steam's cumulative in-memory inventory data the preferred acquisition source when the expected runtime capabilities exist. The observed object was `window.g_ActiveInventory`, with fields/methods including:

- `m_rgAssets`
- `m_rgDescriptions`
- `m_cItems`
- `m_ulLastAssetID`
- `m_bFullyLoaded`
- `m_ActivePromise`
- `LoadMoreAssets()`
- `AddInventoryData(data)`

The inspected loader checked active app identity, active promise, fully-loaded state and a recent-error interval, then delegated to its master loader. The observed master assembled request parameters such as `count` and `start_assetid` and merged successful responses through `AddInventoryData()`.

Site Works does not construct a competing Steam request protocol when the native loader is available. It asks Steam's own loader to obtain the next batch and observes the resulting in-memory state. Stop does not cancel Steam's private request; it waits for the current operation to settle and then prevents another batch.

The DOM-page scanner remains a compatibility fallback when the native runtime surface is unavailable.

Lesson: use the host application's own loader when its capabilities can be safely detected. This reduces duplicated protocol logic but introduces a dependency on undocumented website internals; capability detection, fallback behaviour and live validation are therefore essential.

### 4.6 Webdata journal and filedata projection

HF18 formalised **webdata** and **filedata** terminology and introduced an append-only, versioned IndexedDB journal. The live Steam controller object is not serialised because it contains runtime-only properties, methods, DOM references and potentially cyclic structures.

Current persistence model:

- IndexedDB database: `siteworks_webdata_journal`, schema version 1.
- Object stores: `batches` and `meta`.
- Journal batches record app/context identity, timestamp, batch number, completion flag, reported item count, asset/description counts, continuation marker and changed/new serialisable records.
- Canonical filedata key: `siteworksFiledata_v1` in localStorage.
- Filedata contains a `designs` projection and an `inventory` projection; the latter records completeness and holdings.
- Legacy `siteworksKnownCardDesigns_v1` and `siteworksInventoryFullScan_v1` records are read for migration; new writes use the canonical record.
- `S.rebuildFiledataFromWebdataJournal()` rebuilds the application-facing projection from captured journal data.

The journal preserves captured source records. Filedata is the current application-facing materialised view. They are not competing inventories or competing authorities.

Lesson: persist serialisable source facts, then derive a rebuildable projection. Keep provenance and source boundaries clear. Avoid storing live runtime objects as if they were durable data.

### 4.7 Market-price boundary and HF19 correction

Market prices come from Steam's separate `/market/priceoverview/` endpoint. Inventory webdata does not guarantee a current lowest listing, median sale price or buy-order value. A complete inventory can therefore coexist with missing saved prices.

HF19:

- Corrected the market-price eligibility predicate so numeric app IDs are recognised.
- Renamed the operation to **Enrich prices**.
- Removed the manual Steam recovery-probe action.
- Scoped market-price cooldown to the market-price endpoint.
- Projected saved prices and price history into shared `siteworksFiledata_v1`, retaining the legacy `cardShelfInvCache` store for compatibility.
- Clarified that missing price data is not zero and is not proof that no market listing exists.

Lesson: optional enrichment must never redefine the completeness of the primary dataset. Keep the market endpoint's lifecycle separate from Steam inventory acquisition.

## 5. Current architecture and operational contracts

### 5.1 Data acquisition flow

1. User starts **Synchronise inventory** in Design capture.
2. Site Works reads current Steam webdata immediately.
3. It writes a versioned journal batch containing serialisable asset/description fields.
4. It reconciles the current webdata into filedata.
5. If the native Steam loader is available, Site Works asks it for the next batch, one at a time.
6. After each successful load, changed/new records are appended to the journal and filedata is updated.
7. Completion is recorded only when Steam reports `m_bFullyLoaded` and every non-currency asset resolves to a design identity.
8. Price capture reads the shared design set and adds separate saved price data.
9. Inventory list reads filedata and saved prices; it does not acquire inventory.

### 5.2 UI ownership rules

- **Design capture:** owns the single Synchronise inventory operation and Stop.
- **Price capture:** owns market-price requests only; it reads known designs from filedata.
- **Inventory list:** read-only presentation of filedata plus saved price data. Search, sort and filters must not initiate inventory requests.

Do not add an inventory-acquisition button to Price capture or Inventory list.

### 5.3 Completeness contract

Complete means both:

- Steam has set `m_bFullyLoaded === true`.
- Every non-currency asset entry can be resolved to a design identity.

Never infer completion from a percentage, visual page count, stable asset count, absence of an active request or a reported item count alone. Partial filedata must remain visibly partial after Stop, failure or page reload.

### 5.4 Website dependency boundary

The Steam fields and methods above were observed on 21 November 2026. They are not Valve guarantees or stable public APIs. The documented sample observations included 2,000 assets with 2,000 descriptions in one observation and 2,000 assets with 400 descriptions in another. A separate page inspection reported 17,318 items, 693 visual pages and 25 visible tiles. These are session-specific examples, not constants.

When Steam changes, use read-only DevTools inspection. Confirm the active inventory object, app/context identity, field/method presence and types, and take timed samples. Inspect current method source only for methods that exist. Verify description association by class/instance identity. Do not manually invoke private loader methods during diagnosis. Prefer capability detection and a small adapter over version-string checks or brittle source-string matching.

If a required field or method disappears, fail closed: preserve committed filedata, report the missing capability and do not guess a request URL or continuation state.

## 6. Standards, philosophies and working methodology

### 6.1 Evidence before assumptions

Use the current source, release notes, tests and observed runtime behaviour as evidence. Label observations, assumptions, estimates and proposals distinctly. Do not turn a one-session measurement into a fixed product constant. Do not report automated tests as live browser acceptance.

### 6.2 Default-deny permission model

The extension's permission gate is designed to be explicit and conservative. Approval is bound to the approved content using SHA-256 and execution is folder-driven. This is an approval/permission mechanism, not a security sandbox. Do not claim that it makes arbitrary scripts safe. Preserve default-deny behaviour and make approval state visible and revocable through the established controls.

### 6.3 Separation of concerns

Keep shared extension infrastructure separate from site-specific code. Keep acquisition separate from presentation. Keep inventory facts separate from market observations. Keep endpoint cooldowns independent. Keep the journal separate from its materialised projection. Each component should have one clear responsibility and a narrow interface.

### 6.4 Capability detection over brittle assumptions

Detect the actual runtime capabilities needed before selecting an integration path. Avoid assuming a particular Steam page version, fixed item count, fixed number of pages or one-description-per-asset relationship. Retain a tested fallback where practical, but do not let it become a second source of truth.

### 6.5 Incremental commits and recoverability

Commit verified work in bounded units. Preserve successful batches when later work fails. Make Stop and resume semantics deterministic. Keep enough metadata to explain what was committed, what remains incomplete and where a manual continuation should begin.

### 6.6 Fail closed and avoid aggressive retries

On missing capabilities, invalid data, unstable pages, unexpected responses or throttling, stop the relevant operation and preserve prior committed state. Do not automatically hammer Steam after HTTP 429. A user-initiated retry after a cooldown is different from an automatic retry loop.

### 6.7 Terminology as a correctness tool

Use the documented terms consistently: webdata, filedata, webdata journal, saved price data, asset entry, design, quantity and description. Avoid ambiguous user-facing use of “cache” for inventory acquisition. Do not label missing data as zero.

### 6.8 Test at the correct level

Automated tests establish deterministic logic and regression protection. Syntax checks establish parse validity. ZIP integrity establishes archive readability. None proves live Brave/Steam behaviour. Report each validation category separately.

### 6.9 Preserve user agency

Operations that initiate network activity or change account state should be visible, deliberate and controllable. Stop must be meaningful. Read-only analysis should not unexpectedly initiate acquisition. Account-changing operations in any future roadmap phase require explicit confirmation and a clear audit trail.

## 7. Validation status at handover

The R2 Hotfix 19 release record reports:

- Automated test suite: **77 passed, 0 failed**.
- JavaScript syntax check: **22 files passed**.
- ZIP integrity: checked.
- Live Brave/Steam acceptance: **not performed**.

The following live checks remain outstanding and should be treated as release-acceptance work, not assumed successful:

- Native Steam loader streaming through multiple batches.
- Correct `m_bFullyLoaded` completion and final description resolution.
- IndexedDB journal persistence and recovery after refresh/interruption.
- Filedata rebuild from the journal.
- Stop behaviour while a native request is active.
- Migration/projection of legacy saved price records and history.
- Numeric app-ID price eligibility in a real Steam session.
- Independent market-price cooldown behaviour.
- UI integration across Design capture, Price capture and Inventory list.

## 8. Immediate priorities for Sandy

1. Preserve **1.6.9 / R2 Hotfix 19** as the baseline. Do not silently alter its functional design while validating it.
2. Install the release in the intended Brave environment and perform the live acceptance checks in Section 7.
3. Record exact browser version, Steam page context, app/context identity, inventory state, observed counts, timestamps and console/network errors where relevant.
4. Diagnose failures against the documented data flow before changing code. Identify whether the fault is acquisition, journal persistence, filedata reconciliation, price enrichment or presentation.
5. Fix only confirmed defects. Keep changes narrow and add regression tests for each correction.
6. Re-run the complete automated suite, syntax checks and ZIP integrity checks after every change.
7. Update cumulative release notes and the architecture document whenever behaviour or assumptions change.
8. Declare R2 accepted only when the agreed live tests pass and the project owner confirms acceptance.
9. Only then prepare a separate R3 scope proposal, estimate and acceptance criteria. Do not treat the roadmap in this handover as automatic authorisation.

## 9. Known risks and constraints

- Steam's runtime fields and methods are observed implementation details, not documented stable APIs.
- A page refresh during a native request may interrupt that request; only already committed journal batches are recoverable.
- The journal captures changed/new serialisable records visible in Steam's in-memory controller; it is not an HTTP packet capture and cannot preserve fields Steam does not expose there.
- The DOM fallback depends on current Steam page structure and should be retained only as a fallback until an alternative is verified.
- A successful single request or one successful batch does not guarantee that a larger operation will avoid throttling.
- Market-price responses can be absent or incomplete independently of inventory completeness.
- Automated tests cannot substitute for real browser acceptance or live Steam behaviour.
- The permission gate is not a sandbox and must not be described as one.

## 10. Handover checklist

- [ ] Incoming lead has the 1.6.9 / HF19 ZIP and can identify it as the baseline.
- [ ] Incoming lead has read `RELEASE_NOTES.md` and `docs/WEBDATA_FILEDATA_ARCHITECTURE.md`.
- [ ] R1/R2 delivered scope is distinguished from proposed R3–R7 scope.
- [ ] Live R2 acceptance is scheduled and evidence will be recorded.
- [ ] Outstanding defects are recorded with reproduction steps and evidence.
- [ ] No R3 implementation begins before R2 acceptance and explicit approval.
- [ ] Any future release updates code, tests, release notes and relevant docs together.


## 12. Sandy's review — evidence gaps and remediation record

**Review status:** Mike has accepted Sandy's review findings. This section makes the limits of the current evidence explicit and defines the work required to close them. It does not claim that unperformed tests, audits or experiments have been completed.

### 12.1 Evidence boundary

The following are established by the supplied HF19 package and its records:

- `package.json` identifies version `1.6.9`, requires Node.js `>=18`, and defines `npm test` as `node --test tests/*.test.cjs` and `npm run check` as `node scripts/check-js.cjs`.
- `manifest.json` declares Manifest V3, minimum Chrome version 106, permissions `scripting`, `webNavigation`, `storage`, `contextMenus`, `nativeMessaging`, `clipboardWrite`, and host permission `<all_urls>`.
- The HF19 handover/release record reports 77 passing automated tests, 22 JavaScript files syntax-checked, and ZIP integrity checked.
- The same record explicitly says live Brave/Steam acceptance was not performed.
- The architecture document identifies the observed Steam runtime objects and methods as implementation details, not stable Valve APIs.

The following are **not established by the supplied package** and must not be represented as completed:

- A reproducible live Brave/Steam acceptance run.
- A complete requirements-to-test traceability matrix.
- Test coverage percentage or a coverage report.
- A formal threat model or independent security review.
- A tested crash-consistency guarantee across IndexedDB and localStorage.
- A reproducible build from a recorded source-control commit/tag.
- A complete experiment register containing original hypotheses, controlled conditions, raw observations and measured outcomes for every historical hotfix.
- Approved effort estimates, delivery dates or commitments for R3–R7.

### 12.2 R2 requirements-to-evidence matrix

This is the current acceptance matrix. “Not run” means there is no live acceptance evidence in this handover; it does not mean the feature is known to fail.

| ID | Acceptance requirement | Relevant implementation area | Verification procedure | Current evidence status |
|---|---|---|---|---|
| R2-AC-01 | Identify active Steam inventory and read available webdata | Steam inventory adapter / Design capture | In Brave, open the supported Steam inventory page; record app/context identity and observed controller capabilities | Not live-tested; runtime observations documented only |
| R2-AC-02 | Commit current webdata before requesting another batch | Webdata journal and synchronisation flow | Observe batch order and IndexedDB records while loading multiple batches; confirm commit precedes next request | Architecture describes intended order; live evidence outstanding |
| R2-AC-03 | Use native loader only when required capabilities exist | Native Steam loader integration | Test present, absent, malformed and rejecting loader capability cases | Automated test evidence reported in HF19; full scenario mapping not supplied |
| R2-AC-04 | Reconcile batches without duplicate or corrupted filedata | Reconciliation / filedata model | Replay identical batches; compare asset identities, design counts and quantities before/after | Not demonstrated by a supplied live recovery report |
| R2-AC-05 | Preserve partial state after stop, error, refresh or interruption | Synchronisation lifecycle / journal | Interrupt at each stage; restart; inspect partial/completed state and committed batches | Live acceptance outstanding |
| R2-AC-06 | Assert completion only when Steam reports fully loaded and non-currency assets resolve | Completion predicate / description resolution | Test false/true completion flag and unresolved descriptions; ensure unresolved data prevents completion | Design rule documented; live acceptance outstanding |
| R2-AC-07 | Keep market-price enrichment independent of inventory completeness | Price enrichment / cooldown | Throttle market endpoint; confirm inventory and local filedata remain available | HF19 change and automated acceptance checks documented; live verification outstanding |
| R2-AC-08 | Persist price observations and history in shared filedata | Price persistence / legacy migration | Enrich a small batch; reload; compare saved values and timestamps; test legacy merge | Implementation behaviour documented; migration/reload live evidence outstanding |
| R2-AC-09 | Keep UI counts consistent with shared design and price records | Design, Price and Inventory views | Compare eligible, saved, unresolved and displayed counts for the same dataset | Automated checks reported; live UI acceptance outstanding |
| R2-AC-10 | Handle HTTP 429 without automatic retry loops | Endpoint-specific cooldown handling | Simulate/observe 429; verify no request until explicit user action after cooldown | Policy and HF19 behaviour documented; live verification outstanding |

For each executed test, Sandy should append: date/time, tester, browser/OS version, extension package hash, Steam page URL/context (without account secrets), inventory sample characteristics, steps, expected result, actual result, console/network evidence, pass/fail/block status and defect reference.

### 12.3 Reproducible automated validation

From the extracted `Siteworks` project root, with Node.js 18 or later installed:

```bash
npm test
npm run check
```

These commands are grounded in the package scripts. The HF19 report's 77/0 result is a historical reported result; it is not a claim that these commands were rerun while preparing this revised handover. Record the Node version (`node --version`), npm version (`npm --version`), command output and exit code with each validation run.

No coverage command or coverage threshold is defined in the supplied `package.json`. Do not report a coverage percentage unless a coverage tool is deliberately added and its output retained. No test framework dependency is declared in the supplied package manifest; the test command uses Node's built-in test runner.

The existing checks do not, by themselves, validate HTML/CSS rendering, browser permissions, native messaging host installation, Steam runtime compatibility, network behaviour or live account state. Those require separate integration/acceptance procedures.

### 12.4 Data consistency and recovery specification — required work

The architecture declares the IndexedDB webdata journal as the durable record and `siteworksFiledata_v1` as the shared local projection. HF19 also retains legacy price storage for compatibility. The supplied records do not fully specify or prove atomic consistency across these stores.

Before claiming crash-safe recovery, implement and test the following contract:

1. **Journal commit boundary:** a batch is considered durable only after its IndexedDB transaction completes successfully.
2. **Stable batch identity:** each batch has a deterministic or persisted unique identity, source/session metadata, schema version and ordering/continuation metadata sufficient to detect duplicate replay.
3. **Idempotent projection:** applying the same committed batch more than once must not duplicate assets, designs or quantities.
4. **Projection checkpoint:** persist which journal position/version has been materialised. A projection behind the journal must be detectable.
5. **Rebuild path:** rebuild the projection from committed journal records; compare the rebuilt result with the normal synchronisation result.
6. **Interrupted writes:** test termination before transaction commit, after journal commit but before projection update, and during projection update.
7. **Quota and corruption:** surface storage quota failures and invalid records; do not silently mark incomplete data as complete.
8. **Schema migration:** define migration ordering, compatibility checks, backup/rollback strategy and recovery from an interrupted migration.
9. **Legacy price data:** document precedence, merge keys, timestamp comparison, duplicate handling and retirement criteria for `cardShelfInvCache`.
10. **Retention:** define journal growth limits and a safe compaction/retention policy only after rebuild and audit requirements are understood.

These are required design and verification tasks, not claims that all mechanisms already exist. Any implementation change must preserve the existing functional design unless Sandy and the project owner approve a change.

### 12.5 Steam compatibility strategy — required work

The observed Steam interfaces (`g_ActiveInventory`, `m_rgAssets`, `m_rgDescriptions`, `m_bFullyLoaded`, `LoadMoreAssets()` and `AddInventoryData(data)`) are private page-runtime details. The architecture correctly warns that they are not stable public APIs.

The next engineering task is to formalise a narrow adapter contract. The adapter should expose only the capabilities Site Works needs: identify active inventory, take a serialisable snapshot, report loading state, request one next batch where supported, and report capability/error state. The rest of Site Works should not depend directly on Steam's internal object layout.

Create fixtures for: expected runtime shape; missing controller; missing asset map; missing descriptions; missing loader method; rejected loader promise; malformed batch; already-complete inventory; and changed description association. Use fixtures for deterministic automated tests, then validate the adapter against a real Steam page.

Fallback policy:

- Native integration available and validated: use the native adapter.
- Required native capability absent: report the missing capability and preserve committed data.
- DOM fallback: use only where its current page structure has been explicitly detected and its limitations are shown to the user; it must not silently claim native completeness.
- Unknown or ambiguous state: fail closed; do not invent request URLs, continuation tokens or completion.

Maintain a compatibility record containing observation date, browser version, Steam page type, capability names/types, sample sizes and result. A single observation is not a compatibility guarantee.

### 12.6 Security and permission review — current facts and required work

The manifest's declared permissions are listed in §12.1. The extension also documents a default-deny, hash-bound approval mechanism. The handover explicitly states that this is not a sandbox. No formal threat model or independent security assessment is included in the supplied HF19 package.

Sandy should create a threat model covering at least these trust boundaries: website/page data; content scripts; extension pages; service worker; extension storage; native messaging host; local filesystem; and user-approved scripts. For each boundary, record attacker capability, assets at risk, entry point, existing control, residual risk and verification evidence.

Review the justification and least-privilege necessity of `<all_urls>` and each declared permission. Trace how untrusted page data reaches privileged APIs and native helper operations. Verify that command construction avoids shell interpretation, paths are validated and constrained, and logs do not disclose credentials or sensitive account data. Review native host installation, origin allow-listing, message schema validation, executable integrity and update process.

Do not claim that these reviews have passed until the records and tests exist. The immediate requirement is a documented review and risk register, not an unsupported claim of security certification.

### 12.7 Release engineering and provenance

The supplied package establishes the application version and package scripts, but does not provide a source-control commit ID, release tag, build pipeline definition, dependency lockfile or reproducible-build record. ZIP integrity alone proves archive readability, not source provenance or reproducibility.

For the next release, retain:

- Source repository URL/location and immutable commit ID.
- Release tag and branch, if used.
- Exact build/package commands and tool versions.
- Dependency inventory and lockfile, if dependencies are introduced.
- Release archive SHA-256 and per-file manifest.
- Automated test and syntax-check logs.
- Change list from the preceding release.
- Known defects and rollback instructions.

For the current HF19 baseline, calculate and record the archive hash in the release register at the time the artifact is formally accepted. Do not invent a commit or tag retrospectively.

### 12.8 Experiment register — evidence limitations

The cumulative release notes and architecture document preserve a useful chronology of changes and observations, but they are not a complete controlled experiment register. In particular, the supplied records do not consistently retain original hypotheses, controlled conditions, raw logs, sample counts, comparison baselines or measured false-positive/false-negative rates.

The following are documented findings/decisions, not fully quantified experiments:

| Topic | Recorded observation or decision | Evidence limitation / follow-up |
|---|---|---|
| Steam inventory scale | Session samples included 2,000 asset entries; description counts differed between observations; one page inspection reported 17,318 items, 693 visual pages and 25 visible tiles | Session-specific observations; preserve raw diagnostic capture and repeat on representative inventories |
| Asset/design/description distinction | Asset entries, unique designs, quantities and description records are separate concepts | Add fixture-based reconciliation tests, including stacks and duplicate designs |
| Native Steam loader | Private runtime methods and state were inspected and used as integration evidence | Add adapter fixtures and real-browser compatibility runs |
| DOM pagination | Visual page controls and visible tile counts were found insufficient as proof of complete inventory acquisition | Retain only as a constrained fallback; record exact scenarios and failure modes |
| Request throttling | HTTP 429 must stop automatic retry behaviour; minimum request pacing was introduced in the wider project | Record endpoint-specific timings and verify no hidden retry path |
| Price enrichment | Market-price data is a separate endpoint and may be absent when inventory is complete | Keep independent state and cooldown; test 429 and incomplete responses |
| HF19 numeric app-ID correction | Eligibility predicate correction addressed a case where numeric IDs could be rejected | Preserve regression cases for valid numeric, blank and non-numeric IDs |

For future experiments, use this record format: experiment ID; date; question/hypothesis; code revision; environment; input/sample; procedure; expected result; actual result; raw evidence location; conclusion; decision; resulting change; regression test; reviewer. Historical entries should be backfilled only where contemporaneous evidence exists. Mark reconstructed recollections as retrospective, not measured fact.

### 12.9 R3–R7 roadmap maturity and approval gates

The R3–R7 themes in §3 remain proposals. The current package does not contain approved estimates, delivery dates, resource allocations or detailed acceptance criteria. The following gates are required before any phase is committed:

| Phase | Proposed outcome | Main dependencies / questions | Entry gate |
|---|---|---|---|
| R3 Market Intelligence & Trading | Better price interpretation and user-directed trading support | Reliable R2 holdings; market data quality, rate limits, valuation semantics, account-action safeguards | R2 accepted; separate product scope and risk review approved |
| R4 Badge & Collection Management | Badge progress and collection-oriented workflows | Stable design identity and ownership model; badge/game metadata sources and coverage | Data sources and user outcomes validated; acceptance criteria approved |
| R5 Steam Library Intelligence | Library-level discovery and analysis | Steam library access model, privacy, ownership semantics and supported page/API behaviour | Data access and scope validated; R2 foundations stable |
| R6 Automation & Data Management | User-controlled scheduled work, backup, restore and data lifecycle tools | Durable recovery contract, permission model, scheduling lifecycle and auditability | R2 data integrity/recovery requirements proven; automation threat review approved |
| R7 Unified Steam Command Centre | Coherent interface across inventory, prices, badges and library | Stable domain boundaries, shared navigation/state model and performance budget | Relevant preceding capabilities accepted; integration design reviewed |

No delivery estimate is supplied here because the work has not been decomposed or sized. Sandy should create a work breakdown, identify external dependencies, estimate with the delivery team and obtain explicit product-owner approval. The sequence is a planning hypothesis, not a commitment.

### 12.10 Quality attributes and measurable acceptance

The project should convert quality principles into project-specific acceptance measures. The following are proposed measures to agree before R2 sign-off; thresholds must be set from representative test data rather than invented after the fact.

| Quality concern | Proposed measure / evidence |
|---|---|
| Functional correctness | Reconciled asset identities, design identities and summed quantities match a captured source fixture and agreed live sample |
| Reliability | Repeated synchronisation and interrupted operations do not corrupt committed records or falsely assert completion |
| Recoverability | A fresh projection rebuilt from the journal matches the expected canonical model |
| Performance | Record elapsed time, request count, batch count and memory/storage use for agreed inventory-size bands |
| Security | Threat model actions are closed or formally accepted; privileged operations have validated inputs and explicit approval |
| Maintainability | Steam-specific runtime dependencies are isolated behind an adapter with fixtures and documented contracts |
| Compatibility | Browser/Steam scenarios and versions are recorded with pass/fail outcomes; unsupported states fail clearly |
| Usability | UI clearly distinguishes complete, partial, blocked, failed and price-not-enriched states |

These are project proposals, not certification claims. No ISO/IEC 25010 conformance or certification is asserted.

### 12.11 Prioritised remediation plan

**P0 — before R2 acceptance**
1. Execute and record live Brave/Steam acceptance for R2-AC-01 through R2-AC-10.
2. Verify journal commit, projection rebuild and interruption behaviour; fix any confirmed data-loss, duplication or false-completion defect.
3. Confirm HTTP 429 handling and explicit user-controlled recovery in both inventory and price paths.
4. Re-run `npm test` and `npm run check`; retain complete logs and environment versions.
5. Record release archive SHA-256 and known-defect list.

**P1 — before handing operational ownership to another engineer**
1. Complete the requirements-to-evidence matrix and link each row to source/test/evidence.
2. Complete the Steam adapter contract and fixture suite.
3. Complete the security threat model and permission review.
4. Document storage migration, recovery, retention and legacy-price merge contracts.
5. Add source provenance and repeatable packaging instructions to the release process.

**P2 — before committing R3–R7**
1. Create a prioritised and estimated work breakdown for each proposed phase.
2. Define user outcomes, explicit exclusions, dependencies, acceptance criteria and risk owners.
3. Obtain product-owner approval for the next phase; do not infer authorisation from this roadmap.

### 12.12 Mike's response to Sandy

Sandy, your criticism is fair. My original handover described the architecture and the reasoning behind it more completely than it described the evidence needed to independently verify it. I also allowed a reported automated test result to sit too prominently beside a release that had not passed live acceptance.

I have corrected the record rather than inventing missing evidence. The revised handover now distinguishes facts present in the HF19 package, historical results reported by the release record, proposed verification procedures and work that remains outstanding. In particular, I am not claiming a completed threat model, proven crash consistency, a reproducible source build, measured coverage or approved R3–R7 estimates.

The next responsible step is to execute the P0 acceptance work against the actual Brave/Steam environment, retain the evidence, and update this document with observed results. If a test has not been run, it will remain marked not run. If a design guarantee has not been demonstrated, it will remain a requirement to prove rather than a claim.

**Mike**
Outgoing Project Lead
21 November 2026


---

## 11. Final assessment from Mike

The most important achievement in R2 is not simply the ability to collect more Steam inventory data. It is the move towards a defensible data lifecycle: observe Steam's own webdata, record serialisable batches, reconcile a shared filedata projection, keep market-price observations separate, and state completeness only when the source itself provides the required evidence.

The most important remaining risk is the gap between automated validation and live Steam/Brave behaviour. The next project milestone is therefore controlled R2 acceptance, not feature expansion.

Sandy, protect the distinctions the project has established. Most of the difficult lessons came from treating different things as if they were the same: page stability as completeness, designs as items, missing values as zero, price availability as inventory state, or a passing test suite as proof of live integration. The architecture is stronger when those distinctions remain explicit.

**Mike**  
Outgoing Project Lead  
21 November 2026


---

## Incoming developer documentation suite

The detailed operational and engineering artefacts now accompany this handover. Start with `docs/README-HANDOVER.md`. The supporting pack includes architecture, component catalogue, data dictionary, installation/development setup, diagnostics/recovery, release/rollback, R2 acceptance matrix, security review, engineering decisions/technical debt, experiment register, and an R1–R7 delivery plan.

The evidence log (`docs/HANDOVER_EVIDENCE.md`) records the offline commands actually executed and the live activities not performed. The additional documents do not upgrade unverified claims into verified results. In particular, R2 remains subject to live Brave/Steam acceptance and persistence failure testing.

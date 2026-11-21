# R1–R7 Delivery Plan

## Status conventions

- **Delivered historically:** described in release notes/source; does not automatically mean independently accepted.
- **Current baseline:** code present in supplied 1.6.9 HF19 archive.
- **Planned/proposed:** roadmap concept, not an approved or implemented commitment.
- **Gate:** evidence required before the next stage is authorised.

## R1 — Reliability & Configuration

**Status:** delivered historically as 1.4.0; foundational functionality present in HF19.

**Scope evidenced:** shared configuration and normalization; permission/decision handling; SHA-bound remembered approvals; request pacing and mandatory safety confirmations; Steam fee arithmetic; trading safeguards; extension controls and toolbox.

**Acceptance gate:** current clean-profile smoke test; permission prompt and changed-hash reapproval; configuration normalization; quick-sell confirmation/cap/4-second minimum/no 429 retry; bulk removal never auto-confirms.

## R2 — Inventory Intelligence

**Status:** active baseline at 1.6.9 HF19; not fully accepted by this handover because live acceptance is outstanding.

**Scope evidenced:** inventory/design capture, discovery progress/resume, webdata journal and Filedata projection, inventory list, separate price enrichment, valuation/freshness/snapshot/spread logic.

**Work breakdown:**
1. Complete live Steam native-loader acceptance.
2. Verify partial stop/reload/resume.
3. Verify journal and projection consistency under failure.
4. Verify complete-state criteria against known inventory.
5. Verify separate price enrichment and cooldown handling.
6. Resolve helper/security and documentation defects that affect release.
7. Record acceptance decision and known limitations.

**Exit gate:** every R2 acceptance row has an evidence-backed result; no critical unresolved data integrity or safety defect; release owner signs off.

## R3 — Market Intelligence & Trading

**Status:** proposed; not established as implemented in HF19.

**Potential epics (require product approval):**
- Market observation history and freshness.
- Price/liquidity context and spread analysis.
- Valuation scenarios.
- Listing recommendations and user-controlled execution safeguards.
- Market activity reporting.

**Prerequisites:** stable R2 design/ownership model; market endpoint schema and rate-limit policy; currency correctness; data retention policy; clear distinction between indicative analysis and executable action.

**Risks:** endpoint changes, stale/incomplete market data, currency mismatch, misleading liquidity inference, request throttling, accidental listings.

**Acceptance:** source/time/currency shown; missing/stale values explicit; no automatic trading without explicit confirmation; request caps/cooldowns tested.

## R4 — Badge & Collection Management

**Status:** proposed; not established as implemented in HF19.

**Potential epics:** badge progress, collection gaps, set completion, duplicate/foil classification, crafting planning and user-controlled collection actions.

**Prerequisites:** R2 design catalogue and accurate owned quantities; explicit Steam item taxonomy; verified badge/set data source.

**Risks:** confusing catalogue presence with ownership; incorrect set membership; stale badge requirements; destructive/irreversible actions.

**Acceptance:** ownership and collection requirements independently represented; quantities reconcile; actions require confirmation; unknown data never appears as zero.

## R5 — Steam Library Intelligence

**Status:** proposed; not established as implemented in HF19.

**Potential epics:** library inventory, game metadata enrichment, ownership classification, playtime/achievement summaries and collection-level analysis.

**Prerequisites:** approved data sources, privacy scope, Steam library model and clear separation from inventory trading data.

**Risks:** API limitations, privacy, account visibility, stale metadata and overclaiming inferred behaviour.

**Acceptance:** source provenance and timestamps; permission-aware data access; missing data explicit; no unsupported inference.

## R6 — Automation & Data Management

**Status:** proposed; not established as implemented in HF19.

**Potential epics:** scheduled/triggered refresh, pause/resume, backup/export/import, schema migrations, audit/provenance, retention and recovery tooling.

**Prerequisites:** R2 reliability evidence; durable job state; explicit scheduling and cancellation model; tested storage migration and recovery.

**Risks:** background service-worker lifecycle, unexpected network load, data loss, storage growth, duplicate execution and unclear consent.

**Acceptance:** bounded requests; visible schedules and controls; idempotent jobs; recoverable migrations; export/import round-trip tests; audit trail.

## R7 — Unified Steam Command Centre

**Status:** proposed; not established as implemented in HF19.

**Potential epics:** unified navigation/dashboard, cross-domain summaries, task orchestration and consistent status model.

**Prerequisites:** stable R2–R6 domain contracts; shared terminology; UX and accessibility design; permission model.

**Risks:** premature coupling, oversized UI, hidden domain failures, confusing status aggregation and regression across independent features.

**Acceptance:** domain modules remain independently testable; dashboard does not silently trigger operations; partial/blocked/stale states remain visible; accessibility and performance tested.

## Sequencing and governance

1. Freeze R3–R7 implementation until R2 is accepted.
2. Use a short discovery/specification phase for the next release only after the prior gate.
3. Create epics and work items with acceptance tests before coding.
4. Estimate only after technical spikes where uncertainty is material.
5. Require design review for new persistence, external endpoints, privileged actions or cross-domain coupling.
6. Keep feature scope out of hotfixes unless required to restore safety/correctness.
7. Each release must include test evidence, release notes, migration/rollback assessment and updated docs.

Effort estimates and delivery dates are intentionally not fabricated; the current package lacks approved detailed scope and measured throughput.

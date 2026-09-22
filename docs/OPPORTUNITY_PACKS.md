# Opportunity Packs

Status: design reference for Phase 1. Not yet implemented in code; this
documents the contract packs will need to satisfy so the core engine never
has to special-case a vertical.

## What a pack is

An Opportunity Pack teaches Yebo how to identify one sales opportunity for
one kind of offering against one set of company types. Adding a new pack
must never require changes to the core Opportunity Engine — the engine only
ever calls into whichever pack is configured for the organisation's
offering.

## Contract

A pack (`src/opportunity-packs/<pack-id>/`) exports:

- `id` — stable slug, e.g. `web-design-local-business`
- `supportedIndustries` — company types this pack knows how to evaluate
- `discoveryQueries` — query templates handed to `DiscoveryProvider`s
- `qualificationCriteria` — cheap, pre-deep-research filters
- `opportunitySignals` — what evidence maps to `service_gap` and how
- `auditChecks` — which deep-research checks to run (see
  `src/integrations/audit/`)
- `evidenceRequirements` — minimum evidence needed before a score is shown
  as `medium`/`high` confidence
- `scoringWeights` — per-dimension weights (see `docs/SCORING.md`)
- `typicalDecisionMakers` — roles to target in campaigns
- `campaignAngles` / `offers` — starting points for Campaign Builder
- `pitchRecommendations` — structure/tone guidance for the Pitch Engine
- `terminology` — vertical-specific vocabulary for AI prompts
- `estimatedProjectValue` — optional, used for pipeline value estimates

## First pack: Web Design — Local Business

Supported industries (initial set): restaurants, coffee shops, boutique
hotels, guest houses, wine estates, architecture firms, property
businesses, gyms, beauty/wellness, charter/aviation businesses.

This is the pack Poke Digital's pilot runs on. Everything about it should be
config, not code, so a second creative-services pack (branding, photography,
etc.) is a new folder, not a fork of the engine.

## Future packs (not yet started)

Local SEO, social media, paid media, content production, MSP/IT support,
recruitment, SaaS categories — each following the same contract.

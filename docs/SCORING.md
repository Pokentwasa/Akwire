# Opportunity scoring methodology

Status: design reference for Phase 1 (Opportunity Engine Prototype). Not yet
implemented in code.

## Principle

Never collapse everything into one opaque AI score. The UI must always be
able to answer "why?" for a recommendation, a score, or a next action
(section 37 of the brief).

## Dimensions

Each `opportunities` row stores these as separate columns, not just a final
number:

- **`icp_fit`** — how closely the company matches the configured Ideal
  Customer Profile (industry, geography, size, business type).
- **`business_quality`** — is this a worthwhile commercial prospect
  (rating, review volume, indicators of an established, active business)?
- **`service_gap`** — how much evidence suggests the company needs this
  specific offering (e.g. for web design: outdated structure, poor mobile
  performance, weak UX, no clear CTA, poor conversion path, weak SEO
  structure).
- **`timing_score`** — reserved for future trigger-event signals (recently
  opened, expanding, hiring, new management, new locations). Defaults to
  neutral until Phase 9 or an Opportunity Pack defines timing signals.

## Opportunity score

A configurable combination of the above, defined per Opportunity Pack (see
`docs/OPPORTUNITY_PACKS.md`) rather than hard-coded in the engine. Each
dimension is stored on a comparable 0–100 scale so packs can weight them
without the core engine caring about pack-specific units.

`opportunity_score = pack.weights.icpFit * icp_fit
                    + pack.weights.businessQuality * business_quality
                    + pack.weights.serviceGap * service_gap
                    + pack.weights.timing * timing_score`

## Confidence, not certainty

Every opportunity carries a `confidence` value (`low` | `medium` | `high`)
separate from the score itself. Confidence reflects how much evidence was
actually collected (quick qualification vs. deep research), not how
strongly the evidence points one way. The UI must not imply mathematical
certainty — scores are a prioritisation aid, not a guarantee.

## Evidence traceability

Every material claim behind a score must be traceable to a row in
`evidence`. AI may interpret gathered evidence (e.g. "poor mobile UX")
but may not invent evidence that wasn't collected. Unknown means unknown —
if a signal wasn't checked, it's absent from the explanation, not assumed
negative or positive.

## Explanation

`opportunities.explanation` stores the human-readable "why" shown in the
company workspace (see section 9's Harbour Table example): a short list of
observed evidence, phrased so the user can verify it themselves.

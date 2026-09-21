# Privacy & data flows

Status: living document, updated as each phase adds data flows. Not legal
advice — see `docs/LEGAL_REVIEW.md` for open questions requiring South
African legal counsel before commercial launch.

## What Yebo stores today (Phase 0)

- **Account data**: email (via Supabase Auth), organisation name/slug.
- **Sender profile**: business name, website, contact email/phone — the
  Yebo customer's own business details, used to identify them in generated
  material later.
- **Offering / ICP configuration**: what the organisation sells and who
  they're targeting. No personal information about third parties yet.
- **Activity log**: an append-only record of meaningful actions
  (`activities` table), scoped to the organisation, used for the audit
  trail required by section 33/50 of the product brief.

No company, lead, or third-party personal data is collected yet — that
starts in Phase 2 (Discovery) and Phase 5 (Lead capture).

## Data minimisation principle

Do not collect personal information because it might be useful one day.
Store only what the active acquisition process needs, and record
provenance (source, campaign, timestamp) so it stays traceable. This
applies from Phase 2 onward and should be revisited in this doc as each
phase lands.

## Third parties (planned, not yet integrated)

| Provider | Purpose | Data shared | Phase |
|---|---|---|---|
| Google Places | Company discovery | Search queries (industry, geography) | 2 |
| PageSpeed Insights | Website performance signals | Public URLs | 3 |
| Anthropic API | Research summaries, pitch generation | Collected evidence, offering config | 1+ |
| Inngest | Background job orchestration | Job payloads (no secrets) | 2+ |

Each row should be filled in with pricing, terms, retention behaviour and a
verification date in `docs/EXTERNAL.md` before that integration ships.

## Tenant isolation

All organisation-scoped tables are protected by Postgres Row Level
Security — an organisation can only read/write rows where the requesting
user has a `memberships` row for that organisation. See
`supabase/migrations/0001_phase0_foundation.sql` and
`tests/unit/rls-policy.test.ts`.

## Export / deletion

Not yet implemented. Required before handling third-party personal data at
scale (section 33): users should be able to export lead data, remove lead
data, inspect consent records, and see suppression records. Tracked for
Phase 7.

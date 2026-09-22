# External providers

Tracks behaviour, pricing, terms and a verification date for every
third-party service Yebo depends on. Update the "Verified" date whenever
pricing/terms are re-checked — providers change these without much notice.

| Provider | Purpose | Pricing (as of verification) | Terms notes | Verified |
|---|---|---|---|---|
| Supabase | Postgres, Auth, RLS, Storage | Free tier caps active projects (2 for this account, already used by `Ticket Show`/`campaignos`); see supabase.com/pricing | — | 2026-09-21 |
| Anthropic API | AI generation (research summaries, pitch content) | See claude.com/pricing; use `MODEL_FAST` for extraction/classification, `MODEL_DEFAULT` for opportunity summaries and pitches | Server-side only, never call from the client | not yet integrated |
| Google Places API | Company discovery (Phase 2) | Per-request pricing, see Google Maps Platform pricing | Do not cache beyond Google's permitted retention window; do not scrape as a substitute | code integrated (`src/integrations/discovery/google-places.ts`), no `GOOGLE_PLACES_API_KEY` set — throws a clear config error until one is added |
| PageSpeed Insights API | Website performance signals (Phase 3) | Free tier with quota | Public URLs only | not yet integrated — Phase 3's SSRF-safe fetcher + signal extraction (`src/integrations/audit/`) work without it; add this later for numeric performance scores |
| Inngest | Background job orchestration (Phase 2+) | See inngest.com/pricing | — | not yet integrated — Phase 2–7 landed without needing a job queue (everything runs synchronously in the request); revisit if/when discovery volume needs batching |
| Vercel | Hosting | See vercel.com/pricing | — | deployed — `akwire.vercel.app` |

## Explicitly out of scope (section 8/38 of the product brief)

Do not scrape LinkedIn, Facebook, or Instagram against their terms of
service. Do not build automatic ad purchasing in V1 — Yebo prepares
campaign material for the user to deploy manually or via a future,
explicitly-scoped API integration.

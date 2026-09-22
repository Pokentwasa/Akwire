# Yebo — Architecture & Implementation Plan

Yebo is an AI business development manager: discover companies, figure out
why they might need what you sell, prioritise them, help you acquire and
research them, generate pitches, and track the opportunity to close. Full
product context lives in the original brief; this doc tracks *how* it gets
built and *where things currently stand*.

Core loop: **Discover → Analyse → Prioritise → Target → Acquire → Research →
Pitch → Follow up → Close → Learn.**

Priority order, always: **opportunity quality before automation before
integrations before scale.** The thing to prove first is whether Yebo can
reliably identify businesses Poke Digital would genuinely want to pursue.

## Stack

- Next.js App Router, TypeScript strict, Tailwind, Radix primitives
- Supabase (Postgres, Auth, RLS, Storage)
- Anthropic API (server-side only), Zod-validated structured output
- Inngest for background jobs
- Vitest + Playwright, GitHub Actions CI
- Vercel hosting

## Repo layout

```
src/app/(auth)/            signup, login, shared auth server actions
src/app/(app)/             everything behind auth: onboarding, today,
                            discover, campaigns, pipeline, companies, leads,
                            compliance, usage, settings
src/domain/                 command functions + Zod schemas, one folder per
                             bounded context (organisations, companies,
                             opportunities, leads, campaigns, compliance,
                             sales). This is the only layer allowed to write
                             to Supabase tables — routes/components call into
                             it, never the client directly for mutations.
src/integrations/           adapters for replaceable third parties
                             (discovery, audit, ai, email, advertising, crm,
                             payments). Core domain logic never imports a
                             vendor SDK directly.
src/opportunity-packs/      config-driven Opportunity Pack definitions
src/components/ui/          design-system primitives
src/lib/supabase/           client/server/middleware Supabase helpers
supabase/migrations/        SQL migrations, applied in filename order
tests/unit, tests/e2e       Vitest and Playwright
```

## Domain object model (section 5 of the brief)

Organisation → User → Membership; Company; Opportunity; Lead; Campaign;
Opportunity Pack; Audit; Pitch; Activity. See `supabase/migrations/` for the
authoritative schema as it lands phase by phase.

## State transitions

Company/Lead/Opportunity/Campaign status changes go through named domain
commands (`src/domain/**/commands.ts`), never ad-hoc UPDATE statements from
the UI. Every command that changes meaningful state calls
`logActivity` (`src/domain/shared/activity.ts`) so the `activities` table
stays a complete audit trail.

## Phase status

- [x] **Phase 0 — Foundation.** Repo structure, Next.js, auth, organisations,
      memberships, organisation settings, sender profile, offering +
      ideal-customer-profile configuration, design system, RLS, CI.
      *Live Supabase project not yet provisioned* — the account's free tier
      is at its 2-project cap (`Ticket Show`, `campaignos`); migrations are
      ready in `supabase/migrations/0001_phase0_foundation.sql` for whenever
      a slot/upgrade is available. Until then the app runs against
      placeholder env vars for build/lint/test purposes only.
- [x] **Phase 1 — Opportunity Engine Prototype.** Manual company entry
      (`/companies/new`), the `web-design-local-business` Opportunity Pack,
      a deterministic scoring engine (`src/domain/opportunities/engine.ts`)
      producing ICP fit / business quality / service gap / timing +
      confidence + a plain-language "why", company workspace
      (`/companies/[id]`) with shortlist/reject, and a real Today screen.
      Scoring is rules-based on collected evidence, not AI, for this
      prototype — see `docs/SCORING.md`. No live Supabase project yet, so
      this hasn't been exercised end-to-end against a real database; it's
      covered by unit tests on the pure scoring function instead
      (`tests/unit/opportunity-engine.test.ts`).
- [x] **Phase 2 — Discovery.** `DiscoveryProvider` interface
      (`src/integrations/discovery/`), a working CSV import provider, and a
      *real* Google Places (New) Text Search integration — not a stub, but
      it throws a clear config error without `GOOGLE_PLACES_API_KEY` (not
      set in this environment). `company_sources` table for provider IDs,
      dedupe on import, `/discover` UI for both paths.
- [x] **Phase 3 — Website intelligence.** SSRF-safe fetcher
      (`src/integrations/audit/`) blocking private/loopback/link-local
      addresses (incl. the cloud metadata endpoint), regex-based HTML
      signal extraction (viewport, title, meta description, H1, CTA,
      booking links — no PageSpeed key needed for these), "Run website
      audit" on the company workspace, evidence merge + re-score.
- [x] **Phase 4 — Campaign Builder.** `campaigns`/`campaign_companies`/
      `campaign_assets`, deterministic (template-based, not AI) angle/
      offer/ad-copy/lead-form-copy generation from the Opportunity Pack's
      own content, `/campaigns` UI. Prepares material only — never calls
      an ad platform API (section 16).
- [x] **Phase 5 — Lead capture.** `leads`/`lead_submissions`, a public
      `/l/[campaignId]` form (service-role write from a trusted server
      action, since there's no session for RLS to scope against), source/
      campaign attribution, `/leads` UI.
- [x] **Phase 6 — Sales engine.** Deterministic (template-based) pitch
      email generation grounded in the opportunity's own evidence
      (`src/domain/sales/pitch-generator.ts`), an explicit lead-status
      transition table enforcing section 49's "invalid stage transitions
      are rejected" (`src/domain/leads/pipeline.ts`), follow-ups,
      meetings, proposals, deals, a real `/pipeline` board.
- [x] **Phase 7 — Compliance scaffolding.** `consent_requests` (single
      request per organisation+company+channel enforced by a unique
      index, not just app code), `consent_events`, `suppression`;
      `requestConsent`/`recordConsentResponse`/`withdrawConsent` (the
      last cancels open follow-ups and adds suppression atomically);
      `/compliance` UI. Technical enforcement only — see
      `docs/LEGAL_REVIEW.md`; no wording here has been reviewed by
      counsel, and nothing here is legal advice.
- [ ] **Phase 8 — Billing & integrations.** Needs real payment provider
      keys — not configured in this environment.
- [ ] **Phase 9 — Intelligence layer.** Needs real conversion data from
      actual usage, which doesn't exist yet.

None of Phases 2–7 have been exercised against a live database — there's
still no Supabase project provisioned (see Phase 0 note above and
`docs/SETUP.md`). Every deterministic function (scoring, pitch
generation, campaign assets, SSRF blocking, signal parsing, CSV parsing,
the pipeline state machine) is unit-tested directly; the Supabase-touching
domain commands are written against the same schema/RLS pattern as Phase
0/1, which the static RLS test covers, but end-to-end behaviour against a
real database is unverified until a project exists.

## Non-goals for V1

See section 38 of the brief: no LinkedIn/Instagram/Facebook scraping, no
automatic ad buying, no full CRM/PM/accounting replacement, no autonomous
unsupervised sending, no mass cold email.

## Testing strategy

Section 49 of the brief lists the required coverage (tenancy, opportunity
scoring, AI output validation, discovery dedup, credits, suppression,
consent, withdrawal, campaigns, leads, state transitions, SSRF, golden
path). `tests/unit/rls-policy.test.ts` implements a static proxy for the
tenancy requirement today (parses `supabase/migrations/` and asserts every
tenant table has RLS enabled and at least one scoped policy); once a live
Supabase project exists, add an integration test that provisions two
organisations and proves cross-tenant reads/writes are rejected by Postgres
itself.

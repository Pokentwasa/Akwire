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
- [ ] **Phase 1 — Opportunity Engine Prototype.** Manual company entry,
      opportunities, evidence, first Opportunity Pack (web-design-local-
      business), quick qualification, opportunity score, company workspace.
- [ ] **Phase 2 — Discovery.** `DiscoveryProvider` interface, Google Places
      provider, dedupe, cheap qualification, suppression filtering.
- [ ] **Phase 3 — Website intelligence.** SSRF-safe fetcher, PageSpeed,
      signal extraction, evidence store, AI findings with confidence.
- [ ] **Phase 4 — Campaign Builder.** Campaign model, audience prep, ad copy,
      lead-form copy.
- [ ] **Phase 5 — Lead capture.** Lead form, source/campaign attribution,
      CSV import.
- [ ] **Phase 6 — Sales engine.** Pitch/deck/proposal generation, sales
      stages, Today screen, Won/Lost.
- [ ] **Phase 7 — Direct prospecting & compliance hardening.** Consent
      workflow, suppression, withdrawal, legal templates. (Critical
      compliance primitives — RLS, activity trail — are already in from
      Phase 0; this phase is about the consent-specific workflow.)
- [ ] **Phase 8 — Billing & integrations.**
- [ ] **Phase 9 — Intelligence layer.**

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

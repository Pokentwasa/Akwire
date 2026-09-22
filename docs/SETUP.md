# Setup

## Prerequisites

- Node.js 22+
- A Supabase project (see below)
- npm (this repo is committed with `package-lock.json`)

## Install

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is currently needed because `vitest`/`@testing-library/jest-dom`
pull in a newer `@types/node` peer range than some other deps declare. Revisit
this once the ecosystem catches up.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values. Every variable is
documented here; do not add a new one without adding it to this table.

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | Project API URL, safe to expose client-side |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything | Anon key, RLS-scoped, safe to expose client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Background jobs only | **Server-only.** Bypasses RLS. Never import into client code or a request path without its own tenant check |
| `ANTHROPIC_API_KEY` | AI features (Phase 1+) | Server-only. Never call the Anthropic API from the client |
| `MODEL_FAST` | AI features | Cheaper/faster model for extraction/classification |
| `MODEL_DEFAULT` | AI features | Stronger model for opportunity summaries and pitches |
| `GOOGLE_PLACES_API_KEY` | Discovery (Phase 2) | |
| `PAGESPEED_API_KEY` | Website intelligence (Phase 3) | |
| `APP_BASE_URL` | Consent pages, links in generated copy | e.g. `http://localhost:3000` in dev |
| `TOKEN_SECRET` | Signed public tokens (consent pages, lead forms) | Generate with `openssl rand -hex 32` |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Background jobs (Phase 2+) | |

## Supabase project

This repo does not have a live Supabase project wired up yet (see
`docs/PLAN.md` — Phase 0 ships the schema as local migrations only). To stand
one up:

1. Create a project in the Supabase dashboard (or via the Supabase MCP
   `create_project` tool, region `eu-west-1` for South Africa-adjacent
   latency).
2. Apply the migrations in `supabase/migrations/` in order, either via the
   Supabase CLI (`supabase db push`) or the dashboard SQL editor.
3. Generate types: `supabase gen types typescript --project-id <id> >
   src/lib/supabase/types.ts`, replacing the placeholder in that file.
4. Copy the project's URL, anon key and service role key into `.env.local`.
5. Enable email/password auth in Authentication → Providers (this is the only
   auth method Phase 0 uses).

## Local development

```bash
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test        # vitest unit tests
npm run test:e2e     # playwright, builds + starts the app first
```

CI (`.github/workflows/ci.yml`) runs all of the above on every PR.

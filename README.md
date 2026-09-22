# Yebo

Your AI business development manager. Yebo finds companies worth pursuing,
shows you why they might need what you sell, helps you get their attention,
and manages the opportunity through to close.

See `docs/PLAN.md` for the architecture and phase-by-phase build plan, and
`docs/SETUP.md` for environment setup.

## Quickstart

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # fill in real values, see docs/SETUP.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run typecheck
npm run test        # unit tests (vitest)
npm run test:e2e     # e2e (playwright)
```

## Docs

- `docs/PLAN.md` — architecture and phase plan
- `docs/SETUP.md` — environment variables and local setup
- `docs/EXTERNAL.md` — third-party providers, pricing, terms
- `docs/PRIVACY.md` — data flows and third parties
- `docs/LEGAL_REVIEW.md` — open questions for South African legal counsel
- `docs/OPPORTUNITY_PACKS.md` — how Opportunity Packs work
- `docs/SCORING.md` — opportunity scoring methodology

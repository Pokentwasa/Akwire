# Legal review questions (South Africa / POPIA)

**Nothing in this repository is legal advice.** Before commercial launch,
Yebo's direct-marketing and consent workflows (Phase 7) must be reviewed by
qualified South African legal counsel. The system is being built around a
consent-first interpretation of POPIA's direct-marketing requirements as a
starting engineering assumption, not a legal conclusion.

Open questions for counsel, carried over from the product brief (section 53):

1. Direct electronic marketing consent workflow — is the single-request
   model (`consent_requests`, enforced by a database constraint) sufficient?
2. Exact requirements around first consent requests.
3. Generic company addresses (`info@company.com`) versus named personal
   addresses — different treatment?
4. Company information versus individual personal information — where's
   the line for a sole proprietor or small business owner?
5. Hosted consent pages — what must they contain to be valid?
6. Lead-form wording — what consent/privacy language is required at
   capture?
7. Suppression retention — how long must a decline/withdrawal be retained
   to prevent accidental re-contact, and does that retention itself need a
   legal basis?
8. Public-source data collection (e.g. Google Places listings) — any
   notice obligations?
9. Data-subject notification requirements when a company/contact enters
   the system.
10. Processor vs. responsible-party relationship between Yebo and its
    customers (the agencies using Yebo) under POPIA.
11. Cross-border processing — data residency implications of using
    Supabase (region selection) and Anthropic's API.
12. Google/API data retention restrictions on cached Places/PageSpeed
    data.
13. Advertising audience uploads (LinkedIn/Meta) — consent implications of
    handing company lists to ad platforms.
14. Requirements when Yebo customers import their own prospect data via
    CSV — whose obligation is it to have already obtained consent?

## Engineering commitments already in place, pending legal sign-off

- Single-request enforcement will be a database constraint, not just UI
  logic (Phase 7).
- Pitch/follow-up functionality will remain locked until consent is
  recorded where required.
- Withdrawal will cancel scheduled communications and add suppression
  atomically.
- AI can classify a reply as consent/decline; it cannot itself create
  legally significant consent — a human confirms.
- Legal wording (consent page copy, lead-form copy) will be stored
  versioned, not hard-coded, so counsel-approved text can be updated
  without a deploy.

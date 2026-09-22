-- Phase 2: Discovery
-- Provider-agnostic company sourcing. Provider-specific IDs live here, not
-- on companies itself (section 8 of the brief).

create table company_sources (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  provider text not null,
  provider_external_id text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  discovered_at timestamptz not null default now(),
  expires_at timestamptz
);

create index company_sources_company_id_idx on company_sources (company_id);
create index company_sources_organisation_id_idx on company_sources (organisation_id);

-- Dedupe within an org: the same provider record shouldn't create two
-- companies. Partial (provider_external_id can be null, e.g. manual/CSV).
create unique index company_sources_provider_external_id_unique
  on company_sources (organisation_id, provider, provider_external_id)
  where provider_external_id is not null;

alter table company_sources enable row level security;

create policy company_sources_all on company_sources
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

-- Phase 1: Opportunity Engine Prototype
-- Manually-entered companies, evidence, and scored opportunities.

create type company_status as enum (
  'new',
  'shortlisted',
  'researched',
  'rejected'
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  name text not null,
  industry text,
  city text,
  region text,
  country text,
  website text,
  status company_status not null default 'new',
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_organisation_id_idx on companies (organisation_id);
create index companies_status_idx on companies (organisation_id, status);

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- evidence: observable facts about a company, gathered manually today and by
-- discovery/audit integrations from Phase 2/3 onward. Every scored dimension
-- must be traceable back to rows here (section 9/13 of the brief) — the
-- Opportunity Engine is not allowed to invent evidence.
-- ---------------------------------------------------------------------------
create table evidence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  organisation_id uuid not null references organisations (id) on delete cascade,
  type text not null,
  source text not null default 'manual',
  value jsonb not null,
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  collected_at timestamptz not null default now()
);

create index evidence_company_id_idx on evidence (company_id);
create index evidence_organisation_id_idx on evidence (organisation_id);

-- ---------------------------------------------------------------------------
-- opportunities: one scored recommendation per company per offering/pack.
-- Dimensions are stored separately so the UI can always answer "why?"
-- (section 10/37) instead of showing one opaque number.
-- ---------------------------------------------------------------------------
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  offering_id uuid references offerings (id) on delete set null,
  pack_id text not null,
  icp_fit smallint not null check (icp_fit between 0 and 100),
  business_quality smallint not null check (business_quality between 0 and 100),
  service_gap smallint not null check (service_gap between 0 and 100),
  timing_score smallint not null default 50 check (timing_score between 0 and 100),
  opportunity_score smallint not null check (opportunity_score between 0 and 100),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  recommended_service text not null,
  explanation jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'dismissed')),
  created_at timestamptz not null default now()
);

create index opportunities_company_id_idx on opportunities (company_id);
create index opportunities_organisation_id_idx on opportunities (organisation_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table companies enable row level security;
alter table evidence enable row level security;
alter table opportunities enable row level security;

create policy companies_all on companies
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy evidence_all on evidence
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy opportunities_all on opportunities
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

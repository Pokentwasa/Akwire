-- Phase 5: Lead capture
--
-- lead_status spans the full acquisition + sales funnel (section 23) so we
-- don't need a second migration to widen the enum in Phase 6 — a lead
-- entering via an outbound campaign starts in the acquisition states, one
-- from direct prospecting starts in consent states, and both converge on
-- the same sales states.

create type lead_status as enum (
  'new',
  'qualified',
  'consent_requested',
  'consented',
  'pitch_ready',
  'pitch_sent',
  'replied',
  'meeting',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'declined',
  'no_response',
  'suppressed'
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  campaign_id uuid references campaigns (id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  source text not null default 'manual', -- 'yebo_form' | 'manual' | 'csv_import'
  status lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organisation_id_idx on leads (organisation_id);
create index leads_company_id_idx on leads (company_id);
create index leads_campaign_id_idx on leads (campaign_id);

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

create table lead_submissions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  campaign_id uuid references campaigns (id) on delete set null,
  form_id text,
  submission_data jsonb not null default '{}'::jsonb,
  permission_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index lead_submissions_lead_id_idx on lead_submissions (lead_id);
create index lead_submissions_organisation_id_idx on lead_submissions (organisation_id);

alter table leads enable row level security;
alter table lead_submissions enable row level security;

create policy leads_all on leads
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy lead_submissions_all on lead_submissions
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

-- Public lead capture (unauthenticated visitors submitting a campaign's
-- lead form) is written via the service-role client from a trusted server
-- action, not via a browser-held anon key — so no additional "anon can
-- insert" policy is needed or wanted here. See
-- src/app/l/[campaignId]/actions.ts.

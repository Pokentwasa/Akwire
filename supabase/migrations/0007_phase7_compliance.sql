-- Phase 7: Compliance scaffolding (section 18 of the brief)
--
-- This is the technical enforcement layer only. Legal wording (what a
-- consent request actually says, retention periods, etc.) is NOT decided
-- here — see docs/LEGAL_REVIEW.md. Nothing in this migration or the
-- domain functions that use it should be taken as legal advice or a
-- POPIA compliance guarantee.

create type consent_channel as enum ('email', 'phone', 'sms');
create type consent_status as enum ('pending', 'granted', 'declined', 'withdrawn', 'no_response');

create table consent_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  channel consent_channel not null,
  scope text not null,
  wording_version text not null,
  status consent_status not null default 'pending',
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  requested_by uuid references users (id) on delete set null
);

create index consent_requests_organisation_id_idx on consent_requests (organisation_id);
create index consent_requests_company_id_idx on consent_requests (company_id);

-- Single-request rule (section 18): "Where Yebo uses the non-customer
-- consent-request pathway, only one request may be made through Yebo."
-- Enforced here, not just in application code — a second insert for the
-- same company+channel+org fails at the database.
create unique index consent_requests_single_per_channel
  on consent_requests (organisation_id, company_id, channel);

create table consent_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  consent_request_id uuid not null references consent_requests (id) on delete cascade,
  event_type text not null check (event_type in ('requested', 'granted', 'declined', 'withdrawn')),
  wording_version text not null,
  actor_user_id uuid references users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index consent_events_consent_request_id_idx on consent_events (consent_request_id);
create index consent_events_organisation_id_idx on consent_events (organisation_id);

create table suppression (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  email text,
  reason text not null,
  created_at timestamptz not null default now()
);

create index suppression_organisation_id_idx on suppression (organisation_id);
create index suppression_company_id_idx on suppression (company_id);

alter table consent_requests enable row level security;
alter table consent_events enable row level security;
alter table suppression enable row level security;

create policy consent_requests_all on consent_requests
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));
create policy consent_events_all on consent_events
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));
create policy suppression_all on suppression
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

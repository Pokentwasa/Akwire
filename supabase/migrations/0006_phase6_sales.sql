-- Phase 6: Sales engine

create table pitches (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index pitches_lead_id_idx on pitches (lead_id);
create index pitches_organisation_id_idx on pitches (organisation_id);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index proposals_lead_id_idx on proposals (lead_id);
create index proposals_organisation_id_idx on proposals (organisation_id);

create table followups (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  due_at timestamptz not null,
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index followups_lead_id_idx on followups (lead_id);
create index followups_organisation_id_idx on followups (organisation_id);
create index followups_due_at_idx on followups (due_at) where completed_at is null;

create table meetings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  scheduled_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index meetings_lead_id_idx on meetings (lead_id);
create index meetings_organisation_id_idx on meetings (organisation_id);

create table deals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  value_cents integer,
  currency text not null default 'ZAR',
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  lost_reason text,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index deals_lead_id_idx on deals (lead_id);
create index deals_organisation_id_idx on deals (organisation_id);

alter table pitches enable row level security;
alter table proposals enable row level security;
alter table followups enable row level security;
alter table meetings enable row level security;
alter table deals enable row level security;

create policy pitches_all on pitches
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));
create policy proposals_all on proposals
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));
create policy followups_all on followups
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));
create policy meetings_all on meetings
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));
create policy deals_all on deals
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

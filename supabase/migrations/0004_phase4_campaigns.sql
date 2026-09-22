-- Phase 4: Campaign Builder

create type campaign_route as enum ('audience', 'direct');
create type campaign_status as enum ('draft', 'active', 'paused', 'completed');
create type campaign_company_status as enum ('targeted', 'engaged', 'lead_captured');

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  name text not null,
  offering_id uuid references offerings (id) on delete set null,
  pack_id text not null,
  route campaign_route not null default 'audience',
  angle text not null,
  offer text not null,
  status campaign_status not null default 'draft',
  spend_cents integer not null default 0,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_organisation_id_idx on campaigns (organisation_id);

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row execute function set_updated_at();

create table campaign_companies (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  status campaign_company_status not null default 'targeted',
  added_at timestamptz not null default now(),
  unique (campaign_id, company_id)
);

create index campaign_companies_campaign_id_idx on campaign_companies (campaign_id);
create index campaign_companies_organisation_id_idx on campaign_companies (organisation_id);

create table campaign_assets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  type text not null,
  content jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create index campaign_assets_campaign_id_idx on campaign_assets (campaign_id);
create index campaign_assets_organisation_id_idx on campaign_assets (organisation_id);

alter table campaigns enable row level security;
alter table campaign_companies enable row level security;
alter table campaign_assets enable row level security;

create policy campaigns_all on campaigns
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy campaign_companies_all on campaign_companies
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy campaign_assets_all on campaign_assets
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

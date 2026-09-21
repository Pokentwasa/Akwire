-- Phase 0: Foundation
-- Tenancy, offering configuration, and RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- organisations
-- ---------------------------------------------------------------------------
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organisation_settings (
  organisation_id uuid primary key references organisations (id) on delete cascade,
  timezone text not null default 'Africa/Johannesburg',
  currency text not null default 'ZAR',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- users & memberships
-- users mirrors auth.users so domain tables can reference a stable id without
-- granting broad read access to the auth schema.
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create type membership_role as enum ('owner', 'admin', 'member');

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create index memberships_user_id_idx on memberships (user_id);
create index memberships_organisation_id_idx on memberships (organisation_id);

-- ---------------------------------------------------------------------------
-- sender profile (the business identity used in outbound material)
-- ---------------------------------------------------------------------------
create table sender_profiles (
  organisation_id uuid primary key references organisations (id) on delete cascade,
  business_name text not null,
  website text,
  contact_email text,
  contact_phone text,
  logo_url text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- offerings (what the organisation sells)
-- ---------------------------------------------------------------------------
create table offerings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  name text not null,
  description text,
  services text[] not null default '{}',
  typical_customer_value_cents integer,
  currency text not null default 'ZAR',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index offerings_organisation_id_idx on offerings (organisation_id);

-- ---------------------------------------------------------------------------
-- ideal customer profiles (who Yebo should look for)
-- ---------------------------------------------------------------------------
create table ideal_customer_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  offering_id uuid references offerings (id) on delete set null,
  name text not null,
  target_industries text[] not null default '{}',
  excluded_industries text[] not null default '{}',
  geography text[] not null default '{}',
  description text,
  example_good_customers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index icp_organisation_id_idx on ideal_customer_profiles (organisation_id);

-- ---------------------------------------------------------------------------
-- activities (append-only audit trail for meaningful actions, section 28/50)
-- ---------------------------------------------------------------------------
create table activities (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  actor_user_id uuid references users (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_organisation_id_idx on activities (organisation_id);
create index activities_entity_idx on activities (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organisations_set_updated_at
  before update on organisations
  for each row execute function set_updated_at();

create trigger organisation_settings_set_updated_at
  before update on organisation_settings
  for each row execute function set_updated_at();

create trigger sender_profiles_set_updated_at
  before update on sender_profiles
  for each row execute function set_updated_at();

create trigger offerings_set_updated_at
  before update on offerings
  for each row execute function set_updated_at();

create trigger icp_set_updated_at
  before update on ideal_customer_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Every tenant table is scoped through membership in the owning organisation.
-- ---------------------------------------------------------------------------
create function is_member_of(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where organisation_id = target_org
      and user_id = auth.uid()
  );
$$;

alter table organisations enable row level security;
alter table organisation_settings enable row level security;
alter table users enable row level security;
alter table memberships enable row level security;
alter table sender_profiles enable row level security;
alter table offerings enable row level security;
alter table ideal_customer_profiles enable row level security;
alter table activities enable row level security;

create policy organisations_select on organisations
  for select using (is_member_of(id));
create policy organisations_insert on organisations
  for insert with check (true); -- creation is handled by the create_organisation RPC (security definer)
create policy organisations_update on organisations
  for update using (is_member_of(id));

create policy organisation_settings_all on organisation_settings
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy users_select_self on users
  for select using (id = auth.uid());
create policy users_update_self on users
  for update using (id = auth.uid());

create policy memberships_select on memberships
  for select using (is_member_of(organisation_id));

create policy sender_profiles_all on sender_profiles
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy offerings_all on offerings
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy icp_all on ideal_customer_profiles
  for all using (is_member_of(organisation_id)) with check (is_member_of(organisation_id));

create policy activities_select on activities
  for select using (is_member_of(organisation_id));
create policy activities_insert on activities
  for insert with check (is_member_of(organisation_id));

-- ---------------------------------------------------------------------------
-- create_organisation RPC: creates the org + owner membership atomically so
-- a brand-new user (with no membership yet) can bootstrap their tenant.
-- ---------------------------------------------------------------------------
create function create_organisation(org_name text, org_slug text)
returns organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org organisations;
begin
  insert into users (id, email)
  values (auth.uid(), (select email from auth.users where id = auth.uid()))
  on conflict (id) do nothing;

  insert into organisations (name, slug) values (org_name, org_slug)
  returning * into new_org;

  insert into organisation_settings (organisation_id) values (new_org.id);

  insert into memberships (organisation_id, user_id, role)
  values (new_org.id, auth.uid(), 'owner');

  insert into activities (organisation_id, actor_user_id, entity_type, entity_id, action)
  values (new_org.id, auth.uid(), 'organisation', new_org.id, 'organisation_created');

  return new_org;
end;
$$;

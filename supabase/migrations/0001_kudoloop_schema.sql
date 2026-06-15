create type public.kudoloop_role as enum ('parent', 'child', 'caregiver');
create type public.task_category as enum ('routine_chore', 'bonus_screen_time', 'paid_chore', 'school_achievement', 'custom_goal');
create type public.task_status as enum ('todo', 'submitted', 'approved', 'rejected', 'expired');
create type public.reward_type as enum ('screen_minutes', 'money', 'points', 'custom');
create type public.redemption_status as enum ('requested', 'approved', 'fulfilled', 'cancelled');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null,
  subscription_tier text not null default 'free',
  created_by_parent_id uuid,
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  auth_user_id uuid not null,
  role public.kudoloop_role not null,
  display_name text not null,
  avatar text not null,
  birth_year integer,
  created_at timestamptz not null default now()
);

alter table public.families
  add constraint families_created_by_parent_id_fkey
  foreign key (created_by_parent_id) references public.user_profiles(id);

create table public.child_profiles (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  default_daily_minutes integer not null default 45,
  bedtime_window text not null,
  school_night_rules text not null,
  allowance_currency text not null default 'USD',
  streak_days integer not null default 0,
  balances jsonb not null default '{"screen_minutes":0,"money":0,"points":0,"custom":0}'::jsonb
);

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category public.task_category not null,
  recurrence_rule text not null,
  default_proof_required boolean not null default false,
  approval_mode text not null default 'parent_required',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reward_rules (
  id uuid primary key default gen_random_uuid(),
  task_template_id uuid not null references public.task_templates(id) on delete cascade,
  reward_type public.reward_type not null,
  amount numeric not null,
  label text not null,
  bonus_condition text
);

create table public.task_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.task_templates(id) on delete cascade,
  child_id uuid not null references public.user_profiles(id) on delete cascade,
  due_at timestamptz not null,
  status public.task_status not null default 'todo',
  submitted_at timestamptz,
  approved_by uuid references public.user_profiles(id),
  notes text
);

create table public.proof_assets (
  id uuid primary key default gen_random_uuid(),
  task_instance_id uuid not null references public.task_instances(id) on delete cascade,
  uploader_id uuid not null references public.user_profiles(id),
  storage_path text not null,
  thumbnail_path text not null,
  media_type text not null,
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.reward_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.user_profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  reward_type public.reward_type not null,
  delta numeric not null,
  balance_after numeric not null,
  created_by uuid not null references public.user_profiles(id),
  reason text not null,
  request_id text not null unique,
  created_at timestamptz not null default now()
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.user_profiles(id) on delete cascade,
  reward_type public.reward_type not null,
  amount numeric not null,
  target_device text,
  status public.redemption_status not null default 'requested',
  requested_at timestamptz not null default now(),
  approved_by uuid references public.user_profiles(id)
);

alter table public.families enable row level security;
alter table public.user_profiles enable row level security;
alter table public.child_profiles enable row level security;
alter table public.task_templates enable row level security;
alter table public.reward_rules enable row level security;
alter table public.task_instances enable row level security;
alter table public.proof_assets enable row level security;
alter table public.reward_ledger_entries enable row level security;
alter table public.redemptions enable row level security;

create or replace function public.current_family_id()
returns uuid
language sql
stable
as $$
  select family_id from public.user_profiles where auth_user_id = auth.uid() limit 1
$$;

create policy "family members can read their family"
on public.families for select
using (id = public.current_family_id());

create policy "family members can read profiles"
on public.user_profiles for select
using (family_id = public.current_family_id());

create policy "parents manage templates"
on public.task_templates for all
using (
  family_id = public.current_family_id()
  and exists (
    select 1 from public.user_profiles
    where auth_user_id = auth.uid() and role in ('parent', 'caregiver')
  )
);

create policy "family reads child profiles"
on public.child_profiles for select
using (
  exists (
    select 1 from public.user_profiles
    where id = child_profiles.user_id and family_id = public.current_family_id()
  )
);

create policy "family reads task instances"
on public.task_instances for select
using (
  exists (
    select 1 from public.user_profiles
    where id = task_instances.child_id and family_id = public.current_family_id()
  )
);

create policy "children submit their own proof records"
on public.proof_assets for insert
with check (uploader_id in (select id from public.user_profiles where auth_user_id = auth.uid() and role = 'child'));

create policy "family reads proof metadata"
on public.proof_assets for select
using (
  exists (
    select 1 from public.task_instances
    join public.user_profiles on user_profiles.id = task_instances.child_id
    where task_instances.id = proof_assets.task_instance_id
      and user_profiles.family_id = public.current_family_id()
  )
);

create policy "family reads reward ledger"
on public.reward_ledger_entries for select
using (
  exists (
    select 1 from public.user_profiles
    where id = reward_ledger_entries.child_id and family_id = public.current_family_id()
  )
);

create policy "family reads redemptions"
on public.redemptions for select
using (
  exists (
    select 1 from public.user_profiles
    where id = redemptions.child_id and family_id = public.current_family_id()
  )
);

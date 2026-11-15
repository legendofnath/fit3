-- fit^3 database schema for Supabase (Postgres).
-- Run this once in the Supabase SQL editor for a new project.

-- ---------------------------------------------------------------------------
-- Gyms
-- ---------------------------------------------------------------------------
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  address text check (char_length(address) <= 200),
  -- Google Maps place id, when known. One gym per listing.
  place_id text unique,
  gym_type text not null check (gym_type in ('commercial', 'strength', 'functional', 'small', 'home')),
  is_private boolean not null default false,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- Which equipment a gym has. equipment_id is a catalog id from the app,
-- or 'custom:<uuid>' with custom_name for member-created entries.
create table public.gym_equipment (
  gym_id uuid not null references public.gyms on delete cascade,
  equipment_id text not null check (char_length(equipment_id) <= 80),
  custom_name text check (char_length(custom_name) <= 80),
  present boolean not null default true,
  source text not null default 'member' check (source in ('baseline', 'member')),
  updated_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now(),
  primary key (gym_id, equipment_id)
);

-- Every change to a gym's equipment, so mistakes can be seen and undone.
create table public.equipment_changes (
  id bigint generated always as identity primary key,
  gym_id uuid not null references public.gyms on delete cascade,
  equipment_id text not null,
  custom_name text,
  action text not null check (action in ('add', 'remove', 'restore')),
  user_id uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index equipment_changes_gym_idx on public.equipment_changes (gym_id, created_at desc);
create index equipment_changes_user_idx on public.equipment_changes (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Member data (private to each member)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  goal text not null default 'strength' check (goal in ('power', 'strength', 'weight_loss', 'bodybuilding')),
  experience int not null default 1 check (experience between 1 and 3),
  days_per_week int not null default 3 check (days_per_week between 1 and 6),
  session_minutes int not null default 60 check (session_minutes between 20 and 120),
  avoid text[] not null default '{}',
  units text not null default 'lb' check (units in ('lb', 'kg')),
  gym_id uuid references public.gyms on delete set null,
  -- When the member confirmed they are 18 or older and accepted the disclaimer.
  adult_confirmed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.plans (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  gym_id uuid references public.gyms on delete set null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- One row per logged set.
create table public.journal_sets (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  gym_id uuid references public.gyms on delete set null,
  exercise_id text not null check (char_length(exercise_id) <= 80),
  performed_on date not null default current_date,
  set_number int not null check (set_number between 1 and 20),
  reps int not null check (reps between 0 and 200),
  weight numeric(6, 2) check (weight between 0 and 2000),
  unit text not null default 'lb' check (unit in ('lb', 'kg')),
  target_reps_high int,
  created_at timestamptz not null default now()
);
create index journal_sets_user_idx on public.journal_sets (user_id, exercise_id, performed_on desc);

create table public.problem_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('bug', 'exercise', 'equipment', 'other')),
  message text not null check (char_length(message) between 3 and 2000),
  context jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security: members only reach their own data.
-- ---------------------------------------------------------------------------
alter table public.gyms enable row level security;
alter table public.gym_equipment enable row level security;
alter table public.equipment_changes enable row level security;
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.journal_sets enable row level security;
alter table public.problem_reports enable row level security;

-- Gyms are readable by signed-in members, except private gyms, which only their creator sees.
create policy gyms_read on public.gyms for select to authenticated
  using (not is_private or created_by = (select auth.uid()));

-- Equipment and its history follow the gym's visibility (the subquery is itself filtered by gyms_read).
create policy gym_equipment_read on public.gym_equipment for select to authenticated
  using (exists (select 1 from public.gyms g where g.id = gym_id));
create policy equipment_changes_read on public.equipment_changes for select to authenticated
  using (exists (select 1 from public.gyms g where g.id = gym_id));

-- No insert, update or delete policies on gyms, gym_equipment or equipment_changes:
-- all writes go through the functions below.

create policy profiles_own on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy plans_own on public.plans for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy journal_own on public.journal_sets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reports_insert on public.problem_reports for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy reports_read on public.problem_reports for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Controlled writes
-- ---------------------------------------------------------------------------

-- Create a gym with its starting equipment. If a gym already exists for the
-- Google listing, that gym is returned instead of creating a duplicate.
create or replace function public.create_gym(
  p_name text,
  p_address text,
  p_place_id text,
  p_gym_type text,
  p_is_private boolean,
  p_baseline text[]
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_gym uuid;
  v_created int;
begin
  if v_user is null then
    raise exception 'Sign in to add a gym.';
  end if;

  if p_place_id is not null and p_place_id <> '' then
    select id into v_gym from public.gyms where place_id = p_place_id;
    if v_gym is not null then
      return v_gym;
    end if;
  end if;

  select count(*) into v_created from public.gyms
    where created_by = v_user and created_at > now() - interval '1 day';
  if v_created >= 5 then
    raise exception 'You can add up to 5 gyms per day.';
  end if;

  if coalesce(array_length(p_baseline, 1), 0) > 100 then
    raise exception 'Too many starting items.';
  end if;

  insert into public.gyms (name, address, place_id, gym_type, is_private, created_by)
    values (trim(p_name), nullif(trim(coalesce(p_address, '')), ''), nullif(p_place_id, ''),
            p_gym_type, coalesce(p_is_private, false), v_user)
    returning id into v_gym;

  insert into public.gym_equipment (gym_id, equipment_id, source, updated_by)
    select v_gym, item, 'baseline', v_user
    from (select distinct unnest(coalesce(p_baseline, '{}'::text[])) as item) items
    where item is not null and item <> '';

  return v_gym;
end;
$$;

-- Add, remove or restore one piece of equipment at a gym.
-- Records the change and limits each account to 30 changes per day.
create or replace function public.change_gym_equipment(
  p_gym uuid,
  p_equipment text,
  p_action text,
  p_custom_name text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_recent int;
begin
  if v_user is null then
    raise exception 'Sign in to edit equipment.';
  end if;
  if p_action not in ('add', 'remove', 'restore') then
    raise exception 'Unknown action.';
  end if;
  if p_equipment is null or char_length(p_equipment) not between 1 and 80 then
    raise exception 'Unknown equipment.';
  end if;

  if not exists (
    select 1 from public.gyms g
    where g.id = p_gym and (not g.is_private or g.created_by = v_user)
  ) then
    raise exception 'Gym not found.';
  end if;

  select count(*) into v_recent from public.equipment_changes
    where user_id = v_user and created_at > now() - interval '1 day';
  if v_recent >= 30 then
    raise exception 'Daily limit reached: 30 equipment changes per day.';
  end if;

  insert into public.gym_equipment (gym_id, equipment_id, custom_name, present, source, updated_by, updated_at)
    values (p_gym, p_equipment, left(p_custom_name, 80), p_action <> 'remove', 'member', v_user, now())
    on conflict (gym_id, equipment_id) do update
      set present = excluded.present,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at;

  insert into public.equipment_changes (gym_id, equipment_id, custom_name, action, user_id)
    values (p_gym, p_equipment, left(p_custom_name, 80), p_action, v_user);
end;
$$;

-- Delete the signed-in member's account and everything tied to it.
create or replace function public.delete_my_account() returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  delete from public.gyms where is_private and created_by = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.create_gym(text, text, text, text, boolean, text[]) from public, anon;
revoke all on function public.change_gym_equipment(uuid, text, text, text) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.create_gym(text, text, text, text, boolean, text[]) to authenticated;
grant execute on function public.change_gym_equipment(uuid, text, text, text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

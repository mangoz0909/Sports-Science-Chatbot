-- Baseline the untracked schema, and add the AI request quota.
--
-- WHY THIS EXISTS
-- ---------------
-- profiles, daily_checkins and chat_messages were created by hand in the
-- Supabase dashboard, so until now the only tracked migration was
-- daily_plans. That left the RLS policies protecting this project's health
-- data impossible to review, diff, or rebuild, and made delete-account's
-- correctness rest on foreign keys nobody could see. This file brings all of
-- it under version control.
--
-- HOW IT WAS WRITTEN
-- ------------------
-- The column lists below are RECONSTRUCTED FROM THE APPLICATION CODE — every
-- column the client and the edge functions read or write — not dumped from
-- the live database. Types are inferred from how the code uses each value:
-- the profile form submits every field as a trimmed string, so those columns
-- are text; check-in metrics are written as numbers.
--
-- Before trusting this as the baseline, reconcile it against production:
--
--     supabase db dump --schema public --file dump.sql
--
-- and diff. If the live table has a column this file omits, add it here
-- rather than dropping it there.
--
-- SAFE TO RUN ON THE LIVE DATABASE
-- --------------------------------
-- Every statement is idempotent and additive: `create table if not exists`,
-- `add column if not exists`, and `drop policy if exists` before each
-- `create policy`. Nothing here drops a table, drops a column, or deletes a
-- row. Running it twice is the same as running it once.
--
-- The one thing it does rewrite is foreign keys — see the cascade section.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────────────────────────────────
-- One row per athlete, keyed by their auth.users id. Written by the signup
-- flow, the onboarding survey, and the profile page; read by the dashboard
-- greeting and injected into the AI system prompt.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Survey and profile-form columns. Text throughout: the forms submit strings,
-- and the AI prompt interpolates them as-is. Storing age or weight as numeric
-- would reject the free-text answers the survey actually allows.
alter table public.profiles add column if not exists primary_sport      text;
alter table public.profiles add column if not exists experience_level   text;
alter table public.profiles add column if not exists main_goal          text;
alter table public.profiles add column if not exists goal               text;
alter table public.profiles add column if not exists training_days      text;
alter table public.profiles add column if not exists competition_level  text;
alter table public.profiles add column if not exists injury_areas       text;
alter table public.profiles add column if not exists priorities         text;
alter table public.profiles add column if not exists sleep_range        text;
alter table public.profiles add column if not exists athlete_type       text;
alter table public.profiles add column if not exists age                text;
alter table public.profiles add column if not exists height_cm          text;
alter table public.profiles add column if not exists weight_kg          text;
alter table public.profiles add column if not exists activity_level     text;
alter table public.profiles add column if not exists workout_duration   text;
alter table public.profiles add column if not exists equipment_access   text;
alter table public.profiles add column if not exists dietary_preference text;
alter table public.profiles add column if not exists food_allergies     text;
alter table public.profiles add column if not exists foods_avoid        text;
alter table public.profiles add column if not exists meals_per_day      text;
alter table public.profiles add column if not exists cooking_access     text;

alter table public.profiles enable row level security;

-- An athlete reaches exactly their own row, for every verb. The client upserts
-- on signup and on every survey save, so insert and update are both required.
drop policy if exists "Athletes can read their own profile" on public.profiles;
create policy "Athletes can read their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Athletes can create their own profile" on public.profiles;
create policy "Athletes can create their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Athletes can update their own profile" on public.profiles;
create policy "Athletes can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy on purpose. Profiles are removed by deleting the auth user
-- (the delete-account function), which cascades. Letting the client delete its
-- own profile row directly would leave a logged-in session with no profile.

-- ────────────────────────────────────────────────────────────────────────────
-- daily_checkins
-- ────────────────────────────────────────────────────────────────────────────
-- One row per athlete per local calendar day. checkin_date is the athlete's
-- OWN date (see checkinService.localDateString), not UTC — the unique
-- constraint below is what the client's upsert targets.

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,
  sleep_hours        numeric,
  sleep_quality      numeric,
  energy             numeric,
  soreness           numeric,
  fatigue            numeric,
  stress             numeric,
  mood               numeric,
  hydration          numeric,
  nutrition          numeric,
  training_intensity numeric,
  pain_level         numeric,
  notes              text,
  readiness_score    numeric,
  recovery_score     numeric,
  injury_risk        numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_checkins_user_date_key unique (user_id, checkin_date)
);

-- The client upserts with onConflict "user_id,checkin_date", which requires a
-- matching unique constraint. Added separately because the table already
-- exists in production and may not have one — without it, a second check-in on
-- the same day silently inserts a duplicate row instead of replacing the first,
-- and getLatestCheckIn then returns whichever the planner happens to pick.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_checkins'::regclass
      and contype = 'u'
      and conkey @> array[
        (select attnum from pg_attribute
          where attrelid = 'public.daily_checkins'::regclass and attname = 'user_id'),
        (select attnum from pg_attribute
          where attrelid = 'public.daily_checkins'::regclass and attname = 'checkin_date')
      ]
  ) then
    alter table public.daily_checkins
      add constraint daily_checkins_user_date_key unique (user_id, checkin_date);
  end if;
end $$;

-- Dashboard and the AI both read "this athlete, most recent first".
create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, checkin_date desc);

alter table public.daily_checkins enable row level security;

drop policy if exists "Athletes can read their own check-ins" on public.daily_checkins;
create policy "Athletes can read their own check-ins"
  on public.daily_checkins for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Athletes can create their own check-ins" on public.daily_checkins;
create policy "Athletes can create their own check-ins"
  on public.daily_checkins for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Athletes can replace their own check-ins" on public.daily_checkins;
create policy "Athletes can replace their own check-ins"
  on public.daily_checkins for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete their own check-ins" on public.daily_checkins;
create policy "Athletes can delete their own check-ins"
  on public.daily_checkins for delete to authenticated
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- chat_messages
-- ────────────────────────────────────────────────────────────────────────────
-- The assistant transcript. Roles are stored OpenAI-style ("user" /
-- "assistant"); the client maps "assistant" back to "bot" on read. "bot" is
-- accepted by the check constraint because older rows still carry it.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_type text not null default 'sports',
  role text not null check (role in ('user', 'assistant', 'bot')),
  content text not null,
  created_at timestamptz not null default now()
);

-- History is fetched oldest-first for one athlete and chat type.
create index if not exists chat_messages_user_type_created_idx
  on public.chat_messages (user_id, chat_type, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "Athletes can read their own messages" on public.chat_messages;
create policy "Athletes can read their own messages"
  on public.chat_messages for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Athletes can create their own messages" on public.chat_messages;
create policy "Athletes can create their own messages"
  on public.chat_messages for insert to authenticated
  with check (auth.uid() = user_id);

-- "Clear chat" deletes the athlete's own transcript.
drop policy if exists "Athletes can delete their own messages" on public.chat_messages;
create policy "Athletes can delete their own messages"
  on public.chat_messages for delete to authenticated
  using (auth.uid() = user_id);

-- No update policy: a sent message is a record of what was said.

-- ────────────────────────────────────────────────────────────────────────────
-- Account deletion must actually delete
-- ────────────────────────────────────────────────────────────────────────────
-- delete-account removes the auth user and relies on the cascade to take the
-- athlete's data with it. If any of these foreign keys was created without
-- `on delete cascade` — the default is NO ACTION — then deleting the user
-- either fails outright or leaves their check-ins and transcript behind,
-- orphaned and unreachable. The `create table` statements above only apply to
-- a fresh database; this block repairs the tables that already exist.
--
-- This is the one part of the file that rewrites existing objects. It only
-- ever changes a key's delete behaviour to cascade; it drops no data.

do $$
declare
  target record;
begin
  for target in
    select con.oid,
           con.conname,
           con.conrelid::regclass::text as table_name,
           att.attname                  as column_name
      from pg_constraint con
      join pg_attribute att
        on att.attrelid = con.conrelid
       and att.attnum = con.conkey[1]
     where con.contype = 'f'
       and con.confrelid = 'auth.users'::regclass
       and con.confdeltype <> 'c'  -- 'c' = cascade; anything else needs fixing
       and con.conrelid in (
             'public.profiles'::regclass,
             'public.daily_checkins'::regclass,
             'public.chat_messages'::regclass,
             'public.daily_plans'::regclass
           )
  loop
    raise notice 'Rebuilding % on % with ON DELETE CASCADE', target.conname, target.table_name;

    execute format('alter table %s drop constraint %I', target.table_name, target.conname);
    execute format(
      'alter table %s add constraint %I foreign key (%I) references auth.users (id) on delete cascade',
      target.table_name, target.conname, target.column_name
    );
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- AI request quota
-- ────────────────────────────────────────────────────────────────────────────
-- Both edge functions are authenticated but not trusted: before this, any
-- account could loop them and bill the project's OpenAI key without limit.
-- One counter row per athlete per UTC day.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_usage enable row level security;

-- Read-only to the athlete, so a client could show "you have N left".
-- Deliberately no insert or update policy: the counter is written ONLY through
-- consume_ai_quota below, which is SECURITY DEFINER. A user who could update
-- this table directly could reset their own counter to zero, which is the
-- whole thing the cap is meant to prevent.
drop policy if exists "Athletes can read their own AI usage" on public.ai_usage;
create policy "Athletes can read their own AI usage"
  on public.ai_usage for select to authenticated
  using (auth.uid() = user_id);

/*
 * Charges one AI request against today's quota and reports whether the caller
 * was still under the cap.
 *
 * The increment and the check are ONE statement. Read-then-write would let two
 * concurrent requests both read the same count and both decide they were under
 * the limit; `on conflict do update` makes the read-modify-write atomic, and
 * the returned value is the count after this request.
 *
 * SECURITY DEFINER so it can write a table the caller cannot, but the user is
 * taken from auth.uid() rather than a parameter — the caller cannot spend
 * somebody else's quota or top up their own. search_path is pinned because a
 * SECURITY DEFINER function that resolves names through a caller-controlled
 * search_path is how privilege escalation happens.
 */
create or replace function public.consume_ai_quota(p_limit integer)
returns table (allowed boolean, used integer, "limit" integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_today   date := (now() at time zone 'utc')::date;
  v_count   integer;
begin
  if v_user_id is null then
    raise exception 'consume_ai_quota requires an authenticated caller';
  end if;

  if p_limit is null or p_limit < 1 then
    raise exception 'consume_ai_quota requires a positive limit';
  end if;

  insert into public.ai_usage as u (user_id, usage_date, request_count, updated_at)
       values (v_user_id, v_today, 1, now())
  on conflict (user_id, usage_date) do update
          set request_count = u.request_count + 1,
              updated_at    = now()
    returning u.request_count into v_count;

  return query select (v_count <= p_limit), v_count, p_limit;
end;
$$;

revoke all on function public.consume_ai_quota(integer) from public;
grant execute on function public.consume_ai_quota(integer) to authenticated;

commit;

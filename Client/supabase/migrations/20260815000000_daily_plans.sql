-- Daily AI plans: one row per athlete, per plan kind, per calendar day.
--
-- The workout and nutrition plans used to live only in React state, so leaving
-- the page and coming back regenerated them from scratch. They are stored here
-- instead, which keeps a plan generated in the morning identical that evening
-- and carries it across devices.
--
-- Note: the earlier tables in this project (profiles, daily_checkins) were
-- created directly in the Supabase dashboard, so this is the first tracked
-- migration rather than the beginning of the schema. Run it in the SQL editor
-- (or via `supabase db push`) before deploying the client change.

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_kind text not null check (plan_kind in ('workout', 'nutrition')),
  -- Stored as the athlete's own local date, matching daily_checkins.checkin_date,
  -- so the plan rolls over at their midnight rather than UTC's.
  plan_date date not null,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_plans_user_kind_date_key unique (user_id, plan_kind, plan_date)
);

-- The unique constraint above doubles as the lookup index for the only query
-- the client makes: this athlete, this kind, today.

alter table public.daily_plans enable row level security;

drop policy if exists "Athletes can read their own plans" on public.daily_plans;
create policy "Athletes can read their own plans"
  on public.daily_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Athletes can create their own plans" on public.daily_plans;
create policy "Athletes can create their own plans"
  on public.daily_plans
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Regenerating overwrites the same row, so update needs both a using and a
-- with check clause: one to find the row, one to stop it being reassigned.
drop policy if exists "Athletes can replace their own plans" on public.daily_plans;
create policy "Athletes can replace their own plans"
  on public.daily_plans
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Athletes can delete their own plans" on public.daily_plans;
create policy "Athletes can delete their own plans"
  on public.daily_plans
  for delete
  to authenticated
  using (auth.uid() = user_id);

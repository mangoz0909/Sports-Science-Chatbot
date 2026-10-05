-- Size limits on the columns an athlete can write.
--
-- WHY THIS EXISTS
-- ---------------
-- Row-level security decides WHOSE rows a user may write, not how big they are.
-- Every column below is writable straight from the browser with the public anon
-- key plus the athlete's own JWT, so the client's form limits (where there are
-- any) are advice, not enforcement. An account could store megabytes in
-- profiles.priorities or daily_checkins.notes, and because those values are
-- read back into the AI system prompt, an oversized row inflates every later
-- OpenAI call (and the bill) for that account while bypassing the per-message
-- caps in the edge functions.
--
-- WHY `NOT VALID`
-- ---------------
-- A NOT VALID check is enforced for every new INSERT and UPDATE but is not run
-- against rows that already exist, so this migration can never fail or lock out
-- on data that is already in production. The edge function also truncates what
-- it reads into prompts, which covers any oversized rows that were stored
-- before this ran. Once such rows are cleaned up, `alter table ... validate
-- constraint <name>` turns the check into a full guarantee.
--
-- One consequence worth knowing: an UPDATE to a row that already holds an
-- oversized value is checked as a whole, so it is rejected until that value is
-- shortened. That is the intended behaviour.
--
-- HOW THE LIMITS WERE CHOSEN
-- --------------------------
-- Comfortably above anything the app legitimately writes. The survey and
-- profile forms submit short selections and trimmed strings; multi-select
-- answers (injury areas, equipment) are stored comma-joined, so those get the
-- larger free-text allowance. Every column is cast to text first: the baseline
-- declares them text, but `add column if not exists` never changes an existing
-- column, and on the live project some (age, height_cm, ...) are numeric —
-- char_length(integer) does not exist and would abort this migration.
-- NULL passes every check — char_length(null::text) is
-- null, and a check only fails on false.
--
-- Safe to re-run: each constraint is only added when its name is not already
-- in pg_constraint.

begin;

-- profiles ───────────────────────────────────────────────────────────────────
-- Tiers: 200 for names and single-choice answers, 500 for goal-style answers
-- that may be a short list, 1000 for free text and multi-select lists.
-- email is 320, the maximum length of an address under RFC 5321.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_text_size_limits'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_text_size_limits check (
        char_length(name::text)              <= 200
        and char_length(email::text)         <= 320
        and char_length(primary_sport::text) <= 200
        and char_length(experience_level::text) <= 200
        and char_length(competition_level::text) <= 200
        and char_length(training_days::text) <= 200
        and char_length(sleep_range::text)   <= 200
        and char_length(athlete_type::text)  <= 200
        and char_length(age::text)           <= 200
        and char_length(height_cm::text)     <= 200
        and char_length(weight_kg::text)     <= 200
        and char_length(activity_level::text) <= 200
        and char_length(workout_duration::text) <= 200
        and char_length(meals_per_day::text) <= 200
        and char_length(cooking_access::text) <= 200
        and char_length(main_goal::text)     <= 500
        and char_length(goal::text)          <= 500
        and char_length(dietary_preference::text) <= 1000
        and char_length(equipment_access::text) <= 1000
        and char_length(injury_areas::text)  <= 1000
        and char_length(priorities::text)    <= 1000
        and char_length(food_allergies::text) <= 1000
        and char_length(foods_avoid::text)   <= 1000
      ) not valid;
  end if;
end $$;

-- daily_checkins ─────────────────────────────────────────────────────────────
-- The notes box is a free-text field; 2000 characters is several paragraphs.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_checkins_notes_size'
      and conrelid = 'public.daily_checkins'::regclass
  ) then
    alter table public.daily_checkins
      add constraint daily_checkins_notes_size
      check (char_length(notes::text) <= 2000) not valid;
  end if;
end $$;

-- chat_messages ──────────────────────────────────────────────────────────────
-- ai-chat accepts messages up to 5000 characters and stores the model's reply
-- alongside, which can run long. 20000 leaves room for both without letting a
-- row grow without bound.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chat_messages_content_size'
      and conrelid = 'public.chat_messages'::regclass
  ) then
    alter table public.chat_messages
      add constraint chat_messages_content_size
      check (char_length(content::text) <= 20000) not valid;
  end if;
end $$;

-- daily_plans ────────────────────────────────────────────────────────────────
-- A generated plan is a few KB of JSON; 64 KB is more than ten times that.
-- pg_column_size measures the stored (possibly compressed) value, so this is a
-- generous bound on storage rather than an exact byte count of the JSON text.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_plans_plan_size'
      and conrelid = 'public.daily_plans'::regclass
  ) then
    alter table public.daily_plans
      add constraint daily_plans_plan_size
      check (pg_column_size(plan) < 65536) not valid;
  end if;
end $$;

commit;

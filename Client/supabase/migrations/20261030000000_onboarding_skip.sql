alter table public.profiles
  add column if not exists onboarding_skipped boolean not null default false;

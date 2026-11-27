-- V4-05 (bug hunt v4, 16 Nov 2026): refund_ai_quota is service-role only.
--
-- Run by hand in the Supabase SQL editor, AFTER migration
-- 20261127000000_refund_ai_quota_server_only.sql. Everything here rolls back:
-- two throwaway users and their usage rows are created and removed again.
-- Expect only "PASS ..." notices. Any "FAIL ..." stops the script.

begin;

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-0000000005a1', 'v4-05-a@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000005b2', 'v4-05-b@example.invalid', 'authenticated', 'authenticated');

insert into public.ai_usage (user_id, usage_date, request_count)
values
  ('00000000-0000-4000-8000-0000000005a1', (now() at time zone 'utc')::date, 3),
  ('00000000-0000-4000-8000-0000000005b2', (now() at time zone 'utc')::date, 3);

-- 1. Grants: the old user-callable version is gone, only service_role may run the new one.
do $$
begin
  if to_regprocedure('public.refund_ai_quota()') is not null then
    raise exception 'FAIL the old refund_ai_quota() still exists';
  end if;
  if has_function_privilege('authenticated', 'public.refund_ai_quota(uuid)', 'execute') then
    raise exception 'FAIL authenticated can execute refund_ai_quota(uuid)';
  end if;
  if has_function_privilege('anon', 'public.refund_ai_quota(uuid)', 'execute') then
    raise exception 'FAIL anon can execute refund_ai_quota(uuid)';
  end if;
  if not has_function_privilege('service_role', 'public.refund_ai_quota(uuid)', 'execute') then
    raise exception 'FAIL service_role cannot execute refund_ai_quota(uuid)';
  end if;
  raise notice 'PASS grants';
end $$;

-- 2. Signed in as user A: refunding A's own counter, or B's, is refused.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-4000-8000-0000000005a1', 'role', 'authenticated')::text,
  true
);
set local role authenticated;

do $$
begin
  begin
    perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005a1');
    raise exception 'FAIL a signed-in user refunded their own counter';
  exception when insufficient_privilege then
    raise notice 'PASS a signed-in user cannot refund their own counter';
  end;

  begin
    perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005b2');
    raise exception 'FAIL a signed-in user refunded another user''s counter';
  exception when insufficient_privilege then
    raise notice 'PASS a signed-in user cannot refund another user''s counter';
  end;
end $$;

reset role;

-- 3. Anonymous (the public key): refused.
set local role anon;

do $$
begin
  perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005a1');
  raise exception 'FAIL anon refunded a counter';
exception when insufficient_privilege then
  raise notice 'PASS anon cannot refund';
end $$;

reset role;

-- 4. The service role (the edge functions): one request back, only for that
--    user, never below zero.
set local role service_role;

do $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_a integer;
  v_b integer;
begin
  perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005a1');

  select request_count into v_a from public.ai_usage
   where user_id = '00000000-0000-4000-8000-0000000005a1' and usage_date = v_today;
  select request_count into v_b from public.ai_usage
   where user_id = '00000000-0000-4000-8000-0000000005b2' and usage_date = v_today;

  if v_a <> 2 then
    raise exception 'FAIL one refund left user A at % (expected 2)', v_a;
  end if;
  if v_b <> 3 then
    raise exception 'FAIL refunding user A changed user B to % (expected 3)', v_b;
  end if;

  perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005a1');
  perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005a1');
  perform public.refund_ai_quota('00000000-0000-4000-8000-0000000005a1');

  select request_count into v_a from public.ai_usage
   where user_id = '00000000-0000-4000-8000-0000000005a1' and usage_date = v_today;

  if v_a <> 0 then
    raise exception 'FAIL four refunds from 3 left user A at % (expected 0)', v_a;
  end if;

  raise notice 'PASS the service role refunds one request, for that user only, never below zero';
end $$;

reset role;

rollback;

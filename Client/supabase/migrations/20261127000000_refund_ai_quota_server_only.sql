-- Only the edge functions may refund an AI request (bug hunt v4, V4-05).
--
-- 20261005010000 granted refund_ai_quota() to every signed-in user. It takes
-- one request off the caller's counter each time it is called, with no link to
-- a failed request, so anyone could call it through the API after every AI
-- request and keep their counter at 0: the daily cap (120 chats, 60 plans)
-- never triggered and the project's OpenAI key had no per-user limit.
--
-- The refund now takes the athlete's id and only the service role may run it.
-- ai-chat and ai-complete call it with a service-role client on their own
-- failure path, at most once per request (functions/_shared/quota.ts
-- refundQuota). consume_ai_quota is unchanged.
--
-- Rollout: either order is safe. Old functions calling refund_ai_quota() after
-- this runs, or new functions calling refund_ai_quota(uuid) before it, get
-- "function not found"; refundQuota logs it and the athlete loses that one
-- request, as before refunds existed. Nothing else depends on the old
-- signature.
--
-- Check afterwards: supabase/tests/V4-05-refund-rls.sql (run by hand in the
-- SQL editor; it rolls back).
--
-- Safe to re-run: drop if exists, create or replace, idempotent grants.

begin;

drop function if exists public.refund_ai_quota();

create or replace function public.refund_ai_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  if p_user_id is null then
    raise exception 'refund_ai_quota requires a user id';
  end if;

  -- Never below zero, so a refund can't bank credit for later.
  update public.ai_usage
     set request_count = greatest(request_count - 1, 0),
         updated_at    = now()
   where user_id = p_user_id
     and usage_date = v_today
     and request_count > 0;
end;
$$;

-- Supabase's default privileges also grant new public functions to anon and
-- authenticated, so both are revoked by name, not only PUBLIC.
revoke all on function public.refund_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_quota(uuid) to service_role;

commit;

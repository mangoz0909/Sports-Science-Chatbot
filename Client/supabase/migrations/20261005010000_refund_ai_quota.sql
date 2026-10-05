-- Refund one AI request when the upstream model call fails.
--
-- consume_ai_quota charges before OpenAI runs, so an over-limit athlete costs
-- nothing. The flip side was that an OpenAI outage still spent the athlete's
-- requests: each retry during an outage counted, and a bad hour could use up
-- the day's allowance with no answers. ai-chat and ai-complete now call this
-- when the model call fails (see functions/_shared/quota.ts refundQuota).
--
-- Same shape as consume_ai_quota: SECURITY DEFINER with a pinned search_path,
-- the caller taken from auth.uid() and never from a parameter, so a user can
-- only ever refund their own counter. It never goes below zero, so a refund
-- can't bank credit for later. A request that straddles UTC midnight refunds
-- against the new day; at worst that is one extra request, once.
--
-- Safe to re-run: create or replace, and the grants are idempotent.

begin;

create or replace function public.refund_ai_quota()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_today   date := (now() at time zone 'utc')::date;
begin
  if v_user_id is null then
    raise exception 'refund_ai_quota requires an authenticated caller';
  end if;

  update public.ai_usage
     set request_count = greatest(request_count - 1, 0),
         updated_at    = now()
   where user_id = v_user_id
     and usage_date = v_today
     and request_count > 0;
end;
$$;

revoke all on function public.refund_ai_quota() from public;
grant execute on function public.refund_ai_quota() to authenticated;

commit;

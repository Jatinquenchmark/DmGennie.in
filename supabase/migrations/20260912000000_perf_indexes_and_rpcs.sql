-- CPU fix: the dashboard and the comment webhook each fired 10-20 separate
-- count(*) queries against activity_log, and none of activity_log / triggers /
-- user_settings.instagram_account_id had an index in any migration. Every one of
-- those counts was a sequential scan. This adds the indexes and collapses each
-- fan-out into a single RPC that does one index scan.

-- ── Indexes ────────────────────────────────────────────────────────────────
-- Plain (non-concurrent) so this runs inside the CLI's migration transaction.
-- If activity_log is large enough that the brief lock matters, run the two
-- activity_log indexes from the SQL editor with CONCURRENTLY instead.

create index if not exists activity_log_user_status_created_idx
  on public.activity_log (user_id, status, created_at desc);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);

create index if not exists triggers_user_enabled_idx
  on public.triggers (user_id, enabled);

-- The webhook looks accounts up by instagram_account_id; the existing index is
-- on instagram_user_id (a different column). Partial: only connected rows matter.
create index if not exists user_settings_instagram_account_id_idx
  on public.user_settings (instagram_account_id)
  where page_access_token is not null;

-- Dead weight on every webhook counter update:
-- (plan, status) is a strict prefix of idx_user_settings_subscription_status (plan, status, period_end).
drop index if exists public.idx_user_settings_subscription_plan;
-- A boolean nobody filters on.
drop index if exists public.idx_user_settings_intro_offer;

-- ── RPCs ───────────────────────────────────────────────────────────────────

-- Replaces 8 count(*) queries + one more per trigger in buildDashboardMetrics.
-- Called by the service role only (the API); no grants to anon/authenticated.
create or replace function public.dashboard_activity_counts(
  p_user_id uuid,
  p_start_today timestamptz,
  p_start_month timestamptz
)
returns table (
  success_all bigint,
  success_today bigint,
  success_month bigint,
  failed_all bigint,
  failed_today bigint,
  failed_month bigint,
  lead_all bigint,
  lead_month bigint,
  per_trigger jsonb
)
language sql
stable
as $$
  with base as (
    select status, created_at, trigger_keyword
    from public.activity_log
    where user_id = p_user_id
  ),
  s as (
    select
      count(*) filter (where status in ('sent','success','delivered')) as success_all,
      count(*) filter (where status in ('sent','success','delivered') and created_at >= p_start_today) as success_today,
      count(*) filter (where status in ('sent','success','delivered') and created_at >= p_start_month) as success_month,
      count(*) filter (where status in ('failed','error','failed_dm','failed_dms_closed','delivery_failed')) as failed_all,
      count(*) filter (where status in ('failed','error','failed_dm','failed_dms_closed','delivery_failed') and created_at >= p_start_today) as failed_today,
      count(*) filter (where status in ('failed','error','failed_dm','failed_dms_closed','delivery_failed') and created_at >= p_start_month) as failed_month,
      count(*) filter (where status in ('lead_captured','email_captured','captured')) as lead_all,
      count(*) filter (where status in ('lead_captured','email_captured','captured') and created_at >= p_start_month) as lead_month
    from base
  ),
  t as (
    select coalesce(jsonb_object_agg(trigger_keyword, n), '{}'::jsonb) as per_trigger
    from (
      select trigger_keyword, count(*) as n
      from base
      where status in ('sent','success','delivered') and trigger_keyword is not null
      group by 1
    ) x
  )
  select s.*, t.per_trigger from s, t;
$$;

-- Replaces the 3 count(*) queries in the webhook's plan/rate limit check.
create or replace function public.webhook_limit_counts(
  p_user_id uuid,
  p_start_month timestamptz,
  p_start_hour timestamptz
)
returns table (
  dms_month bigint,
  dms_hour bigint,
  leads_month bigint
)
language sql
stable
as $$
  select
    count(*) filter (where status in ('sent','success','delivered') and created_at >= p_start_month),
    count(*) filter (where status in ('sent','success','delivered') and created_at >= p_start_hour),
    count(*) filter (where status in ('lead_captured','email_captured','captured') and created_at >= p_start_month)
  from public.activity_log
  where user_id = p_user_id
    and created_at >= least(p_start_month, p_start_hour);
$$;

revoke all on function public.dashboard_activity_counts(uuid, timestamptz, timestamptz) from anon, authenticated;
revoke all on function public.webhook_limit_counts(uuid, timestamptz, timestamptz) from anon, authenticated;

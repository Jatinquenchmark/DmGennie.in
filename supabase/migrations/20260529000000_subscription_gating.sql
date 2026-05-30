alter table if exists public.user_settings
  add column if not exists current_period_start timestamptz;

alter table if exists public.user_settings
  alter column subscription_plan set default 'starter',
  alter column subscription_status set default 'inactive';

update public.user_settings
set subscription_plan = 'starter'
where subscription_plan is null or lower(subscription_plan) in ('free', '');

update public.user_settings
set subscription_status = 'inactive'
where subscription_status is null or lower(subscription_status) in ('free', '');

create index if not exists idx_user_settings_subscription_status
  on public.user_settings (subscription_plan, subscription_status, current_period_end);

alter table if exists public.user_settings
  add column if not exists has_used_pro_intro_offer boolean not null default false,
  add column if not exists pro_intro_started_at timestamptz,
  add column if not exists subscription_plan text not null default 'Starter',
  add column if not exists subscription_status text not null default 'free',
  add column if not exists current_period_end timestamptz,
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text;

create index if not exists idx_user_settings_intro_offer
  on public.user_settings (has_used_pro_intro_offer);

create index if not exists idx_user_settings_subscription_plan
  on public.user_settings (subscription_plan, subscription_status);

alter table if exists public.user_settings
  add column if not exists razorpay_payment_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists dm_limit integer not null default 1000;

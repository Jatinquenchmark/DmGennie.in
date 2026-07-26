alter table public.triggers
  add column if not exists trigger_type text;

alter table if exists public.user_settings
  add column if not exists instagram_user_id text,
  add column if not exists instagram_username text,
  add column if not exists instagram_access_token text,
  add column if not exists instagram_token_expires_at timestamptz,
  add column if not exists instagram_permissions text[] not null default '{}',
  add column if not exists instagram_connection_status text not null default 'disconnected',
  add column if not exists instagram_connected_at timestamptz,
  add column if not exists instagram_profile_picture_url text,
  add column if not exists instagram_account_type text,
  add column if not exists instagram_last_synced_at timestamptz;

create index if not exists idx_user_settings_instagram_connection_status
  on public.user_settings (instagram_connection_status);

create index if not exists idx_user_settings_instagram_user_id
  on public.user_settings (instagram_user_id);

-- Visual (node-graph) automations — the ManyChat-style Flow Builder.
-- Sibling of the existing keyword-based `triggers` table. The graph (nodes + edges)
-- is stored as jsonb; the front-end never queries this table directly — all access
-- goes through the service-role /api/flows endpoint, matching the user_settings posture.

create table if not exists public.flows (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null default 'Untitled flow',
    enabled boolean not null default false,
    trigger_type text,
    graph jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists flows_user_id_idx on public.flows(user_id);

-- RLS on + owner policy as defense-in-depth (the service-role API bypasses RLS).
alter table public.flows enable row level security;

drop policy if exists flows_owner on public.flows;
create policy flows_owner on public.flows
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Access is via the service-role API only; the browser client never reads/writes this
-- table. Revoke the default PostgREST grants so a logged-in user can't query it directly.
revoke all privileges on table public.flows from anon;
revoke all privileges on table public.flows from authenticated;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_user_roles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_user_roles_updated_at();

create index if not exists user_roles_role_idx on public.user_roles(role);

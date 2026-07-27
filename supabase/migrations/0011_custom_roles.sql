-- Turns the fixed admin/diretor/gerente/analista/user role list into a
-- customizable "roles" table: any authenticated admin can create new
-- profiles and pick which of the existing permission flags they grant.

alter table public.audit_logs drop constraint if exists audit_logs_entity_check;
alter table public.audit_logs add constraint audit_logs_entity_check
  check (entity in ('sales', 'products', 'users', 'marketplaces', 'companies', 'goals', 'tasks', 'roles'));

create table if not exists public.roles (
  id text primary key,
  label text not null,
  permissions jsonb not null default '{}',
  is_protected boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;

-- Seed the 5 roles that exist today, with the exact same permission matrix
-- that was hardcoded in src/lib/permissions.ts, plus the new
-- 'manageProfiles' flag (granted only to the protected 'admin' role).
insert into public.roles (id, label, permissions, is_protected) values
  ('admin', 'Administrador', '{
    "registerSales": true,
    "registerSalesUnrestricted": true,
    "approveSales": true,
    "manageGoals": true,
    "viewTeamStatus": true,
    "viewAudit": true,
    "manageUsers": true,
    "manageCadastros": true,
    "technicalSettings": true,
    "manageProfiles": true
  }'::jsonb, true),
  ('diretor', 'Diretor', '{
    "registerSales": true,
    "registerSalesUnrestricted": true,
    "approveSales": true,
    "manageGoals": true,
    "viewTeamStatus": true,
    "viewAudit": true,
    "manageUsers": true,
    "manageCadastros": true,
    "technicalSettings": false,
    "manageProfiles": false
  }'::jsonb, false),
  ('gerente', 'Gerente', '{
    "registerSales": true,
    "registerSalesUnrestricted": true,
    "approveSales": true,
    "manageGoals": true,
    "viewTeamStatus": true,
    "viewAudit": false,
    "manageUsers": false,
    "manageCadastros": false,
    "technicalSettings": false,
    "manageProfiles": false
  }'::jsonb, false),
  ('analista', 'Analista', '{
    "registerSales": false,
    "registerSalesUnrestricted": false,
    "approveSales": false,
    "manageGoals": false,
    "viewTeamStatus": true,
    "viewAudit": true,
    "manageUsers": false,
    "manageCadastros": false,
    "technicalSettings": false,
    "manageProfiles": false
  }'::jsonb, false),
  ('user', 'Usuário', '{
    "registerSales": true,
    "registerSalesUnrestricted": false,
    "approveSales": false,
    "manageGoals": false,
    "viewTeamStatus": false,
    "viewAudit": false,
    "manageUsers": false,
    "manageCadastros": false,
    "technicalSettings": false,
    "manageProfiles": false
  }'::jsonb, false)
on conflict (id) do nothing;

-- profiles.role now points at public.roles instead of a fixed CHECK list.
-- Existing values ('admin', 'diretor', ...) are untouched, so no data migration.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_fkey
  foreign key (role) references public.roles(id);

-- Everyone authenticated needs to read role permissions to know what to show.
create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (true);

-- Only admin can create/edit/delete roles; protected roles (admin itself)
-- can never be edited or deleted through the app, so there is always at
-- least one role with full access.
create policy "roles_insert_admin" on public.roles
  for insert to authenticated with check (public.is_admin());
create policy "roles_update_admin_unprotected" on public.roles
  for update to authenticated using (public.is_admin() and not is_protected);
create policy "roles_delete_admin_unprotected" on public.roles
  for delete to authenticated using (public.is_admin() and not is_protected);

-- Generic permission check: does the current user's role grant `perm`?
create or replace function public.has_permission(perm text)
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (
      select (r.permissions ->> perm)::boolean
      from public.profiles p
      join public.roles r on r.id = p.role
      where p.id = auth.uid()
    ),
    false
  );
$$;

-- User management (profiles, task deletion) now follows the dynamic
-- 'manageUsers' permission instead of the hardcoded admin/diretor check,
-- so a custom role with manageUsers = true gets real DB-level rights too.
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.has_permission('manageUsers'));
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated with check (public.has_permission('manageUsers'));
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.has_permission('manageUsers'));

drop policy if exists "tasks_delete_own_or_admin" on public.tasks;
create policy "tasks_delete_own_or_admin" on public.tasks
  for delete to authenticated
  using (created_by = auth.uid() or public.has_permission('manageUsers'));

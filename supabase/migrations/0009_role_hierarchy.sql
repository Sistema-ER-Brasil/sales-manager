-- Expands the user role system beyond admin/user to a full hierarchy:
-- admin > diretor > gerente > analista > user.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'diretor', 'gerente', 'analista', 'user'));

create or replace function public.is_admin_or_diretor()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'diretor')
  );
$$;

-- User management (Usuários screen) is now also available to 'diretor'.
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin_or_diretor());
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated with check (public.is_admin_or_diretor());
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.is_admin_or_diretor());

-- Tasks can be deleted by their creator, or by admin/diretor.
drop policy if exists "tasks_delete_admin" on public.tasks;
create policy "tasks_delete_own_or_admin" on public.tasks
  for delete to authenticated
  using (created_by = auth.uid() or public.is_admin_or_diretor());

-- Any authenticated user can now create tasks (not just admins).
drop policy if exists "tasks_insert_admin" on public.tasks;
create policy "tasks_insert_authenticated" on public.tasks
  for insert to authenticated
  with check (true);

-- Task watchers: additional people who follow a task besides the assignee.
create table if not exists public.task_watchers (
  task_id text not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  added_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

alter table public.task_watchers enable row level security;

create policy "task_watchers_select_via_task" on public.task_watchers
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = task_watchers.task_id
        and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );

create policy "task_watchers_insert_via_task" on public.task_watchers
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.tasks t
      where t.id = task_watchers.task_id
        and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );

create policy "task_watchers_delete_via_task" on public.task_watchers
  for delete to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.tasks t
      where t.id = task_watchers.task_id
        and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );

-- Broaden task visibility (select/update) to include watchers.
drop policy if exists "tasks_select_own_or_admin" on public.tasks;
create policy "tasks_select_own_or_admin" on public.tasks
  for select to authenticated
  using (
    assigned_to = auth.uid()
    or created_by = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.task_watchers w where w.task_id = tasks.id and w.user_id = auth.uid())
  );

alter publication supabase_realtime add table public.task_watchers;

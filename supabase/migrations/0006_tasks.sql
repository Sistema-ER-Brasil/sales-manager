-- Task management board (Kanban): admins create/assign tasks, assignees
-- track and update their own status.
create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  assigned_to_name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);
create index if not exists tasks_status_idx on public.tasks(status);

alter table public.tasks enable row level security;

create policy "tasks_select_own_or_admin" on public.tasks
  for select to authenticated
  using (assigned_to = auth.uid() or created_by = auth.uid() or public.is_admin());

create policy "tasks_insert_admin" on public.tasks
  for insert to authenticated
  with check (public.is_admin());

create policy "tasks_update_own_or_admin" on public.tasks
  for update to authenticated
  using (assigned_to = auth.uid() or public.is_admin())
  with check (assigned_to = auth.uid() or public.is_admin());

create policy "tasks_delete_admin" on public.tasks
  for delete to authenticated
  using (public.is_admin());

alter publication supabase_realtime add table public.tasks;

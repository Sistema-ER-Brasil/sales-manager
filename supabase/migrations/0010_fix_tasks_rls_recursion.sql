-- Fixes "infinite recursion detected in policy for relation tasks":
-- tasks' SELECT policy queried task_watchers directly, and task_watchers'
-- policies query tasks back, creating a cycle. Break it with a
-- SECURITY DEFINER helper that bypasses RLS for the watcher lookup.
create or replace function public.is_task_watcher(p_task_id text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.task_watchers w
    where w.task_id = p_task_id and w.user_id = auth.uid()
  );
$$;

drop policy if exists "tasks_select_own_or_admin" on public.tasks;
create policy "tasks_select_own_or_admin" on public.tasks
  for select to authenticated
  using (
    assigned_to = auth.uid()
    or created_by = auth.uid()
    or public.is_admin()
    or public.is_task_watcher(id)
  );

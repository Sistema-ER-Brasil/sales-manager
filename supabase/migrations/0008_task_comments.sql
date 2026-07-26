-- Notes/comments thread on each task (ClickUp-style activity notes).
create table if not exists public.task_comments (
  id text primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_idx on public.task_comments(task_id);

alter table public.task_comments enable row level security;

create policy "task_comments_select_via_task" on public.task_comments
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );

create policy "task_comments_insert_via_task" on public.task_comments
  for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );

create policy "task_comments_delete_admin_or_own" on public.task_comments
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter publication supabase_realtime add table public.task_comments;

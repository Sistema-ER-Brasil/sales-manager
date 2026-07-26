-- Adds a draft -> submitted -> approved workflow to sales entries.
-- Regular users can freely edit their own sales while in 'draft'. Once
-- submitted for admin approval, they can no longer edit or delete it;
-- only an admin can then approve it (or edit/delete it directly).
alter table public.sales
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved'));

create index if not exists sales_status_idx on public.sales(status);

drop policy if exists "sales_all_authenticated" on public.sales;

create policy "sales_select_authenticated" on public.sales
  for select to authenticated using (true);

create policy "sales_insert_authenticated" on public.sales
  for insert to authenticated with check (true);

create policy "sales_update_own_draft_or_admin" on public.sales
  for update to authenticated
  using ((created_by_user_id = auth.uid() and status = 'draft') or public.is_admin())
  with check ((created_by_user_id = auth.uid() and status in ('draft', 'submitted')) or public.is_admin());

create policy "sales_delete_own_draft_or_admin" on public.sales
  for delete to authenticated
  using ((created_by_user_id = auth.uid() and status = 'draft') or public.is_admin());

alter table public.companies
  add column if not exists marketplace_ids text[] not null default '{}';

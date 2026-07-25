-- Marketplace Sales Manager — initial schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (1:1 with auth.users, holds app-level role/status)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  assigned_marketplaces text[] not null default '{}',
  avatar text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- BUSINESS TABLES
-- ============================================================
create table if not exists public.companies (
  id text primary key,
  code text not null,
  name text not null,
  cnpj text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  badge_color text not null default '#64748b'
);

create table if not exists public.marketplaces (
  id text primary key,
  name text not null,
  slug text not null,
  color text not null default '#64748b',
  icon_name text not null default 'Store',
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table if not exists public.products (
  id text primary key,
  sku text not null,
  code text,
  ean text,
  name text not null,
  category text,
  brand text,
  supplier text,
  price numeric(14,2) not null default 0,
  avg_price numeric(14,2) not null default 0,
  cost numeric(14,2) not null default 0,
  marketplace_id text references public.marketplaces(id) on delete set null,
  image text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  date date not null,
  marketplace_id text not null references public.marketplaces(id),
  company_id text not null references public.companies(id),
  product_id text references public.products(id) on delete set null,
  product_sku text,
  product_name text not null,
  quantity numeric(14,3) not null,
  total_value numeric(14,2) not null,
  avg_value numeric(14,2) not null,
  notes text,
  created_by_user_id uuid references public.profiles(id),
  created_by_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists sales_date_idx on public.sales(date);
create index if not exists sales_marketplace_idx on public.sales(marketplace_id);
create index if not exists sales_company_idx on public.sales(company_id);

create table if not exists public.goals (
  id text primary key,
  title text not null,
  type text not null check (type in ('marketplace', 'company', 'user', 'product', 'cnpj_marketplace')),
  target_id text not null,
  company_id text references public.companies(id),
  marketplace_id text references public.marketplaces(id),
  target_name text not null,
  period text not null check (period in ('daily', 'monthly')),
  metric_type text check (metric_type in ('revenue', 'quantity')),
  target_value numeric(14,2) not null default 0,
  target_quantity numeric(14,2),
  date date,
  month text
);

create table if not exists public.notifications (
  id text primary key,
  type text not null check (type in ('sale', 'goal_reached', 'record_daily', 'record_monthly', 'system')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  user_id uuid references public.profiles(id),
  user_name text not null,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT')),
  entity text not null check (entity in ('sales', 'products', 'users', 'marketplaces', 'companies', 'goals')),
  details text not null,
  ip text,
  timestamp timestamptz not null default now()
);
create index if not exists audit_logs_timestamp_idx on public.audit_logs(timestamp desc);

create table if not exists public.settings (
  id boolean primary key default true check (id),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  company_name text not null default 'Minha Empresa',
  logo_url text,
  auto_refresh_secs integer not null default 30,
  sound_effects_enabled boolean not null default true
);
insert into public.settings (id) values (true) on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Internal tool: any authenticated user can read/write business
-- data; only admins can manage user profiles.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.marketplaces enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.goals enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated with check (public.is_admin());
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.is_admin());

create policy "companies_all_authenticated" on public.companies
  for all to authenticated using (true) with check (true);
create policy "marketplaces_all_authenticated" on public.marketplaces
  for all to authenticated using (true) with check (true);
create policy "products_all_authenticated" on public.products
  for all to authenticated using (true) with check (true);
create policy "sales_all_authenticated" on public.sales
  for all to authenticated using (true) with check (true);
create policy "goals_all_authenticated" on public.goals
  for all to authenticated using (true) with check (true);
create policy "notifications_all_authenticated" on public.notifications
  for all to authenticated using (true) with check (true);
create policy "audit_logs_select_authenticated" on public.audit_logs
  for select to authenticated using (true);
create policy "audit_logs_insert_authenticated" on public.audit_logs
  for insert to authenticated with check (true);
create policy "settings_all_authenticated" on public.settings
  for all to authenticated using (true) with check (true);

-- ============================================================
-- REALTIME (so multiple screens/TV panel update live)
-- ============================================================
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.notifications;

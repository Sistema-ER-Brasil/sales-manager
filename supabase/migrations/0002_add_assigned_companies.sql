-- Adds a proper column for CNPJs a user is responsible for, replacing the
-- earlier 'cnpj:' prefix packed into assigned_marketplaces.
alter table public.profiles
  add column if not exists assigned_companies text[] not null default '{}';

update public.profiles
set
  assigned_companies = coalesce(
    (select array_agg(substring(x from 6)) from unnest(assigned_marketplaces) as x where x like 'cnpj:%'),
    '{}'
  ),
  assigned_marketplaces = coalesce(
    (select array_agg(x) from unnest(assigned_marketplaces) as x where x not like 'cnpj:%'),
    '{}'
  )
where exists (
  select 1 from unnest(assigned_marketplaces) as x where x like 'cnpj:%'
);

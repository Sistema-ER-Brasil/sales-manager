-- Allows 'tasks' as a valid audit_logs.entity value (task board feature).
alter table public.audit_logs drop constraint if exists audit_logs_entity_check;
alter table public.audit_logs add constraint audit_logs_entity_check
  check (entity in ('sales', 'products', 'users', 'marketplaces', 'companies', 'goals', 'tasks'));

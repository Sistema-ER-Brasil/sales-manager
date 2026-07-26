-- Adds a custom date-range period option to goals (in addition to daily/monthly).
alter table public.goals drop constraint if exists goals_period_check;
alter table public.goals add constraint goals_period_check
  check (period in ('daily', 'monthly', 'range'));

alter table public.goals add column if not exists end_date date;

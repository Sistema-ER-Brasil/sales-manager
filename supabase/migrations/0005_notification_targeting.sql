-- Lets a notification be targeted at a single user (e.g. an admin reminder
-- to a specific seller) instead of always being broadcast to everyone.
-- Null target_user_id preserves the existing global/broadcast behavior.
alter table public.notifications
  add column if not exists target_user_id uuid references public.profiles(id) on delete cascade;

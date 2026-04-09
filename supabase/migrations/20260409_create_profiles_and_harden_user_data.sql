create table if not exists public.profiles (
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  mileage text not null default '',
  goal_event text not null default '',
  pr5k text not null default '',
  prs jsonb not null default '{}'::jsonb,
  race_goals jsonb not null default '[]'::jsonb,
  age text not null default '',
  resting_heart_rate text not null default '',
  max_heart_rate text not null default '',
  image text,
  account_type text not null default 'solo_runner',
  onboarding_complete boolean not null default false,
  runner_level text,
  onboarding_answers jsonb not null default '{}'::jsonb,
  training_days_per_week integer not null default 4,
  notification_preferences jsonb not null default '{"workoutReminders":true,"longRunReminders":true,"weeklyGoalReminders":true,"streakReminders":true,"recoveryReminders":false}'::jsonb,
  theme_mode text not null default 'dark',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists notification_preferences jsonb not null default '{"workoutReminders":true,"longRunReminders":true,"weeklyGoalReminders":true,"streakReminders":true,"recoveryReminders":false}'::jsonb;
alter table public.profiles add column if not exists theme_mode text not null default 'dark';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    execute 'update public.profiles set user_id = id where user_id is null and id is not null';
  end if;
end
$$;

update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and (p.email is null or btrim(p.email) = '');

alter table public.profiles alter column email set not null;

create unique index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

drop policy if exists "Profile images are publicly viewable" on storage.objects;
create policy "Profile images are publicly viewable"
on storage.objects
for select
to public
using (bucket_id = 'profile-images');

drop policy if exists "Users can upload own profile images" on storage.objects;
create policy "Users can upload own profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update own profile images" on storage.objects;
create policy "Users can update own profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

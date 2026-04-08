create table if not exists public.workout_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.engine_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_records_email_idx on public.workout_records (email);
create index if not exists engine_records_email_idx on public.engine_records (email);

alter table public.workout_records enable row level security;
alter table public.engine_records enable row level security;

drop policy if exists "Users can view own workout record" on public.workout_records;
create policy "Users can view own workout record"
on public.workout_records
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout record" on public.workout_records;
create policy "Users can insert own workout record"
on public.workout_records
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout record" on public.workout_records;
create policy "Users can update own workout record"
on public.workout_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own engine record" on public.engine_records;
create policy "Users can view own engine record"
on public.engine_records
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own engine record" on public.engine_records;
create policy "Users can insert own engine record"
on public.engine_records
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own engine record" on public.engine_records;
create policy "Users can update own engine record"
on public.engine_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_user_training_record_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists workout_records_set_updated_at on public.workout_records;
create trigger workout_records_set_updated_at
before update on public.workout_records
for each row
execute function public.set_user_training_record_updated_at();

drop trigger if exists engine_records_set_updated_at on public.engine_records;
create trigger engine_records_set_updated_at
before update on public.engine_records
for each row
execute function public.set_user_training_record_updated_at();

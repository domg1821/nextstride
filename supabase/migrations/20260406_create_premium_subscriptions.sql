create table if not exists public.premium_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan_tier text not null check (plan_tier in ('free', 'pro', 'elite')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  status text not null check (status in ('not_premium', 'upgrade_pending', 'premium_active', 'canceled', 'past_due')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  renewal_date timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists premium_subscriptions_email_idx on public.premium_subscriptions (email);
create index if not exists premium_subscriptions_customer_idx on public.premium_subscriptions (stripe_customer_id);

alter table public.premium_subscriptions enable row level security;

drop policy if exists "Users can view own premium subscription" on public.premium_subscriptions;
create policy "Users can view own premium subscription"
on public.premium_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_premium_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists premium_subscriptions_set_updated_at on public.premium_subscriptions;
create trigger premium_subscriptions_set_updated_at
before update on public.premium_subscriptions
for each row
execute function public.set_premium_subscriptions_updated_at();

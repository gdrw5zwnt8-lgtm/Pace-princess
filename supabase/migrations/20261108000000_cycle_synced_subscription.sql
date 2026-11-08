-- Cycle-Synced Training Subscription.
-- The demo build keeps this state in a signed cookie (see lib/session.ts).
-- When Supabase is connected, these tables replace that cookie one-to-one.

create table if not exists public.cycle_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_period_start date not null,
  cycle_length smallint not null check (cycle_length between 21 and 40),
  period_length smallint not null check (period_length between 2 and 8),
  weekly_runs smallint not null check (weekly_runs between 1 and 7),
  level text not null check (level in ('new', 'regular', 'racer')),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kwop_subscription_id text not null unique,
  kwop_plan_id text not null,
  status text not null check (status in ('active', 'canceled')),
  started_at timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  card_last4 text,
  created_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

create table if not exists public.feature_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  period text not null, -- YYYY-MM
  count integer not null default 0,
  primary key (user_id, feature, period)
);

alter table public.cycle_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.feature_usage enable row level security;

-- Users manage their own cycle profile.
create policy "own profile select" on public.cycle_profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.cycle_profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.cycle_profiles for update using (auth.uid() = user_id);

-- Users can only READ their subscription and usage. Writes happen server-side
-- with the service role after Kwop confirms payment, so the client can't grant itself Pro.
create policy "own subscription select" on public.subscriptions for select using (auth.uid() = user_id);
create policy "own usage select" on public.feature_usage for select using (auth.uid() = user_id);

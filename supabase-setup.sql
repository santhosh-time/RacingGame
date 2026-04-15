create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  racer_name text not null,
  best_score integer not null default 0,
  best_score_vehicle text,
  favorite_vehicle text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists racer_name text;
alter table public.profiles add column if not exists best_score integer not null default 0;
alter table public.profiles add column if not exists best_score_vehicle text;
alter table public.profiles add column if not exists favorite_vehicle text;
alter table public.profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.access_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_status text not null default 'pending',
  amount_paise integer not null default 100,
  currency text not null default 'INR',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  valid_until timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.access_passes add column if not exists user_id uuid;
alter table public.access_passes add column if not exists payment_status text not null default 'pending';
alter table public.access_passes add column if not exists amount_paise integer not null default 100;
alter table public.access_passes add column if not exists currency text not null default 'INR';
alter table public.access_passes add column if not exists provider_order_id text;
alter table public.access_passes add column if not exists provider_payment_id text;
alter table public.access_passes add column if not exists provider_signature text;
alter table public.access_passes add column if not exists valid_until timestamptz;
alter table public.access_passes add column if not exists activated_at timestamptz;
alter table public.access_passes add column if not exists created_at timestamptz not null default timezone('utc', now());
create unique index if not exists access_passes_user_id_key on public.access_passes (user_id);

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  racer_name text not null,
  email text,
  rating integer not null check (rating between 1 and 5),
  feedback_text text not null,
  vehicle_name text,
  best_score integer not null default 0,
  play_mode text not null default 'guest',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.feedback_submissions add column if not exists user_id uuid;
alter table public.feedback_submissions add column if not exists racer_name text;
alter table public.feedback_submissions add column if not exists email text;
alter table public.feedback_submissions add column if not exists rating integer;
alter table public.feedback_submissions add column if not exists feedback_text text;
alter table public.feedback_submissions add column if not exists vehicle_name text;
alter table public.feedback_submissions add column if not exists best_score integer not null default 0;
alter table public.feedback_submissions add column if not exists play_mode text not null default 'guest';
alter table public.feedback_submissions add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.feedback_submissions drop constraint if exists feedback_submissions_rating_check;
alter table public.feedback_submissions add constraint feedback_submissions_rating_check check (rating between 1 and 5);

alter table public.profiles enable row level security;
alter table public.access_passes enable row level security;
alter table public.feedback_submissions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.access_passes to authenticated;

drop policy if exists "users manage own profile" on public.profiles;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
create policy "users read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "users insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users read own access passes" on public.access_passes;
create policy "users read own access passes"
on public.access_passes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users insert own access passes" on public.access_passes;
create policy "users insert own access passes"
on public.access_passes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own access passes" on public.access_passes;
create policy "users update own access passes"
on public.access_passes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists profiles_touch_updated_at on public.profiles;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

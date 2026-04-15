create extension if not exists pgcrypto;

create table if not exists public.racer_profiles (
  id uuid primary key default gen_random_uuid(),
  racer_name text not null unique,
  best_score integer not null default 0,
  favorite_vehicle text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.access_passes (
  id uuid primary key default gen_random_uuid(),
  racer_name text not null,
  payment_status text not null default 'pending',
  amount_paise integer not null default 100,
  valid_until timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.racer_profiles enable row level security;
alter table public.access_passes enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.racer_profiles to anon, authenticated;
grant select, insert, update on public.access_passes to anon, authenticated;

drop policy if exists "public read racer profiles" on public.racer_profiles;
create policy "public read racer profiles"
on public.racer_profiles
for select
using (true);

drop policy if exists "public insert racer profiles" on public.racer_profiles;
create policy "public insert racer profiles"
on public.racer_profiles
for insert
with check (true);

drop policy if exists "public update racer profiles" on public.racer_profiles;
create policy "public update racer profiles"
on public.racer_profiles
for update
using (true)
with check (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists racer_profiles_touch_updated_at on public.racer_profiles;

create trigger racer_profiles_touch_updated_at
before update on public.racer_profiles
for each row
execute function public.touch_updated_at();

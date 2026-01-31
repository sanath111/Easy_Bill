-- 1. PROFILES TABLE (Extends default auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  hotel_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LICENSES TABLE
create table if not exists public.licenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  license_key text unique not null,
  device_id text, -- Null initially, set on first activation
  status text check (status in ('active', 'expired', 'suspended')) default 'active',
  plan_type text default 'standard',
  valid_until timestamp with time zone not null,
  last_check_in timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BACKUPS TABLE (Metadata for files in Storage)
create table if not exists public.backups (
  id uuid default gen_random_uuid() primary key,
  license_id uuid references public.licenses(id) on delete cascade not null,
  file_path text not null,
  file_size_bytes bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES

-- Profiles: Users can only read/update their own profile
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Licenses: Users can read their own licenses
alter table public.licenses enable row level security;

drop policy if exists "Users can view own licenses" on public.licenses;
create policy "Users can view own licenses" on public.licenses
  for select using (auth.uid() = user_id);

-- Backups: Users can view/insert backups linked to their license
alter table public.backups enable row level security;

drop policy if exists "Users can view own backups" on public.backups;
create policy "Users can view own backups" on public.backups
  for select using (
    exists (
      select 1 from public.licenses
      where public.licenses.id = public.backups.license_id
      and public.licenses.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own backups" on public.backups;
create policy "Users can insert own backups" on public.backups
  for insert with check (
    exists (
      select 1 from public.licenses
      where public.licenses.id = public.backups.license_id
      and public.licenses.user_id = auth.uid()
    )
  );

-- FUNCTIONS & TRIGGERS

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generate License Key Function (Call this via RPC or Edge Function after payment)
-- UPDATED: Ensures profile exists before inserting license
create or replace function generate_license_key(user_uuid uuid, duration_days int)
returns text as $$
declare
  new_key text;
  user_email text;
begin
  -- Check if profile exists, if not create it from auth.users
  if not exists (select 1 from public.profiles where id = user_uuid) then
    select email into user_email from auth.users where id = user_uuid;
    if user_email is not null then
        insert into public.profiles (id, email) values (user_uuid, user_email);
    else
        raise exception 'User not found in auth.users';
    end if;
  end if;

  -- Generate a random key (e.g., EB-XXXX-XXXX-XXXX)
  new_key := 'EB-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
             upper(substring(md5(random()::text) from 5 for 4)) || '-' ||
             upper(substring(md5(random()::text) from 9 for 4));

  insert into public.licenses (user_id, license_key, valid_until)
  values (user_uuid, new_key, now() + (duration_days || ' days')::interval);

  return new_key;
end;
$$ language plpgsql security definer;
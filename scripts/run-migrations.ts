import { createClient } from "@/lib/supabase/server"

async function runMigrations() {
  const supabase = await createClient()

  console.log("[v0] Running database migrations...")

  try {
    // Read and execute the SQL migration
    const migrationSQL = `
-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create links table
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  description text,
  categories text[] default '{}',
  icon_url text,
  icon_data_url text,
  status text default 'active' check (status in ('active', 'inactive', 'broken')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.links enable row level security;

-- Profiles RLS policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Links RLS policies
create policy "links_select_active"
  on public.links for select
  using (status = 'active');

create policy "links_select_own"
  on public.links for select
  using (auth.uid() = user_id);

create policy "links_insert_own"
  on public.links for insert
  with check (auth.uid() = user_id);

create policy "links_update_own"
  on public.links for update
  using (auth.uid() = user_id);

create policy "links_delete_own"
  on public.links for delete
  using (auth.uid() = user_id);

create policy "links_select_admin"
  on public.links for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "links_update_admin"
  on public.links for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "links_delete_admin"
  on public.links for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec", { sql: migrationSQL })

    if (error) {
      console.error("[v0] Migration error:", error)
      throw error
    }

    console.log("[v0] Migrations completed successfully!")
  } catch (error) {
    console.error("[v0] Failed to run migrations:", error)
    throw error
  }
}

runMigrations()

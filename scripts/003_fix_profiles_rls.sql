-- ============================================================
-- FIX: Admin can see ALL profiles
-- Run in: Developer Resource Hub Supabase project
-- ============================================================

-- Step 1: Create a helper function (non-recursive, runs as definer)
-- This avoids the infinite loop problem when checking admin inside profiles policy
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Step 2: Drop the old restrictive SELECT policy
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;

-- Step 3: New policy — users see their own row OR admin sees all rows
create policy "profiles_select"
  on public.profiles
  for select
  using (
    auth.uid() = id          -- own profile always visible
    or public.is_admin()     -- admins see everyone
  );

-- ============================================================
-- Verify: Should show the new policy
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
-- ============================================================

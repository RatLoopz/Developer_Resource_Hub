-- Create reels table
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_url text not null,
  thumbnail_url text,
  title text,
  notes text,
  tags text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.reels enable row level security;

-- Reels RLS policies
-- Users can view their own reels
create policy "reels_select_own"
  on public.reels for select
  using (auth.uid() = user_id);

-- Users can insert their own reels
create policy "reels_insert_own"
  on public.reels for insert
  with check (auth.uid() = user_id);

-- Users can update their own reels
create policy "reels_update_own"
  on public.reels for update
  using (auth.uid() = user_id);

-- Users can delete their own reels
create policy "reels_delete_own"
  on public.reels for delete
  using (auth.uid() = user_id);

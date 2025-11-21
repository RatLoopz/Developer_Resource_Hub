-- This script creates an admin user with email admin@gmail.com
-- Note: You need to run this in Supabase SQL Editor after the initial schema is created
-- The password will be set through Supabase Auth, not directly in the database

-- First, create the admin user through Supabase Auth UI or use the following approach:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create user with:
--    Email: admin@gmail.com
--    Password: adminPASS22@
-- 3. Then run this SQL to set the role to admin:

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@gmail.com';

-- Verify the admin user was created
SELECT id, email, role FROM public.profiles WHERE email = 'admin@gmail.com';

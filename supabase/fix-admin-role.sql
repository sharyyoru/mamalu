-- ===========================================
-- FIX ADMIN ROLE
-- ===========================================
-- Run this in Supabase SQL Editor to give wilson@mutant.ae admin access
-- ===========================================

-- Update wilson@mutant.ae to super_admin
UPDATE public.profiles 
SET role = 'super_admin', 
    full_name = 'Wilson Admin'
WHERE email = 'wilson@mutant.ae';

-- Verify the update
SELECT id, email, role, full_name FROM public.profiles WHERE email = 'wilson@mutant.ae';

-- If no rows returned, it means the profile wasn't created.
-- In that case, first get the user ID from auth.users:
-- 
-- SELECT id, email FROM auth.users WHERE email = 'wilson@mutant.ae';
--
-- Then insert the profile manually (replace YOUR_USER_ID with the actual ID):
--
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES ('YOUR_USER_ID', 'wilson@mutant.ae', 'Wilson Admin', 'super_admin');

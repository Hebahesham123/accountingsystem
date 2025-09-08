-- Cleanup Old Users Table Script
-- Run this ONLY after all users have re-registered through the authentication system

-- First, let's check what's in the old users table
SELECT 
    'Old users table contents:' as info,
    COUNT(*) as user_count
FROM public.users;

-- Show the users that need to re-register
SELECT 
    'Users that need to re-register:' as info,
    email,
    name,
    role,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Check if any of these users already exist in auth.users
SELECT 
    'Users already in auth.users:' as info,
    u.email,
    u.name,
    u.role
FROM public.users u
WHERE EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.email = u.email
);

-- Check if any of these users already have profiles
SELECT 
    'Users with existing profiles:' as info,
    u.email,
    u.name,
    u.role
FROM public.users u
WHERE EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.email = u.email
);

-- WARNING: The following commands will permanently delete the old users table
-- Only run these if you're sure all users have re-registered

-- Uncomment the following lines ONLY after confirming all users have re-registered:

-- -- Drop foreign key constraints that reference the old users table
-- ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_created_by_fkey;
-- 
-- -- Drop the old users table
-- DROP TABLE IF EXISTS public.users CASCADE;
-- 
-- -- Recreate the foreign key constraint to reference auth.users instead
-- ALTER TABLE journal_entries 
-- ADD CONSTRAINT journal_entries_created_by_fkey 
-- FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Old users table analysis completed.';
    RAISE NOTICE 'Review the results above before proceeding with cleanup.';
    RAISE NOTICE 'Only run the cleanup commands if all users have re-registered.';
END $$;

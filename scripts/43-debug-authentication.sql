-- Debug Authentication Script
-- Run this to diagnose authentication issues

-- Test 1: Check if user_profiles table exists
SELECT 
    'user_profiles table exists' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_profiles' AND table_schema = 'public'
        ) THEN 'PASS'
        ELSE 'FAIL - Run setup script first'
    END as result;

-- Test 2: Check if RLS is enabled
SELECT 
    'RLS enabled on user_profiles' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'user_profiles' 
            AND n.nspname = 'public'
            AND c.relrowsecurity = true
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 3: Check if trigger exists
SELECT 
    'User creation trigger exists' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created' 
            AND event_object_table = 'users'
            AND event_object_schema = 'auth'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 4: Check auth.users table (this should work)
SELECT 
    'auth.users accessible' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'users' AND table_schema = 'auth'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Show all users in auth.users
SELECT 
    'Users in auth.users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Show all user profiles
SELECT 
    'User profiles:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- Check for users without profiles
SELECT 
    'Users without profiles:' as info,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Check for profiles without auth users
SELECT 
    'Profiles without auth users:' as info,
    up.email,
    up.name,
    up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- Show recent auth events (if available)
SELECT 
    'Recent auth events:' as info,
    event_type,
    created_at
FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 10;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '=== AUTHENTICATION DEBUG RESULTS ===';
    RAISE NOTICE '1. If user_profiles table test FAILS, run: \i scripts/40-fixed-authentication-setup.sql';
    RAISE NOTICE '2. If users exist in auth.users but not in user_profiles, the trigger is not working';
    RAISE NOTICE '3. If email_confirmed_at is NULL, you need to verify your email';
    RAISE NOTICE '4. Check Supabase Dashboard > Authentication > Settings for email confirmation settings';
END $$;

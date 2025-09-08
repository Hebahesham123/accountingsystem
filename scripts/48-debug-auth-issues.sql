-- Debug Authentication Issues Script
-- Run this to diagnose all authentication problems

-- Test 1: Check if authentication tables exist
SELECT 
    'Authentication tables status:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_profiles' AND table_schema = 'public'
        ) THEN 'user_profiles: EXISTS'
        ELSE 'user_profiles: MISSING'
    END as status
UNION ALL
SELECT 
    'auth.users table:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'users' AND table_schema = 'auth'
        ) THEN 'auth.users: EXISTS'
        ELSE 'auth.users: MISSING'
    END as status;

-- Test 2: Check current users and their status
SELECT 
    'Current users in auth.users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMED'
        ELSE 'NOT CONFIRMED'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- Test 3: Check user profiles
SELECT 
    'User profiles:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- Test 4: Check for users without profiles
SELECT 
    'Users without profiles:' as info,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Test 5: Check for profiles without auth users
SELECT 
    'Profiles without auth users:' as info,
    up.email,
    up.name,
    up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- Test 6: Check authentication functions
SELECT 
    'Authentication functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Test 7: Check triggers
SELECT 
    'Authentication triggers:' as info,
    trigger_name,
    event_object_table,
    event_object_schema
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user%'
ORDER BY trigger_name;

-- Test 8: Check RLS policies
SELECT 
    'RLS policies on user_profiles:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '=== AUTHENTICATION DEBUG RESULTS ===';
    RAISE NOTICE '1. If user_profiles table is MISSING, run: \i scripts/46-complete-auth-setup.sql';
    RAISE NOTICE '2. If users exist but no profiles, the trigger is not working';
    RAISE NOTICE '3. If email_confirmed_at is NULL, run: UPDATE auth.users SET email_confirmed_at = NOW();';
    RAISE NOTICE '4. Check Supabase Dashboard > Authentication > Settings for email confirmation settings';
    RAISE NOTICE '5. Make sure Site URL includes: http://localhost:3000';
END $$;

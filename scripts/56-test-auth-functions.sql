-- Test Authentication Functions Script
-- This script tests if the authentication functions are working properly

-- STEP 1: Check if functions exist
SELECT 
    'Checking if functions exist:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_user_profile', 'update_user_profile', 'handle_new_user')
ORDER BY routine_name;

-- STEP 2: Test get_current_user_profile function
DO $$
DECLARE
    test_result record;
BEGIN
    RAISE NOTICE '=== TESTING get_current_user_profile FUNCTION ===';
    
    BEGIN
        SELECT * INTO test_result FROM get_current_user_profile();
        IF test_result IS NULL THEN
            RAISE NOTICE 'get_current_user_profile: Function works but no user logged in';
        ELSE
            RAISE NOTICE 'get_current_user_profile: Function works, user: %', test_result.email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'get_current_user_profile: ERROR - %', SQLERRM;
    END;
END $$;

-- STEP 3: Test update_user_profile function
DO $$
DECLARE
    test_result record;
BEGIN
    RAISE NOTICE '=== TESTING update_user_profile FUNCTION ===';
    
    BEGIN
        SELECT * INTO test_result FROM update_user_profile('Test User', 'https://example.com/avatar.jpg');
        IF test_result IS NULL THEN
            RAISE NOTICE 'update_user_profile: Function works but no user logged in';
        ELSE
            RAISE NOTICE 'update_user_profile: Function works, updated user: %', test_result.email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'update_user_profile: ERROR - %', SQLERRM;
    END;
END $$;

-- STEP 4: Check current users and their status
SELECT 
    'Current users in auth.users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- STEP 5: Check user profiles
SELECT 
    'Current user profiles:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- STEP 6: Check for users without profiles
SELECT 
    'Users without profiles:' as info,
    au.id,
    au.email,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- STEP 7: Check for profiles without users
SELECT 
    'Profiles without users:' as info,
    up.id,
    up.email,
    up.name
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;

-- STEP 8: Test RLS policies
DO $$
DECLARE
    policy_count integer;
BEGIN
    RAISE NOTICE '=== CHECKING RLS POLICIES ===';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles';
    
    RAISE NOTICE 'Number of RLS policies on user_profiles: %', policy_count;
    
    IF policy_count = 0 THEN
        RAISE NOTICE 'WARNING: No RLS policies found on user_profiles table';
    ELSE
        RAISE NOTICE 'RLS policies exist on user_profiles table';
    END IF;
END $$;

-- STEP 9: Show RLS policies
SELECT 
    'RLS Policies on user_profiles:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== AUTHENTICATION FUNCTION TESTS COMPLETE ===';
    RAISE NOTICE 'Check the results above to identify any issues';
END $$;

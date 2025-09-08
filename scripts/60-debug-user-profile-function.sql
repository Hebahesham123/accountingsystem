-- Debug User Profile Function Script
-- This script debugs the get_current_user_profile function

-- STEP 1: Check if function exists
SELECT 
    'Checking get_current_user_profile function:' as info,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_current_user_profile';

-- STEP 2: Check user_profiles table structure
SELECT 
    'user_profiles table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- STEP 3: Check if user_profiles table has data
SELECT 
    'user_profiles data:' as info,
    COUNT(*) as total_profiles
FROM public.user_profiles;

-- STEP 4: Show sample user_profiles data
SELECT 
    'Sample user_profiles data:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
LIMIT 5;

-- STEP 5: Check current auth user
SELECT 
    'Current auth user:' as info,
    auth.uid() as current_user_id;

-- STEP 6: Test the function manually
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
        RAISE NOTICE 'Error details: %', SQLSTATE;
    END;
END $$;

-- STEP 7: Check RLS policies on user_profiles
SELECT 
    'RLS policies on user_profiles:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- STEP 8: Check if RLS is enabled
SELECT 
    'RLS status on user_profiles:' as info,
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class 
WHERE relname = 'user_profiles';

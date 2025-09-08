-- Test Authentication Setup Script
-- Run this after the authentication setup to verify everything is working

-- Test 1: Check if user_profiles table exists and has correct structure
SELECT 
    'user_profiles table structure' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_profiles' AND table_schema = 'public'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 2: Check if RLS is enabled on user_profiles
SELECT 
    'RLS enabled on user_profiles' as test_name,
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

-- Test 3: Check if policies exist
SELECT 
    'RLS policies exist' as test_name,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND schemaname = 'public'
        ) >= 3 THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 4: Check if functions exist
SELECT 
    'Authentication functions exist' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user' 
            AND routine_schema = 'public'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_current_user_profile' 
            AND routine_schema = 'public'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_user_profile' 
            AND routine_schema = 'public'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 5: Check if trigger exists
SELECT 
    'User creation trigger exists' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created' 
            AND event_object_table = 'users'
            AND event_object_schema = 'auth'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 6: Check if indexes exist
SELECT 
    'Performance indexes exist' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'user_profiles' 
            AND indexname = 'idx_user_profiles_email'
        ) AND EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'user_profiles' 
            AND indexname = 'idx_user_profiles_role'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Test 7: Check permissions
SELECT 
    'Permissions granted' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.role_table_grants 
            WHERE table_name = 'user_profiles' 
            AND grantee IN ('anon', 'authenticated')
            AND privilege_type = 'SELECT'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as result;

-- Show current user_profiles table structure
SELECT 
    'Current user_profiles structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show existing policies
SELECT 
    'Current RLS policies:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';

-- Show existing functions
SELECT 
    'Authentication functions:' as info,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Authentication test completed!';
    RAISE NOTICE 'If all tests show PASS, your authentication system is ready to use.';
    RAISE NOTICE 'You can now test user registration and login in your application.';
END $$;

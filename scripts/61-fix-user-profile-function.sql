-- Fix User Profile Function Script
-- This script creates a simpler, more reliable user profile function

-- STEP 1: Drop existing function
DROP FUNCTION IF EXISTS get_current_user_profile();

-- STEP 2: Create a simpler get_current_user_profile function
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Get user profile as JSON
    SELECT to_json(up.*) INTO result
    FROM public.user_profiles up
    WHERE up.id = auth.uid();
    
    RETURN result;
END;
$$;

-- STEP 3: Test the function
DO $$
DECLARE
    test_result json;
BEGIN
    RAISE NOTICE '=== TESTING NEW get_current_user_profile FUNCTION ===';
    
    BEGIN
        SELECT get_current_user_profile() INTO test_result;
        IF test_result IS NULL THEN
            RAISE NOTICE 'get_current_user_profile: Function works but no user logged in';
        ELSE
            RAISE NOTICE 'get_current_user_profile: Function works, result: %', test_result;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'get_current_user_profile: ERROR - %', SQLERRM;
        RAISE NOTICE 'Error details: %', SQLSTATE;
    END;
END $$;

-- STEP 4: Also create a backup function that returns table format
CREATE OR REPLACE FUNCTION get_current_user_profile_table()
RETURNS TABLE (
    id uuid,
    email text,
    name text,
    role text,
    avatar_url text,
    created_at timestamptz,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.name,
        up.role,
        up.avatar_url,
        up.created_at,
        up.updated_at
    FROM public.user_profiles up
    WHERE up.id = auth.uid();
END;
$$;

-- STEP 5: Test the table function
DO $$
DECLARE
    test_result record;
BEGIN
    RAISE NOTICE '=== TESTING get_current_user_profile_table FUNCTION ===';
    
    BEGIN
        SELECT * INTO test_result FROM get_current_user_profile_table();
        IF test_result IS NULL THEN
            RAISE NOTICE 'get_current_user_profile_table: Function works but no user logged in';
        ELSE
            RAISE NOTICE 'get_current_user_profile_table: Function works, user: %', test_result.email;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'get_current_user_profile_table: ERROR - %', SQLERRM;
        RAISE NOTICE 'Error details: %', SQLSTATE;
    END;
END $$;

-- STEP 6: Show current user status
SELECT 
    'Current user status:' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as profiles_count;

-- STEP 7: Show users without profiles
SELECT 
    'Users without profiles:' as info,
    au.id,
    au.email,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- STEP 8: Create profiles for users without profiles
INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    'user' as role,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = au.id
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== USER PROFILE FUNCTION FIXED ===';
    RAISE NOTICE '1. Created simpler JSON-based function';
    RAISE NOTICE '2. Created backup table-based function';
    RAISE NOTICE '3. Created missing user profiles';
    RAISE NOTICE '4. Functions should work without 400 errors';
END $$;

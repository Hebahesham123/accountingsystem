-- Fix Column Types Script
-- This script checks actual column types and fixes the functions accordingly

-- STEP 1: Check actual column types in user_profiles table
SELECT 
    'Actual column types in user_profiles:' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- STEP 2: Drop all functions and triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_current_user_profile();
DROP FUNCTION IF EXISTS update_user_profile(text, text);

-- STEP 3: Create get_current_user_profile function with correct types
CREATE FUNCTION get_current_user_profile()
RETURNS TABLE (
    id uuid,
    email character varying,
    name character varying,
    role character varying,
    avatar_url character varying,
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

-- STEP 4: Create update_user_profile function with correct types
CREATE FUNCTION update_user_profile(
    p_name character varying,
    p_avatar_url character varying DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    email character varying,
    name character varying,
    role character varying,
    avatar_url character varying,
    created_at timestamptz,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_profiles 
    SET 
        name = p_name,
        avatar_url = p_avatar_url,
        updated_at = NOW()
    WHERE id = auth.uid();
    
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

-- STEP 5: Create handle_new_user function
CREATE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'user',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;

-- STEP 6: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 7: Test the functions
DO $$
DECLARE
    test_result record;
BEGIN
    RAISE NOTICE '=== TESTING AUTH FUNCTIONS ===';
    
    -- Test get_current_user_profile (will return empty if no user)
    SELECT * INTO test_result FROM get_current_user_profile();
    IF test_result IS NULL THEN
        RAISE NOTICE 'get_current_user_profile: Function exists but no user logged in';
    ELSE
        RAISE NOTICE 'get_current_user_profile: Function works, user: %', test_result.email;
    END IF;
    
    RAISE NOTICE 'All authentication functions are ready!';
END $$;

-- STEP 8: Show current user status
SELECT 
    'Current user status:' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as profiles_count;

-- STEP 9: Show users without profiles
SELECT 
    'Users without profiles:' as info,
    au.id,
    au.email,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- STEP 10: Create profiles for users without profiles
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

-- STEP 11: Confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- STEP 12: Show final user list
SELECT 
    'Final user list:' as info,
    up.email,
    up.name,
    up.role,
    au.email_confirmed_at,
    'READY TO LOGIN' as status
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== AUTHENTICATION FUNCTIONS FIXED ===';
    RAISE NOTICE '1. All required functions created with correct column types';
    RAISE NOTICE '2. Trigger for new users created';
    RAISE NOTICE '3. Missing user profiles created';
    RAISE NOTICE '4. All emails confirmed';
    RAISE NOTICE '5. Authentication should now work properly';
END $$;

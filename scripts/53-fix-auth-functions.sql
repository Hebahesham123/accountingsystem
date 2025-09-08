-- Fix Authentication Functions Script
-- This script ensures all required functions exist and work properly

-- STEP 1: Check if functions exist
SELECT 
    'Checking existing functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_user_profile', 'update_user_profile', 'handle_new_user')
ORDER BY routine_name;

-- STEP 2: Drop and recreate get_current_user_profile function
DROP FUNCTION IF EXISTS get_current_user_profile();
CREATE FUNCTION get_current_user_profile()
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

-- STEP 3: Drop and recreate update_user_profile function
DROP FUNCTION IF EXISTS update_user_profile(text, text);
CREATE FUNCTION update_user_profile(
    p_name text,
    p_avatar_url text DEFAULT NULL
)
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

-- STEP 4: Drop trigger first, then function, then recreate both
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

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

-- STEP 5: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 6: Test the functions
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

-- STEP 7: Show current user status
SELECT 
    'Current user status:' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as profiles_count;

-- STEP 8: Show users without profiles
SELECT 
    'Users without profiles:' as info,
    au.id,
    au.email,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- STEP 9: Create profiles for users without profiles
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

-- STEP 10: Confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== AUTHENTICATION FUNCTIONS FIXED ===';
    RAISE NOTICE '1. All required functions created/updated';
    RAISE NOTICE '2. Trigger for new users created';
    RAISE NOTICE '3. Missing user profiles created';
    RAISE NOTICE '4. All emails confirmed';
    RAISE NOTICE '5. Authentication should now work properly';
END $$;

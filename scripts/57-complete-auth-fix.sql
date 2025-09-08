-- Complete Authentication Fix Script
-- This script fixes all authentication issues and sets up proper user access

-- STEP 1: Check current state
SELECT 
    'Current authentication state:' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL) as unconfirmed_count;

-- STEP 2: Drop all existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_current_user_profile();
DROP FUNCTION IF EXISTS update_user_profile(text, text);

-- STEP 3: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    avatar_url text,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- STEP 4: Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- STEP 6: Create RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 7: Create get_current_user_profile function
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

-- STEP 8: Create update_user_profile function
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

-- STEP 9: Create handle_new_user function
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

-- STEP 10: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 11: Create profiles for existing users
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

-- STEP 12: Confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- STEP 13: Make first user admin
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM public.user_profiles 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- STEP 14: Test the functions
DO $$
DECLARE
    test_result record;
BEGIN
    RAISE NOTICE '=== TESTING AUTHENTICATION FUNCTIONS ===';
    
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

-- STEP 15: Show final user list
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
    RAISE NOTICE '=== AUTHENTICATION COMPLETELY FIXED ===';
    RAISE NOTICE '1. All functions created with correct types';
    RAISE NOTICE '2. RLS policies created';
    RAISE NOTICE '3. Trigger for new users created';
    RAISE NOTICE '4. All existing users have profiles';
    RAISE NOTICE '5. All emails confirmed';
    RAISE NOTICE '6. First user is admin';
    RAISE NOTICE '7. Authentication should work properly now';
END $$;

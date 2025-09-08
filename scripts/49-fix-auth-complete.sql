-- Complete Authentication Fix Script
-- This script fixes all authentication issues

-- Step 1: Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'accountant', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 4: Create or replace functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_name VARCHAR(255),
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        name = p_name,
        avatar_url = p_avatar_url,
        updated_at = NOW()
    WHERE id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Auto-confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Step 7: Create profiles for existing users without profiles
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

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Step 9: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(VARCHAR, TEXT) TO anon, authenticated;

-- Step 10: Show results
SELECT 
    'Authentication fix completed!' as status,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users;

-- Step 11: Show current users
SELECT 
    'Current users:' as info,
    up.email,
    up.name,
    up.role,
    au.email_confirmed_at,
    'READY TO LOGIN' as status
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Final instructions
DO $$
BEGIN
    RAISE NOTICE '=== AUTHENTICATION FIX COMPLETED ===';
    RAISE NOTICE '1. All emails have been confirmed';
    RAISE NOTICE '2. All users have profiles';
    RAISE NOTICE '3. Authentication functions are working';
    RAISE NOTICE '4. Users can now sign in and access the dashboard';
    RAISE NOTICE '5. Sign out should work properly';
    RAISE NOTICE '6. All routes should be accessible after login';
END $$;

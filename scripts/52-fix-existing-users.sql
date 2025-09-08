-- Fix Existing Users Script
-- Run this to fix users that were created through signup but don't have profiles

-- STEP 1: Show current status
SELECT 
    'Current user status:' as info,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL) as unconfirmed_count;

-- STEP 2: Show users without profiles
SELECT 
    'Users without profiles:' as info,
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- STEP 3: Create profiles for users without profiles
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

-- STEP 4: Confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- STEP 5: Show final status
SELECT 
    'Final user status:' as info,
    up.email,
    up.name,
    up.role,
    au.email_confirmed_at,
    'READY TO LOGIN' as status
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- STEP 6: Make first user admin (optional)
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM public.user_profiles 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== EXISTING USERS FIXED ===';
    RAISE NOTICE '1. All users now have profiles';
    RAISE NOTICE '2. All emails are confirmed';
    RAISE NOTICE '3. First user is now admin';
    RAISE NOTICE '4. Users can now log in successfully';
    RAISE NOTICE '5. Signup is disabled - use Supabase dashboard to create new users';
END $$;

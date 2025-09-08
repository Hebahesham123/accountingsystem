-- Manual User Management Script
-- Use this to create and manage users manually through Supabase dashboard

-- STEP 1: Check existing users
SELECT 
    'Existing users in auth.users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- STEP 2: Check existing user profiles
SELECT 
    'Existing user profiles:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC;

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

-- STEP 5: Show final user list
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

-- Instructions for manual user creation
DO $$
BEGIN
    RAISE NOTICE '=== MANUAL USER CREATION INSTRUCTIONS ===';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. Click "Add user" button';
    RAISE NOTICE '3. Enter email and password';
    RAISE NOTICE '4. Click "Create user"';
    RAISE NOTICE '5. The user profile will be created automatically';
    RAISE NOTICE '6. To make a user admin, run:';
    RAISE NOTICE '   UPDATE public.user_profiles SET role = ''admin'' WHERE email = ''user@example.com'';';
END $$;

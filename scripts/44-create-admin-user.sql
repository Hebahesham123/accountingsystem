-- Create Admin User Script
-- Use this to manually create admin users and set roles

-- Step 1: Check existing users
SELECT 
    'Existing users in auth.users:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Check existing user profiles
SELECT 
    'Existing user profiles:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- Step 3: Create admin user profile (replace with actual user ID and details)
-- First, get the user ID from auth.users for the email you want to make admin
-- Then run this command:

-- Example: Make user with email 'admin@example.com' an admin
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users

/*
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Or if the user doesn't have a profile yet, create one:
INSERT INTO public.user_profiles (id, email, name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    'admin' as role
FROM auth.users au
WHERE au.email = 'admin@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.email = au.email
);
*/

-- Step 4: Verify the admin user was created/updated
SELECT 
    'Admin users:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
WHERE role = 'admin';

-- Step 5: Show all user roles
SELECT 
    'All user roles:' as info,
    role,
    COUNT(*) as count
FROM public.user_profiles
GROUP BY role
ORDER BY role;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '=== ADMIN USER CREATION INSTRUCTIONS ===';
    RAISE NOTICE '1. First, sign up a user through the application';
    RAISE NOTICE '2. Note their email address';
    RAISE NOTICE '3. Run the UPDATE command above with their email';
    RAISE NOTICE '4. Or use the INSERT command if they dont have a profile yet';
    RAISE NOTICE '5. The user will now have admin privileges';
END $$;

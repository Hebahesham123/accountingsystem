-- Step-by-Step Authentication Troubleshooting
-- Run each section one by one to identify the exact issue

-- STEP 1: Check if basic tables exist
SELECT 'STEP 1: Checking basic tables' as step;

SELECT 
    'auth.users table:' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'users' AND table_schema = 'auth'
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status;

SELECT 
    'public.user_profiles table:' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_profiles' AND table_schema = 'public'
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status;

-- STEP 2: Check if you have any users
SELECT 'STEP 2: Checking users' as step;

SELECT 
    'Users in auth.users:' as info,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'Users in user_profiles:' as info,
    COUNT(*) as count
FROM public.user_profiles;

-- STEP 3: Check user details
SELECT 'STEP 3: Checking user details' as step;

SELECT 
    'auth.users details:' as info,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

SELECT 
    'user_profiles details:' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- STEP 4: Check email confirmation status
SELECT 'STEP 4: Checking email confirmation' as step;

SELECT 
    'Email confirmation status:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- STEP 5: Check functions
SELECT 'STEP 5: Checking functions' as step;

SELECT 
    'Authentication functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- STEP 6: Check triggers
SELECT 'STEP 6: Checking triggers' as step;

SELECT 
    'Authentication triggers:' as info,
    trigger_name,
    event_object_table,
    event_object_schema
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user%'
ORDER BY trigger_name;

-- STEP 7: Check RLS policies
SELECT 'STEP 7: Checking RLS policies' as step;

SELECT 
    'RLS policies:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';

-- STEP 8: Test the get_current_user_profile function
SELECT 'STEP 8: Testing functions' as step;

-- This will only work if you're authenticated
SELECT 'Testing get_current_user_profile function...' as info;

-- STEP 9: Check permissions
SELECT 'STEP 9: Checking permissions' as step;

SELECT 
    'Permissions on user_profiles:' as info,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '=== TROUBLESHOOTING INSTRUCTIONS ===';
    RAISE NOTICE '1. Run each step above one by one';
    RAISE NOTICE '2. Note which steps show MISSING or errors';
    RAISE NOTICE '3. If auth.users is MISSING, check Supabase connection';
    RAISE NOTICE '4. If user_profiles is MISSING, run the setup script';
    RAISE NOTICE '5. If no users exist, create a test user';
    RAISE NOTICE '6. If functions are MISSING, run the complete fix script';
    RAISE NOTICE '7. Check the results and report back what you find';
END $$;

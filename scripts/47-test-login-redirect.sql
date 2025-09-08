-- Test Login Redirect Script
-- This script verifies that the authentication system is properly configured

-- Check if user_profiles table exists and has data
SELECT 
    'Authentication system status:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'user_profiles' AND table_schema = 'public'
        ) THEN 'READY'
        ELSE 'NOT SETUP'
    END as status;

-- Show current users and their roles
SELECT 
    'Current users:' as info,
    up.email,
    up.name,
    up.role,
    au.email_confirmed_at,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'CAN LOGIN'
        ELSE 'NEEDS EMAIL CONFIRMATION'
    END as login_status
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Check if any users need email confirmation
SELECT 
    'Users needing email confirmation:' as info,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- Show authentication functions
SELECT 
    'Authentication functions:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Instructions for testing
DO $$
BEGIN
    RAISE NOTICE '=== LOGIN REDIRECT TEST INSTRUCTIONS ===';
    RAISE NOTICE '1. Go to: http://localhost:3000/auth/login';
    RAISE NOTICE '2. Sign in with your credentials';
    RAISE NOTICE '3. You should be redirected to: http://localhost:3000/ (dashboard)';
    RAISE NOTICE '4. The dashboard should show: "Welcome back, [Your Name]!"';
    RAISE NOTICE '5. You should see all navigation menu items';
    RAISE NOTICE '6. If you try to go to /auth/login while logged in, you should be redirected to dashboard';
END $$;

-- Auto-Confirm All Emails Script
-- This script confirms all user emails so they can log in immediately

-- Step 1: Show current email confirmation status
SELECT 
    'Current email confirmation status:' as info,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
        ELSE 'CONFIRMED'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Auto-confirm all emails
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Step 3: Verify all emails are now confirmed
SELECT 
    'After auto-confirmation:' as info,
    email,
    email_confirmed_at,
    'CONFIRMED' as status
FROM auth.users
ORDER BY created_at DESC;

-- Step 4: Show user profiles
SELECT 
    'User profiles:' as info,
    up.email,
    up.name,
    up.role,
    au.email_confirmed_at
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== EMAIL CONFIRMATION COMPLETED ===';
    RAISE NOTICE 'All user emails have been confirmed.';
    RAISE NOTICE 'Users can now log in immediately without email verification.';
    RAISE NOTICE 'To disable email confirmation permanently:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE '2. Turn OFF "Enable email confirmations"';
    RAISE NOTICE '3. Save the settings';
END $$;

-- Domain Configuration Script for Accounting System
-- This script helps configure Supabase for domain deployment

-- Check current authentication settings
DO $$
BEGIN
    RAISE NOTICE '=== DOMAIN CONFIGURATION CHECK ===';
    RAISE NOTICE 'Current time: %', NOW();
    RAISE NOTICE '';
    
    -- Check if user_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE '✓ user_profiles table exists';
    ELSE
        RAISE NOTICE '✗ user_profiles table missing - run authentication setup first';
    END IF;
    
    -- Check if auth functions exist
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_current_user_profile') THEN
        RAISE NOTICE '✓ get_current_user_profile function exists';
    ELSE
        RAISE NOTICE '✗ get_current_user_profile function missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DOMAIN DEPLOYMENT REQUIREMENTS ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. SUPABASE DASHBOARD CONFIGURATION:';
    RAISE NOTICE '   - Go to Authentication > Settings';
    RAISE NOTICE '   - Set Site URL to your domain (e.g., https://yourdomain.com)';
    RAISE NOTICE '   - Add redirect URLs:';
    RAISE NOTICE '     * https://yourdomain.com/auth/verify-email';
    RAISE NOTICE '     * https://yourdomain.com/auth/callback';
    RAISE NOTICE '     * https://yourdomain.com/auth/reset-password';
    RAISE NOTICE '';
    RAISE NOTICE '2. ENVIRONMENT VARIABLES:';
    RAISE NOTICE '   Create .env.local file with:';
    RAISE NOTICE '   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co';
    RAISE NOTICE '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key';
    RAISE NOTICE '';
    RAISE NOTICE '3. CORS CONFIGURATION:';
    RAISE NOTICE '   - Add your domain to allowed origins';
    RAISE NOTICE '   - Enable CORS for your domain';
    RAISE NOTICE '';
    RAISE NOTICE '4. SSL/HTTPS:';
    RAISE NOTICE '   - Ensure your domain uses HTTPS';
    RAISE NOTICE '   - Valid SSL certificate required';
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING STEPS ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Test authentication from your domain';
    RAISE NOTICE '2. Check browser console for errors';
    RAISE NOTICE '3. Verify Supabase connection';
    RAISE NOTICE '4. Test all features work correctly';
    RAISE NOTICE '';
    RAISE NOTICE '=== COMMON ISSUES ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Issue: "Invalid redirect URL"';
    RAISE NOTICE 'Solution: Add your domain to Supabase redirect URLs';
    RAISE NOTICE '';
    RAISE NOTICE 'Issue: "CORS error"';
    RAISE NOTICE 'Solution: Configure CORS in Supabase settings';
    RAISE NOTICE '';
    RAISE NOTICE 'Issue: "Authentication not working"';
    RAISE NOTICE 'Solution: Check Site URL configuration';
    RAISE NOTICE '';
    RAISE NOTICE 'Issue: "Session not persisting"';
    RAISE NOTICE 'Solution: Verify cookie domain settings';
    RAISE NOTICE '';
    RAISE NOTICE '=== DEBUGGING QUERIES ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Check user profiles:';
    RAISE NOTICE 'SELECT COUNT(*) FROM user_profiles;';
    RAISE NOTICE '';
    RAISE NOTICE 'Check auth functions:';
    RAISE NOTICE 'SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE ''%user%'';';
    RAISE NOTICE '';
    RAISE NOTICE 'Check recent users:';
    RAISE NOTICE 'SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;';
    RAISE NOTICE '';
    RAISE NOTICE '=== CONFIGURATION COMPLETE ===';
    RAISE NOTICE 'Follow the steps above to configure your domain deployment.';
    RAISE NOTICE 'If issues persist, check Supabase logs and browser console.';
END $$;

-- Test authentication functions
DO $$
DECLARE
    test_result RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING AUTHENTICATION FUNCTIONS ===';
    
    -- Test get_current_user_profile function
    BEGIN
        SELECT * INTO test_result FROM get_current_user_profile();
        RAISE NOTICE '✓ get_current_user_profile function works';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '✗ get_current_user_profile function error: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DOMAIN CONFIGURATION SCRIPT COMPLETE ===';
END $$;


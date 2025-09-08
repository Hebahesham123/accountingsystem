-- Environment Setup Verification Script
-- This script helps verify that the Supabase connection is working

-- Test basic connection
SELECT 'Environment Test: Basic Connection' as test_name, NOW() as current_time;

-- Test if we can access the main tables
SELECT 'Environment Test: Table Access' as test_name;

-- Test account_types table access
SELECT 
    'account_types' as table_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'ACCESSIBLE'
        ELSE 'EMPTY OR INACCESSIBLE'
    END as status
FROM account_types;

-- Test accounts table access
SELECT 
    'accounts' as table_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'ACCESSIBLE'
        ELSE 'EMPTY OR INACCESSIBLE'
    END as status
FROM accounts;

-- Test if we can perform basic operations
SELECT 'Environment Test: Basic Operations' as test_name;

-- Test SELECT operation
SELECT 
    'SELECT' as operation,
    CASE 
        WHEN COUNT(*) > 0 THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as status
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true;

-- Test if functions are accessible
SELECT 'Environment Test: Function Access' as test_name;

-- Test if we can call the trial balance function
SELECT 
    'get_trial_balance' as function_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'ACCESSIBLE'
        ELSE 'NOT ACCESSIBLE'
    END as status
FROM get_trial_balance();

-- Test if we can call the account balance function
SELECT 
    'get_account_balance' as function_name,
    CASE 
        WHEN get_account_balance(
            (SELECT id FROM accounts WHERE is_active = true LIMIT 1), 
            CURRENT_DATE
        ) IS NOT NULL THEN 'ACCESSIBLE'
        ELSE 'NOT ACCESSIBLE'
    END as status;

-- Final environment check
SELECT 'Environment Test: Final Check' as test_name;

SELECT 
    'Database Connection' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM accounts LIMIT 1) THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as status

UNION ALL

SELECT 
    'Account Types' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM account_types WHERE is_active = true) >= 5 THEN 'READY'
        ELSE 'NEEDS SETUP'
    END as status

UNION ALL

SELECT 
    'Accounts' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM accounts WHERE is_active = true) >= 10 THEN 'READY'
        ELSE 'NEEDS SETUP'
    END as status

UNION ALL

SELECT 
    'Functions' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM get_trial_balance() LIMIT 1) THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as status;

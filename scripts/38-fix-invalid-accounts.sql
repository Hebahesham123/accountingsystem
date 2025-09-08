-- Fix Invalid/Inactive Accounts Issue
-- This script helps identify and fix account validation issues

-- Step 1: Check all accounts and their status
SELECT 'Checking all accounts and their status...' as test_name;

SELECT 
    id,
    code,
    name,
    account_type_id,
    is_active,
    created_at
FROM accounts
ORDER BY code;

-- Step 2: Check account types
SELECT 'Checking account types...' as test_name;

SELECT 
    id,
    name,
    description
FROM account_types
ORDER BY name;

-- Step 3: Check for accounts without account types
SELECT 'Checking accounts without account types...' as test_name;

SELECT 
    a.id,
    a.code,
    a.name,
    a.account_type_id,
    a.is_active
FROM accounts a
LEFT JOIN account_types at ON a.account_type_id = at.id
WHERE at.id IS NULL;

-- Step 4: Check for inactive accounts
SELECT 'Checking inactive accounts...' as test_name;

SELECT 
    id,
    code,
    name,
    account_type_id,
    is_active
FROM accounts
WHERE is_active = false;

-- Step 5: Check if there are any active accounts at all
SELECT 'Checking for active accounts...' as test_name;

SELECT 
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_accounts,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_accounts
FROM accounts;

-- Step 6: Show sample active accounts for journal entry creation
SELECT 'Sample active accounts for journal entry creation...' as test_name;

SELECT 
    a.id,
    a.code,
    a.name,
    at.name as account_type,
    a.is_active
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code
LIMIT 10;

-- Step 7: Fix inactive accounts (make them active)
SELECT 'Activating all inactive accounts...' as test_name;

UPDATE accounts 
SET is_active = true 
WHERE is_active = false;

-- Step 8: Verify the fix
SELECT 'Verifying accounts are now active...' as test_name;

SELECT 
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_accounts,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_accounts
FROM accounts;

-- Step 9: Create sample accounts if none exist
SELECT 'Checking if we need to create sample accounts...' as test_name;

WITH account_count AS (
    SELECT COUNT(*) as count FROM accounts
)
INSERT INTO accounts (code, name, account_type_id, is_active)
SELECT 
    '1000' as code,
    'Cash' as name,
    (SELECT id FROM account_types WHERE name = 'Asset' LIMIT 1) as account_type_id,
    true as is_active
WHERE (SELECT count FROM account_count) = 0

UNION ALL

SELECT 
    '2000' as code,
    'Accounts Payable' as name,
    (SELECT id FROM account_types WHERE name = 'Liability' LIMIT 1) as account_type_id,
    true as is_active
WHERE (SELECT count FROM account_count) = 0

UNION ALL

SELECT 
    '3000' as code,
    'Owner Equity' as name,
    (SELECT id FROM account_types WHERE name = 'Equity' LIMIT 1) as account_type_id,
    true as is_active
WHERE (SELECT count FROM account_count) = 0

UNION ALL

SELECT 
    '4000' as code,
    'Revenue' as name,
    (SELECT id FROM account_types WHERE name = 'Revenue' LIMIT 1) as account_type_id,
    true as is_active
WHERE (SELECT count FROM account_count) = 0

UNION ALL

SELECT 
    '5000' as code,
    'Expenses' as name,
    (SELECT id FROM account_types WHERE name = 'Expense' LIMIT 1) as account_type_id,
    true as is_active
WHERE (SELECT count FROM account_count) = 0;

-- Step 10: Final verification
SELECT 'Final account verification...' as test_name;

SELECT 
    a.id,
    a.code,
    a.name,
    at.name as account_type,
    a.is_active
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code;

-- Final summary
SELECT 'ACCOUNT VALIDATION FIX COMPLETE' as status;

SELECT 
    'Total Accounts' as metric,
    COUNT(*)::text as value
FROM accounts

UNION ALL

SELECT 
    'Active Accounts' as metric,
    COUNT(CASE WHEN is_active = true THEN 1 END)::text as value
FROM accounts

UNION ALL

SELECT 
    'Account Types' as metric,
    COUNT(*)::text as value
FROM account_types

UNION ALL

SELECT 
    'Ready for Journal Entries' as metric,
    CASE 
        WHEN COUNT(CASE WHEN is_active = true THEN 1 END) > 0 THEN 'YES'
        ELSE 'NO - RUN SCRIPT AGAIN'
    END as value
FROM accounts;

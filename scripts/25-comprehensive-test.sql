-- Comprehensive Test Script for Accounting System
-- This script tests all major functionality to ensure everything works correctly

-- Test 1: Verify database tables exist and have data
SELECT 'Test 1: Database Tables Verification' as test_name;

SELECT 
    'account_types' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END as status
FROM account_types
WHERE is_active = true;

SELECT 
    'accounts' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END as status
FROM accounts
WHERE is_active = true;

SELECT 
    'accounting_periods' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM accounting_periods;

SELECT 
    'opening_balances' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM opening_balances;

-- Test 2: Verify account hierarchy
SELECT 'Test 2: Account Hierarchy Verification' as test_name;

SELECT 
    a.code,
    a.name,
    at.name as account_type,
    a.level,
    a.is_header,
    CASE 
        WHEN a.level = 0 AND a.is_header = true THEN 'PASS'
        WHEN a.level > 0 AND a.parent_account_id IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as hierarchy_status
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code;

-- Test 3: Test account balance calculation function
SELECT 'Test 3: Account Balance Function Test' as test_name;

-- Test balance calculation for a sample account
SELECT 
    a.code,
    a.name,
    get_account_balance(a.id, CURRENT_DATE) as current_balance,
    CASE 
        WHEN get_account_balance(a.id, CURRENT_DATE) IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as function_status
FROM accounts a
WHERE a.is_active = true
AND a.code IN ('1111', '1112', '2110')
LIMIT 3;

-- Test 4: Test trial balance function
SELECT 'Test 4: Trial Balance Function Test' as test_name;

SELECT 
    COUNT(*) as trial_balance_records,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as function_status
FROM get_trial_balance();

-- Test 5: Test balance sheet function
SELECT 'Test 5: Balance Sheet Function Test' as test_name;

SELECT 
    COUNT(*) as balance_sheet_records,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as function_status
FROM get_balance_sheet(CURRENT_DATE);

-- Test 6: Test income statement function
SELECT 'Test 6: Income Statement Function Test' as test_name;

SELECT 
    COUNT(*) as income_statement_records,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as function_status
FROM get_income_statement('2024-01-01', CURRENT_DATE);

-- Test 7: Verify journal entries table structure
SELECT 'Test 7: Journal Entries Table Structure' as test_name;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'journal_entries'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as journal_entries_table_exists;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'journal_entry_lines'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as journal_entry_lines_table_exists;

-- Test 8: Test account type relationships
SELECT 'Test 8: Account Type Relationships' as test_name;

SELECT 
    COUNT(*) as accounts_with_valid_types,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM accounts WHERE is_active = true) THEN 'PASS'
        ELSE 'FAIL'
    END as relationship_status
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true;

-- Test 9: Verify opening balances integrity
SELECT 'Test 9: Opening Balances Integrity' as test_name;

SELECT 
    COUNT(*) as opening_balances_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS'
        ELSE 'FAIL'
    END as integrity_status
FROM opening_balances ob
JOIN accounts a ON ob.account_id = a.id
WHERE a.is_active = true;

-- Test 10: Test account code uniqueness
SELECT 'Test 10: Account Code Uniqueness' as test_name;

SELECT 
    COUNT(*) as total_codes,
    COUNT(DISTINCT code) as unique_codes,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT code) THEN 'PASS'
        ELSE 'FAIL'
    END as uniqueness_status
FROM accounts
WHERE is_active = true;

-- Test 11: Verify account type normal balances
SELECT 'Test 11: Account Type Normal Balances' as test_name;

SELECT 
    name,
    normal_balance,
    CASE 
        WHEN normal_balance IN ('debit', 'credit') THEN 'PASS'
        ELSE 'FAIL'
    END as normal_balance_status
FROM account_types
WHERE is_active = true;

-- Test 12: Test account level consistency
SELECT 'Test 12: Account Level Consistency' as test_name;

SELECT 
    COUNT(*) as accounts_with_consistent_levels,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM accounts WHERE is_active = true) THEN 'PASS'
        ELSE 'FAIL'
    END as consistency_status
FROM accounts a
WHERE is_active = true
AND (
    (level = 0 AND parent_account_id IS NULL) OR
    (level > 0 AND parent_account_id IS NOT NULL)
);

-- Summary Report
SELECT 'SUMMARY REPORT' as report_type;

SELECT 
    'Total Tests Run' as test_category,
    '12' as count,
    'All tests completed' as status;

-- Show any accounts that might have issues
SELECT 'POTENTIAL ISSUES CHECK' as check_type;

-- Check for accounts without proper parent relationships
SELECT 
    'Accounts with level > 0 but no parent' as issue_type,
    COUNT(*) as count
FROM accounts 
WHERE is_active = true 
AND level > 0 
AND parent_account_id IS NULL;

-- Check for accounts with level 0 but have parent
SELECT 
    'Accounts with level 0 but have parent' as issue_type,
    COUNT(*) as count
FROM accounts 
WHERE is_active = true 
AND level = 0 
AND parent_account_id IS NOT NULL;

-- Check for duplicate account codes
SELECT 
    'Duplicate account codes' as issue_type,
    COUNT(*) - COUNT(DISTINCT code) as count
FROM accounts 
WHERE is_active = true;

-- Final verification query
SELECT 
    'FINAL VERIFICATION' as verification_type,
    (SELECT COUNT(*) FROM account_types WHERE is_active = true) as account_types_count,
    (SELECT COUNT(*) FROM accounts WHERE is_active = true) as accounts_count,
    (SELECT COUNT(*) FROM accounting_periods) as periods_count,
    (SELECT COUNT(*) FROM opening_balances) as opening_balances_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM account_types WHERE is_active = true) >= 5
         AND (SELECT COUNT(*) FROM accounts WHERE is_active = true) >= 10
         AND (SELECT COUNT(*) FROM accounting_periods) >= 1
        THEN 'SYSTEM READY'
        ELSE 'SYSTEM NEEDS SETUP'
    END as system_status;

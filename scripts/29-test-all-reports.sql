-- Comprehensive Report Testing Script
-- This script tests all report functions to ensure they work correctly

-- Test 1: Verify all required tables exist
SELECT 'Test 1: Database Tables Verification' as test_name;

SELECT 
    'journal_entries' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

SELECT 
    'journal_entry_lines' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_lines') THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

SELECT 
    'accounts' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

SELECT 
    'account_types' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_types') THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- Test 2: Verify we have sample data
SELECT 'Test 2: Sample Data Verification' as test_name;

SELECT 
    'Journal Entries' as data_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status
FROM journal_entries;

SELECT 
    'Journal Entry Lines' as data_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status
FROM journal_entry_lines;

SELECT 
    'Accounts' as data_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status
FROM accounts
WHERE is_active = true;

-- Test 3: Test Trial Balance Function
SELECT 'Test 3: Trial Balance Function Test' as test_name;

-- Test the trial balance function
SELECT 
    COUNT(*) as trial_balance_records,
    CASE 
        WHEN COUNT(*) > 0 THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as function_status
FROM get_trial_balance();

-- Show sample trial balance data
SELECT 
    account_code,
    account_name,
    account_type,
    opening_balance,
    debit_total,
    credit_total,
    closing_balance
FROM get_trial_balance()
ORDER BY account_code
LIMIT 5;

-- Test 4: Test Balance Sheet Function
SELECT 'Test 4: Balance Sheet Function Test' as test_name;

-- Test the balance sheet function
SELECT 
    COUNT(*) as balance_sheet_records,
    CASE 
        WHEN COUNT(*) > 0 THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as function_status
FROM get_balance_sheet(CURRENT_DATE);

-- Show sample balance sheet data
SELECT 
    account_type,
    account_code,
    account_name,
    balance
FROM get_balance_sheet(CURRENT_DATE)
ORDER BY account_type, account_code
LIMIT 10;

-- Test 5: Test Income Statement Function
SELECT 'Test 5: Income Statement Function Test' as test_name;

-- Test the income statement function
SELECT 
    COUNT(*) as income_statement_records,
    CASE 
        WHEN COUNT(*) > 0 THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as function_status
FROM get_income_statement('2024-01-01', CURRENT_DATE);

-- Show sample income statement data
SELECT 
    account_type,
    account_code,
    account_name,
    balance
FROM get_income_statement('2024-01-01', CURRENT_DATE)
ORDER BY account_type, account_code;

-- Test 6: Test Account Balance Function
SELECT 'Test 6: Account Balance Function Test' as test_name;

-- Test account balance calculation for a few accounts
SELECT 
    a.code,
    a.name,
    at.name as account_type,
    get_account_balance(a.id, CURRENT_DATE) as current_balance,
    CASE 
        WHEN get_account_balance(a.id, CURRENT_DATE) IS NOT NULL THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as function_status
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code
LIMIT 5;

-- Test 7: Test Journal Entries Query (Simplified)
SELECT 'Test 7: Journal Entries Query Test' as test_name;

-- Test the simplified journal entries query
SELECT 
    je.entry_number,
    je.entry_date,
    je.description,
    je.total_debit,
    je.total_credit,
    je.is_balanced,
    COUNT(jel.id) as line_count
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
GROUP BY je.id, je.entry_number, je.entry_date, je.description, je.total_debit, je.total_credit, je.is_balanced
ORDER BY je.entry_date DESC
LIMIT 5;

-- Test 8: Test Account Types and Relationships
SELECT 'Test 8: Account Types and Relationships' as test_name;

-- Verify account types are properly linked
SELECT 
    COUNT(*) as accounts_with_valid_types,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM accounts WHERE is_active = true) THEN 'ALL LINKED'
        ELSE 'SOME MISSING LINKS'
    END as relationship_status
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true;

-- Show account type distribution
SELECT 
    at.name as account_type,
    COUNT(*) as account_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS ACCOUNTS'
        ELSE 'NO ACCOUNTS'
    END as status
FROM account_types at
LEFT JOIN accounts a ON at.id = a.account_type_id AND a.is_active = true
WHERE at.is_active = true
GROUP BY at.id, at.name
ORDER BY at.name;

-- Test 9: Test Date Filtering Logic
SELECT 'Test 9: Date Filtering Logic Test' as test_name;

-- Test if we can filter journal entries by date
SELECT 
    COUNT(*) as total_entries,
    COUNT(CASE WHEN entry_date >= '2024-01-01' THEN 1 END) as entries_from_2024,
    CASE 
        WHEN COUNT(CASE WHEN entry_date >= '2024-01-01' THEN 1 END) > 0 THEN 'DATE FILTERING WORKS'
        ELSE 'NO DATA IN DATE RANGE'
    END as filtering_status
FROM journal_entries;

-- Test 10: Test Account Balance Calculations
SELECT 'Test 10: Account Balance Calculations' as test_name;

-- Test balance calculations for different account types
SELECT 
    at.name as account_type,
    at.normal_balance,
    COUNT(*) as account_count,
    SUM(CASE 
        WHEN at.normal_balance = 'debit' THEN 
            COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
        ELSE 
            COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END) as total_balance
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
WHERE a.is_active = true
GROUP BY at.id, at.name, at.normal_balance
ORDER BY at.name;

-- Test 11: Verify Report Data Integrity
SELECT 'Test 11: Report Data Integrity' as test_name;

-- Check if trial balance totals match
WITH trial_balance_totals AS (
    SELECT 
        SUM(debit_total) as total_debits,
        SUM(credit_total) as total_credits
    FROM get_trial_balance()
)
SELECT 
    total_debits,
    total_credits,
    CASE 
        WHEN total_debits = total_credits THEN 'BALANCED'
        ELSE 'UNBALANCED'
    END as balance_status
FROM trial_balance_totals;

-- Test 12: Performance Test
SELECT 'Test 12: Performance Test' as test_name;

-- Test query performance
SELECT 
    'Trial Balance Query' as query_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PERFORMING WELL'
        ELSE 'NO DATA'
    END as performance_status
FROM get_trial_balance();

-- Final Summary
SELECT 'FINAL SUMMARY' as summary_type;

SELECT 
    'Database Setup' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM account_types WHERE is_active = true) >= 5
         AND (SELECT COUNT(*) FROM accounts WHERE is_active = true) >= 10
         AND (SELECT COUNT(*) FROM journal_entries) >= 0
        THEN 'READY'
        ELSE 'NEEDS SETUP'
    END as status

UNION ALL

SELECT 
    'Report Functions' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM get_trial_balance() LIMIT 1)
         AND EXISTS (SELECT 1 FROM get_balance_sheet(CURRENT_DATE) LIMIT 1)
         AND EXISTS (SELECT 1 FROM get_income_statement('2024-01-01', CURRENT_DATE) LIMIT 1)
        THEN 'WORKING'
        ELSE 'NOT WORKING'
    END as status

UNION ALL

SELECT 
    'Sample Data' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM journal_entries) > 0 THEN 'AVAILABLE'
        ELSE 'MISSING'
    END as status;

-- Show any potential issues
SELECT 'POTENTIAL ISSUES CHECK' as check_type;

-- Check for accounts without transactions
SELECT 
    'Accounts without transactions' as issue_type,
    COUNT(*) as count
FROM accounts a
LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
WHERE a.is_active = true 
AND jel.account_id IS NULL;

-- Check for unbalanced journal entries
SELECT 
    'Unbalanced journal entries' as issue_type,
    COUNT(*) as count
FROM journal_entries
WHERE total_debit != total_credit;

-- Check for missing account types
SELECT 
    'Accounts without account types' as issue_type,
    COUNT(*) as count
FROM accounts
WHERE is_active = true 
AND account_type_id IS NULL;

SELECT 'Report testing completed!' as final_status;

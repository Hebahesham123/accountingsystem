-- Test script for Account Reports functionality
-- This script will help verify that the account reports are working correctly

-- 1. Check if we have accounts
SELECT 'Accounts count:' as info, COUNT(*) as count FROM accounts WHERE is_active = true;

-- 2. Check if we have account types
SELECT 'Account types count:' as info, COUNT(*) as count FROM account_types WHERE is_active = true;

-- 3. Check if we have journal entries
SELECT 'Journal entries count:' as info, COUNT(*) as count FROM journal_entries;

-- 4. Check if we have journal entry lines
SELECT 'Journal entry lines count:' as info, COUNT(*) as count FROM journal_entry_lines;

-- 5. Show sample accounts with their structure
SELECT 
    a.code,
    a.name,
    a.account_type,
    CASE WHEN a.parent_account_id IS NOT NULL THEN 'Sub-account' ELSE 'Parent account' END as account_level,
    pa.code as parent_code,
    pa.name as parent_name
FROM accounts a
LEFT JOIN accounts pa ON a.parent_account_id = pa.id
WHERE a.is_active = true
ORDER BY a.code;

-- 6. Show recent journal entries
SELECT 
    je.entry_number,
    je.entry_date,
    je.description,
    je.total_debit,
    je.total_credit,
    je.is_balanced
FROM journal_entries je
ORDER BY je.entry_date DESC, je.created_at DESC
LIMIT 10;

-- 7. Show sample journal entry lines
SELECT 
    jel.id,
    a.code as account_code,
    a.name as account_name,
    jel.debit_amount,
    jel.credit_amount,
    jel.description,
    je.entry_number,
    je.entry_date
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id
JOIN journal_entries je ON jel.journal_entry_id = je.id
ORDER BY je.entry_date DESC, je.entry_number, jel.line_number
LIMIT 20;

-- 8. Check for any data inconsistencies
SELECT 
    'Unbalanced entries:' as check_type,
    COUNT(*) as count
FROM journal_entries 
WHERE NOT is_balanced;

-- 9. Show account balances (if we had a proper balance calculation function)
-- This would require implementing a proper balance calculation stored procedure
SELECT 
    'Note: Account balances require journal entries to calculate' as info;

-- 10. Recommendations for testing
SELECT 
    'To test account reports:' as recommendation,
    '1. Ensure you have accounts created' as step1,
    '2. Create some journal entries' as step2,
    '3. Check that journal entries are balanced' as step3,
    '4. Verify account types are set correctly' as step4;

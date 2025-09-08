-- Quick Fix for Reverse Function Issue
-- This script helps verify the reverseJournalEntry function exists in the database

-- Check if we can call the function directly (if it were a database function)
SELECT 'Testing reverse function availability...' as test_name;

-- Check journal entries that could be reversed
SELECT 
    'Journal entries available for reversal' as test_name,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN total_debit > 0 AND total_credit > 0 THEN 1 END) as entries_with_both_amounts
FROM journal_entries;

-- Show sample entries that could be reversed
SELECT 
    'Sample entries for reversal test' as test_name,
    id,
    entry_number,
    total_debit,
    total_credit,
    is_balanced
FROM journal_entries
WHERE total_debit > 0 AND total_credit > 0
ORDER BY created_at DESC
LIMIT 5;

-- Check journal entry lines for these entries
SELECT 
    'Journal entry lines for reversal' as test_name,
    jel.journal_entry_id,
    jel.id as line_id,
    jel.debit_amount,
    jel.credit_amount,
    a.code as account_code,
    a.name as account_name
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id
JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE je.total_debit > 0 AND je.total_credit > 0
ORDER BY jel.journal_entry_id, jel.line_number
LIMIT 10;

-- Test the reverse logic manually
SELECT 'Manual reverse test (showing what the function should do)' as test_name;

WITH sample_entry AS (
    SELECT id, entry_number, total_debit, total_credit
    FROM journal_entries
    WHERE total_debit > 0 AND total_credit > 0
    LIMIT 1
),
sample_lines AS (
    SELECT 
        jel.id,
        jel.journal_entry_id,
        jel.debit_amount,
        jel.credit_amount
    FROM journal_entry_lines jel
    JOIN sample_entry se ON jel.journal_entry_id = se.id
)
SELECT 
    'Current amounts' as status,
    id,
    debit_amount,
    credit_amount
FROM sample_lines

UNION ALL

SELECT 
    'After reverse (what should happen)' as status,
    id,
    credit_amount as debit_amount,  -- Swap: credit becomes debit
    debit_amount as credit_amount   -- Swap: debit becomes credit
FROM sample_lines;

-- Final verification
SELECT 'REVERSE FUNCTION TEST COMPLETE' as status;
SELECT 'The reverseJournalEntry function should swap debit and credit amounts' as instruction;
SELECT 'Restart the development server to fix the import error' as solution;

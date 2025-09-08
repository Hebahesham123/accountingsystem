-- Debug Journal Entries Display Issue
-- This script helps identify why journal entries aren't appearing in the list

-- Step 1: Check what journal entries exist
SELECT 'Checking existing journal entries...' as test_name;

SELECT 
    id,
    entry_number,
    entry_date,
    description,
    total_debit,
    total_credit,
    is_balanced,
    created_at
FROM journal_entries
ORDER BY created_at DESC;

-- Step 2: Check the date range being used by the component
SELECT 'Checking date ranges...' as test_name;

-- Current month (what the component uses by default)
SELECT 
    'Current month range' as range_type,
    DATE_TRUNC('month', CURRENT_DATE) as start_date,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as end_date;

-- All time range
SELECT 
    'All time range' as range_type,
    MIN(entry_date) as earliest_entry,
    MAX(entry_date) as latest_entry
FROM journal_entries;

-- Step 3: Check if entries fall within the current month filter
SELECT 'Checking entries within current month...' as test_name;

WITH current_month AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as end_date
)
SELECT 
    je.entry_number,
    je.entry_date,
    je.description,
    CASE 
        WHEN je.entry_date BETWEEN cm.start_date AND cm.end_date THEN 'WITHIN CURRENT MONTH'
        ELSE 'OUTSIDE CURRENT MONTH'
    END as filter_status
FROM journal_entries je
CROSS JOIN current_month cm
ORDER BY je.entry_date DESC;

-- Step 4: Test the getJournalEntries query pattern
SELECT 'Testing journal entries query...' as test_name;

-- Test the query that the component uses (current month)
WITH current_month AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as start_date,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as end_date
)
SELECT 
    je.id,
    je.entry_number,
    je.entry_date,
    je.description,
    je.total_debit,
    je.total_credit,
    je.is_balanced,
    COUNT(jel.id) as line_count
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
CROSS JOIN current_month cm
WHERE je.entry_date BETWEEN cm.start_date AND cm.end_date
GROUP BY je.id, je.entry_number, je.entry_date, je.description, je.total_debit, je.total_credit, je.is_balanced
ORDER BY je.entry_date DESC;

-- Step 5: Test without date filter (all entries)
SELECT 'Testing query without date filter...' as test_name;

SELECT 
    je.id,
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
ORDER BY je.entry_date DESC;

-- Step 6: Check if there are any issues with the journal entry lines
SELECT 'Checking journal entry lines...' as test_name;

SELECT 
    jel.id,
    jel.journal_entry_id,
    jel.account_id,
    jel.description,
    jel.debit_amount,
    jel.credit_amount,
    jel.line_number,
    a.code as account_code,
    a.name as account_name
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
ORDER BY jel.created_at DESC;

-- Step 7: Test the exact query pattern used by getJournalEntries
SELECT 'Testing getJournalEntries query pattern...' as test_name;

-- This mimics what the getJournalEntries function does
SELECT 
    je.*,
    json_agg(
        json_build_object(
            'id', jel.id,
            'journal_entry_id', jel.journal_entry_id,
            'account_id', jel.account_id,
            'description', jel.description,
            'debit_amount', jel.debit_amount,
            'credit_amount', jel.credit_amount,
            'line_number', jel.line_number,
            'accounts', json_build_object(
                'id', a.id,
                'code', a.code,
                'name', a.name,
                'account_types', json_build_object(
                    'name', at.name
                )
            )
        )
    ) as journal_entry_lines
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
LEFT JOIN accounts a ON jel.account_id = a.id
LEFT JOIN account_types at ON a.account_type_id = at.id
GROUP BY je.id
ORDER BY je.entry_date DESC;

-- Step 8: Check for any data issues
SELECT 'Checking for data issues...' as test_name;

-- Check for entries without lines
SELECT 
    'Entries without lines' as issue_type,
    COUNT(*) as count
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
WHERE jel.id IS NULL;

-- Check for lines without accounts
SELECT 
    'Lines without valid accounts' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
WHERE a.id IS NULL;

-- Check for unbalanced entries
SELECT 
    'Unbalanced entries' as issue_type,
    COUNT(*) as count
FROM journal_entries
WHERE total_debit != total_credit;

-- Final summary
SELECT 'JOURNAL ENTRIES DISPLAY DIAGNOSTIC COMPLETE' as status;

SELECT 
    'Total Entries' as metric,
    COUNT(*)::text as value
FROM journal_entries

UNION ALL

SELECT 
    'Entries in Current Month' as metric,
    COUNT(*)::text as value
FROM journal_entries
WHERE entry_date BETWEEN DATE_TRUNC('month', CURRENT_DATE) 
    AND (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')

UNION ALL

SELECT 
    'Entries with Lines' as metric,
    COUNT(DISTINCT je.id)::text as value
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id

UNION ALL

SELECT 
    'Date Range Issue' as metric,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO ENTRIES IN CURRENT MONTH'
        ELSE 'ENTRIES EXIST IN CURRENT MONTH'
    END as value
FROM journal_entries
WHERE entry_date BETWEEN DATE_TRUNC('month', CURRENT_DATE) 
    AND (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

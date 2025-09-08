-- Diagnostic Script for Journal Entry Details Issues
-- This script helps identify what data is missing or incorrect in journal entry details

-- Step 1: Check the structure of journal entries
SELECT 'Checking journal entries structure...' as test_name;

SELECT 
    id,
    entry_number,
    entry_date,
    description,
    reference,
    total_debit,
    total_credit,
    is_balanced,
    created_at,
    updated_at
FROM journal_entries
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check journal entry lines structure
SELECT 'Checking journal entry lines structure...' as test_name;

SELECT 
    jel.id,
    jel.journal_entry_id,
    jel.account_id,
    jel.description,
    jel.debit_amount,
    jel.credit_amount,
    jel.line_number,
    jel.image_data,
    jel.created_at,
    a.code as account_code,
    a.name as account_name,
    at.name as account_type
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
LEFT JOIN account_types at ON a.account_type_id = at.id
ORDER BY jel.created_at DESC
LIMIT 10;

-- Step 3: Check for missing account data
SELECT 'Checking for missing account data...' as test_name;

SELECT 
    'Lines without accounts' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 
    'Lines without account types' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id
LEFT JOIN account_types at ON a.account_type_id = at.id
WHERE at.id IS NULL;

-- Step 4: Check for data inconsistencies
SELECT 'Checking for data inconsistencies...' as test_name;

-- Check if totals match line totals
WITH entry_totals AS (
    SELECT 
        je.id,
        je.total_debit as header_debit,
        je.total_credit as header_credit,
        SUM(jel.debit_amount) as line_debit_total,
        SUM(jel.credit_amount) as line_credit_total
    FROM journal_entries je
    LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    GROUP BY je.id, je.total_debit, je.total_credit
)
SELECT 
    'Entries with mismatched totals' as issue_type,
    COUNT(*) as count
FROM entry_totals
WHERE ABS(header_debit - line_debit_total) > 0.01 
   OR ABS(header_credit - line_credit_total) > 0.01;

-- Step 5: Check for missing journal entry lines
SELECT 'Checking for entries without lines...' as test_name;

SELECT 
    'Entries without lines' as issue_type,
    COUNT(*) as count
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
WHERE jel.id IS NULL;

-- Step 6: Sample complete journal entry with all data
SELECT 'Sample complete journal entry...' as test_name;

WITH sample_entry AS (
    SELECT id, entry_number, entry_date, description, reference, total_debit, total_credit, is_balanced
    FROM journal_entries
    WHERE id IN (
        SELECT journal_entry_id 
        FROM journal_entry_lines 
        GROUP BY journal_entry_id 
        HAVING COUNT(*) > 0
    )
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'Journal Entry Header' as data_type,
    json_build_object(
        'id', se.id,
        'entry_number', se.entry_number,
        'entry_date', se.entry_date,
        'description', se.description,
        'reference', se.reference,
        'total_debit', se.total_debit,
        'total_credit', se.total_credit,
        'is_balanced', se.is_balanced
    ) as data
FROM sample_entry se

UNION ALL

SELECT 
    'Journal Entry Lines' as data_type,
    json_agg(
        json_build_object(
            'id', jel.id,
            'journal_entry_id', jel.journal_entry_id,
            'account_id', jel.account_id,
            'description', jel.description,
            'debit_amount', jel.debit_amount,
            'credit_amount', jel.credit_amount,
            'line_number', jel.line_number,
            'image_data', CASE WHEN jel.image_data IS NOT NULL THEN 'Has image' ELSE 'No image' END,
            'account_code', a.code,
            'account_name', a.name,
            'account_type', at.name
        )
    ) as data
FROM journal_entry_lines jel
JOIN sample_entry se ON jel.journal_entry_id = se.id
LEFT JOIN accounts a ON jel.account_id = a.id
LEFT JOIN account_types at ON a.account_type_id = at.id;

-- Step 7: Check for common data issues
SELECT 'Checking for common data issues...' as test_name;

-- Check for null or empty descriptions
SELECT 
    'Entries with empty descriptions' as issue_type,
    COUNT(*) as count
FROM journal_entries
WHERE description IS NULL OR TRIM(description) = ''

UNION ALL

-- Check for invalid dates
SELECT 
    'Entries with invalid dates' as issue_type,
    COUNT(*) as count
FROM journal_entries
WHERE entry_date IS NULL OR entry_date < '1900-01-01'

UNION ALL

-- Check for negative amounts
SELECT 
    'Lines with negative amounts' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines
WHERE debit_amount < 0 OR credit_amount < 0

UNION ALL

-- Check for zero amounts
SELECT 
    'Lines with zero amounts' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines
WHERE debit_amount = 0 AND credit_amount = 0;

-- Final summary
SELECT 'JOURNAL ENTRY DETAILS DIAGNOSTIC COMPLETE' as status;

SELECT 
    'Total Journal Entries' as metric,
    COUNT(*)::text as value
FROM journal_entries

UNION ALL

SELECT 
    'Total Journal Entry Lines' as metric,
    COUNT(*)::text as value
FROM journal_entry_lines

UNION ALL

SELECT 
    'Entries with Lines' as metric,
    COUNT(DISTINCT journal_entry_id)::text as value
FROM journal_entry_lines

UNION ALL

SELECT 
    'Data Quality Status' as metric,
    CASE 
        WHEN COUNT(*) = 0 THEN 'NO DATA FOUND'
        WHEN COUNT(*) > 0 THEN 'DATA EXISTS - CHECK ABOVE FOR ISSUES'
        ELSE 'UNKNOWN'
    END as value
FROM journal_entries;

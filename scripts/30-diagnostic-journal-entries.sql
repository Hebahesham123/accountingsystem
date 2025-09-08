-- Quick Diagnostic Script for Journal Entries Issues
-- Run this to identify the exact problem

-- Test 1: Check if tables exist
SELECT 'Checking database tables...' as test_name;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') 
        THEN 'journal_entries table EXISTS'
        ELSE 'journal_entries table MISSING'
    END as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_lines') 
        THEN 'journal_entry_lines table EXISTS'
        ELSE 'journal_entry_lines table MISSING'
    END as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') 
        THEN 'accounts table EXISTS'
        ELSE 'accounts table MISSING'
    END as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_types') 
        THEN 'account_types table EXISTS'
        ELSE 'account_types table MISSING'
    END as status;

-- Test 2: Check if we have data
SELECT 'Checking data availability...' as test_name;

SELECT 
    'Journal Entries' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status
FROM journal_entries;

SELECT 
    'Journal Entry Lines' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status
FROM journal_entry_lines;

SELECT 
    'Accounts' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status
FROM accounts
WHERE is_active = true;

-- Test 3: Test basic queries that should work
SELECT 'Testing basic queries...' as test_name;

-- Test simple journal entries query
SELECT 
    'Simple journal entries query' as query_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'WORKS'
        ELSE 'FAILS'
    END as status
FROM journal_entries;

-- Test simple journal entry lines query
SELECT 
    'Simple journal entry lines query' as query_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'WORKS'
        ELSE 'FAILS'
    END as status
FROM journal_entry_lines;

-- Test accounts query
SELECT 
    'Simple accounts query' as query_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'WORKS'
        ELSE 'FAILS'
    END as status
FROM accounts
WHERE is_active = true;

-- Test 4: Test the problematic query pattern
SELECT 'Testing query patterns...' as test_name;

-- Test if we can query journal_entry_lines with accounts
SELECT 
    'Journal entry lines with accounts' as query_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'WORKS'
        ELSE 'FAILS'
    END as status
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id
LIMIT 1;

-- Test 5: Check for any constraint issues
SELECT 'Checking constraints...' as test_name;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('journal_entries', 'journal_entry_lines', 'accounts')
ORDER BY tc.table_name, tc.constraint_name;

-- Test 6: Check for any data integrity issues
SELECT 'Checking data integrity...' as test_name;

-- Check for orphaned journal entry lines
SELECT 
    'Orphaned journal entry lines' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE je.id IS NULL;

-- Check for orphaned account references
SELECT 
    'Orphaned account references' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
WHERE a.id IS NULL;

-- Test 7: Try to create a simple test entry
SELECT 'Testing data creation...' as test_name;

-- Try to insert a test journal entry
INSERT INTO journal_entries (
    entry_number,
    entry_date,
    description,
    total_debit,
    total_credit,
    is_balanced
) VALUES (
    'TEST-' || EXTRACT(EPOCH FROM NOW())::text,
    CURRENT_DATE,
    'Test entry for diagnostics',
    100.00,
    100.00,
    true
) ON CONFLICT (entry_number) DO NOTHING
RETURNING 
    'Test journal entry created' as result,
    id,
    entry_number;

-- Final summary
SELECT 'DIAGNOSTIC SUMMARY' as summary_type;

SELECT 
    'Database Status' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('journal_entries', 'journal_entry_lines', 'accounts', 'account_types')) = 4
        THEN 'ALL TABLES EXIST'
        ELSE 'SOME TABLES MISSING'
    END as status

UNION ALL

SELECT 
    'Data Status' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM journal_entries) > 0
         AND (SELECT COUNT(*) FROM accounts WHERE is_active = true) > 0
        THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status

UNION ALL

SELECT 
    'Query Status' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM journal_entries LIMIT 1)
         AND EXISTS (SELECT 1 FROM journal_entry_lines LIMIT 1)
         AND EXISTS (SELECT 1 FROM accounts WHERE is_active = true LIMIT 1)
        THEN 'QUERIES WORK'
        ELSE 'QUERIES FAIL'
    END as status;

-- Fix Journal Entry Creation Issues
-- This script addresses common problems when creating journal entries

-- Step 1: Check current database state
SELECT 'Checking current database state...' as test_name;

-- Check if we have accounts
SELECT 
    'Accounts available' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'HAS ACCOUNTS'
        ELSE 'NO ACCOUNTS'
    END as status
FROM accounts
WHERE is_active = true;

-- Check if we have journal entries
SELECT 
    'Existing journal entries' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'TABLE EXISTS'
        ELSE 'TABLE MISSING'
    END as status
FROM journal_entries;

-- Step 2: Ensure we have the minimum required accounts
DO $$
BEGIN
    -- Check if we have at least one account of each type
    IF (SELECT COUNT(*) FROM accounts WHERE is_active = true) < 2 THEN
        -- Insert minimum required accounts if they don't exist
        INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
        ('10000000-1000-1000-1000-100000000001', '1000', 'ASSETS', 'All company assets', '11111111-1111-1111-1111-111111111111', NULL, 0, true, true),
        ('10000000-1000-1000-1000-100000000002', '1112', 'Bank Account', 'Primary business bank account', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000001', 1, true, false),
        ('20000000-2000-2000-2000-200000000001', '2000', 'LIABILITIES', 'All company liabilities', '22222222-2222-2222-2222-222222222222', NULL, 0, true, true),
        ('30000000-3000-3000-3000-300000000001', '3000', 'EQUITY', 'Owner''s equity', '33333333-3333-3333-3333-333333333333', NULL, 0, true, true),
        ('30000000-3000-3000-3000-300000000002', '3110', 'Owner''s Capital', 'Initial investment by owner', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000001', 1, true, false),
        ('40000000-4000-4000-4000-400000000001', '4000', 'REVENUE', 'All revenue accounts', '44444444-4444-4444-4444-444444444444', NULL, 0, true, true),
        ('40000000-4000-4000-4000-400000000002', '4100', 'Sales Revenue', 'Revenue from sales', '44444444-4444-4444-4444-444444444444', '40000000-4000-4000-4000-400000000001', 1, true, false),
        ('50000000-5000-5000-5000-500000000001', '5000', 'EXPENSES', 'All expense accounts', '55555555-5555-5555-5555-555555555555', NULL, 0, true, true),
        ('50000000-5000-5000-5000-500000000002', '5110', 'Office Supplies', 'Office supplies and materials', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000001', 1, true, false)
        ON CONFLICT (code) DO NOTHING;
        
        RAISE NOTICE 'Inserted minimum required accounts';
    ELSE
        RAISE NOTICE 'Sufficient accounts already exist';
    END IF;
END $$;

-- Step 3: Test journal entry creation manually
DO $$
DECLARE
    je_id UUID;
    cash_account_id UUID;
    equity_account_id UUID;
    test_entry_number VARCHAR(50);
BEGIN
    -- Get account IDs
    SELECT id INTO cash_account_id FROM accounts WHERE code = '1112' LIMIT 1;
    SELECT id INTO equity_account_id FROM accounts WHERE code = '3110' LIMIT 1;
    
    -- Generate a unique entry number
    test_entry_number := 'TEST-' || EXTRACT(EPOCH FROM NOW())::text;
    
    -- Try to create a test journal entry
    IF cash_account_id IS NOT NULL AND equity_account_id IS NOT NULL THEN
        -- Create journal entry header
        INSERT INTO journal_entries (
            entry_number,
            entry_date,
            description,
            reference,
            total_debit,
            total_credit,
            is_balanced
        ) VALUES (
            test_entry_number,
            CURRENT_DATE,
            'Test journal entry creation',
            'TEST-REF',
            1000.00,
            1000.00,
            true
        ) RETURNING id INTO je_id;
        
        -- Create journal entry lines
        IF je_id IS NOT NULL THEN
            INSERT INTO journal_entry_lines (
                journal_entry_id,
                account_id,
                description,
                debit_amount,
                credit_amount,
                line_number
            ) VALUES 
            (je_id, cash_account_id, 'Test debit entry', 1000.00, 0.00, 1),
            (je_id, equity_account_id, 'Test credit entry', 0.00, 1000.00, 2);
            
            RAISE NOTICE 'Test journal entry created successfully with ID: %', je_id;
        ELSE
            RAISE NOTICE 'Failed to create journal entry header';
        END IF;
    ELSE
        RAISE NOTICE 'Required accounts not found - cannot create test entry';
    END IF;
END $$;

-- Step 4: Check for any constraint violations
SELECT 'Checking for constraint violations...' as test_name;

-- Check for duplicate entry numbers
SELECT 
    'Duplicate entry numbers' as issue_type,
    COUNT(*) as count
FROM (
    SELECT entry_number, COUNT(*) as cnt
    FROM journal_entries
    GROUP BY entry_number
    HAVING COUNT(*) > 1
) duplicates;

-- Check for invalid account references
SELECT 
    'Invalid account references in journal entry lines' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
WHERE a.id IS NULL;

-- Check for invalid journal entry references
SELECT 
    'Invalid journal entry references in lines' as issue_type,
    COUNT(*) as count
FROM journal_entry_lines jel
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE je.id IS NULL;

-- Step 5: Test the entry number generation logic
SELECT 'Testing entry number generation...' as test_name;

-- Show existing entry numbers
SELECT 
    'Existing entry numbers' as info_type,
    entry_number,
    created_at
FROM journal_entries
ORDER BY created_at DESC
LIMIT 5;

-- Test entry number generation logic
WITH last_entry AS (
    SELECT entry_number
    FROM journal_entries
    ORDER BY created_at DESC
    LIMIT 1
),
next_number AS (
    SELECT 
        CASE 
            WHEN entry_number IS NULL THEN 'JE-001'
            WHEN entry_number ~ '^JE-\d+$' THEN 
                'JE-' || LPAD((SUBSTRING(entry_number FROM 'JE-(\d+)')::INT + 1)::TEXT, 3, '0')
            ELSE 'JE-001'
        END as next_entry_number
    FROM last_entry
)
SELECT 
    'Next entry number would be' as info_type,
    next_entry_number
FROM next_number;

-- Step 6: Verify data integrity
SELECT 'Verifying data integrity...' as test_name;

-- Check journal entry balance
SELECT 
    'Unbalanced journal entries' as issue_type,
    COUNT(*) as count
FROM journal_entries
WHERE total_debit != total_credit;

-- Check journal entry lines balance
SELECT 
    'Journal entries with unbalanced lines' as issue_type,
    COUNT(*) as count
FROM (
    SELECT je.id, je.total_debit, je.total_credit,
           SUM(jel.debit_amount) as line_debits,
           SUM(jel.credit_amount) as line_credits
    FROM journal_entries je
    LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
    GROUP BY je.id, je.total_debit, je.total_credit
    HAVING je.total_debit != SUM(jel.debit_amount) 
        OR je.total_credit != SUM(jel.credit_amount)
) unbalanced;

-- Step 7: Show sample data for testing
SELECT 'Sample data for testing...' as test_name;

-- Show available accounts for journal entry creation
SELECT 
    'Available accounts' as data_type,
    a.code,
    a.name,
    at.name as account_type,
    at.normal_balance
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code;

-- Show recent journal entries
SELECT 
    'Recent journal entries' as data_type,
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
ORDER BY je.created_at DESC
LIMIT 5;

-- Final summary
SELECT 'JOURNAL ENTRY CREATION DIAGNOSTIC COMPLETE' as status;

SELECT 
    'Database Status' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM accounts WHERE is_active = true) >= 2
         AND (SELECT COUNT(*) FROM journal_entries) >= 0
        THEN 'READY FOR JOURNAL ENTRIES'
        ELSE 'NEEDS SETUP'
    END as status

UNION ALL

SELECT 
    'Account Status' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM accounts WHERE is_active = true) >= 2
        THEN 'SUFFICIENT ACCOUNTS'
        ELSE 'INSUFFICIENT ACCOUNTS'
    END as status

UNION ALL

SELECT 
    'Constraint Status' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM journal_entry_lines jel LEFT JOIN accounts a ON jel.account_id = a.id WHERE a.id IS NULL) = 0
        THEN 'NO CONSTRAINT VIOLATIONS'
        ELSE 'CONSTRAINT VIOLATIONS FOUND'
    END as status;

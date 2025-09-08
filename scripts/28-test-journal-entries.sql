-- Test Journal Entries Functionality
-- This script creates sample journal entries to test the system

-- First, ensure we have the basic setup
-- Run this only if you haven't run the complete setup script yet

-- Create a sample journal entry
INSERT INTO journal_entries (
    id,
    entry_number,
    entry_date,
    description,
    reference,
    total_debit,
    total_credit,
    is_balanced,
    period_id
) VALUES (
    gen_random_uuid(),
    'JE-001',
    CURRENT_DATE,
    'Initial cash investment',
    'INV-001',
    10000.00,
    10000.00,
    true,
    (SELECT id FROM accounting_periods LIMIT 1)
) ON CONFLICT (entry_number) DO NOTHING;

-- Get the journal entry ID
DO $$
DECLARE
    je_id UUID;
    cash_account_id UUID;
    equity_account_id UUID;
BEGIN
    -- Get the journal entry ID
    SELECT id INTO je_id FROM journal_entries WHERE entry_number = 'JE-001';
    
    -- Get account IDs
    SELECT id INTO cash_account_id FROM accounts WHERE code = '1112' LIMIT 1; -- Bank Account
    SELECT id INTO equity_account_id FROM accounts WHERE code = '3110' LIMIT 1; -- Owner's Capital
    
    -- Create journal entry lines
    IF je_id IS NOT NULL AND cash_account_id IS NOT NULL AND equity_account_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (
            journal_entry_id,
            account_id,
            description,
            debit_amount,
            credit_amount,
            line_number
        ) VALUES 
        (je_id, cash_account_id, 'Cash received from owner investment', 10000.00, 0.00, 1),
        (je_id, equity_account_id, 'Owner capital contribution', 0.00, 10000.00, 2)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created sample journal entry JE-001';
    ELSE
        RAISE NOTICE 'Could not create journal entry - missing accounts or entry';
    END IF;
END $$;

-- Create another sample journal entry
INSERT INTO journal_entries (
    id,
    entry_number,
    entry_date,
    description,
    reference,
    total_debit,
    total_credit,
    is_balanced,
    period_id
) VALUES (
    gen_random_uuid(),
    'JE-002',
    CURRENT_DATE,
    'Office supplies purchase',
    'SUP-001',
    150.00,
    150.00,
    true,
    (SELECT id FROM accounting_periods LIMIT 1)
) ON CONFLICT (entry_number) DO NOTHING;

-- Get the journal entry ID for JE-002
DO $$
DECLARE
    je_id UUID;
    supplies_account_id UUID;
    cash_account_id UUID;
BEGIN
    -- Get the journal entry ID
    SELECT id INTO je_id FROM journal_entries WHERE entry_number = 'JE-002';
    
    -- Get account IDs
    SELECT id INTO supplies_account_id FROM accounts WHERE code = '5110' LIMIT 1; -- Office Supplies
    SELECT id INTO cash_account_id FROM accounts WHERE code = '1112' LIMIT 1; -- Bank Account
    
    -- Create journal entry lines
    IF je_id IS NOT NULL AND supplies_account_id IS NOT NULL AND cash_account_id IS NOT NULL THEN
        INSERT INTO journal_entry_lines (
            journal_entry_id,
            account_id,
            description,
            debit_amount,
            credit_amount,
            line_number
        ) VALUES 
        (je_id, supplies_account_id, 'Office supplies purchased', 150.00, 0.00, 1),
        (je_id, cash_account_id, 'Payment for office supplies', 0.00, 150.00, 2)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created sample journal entry JE-002';
    ELSE
        RAISE NOTICE 'Could not create journal entry JE-002 - missing accounts or entry';
    END IF;
END $$;

-- Test the journal entries query
SELECT 'Testing journal entries query...' as test_status;

-- Test basic query
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
ORDER BY je.entry_date DESC;

-- Test detailed query with account information
SELECT 
    je.entry_number,
    je.entry_date,
    je.description,
    jel.line_number,
    jel.description as line_description,
    jel.debit_amount,
    jel.credit_amount,
    a.code as account_code,
    a.name as account_name,
    at.name as account_type
FROM journal_entries je
JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
JOIN accounts a ON jel.account_id = a.id
JOIN account_types at ON a.account_type_id = at.id
ORDER BY je.entry_date DESC, jel.line_number;

-- Test account balance calculation
SELECT 
    a.code,
    a.name,
    at.name as account_type,
    COALESCE(SUM(CASE WHEN jel.debit_amount > 0 THEN jel.debit_amount ELSE 0 END), 0) as total_debits,
    COALESCE(SUM(CASE WHEN jel.credit_amount > 0 THEN jel.credit_amount ELSE 0 END), 0) as total_credits,
    CASE 
        WHEN at.normal_balance = 'debit' THEN 
            COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
        ELSE 
            COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
    END as current_balance
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
WHERE a.is_active = true
GROUP BY a.id, a.code, a.name, at.name, at.normal_balance
ORDER BY a.code;

SELECT 'Journal entries test completed successfully!' as final_status;

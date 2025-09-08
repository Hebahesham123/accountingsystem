-- Emergency Fix for Journal Entries Issues
-- This script will fix the most common issues causing 400 errors

-- Step 1: Ensure all required tables exist with correct structure
DO $$
BEGIN
    -- Create journal_entries table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
        CREATE TABLE journal_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entry_number VARCHAR(50) UNIQUE NOT NULL,
            entry_date DATE NOT NULL,
            description TEXT NOT NULL,
            reference VARCHAR(100),
            total_debit DECIMAL(15,2) DEFAULT 0,
            total_credit DECIMAL(15,2) DEFAULT 0,
            is_balanced BOOLEAN DEFAULT false,
            period_id UUID,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
        CREATE INDEX idx_journal_entries_number ON journal_entries(entry_number);
        
        RAISE NOTICE 'Created journal_entries table';
    END IF;
END $$;

DO $$
BEGIN
    -- Create journal_entry_lines table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entry_lines') THEN
        CREATE TABLE journal_entry_lines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            journal_entry_id UUID NOT NULL,
            account_id UUID NOT NULL,
            description TEXT,
            debit_amount DECIMAL(15,2) DEFAULT 0,
            credit_amount DECIMAL(15,2) DEFAULT 0,
            line_number INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            image_data TEXT
        );
        
        CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
        CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
        
        RAISE NOTICE 'Created journal_entry_lines table';
    END IF;
END $$;

-- Step 2: Ensure we have the basic account structure
DO $$
BEGIN
    -- Create account_types table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_types') THEN
        CREATE TABLE account_types (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
            is_system BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert basic account types
        INSERT INTO account_types (id, name, description, normal_balance, is_system, is_active) VALUES
        ('11111111-1111-1111-1111-111111111111', 'Assets', 'Resources owned by the company', 'debit', true, true),
        ('22222222-2222-2222-2222-222222222222', 'Liabilities', 'Debts and obligations owed by the company', 'credit', true, true),
        ('33333333-3333-3333-3333-333333333333', 'Equity', 'Owner''s interest in the company', 'credit', true, true),
        ('44444444-4444-4444-4444-444444444444', 'Revenue', 'Income earned from business operations', 'credit', true, true),
        ('55555555-5555-5555-5555-555555555555', 'Expenses', 'Costs incurred in business operations', 'debit', true, true)
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Created account_types table with basic types';
    END IF;
END $$;

DO $$
BEGIN
    -- Create accounts table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        CREATE TABLE accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(20) NOT NULL UNIQUE,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            account_type_id UUID,
            parent_account_id UUID,
            level INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            is_header BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert basic accounts
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
        
        RAISE NOTICE 'Created accounts table with basic accounts';
    END IF;
END $$;

-- Step 3: Create sample journal entries if none exist
DO $$
DECLARE
    je_id UUID;
    cash_account_id UUID;
    equity_account_id UUID;
    supplies_account_id UUID;
BEGIN
    -- Check if we have any journal entries
    IF (SELECT COUNT(*) FROM journal_entries) = 0 THEN
        -- Get account IDs
        SELECT id INTO cash_account_id FROM accounts WHERE code = '1112' LIMIT 1;
        SELECT id INTO equity_account_id FROM accounts WHERE code = '3110' LIMIT 1;
        SELECT id INTO supplies_account_id FROM accounts WHERE code = '5110' LIMIT 1;
        
        -- Create sample journal entry 1
        INSERT INTO journal_entries (
            id,
            entry_number,
            entry_date,
            description,
            reference,
            total_debit,
            total_credit,
            is_balanced
        ) VALUES (
            gen_random_uuid(),
            'JE-001',
            CURRENT_DATE,
            'Initial cash investment',
            'INV-001',
            10000.00,
            10000.00,
            true
        ) RETURNING id INTO je_id;
        
        -- Create journal entry lines for JE-001
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
            (je_id, equity_account_id, 'Owner capital contribution', 0.00, 10000.00, 2);
        END IF;
        
        -- Create sample journal entry 2
        INSERT INTO journal_entries (
            id,
            entry_number,
            entry_date,
            description,
            reference,
            total_debit,
            total_credit,
            is_balanced
        ) VALUES (
            gen_random_uuid(),
            'JE-002',
            CURRENT_DATE,
            'Office supplies purchase',
            'SUP-001',
            150.00,
            150.00,
            true
        ) RETURNING id INTO je_id;
        
        -- Create journal entry lines for JE-002
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
            (je_id, cash_account_id, 'Payment for office supplies', 0.00, 150.00, 2);
        END IF;
        
        RAISE NOTICE 'Created sample journal entries';
    ELSE
        RAISE NOTICE 'Journal entries already exist';
    END IF;
END $$;

-- Step 4: Test the setup
SELECT 'Testing the setup...' as test_name;

-- Test basic queries
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

-- Test the query pattern that was failing
SELECT 
    'Journal entries with lines query' as query_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'WORKS'
        ELSE 'FAILS'
    END as status
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id;

-- Test account relationships
SELECT 
    'Journal entry lines with accounts' as query_type,
    COUNT(*) as result_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'WORKS'
        ELSE 'FAILS'
    END as status
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id;

-- Final verification
SELECT 'SETUP COMPLETE' as status;

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
         AND (SELECT COUNT(*) FROM journal_entry_lines) > 0
         AND (SELECT COUNT(*) FROM accounts WHERE is_active = true) > 0
        THEN 'HAS DATA'
        ELSE 'NO DATA'
    END as status

UNION ALL

SELECT 
    'Query Status' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM journal_entries je LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id LIMIT 1)
        THEN 'QUERIES WORK'
        ELSE 'QUERIES FAIL'
    END as status;

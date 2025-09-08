-- Complete Database Setup Script for Accounting System
-- This script ensures all required tables and functions exist

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS opening_balances CASCADE;
DROP TABLE IF EXISTS accounting_periods CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS account_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit_trail CASCADE;

-- Create users table for authentication and permissions
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'accountant', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_types table
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

-- Create accounts table with hierarchical structure
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    account_type_id UUID REFERENCES account_types(id) ON DELETE RESTRICT,
    parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_header BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounting periods table
CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal entries header table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    is_balanced BOOLEAN DEFAULT false,
    period_id UUID REFERENCES accounting_periods(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal entry lines table
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    line_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_data TEXT -- For storing base64 image data
);

-- Create opening balances table
CREATE TABLE opening_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id),
    period_id UUID REFERENCES accounting_periods(id),
    balance DECIMAL(15,2) DEFAULT 0,
    balance_type VARCHAR(10) CHECK (balance_type IN ('debit', 'credit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, period_id)
);

-- Create audit trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(account_type_id);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_level ON accounts(level);
CREATE INDEX idx_accounts_active ON accounts(is_active);
CREATE INDEX idx_accounts_is_header ON accounts(is_header);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_opening_balances_account ON opening_balances(account_id);
CREATE INDEX idx_opening_balances_period ON opening_balances(period_id);
CREATE INDEX idx_account_types_name ON account_types(name);
CREATE INDEX idx_account_types_active ON account_types(is_active);

-- Insert the 5 basic account types
INSERT INTO account_types (id, name, description, normal_balance, is_system, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Assets', 'Resources owned by the company', 'debit', true, true),
    ('22222222-2222-2222-2222-222222222222', 'Liabilities', 'Debts and obligations owed by the company', 'credit', true, true),
    ('33333333-3333-3333-3333-333333333333', 'Equity', 'Owner''s interest in the company', 'credit', true, true),
    ('44444444-4444-4444-4444-444444444444', 'Revenue', 'Income earned from business operations', 'credit', true, true),
    ('55555555-5555-5555-5555-555555555555', 'Expenses', 'Costs incurred in business operations', 'debit', true, true);

-- Insert main account categories
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('10000000-1000-1000-1000-100000000001', '1000', 'ASSETS', 'All company assets', '11111111-1111-1111-1111-111111111111', NULL, 0, true, true),
    ('20000000-2000-2000-2000-200000000001', '2000', 'LIABILITIES', 'All company liabilities', '22222222-2222-2222-2222-222222222222', NULL, 0, true, true),
    ('30000000-3000-3000-3000-300000000001', '3000', 'EQUITY', 'Owner''s equity', '33333333-3333-3333-3333-333333333333', NULL, 0, true, true),
    ('40000000-4000-4000-4000-400000000001', '4000', 'REVENUE', 'All revenue accounts', '44444444-4444-4444-4444-444444444444', NULL, 0, true, true),
    ('50000000-5000-5000-5000-500000000001', '5000', 'EXPENSES', 'All expense accounts', '55555555-5555-5555-5555-555555555555', NULL, 0, true, true);

-- Insert some basic accounts
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('10000000-1000-1000-1000-100000000002', '1100', 'Current Assets', 'Short-term assets', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000001', 1, true, true),
    ('10000000-1000-1000-1000-100000000003', '1110', 'Cash and Cash Equivalents', 'Cash, bank accounts, and short-term investments', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000002', 2, true, true),
    ('10000000-1000-1000-1000-100000000004', '1111', 'Petty Cash', 'Small cash fund for minor expenses', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000003', 3, true, false),
    ('10000000-1000-1000-1000-100000000005', '1112', 'Bank Account', 'Primary business bank account', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000003', 3, true, false),
    ('10000000-1000-1000-1000-100000000006', '1120', 'Accounts Receivable', 'Money owed by customers', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000002', 2, true, false),
    ('20000000-2000-2000-2000-200000000002', '2100', 'Current Liabilities', 'Short-term debts', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000001', 1, true, true),
    ('20000000-2000-2000-2000-200000000003', '2110', 'Accounts Payable', 'Money owed to suppliers', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000002', 2, true, false),
    ('30000000-3000-3000-3000-300000000002', '3100', 'Owner''s Equity', 'Owner''s investment in the business', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000001', 1, true, true),
    ('30000000-3000-3000-3000-300000000003', '3110', 'Owner''s Capital', 'Initial investment by owner', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000002', 2, true, false),
    ('30000000-3000-3000-3000-300000000004', '3120', 'Retained Earnings', 'Accumulated profits', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000002', 2, true, false),
    ('40000000-4000-4000-4000-400000000002', '4100', 'Sales Revenue', 'Revenue from sales', '44444444-4444-4444-4444-444444444444', '40000000-4000-4000-4000-400000000001', 1, true, false),
    ('50000000-5000-5000-5000-500000000002', '5100', 'Operating Expenses', 'General business expenses', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000001', 1, true, true),
    ('50000000-5000-5000-5000-500000000003', '5110', 'Office Supplies', 'Office supplies and materials', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000002', 2, true, false),
    ('50000000-5000-5000-5000-500000000004', '5120', 'Rent Expense', 'Office rent payments', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000002', 2, true, false);

-- Create a default accounting period (current year)
INSERT INTO accounting_periods (id, name, start_date, end_date, is_locked) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024', '2024-01-01', '2024-12-31', false);

-- Create some sample opening balances
INSERT INTO opening_balances (account_id, period_id, balance, balance_type) VALUES
    ('10000000-1000-1000-1000-100000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 500.00, 'debit'),
    ('10000000-1000-1000-1000-100000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10000.00, 'debit'),
    ('10000000-1000-1000-1000-100000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2500.00, 'debit'),
    ('20000000-2000-2000-2000-200000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1500.00, 'credit'),
    ('30000000-3000-3000-3000-300000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10000.00, 'credit'),
    ('30000000-3000-3000-3000-300000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 500.00, 'credit');

-- Create functions for accounting calculations

-- Function to get trial balance
CREATE OR REPLACE FUNCTION get_trial_balance(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    account_id UUID,
    account_code VARCHAR,
    account_name VARCHAR,
    account_type VARCHAR,
    opening_balance DECIMAL(15,2),
    debit_total DECIMAL(15,2),
    credit_total DECIMAL(15,2),
    closing_balance DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH account_balances AS (
        SELECT 
            a.id as account_id,
            a.code as account_code,
            a.name as account_name,
            at.name as account_type,
            COALESCE(ob.balance, 0) as opening_balance,
            COALESCE(SUM(CASE WHEN je.entry_date BETWEEN COALESCE(start_date, '1900-01-01') AND COALESCE(end_date, CURRENT_DATE) 
                         THEN jel.debit_amount ELSE 0 END), 0) as debit_total,
            COALESCE(SUM(CASE WHEN je.entry_date BETWEEN COALESCE(start_date, '1900-01-01') AND COALESCE(end_date, CURRENT_DATE) 
                         THEN jel.credit_amount ELSE 0 END), 0) as credit_total
        FROM accounts a
        JOIN account_types at ON a.account_type_id = at.id
        LEFT JOIN opening_balances ob ON a.id = ob.account_id
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE a.is_active = true
        GROUP BY a.id, a.code, a.name, at.name, ob.balance
    )
    SELECT 
        ab.account_id,
        ab.account_code,
        ab.account_name,
        ab.account_type,
        ab.opening_balance,
        ab.debit_total,
        ab.credit_total,
        CASE 
            WHEN ab.account_type IN ('Assets', 'Expenses') THEN 
                ab.opening_balance + ab.debit_total - ab.credit_total
            ELSE 
                ab.opening_balance + ab.credit_total - ab.debit_total
        END as closing_balance
    FROM account_balances ab
    ORDER BY ab.account_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get account balance
CREATE OR REPLACE FUNCTION get_account_balance(
    account_id UUID,
    as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    account_type VARCHAR;
    opening_bal DECIMAL(15,2) := 0;
    debit_total DECIMAL(15,2) := 0;
    credit_total DECIMAL(15,2) := 0;
    balance DECIMAL(15,2) := 0;
BEGIN
    -- Get account type
    SELECT at.name INTO account_type
    FROM accounts a
    JOIN account_types at ON a.account_type_id = at.id
    WHERE a.id = account_id;
    
    -- Get opening balance
    SELECT COALESCE(ob.balance, 0) INTO opening_bal
    FROM opening_balances ob
    WHERE ob.account_id = account_id;
    
    -- Get transaction totals
    SELECT 
        COALESCE(SUM(jel.debit_amount), 0),
        COALESCE(SUM(jel.credit_amount), 0)
    INTO debit_total, credit_total
    FROM journal_entry_lines jel
    JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = account_id
    AND je.entry_date <= as_of_date;
    
    -- Calculate balance based on account type
    IF account_type IN ('Assets', 'Expenses') THEN
        balance := opening_bal + debit_total - credit_total;
    ELSE
        balance := opening_bal + credit_total - debit_total;
    END IF;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get balance sheet data
CREATE OR REPLACE FUNCTION get_balance_sheet(as_of_date DATE)
RETURNS TABLE (
    account_type VARCHAR,
    account_code VARCHAR,
    account_name VARCHAR,
    balance DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.name as account_type,
        a.code as account_code,
        a.name as account_name,
        get_account_balance(a.id, as_of_date) as balance
    FROM accounts a
    JOIN account_types at ON a.account_type_id = at.id
    WHERE a.is_active = true
    AND at.name IN ('Assets', 'Liabilities', 'Equity')
    ORDER BY at.name, a.code;
END;
$$ LANGUAGE plpgsql;

-- Function to get income statement data
CREATE OR REPLACE FUNCTION get_income_statement(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    account_type VARCHAR,
    account_code VARCHAR,
    account_name VARCHAR,
    balance DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.name as account_type,
        a.code as account_code,
        a.name as account_name,
        get_account_balance(a.id, end_date) as balance
    FROM accounts a
    JOIN account_types at ON a.account_type_id = at.id
    WHERE a.is_active = true
    AND at.name IN ('Revenue', 'Expenses')
    ORDER BY at.name, a.code;
END;
$$ LANGUAGE plpgsql;

-- Test the setup
SELECT 
    'Database setup completed successfully!' as status,
    (SELECT COUNT(*) FROM account_types WHERE is_active = true) as account_types_count,
    (SELECT COUNT(*) FROM accounts WHERE is_active = true) as accounts_count,
    (SELECT COUNT(*) FROM accounting_periods) as periods_count,
    (SELECT COUNT(*) FROM opening_balances) as opening_balances_count;

-- Test a simple query that should work
SELECT 
    a.code,
    a.name,
    at.name as account_type,
    a.is_header,
    a.level
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code
LIMIT 10;

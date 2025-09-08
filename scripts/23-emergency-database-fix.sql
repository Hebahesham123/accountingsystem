-- Emergency Database Fix Script
-- This script ensures the database has the correct schema

-- Check if we can connect to the database
SELECT 'Database connection test' as test_name, NOW() as current_time;

-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS account_types CASCADE;

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

-- Create accounts table
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

-- Create indexes
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(account_type_id);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_level ON accounts(level);
CREATE INDEX idx_accounts_active ON accounts(is_active);
CREATE INDEX idx_accounts_is_header ON accounts(is_header);

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
    ('20000000-2000-2000-2000-200000000002', '2100', 'Current Liabilities', 'Short-term debts', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000001', 1, true, true),
    ('20000000-2000-2000-2000-200000000003', '2110', 'Accounts Payable', 'Money owed to suppliers', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000002', 2, true, false);

-- Test the setup
SELECT 
    'Setup completed successfully!' as status,
    (SELECT COUNT(*) FROM account_types) as account_types_count,
    (SELECT COUNT(*) FROM accounts) as accounts_count;

-- Test a simple query that should work
SELECT 
    a.code,
    a.name,
    at.name as account_type
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code
LIMIT 5;


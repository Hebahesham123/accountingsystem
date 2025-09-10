-- Fix Chart of Accounts Schema - Migration Script
-- This script fixes the schema mismatch between the database and the code

-- First, let's check what columns exist in the accounts table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;

-- If the accounts table doesn't exist or has the wrong schema, recreate it
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

-- Create accounts table with the correct schema
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

-- Insert main account categories (header accounts)
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('10000000-1000-1000-1000-100000000001', '1000', 'ASSETS', 'All company assets', '11111111-1111-1111-1111-111111111111', NULL, 0, true, true),
    ('20000000-2000-2000-2000-200000000001', '2000', 'LIABILITIES', 'All company liabilities', '22222222-2222-2222-2222-222222222222', NULL, 0, true, true),
    ('30000000-3000-3000-3000-300000000001', '3000', 'EQUITY', 'Owner''s equity', '33333333-3333-3333-3333-333333333333', NULL, 0, true, true),
    ('40000000-4000-4000-4000-400000000001', '4000', 'REVENUE', 'All revenue accounts', '44444444-4444-4444-4444-444444444444', NULL, 0, true, true),
    ('50000000-5000-5000-5000-500000000001', '5000', 'EXPENSES', 'All expense accounts', '55555555-5555-5555-5555-555555555555', NULL, 0, true, true);

-- Insert some basic asset accounts
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('10000000-1000-1000-1000-100000000002', '1100', 'Current Assets', 'Short-term assets', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000001', 1, true, true),
    ('10000000-1000-1000-1000-100000000003', '1110', 'Cash and Cash Equivalents', 'Cash, bank accounts, and short-term investments', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000002', 2, true, true),
    ('10000000-1000-1000-1000-100000000004', '1111', 'Petty Cash', 'Small cash fund for minor expenses', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000003', 3, true, false),
    ('10000000-1000-1000-1000-100000000005', '1112', 'Bank Account', 'Primary business bank account', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000003', 3, true, false),
    ('10000000-1000-1000-1000-100000000006', '1120', 'Accounts Receivable', 'Money owed by customers', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000002', 2, true, false),
    ('10000000-1000-1000-1000-100000000007', '1130', 'Inventory', 'Products held for sale', '11111111-1111-1111-1111-111111111111', '10000000-1000-1000-1000-100000000002', 2, true, false);

-- Insert some basic liability accounts
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('20000000-2000-2000-2000-200000000002', '2100', 'Current Liabilities', 'Short-term debts', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000001', 1, true, true),
    ('20000000-2000-2000-2000-200000000003', '2110', 'Accounts Payable', 'Money owed to suppliers', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000002', 2, true, false),
    ('20000000-2000-2000-2000-200000000004', '2120', 'Accrued Expenses', 'Expenses incurred but not yet paid', '22222222-2222-2222-2222-222222222222', '20000000-2000-2000-2000-200000000002', 2, true, false);

-- Insert some basic equity accounts
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('30000000-3000-3000-3000-300000000002', '3100', 'Owner''s Equity', 'Owner''s investment in the business', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000001', 1, true, true),
    ('30000000-3000-3000-3000-300000000003', '3110', 'Owner''s Capital', 'Initial and additional owner investments', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000002', 2, true, false),
    ('30000000-3000-3000-3000-300000000004', '3120', 'Retained Earnings', 'Accumulated profits', '33333333-3333-3333-3333-333333333333', '30000000-3000-3000-3000-300000000002', 2, true, false);

-- Insert some basic revenue accounts
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('40000000-4000-4000-4000-400000000002', '4100', 'Sales Revenue', 'Income from sales', '44444444-4444-4444-4444-444444444444', '40000000-4000-4000-4000-400000000001', 1, true, true),
    ('40000000-4000-4000-4000-400000000003', '4110', 'Product Sales', 'Revenue from product sales', '44444444-4444-4444-4444-444444444444', '40000000-4000-4000-4000-400000000002', 2, true, false),
    ('40000000-4000-4000-4000-400000000004', '4120', 'Service Revenue', 'Revenue from services', '44444444-4444-4444-4444-444444444444', '40000000-4000-4000-4000-400000000002', 2, true, false);

-- Insert some basic expense accounts
INSERT INTO accounts (id, code, name, description, account_type_id, parent_account_id, level, is_active, is_header) VALUES
    ('50000000-5000-5000-5000-500000000002', '5100', 'Operating Expenses', 'Day-to-day business expenses', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000001', 1, true, true),
    ('50000000-5000-5000-5000-500000000003', '5110', 'Office Supplies', 'Office supplies and materials', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000002', 2, true, false),
    ('50000000-5000-5000-5000-500000000004', '5120', 'Rent Expense', 'Office and facility rent', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000002', 2, true, false),
    ('50000000-5000-5000-5000-500000000005', '5130', 'Utilities', 'Electricity, water, internet, etc.', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000002', 2, true, false),
    ('50000000-5000-5000-5000-500000000006', '5140', 'Salaries and Wages', 'Employee compensation', '55555555-5555-5555-5555-555555555555', '50000000-5000-5000-5000-500000000002', 2, true, false);

-- Create simple function to generate account codes
CREATE OR REPLACE FUNCTION generate_account_code(
    account_type_id UUID,
    parent_account_id UUID DEFAULT NULL
) RETURNS VARCHAR(20) AS $$
DECLARE
    base_code VARCHAR(20);
    next_number INTEGER;
    new_code VARCHAR(20);
BEGIN
    -- Get base code from account type
    CASE 
        WHEN account_type_id = '11111111-1111-1111-1111-111111111111' THEN base_code := '1';
        WHEN account_type_id = '22222222-2222-2222-2222-222222222222' THEN base_code := '2';
        WHEN account_type_id = '33333333-3333-3333-3333-333333333333' THEN base_code := '3';
        WHEN account_type_id = '44444444-4444-4444-4444-444444444444' THEN base_code := '4';
        WHEN account_type_id = '55555555-5555-5555-5555-555555555555' THEN base_code := '5';
        ELSE base_code := '9';
    END CASE;
    
    -- If parent account is provided, use parent's code as base
    IF parent_account_id IS NOT NULL THEN
        SELECT code INTO base_code FROM accounts WHERE id = parent_account_id;
    END IF;
    
    -- Find the next available number
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM LENGTH(base_code) + 1) AS INTEGER)), 0) + 1
    INTO next_number
    FROM accounts 
    WHERE code LIKE base_code || '%' 
    AND LENGTH(code) = LENGTH(base_code) + 2
    AND SUBSTRING(code FROM LENGTH(base_code) + 1) ~ '^[0-9]+$';
    
    -- Generate new code
    new_code := base_code || LPAD(next_number::TEXT, 2, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to update account levels
CREATE OR REPLACE FUNCTION update_account_levels() RETURNS TRIGGER AS $$
BEGIN
    -- Update level based on parent
    IF NEW.parent_account_id IS NULL THEN
        NEW.level := 0;
    ELSE
        SELECT level + 1 INTO NEW.level FROM accounts WHERE id = NEW.parent_account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update levels
CREATE TRIGGER trigger_update_account_levels
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_account_levels();

-- Create function to check if account can be deleted
CREATE OR REPLACE FUNCTION can_delete_account(account_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    has_children BOOLEAN;
    has_transactions BOOLEAN;
BEGIN
    -- Check if account has children
    SELECT EXISTS(SELECT 1 FROM accounts WHERE parent_account_id = account_id AND is_active = true)
    INTO has_children;
    
    -- Check if account has transactions (only if journal_entry_lines table exists)
    BEGIN
        SELECT EXISTS(SELECT 1 FROM journal_entry_lines WHERE account_id = account_id)
        INTO has_transactions;
    EXCEPTION
        WHEN undefined_table THEN
            has_transactions := false;
    END;
    
    -- Can delete if no children and no transactions
    RETURN NOT (has_children OR has_transactions);
END;
$$ LANGUAGE plpgsql;

-- Create function to safely delete account
CREATE OR REPLACE FUNCTION delete_account_safely(account_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if account can be deleted
    IF NOT can_delete_account(account_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Soft delete the account
    UPDATE accounts SET is_active = false WHERE id = account_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get account path
CREATE OR REPLACE FUNCTION get_account_path(account_id UUID) RETURNS TEXT AS $$
DECLARE
    account_record RECORD;
    path_parts TEXT[] := '{}';
    result TEXT;
BEGIN
    -- Get account details
    SELECT * INTO account_record FROM accounts WHERE id = account_id;
    
    IF NOT FOUND THEN
        RETURN '';
    END IF;
    
    -- Build path by traversing up the hierarchy
    WHILE account_record IS NOT NULL LOOP
        path_parts := array_prepend(account_record.name, path_parts);
        
        IF account_record.parent_account_id IS NULL THEN
            EXIT;
        END IF;
        
        SELECT * INTO account_record FROM accounts WHERE id = account_record.parent_account_id;
    END LOOP;
    
    -- Join path parts
    SELECT array_to_string(path_parts, ' > ') INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_types_updated_at
    BEFORE UPDATE ON account_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 
    'Chart of Accounts setup completed successfully!' as status,
    (SELECT COUNT(*) FROM account_types) as account_types_count,
    (SELECT COUNT(*) FROM accounts) as accounts_count,
    (SELECT COUNT(*) FROM accounts WHERE is_header = true) as header_accounts_count;

-- Show the account structure
SELECT 
    a.code,
    a.name,
    at.name as account_type,
    at.normal_balance,
    a.is_header,
    a.level
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
ORDER BY a.code;



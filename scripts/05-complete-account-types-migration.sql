-- Complete Account Types Migration
-- This script creates the account_types table and updates the accounts table to use it

-- Step 1: Create account_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    normal_balance VARCHAR(10) CHECK (normal_balance IN ('debit', 'credit')) NOT NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Insert default system account types
INSERT INTO account_types (name, description, normal_balance, is_system) VALUES 
('Asset', 'Resources owned by the company that have economic value', 'debit', true),
('Liability', 'Debts and obligations owed by the company to external parties', 'credit', true),
('Equity', 'Owner''s interest in the company after deducting liabilities', 'credit', true),
('Revenue', 'Income earned from business operations and other sources', 'credit', true),
('Expense', 'Costs incurred in the process of earning revenue', 'debit', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    normal_balance = EXCLUDED.normal_balance,
    is_system = EXCLUDED.is_system,
    updated_at = NOW();

-- Step 3: Add account_type_id column to accounts table if it doesn't exist
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type_id UUID REFERENCES account_types(id);

-- Step 4: Update existing accounts to reference the new account types
UPDATE accounts SET account_type_id = (
    SELECT id FROM account_types WHERE name = accounts.account_type
) WHERE account_type_id IS NULL;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_type_id ON accounts(account_type_id);
CREATE INDEX IF NOT EXISTS idx_account_types_name ON account_types(name);
CREATE INDEX IF NOT EXISTS idx_account_types_active ON account_types(is_active);

-- Step 6: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to account_types table
DROP TRIGGER IF EXISTS update_account_types_updated_at ON account_types;
CREATE TRIGGER update_account_types_updated_at
    BEFORE UPDATE ON account_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Add some common custom account types that businesses often use
INSERT INTO account_types (name, description, normal_balance, is_system) VALUES 
('Current Asset', 'Assets that are expected to be converted to cash within one year', 'debit', false),
('Fixed Asset', 'Long-term tangible assets used in business operations', 'debit', false),
('Current Liability', 'Debts and obligations due within one year', 'credit', false),
('Long-term Liability', 'Debts and obligations due after one year', 'credit', false),
('Operating Revenue', 'Revenue from primary business operations', 'credit', false),
('Other Revenue', 'Revenue from secondary or non-operating activities', 'credit', false),
('Operating Expense', 'Expenses directly related to business operations', 'debit', false),
('Administrative Expense', 'Expenses related to general administration', 'debit', false)
ON CONFLICT (name) DO NOTHING;

-- Step 8: Create a view for easy account type reporting
CREATE OR REPLACE VIEW account_types_summary AS
SELECT 
    at.id,
    at.name,
    at.description,
    at.normal_balance,
    at.is_system,
    at.is_active,
    COUNT(a.id) as accounts_count,
    at.created_at,
    at.updated_at
FROM account_types at
LEFT JOIN accounts a ON at.id = a.account_type_id AND a.is_active = true
WHERE at.is_active = true
GROUP BY at.id, at.name, at.description, at.normal_balance, at.is_system, at.is_active, at.created_at, at.updated_at
ORDER BY at.is_system DESC, at.name;

-- Step 9: Create function to safely delete account types
CREATE OR REPLACE FUNCTION safe_delete_account_type(type_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    accounts_count INTEGER;
    is_system_type BOOLEAN;
BEGIN
    -- Check if it's a system type
    SELECT is_system INTO is_system_type
    FROM account_types
    WHERE id = type_id;
    
    IF is_system_type THEN
        RAISE EXCEPTION 'Cannot delete system account types';
    END IF;
    
    -- Check if any accounts are using this type
    SELECT COUNT(*) INTO accounts_count
    FROM accounts
    WHERE account_type_id = type_id AND is_active = true;
    
    IF accounts_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete account type that is being used by % active accounts', accounts_count;
    END IF;
    
    -- Safe to delete
    DELETE FROM account_types WHERE id = type_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Add audit trigger for account_types
CREATE TRIGGER account_types_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON account_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Step 11: Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON account_types TO your_app_user;
-- GRANT USAGE ON SEQUENCE account_types_id_seq TO your_app_user;

-- Step 12: Verify the migration
DO $$
DECLARE
    system_types_count INTEGER;
    total_accounts INTEGER;
    linked_accounts INTEGER;
BEGIN
    -- Check system types
    SELECT COUNT(*) INTO system_types_count
    FROM account_types
    WHERE is_system = true;
    
    -- Check account linking
    SELECT COUNT(*) INTO total_accounts
    FROM accounts
    WHERE is_active = true;
    
    SELECT COUNT(*) INTO linked_accounts
    FROM accounts
    WHERE is_active = true AND account_type_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'System account types created: %', system_types_count;
    RAISE NOTICE 'Total active accounts: %', total_accounts;
    RAISE NOTICE 'Accounts linked to types: %', linked_accounts;
    
    IF linked_accounts < total_accounts THEN
        RAISE WARNING 'Some accounts are not linked to account types. Please review.';
    END IF;
END $$;

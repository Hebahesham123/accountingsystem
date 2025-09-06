-- Create account types table for custom account types
CREATE TABLE IF NOT EXISTS account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    normal_balance VARCHAR(10) CHECK (normal_balance IN ('debit', 'credit')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default system account types
INSERT INTO account_types (name, description, normal_balance, is_system) VALUES 
('Asset', 'Resources owned by the company', 'debit', true),
('Liability', 'Debts and obligations owed by the company', 'credit', true),
('Equity', 'Owner''s interest in the company', 'credit', true),
('Revenue', 'Income earned from business operations', 'credit', true),
('Expense', 'Costs incurred in business operations', 'debit', true)
ON CONFLICT (name) DO NOTHING;

-- Modify accounts table to reference account_types
-- First, add the new column
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type_id UUID REFERENCES account_types(id);

-- Update existing accounts to reference the new account types
UPDATE accounts SET account_type_id = (
    SELECT id FROM account_types WHERE name = accounts.account_type
) WHERE account_type_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_type_id ON accounts(account_type_id);
CREATE INDEX IF NOT EXISTS idx_account_types_name ON account_types(name);

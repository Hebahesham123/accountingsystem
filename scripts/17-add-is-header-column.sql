-- Add missing is_header column to accounts table
-- Run this script if you get the error: column "is_header" of relation "accounts" does not exist

-- Add the is_header column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' 
        AND column_name = 'is_header'
    ) THEN
        ALTER TABLE accounts ADD COLUMN is_header BOOLEAN DEFAULT false;
        COMMENT ON COLUMN accounts.is_header IS 'Indicates if this is a header account that groups other accounts';
    END IF;
END $$;

-- Update existing accounts to set is_header based on their structure
-- Main categories (1000, 2000, 3000, 4000, 5000) should be header accounts
UPDATE accounts 
SET is_header = true 
WHERE code IN ('1000', '2000', '3000', '4000', '5000');

-- Sub-categories should also be header accounts if they have children
UPDATE accounts 
SET is_header = true 
WHERE id IN (
    SELECT DISTINCT parent_account_id 
    FROM accounts 
    WHERE parent_account_id IS NOT NULL 
    AND is_active = true
);

-- Create index for is_header column for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_is_header ON accounts(is_header);

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name = 'is_header';



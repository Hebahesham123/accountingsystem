-- Additional functions for account type management

-- Function to get account type usage statistics
CREATE OR REPLACE FUNCTION get_account_type_usage()
RETURNS TABLE (
    type_id UUID,
    type_name VARCHAR,
    normal_balance VARCHAR,
    is_system BOOLEAN,
    accounts_count BIGINT,
    total_debit_balance DECIMAL(15,2),
    total_credit_balance DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.id as type_id,
        at.name as type_name,
        at.normal_balance,
        at.is_system,
        COUNT(a.id) as accounts_count,
        COALESCE(SUM(CASE WHEN at.normal_balance = 'debit' THEN 1000.00 ELSE 0 END), 0) as total_debit_balance,
        COALESCE(SUM(CASE WHEN at.normal_balance = 'credit' THEN 1000.00 ELSE 0 END), 0) as total_credit_balance
    FROM account_types at
    LEFT JOIN accounts a ON at.id = a.account_type_id AND a.is_active = true
    WHERE at.is_active = true
    GROUP BY at.id, at.name, at.normal_balance, at.is_system
    ORDER BY at.is_system DESC, at.name;
END;
$$ LANGUAGE plpgsql;

-- Function to validate account type before deletion
CREATE OR REPLACE FUNCTION validate_account_type_deletion(type_id UUID)
RETURNS TABLE (
    can_delete BOOLEAN,
    reason TEXT,
    accounts_using_type BIGINT
) AS $$
DECLARE
    is_system_type BOOLEAN;
    accounts_count BIGINT;
BEGIN
    -- Check if it's a system type
    SELECT is_system INTO is_system_type
    FROM account_types
    WHERE id = type_id;
    
    -- Count accounts using this type
    SELECT COUNT(*) INTO accounts_count
    FROM accounts
    WHERE account_type_id = type_id AND is_active = true;
    
    IF is_system_type THEN
        RETURN QUERY SELECT false, 'Cannot delete system account types'::TEXT, accounts_count;
    ELSIF accounts_count > 0 THEN
        RETURN QUERY SELECT false, format('Account type is being used by %s active accounts', accounts_count)::TEXT, accounts_count;
    ELSE
        RETURN QUERY SELECT true, 'Account type can be safely deleted'::TEXT, accounts_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get accounts by type
CREATE OR REPLACE FUNCTION get_accounts_by_type(type_id UUID)
RETURNS TABLE (
    account_id UUID,
    account_code VARCHAR,
    account_name VARCHAR,
    account_description TEXT,
    parent_account_id UUID,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.description as account_description,
        a.parent_account_id,
        a.is_active
    FROM accounts a
    WHERE a.account_type_id = type_id
    ORDER BY a.code;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate accounts from one type to another
CREATE OR REPLACE FUNCTION migrate_accounts_to_new_type(
    old_type_id UUID,
    new_type_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    accounts_migrated INTEGER;
    old_type_name VARCHAR;
    new_type_name VARCHAR;
BEGIN
    -- Get type names for logging
    SELECT name INTO old_type_name FROM account_types WHERE id = old_type_id;
    SELECT name INTO new_type_name FROM account_types WHERE id = new_type_id;
    
    -- Update accounts
    UPDATE accounts 
    SET account_type_id = new_type_id,
        account_type = new_type_name,
        updated_at = NOW()
    WHERE account_type_id = old_type_id;
    
    GET DIAGNOSTICS accounts_migrated = ROW_COUNT;
    
    RAISE NOTICE 'Migrated % accounts from % to %', accounts_migrated, old_type_name, new_type_name;
    
    RETURN accounts_migrated;
END;
$$ LANGUAGE plpgsql;

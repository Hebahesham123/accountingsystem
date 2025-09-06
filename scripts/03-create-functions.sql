-- Create stored procedures and functions for the accounting system

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
            a.account_type,
            COALESCE(ob.balance, 0) as opening_balance,
            COALESCE(SUM(CASE WHEN je.entry_date BETWEEN COALESCE(start_date, '1900-01-01') AND COALESCE(end_date, CURRENT_DATE) 
                         THEN jel.debit_amount ELSE 0 END), 0) as debit_total,
            COALESCE(SUM(CASE WHEN je.entry_date BETWEEN COALESCE(start_date, '1900-01-01') AND COALESCE(end_date, CURRENT_DATE) 
                         THEN jel.credit_amount ELSE 0 END), 0) as credit_total
        FROM accounts a
        LEFT JOIN opening_balances ob ON a.id = ob.account_id
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE a.is_active = true
        GROUP BY a.id, a.code, a.name, a.account_type, ob.balance
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
            WHEN ab.account_type IN ('Asset', 'Expense') THEN 
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
    SELECT a.account_type INTO account_type
    FROM accounts a
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
    IF account_type IN ('Asset', 'Expense') THEN
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
        a.account_type,
        a.code as account_code,
        a.name as account_name,
        get_account_balance(a.id, as_of_date) as balance
    FROM accounts a
    WHERE a.is_active = true
    AND a.account_type IN ('Asset', 'Liability', 'Equity')
    ORDER BY a.account_type, a.code;
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
    amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.account_type,
        a.code as account_code,
        a.name as account_name,
        COALESCE(SUM(
            CASE 
                WHEN a.account_type = 'Revenue' THEN jel.credit_amount - jel.debit_amount
                WHEN a.account_type = 'Expense' THEN jel.debit_amount - jel.credit_amount
                ELSE 0
            END
        ), 0) as amount
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE a.is_active = true
    AND a.account_type IN ('Revenue', 'Expense')
    AND (je.entry_date IS NULL OR je.entry_date BETWEEN start_date AND end_date)
    GROUP BY a.account_type, a.code, a.name
    HAVING COALESCE(SUM(
        CASE 
            WHEN a.account_type = 'Revenue' THEN jel.credit_amount - jel.debit_amount
            WHEN a.account_type = 'Expense' THEN jel.debit_amount - jel.credit_amount
            ELSE 0
        END
    ), 0) != 0
    ORDER BY a.account_type DESC, a.code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for audit trail
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_trail (table_name, record_id, action, old_values, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_trail (table_name, record_id, action, old_values, new_values, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_trail (table_name, record_id, action, new_values, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER accounts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER journal_entries_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER journal_entry_lines_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON journal_entry_lines
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

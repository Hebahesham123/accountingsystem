-- Sample data with proper account types
-- Run this after the main migration to add some sample accounts

-- First, let's add some more specific account types for better organization
INSERT INTO account_types (name, description, normal_balance, is_system) VALUES 
('Cash and Cash Equivalents', 'Highly liquid assets including cash, bank accounts, and short-term investments', 'debit', false),
('Accounts Receivable', 'Money owed to the company by customers for goods or services provided', 'debit', false),
('Inventory', 'Goods held for sale in the ordinary course of business', 'debit', false),
('Prepaid Expenses', 'Expenses paid in advance that will benefit future periods', 'debit', false),
('Property Plant Equipment', 'Long-term physical assets used in business operations', 'debit', false),
('Accounts Payable', 'Money owed by the company to suppliers for goods or services received', 'credit', false),
('Accrued Liabilities', 'Expenses incurred but not yet paid', 'credit', false),
('Notes Payable', 'Formal written promises to pay specific amounts', 'credit', false),
('Retained Earnings', 'Accumulated profits retained in the business', 'credit', false),
('Sales Revenue', 'Revenue from the sale of goods or services', 'credit', false),
('Cost of Goods Sold', 'Direct costs associated with producing goods sold', 'debit', false),
('Salaries and Wages', 'Compensation paid to employees', 'debit', false),
('Rent Expense', 'Cost of renting or leasing property', 'debit', false),
('Utilities Expense', 'Cost of utilities such as electricity, water, gas', 'debit', false),
('Depreciation Expense', 'Allocation of the cost of fixed assets over their useful lives', 'debit', false)
ON CONFLICT (name) DO NOTHING;

-- Now let's update existing accounts to use more specific types where appropriate
DO $$
DECLARE
    cash_type_id UUID;
    ar_type_id UUID;
    inventory_type_id UUID;
    ppe_type_id UUID;
    ap_type_id UUID;
    accrued_type_id UUID;
    retained_type_id UUID;
    sales_type_id UUID;
    cogs_type_id UUID;
    salaries_type_id UUID;
    rent_type_id UUID;
    utilities_type_id UUID;
BEGIN
    -- Get the new specific type IDs
    SELECT id INTO cash_type_id FROM account_types WHERE name = 'Cash and Cash Equivalents';
    SELECT id INTO ar_type_id FROM account_types WHERE name = 'Accounts Receivable';
    SELECT id INTO inventory_type_id FROM account_types WHERE name = 'Inventory';
    SELECT id INTO ppe_type_id FROM account_types WHERE name = 'Property Plant Equipment';
    SELECT id INTO ap_type_id FROM account_types WHERE name = 'Accounts Payable';
    SELECT id INTO accrued_type_id FROM account_types WHERE name = 'Accrued Liabilities';
    SELECT id INTO retained_type_id FROM account_types WHERE name = 'Retained Earnings';
    SELECT id INTO sales_type_id FROM account_types WHERE name = 'Sales Revenue';
    SELECT id INTO cogs_type_id FROM account_types WHERE name = 'Cost of Goods Sold';
    SELECT id INTO salaries_type_id FROM account_types WHERE name = 'Salaries and Wages';
    SELECT id INTO rent_type_id FROM account_types WHERE name = 'Rent Expense';
    SELECT id INTO utilities_type_id FROM account_types WHERE name = 'Utilities Expense';

    -- Update existing accounts with more specific types
    UPDATE accounts SET account_type_id = cash_type_id, account_type = 'Cash and Cash Equivalents'
    WHERE name IN ('Cash', 'Bank - Checking') AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = ar_type_id, account_type = 'Accounts Receivable'
    WHERE name = 'Accounts Receivable' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = inventory_type_id, account_type = 'Inventory'
    WHERE name = 'Inventory' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = ppe_type_id, account_type = 'Property Plant Equipment'
    WHERE name IN ('Equipment', 'Vehicles') AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = ap_type_id, account_type = 'Accounts Payable'
    WHERE name = 'Accounts Payable' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = accrued_type_id, account_type = 'Accrued Liabilities'
    WHERE name = 'Accrued Expenses' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = retained_type_id, account_type = 'Retained Earnings'
    WHERE name = 'Retained Earnings' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = sales_type_id, account_type = 'Sales Revenue'
    WHERE name = 'Sales Revenue' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = cogs_type_id, account_type = 'Cost of Goods Sold'
    WHERE name = 'Cost of Goods Sold' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = salaries_type_id, account_type = 'Salaries and Wages'
    WHERE name = 'Salaries & Wages' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = rent_type_id, account_type = 'Rent Expense'
    WHERE name = 'Rent Expense' AND account_type_id IS NOT NULL;

    UPDATE accounts SET account_type_id = utilities_type_id, account_type = 'Utilities Expense'
    WHERE name = 'Utilities' AND account_type_id IS NOT NULL;

    RAISE NOTICE 'Sample accounts updated with specific account types';
END $$;

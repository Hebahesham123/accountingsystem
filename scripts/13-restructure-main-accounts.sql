-- Restructure Chart of Accounts to have main account types as primary accounts
-- This script creates the 5 main account categories and allows sub-accounts under them

-- First, clear existing accounts to start fresh
DELETE FROM journal_entry_lines WHERE account_id IN (SELECT id FROM accounts);
DELETE FROM journal_entries;
DELETE FROM accounts;

-- Insert the 5 main account categories
INSERT INTO accounts (code, name, account_type, account_type_id, level, lft, rgt, is_active, description) VALUES 
-- Assets (1000)
('1000', 'Assets', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), 1, 1, 2, true, 'All company assets and resources'),

-- Liabilities (2000) 
('2000', 'Liabilities', 'Liability', (SELECT id FROM account_types WHERE name = 'Liability'), 1, 3, 4, true, 'All company debts and obligations'),

-- Equity (3000)
('3000', 'Equity', 'Equity', (SELECT id FROM account_types WHERE name = 'Equity'), 1, 5, 6, true, 'Owner''s equity and retained earnings'),

-- Revenue (4000)
('4000', 'Revenue', 'Revenue', (SELECT id FROM account_types WHERE name = 'Revenue'), 1, 7, 8, true, 'All income and revenue sources'),

-- Expenses (5000)
('5000', 'Expenses', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), 1, 9, 10, true, 'All business expenses and costs')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  account_type_id = EXCLUDED.account_type_id,
  level = EXCLUDED.level,
  lft = EXCLUDED.lft,
  rgt = EXCLUDED.rgt,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- Add some sample sub-accounts under Assets
INSERT INTO accounts (code, name, account_type, account_type_id, parent_account_id, level, lft, rgt, is_active, description) VALUES 
('1100', 'Current Assets', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1000'), 2, 1, 8, true, 'Assets that can be converted to cash within one year'),
('1110', 'Cash', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1100'), 3, 1, 2, true, 'Cash on hand and in bank accounts'),
('1120', 'Accounts Receivable', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1100'), 3, 3, 4, true, 'Money owed by customers'),
('1130', 'Inventory', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1100'), 3, 5, 6, true, 'Products and materials held for sale'),
('1200', 'Fixed Assets', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1000'), 2, 9, 12, true, 'Long-term assets used in business operations'),
('1210', 'Equipment', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1200'), 3, 9, 10, true, 'Business equipment and machinery'),
('1220', 'Vehicles', 'Asset', (SELECT id FROM account_types WHERE name = 'Asset'), (SELECT id FROM accounts WHERE code = '1200'), 3, 11, 12, true, 'Company vehicles')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  account_type_id = EXCLUDED.account_type_id,
  parent_account_id = EXCLUDED.parent_account_id,
  level = EXCLUDED.level,
  lft = EXCLUDED.lft,
  rgt = EXCLUDED.rgt,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- Add some sample sub-accounts under Liabilities
INSERT INTO accounts (code, name, account_type, account_type_id, parent_account_id, level, lft, rgt, is_active, description) VALUES 
('2100', 'Current Liabilities', 'Liability', (SELECT id FROM account_types WHERE name = 'Liability'), (SELECT id FROM accounts WHERE code = '2000'), 2, 3, 6, true, 'Debts due within one year'),
('2110', 'Accounts Payable', 'Liability', (SELECT id FROM account_types WHERE name = 'Liability'), (SELECT id FROM accounts WHERE code = '2100'), 3, 3, 4, true, 'Money owed to suppliers'),
('2120', 'Accrued Expenses', 'Liability', (SELECT id FROM account_types WHERE name = 'Liability'), (SELECT id FROM accounts WHERE code = '2100'), 3, 5, 6, true, 'Expenses incurred but not yet paid'),
('2200', 'Long-Term Liabilities', 'Liability', (SELECT id FROM account_types WHERE name = 'Liability'), (SELECT id FROM accounts WHERE code = '2000'), 2, 7, 8, true, 'Debts due after one year'),
('2210', 'Bank Loan', 'Liability', (SELECT id FROM account_types WHERE name = 'Liability'), (SELECT id FROM accounts WHERE code = '2200'), 3, 7, 8, true, 'Long-term bank loans')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  account_type_id = EXCLUDED.account_type_id,
  parent_account_id = EXCLUDED.parent_account_id,
  level = EXCLUDED.level,
  lft = EXCLUDED.lft,
  rgt = EXCLUDED.rgt,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- Add some sample sub-accounts under Equity
INSERT INTO accounts (code, name, account_type, account_type_id, parent_account_id, level, lft, rgt, is_active, description) VALUES 
('3100', 'Owner''s Equity', 'Equity', (SELECT id FROM account_types WHERE name = 'Equity'), (SELECT id FROM accounts WHERE code = '3000'), 2, 5, 6, true, 'Owner''s investment in the business'),
('3200', 'Retained Earnings', 'Equity', (SELECT id FROM account_types WHERE name = 'Equity'), (SELECT id FROM accounts WHERE code = '3000'), 2, 7, 8, true, 'Accumulated profits retained in the business')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  account_type_id = EXCLUDED.account_type_id,
  parent_account_id = EXCLUDED.parent_account_id,
  level = EXCLUDED.level,
  lft = EXCLUDED.lft,
  rgt = EXCLUDED.rgt,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- Add some sample sub-accounts under Revenue
INSERT INTO accounts (code, name, account_type, account_type_id, parent_account_id, level, lft, rgt, is_active, description) VALUES 
('4100', 'Sales Revenue', 'Revenue', (SELECT id FROM account_types WHERE name = 'Revenue'), (SELECT id FROM accounts WHERE code = '4000'), 2, 7, 8, true, 'Revenue from product sales'),
('4200', 'Service Income', 'Revenue', (SELECT id FROM account_types WHERE name = 'Revenue'), (SELECT id FROM accounts WHERE code = '4000'), 2, 9, 10, true, 'Revenue from services provided'),
('4300', 'Other Income', 'Revenue', (SELECT id FROM account_types WHERE name = 'Revenue'), (SELECT id FROM accounts WHERE code = '4000'), 2, 11, 12, true, 'Other sources of income')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  account_type_id = EXCLUDED.account_type_id,
  parent_account_id = EXCLUDED.parent_account_id,
  level = EXCLUDED.level,
  lft = EXCLUDED.lft,
  rgt = EXCLUDED.rgt,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- Add some sample sub-accounts under Expenses
INSERT INTO accounts (code, name, account_type, account_type_id, parent_account_id, level, lft, rgt, is_active, description) VALUES 
('5100', 'Operating Expenses', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), (SELECT id FROM accounts WHERE code = '5000'), 2, 9, 14, true, 'Day-to-day business expenses'),
('5110', 'Office Supplies', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), (SELECT id FROM accounts WHERE code = '5100'), 3, 9, 10, true, 'Office supplies and materials'),
('5120', 'Utilities', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), (SELECT id FROM accounts WHERE code = '5100'), 3, 11, 12, true, 'Electricity, water, internet, etc.'),
('5130', 'Rent', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), (SELECT id FROM accounts WHERE code = '5100'), 3, 13, 14, true, 'Office and facility rent'),
('5200', 'Marketing Expenses', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), (SELECT id FROM accounts WHERE code = '5000'), 2, 15, 16, true, 'Marketing and advertising costs'),
('5300', 'Professional Services', 'Expense', (SELECT id FROM account_types WHERE name = 'Expense'), (SELECT id FROM accounts WHERE code = '5000'), 2, 17, 18, true, 'Legal, accounting, consulting fees')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  account_type_id = EXCLUDED.account_type_id,
  parent_account_id = EXCLUDED.parent_account_id,
  level = EXCLUDED.level,
  lft = EXCLUDED.lft,
  rgt = EXCLUDED.rgt,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description;

-- Update the lft/rgt values to reflect the new structure
UPDATE accounts SET lft = 1, rgt = 2 WHERE code = '1000';
UPDATE accounts SET lft = 3, rgt = 4 WHERE code = '2000';
UPDATE accounts SET lft = 5, rgt = 6 WHERE code = '3000';
UPDATE accounts SET lft = 7, rgt = 8 WHERE code = '4000';
UPDATE accounts SET lft = 9, rgt = 10 WHERE code = '5000';

-- Update sub-account lft/rgt values
UPDATE accounts SET lft = 1, rgt = 8 WHERE code = '1100';
UPDATE accounts SET lft = 1, rgt = 2 WHERE code = '1110';
UPDATE accounts SET lft = 3, rgt = 4 WHERE code = '1120';
UPDATE accounts SET lft = 5, rgt = 6 WHERE code = '1130';
UPDATE accounts SET lft = 9, rgt = 12 WHERE code = '1200';
UPDATE accounts SET lft = 9, rgt = 10 WHERE code = '1210';
UPDATE accounts SET lft = 11, rgt = 12 WHERE code = '1220';

UPDATE accounts SET lft = 3, rgt = 6 WHERE code = '2100';
UPDATE accounts SET lft = 3, rgt = 4 WHERE code = '2110';
UPDATE accounts SET lft = 5, rgt = 6 WHERE code = '2120';
UPDATE accounts SET lft = 7, rgt = 8 WHERE code = '2200';
UPDATE accounts SET lft = 7, rgt = 8 WHERE code = '2210';

UPDATE accounts SET lft = 5, rgt = 6 WHERE code = '3100';
UPDATE accounts SET lft = 7, rgt = 8 WHERE code = '3200';

UPDATE accounts SET lft = 7, rgt = 8 WHERE code = '4100';
UPDATE accounts SET lft = 9, rgt = 10 WHERE code = '4200';
UPDATE accounts SET lft = 11, rgt = 12 WHERE code = '4300';

UPDATE accounts SET lft = 9, rgt = 14 WHERE code = '5100';
UPDATE accounts SET lft = 9, rgt = 10 WHERE code = '5110';
UPDATE accounts SET lft = 11, rgt = 12 WHERE code = '5120';
UPDATE accounts SET lft = 13, rgt = 14 WHERE code = '5130';
UPDATE accounts SET lft = 15, rgt = 16 WHERE code = '5200';
UPDATE accounts SET lft = 17, rgt = 18 WHERE code = '5300';


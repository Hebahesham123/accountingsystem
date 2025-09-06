-- Insert sample data for the accounting system

-- Insert a default admin user
INSERT INTO users (email, name, role) VALUES 
('admin@company.com', 'System Administrator', 'admin'),
('accountant@company.com', 'Chief Accountant', 'accountant'),
('user@company.com', 'Regular User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert default accounting period
INSERT INTO accounting_periods (name, start_date, end_date) VALUES 
('FY 2024', '2024-01-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Insert Chart of Accounts with hierarchical structure
-- Assets
INSERT INTO accounts (code, name, account_type, level, lft, rgt) VALUES 
('1000', 'Assets', 'Asset', 1, 1, 20),
('1100', 'Current Assets', 'Asset', 2, 2, 11),
('1110', 'Cash', 'Asset', 3, 3, 4),
('1120', 'Bank - Checking', 'Asset', 3, 5, 6),
('1130', 'Accounts Receivable', 'Asset', 3, 7, 8),
('1140', 'Inventory', 'Asset', 3, 9, 10),
('1200', 'Fixed Assets', 'Asset', 2, 12, 19),
('1210', 'Equipment', 'Asset', 3, 13, 14),
('1220', 'Vehicles', 'Asset', 3, 15, 16),
('1230', 'Accumulated Depreciation', 'Asset', 3, 17, 18)
ON CONFLICT (code) DO NOTHING;

-- Liabilities
INSERT INTO accounts (code, name, account_type, level, lft, rgt) VALUES 
('2000', 'Liabilities', 'Liability', 1, 21, 32),
('2100', 'Current Liabilities', 'Liability', 2, 22, 27),
('2110', 'Accounts Payable', 'Liability', 3, 23, 24),
('2120', 'Accrued Expenses', 'Liability', 3, 25, 26),
('2200', 'Long-Term Liabilities', 'Liability', 2, 28, 31),
('2210', 'Bank Loan', 'Liability', 3, 29, 30)
ON CONFLICT (code) DO NOTHING;

-- Equity
INSERT INTO accounts (code, name, account_type, level, lft, rgt) VALUES 
('3000', 'Equity', 'Equity', 1, 33, 38),
('3100', 'Owner''s Equity', 'Equity', 2, 34, 35),
('3200', 'Retained Earnings', 'Equity', 2, 36, 37)
ON CONFLICT (code) DO NOTHING;

-- Revenue
INSERT INTO accounts (code, name, account_type, level, lft, rgt) VALUES 
('4000', 'Revenue', 'Revenue', 1, 39, 46),
('4100', 'Sales Revenue', 'Revenue', 2, 40, 41),
('4200', 'Service Income', 'Revenue', 2, 42, 43),
('4300', 'Other Income', 'Revenue', 2, 44, 45)
ON CONFLICT (code) DO NOTHING;

-- Expenses
INSERT INTO accounts (code, name, account_type, level, lft, rgt) VALUES 
('5000', 'Expenses', 'Expense', 1, 47, 60),
('5100', 'Cost of Goods Sold', 'Expense', 2, 48, 49),
('5200', 'Operating Expenses', 'Expense', 2, 50, 57),
('5210', 'Salaries & Wages', 'Expense', 3, 51, 52),
('5220', 'Rent Expense', 'Expense', 3, 53, 54),
('5230', 'Utilities', 'Expense', 3, 55, 56),
('5300', 'Administrative Expenses', 'Expense', 2, 58, 59)
ON CONFLICT (code) DO NOTHING;

-- Update parent relationships
UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '1000') WHERE code IN ('1100', '1200');
UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '1100') WHERE code IN ('1110', '1120', '1130', '1140');
UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '1200') WHERE code IN ('1210', '1220', '1230');

UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '2000') WHERE code IN ('2100', '2200');
UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '2100') WHERE code IN ('2110', '2120');
UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '2200') WHERE code IN ('2210');

UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '3000') WHERE code IN ('3100', '3200');

UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '4000') WHERE code IN ('4100', '4200', '4300');

UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '5000') WHERE code IN ('5100', '5200', '5300');
UPDATE accounts SET parent_account_id = (SELECT id FROM accounts WHERE code = '5200') WHERE code IN ('5210', '5220', '5230');

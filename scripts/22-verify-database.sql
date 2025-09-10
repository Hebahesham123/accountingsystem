-- Quick Database Verification Script
-- Run this to check if the chart of accounts tables exist and have data

-- Check if account_types table exists and has data
SELECT 
    'account_types' as table_name,
    COUNT(*) as record_count
FROM account_types
WHERE is_active = true;

-- Check if accounts table exists and has data
SELECT 
    'accounts' as table_name,
    COUNT(*) as record_count
FROM accounts
WHERE is_active = true;

-- Show account types
SELECT 
    id,
    name,
    normal_balance,
    is_system
FROM account_types
WHERE is_active = true
ORDER BY name;

-- Show sample accounts
SELECT 
    a.code,
    a.name,
    at.name as account_type,
    a.is_header,
    a.level
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.is_active = true
ORDER BY a.code
LIMIT 10;



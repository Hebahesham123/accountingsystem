-- Check Accounts Table Structure Script
-- This script checks the actual structure of the accounts table

-- STEP 1: Check accounts table structure
SELECT 
    'Accounts table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'accounts'
ORDER BY ordinal_position;

-- STEP 2: Check if accounts table exists
SELECT 
    'Checking if accounts table exists:' as info,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'accounts';

-- STEP 3: Show sample accounts data
SELECT 
    'Sample accounts data:' as info,
    *
FROM public.accounts
LIMIT 5;

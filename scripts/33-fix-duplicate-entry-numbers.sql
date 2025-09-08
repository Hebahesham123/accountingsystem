-- Fix Duplicate Entry Numbers
-- This script resolves duplicate journal entry numbers

-- Step 1: Check for duplicate entry numbers
SELECT 'Checking for duplicate entry numbers...' as test_name;

SELECT 
    entry_number,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 1 THEN 'DUPLICATE'
        ELSE 'UNIQUE'
    END as status
FROM journal_entries
GROUP BY entry_number
ORDER BY count DESC;

-- Step 2: Show all journal entries with their numbers
SELECT 'Current journal entries:' as info_type;

SELECT 
    id,
    entry_number,
    entry_date,
    description,
    created_at
FROM journal_entries
ORDER BY created_at;

-- Step 3: Fix duplicate entry numbers
DO $$
DECLARE
    entry_record RECORD;
    new_entry_number VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    -- Get all journal entries ordered by creation date
    FOR entry_record IN 
        SELECT id, entry_number, created_at
        FROM journal_entries
        ORDER BY created_at
    LOOP
        -- Generate a new unique entry number
        new_entry_number := 'JE-' || LPAD(counter::TEXT, 3, '0');
        
        -- Update the entry number
        UPDATE journal_entries 
        SET entry_number = new_entry_number
        WHERE id = entry_record.id;
        
        counter := counter + 1;
        
        RAISE NOTICE 'Updated entry % to %', entry_record.id, new_entry_number;
    END LOOP;
    
    RAISE NOTICE 'Fixed all duplicate entry numbers';
END $$;

-- Step 4: Verify the fix
SELECT 'Verifying fix...' as test_name;

-- Check for duplicates again
SELECT 
    'Duplicate check after fix' as check_type,
    COUNT(*) as duplicate_count
FROM (
    SELECT entry_number, COUNT(*) as cnt
    FROM journal_entries
    GROUP BY entry_number
    HAVING COUNT(*) > 1
) duplicates;

-- Show the updated journal entries
SELECT 'Updated journal entries:' as info_type;

SELECT 
    id,
    entry_number,
    entry_date,
    description,
    created_at
FROM journal_entries
ORDER BY created_at;

-- Step 5: Test entry number generation
SELECT 'Testing entry number generation...' as test_name;

-- Show what the next entry number should be
WITH last_entry AS (
    SELECT entry_number
    FROM journal_entries
    ORDER BY created_at DESC
    LIMIT 1
),
next_number AS (
    SELECT 
        CASE 
            WHEN entry_number IS NULL THEN 'JE-001'
            WHEN entry_number ~ '^JE-\d+$' THEN 
                'JE-' || LPAD((SUBSTRING(entry_number FROM 'JE-(\d+)')::INT + 1)::TEXT, 3, '0')
            ELSE 'JE-001'
        END as next_entry_number
    FROM last_entry
)
SELECT 
    'Next entry number should be' as info_type,
    next_entry_number
FROM next_number;

-- Final verification
SELECT 'DUPLICATE ENTRY NUMBER FIX COMPLETE' as status;

SELECT 
    'Database Status' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM (
            SELECT entry_number, COUNT(*) as cnt
            FROM journal_entries
            GROUP BY entry_number
            HAVING COUNT(*) > 1
        ) duplicates) = 0
        THEN 'NO DUPLICATES'
        ELSE 'DUPLICATES STILL EXIST'
    END as status

UNION ALL

SELECT 
    'Entry Count' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM journal_entries) > 0
        THEN 'HAS ENTRIES'
        ELSE 'NO ENTRIES'
    END as status;

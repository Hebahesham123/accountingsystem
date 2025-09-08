# Journal Entries Error - Troubleshooting Guide

## Issue Description
You're encountering an error when trying to load journal entries:
```
Error loading entries: Error: Failed to load journal entries
Error fetching journal entries: Object
```

## Root Cause
The error is likely caused by one of these issues:
1. **Missing database tables** - The `journal_entries` or `journal_entry_lines` tables don't exist
2. **Complex nested query** - The original query was too complex and causing Supabase to return a 400 error
3. **Missing foreign key relationships** - Required tables like `users` or `accounting_periods` are missing

## Solution Steps

### Step 1: Fix Database Tables
Run this script in your Supabase SQL editor to ensure all required tables exist:

```sql
-- Run this script
\i scripts/27-fix-journal-entries.sql
```

### Step 2: Create Sample Data
If you don't have any journal entries, create some sample data:

```sql
-- Run this script
\i scripts/28-test-journal-entries.sql
```

### Step 3: Verify the Fix
The code has been updated to use a more robust query approach that:
- Separates the main query from the nested query
- Handles missing data gracefully
- Provides better error handling

### Step 4: Test the Application
1. Refresh your browser
2. Navigate to the Journal Entries page
3. The error should be resolved

## What Was Fixed

### 1. Query Structure
**Before (Problematic):**
```typescript
let query = supabase
  .from("journal_entries")
  .select(`
    *,
    journal_entry_lines(
      *,
      accounts(*)
    )
  `)
```

**After (Fixed):**
```typescript
// First get journal entries
let query = supabase
  .from("journal_entries")
  .select("*")

// Then get lines separately
const { data: lines } = await supabase
  .from("journal_entry_lines")
  .select(`
    *,
    accounts(
      id,
      code,
      name,
      account_types(name)
    )
  `)
  .in("journal_entry_id", entryIds)
```

### 2. Error Handling
- Added better error handling for missing tables
- Graceful degradation when lines can't be loaded
- More specific error messages

### 3. Data Safety
- Added null checks for optional fields
- Safe string operations with optional chaining
- Better handling of empty result sets

## Verification Commands

### Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('journal_entries', 'journal_entry_lines', 'accounts', 'account_types');
```

### Check if you have journal entries:
```sql
SELECT COUNT(*) as entry_count FROM journal_entries;
```

### Test the query manually:
```sql
SELECT 
  je.entry_number,
  je.entry_date,
  je.description,
  COUNT(jel.id) as line_count
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
GROUP BY je.id, je.entry_number, je.entry_date, je.description;
```

## If Issues Persist

### 1. Check Supabase Logs
- Go to your Supabase dashboard
- Check the Logs section for any database errors
- Look for 400 errors or permission issues

### 2. Verify Environment Variables
Make sure your `.env.local` file has the correct Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Check Row Level Security (RLS)
If RLS is enabled, you might need to create policies:
```sql
-- Allow reading journal entries
CREATE POLICY "Allow read journal entries" ON journal_entries
FOR SELECT USING (true);

-- Allow reading journal entry lines
CREATE POLICY "Allow read journal entry lines" ON journal_entry_lines
FOR SELECT USING (true);
```

### 4. Complete Database Reset
If nothing else works, run the complete setup:
```sql
-- Run the complete database setup
\i scripts/24-complete-database-setup.sql
```

## Expected Result
After applying these fixes, you should see:
- Journal entries loading without errors
- Sample data displaying correctly
- Ability to create new journal entries
- Proper filtering and search functionality

The system should now work correctly with all journal entries functionality restored.

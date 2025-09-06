# Troubleshooting Account Reports

## Issue: Account Reports Show No Data

If your account reports are showing empty data (zero balances, no transactions), follow these steps to diagnose and fix the issue.

## 🔍 **Diagnosis Steps**

### 1. **Check Browser Console**
- Open Developer Tools (F12)
- Go to Console tab
- Look for error messages or warnings
- Check if there are any network errors

### 2. **Verify Database Data**
Run the test script to check your database:
```bash
# In your database client, run:
scripts/08-test-account-reports.sql
```

This will show you:
- How many accounts exist
- How many journal entries exist
- Account structure (parent-child relationships)
- Any data inconsistencies

### 3. **Check Account Reports Page**
- Navigate to `/account-reports`
- Look for the debug information card (in development mode)
- Check if it shows "Has journal entries: No"

## 🛠️ **Solutions**

### **Solution 1: Create Sample Data (Recommended for Testing)**

1. Go to `/account-reports`
2. Click the **"Create Sample Data"** button
3. Wait for the success message
4. Refresh the page

This will create:
- Sample sales transactions
- Sample expense transactions
- Sample credit sales
- All properly balanced journal entries

### **Solution 2: Create Manual Journal Entries**

1. Go to `/journal-entries`
2. Click "Create Journal Entry"
3. Create balanced entries like:
   - **Debit**: Cash $1000, **Credit**: Sales Revenue $1000
   - **Debit**: Office Supplies $250, **Credit**: Cash $250

### **Solution 3: Check Account Structure**

Ensure you have:
- **Asset accounts** (Cash, Accounts Receivable, Inventory)
- **Liability accounts** (Accounts Payable, Bank Loan)
- **Equity accounts** (Owner's Equity, Retained Earnings)
- **Revenue accounts** (Sales Revenue, Service Income)
- **Expense accounts** (Cost of Goods Sold, Operating Expenses)

## 🚨 **Common Issues & Fixes**

### **Issue: "No accounts found"**
**Fix**: Go to Chart of Accounts and create some accounts first

### **Issue: "No journal entries found"**
**Fix**: Use the "Create Sample Data" button or create manual entries

### **Issue: "Database connection error"**
**Fix**: Check your Supabase connection settings in `lib/supabase.ts`

### **Issue: "Account types not found"**
**Fix**: Run the database migration scripts in the `scripts/` folder

## 📊 **Expected Results After Fixing**

Once you have data, you should see:

1. **Account Reports Overview** (`/account-reports`):
   - List of all accounts with balances
   - Total debits, credits, and transactions
   - Links to individual account reports

2. **Individual Account Reports** (`/account-reports/[accountId]`):
   - Account summary with balances
   - Transaction history table
   - Running balance calculations
   - Sub-account breakdowns (if applicable)

## 🔧 **Advanced Troubleshooting**

### **Check Database Tables**
```sql
-- Verify table structure
\d accounts
\d journal_entries
\d journal_entry_lines
\d account_types
```

### **Check Foreign Key Relationships**
```sql
-- Verify account references
SELECT 
    jel.account_id,
    a.code,
    a.name
FROM journal_entry_lines jel
LEFT JOIN accounts a ON jel.account_id = a.id
WHERE a.id IS NULL;
```

### **Check Data Integrity**
```sql
-- Verify balanced journal entries
SELECT 
    entry_number,
    total_debit,
    total_credit,
    (total_debit - total_credit) as difference
FROM journal_entries
WHERE ABS(total_debit - total_credit) > 0.01;
```

## 📞 **Getting Help**

If the issue persists:

1. **Check the console logs** for detailed error messages
2. **Run the test script** to identify data issues
3. **Verify your database schema** matches the expected structure
4. **Check network requests** in Developer Tools Network tab

## 🎯 **Quick Test**

To quickly verify everything is working:

1. Go to `/account-reports`
2. Click "Create Sample Data"
3. Wait for success message
4. Check if accounts now show balances
5. Click on an account to view its detailed report

If you still see no data after creating sample entries, there may be a deeper issue with the database connection or schema.

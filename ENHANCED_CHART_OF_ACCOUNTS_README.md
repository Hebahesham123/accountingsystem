# Enhanced Chart of Accounts System

This document describes the enhanced chart of accounts functionality that provides comprehensive account management with unique numbering, hierarchical structure, and full CRUD operations.

## Features

### ✅ Account Management
- **Create Accounts**: Add new accounts with automatic code generation
- **Update Accounts**: Modify existing account details
- **Delete Accounts**: Safe deletion with validation
- **Hierarchical Structure**: Support for unlimited account levels
- **Unique Numbering**: Automatic unique account code generation

### ✅ Account Type Management
- **Create Account Types**: Add custom account types
- **Update Account Types**: Modify existing account types
- **Delete Account Types**: Safe deletion with usage validation
- **System Types**: Built-in system account types (Asset, Liability, Equity, Revenue, Expense)

### ✅ Advanced Features
- **Automatic Code Generation**: Smart account code assignment based on type and hierarchy
- **Hierarchy Validation**: Prevents circular references and excessive depth
- **Safe Deletion**: Validates accounts before deletion (no transactions or sub-accounts)
- **Account Paths**: Full hierarchy path display
- **Usage Statistics**: Track account type usage

## Database Schema

### Core Tables

#### `accounts` Table
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_type_id UUID REFERENCES account_types(id),
    parent_account_id UUID REFERENCES accounts(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    level INTEGER DEFAULT 1,
    lft INTEGER,
    rgt INTEGER,
    sequence_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `account_types` Table
```sql
CREATE TABLE account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    normal_balance VARCHAR(10) CHECK (normal_balance IN ('debit', 'credit')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Database Functions

#### `generate_account_code(account_type_id, parent_account_id)`
Generates unique account codes based on account type and parent account.

**Parameters:**
- `account_type_id`: UUID of the account type
- `parent_account_id`: UUID of the parent account (optional)

**Returns:** VARCHAR - Generated account code

**Code Ranges:**
- Assets: 1000-1999
- Liabilities: 2000-2999
- Equity: 3000-3999
- Revenue: 4000-4999
- Expenses: 5000-5999

#### `validate_account_hierarchy(account_id, parent_account_id)`
Validates account hierarchy to prevent circular references and excessive depth.

**Parameters:**
- `account_id`: UUID of the account
- `parent_account_id`: UUID of the proposed parent account

**Returns:** BOOLEAN - True if valid hierarchy

#### `can_delete_account(account_id)`
Checks if an account can be safely deleted.

**Parameters:**
- `account_id`: UUID of the account

**Returns:** BOOLEAN - True if account can be deleted

#### `delete_account_safely(account_id)`
Safely deletes an account after validation.

**Parameters:**
- `account_id`: UUID of the account

**Returns:** BOOLEAN - True if deletion successful

#### `get_account_path(account_id)`
Gets the full hierarchy path for an account.

**Parameters:**
- `account_id`: UUID of the account

**Returns:** TEXT - Full hierarchy path (e.g., "Assets > Current Assets > Cash")

### Database Views

#### `account_hierarchy_view`
Provides a hierarchical view of all accounts with full paths and metadata.

**Columns:**
- `account_code`: Account code
- `account_name`: Account name
- `hierarchy_path`: Full hierarchy path
- `depth`: Hierarchy depth level
- `account_level_type`: Type description (Main Account, Sub-Account, etc.)

#### `account_type_usage`
Shows usage statistics for each account type.

**Columns:**
- `name`: Account type name
- `account_count`: Total accounts using this type
- `active_account_count`: Active accounts using this type
- `main_account_count`: Top-level accounts using this type
- `sub_account_count`: Sub-accounts using this type

## API Methods

### Account Management

#### `AccountingService.createAccount(accountData)`
Creates a new account with automatic code generation.

**Parameters:**
```typescript
{
  code?: string,           // Optional - auto-generated if not provided
  name: string,            // Required
  account_type_id: string, // Required
  parent_account_id?: string, // Optional
  description?: string    // Optional
}
```

#### `AccountingService.updateAccount(accountId, updates)`
Updates an existing account.

**Parameters:**
```typescript
{
  code?: string,
  name?: string,
  account_type_id?: string,
  parent_account_id?: string,
  description?: string,
  is_active?: boolean
}
```

#### `AccountingService.deleteAccount(accountId)`
Safely deletes an account.

#### `AccountingService.canDeleteAccount(accountId)`
Checks if an account can be deleted.

#### `AccountingService.getAccountPath(accountId)`
Gets the full hierarchy path for an account.

### Account Type Management

#### `AccountingService.createAccountType(accountTypeData)`
Creates a new account type.

**Parameters:**
```typescript
{
  name: string,
  description?: string,
  normal_balance: "debit" | "credit"
}
```

#### `AccountingService.updateAccountType(accountTypeId, updates)`
Updates an existing account type.

#### `AccountingService.deleteAccountType(accountTypeId)`
Safely deletes an account type.

### Utility Methods

#### `AccountingService.generateAccountCode(accountTypeId, parentAccountId?)`
Generates the next available account code.

#### `AccountingService.getHierarchicalChartOfAccounts()`
Gets the hierarchical chart of accounts with full paths.

#### `AccountingService.getAccountTypeUsage()`
Gets account type usage statistics.

## Usage Examples

### Creating a New Account

```typescript
// Create a new asset account
const newAccount = await AccountingService.createAccount({
  name: "Office Equipment",
  account_type_id: "asset-type-id",
  description: "Equipment used in office operations"
});

// Create a sub-account under an existing account
const subAccount = await AccountingService.createAccount({
  name: "Computers",
  account_type_id: "asset-type-id",
  parent_account_id: "office-equipment-id",
  description: "Computer equipment"
});
```

### Creating a Custom Account Type

```typescript
// Create a custom account type
const customType = await AccountingService.createAccountType({
  name: "Current Asset",
  description: "Assets that can be converted to cash within one year",
  normal_balance: "debit"
});
```

### Checking Account Deletion Safety

```typescript
// Check if account can be deleted
const canDelete = await AccountingService.canDeleteAccount(accountId);

if (canDelete) {
  await AccountingService.deleteAccount(accountId);
} else {
  console.log("Account cannot be deleted - has transactions or sub-accounts");
}
```

## Account Code Generation Rules

### Main Account Codes (Level 1)
- **Assets**: 1000, 1100, 1200, etc. (increments of 100)
- **Liabilities**: 2000, 2100, 2200, etc.
- **Equity**: 3000, 3100, 3200, etc.
- **Revenue**: 4000, 4100, 4200, etc.
- **Expenses**: 5000, 5100, 5200, etc.

### Sub-Account Codes (Level 2+)
- **First sub-account**: Parent code + 100 (e.g., 1100 → 1110)
- **Additional sub-accounts**: Increments of 10 (e.g., 1110, 1120, 1130)
- **Deeper levels**: Continue pattern (e.g., 1110 → 1111, 1112, 1113)

### Examples
```
1000 - Assets (Main)
├── 1100 - Current Assets
│   ├── 1110 - Cash
│   ├── 1120 - Accounts Receivable
│   └── 1130 - Inventory
└── 1200 - Fixed Assets
    ├── 1210 - Equipment
    └── 1220 - Vehicles
```

## Constraints and Validations

### Account Code Constraints
- Must be numeric only
- Must be at least 3 digits
- Must be unique across all accounts
- Auto-generated if not provided

### Hierarchy Constraints
- Maximum depth: 5 levels
- No circular references allowed
- Parent account must exist
- Account type must match parent (for sub-accounts)

### Deletion Constraints
- Cannot delete accounts with transactions
- Cannot delete accounts with sub-accounts
- Cannot delete system account types
- Cannot delete account types in use

## Installation and Setup

### 1. Run Database Migrations
```bash
# Run the enhanced chart of accounts migration
psql -d your_database -f scripts/14-enhanced-chart-of-accounts.sql

# Run the test script to verify functionality
psql -d your_database -f scripts/15-test-enhanced-chart-of-accounts.sql
```

### 2. Update Application Code
The enhanced functionality is already integrated into the existing components:
- `components/chart-of-accounts.tsx` - Updated with new features
- `lib/accounting-utils.ts` - Enhanced with new methods
- Database functions and views are automatically available

### 3. Verify Installation
Check that all functions and views are created:
```sql
-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%account%';

-- Check views
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%account%';
```

## Troubleshooting

### Common Issues

#### Account Code Generation Fails
- **Cause**: Account type not found or invalid parent account
- **Solution**: Ensure account type exists and parent account is valid

#### Cannot Delete Account
- **Cause**: Account has transactions or sub-accounts
- **Solution**: Remove transactions or sub-accounts first, or use `canDeleteAccount()` to check

#### Hierarchy Validation Fails
- **Cause**: Circular reference or excessive depth
- **Solution**: Check parent-child relationships and ensure depth < 5 levels

#### Account Type Deletion Fails
- **Cause**: Account type is in use by accounts
- **Solution**: Reassign accounts to different types first

### Performance Considerations

- Indexes are created on frequently queried columns
- Views use recursive CTEs for hierarchy - monitor performance with large datasets
- Account code generation is optimized with database functions
- Consider adding more indexes for very large chart of accounts

## Future Enhancements

### Planned Features
- **Account Templates**: Predefined account structures for different industries
- **Bulk Operations**: Import/export accounts from CSV/Excel
- **Account Analytics**: Usage patterns and recommendations
- **Multi-currency Support**: Account balances in different currencies
- **Account Groups**: Grouping accounts for reporting purposes

### Integration Points
- **Journal Entries**: Automatic account validation
- **Financial Reports**: Enhanced reporting with hierarchy
- **Trial Balance**: Hierarchical trial balance display
- **Dashboard**: Account usage statistics and insights

## Support

For issues or questions regarding the enhanced chart of accounts system:

1. Check the test script results (`scripts/15-test-enhanced-chart-of-accounts.sql`)
2. Verify database functions are properly installed
3. Check browser console for JavaScript errors
4. Review database logs for constraint violations

The system is designed to be robust and user-friendly, with comprehensive validation and error handling throughout.

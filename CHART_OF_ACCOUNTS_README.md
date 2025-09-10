# Chart of Accounts System

## Overview

The Chart of Accounts system provides a comprehensive solution for managing your company's accounting structure. It includes hierarchical account management, account type customization, and full CRUD operations.

## Features

### 🏗️ Account Management
- **Hierarchical Structure**: Create parent-child relationships between accounts
- **Auto-generated Codes**: Automatic account code generation based on type and hierarchy
- **Header Accounts**: Designate accounts as header accounts (cannot have transactions)
- **Full CRUD Operations**: Create, read, update, and delete accounts
- **Safe Deletion**: Accounts can only be deleted if they have no transactions or sub-accounts

### 📊 Account Types
- **Custom Types**: Create custom account types beyond the standard 5
- **Normal Balance**: Define whether accounts increase with debits or credits
- **System Types**: Built-in types (Assets, Liabilities, Equity, Revenue, Expenses)
- **Type Management**: Edit and delete custom account types

### 🎨 User Interface
- **Tree View**: Expandable/collapsible hierarchical display
- **Visual Indicators**: Color-coded account types and badges
- **Responsive Design**: Works on desktop and mobile devices
- **Tabbed Interface**: Separate tabs for accounts and account types

## Database Schema

### Account Types Table
```sql
CREATE TABLE account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Accounts Table
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    account_type_id UUID REFERENCES account_types(id) ON DELETE RESTRICT,
    parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_header BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### 1. Run Database Migration
Execute the database schema script:
```bash
psql -d your_database -f scripts/16-chart-of-accounts-schema.sql
```

### 2. Default Data
The migration script includes:
- 5 default account types (Assets, Liabilities, Equity, Revenue, Expenses)
- Main account categories (1000, 2000, 3000, 4000, 5000)
- Sample sub-accounts for each category

### 3. Access the System
Navigate to `/chart-of-accounts` in your application to access the Chart of Accounts interface.

## Usage Guide

### Creating Accounts

1. **Top-Level Account**: Click "Add Account" and select an account type
2. **Sub-Account**: Click "Add Sub" next to any account to create a child account
3. **Auto-Generate Code**: Use the "Auto Generate" button to create account codes automatically
4. **Header Account**: Toggle "Header Account" for accounts that group other accounts

### Managing Account Types

1. **View Types**: Switch to the "Account Types" tab
2. **Create Custom Type**: Click "Add Account Type" to create custom types
3. **Edit Types**: Click the edit icon on any account type
4. **Delete Types**: Delete custom types (system types cannot be deleted)

### Account Hierarchy

The system supports unlimited levels of hierarchy:
- **Level 0**: Main categories (1000, 2000, etc.)
- **Level 1**: Sub-categories (1100, 2100, etc.)
- **Level 2**: Specific accounts (1110, 2110, etc.)
- **Level 3+**: Further subdivisions as needed

## API Functions

### Account Management
- `getChartOfAccounts()`: Get all active accounts
- `createAccount(account)`: Create a new account
- `updateAccount(id, updates)`: Update an existing account
- `deleteAccount(id)`: Safely delete an account
- `canDeleteAccount(id)`: Check if account can be deleted
- `generateAccountCode(typeId, parentId?)`: Generate account code

### Account Type Management
- `getAccountTypes()`: Get all active account types
- `createAccountType(type)`: Create a new account type
- `updateAccountType(id, type)`: Update an existing account type
- `deleteAccountType(id)`: Delete an account type

### Utility Functions
- `getAccountPath(id)`: Get the full path of an account
- `getHierarchicalChartOfAccounts()`: Get accounts in hierarchical structure

## Account Code Generation

The system automatically generates account codes based on:
1. **Account Type**: Each type has a base number (1=Assets, 2=Liabilities, etc.)
2. **Parent Account**: If a parent is selected, uses parent's code as base
3. **Sequential Numbering**: Finds the next available number in the sequence

### Examples
- Asset account under main category: `1100`, `1101`, `1102`
- Liability account under main category: `2100`, `2101`, `2102`
- Sub-account under 1100: `11001`, `11002`, `11003`

## Best Practices

### Account Structure
1. **Start with Main Categories**: Create the 5 main account types first
2. **Use Header Accounts**: Create header accounts to group related accounts
3. **Consistent Naming**: Use clear, descriptive names for accounts
4. **Logical Hierarchy**: Organize accounts in a logical business structure

### Account Types
1. **Use System Types**: Start with the 5 built-in account types
2. **Create Custom Types**: Add custom types only when needed
3. **Consistent Normal Balance**: Ensure all accounts of the same type have the same normal balance

### Maintenance
1. **Regular Review**: Periodically review and clean up unused accounts
2. **Backup Before Changes**: Always backup before making structural changes
3. **Test Changes**: Test account changes in a development environment first

## Troubleshooting

### Common Issues

1. **Account Cannot Be Deleted**
   - Check if account has transactions
   - Check if account has sub-accounts
   - Use the delete check function to verify

2. **Account Code Conflicts**
   - Ensure account codes are unique
   - Use auto-generation to avoid conflicts
   - Check for soft-deleted accounts with same code

3. **Hierarchy Issues**
   - Verify parent-child relationships
   - Check account levels are calculated correctly
   - Ensure no circular references

### Error Messages

- **"Account cannot be deleted"**: Account has transactions or sub-accounts
- **"Account type in use"**: Cannot delete account type that's being used
- **"Code already exists"**: Account code must be unique
- **"Invalid parent account"**: Parent account must exist and be active

## Security Considerations

- **Soft Deletes**: Accounts are soft-deleted to maintain data integrity
- **Referential Integrity**: Foreign key constraints prevent orphaned records
- **Validation**: Input validation prevents invalid data entry
- **Audit Trail**: Created/updated timestamps track changes

## Future Enhancements

- **Account Templates**: Pre-built account structures for different industries
- **Bulk Operations**: Import/export account structures
- **Advanced Reporting**: Account usage statistics and reports
- **Integration**: Connect with external accounting systems
- **Multi-Company**: Support for multiple companies/entities



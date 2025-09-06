# Account Reports System

This document describes the comprehensive account reporting system that provides detailed financial information for each account and sub-account in the accounting system.

## Overview

The Account Reports System provides:
- **Individual Account Reports**: Detailed reports for each account showing balances, transactions, and activity
- **Account Summary Reports**: Overview of all accounts with key metrics
- **Hierarchical Reports**: Parent-child account relationships with consolidated balances
- **Transaction History**: Complete journal entry history for each account
- **Sub-account Analysis**: Detailed breakdown of parent account balances by sub-accounts

## Features

### 1. Account Detail Reports (`/account-reports/[accountId]`)
- **Account Summary**: Opening balance, current balance, net change
- **Transaction History**: Complete list of journal entries affecting the account
- **Running Balances**: Calculated balance after each transaction
- **Sub-account Details**: Expanded view of child accounts with their own reports
- **Date Range Filtering**: Customizable period for analysis
- **Export Functionality**: PDF/CSV export capabilities (to be implemented)

### 2. Account Reports Overview (`/account-reports`)
- **Summary Table**: All accounts with key metrics
- **Search & Filtering**: Find accounts by code, name, or type
- **View Modes**: 
  - Summary View: Flat list of all accounts
  - Hierarchical View: Parent-child relationships with indentation
- **Statistics Dashboard**: Total accounts, debits, credits, and transactions
- **Quick Navigation**: Direct links to individual account reports

### 3. Integration Points
- **Chart of Accounts**: "View Report" button for each account
- **Financial Reports**: New tab linking to account reports
- **Navigation**: Dedicated menu item for account reports

## Technical Implementation

### Backend Services (`lib/accounting-utils.ts`)

#### New Types
```typescript
export type AccountDetailReport = {
  account: Account
  opening_balance: number
  current_balance: number
  transactions: Array<{
    id: string
    entry_date: string
    entry_number: string
    description: string
    reference?: string
    debit_amount: number
    credit_amount: number
    running_balance: number
  }>
  summary: {
    total_debits: number
    total_credits: number
    net_change: number
    transaction_count: number
  }
  sub_accounts?: AccountDetailReport[]
}

export type AccountSummaryReport = {
  account_id: string
  account_code: string
  account_name: string
  account_type: string
  parent_account_id?: string
  opening_balance: number
  current_balance: number
  total_debits: number
  total_credits: number
  net_change: number
  transaction_count: number
  has_sub_accounts: boolean
  sub_accounts?: AccountSummaryReport[]
}
```

#### New Methods
- `getAccountDetailReport(accountId, startDate?, endDate?)`: Detailed report for a single account
- `getAccountSummaryReport(startDate?, endDate?)`: Summary for all accounts
- `getHierarchicalAccountReport(startDate?, endDate?)`: Hierarchical view with parent-child relationships

### Frontend Components

#### AccountDetailReport (`components/account-detail-report.tsx`)
- Displays detailed account information
- Transaction history table with running balances
- Expandable sub-account sections
- Date range controls
- Export functionality

#### AccountReportsOverview (`components/account-reports-overview.tsx`)
- Overview table of all accounts
- Search and filtering capabilities
- Summary statistics dashboard
- Links to individual reports

### Database Queries

The system queries the following tables:
- `accounts`: Account information and hierarchy
- `account_types`: Account type details and normal balance
- `journal_entries`: Journal entry headers
- `journal_entry_lines`: Individual transaction lines

## Usage Examples

### 1. View All Account Reports
1. Navigate to `/account-reports`
2. Set date range (defaults to current year)
3. Use search and filters to find specific accounts
4. Click "View Report" for detailed analysis

### 2. View Individual Account Report
1. From Chart of Accounts: Click "View Report" button
2. From Account Reports: Click account code or "View Report" link
3. Navigate to `/account-reports/[accountId]`
4. Adjust date range and refresh as needed

### 3. Analyze Sub-accounts
1. Open parent account report
2. Go to "Sub-Accounts" tab
3. Click expand button (▶️) to see details
4. View recent transactions and balances

## Balance Calculation Logic

### Normal Balance Rules
- **Assets & Expenses**: Debit normal balance
  - Debits increase balance, credits decrease balance
- **Liabilities, Equity & Revenue**: Credit normal balance
  - Credits increase balance, debits decrease balance

### Running Balance Calculation
```typescript
if (isDebitNormal) {
  runningBalance += debitAmount - creditAmount
} else {
  runningBalance += creditAmount - debitAmount
}
```

## Future Enhancements

### 1. Opening Balance Management
- Implement proper opening balance calculation
- Support for multiple accounting periods
- Historical balance tracking

### 2. Advanced Filtering
- Filter by transaction amount ranges
- Filter by specific journal entry types
- Filter by posting status

### 3. Export Functionality
- PDF generation with professional formatting
- CSV export for spreadsheet analysis
- Excel export with multiple worksheets

### 4. Comparative Analysis
- Period-over-period comparisons
- Budget vs. actual analysis
- Trend analysis and charts

### 5. Audit Trail
- Track changes to account balances
- User activity logging
- Approval workflows for adjustments

## Performance Considerations

### Database Optimization
- Indexes on `journal_entry_lines.account_id`
- Indexes on `journal_entries.entry_date`
- Efficient joins between tables

### Caching Strategy
- Cache account summaries for frequently accessed data
- Implement pagination for large transaction lists
- Lazy loading of sub-account details

### Query Optimization
- Use database views for complex aggregations
- Implement stored procedures for balance calculations
- Consider materialized views for summary data

## Security and Access Control

### User Permissions
- Role-based access to financial reports
- Audit logging for report access
- Data export restrictions

### Data Privacy
- Mask sensitive account information
- Implement row-level security
- Secure export file handling

## Troubleshooting

### Common Issues

#### 1. Balance Mismatches
- Check journal entry balancing
- Verify account type normal balance
- Review transaction posting dates

#### 2. Missing Transactions
- Verify date range selection
- Check account filtering
- Ensure journal entries are properly posted

#### 3. Performance Issues
- Reduce date range scope
- Use summary view for large datasets
- Check database indexes

### Debug Information
- Enable console logging for transaction details
- Verify account hierarchy relationships
- Check database connection and permissions

## Support and Maintenance

### Regular Maintenance
- Monitor database performance
- Update account hierarchies as needed
- Review and optimize queries
- Backup and archive historical data

### User Training
- Provide documentation for end users
- Conduct training sessions on report interpretation
- Create video tutorials for complex features

---

This account reporting system provides comprehensive financial analysis capabilities while maintaining performance and usability. Regular updates and enhancements will ensure it continues to meet evolving business needs.

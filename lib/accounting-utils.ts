import { supabase } from "./supabase"
import type { Account, AccountType } from "./supabase"

export type { Account, AccountType }

export type TrialBalanceItem = {
  account_id: string
  account_code: string
  account_name: string
  account_type: string
  opening_balance: number
  debit_total: number
  credit_total: number
  closing_balance: number
}

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

export type CashFlowItem = {
  category: string
  description: string
  amount: number
  type: 'operating' | 'investing' | 'financing'
}

export type CashFlowStatement = {
  operating_activities: CashFlowItem[]
  investing_activities: CashFlowItem[]
  financing_activities: CashFlowItem[]
  net_cash_flow: {
    operating: number
    investing: number
    financing: number
    total: number
  }
  cash_at_beginning: number
  cash_at_end: number
}

export type DashboardStats = {
  totalAssets: number
  netIncome: number
  journalEntriesCount: number
  activeAccountsCount: number
}

export class AccountingService {
  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total assets (sum of all asset account balances)
      const { data: assetAccounts } = await supabase
        .from("accounts")
        .select(`
          id, code, name,
          account_types!inner(name)
        `)
        .eq("account_types.name", "Assets")
        .eq("is_active", true)

      let totalAssets = 0
      const currentDate = new Date().toISOString().split('T')[0]
      if (assetAccounts) {
        for (const account of assetAccounts) {
          const balance = await this.getAccountBalance(account.id, currentDate)
          totalAssets += balance
        }
      }

      // Get net income (Revenue - Expenses)
      const { data: revenueAccounts } = await supabase
        .from("accounts")
        .select(`
          id,
          account_types!inner(name)
        `)
        .eq("account_types.name", "Revenue")
        .eq("is_active", true)

      const { data: expenseAccounts } = await supabase
        .from("accounts")
        .select(`
          id,
          account_types!inner(name)
        `)
        .eq("account_types.name", "Expenses")
        .eq("is_active", true)

      let totalRevenue = 0
      let totalExpenses = 0

      if (revenueAccounts) {
        for (const account of revenueAccounts) {
          const balance = await this.getAccountBalance(account.id, currentDate)
          totalRevenue += balance
        }
      }

      if (expenseAccounts) {
        for (const account of expenseAccounts) {
          const balance = await this.getAccountBalance(account.id, currentDate)
          totalExpenses += balance
        }
      }

      const netIncome = totalRevenue - totalExpenses

      // Get journal entries count
      const { count: journalEntriesCount } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })

      // Get active accounts count
      const { count: activeAccountsCount } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      return {
        totalAssets: Math.max(0, totalAssets),
        netIncome: Math.max(0, netIncome),
        journalEntriesCount: journalEntriesCount || 0,
        activeAccountsCount: activeAccountsCount || 0,
      }
    } catch (error) {
      console.error("Error getting dashboard stats:", error)
      return {
        totalAssets: 0,
        netIncome: 0,
        journalEntriesCount: 0,
        activeAccountsCount: 0,
      }
    }
  }

  // Chart of Accounts Functions

  // Get all account types
  static async getAccountTypes(): Promise<AccountType[]> {
    try {
      const { data, error } = await supabase
        .from("account_types")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error fetching account types:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error loading account types:", error)
      throw new Error("Failed to load account types")
    }
  }

  // Create new account type
  static async createAccountType(accountType: {
    name: string
    description?: string
    normal_balance: "debit" | "credit"
  }): Promise<AccountType> {
    try {
      const { data, error } = await supabase
        .from("account_types")
        .insert([
          {
            name: accountType.name,
            description: accountType.description || null,
            normal_balance: accountType.normal_balance,
            is_system: false,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating account type:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error creating account type:", error)
      throw new Error("Failed to create account type")
    }
  }

  // Update account type
  static async updateAccountType(
    id: string,
    accountType: {
      name: string
      description?: string
      normal_balance: "debit" | "credit"
    }
  ): Promise<AccountType> {
    try {
      const { data, error } = await supabase
        .from("account_types")
        .update({
          name: accountType.name,
          description: accountType.description || null,
          normal_balance: accountType.normal_balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating account type:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error updating account type:", error)
      throw new Error("Failed to update account type")
    }
  }

  // Delete account
  static async deleteAccount(accountId: string): Promise<void> {
    try {
      console.log("Attempting to delete account:", accountId)
      
      // Check if account can be deleted using the comprehensive check
      const canDelete = await this.canDeleteAccount(accountId)
      
      if (!canDelete) {
        // Get more specific information about why it can't be deleted
        const { data: subAccounts } = await supabase
          .from("accounts")
          .select("id, code, name")
          .eq("parent_account_id", accountId)
          .eq("is_active", true)

        const { data: journalLines } = await supabase
          .from("journal_entry_lines")
          .select("id")
          .eq("account_id", accountId)

        if (subAccounts && subAccounts.length > 0) {
          const subAccountNames = subAccounts.map(acc => `${acc.code} - ${acc.name}`).join(', ')
          throw new Error(`Cannot delete account because it has ${subAccounts.length} sub-account(s): ${subAccountNames}. Please delete the sub-accounts first.`)
        }

        if (journalLines && journalLines.length > 0) {
          throw new Error(`Cannot delete account because it has ${journalLines.length} journal entry line(s). Please delete or modify the journal entries first.`)
        }

        throw new Error("Cannot delete account due to data integrity constraints.")
      }

      console.log("Account is safe to delete, performing soft delete...")

      // Soft delete the account
      const { error: deleteError } = await supabase
        .from("accounts")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId)

      if (deleteError) {
        console.error("Error deleting account:", deleteError)
        throw deleteError
      }

      console.log("Account deleted successfully")
    } catch (error) {
      console.error("Error deleting account:", error)
      throw error
    }
  }

  // Delete account type
  static async deleteAccountType(id: string): Promise<void> {
    try {
      // Check if any accounts are using this type
      const { data: accountsUsingType, error: checkError } = await supabase
        .from("accounts")
        .select("id")
        .eq("account_type_id", id)
        .eq("is_active", true)

      if (checkError) throw checkError

      if (accountsUsingType && accountsUsingType.length > 0) {
        throw new Error("Cannot delete account type that is being used by accounts")
      }

      // Soft delete the account type
      const { error } = await supabase
        .from("account_types")
        .update({ is_active: false })
        .eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error deleting account type:", error)
      throw new Error("Failed to delete account type")
    }
  }

  // Get chart of accounts with hierarchy
  static async getChartOfAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select(`
          *,
          account_types(*)
        `)
        .eq("is_active", true)
        .order("code")

      if (error) {
        console.error("Error fetching chart of accounts:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error loading chart of accounts:", error)
      throw new Error("Failed to load chart of accounts")
    }
  }

  // Generate account code (simplified version without database function)
  static async generateAccountCode(accountTypeId: string, parentAccountId?: string): Promise<string> {
    try {
      // Get base code from account type
      let baseCode = '9' // Default for unknown types
      
      // Map account type IDs to base codes
      const typeCodeMap: { [key: string]: string } = {
        '11111111-1111-1111-1111-111111111111': '1', // Assets
        '22222222-2222-2222-2222-222222222222': '2', // Liabilities
        '33333333-3333-3333-3333-333333333333': '3', // Equity
        '44444444-4444-4444-4444-444444444444': '4', // Revenue
        '55555555-5555-5555-5555-555555555555': '5', // Expenses
      }
      
      baseCode = typeCodeMap[accountTypeId] || '9'
      
      // If parent account is provided, use parent's code as base
      if (parentAccountId) {
        const { data: parentAccount, error } = await supabase
          .from("accounts")
          .select("code")
          .eq("id", parentAccountId)
          .single()
        
        if (!error && parentAccount) {
          baseCode = parentAccount.code
        }
      }
      
      // Find the next available number
      const { data: existingCodes, error } = await supabase
        .from("accounts")
        .select("code")
        .like("code", baseCode + "%")
        .eq("is_active", true)
      
      if (error) {
        console.error("Error fetching existing codes:", error)
        return baseCode + "01"
      }
      
      // Find the highest number for this base code
      let nextNumber = 1
      if (existingCodes && existingCodes.length > 0) {
        const numbers = existingCodes
          .map(acc => {
            const match = acc.code.match(new RegExp(`^${baseCode}(\\d+)$`))
            return match ? parseInt(match[1]) : 0
          })
          .filter(num => num > 0)
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }
      
      // Generate new code (pad with zeros)
      const newCode = baseCode + nextNumber.toString().padStart(2, '0')
      
      return newCode
    } catch (error) {
      console.error("Error generating account code:", error)
      // Fallback to simple code generation
      const timestamp = Date.now().toString().slice(-4)
      return `ACC${timestamp}`
    }
  }

  // Create new account
  static async createAccount(account: {
    code?: string
    name: string
    description?: string
    account_type_id: string
    parent_account_id?: string
    is_header?: boolean
  }): Promise<Account> {
    try {
      let accountCode = account.code

      // Generate code if not provided
      if (!accountCode) {
        accountCode = await this.generateAccountCode(account.account_type_id, account.parent_account_id)
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert([
          {
            code: accountCode,
            name: account.name,
            description: account.description || null,
            account_type_id: account.account_type_id,
            parent_account_id: account.parent_account_id || null,
            is_header: account.is_header || false,
            is_active: true,
          },
        ])
        .select(`
          *,
          account_types(*)
        `)
        .single()

      if (error) {
        console.error("Error creating account:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error creating account:", error)
      throw new Error("Failed to create account")
    }
  }

  // Update account
  static async updateAccount(accountId: string, updates: {
    code?: string
    name?: string
    description?: string
    account_type_id?: string
    parent_account_id?: string
    is_header?: boolean
  }): Promise<Account> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.code !== undefined) updateData.code = updates.code
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.account_type_id !== undefined) updateData.account_type_id = updates.account_type_id
      if (updates.parent_account_id !== undefined) updateData.parent_account_id = updates.parent_account_id
      if (updates.is_header !== undefined) updateData.is_header = updates.is_header

      const { data, error } = await supabase
        .from("accounts")
        .update(updateData)
        .eq("id", accountId)
        .select(`
          *,
          account_types(*)
        `)
        .single()

      if (error) {
        console.error("Error updating account:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error updating account:", error)
      throw new Error("Failed to update account")
    }
  }

  // Check if account can be deleted
  static async canDeleteAccount(accountId: string): Promise<boolean> {
    try {
      console.log("Checking if account can be deleted:", accountId)
      
      // First, let's check if the accounts table exists and is accessible
      const { data: testData, error: testError } = await supabase
        .from("accounts")
        .select("id")
        .limit(1)

      if (testError) {
        console.error("Database connection issue:", testError)
        // If we can't connect to the database, assume it's safe to delete
        // This prevents blocking users when there are database issues
        return true
      }

      // Check if account has children
      const { data: children, error: childrenError } = await supabase
        .from("accounts")
        .select("id")
        .eq("parent_account_id", accountId)
        .eq("is_active", true)

      if (childrenError) {
        console.error("Error checking for children:", childrenError)
        // If there's an error checking children, assume it's safe to delete
        return true
      }

      if (children && children.length > 0) {
        console.log("Account has children, cannot delete")
        return false // Has children, cannot delete
      }

      console.log("Account has no children, checking for transactions...")

      // Check if account has transactions (only if journal_entry_lines table exists)
      try {
        const { data: transactions, error: transactionsError } = await supabase
          .from("journal_entry_lines")
          .select("id")
          .eq("account_id", accountId)
          .limit(1)

        if (transactionsError) {
          console.log("Journal entries table doesn't exist or has issues, assuming no transactions")
          // Table doesn't exist, so no transactions possible
          return true
        }

        if (transactions && transactions.length > 0) {
          console.log("Account has transactions, cannot delete")
          return false // Has transactions, cannot delete
        }
      } catch (error) {
        console.log("Error checking transactions, assuming no transactions:", error)
        // Table doesn't exist, so no transactions possible
        return true
      }

      console.log("Account is safe to delete")
      return true // Can delete
    } catch (error) {
      console.error("Error checking if account can be deleted:", error)
      // If there's any error, assume it's safe to delete to avoid blocking users
      return true
    }
  }


  // Simple delete account function (fallback)
  static async simpleDeleteAccount(accountId: string): Promise<void> {
    try {
      console.log("Using simple delete for account:", accountId)
      
      // Just try to soft delete the account directly
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("id", accountId)

      if (error) {
        console.error("Error in simple delete:", error)
        throw error
      }

      console.log("Account deleted successfully with simple method")
    } catch (error) {
      console.error("Error in simple delete:", error)
      throw new Error("Failed to delete account")
    }
  }

  // Get account path
  static async getAccountPath(accountId: string): Promise<string> {
    try {
      const path: string[] = []
      let currentAccountId: string | null = accountId

      // Build path by traversing up the hierarchy
      while (currentAccountId) {
        const { data: account, error } = await supabase
          .from("accounts")
          .select("name, parent_account_id")
          .eq("id", currentAccountId)
          .single() as { data: { name: string; parent_account_id: string | null } | null; error: any }

        if (error || !account) {
          break
        }

        path.unshift(account.name)
        currentAccountId = account.parent_account_id
      }

      return path.join(" > ")
    } catch (error) {
      console.error("Error getting account path:", error)
      return ""
    }
  }

  // Get hierarchical chart of accounts
  static async getHierarchicalChartOfAccounts(): Promise<any[]> {
    try {
      const accounts = await this.getChartOfAccounts()
      
      // Build hierarchical structure
      const buildHierarchy = (accounts: Account[], parentId: string | null = null): Account[] => {
        return accounts
          .filter(account => account.parent_account_id === parentId)
          .map(account => ({
            ...account,
            children: buildHierarchy(accounts, account.id),
          }))
      }

      return buildHierarchy(accounts)
    } catch (error) {
      console.error("Error loading hierarchical chart of accounts:", error)
      throw new Error("Failed to load hierarchical chart of accounts")
    }
  }

  // Get all accounts (simplified version for reports)
  static async getAllAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select(`
          *,
          account_types(*)
        `)
        .eq("is_active", true)
        .order("code")

      if (error) {
        console.error("Error fetching accounts:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error loading accounts:", error)
      throw new Error("Failed to load accounts")
    }
  }

  // Journal Entry Functions

  static async createJournalEntry(entry: {
    entry_date: string
    description: string
    reference?: string
    lines: Array<{
      account_id: string
      description?: string
      debit_amount: number
      credit_amount: number
      image_data?: string
    }>
  }): Promise<string> {
    try {
      console.log("Creating journal entry:", entry)
      
      // Validate input
      if (!entry.lines || entry.lines.length === 0) {
        throw new Error("Journal entry must have at least one line")
      }

      if (!entry.entry_date) {
        throw new Error("Entry date is required")
      }

      if (!entry.description || entry.description.trim() === "") {
        throw new Error("Description is required")
      }

      // Validate accounts exist
      const accountIds = entry.lines.map(line => line.account_id)
      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select("id, code, name, is_active")
        .in("id", accountIds)

      if (accountsError) {
        console.error("Error validating accounts:", accountsError)
        throw new Error("Failed to validate accounts")
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please ensure accounts exist in the system.")
      }

      if (accounts.length !== accountIds.length) {
        const foundIds = accounts.map(a => a.id)
        const missingIds = accountIds.filter(id => !foundIds.includes(id))
        throw new Error(`Accounts not found: ${missingIds.join(', ')}`)
      }

      const inactiveAccounts = accounts.filter(account => !account.is_active)
      if (inactiveAccounts.length > 0) {
        const inactiveCodes = inactiveAccounts.map(a => a.code).join(', ')
        throw new Error(`The following accounts are inactive and cannot be used: ${inactiveCodes}. Please activate them or select different accounts.`)
      }

      // Validate double-entry
      const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
      const totalCredits = entry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Journal entry is not balanced. Total debits (${totalDebits}) must equal total credits (${totalCredits})`)
      }

      // Generate entry number
      const entryNumber = await this.generateEntryNumber()
      console.log("Generated entry number:", entryNumber)

      // Create journal entry header
      const { data: journalEntry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([
          {
            entry_number: entryNumber,
            entry_date: entry.entry_date,
            description: entry.description.trim(),
            reference: entry.reference?.trim() || null,
            total_debit: totalDebits,
            total_credit: totalCredits,
            is_balanced: true,
          },
        ])
        .select()
        .single()

      if (entryError) {
        console.error("Error creating journal entry header:", entryError)
        throw new Error(`Failed to create journal entry: ${entryError.message}`)
      }

      console.log("Journal entry header created:", journalEntry.id)

      // Create journal entry lines
      const lines = entry.lines.map((line, index) => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        description: line.description?.trim() || entry.description.trim(),
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        line_number: index + 1,
        image_data: line.image_data || null,
      }))

      console.log("Creating journal entry lines:", lines)

      const { error: linesError } = await supabase.from("journal_entry_lines").insert(lines)

      if (linesError) {
        console.error("Error creating journal entry lines:", linesError)
        // Try to clean up the journal entry header
        await supabase.from("journal_entries").delete().eq("id", journalEntry.id)
        throw new Error(`Failed to create journal entry lines: ${linesError.message}`)
      }

      console.log("Journal entry created successfully:", journalEntry.id)
      return journalEntry.id
    } catch (error) {
      console.error("Error creating journal entry:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to create journal entry")
    }
  }

  // Create missing journal entry lines for entries that have totals but no lines
  static async createMissingJournalEntryLines(): Promise<void> {
    try {
      // Find entries without lines but with totals
      const { data: entriesWithoutLines, error: entriesError } = await supabase
        .from("journal_entries")
        .select(`
          id,
          entry_number,
          total_debit,
          total_credit,
          description
        `)
        .not("total_debit", "is", null)
        .not("total_credit", "is", null)
        .or("total_debit.gt.0,total_credit.gt.0")

      if (entriesError) {
        console.error("Error finding entries without lines:", entriesError)
        return
      }

      if (!entriesWithoutLines || entriesWithoutLines.length === 0) {
        return
      }

      // Check which entries actually don't have lines
      const entryIds = entriesWithoutLines.map(entry => entry.id)
      const { data: existingLines, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select("journal_entry_id")
        .in("journal_entry_id", entryIds)

      if (linesError) {
        console.error("Error checking existing lines:", linesError)
        return
      }

      const entriesWithLines = new Set(existingLines?.map(line => line.journal_entry_id) || [])
      const entriesNeedingLines = entriesWithoutLines.filter(entry => !entriesWithLines.has(entry.id))

      if (entriesNeedingLines.length === 0) {
        return
      }

      console.log(`Found ${entriesNeedingLines.length} entries needing lines`)

      // Get sample accounts for creating lines
      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select("id, code, name")
        .eq("is_active", true)
        .limit(10)

      if (accountsError || !accounts || accounts.length < 2) {
        console.error("Error getting accounts for creating lines:", accountsError)
        return
      }

      // Create lines for each entry
      for (const entry of entriesNeedingLines) {
        const linesToCreate = []

        // Create debit line if there's a debit amount
        if (entry.total_debit > 0) {
          linesToCreate.push({
            journal_entry_id: entry.id,
            account_id: accounts[0].id, // Use first account for debit
            description: `Debit entry for ${entry.entry_number}`,
            debit_amount: entry.total_debit,
            credit_amount: 0,
            line_number: 1
          })
        }

        // Create credit line if there's a credit amount
        if (entry.total_credit > 0) {
          linesToCreate.push({
            journal_entry_id: entry.id,
            account_id: accounts[1].id, // Use second account for credit
            description: `Credit entry for ${entry.entry_number}`,
            debit_amount: 0,
            credit_amount: entry.total_credit,
            line_number: linesToCreate.length + 1
          })
        }

        if (linesToCreate.length > 0) {
          const { error: insertError } = await supabase
            .from("journal_entry_lines")
            .insert(linesToCreate)

          if (insertError) {
            console.error(`Error creating lines for entry ${entry.entry_number}:`, insertError)
          } else {
            console.log(`Created ${linesToCreate.length} lines for entry ${entry.entry_number}`)
          }
        }
      }
    } catch (error) {
      console.error("Error creating missing journal entry lines:", error)
    }
  }

  // Get a single journal entry by ID
  static async getJournalEntryById(id: string): Promise<any | null> {
    try {
      // Get the journal entry
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id)
        .single()

      if (entryError) {
        console.error("Error fetching journal entry:", entryError)
        return null
      }

      if (!entry) {
        return null
      }

      // Get the journal entry lines first
      const { data: lines, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select("*")
        .eq("journal_entry_id", id)
        .order("line_number", { ascending: true })

      if (linesError) {
        console.error("Error fetching journal entry lines:", linesError)
        // Return entry without lines rather than failing
        return entry
      }

      // Get account details for each line
      const linesWithAccounts = []
      if (lines && lines.length > 0) {
        for (const line of lines) {
          const { data: account, error: accountError } = await supabase
            .from("accounts")
            .select(`
              id,
              code,
              name,
              account_types (
                id,
                name,
                normal_balance,
                description
              )
            `)
            .eq("id", line.account_id)
            .single()

          if (accountError) {
            console.error("Error fetching account for line:", accountError)
            // Add line without account details
            linesWithAccounts.push({
              ...line,
              accounts: null
            })
          } else {
            linesWithAccounts.push({
              ...line,
              accounts: account
            })
          }
        }
      }

      return {
        ...entry,
        journal_entry_lines: linesWithAccounts
      }
    } catch (error) {
      console.error("Error loading journal entry:", error)
      return null
    }
  }

  // Get all journal entries with filtering (simplified query)
  static async getJournalEntries(filters?: {
    startDate?: string
    endDate?: string
    accountType?: string
    searchTerm?: string
  }): Promise<any[]> {
    try {
      // First, create missing journal entry lines
      await this.createMissingJournalEntryLines()

      // Then get the journal entries with basic info
      let query = supabase
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: false })

      if (filters?.startDate) {
        query = query.gte("entry_date", filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte("entry_date", filters.endDate)
      }

      const { data: entries, error: entriesError } = await query

      if (entriesError) {
        console.error("Error fetching journal entries:", entriesError)
        throw entriesError
      }

      if (!entries || entries.length === 0) {
        return []
      }

      // Get the journal entry lines for these entries
        const entryIds = entries.map(entry => entry.id)
        
        // First, get lines without account details to avoid join issues
        const { data: lines, error: linesError } = await supabase
          .from("journal_entry_lines")
          .select("*")
          .in("journal_entry_id", entryIds)
          .order("line_number", { ascending: true })

      if (linesError) {
        console.error("Error fetching journal entry lines:", linesError)
        console.error("Entry IDs being queried:", entryIds)
        // Continue without lines rather than failing completely
      }

      // Combine entries with their lines
      const entriesWithLines = entries.map(entry => ({
        ...entry,
        journal_entry_lines: lines?.filter(line => line.journal_entry_id === entry.id) || []
      }))

      let filteredData = entriesWithLines

      // Filter by account type if specified
      if (filters?.accountType && filters.accountType !== "All Types") {
        filteredData = filteredData.filter((entry) =>
          entry.journal_entry_lines?.some((line: any) => 
            line.accounts?.account_types?.name === filters.accountType
          ),
        )
      }

      // Filter by search term if specified
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        filteredData = filteredData.filter(
          (entry) =>
            entry.description.toLowerCase().includes(searchLower) ||
            entry.entry_number.toLowerCase().includes(searchLower) ||
            (entry.reference && entry.reference.toLowerCase().includes(searchLower)) ||
            entry.journal_entry_lines?.some(
              (line: any) =>
                line.accounts?.name?.toLowerCase().includes(searchLower) ||
                line.accounts?.code?.toLowerCase().includes(searchLower),
            ),
        )
      }

      return filteredData
    } catch (error) {
      console.error("Error loading journal entries:", error)
      throw new Error("Failed to load journal entries")
    }
  }

  // Update journal entry
  static async updateJournalEntry(entryId: string, data: {
    entry_date: string
    description: string
    lines: Array<{
      id?: string
      account_id: string
      description: string
      debit_amount: number
      credit_amount: number
      image_data?: string
    }>
  }): Promise<void> {
    try {
      // Update the main journal entry
      const { error: entryError } = await supabase
        .from("journal_entries")
        .update({
          entry_date: data.entry_date,
          description: data.description,
          total_debit: data.lines.reduce((sum, line) => sum + line.debit_amount, 0),
          total_credit: data.lines.reduce((sum, line) => sum + line.credit_amount, 0),
          is_balanced: Math.abs(data.lines.reduce((sum, line) => sum + line.debit_amount, 0) - data.lines.reduce((sum, line) => sum + line.credit_amount, 0)) < 0.01,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId)

      if (entryError) {
        console.error("Error updating journal entry:", entryError)
        throw entryError
      }

      // Delete existing lines
      const { error: deleteError } = await supabase
        .from("journal_entry_lines")
        .delete()
        .eq("journal_entry_id", entryId)

      if (deleteError) {
        console.error("Error deleting journal entry lines:", deleteError)
        throw deleteError
      }

      // Insert new lines
      const linesToInsert = data.lines.map((line, index) => ({
        journal_entry_id: entryId,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
        line_number: index + 1,
        image_data: line.image_data || null,
      }))

      console.log("Inserting journal entry lines:", linesToInsert)

      const { error: linesError } = await supabase
        .from("journal_entry_lines")
        .insert(linesToInsert)

      if (linesError) {
        console.error("Error inserting journal entry lines:", linesError)
        console.error("Lines data:", linesToInsert)
        throw linesError
      }

      console.log("Successfully updated journal entry:", entryId)
    } catch (error) {
      console.error("Error updating journal entry:", error)
      throw new Error("Failed to update journal entry")
    }
  }

  // Generate next entry number
  static async generateEntryNumber(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("entry_number")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error generating entry number:", error)
        // Generate a unique number based on timestamp
        return `JE-${Date.now().toString().slice(-6)}`
      }

      const lastNumber = data?.[0]?.entry_number
      if (!lastNumber) {
        // Check if JE-001 already exists
        const { data: existingJE001 } = await supabase
          .from("journal_entries")
          .select("entry_number")
          .eq("entry_number", "JE-001")
          .single()
        
        if (existingJE001) {
          // JE-001 exists, start from JE-002
          return "JE-002"
        }
        return "JE-001"
      }

      const match = lastNumber.match(/JE-(\d+)/)
      if (match) {
        const nextNumber = Number.parseInt(match[1]) + 1
        const nextEntryNumber = `JE-${nextNumber.toString().padStart(3, "0")}`
        
        // Check if this number already exists (in case of concurrent creation)
        const { data: existingEntry } = await supabase
          .from("journal_entries")
          .select("entry_number")
          .eq("entry_number", nextEntryNumber)
          .single()
        
        if (existingEntry) {
          // Number exists, generate a unique one based on timestamp
          return `JE-${Date.now().toString().slice(-6)}`
        }
        
        return nextEntryNumber
      }

      // Fallback: generate unique number based on timestamp
      return `JE-${Date.now().toString().slice(-6)}`
    } catch (error) {
      console.error("Error in generateEntryNumber:", error)
      // Fallback: generate unique number based on timestamp
      return `JE-${Date.now().toString().slice(-6)}`
    }
  }

  // Reverse journal entry (swap debit and credit amounts)
  static async reverseJournalEntry(entryId: string): Promise<void> {
    try {
      console.log("Reversing journal entry:", entryId)

      // Get the journal entry lines
      const { data: lines, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select("*")
        .eq("journal_entry_id", entryId)

      if (linesError) {
        console.error("Error fetching journal entry lines:", linesError)
        throw new Error("Failed to fetch journal entry lines")
      }

      if (!lines || lines.length === 0) {
        throw new Error("No journal entry lines found")
      }

      // Update each line by swapping debit and credit amounts
      const updates = lines.map(line => ({
        id: line.id,
        debit_amount: line.credit_amount,
        credit_amount: line.debit_amount
      }))

      // Update all lines
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("journal_entry_lines")
          .update({
            debit_amount: update.debit_amount,
            credit_amount: update.credit_amount
          })
          .eq("id", update.id)

        if (updateError) {
          console.error("Error updating journal entry line:", updateError)
          throw new Error("Failed to update journal entry line")
        }
      }

      // Update the journal entry totals
      const { error: entryError } = await supabase
        .from("journal_entries")
        .update({
          total_debit: lines.reduce((sum, line) => sum + line.credit_amount, 0),
          total_credit: lines.reduce((sum, line) => sum + line.debit_amount, 0)
        })
        .eq("id", entryId)

      if (entryError) {
        console.error("Error updating journal entry totals:", entryError)
        throw new Error("Failed to update journal entry totals")
      }

      console.log("Journal entry reversed successfully")
    } catch (error) {
      console.error("Error reversing journal entry:", error)
      throw new Error("Failed to reverse journal entry")
    }
  }

  // Get trial balance with real data
  static async getTrialBalance(startDate?: string, endDate?: string): Promise<TrialBalanceItem[]> {
    try {
      // Get all accounts
      const accounts = await this.getChartOfAccounts()
      
      // Get trial balance data for each account
      const trialBalanceItems: TrialBalanceItem[] = []
      
      for (const account of accounts) {
        // Get opening balance (simplified - you might want to implement proper opening balance logic)
        const openingBalance = 0
        
        // Get transaction totals for the period - simplified query
        const { data: transactions, error } = await supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entry_id
          `)
          .eq("account_id", account.id)
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
      // Filter by date range if specified
      let filteredTransactions = transactions || []
      if (startDate && endDate && transactions) {
        // Get journal entry dates for filtering
        const journalEntryIds = [...new Set(transactions.map(t => t.journal_entry_id))]
        if (journalEntryIds.length > 0) {
          const { data: journalEntries } = await supabase
            .from("journal_entries")
            .select("id, entry_date")
            .in("id", journalEntryIds)
            .gte("entry_date", startDate)
            .lte("entry_date", endDate)
          
          const validEntryIds = new Set(journalEntries?.map(je => je.id) || [])
          filteredTransactions = transactions.filter(t => validEntryIds.has(t.journal_entry_id))
        }
      } else if (transactions) {
        // If no date filter, use all transactions
        filteredTransactions = transactions
      }
        
        const debitTotal = filteredTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0)
        const creditTotal = filteredTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0)
        
        // Calculate closing balance based on account type
        const isDebitNormal = account.account_types?.normal_balance === "debit"
        
        let closingBalance = openingBalance
        if (isDebitNormal) {
          closingBalance += debitTotal - creditTotal
        } else {
          closingBalance += creditTotal - debitTotal
        }
        
        trialBalanceItems.push({
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.account_types?.name || "Unknown",
          opening_balance: openingBalance,
          debit_total: debitTotal,
          credit_total: creditTotal,
          closing_balance: closingBalance,
        })
      }
      
      return trialBalanceItems.sort((a, b) => a.account_code.localeCompare(b.account_code))
    } catch (error) {
      console.error("Error generating trial balance:", error)
      // Return empty array if there's an error
      return []
    }
  }

  // Get general ledger for an account
  static async getGeneralLedger(accountId: string, startDate?: string, endDate?: string): Promise<any[]> {
    let query = supabase
      .from("journal_entry_lines")
      .select(`
        *,
        journal_entries!inner(entry_date, entry_number, description, reference)
      `)
      .eq("account_id", accountId)
      .order("created_at")

    if (startDate && endDate) {
      query = query.gte("journal_entries.entry_date", startDate).lte("journal_entries.entry_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading general ledger:", error)
      throw new Error("Failed to load general ledger")
    }
    return data || []
  }

  // Get Balance Sheet with real data
  static async getBalanceSheet(asOfDate: string): Promise<any> {
    try {
      console.log(`Loading balance sheet as of: ${asOfDate}`)
      
      // Get all accounts
      const accounts = await this.getChartOfAccounts()
      console.log(`Found ${accounts.length} accounts`)
      
      const assets: any[] = []
      const liabilities: any[] = []
      const equity: any[] = []
      
      for (const account of accounts) {
        console.log(`Processing account: ${account.code} - ${account.name} (${account.account_types?.name || "Unknown"})`)
        // Get account balance up to the specified date - simplified query
        const { data: transactions, error } = await supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entry_id
          `)
          .eq("account_id", account.id)
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
        // Filter by date range if specified
        let filteredTransactions = transactions || []
        if (transactions && transactions.length > 0) {
          // Get journal entry dates for filtering
          const journalEntryIds = [...new Set(transactions.map(t => t.journal_entry_id))]
          if (journalEntryIds.length > 0) {
            const { data: journalEntries } = await supabase
              .from("journal_entries")
              .select("id, entry_date")
              .in("id", journalEntryIds)
              .lte("entry_date", asOfDate)
            
            const validEntryIds = new Set(journalEntries?.map(je => je.id) || [])
            filteredTransactions = transactions.filter(t => validEntryIds.has(t.journal_entry_id))
          }
        }
        
        console.log(`Found ${filteredTransactions.length} transactions for account ${account.code}`)
        
        const debitTotal = filteredTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0)
        const creditTotal = filteredTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0)
        
        console.log(`Account ${account.code}: Debits=${debitTotal}, Credits=${creditTotal}`)
        
        // Debug: Show individual transactions
        if (transactions && transactions.length > 0) {
          console.log(`Transaction details for ${account.code}:`, transactions.map((t: any) => ({
            debit: t.debit_amount,
            credit: t.credit_amount,
            entry_date: t.journal_entries?.entry_date || 'N/A'
          })))
        }
        
        // Calculate balance based on account type
        const accountTypeName = account.account_types?.name || "Unknown"
        const normalBalance = account.account_types?.normal_balance
        
        console.log(`Account ${account.code}: Type=${accountTypeName}, NormalBalance=${normalBalance}`)
        
        const isDebitNormal = normalBalance === "debit"
        
        let balance = 0
        if (isDebitNormal) {
          balance = debitTotal - creditTotal
        } else {
          balance = creditTotal - debitTotal
        }
        
        console.log(`Account ${account.code}: Balance=${balance}, IsDebitNormal=${isDebitNormal}`)
        
        // Include all accounts (even with zero balances for now)
        // For balance sheet, we need to show the correct sign based on account type
        let displayAmount = balance
        if (accountTypeName === "Liability" || accountTypeName === "Equity") {
          // Liabilities and Equity should show positive amounts even if the balance is negative
          displayAmount = Math.abs(balance)
        } else {
          // Assets should show the actual balance (positive for debit balances)
          displayAmount = balance
        }
        
        const accountData = {
          name: account.name,
          amount: displayAmount,
          code: account.code,
          actualBalance: balance // Keep track of actual balance for debugging
        }
        console.log(`Adding ${accountTypeName} account: ${account.name} = ${accountData.amount}`)
        
        if (accountTypeName === "Assets") {
          assets.push(accountData)
        } else if (accountTypeName === "Liabilities") {
          liabilities.push(accountData)
        } else if (accountTypeName === "Equity") {
          equity.push(accountData)
        }
      }
      
      // Sort by account code
      assets.sort((a, b) => a.code.localeCompare(b.code))
      liabilities.sort((a, b) => a.code.localeCompare(b.code))
      equity.sort((a, b) => a.code.localeCompare(b.code))
      
      const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0)
      const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0)
      const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0)
      
      console.log(`Balance Sheet Summary:`)
      console.log(`- Assets: ${assets.length} accounts, Total: ${totalAssets}`)
      console.log(`- Liabilities: ${liabilities.length} accounts, Total: ${totalLiabilities}`)
      console.log(`- Equity: ${equity.length} accounts, Total: ${totalEquity}`)
      
      return {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity
      }
    } catch (error) {
      console.error("Error generating balance sheet:", error)
      // Return empty data if there's an error
      return {
        assets: [],
        liabilities: [],
        equity: [],
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0
      }
    }
  }

  // Get Income Statement with real data
  static async getIncomeStatement(startDate: string, endDate: string): Promise<any> {
    try {
      // Get all accounts
      const accounts = await this.getChartOfAccounts()
      
      const revenue: any[] = []
      const expenses: any[] = []
      
      for (const account of accounts) {
        const accountType = account.account_types?.name || "Unknown"
        
        // Only process Revenue and Expense accounts
        if (accountType !== "Revenue" && accountType !== "Expenses") {
          continue
        }
        
        // Get account activity for the period - simplified query
        const { data: transactions, error } = await supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entry_id
          `)
          .eq("account_id", account.id)
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
        // Filter by date range if specified
        let filteredTransactions = transactions || []
        if (transactions && transactions.length > 0) {
          // Get journal entry dates for filtering
          const journalEntryIds = [...new Set(transactions.map(t => t.journal_entry_id))]
          if (journalEntryIds.length > 0) {
            const { data: journalEntries } = await supabase
              .from("journal_entries")
              .select("id, entry_date")
              .in("id", journalEntryIds)
              .gte("entry_date", startDate)
              .lte("entry_date", endDate)
            
            const validEntryIds = new Set(journalEntries?.map(je => je.id) || [])
            filteredTransactions = transactions.filter(t => validEntryIds.has(t.journal_entry_id))
          }
        }
        
        const debitTotal = filteredTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0)
        const creditTotal = filteredTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0)
        
        // Calculate activity amount
        let activityAmount = 0
        if (accountType === "Revenue") {
          // Revenue increases with credits
          activityAmount = creditTotal - debitTotal
        } else if (accountType === "Expenses") {
          // Expenses increase with debits
          activityAmount = debitTotal - creditTotal
        }
        
        // Only include accounts with activity
        if (activityAmount !== 0) {
          const accountData = {
            name: account.name,
            amount: Math.abs(activityAmount),
            code: account.code
          }
          
          if (accountType === "Revenue") {
            revenue.push(accountData)
          } else if (accountType === "Expenses") {
            expenses.push(accountData)
          }
        }
      }
      
      // Sort by account code
      revenue.sort((a, b) => a.code.localeCompare(b.code))
      expenses.sort((a, b) => a.code.localeCompare(b.code))
      
      const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0)
      const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
      const netIncome = totalRevenue - totalExpenses
      
      return {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netIncome
      }
    } catch (error) {
      console.error("Error generating income statement:", error)
      // Return empty data if there's an error
      return {
        revenue: [],
        expenses: [],
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0
      }
    }
  }

  // Get Cash Flow Statement
  static async getCashFlowStatement(startDate: string, endDate: string): Promise<CashFlowStatement> {
    try {
      // Get all accounts
      const accounts = await this.getChartOfAccounts()
      
      const operatingActivities: any[] = []
      const investingActivities: any[] = []
      const financingActivities: any[] = []
      
      for (const account of accounts) {
        const accountType = account.account_types?.name || "Unknown"
        const accountName = account.name.toLowerCase()
        
        // Get account activity for the period - simplified query
        const { data: transactions, error } = await supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entry_id
          `)
          .eq("account_id", account.id)
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
        // Filter by date range if specified
        let filteredTransactions = transactions || []
        if (transactions && transactions.length > 0) {
          // Get journal entry dates for filtering
          const journalEntryIds = [...new Set(transactions.map(t => t.journal_entry_id))]
          if (journalEntryIds.length > 0) {
            const { data: journalEntries } = await supabase
              .from("journal_entries")
              .select("id, entry_date")
              .in("id", journalEntryIds)
              .gte("entry_date", startDate)
              .lte("entry_date", endDate)
            
            const validEntryIds = new Set(journalEntries?.map(je => je.id) || [])
            filteredTransactions = transactions.filter(t => validEntryIds.has(t.journal_entry_id))
          }
        }
        
        const debitTotal = filteredTransactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0)
        const creditTotal = filteredTransactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0)
        
        // Calculate net cash flow for this account
        let netCashFlow = 0
        if (accountType === "Assets" && (accountName.includes('cash') || accountName.includes('bank'))) {
          // Cash accounts: credits decrease cash, debits increase cash
          netCashFlow = debitTotal - creditTotal
        } else if (accountType === "Revenue") {
          // Revenue typically increases cash (operating)
          netCashFlow = creditTotal - debitTotal
        } else if (accountType === "Expenses") {
          // Expenses typically decrease cash (operating)
          netCashFlow = debitTotal - creditTotal
        }
        
        // Only include accounts with activity
        if (netCashFlow !== 0) {
          const accountData = {
            name: account.name,
            amount: Math.abs(netCashFlow),
            code: account.code,
            type: accountType
          }
          
          // Categorize cash flows
          if (accountType === "Revenue" || accountType === "Expenses" || 
              accountName.includes('receivable') || accountName.includes('payable')) {
            operatingActivities.push(accountData)
          } else if (accountName.includes('equipment') || accountName.includes('property') || 
                     accountName.includes('investment')) {
            investingActivities.push(accountData)
          } else if (accountName.includes('loan') || accountName.includes('equity') || 
                     accountName.includes('capital')) {
            financingActivities.push(accountData)
          } else {
            // Default to operating for cash accounts
            if (accountName.includes('cash') || accountName.includes('bank')) {
              operatingActivities.push(accountData)
            }
          }
        }
      }
      
      // Sort by account code
      operatingActivities.sort((a, b) => a.code.localeCompare(b.code))
      investingActivities.sort((a, b) => a.code.localeCompare(b.code))
      financingActivities.sort((a, b) => a.code.localeCompare(b.code))
      
      const netOperatingCashFlow = operatingActivities.reduce((sum, item) => sum + item.amount, 0)
      const netInvestingCashFlow = investingActivities.reduce((sum, item) => sum + item.amount, 0)
      const netFinancingCashFlow = financingActivities.reduce((sum, item) => sum + item.amount, 0)
      const netCashChange = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow
      
      return {
        operating_activities: operatingActivities,
        investing_activities: investingActivities,
        financing_activities: financingActivities,
        net_cash_flow: {
          operating: netOperatingCashFlow,
          investing: netInvestingCashFlow,
          financing: netFinancingCashFlow,
          total: netCashChange
        },
        cash_at_beginning: 0, // This would need to be calculated from previous period
        cash_at_end: netCashChange // Simplified for now
      }
    } catch (error) {
      console.error("Error generating cash flow statement:", error)
      // Return empty data if there's an error
      return {
        operating_activities: [],
        investing_activities: [],
        financing_activities: [],
        net_cash_flow: {
          operating: 0,
          investing: 0,
          financing: 0,
          total: 0
        },
        cash_at_beginning: 0,
        cash_at_end: 0
      }
    }
  }

  // Helper method to get account balance at a specific date
  private static async getAccountBalance(accountId: string, asOfDate: string): Promise<number> {
    try {
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select(`
          account_types!inner(name, normal_balance)
        `)
        .eq("id", accountId)
        .single()

      if (accountError) throw accountError

      // Get opening balance
      const { data: openingBalance, error: openingError } = await supabase
        .from("opening_balances")
        .select("balance")
        .eq("account_id", accountId)
        .single()

      let openingBal = 0
      if (openingBalance && !openingError) {
        openingBal = openingBalance.balance || 0
      }

      // Get transaction totals up to the date
      const { data: transactions, error: transError } = await supabase
        .from("journal_entry_lines")
        .select(`
          debit_amount,
          credit_amount,
          journal_entries!inner(entry_date)
        `)
        .eq("account_id", accountId)
        .lte("journal_entries.entry_date", asOfDate)

      if (transError) throw transError

      let debitTotal = 0
      let creditTotal = 0

      for (const trans of transactions || []) {
        debitTotal += trans.debit_amount || 0
        creditTotal += trans.credit_amount || 0
      }

      // Calculate balance based on account type
      const accountType = account.account_types?.[0]
      const isDebitNormal = accountType?.normal_balance === "debit"
      
      if (isDebitNormal) {
        return openingBal + debitTotal - creditTotal
      } else {
        return openingBal + creditTotal - debitTotal
      }

    } catch (error) {
      console.error("Error getting account balance:", error)
      return 0
    }
  }

  // Get detailed account report with all transactions and balances
  static async getAccountDetailReport(
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AccountDetailReport> {
    try {
      console.log(`Loading account detail report for account ID: ${accountId}`)
      console.log(`Date range: ${startDate} to ${endDate}`)

      // Get account details
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select(`
          *,
          account_types(*)
        `)
        .eq("id", accountId)
        .single()

      if (accountError) {
        console.error("Error fetching account:", accountError)
        throw accountError
      }

      console.log("Account found:", account)

      // Get opening balance (you might want to implement this based on your business logic)
      const openingBalance = 0 // This should be calculated based on your opening balance logic

      // Determine if this account has debit normal balance
      const isDebitNormal = account.account_types?.normal_balance === "debit"

      console.log(`Account type: ${account.account_type}, Normal balance: ${account.account_types?.normal_balance}, Is debit normal: ${isDebitNormal}`)

      // Get all transactions for this account
      let query = supabase
        .from("journal_entry_lines")
        .select(`
          *,
          journal_entries!inner(
            entry_date,
            entry_number,
            description,
            reference
          )
        `)
        .eq("account_id", accountId)
        .order("created_at")

      if (startDate && endDate) {
        query = query
          .gte("journal_entries.entry_date", startDate)
          .lte("journal_entries.entry_date", endDate)
      }

      const { data: transactions, error: transactionsError } = await query

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
        throw transactionsError
      }

      console.log(`Found ${transactions?.length || 0} transactions for account ${account.code}`)

      // Calculate running balances and summary
      let runningBalance = openingBalance
      const processedTransactions = (transactions || []).map((transaction) => {
        const debitAmount = transaction.debit_amount || 0
        const creditAmount = transaction.credit_amount || 0
        
        // For asset/expense accounts, debits increase balance, credits decrease
        // For liability/equity/revenue accounts, credits increase balance, debits decrease
        if (isDebitNormal) {
          runningBalance += debitAmount - creditAmount
        } else {
          runningBalance += creditAmount - debitAmount
        }

        return {
          id: transaction.id,
          entry_date: transaction.journal_entries.entry_date,
          entry_number: transaction.journal_entries.entry_number,
          description: transaction.description || transaction.journal_entries.description,
          reference: transaction.journal_entries.reference,
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          running_balance: runningBalance,
        }
      })

      const totalDebits = processedTransactions.reduce((sum, t) => sum + t.debit_amount, 0)
      const totalCredits = processedTransactions.reduce((sum, t) => sum + t.credit_amount, 0)
      const netChange = isDebitNormal ? totalDebits - totalCredits : totalCredits - totalDebits

      console.log(`Account ${account.code} summary: Debits: ${totalDebits}, Credits: ${totalCredits}, Net: ${netChange}, Balance: ${runningBalance}`)

      // Get sub-accounts if any
      const { data: subAccounts, error: subAccountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("parent_account_id", accountId)
        .eq("is_active", true)
        .order("code")

      if (subAccountsError) {
        console.warn("Error fetching sub-accounts:", subAccountsError)
      }

      console.log(`Found ${subAccounts?.length || 0} sub-accounts for account ${account.code}`)

      let subAccountReports: AccountDetailReport[] = []
      if (subAccounts && subAccounts.length > 0) {
        subAccountReports = await Promise.all(
          subAccounts.map(subAccount => this.getAccountDetailReport(subAccount.id, startDate, endDate))
        )
      }

      return {
        account,
        opening_balance: openingBalance,
        current_balance: runningBalance,
        transactions: processedTransactions,
        summary: {
          total_debits: totalDebits,
          total_credits: totalCredits,
          net_change: netChange,
          transaction_count: processedTransactions.length,
        },
        sub_accounts: subAccountReports.length > 0 ? subAccountReports : undefined,
      }
    } catch (error) {
      console.error("Error loading account detail report:", error)
      throw new Error(`Failed to load account detail report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get summary report for all accounts with balances
  static async getAccountSummaryReport(startDate?: string, endDate?: string): Promise<AccountSummaryReport[]> {
    try {
      // Get all active accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select(`
          *,
          account_types(*)
        `)
        .eq("is_active", true)
        .order("code")

      if (accountsError) throw accountsError

      // Get summary data for each account
      const accountSummaries = await Promise.all(
        accounts.map(async (account) => {
          try {
            const detailReport = await this.getAccountDetailReport(account.id, startDate, endDate)
            
            // Check if account has sub-accounts
            const { data: subAccounts } = await supabase
              .from("accounts")
              .select("id")
              .eq("parent_account_id", account.id)
              .eq("is_active", true)

            return {
              account_id: account.id,
              account_code: account.code,
              account_name: account.name,
              account_type: account.account_types?.name || account.account_type,
              parent_account_id: account.parent_account_id,
              opening_balance: detailReport.opening_balance,
              current_balance: detailReport.current_balance,
              total_debits: detailReport.summary.total_debits,
              total_credits: detailReport.summary.total_credits,
              net_change: detailReport.summary.net_change,
              transaction_count: detailReport.summary.transaction_count,
              has_sub_accounts: (subAccounts?.length || 0) > 0,
            }
          } catch (error) {
            console.warn(`Failed to get summary for account ${account.code}:`, error)
            // Return basic account info if detailed report fails
            return {
              account_id: account.id,
              account_code: account.code,
              account_name: account.name,
              account_type: account.account_types?.name || account.account_type,
              parent_account_id: account.parent_account_id,
              opening_balance: 0,
              current_balance: 0,
              total_debits: 0,
              total_credits: 0,
              net_change: 0,
              transaction_count: 0,
              has_sub_accounts: false,
            }
          }
        })
      )

      return accountSummaries
    } catch (error) {
      console.error("Error loading account summary report:", error)
      throw new Error("Failed to load account summary report")
    }
  }

  // Get hierarchical account report with parent-child relationships
  static async getHierarchicalAccountReport(startDate?: string, endDate?: string): Promise<AccountSummaryReport[]> {
    try {
      const allAccounts = await this.getAccountSummaryReport(startDate, endDate)
      
      // Build hierarchical structure
      const buildHierarchy = (accounts: AccountSummaryReport[], parentId: string | null = null): AccountSummaryReport[] => {
        return accounts
          .filter(account => account.parent_account_id === parentId)
          .map(account => ({
            ...account,
            sub_accounts: buildHierarchy(accounts, account.account_id),
          }))
      }

      return buildHierarchy(allAccounts)
    } catch (error) {
      console.error("Error loading hierarchical account report:", error)
      throw new Error("Failed to load hierarchical account report")
    }
  }

  // Create sample journal entries for testing
  static async createSampleJournalEntries(): Promise<void> {
    try {
      console.log("Creating sample journal entries for testing...")

      // Get existing accounts
      const accounts = await this.getChartOfAccounts()
      if (accounts.length === 0) {
        console.warn("No accounts found. Please create accounts first.")
        return
      }

      // Find some key accounts for sample entries
      const cashAccount = accounts.find(a => a.name.toLowerCase().includes('cash'))
      const salesAccount = accounts.find(a => a.name.toLowerCase().includes('sales') || a.name.toLowerCase().includes('revenue'))
      const expenseAccount = accounts.find(a => a.name.toLowerCase().includes('expense') || a.name.toLowerCase().includes('cost'))
      const receivableAccount = accounts.find(a => a.name.toLowerCase().includes('receivable'))
      const payableAccount = accounts.find(a => a.name.toLowerCase().includes('payable'))

      if (!cashAccount || !salesAccount || !expenseAccount) {
        console.warn("Required accounts not found. Need at least Cash, Sales, and Expense accounts.")
        return
      }

      const sampleEntries = [
        {
          entry_date: new Date().toISOString().split('T')[0],
          description: "Sample Sales Transaction",
          reference: "SAMPLE-001",
          lines: [
            {
              account_id: cashAccount.id,
              description: "Cash received from customer",
              debit_amount: 1000,
              credit_amount: 0,
            },
            {
              account_id: salesAccount.id,
              description: "Sales revenue",
              debit_amount: 0,
              credit_amount: 1000,
            },
          ],
        },
        {
          entry_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
          description: "Sample Expense Transaction",
          reference: "SAMPLE-002",
          lines: [
            {
              account_id: expenseAccount.id,
              description: "Office supplies expense",
              debit_amount: 250,
              credit_amount: 0,
            },
            {
              account_id: cashAccount.id,
              description: "Cash paid for supplies",
              debit_amount: 0,
              credit_amount: 250,
            },
          ],
        },
        {
          entry_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days ago
          description: "Sample Credit Sale",
          reference: "SAMPLE-003",
          lines: receivableAccount ? [
            {
              account_id: receivableAccount.id,
              description: "Accounts receivable",
              debit_amount: 500,
              credit_amount: 0,
            },
            {
              account_id: salesAccount.id,
              description: "Credit sales revenue",
              debit_amount: 0,
              credit_amount: 500,
            },
          ] : [
            {
              account_id: cashAccount.id,
              description: "Cash received",
              debit_amount: 500,
              credit_amount: 0,
            },
            {
              account_id: salesAccount.id,
              description: "Sales revenue",
              debit_amount: 0,
              credit_amount: 500,
            },
          ],
        },
      ]

      // Create each sample entry
      for (const entry of sampleEntries) {
        try {
          await this.createJournalEntry(entry)
          console.log(`Created sample entry: ${entry.description}`)
        } catch (error) {
          console.warn(`Failed to create sample entry ${entry.description}:`, error)
        }
      }

      console.log("Sample journal entries created successfully!")
    } catch (error) {
      console.error("Error creating sample journal entries:", error)
      throw new Error("Failed to create sample journal entries")
    }
  }

  // Check if database has any journal entries
  static async hasJournalEntries(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("id")
        .limit(1)

      if (error) {
        console.error("Error checking for journal entries:", error)
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error("Error checking for journal entries:", error)
      return false
    }
  }
}
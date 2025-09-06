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

export class AccountingService {
  // Get all account types (with fallback to default types if table doesn't exist)
  static async getAccountTypes(): Promise<AccountType[]> {
    try {
      const { data, error } = await supabase.from("account_types").select("*").eq("is_active", true).order("name")

      if (error) {
        console.warn("Account types table not found, using default types:", error)
        // Return default account types if table doesn't exist
        return [
          {
            id: "asset",
            name: "Asset",
            description: "Resources owned by the company",
            normal_balance: "debit",
            is_system: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "liability",
            name: "Liability",
            description: "Debts and obligations owed by the company",
            normal_balance: "credit",
            is_system: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "equity",
            name: "Equity",
            description: "Owner's interest in the company",
            normal_balance: "credit",
            is_system: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "revenue",
            name: "Revenue",
            description: "Income earned from business operations",
            normal_balance: "credit",
            is_system: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "expense",
            name: "Expense",
            description: "Costs incurred in business operations",
            normal_balance: "debit",
            is_system: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      }
      return data || []
    } catch (error) {
      console.error("Error loading account types:", error)
      // Return default types as fallback
      return [
        {
          id: "asset",
          name: "Asset",
          description: "Resources owned by the company",
          normal_balance: "debit",
          is_system: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "liability",
          name: "Liability",
          description: "Debts and obligations owed by the company",
          normal_balance: "credit",
          is_system: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "equity",
          name: "Equity",
          description: "Owner's interest in the company",
          normal_balance: "credit",
          is_system: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "revenue",
          name: "Revenue",
          description: "Income earned from business operations",
          normal_balance: "credit",
          is_system: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "expense",
          name: "Expense",
          description: "Costs incurred in business operations",
          normal_balance: "debit",
          is_system: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    }
  }

  // Create new account type (with fallback if table doesn't exist)
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
        throw new Error("Account types table not available. Please run the database migration first.")
      }
      return data
    } catch (error) {
      console.error("Error creating account type:", error)
      throw new Error("Failed to create account type. Database migration may be required.")
    }
  }

  // Add update account type method after createAccountType
  static async updateAccountType(
    id: string,
    accountType: {
      name: string
      description?: string
      normal_balance: "debit" | "credit"
    },
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
        throw new Error("Failed to update account type")
      }
      return data
    } catch (error) {
      console.error("Error updating account type:", error)
      throw new Error("Failed to update account type")
    }
  }

  // Add delete account type method
  static async deleteAccountType(id: string): Promise<void> {
    try {
      // First check if any accounts are using this type
      const { data: accountsUsingType, error: checkError } = await supabase
        .from("accounts")
        .select("id")
        .eq("account_type_id", id)
        .limit(1)

      if (checkError) {
        console.error("Error checking account usage:", checkError)
        throw new Error("Failed to check if account type is in use")
      }

      if (accountsUsingType && accountsUsingType.length > 0) {
        throw new Error("Cannot delete account type that is being used by accounts")
      }

      const { error } = await supabase.from("account_types").delete().eq("id", id)

      if (error) {
        console.error("Error deleting account type:", error)
        throw new Error("Failed to delete account type")
      }
    } catch (error) {
      console.error("Error deleting account type:", error)
      throw error
    }
  }

  // Get Chart of Accounts (without account_types join for now)
  static async getChartOfAccounts(): Promise<Account[]> {
    try {
      // First try with the new relationship
      const { data: accountsWithTypes, error: joinError } = await supabase
        .from("accounts")
        .select(`
          *,
          account_types(*)
        `)
        .eq("is_active", true)
        .order("code")

      if (!joinError && accountsWithTypes) {
        return accountsWithTypes
      }

      // Fallback to basic accounts query
      console.warn("Using fallback query for accounts:", joinError)
      const { data, error } = await supabase.from("accounts").select("*").eq("is_active", true).order("code")

      if (error) {
        console.error("Error loading accounts:", error)
        throw new Error("Failed to load accounts")
      }
      return data || []
    } catch (error) {
      console.error("Error loading accounts:", error)
      throw new Error("Failed to load accounts")
    }
  }

  // Create a new account (with fallback for account_type_id)
  static async createAccount(account: {
    code: string
    name: string
    account_type_id: string
    parent_account_id?: string
    description?: string
  }): Promise<Account> {
    try {
      // Try to get the account type name for backward compatibility
      let accountTypeName = "Asset" // Default fallback

      // Check if account_type_id is one of our default IDs
      const defaultTypeMap: { [key: string]: string } = {
        asset: "Asset",
        liability: "Liability",
        equity: "Equity",
        revenue: "Revenue",
        expense: "Expense",
      }

      if (defaultTypeMap[account.account_type_id]) {
        accountTypeName = defaultTypeMap[account.account_type_id]
      } else {
        // Try to fetch from account_types table
        try {
          const { data: accountType } = await supabase
            .from("account_types")
            .select("name")
            .eq("id", account.account_type_id)
            .single()

          if (accountType) {
            accountTypeName = accountType.name
          }
        } catch (typeError) {
          console.warn("Could not fetch account type, using fallback:", typeError)
        }
      }

      const accountData = {
        code: account.code,
        name: account.name,
        account_type: accountTypeName,
        account_type_id: account.account_type_id,
        parent_account_id: account.parent_account_id || null,
        description: account.description || null,
        is_active: true,
        level: 1,
      }

      const { data, error } = await supabase.from("accounts").insert([accountData]).select().single()

      if (error) {
        console.error("Error creating account:", error)
        throw new Error("Failed to create account")
      }
      return data
    } catch (error) {
      console.error("Error creating account:", error)
      throw new Error("Failed to create account")
    }
  }

  // Create journal entry with flexible lines
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
      // Validate double-entry
      const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit_amount, 0)
      const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit_amount, 0)

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error("Journal entry is not balanced. Total debits must equal total credits.")
      }

      // Generate entry number
      const entryNumber = await this.generateEntryNumber()

      // Create journal entry header
      const { data: journalEntry, error: entryError } = await supabase
        .from("journal_entries")
        .insert([
          {
            entry_number: entryNumber,
            entry_date: entry.entry_date,
            description: entry.description,
            reference: entry.reference || null,
            total_debit: totalDebits,
            total_credit: totalCredits,
            is_balanced: true,
          },
        ])
        .select()
        .single()

      if (entryError) throw entryError

      // Create journal entry lines
      const lines = entry.lines.map((line, index) => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        description: line.description || entry.description,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
        line_number: index + 1,
        image_data: line.image_data || null,
      }))

      const { error: linesError } = await supabase.from("journal_entry_lines").insert(lines)

      if (linesError) throw linesError

      return journalEntry.id
    } catch (error) {
      console.error("Error creating journal entry:", error)
      throw new Error("Failed to create journal entry")
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
      let query = supabase
        .from("journal_entries")
        .select(`
        *,
        journal_entry_lines(
          *,
          accounts(*)
        )
      `)
        .order("entry_date", { ascending: false })

      if (filters?.startDate) {
        query = query.gte("entry_date", filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte("entry_date", filters.endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching journal entries:", error)
        throw error
      }

      let filteredData = data || []

      // Filter by account type if specified
      if (filters?.accountType && filters.accountType !== "All Types") {
        filteredData = filteredData.filter((entry) =>
          entry.journal_entry_lines?.some((line: any) => line.accounts?.account_type === filters.accountType),
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
                line.accounts?.name.toLowerCase().includes(searchLower) ||
                line.accounts?.code.toLowerCase().includes(searchLower),
            ),
        )
      }

      return filteredData
    } catch (error) {
      console.error("Error loading journal entries:", error)
      throw new Error("Failed to load journal entries")
    }
  }

  // Generate next entry number
  static async generateEntryNumber(): Promise<string> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("entry_number")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error generating entry number:", error)
      return "JE-001"
    }

    const lastNumber = data?.[0]?.entry_number
    if (!lastNumber) return "JE-001"

    const match = lastNumber.match(/JE-(\d+)/)
    if (match) {
      const nextNumber = Number.parseInt(match[1]) + 1
      return `JE-${nextNumber.toString().padStart(3, "0")}`
    }

    return "JE-001"
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
        
        // Get transaction totals for the period
        let query = supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entries!inner(entry_date)
          `)
          .eq("account_id", account.id)
        
        if (startDate && endDate) {
          query = query
            .gte("journal_entries.entry_date", startDate)
            .lte("journal_entries.entry_date", endDate)
        }
        
        const { data: transactions, error } = await query
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
        const debitTotal = transactions?.reduce((sum, t) => sum + (t.debit_amount || 0), 0) || 0
        const creditTotal = transactions?.reduce((sum, t) => sum + (t.credit_amount || 0), 0) || 0
        
        // Calculate closing balance based on account type
        const isDebitNormal = account.account_types?.normal_balance === "debit" || 
                             account.account_type === "Asset" || 
                             account.account_type === "Expense"
        
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
          account_type: account.account_types?.name || account.account_type,
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
        console.log(`Processing account: ${account.code} - ${account.name} (${account.account_types?.name || account.account_type})`)
        // Get account balance up to the specified date
        const { data: transactions, error } = await supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entries!inner(entry_date)
          `)
          .eq("account_id", account.id)
          .lte("journal_entries.entry_date", asOfDate)
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
        console.log(`Found ${transactions?.length || 0} transactions for account ${account.code}`)
        
        const debitTotal = transactions?.reduce((sum, t) => sum + (t.debit_amount || 0), 0) || 0
        const creditTotal = transactions?.reduce((sum, t) => sum + (t.credit_amount || 0), 0) || 0
        
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
        const accountTypeName = account.account_types?.name || account.account_type
        const normalBalance = account.account_types?.normal_balance
        
        console.log(`Account ${account.code}: Type=${accountTypeName}, NormalBalance=${normalBalance}`)
        
        const isDebitNormal = normalBalance === "debit" || 
                             accountTypeName === "Asset" || 
                             accountTypeName === "Expense"
        
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
        
        if (accountTypeName === "Asset") {
          assets.push(accountData)
        } else if (accountTypeName === "Liability") {
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
        const accountType = account.account_types?.name || account.account_type
        
        // Only process Revenue and Expense accounts
        if (accountType !== "Revenue" && accountType !== "Expense") {
          continue
        }
        
        // Get account activity for the period
        const { data: transactions, error } = await supabase
          .from("journal_entry_lines")
          .select(`
            debit_amount, 
            credit_amount,
            journal_entries!inner(entry_date)
          `)
          .eq("account_id", account.id)
          .gte("journal_entries.entry_date", startDate)
          .lte("journal_entries.entry_date", endDate)
        
        if (error) {
          console.warn(`Error fetching transactions for account ${account.code}:`, error)
          continue
        }
        
        const debitTotal = transactions?.reduce((sum, t) => sum + (t.debit_amount || 0), 0) || 0
        const creditTotal = transactions?.reduce((sum, t) => sum + (t.credit_amount || 0), 0) || 0
        
        // Calculate activity amount
        let activityAmount = 0
        if (accountType === "Revenue") {
          // Revenue increases with credits
          activityAmount = creditTotal - debitTotal
        } else if (accountType === "Expense") {
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
          } else if (accountType === "Expense") {
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
      const isDebitNormal = account.account_types?.normal_balance === "debit" || 
                           account.account_type === "Asset" || 
                           account.account_type === "Expense"

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

  // Reverse a journal entry by swapping debit and credit amounts in the same entry
  static async reverseJournalEntry(entryId: string): Promise<void> {
    try {
      // First, get the journal entry with its lines
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .select(`
          *,
          journal_entry_lines (*)
        `)
        .eq("id", entryId)
        .single()

      if (entryError) throw entryError
      if (!entry) throw new Error("Journal entry not found")

      // Get the journal entry lines
      const { data: lines, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select("*")
        .eq("journal_entry_id", entryId)

      if (linesError) throw linesError
      if (!lines || lines.length === 0) throw new Error("No journal entry lines found")

      // Reverse each line by swapping debit and credit amounts
      const reversedLines = lines.map(line => ({
        id: line.id,
        debit_amount: line.credit_amount,
        credit_amount: line.debit_amount
      }))

      // Update each line in the database
      for (const line of reversedLines) {
        const { error: updateError } = await supabase
          .from("journal_entry_lines")
          .update({
            debit_amount: line.debit_amount,
            credit_amount: line.credit_amount
          })
          .eq("id", line.id)

        if (updateError) throw updateError
      }

      // Update the journal entry totals (swap them)
      const { error: updateEntryError } = await supabase
        .from("journal_entries")
        .update({
          total_debit: entry.total_credit,
          total_credit: entry.total_debit,
          updated_at: new Date().toISOString()
        })
        .eq("id", entryId)

      if (updateEntryError) throw updateEntryError

    } catch (error) {
      console.error("Error reversing journal entry:", error)
      throw new Error("Failed to reverse journal entry")
    }
  }

  // Generate cash flow statement
  static async getCashFlowStatement(startDate: string, endDate: string): Promise<CashFlowStatement> {
    try {
      // Get all journal entries and lines for the period
      const { data: entries, error: entriesError } = await supabase
        .from("journal_entries")
        .select(`
          *,
          journal_entry_lines (
            *,
            accounts (*)
          )
        `)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: true })

      if (entriesError) throw entriesError

      // Get cash accounts to calculate beginning and ending cash
      const { data: cashAccounts, error: cashError } = await supabase
        .from("accounts")
        .select("*")
        .or("name.ilike.%cash%,name.ilike.%bank%,code.ilike.111%,code.ilike.112%")

      if (cashError) throw cashError

      // Calculate beginning cash balance
      let cashAtBeginning = 0
      for (const account of cashAccounts || []) {
        const balance = await this.getAccountBalance(account.id, startDate)
        cashAtBeginning += balance
      }

      // Calculate ending cash balance
      let cashAtEnd = 0
      for (const account of cashAccounts || []) {
        const balance = await this.getAccountBalance(account.id, endDate)
        cashAtEnd += balance
      }

      // Categorize transactions by cash flow type
      const operatingActivities: CashFlowItem[] = []
      const investingActivities: CashFlowItem[] = []
      const financingActivities: CashFlowItem[] = []

      // Process each journal entry
      for (const entry of entries || []) {
        for (const line of entry.journal_entry_lines || []) {
          const account = line.accounts
          if (!account) continue

          // Determine cash flow category based on account type and description
          const cashFlowType = this.categorizeCashFlow(account, line, entry)
          const amount = line.debit_amount - line.credit_amount

          if (amount === 0) continue

          const item: CashFlowItem = {
            category: this.getCashFlowCategory(account, line, entry),
            description: line.description || entry.description,
            amount: Math.abs(amount),
            type: cashFlowType
          }

          switch (cashFlowType) {
            case 'operating':
              operatingActivities.push(item)
              break
            case 'investing':
              investingActivities.push(item)
              break
            case 'financing':
              financingActivities.push(item)
              break
          }
        }
      }

      // Calculate net cash flows
      const netOperating = operatingActivities.reduce((sum, item) => sum + item.amount, 0)
      const netInvesting = investingActivities.reduce((sum, item) => sum + item.amount, 0)
      const netFinancing = financingActivities.reduce((sum, item) => sum + item.amount, 0)
      const netTotal = netOperating + netInvesting + netFinancing

      return {
        operating_activities: operatingActivities,
        investing_activities: investingActivities,
        financing_activities: financingActivities,
        net_cash_flow: {
          operating: netOperating,
          investing: netInvesting,
          financing: netFinancing,
          total: netTotal
        },
        cash_at_beginning: cashAtBeginning,
        cash_at_end: cashAtEnd
      }

    } catch (error) {
      console.error("Error generating cash flow statement:", error)
      throw new Error("Failed to generate cash flow statement")
    }
  }

  // Helper method to categorize cash flow activities
  private static categorizeCashFlow(account: any, line: any, entry: any): 'operating' | 'investing' | 'financing' {
    const accountType = account.account_type
    const accountName = account.name.toLowerCase()
    const description = (line.description || entry.description || '').toLowerCase()

    // Operating activities
    if (accountType === 'Revenue' || accountType === 'Expense') {
      return 'operating'
    }

    // Cash accounts are operating
    if (accountName.includes('cash') || accountName.includes('bank')) {
      return 'operating'
    }

    // Accounts receivable/payable are operating
    if (accountName.includes('receivable') || accountName.includes('payable')) {
      return 'operating'
    }

    // Inventory is operating
    if (accountName.includes('inventory')) {
      return 'operating'
    }

    // Investing activities
    if (accountType === 'Asset' && (accountName.includes('equipment') || 
        accountName.includes('vehicle') || accountName.includes('building') ||
        accountName.includes('investment'))) {
      return 'investing'
    }

    // Financing activities
    if (accountType === 'Liability' && (accountName.includes('loan') || 
        accountName.includes('debt'))) {
      return 'financing'
    }

    if (accountType === 'Equity') {
      return 'financing'
    }

    // Default to operating for other transactions
    return 'operating'
  }

  // Helper method to get cash flow category description
  private static getCashFlowCategory(account: any, line: any, entry: any): string {
    const accountType = account.account_type
    const accountName = account.name

    switch (accountType) {
      case 'Revenue':
        return 'Revenue'
      case 'Expense':
        return 'Expenses'
      case 'Asset':
        if (accountName.toLowerCase().includes('cash') || accountName.toLowerCase().includes('bank')) {
          return 'Cash & Cash Equivalents'
        }
        if (accountName.toLowerCase().includes('receivable')) {
          return 'Accounts Receivable'
        }
        if (accountName.toLowerCase().includes('inventory')) {
          return 'Inventory'
        }
        return 'Other Assets'
      case 'Liability':
        if (accountName.toLowerCase().includes('payable')) {
          return 'Accounts Payable'
        }
        if (accountName.toLowerCase().includes('loan')) {
          return 'Loans & Debt'
        }
        return 'Other Liabilities'
      case 'Equity':
        return 'Equity'
      default:
        return 'Other'
    }
  }

  // Helper method to get account balance at a specific date
  private static async getAccountBalance(accountId: string, asOfDate: string): Promise<number> {
    try {
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("account_type")
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
      if (account.account_type === 'Asset' || account.account_type === 'Expense') {
        return openingBal + debitTotal - creditTotal
      } else {
        return openingBal + creditTotal - debitTotal
      }

    } catch (error) {
      console.error("Error getting account balance:", error)
      return 0
    }
  }
}

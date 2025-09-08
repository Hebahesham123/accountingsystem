import { createClient } from "@supabase/supabase-js"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

export type AccountType = {
  id: string
  name: string
  description?: string
  normal_balance: "debit" | "credit"
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Account = {
  id: string
  code: string
  name: string
  account_type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense" | string
  account_type_id?: string
  parent_account_id?: string
  description?: string
  is_active: boolean
  level: number
  lft?: number
  rgt?: number
  created_at: string
  updated_at: string
  account_types?: AccountType
}

export type JournalEntry = {
  id: string
  entry_number: string
  entry_date: string
  description: string
  reference?: string
  total_debit: number
  total_credit: number
  is_balanced: boolean
  period_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  journal_entry_lines?: JournalEntryLine[]
}

export type JournalEntryLine = {
  id: string
  journal_entry_id: string
  account_id: string
  description?: string
  debit_amount: number
  credit_amount: number
  line_number: number
  created_at: string
  image_data?: string
  account?: Account
  accounts?: {
    id: string
    code: string
    name: string
    account_types: {
      name: string
    }
  }
}

export type AccountingPeriod = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_locked: boolean
  created_at: string
}

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

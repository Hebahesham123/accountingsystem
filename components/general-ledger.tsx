"use client"

import { useState, useEffect } from "react"
import { Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type Account, AccountingService } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"

interface GeneralLedgerEntry {
  id: string
  entry_date: string
  entry_number: string
  description: string
  reference?: string
  debit_amount: number
  credit_amount: number
  running_balance: number
  journal_entries: {
    entry_date: string
    entry_number: string
    description: string
    reference?: string
  }
  accounts: {
    code: string
    name: string
  }
}

export default function GeneralLedger() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadAccounts()
    // Set default dates (current year)
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)
    setStartDate(yearStart.toISOString().split("T")[0])
    setEndDate(yearEnd.toISOString().split("T")[0])
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await AccountingService.getChartOfAccounts()
      // Filter to show only leaf accounts (accounts that can have transactions)
      const leafAccounts = data.filter((account) => !data.some((child) => child.parent_account_id === account.id))
      setAccounts(leafAccounts)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      })
    }
  }

  const loadGeneralLedger = async () => {
    if (!selectedAccountId) {
      toast({
        title: "No Account Selected",
        description: "Please select an account to view its general ledger",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data = await AccountingService.getGeneralLedger(selectedAccountId, startDate, endDate)

      // Calculate running balance
      let runningBalance = 0
      const entriesWithBalance = data.map((entry: any) => {
        const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId)
        const isDebitAccount = selectedAccount?.account_type === "Asset" || selectedAccount?.account_type === "Expense"

        if (isDebitAccount) {
          runningBalance += entry.debit_amount - entry.credit_amount
        } else {
          runningBalance += entry.credit_amount - entry.debit_amount
        }

        return {
          ...entry,
          running_balance: runningBalance,
        }
      })

      setLedgerEntries(entriesWithBalance)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load general ledger",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccountChange = (accountId: string) => {
    if (accountId === "placeholder") return
    setSelectedAccountId(accountId)
    setLedgerEntries([]) // Clear previous entries
  }

  const filteredEntries = ledgerEntries.filter(
    (entry) =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.journal_entries.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.journal_entries.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getTotalDebits = () => {
    return filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0)
  }

  const getTotalCredits = () => {
    return filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0)
  }

  const getSelectedAccount = () => {
    return accounts.find((account) => account.id === selectedAccountId)
  }

  const exportToCSV = () => {
    if (!selectedAccountId || filteredEntries.length === 0) return

    const selectedAccount = getSelectedAccount()
    const headers = ["Date", "Entry Number", "Description", "Reference", "Debit", "Credit", "Balance"]
    const csvContent = [
      headers.join(","),
      ...filteredEntries.map((entry) =>
        [
          entry.journal_entries.entry_date,
          entry.journal_entries.entry_number,
          `"${entry.description || entry.journal_entries.description}"`,
          `"${entry.reference || entry.journal_entries.reference || ""}"`,
          entry.debit_amount.toFixed(2),
          entry.credit_amount.toFixed(2),
          entry.running_balance.toFixed(2),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `general-ledger-${selectedAccount?.code}-${startDate}-to-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">General Ledger</h1>
          <p className="text-muted-foreground">View detailed transaction history for any account</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={!selectedAccountId || filteredEntries.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Selection & Filters</CardTitle>
          <CardDescription>Select an account and date range to view its general ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="account">Account</Label>
              <Select value={selectedAccountId || "placeholder"} onValueChange={handleAccountChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Select an account
                  </SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={loadGeneralLedger} disabled={loading || !selectedAccountId} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Load Ledger"}
              </Button>
            </div>
          </div>

          {selectedAccountId && (
            <div className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Transactions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by description, entry number, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAccountId && ledgerEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  General Ledger - {getSelectedAccount()?.code} {getSelectedAccount()?.name}
                </CardTitle>
                <CardDescription>
                  Transaction history from {formatDate(startDate)} to {formatDate(endDate)}
                  {searchTerm && ` • Filtered by: "${searchTerm}"`}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-sm">
                  {filteredEntries.length} transactions
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.journal_entries.entry_date)}</TableCell>
                      <TableCell className="font-mono text-sm">{entry.journal_entries.entry_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.description || entry.journal_entries.description}</div>
                          {entry.description && entry.description !== entry.journal_entries.description && (
                            <div className="text-sm text-muted-foreground">
                              Entry: {entry.journal_entries.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.reference || entry.journal_entries.reference || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(entry.running_balance)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell colSpan={4} className="text-right">
                      <strong>TOTALS:</strong>
                    </TableCell>
                    <TableCell className="text-right">
                      <strong>{formatCurrency(getTotalDebits())}</strong>
                    </TableCell>
                    <TableCell className="text-right">
                      <strong>{formatCurrency(getTotalCredits())}</strong>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        Final Balance:{" "}
                        {formatCurrency(filteredEntries[filteredEntries.length - 1]?.running_balance || 0)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
                  <div className="text-2xl font-bold">{filteredEntries.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Debits</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalDebits())}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Credits</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(getTotalCredits())}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground">Ending Balance</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(filteredEntries[filteredEntries.length - 1]?.running_balance || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAccountId && ledgerEntries.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">{getSelectedAccount()?.name} has no transactions in the selected date range.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedAccountId && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select an Account</p>
              <p className="text-sm">Choose an account from the dropdown above to view its general ledger.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

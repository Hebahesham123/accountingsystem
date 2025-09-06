"use client"

import { useState, useEffect } from "react"
import { Search, FileText, TrendingUp, Download, Calendar, Calculator, Database, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AccountingService, type AccountSummaryReport } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AccountReportsOverview() {
  const [accounts, setAccounts] = useState<AccountSummaryReport[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<AccountSummaryReport[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccountType, setSelectedAccountType] = useState<string>("All Types")
  const [viewMode, setViewMode] = useState<"summary" | "hierarchical">("summary")
  const [hasData, setHasData] = useState(false)
  const [creatingSampleData, setCreatingSampleData] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Set default dates (current year)
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    setStartDate(yearStart.toISOString().split("T")[0])
    setEndDate(now.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadAccounts()
    }
  }, [startDate, endDate])

  useEffect(() => {
    filterAccounts()
  }, [accounts, searchTerm, selectedAccountType])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      setLoadingAccounts(true)
      
      // First check if we have any journal entries
      const hasEntries = await AccountingService.hasJournalEntries()
      setHasData(hasEntries)
      
      if (!hasEntries) {
        console.log("No journal entries found. Reports will show zero balances.")
        // Still load accounts but they'll have zero balances
      }
      
      let data: AccountSummaryReport[]
      
      if (viewMode === "hierarchical") {
        data = await AccountingService.getHierarchicalAccountReport(startDate, endDate)
      } else {
        data = await AccountingService.getAccountSummaryReport(startDate, endDate)
      }
      
      setAccounts(data)
    } catch (error) {
      console.error("Error loading account reports:", error)
      toast({
        title: "Error",
        description: "Failed to load account reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingAccounts(false)
    }
  }

  const createSampleData = async () => {
    try {
      setCreatingSampleData(true)
      await AccountingService.createSampleJournalEntries()
      
      toast({
        title: "Success",
        description: "Sample journal entries created successfully! Refresh the page to see the data.",
      })
      
      // Reload the data
      await loadAccounts()
    } catch (error) {
      console.error("Error creating sample data:", error)
      toast({
        title: "Error",
        description: "Failed to create sample data. Check the console for details.",
        variant: "destructive",
      })
    } finally {
      setCreatingSampleData(false)
    }
  }

  const filterAccounts = () => {
    let filtered = accounts

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        account =>
          account.account_code.toLowerCase().includes(searchLower) ||
          account.account_name.toLowerCase().includes(searchLower)
      )
    }

    // Filter by account type
    if (selectedAccountType !== "All Types") {
      filtered = filtered.filter(account => account.account_type === selectedAccountType)
    }

    setFilteredAccounts(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getAccountTypeColor = (type: string) => {
    const colors = {
      Asset: "bg-green-100 text-green-800",
      Liability: "bg-red-100 text-red-800",
      Equity: "bg-blue-100 text-blue-800",
      Revenue: "bg-purple-100 text-purple-800",
      Expense: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const exportAllReports = () => {
    // Implementation for exporting all reports
    toast({
      title: "Export",
      description: "Export functionality would be implemented here",
    })
  }

  const renderAccountRow = (account: AccountSummaryReport, level = 0) => {
    return (
      <TableRow key={account.account_id} className={level > 0 ? "bg-gray-50" : ""}>
        <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <div className="flex items-center gap-2">
            {account.has_sub_accounts && (
              <span className="text-gray-400">📁</span>
            )}
            <Link
              href={`/account-reports/${account.account_id}`}
              className="font-mono text-sm text-blue-600 hover:underline"
            >
              {account.account_code}
            </Link>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{account.account_name}</span>
            <Badge className={getAccountTypeColor(account.account_type)}>
              {account.account_type}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-right">{formatCurrency(account.opening_balance)}</TableCell>
        <TableCell className="text-right">{formatCurrency(account.current_balance)}</TableCell>
        <TableCell className="text-right">{formatCurrency(account.total_debits)}</TableCell>
        <TableCell className="text-right">{formatCurrency(account.total_credits)}</TableCell>
        <TableCell className="text-right">
          <span className={account.net_change >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(Math.abs(account.net_change))}
            {account.net_change >= 0 ? ' +' : ' -'}
          </span>
        </TableCell>
        <TableCell className="text-center">{account.transaction_count}</TableCell>
        <TableCell>
          <Link
            href={`/account-reports/${account.account_id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <FileText className="h-4 w-4" />
            View Report
          </Link>
        </TableCell>
      </TableRow>
    )
  }

  const renderHierarchicalAccounts = (accounts: AccountSummaryReport[], level = 0): React.ReactElement[] => {
    return accounts.map(account => {
      const rows = [renderAccountRow(account, level)]
      
      if (account.sub_accounts && account.sub_accounts.length > 0) {
        rows.push(...renderHierarchicalAccounts(account.sub_accounts, level + 1))
      }
      
      return rows
    }).flat()
  }

  const accountTypes = Array.from(new Set(accounts.map(acc => acc.account_type))).sort()

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive reports for all accounts and sub-accounts
          </p>
        </div>
        <div className="flex gap-2">
          {!hasData && (
            <Button onClick={createSampleData} disabled={creatingSampleData} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              {creatingSampleData ? "Creating..." : "Create Sample Data"}
            </Button>
          )}
          <Button onClick={exportAllReports} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All Reports
          </Button>
        </div>
      </div>

      {/* No Data Warning */}
      {!hasData && !loadingAccounts && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No Journal Entries Found:</strong> The account reports are showing zero balances because there are no journal entries in the system yet. 
            Click "Create Sample Data" to generate sample transactions for testing, or create journal entries manually through the Journal Entries section.
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <div>Accounts loaded: {accounts.length}</div>
              <div>Has journal entries: {hasData ? 'Yes' : 'No'}</div>
              <div>Date range: {startDate} to {endDate}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Loading accounts: {loadingAccounts ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  {accountTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="view_mode">View Mode</Label>
              <Select value={viewMode} onValueChange={(value: "summary" | "hierarchical") => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary View</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search accounts by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={loadAccounts} disabled={loading}>
              {loading ? "Loading..." : "Refresh Reports"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Accounts</div>
                <div className="text-2xl font-bold">{filteredAccounts.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Debits</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(filteredAccounts.reduce((sum, acc) => sum + acc.total_debits, 0))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(filteredAccounts.reduce((sum, acc) => sum + acc.total_credits, 0))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
                <div className="text-2xl font-bold">
                  {filteredAccounts.reduce((sum, acc) => sum + acc.transaction_count, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Account Reports
          </CardTitle>
          <CardDescription>
            Click on an account code or "View Report" to see detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading account reports...</p>
              </div>
            </div>
          ) : filteredAccounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Total Debits</TableHead>
                  <TableHead className="text-right">Total Credits</TableHead>
                  <TableHead className="text-right">Net Change</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewMode === "hierarchical" 
                  ? renderHierarchicalAccounts(filteredAccounts)
                  : filteredAccounts.map(account => renderAccountRow(account))
                }
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No accounts found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

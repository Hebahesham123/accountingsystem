"use client"

import { useState, useEffect } from "react"
import { Download, ChevronRight, ChevronDown, FileText, Calculator, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountingService, type AccountDetailReport } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"

interface AccountDetailReportProps {
  accountId: string
  accountCode?: string
  accountName?: string
}

export default function AccountDetailReport({ accountId, accountCode, accountName }: AccountDetailReportProps) {
  const [report, setReport] = useState<AccountDetailReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expandedSubAccounts, setExpandedSubAccounts] = useState<Set<string>>(new Set())
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
      loadReport()
    }
  }, [startDate, endDate, accountId])

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await AccountingService.getAccountDetailReport(accountId, startDate, endDate)
      setReport(data)
      
      // Log the data for debugging
      console.log("Account detail report loaded:", data)
      console.log("Transactions found:", data.transactions.length)
      console.log("Sub-accounts found:", data.sub_accounts?.length || 0)
      
    } catch (error) {
      console.error("Error loading account report:", error)
      toast({
        title: "Error",
        description: "Failed to load account report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  const toggleSubAccountExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedSubAccounts)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedSubAccounts(newExpanded)
  }

  const exportReport = () => {
    if (!report) return

    // Implementation for exporting report to PDF/CSV
    toast({
      title: "Export",
      description: "Report export functionality would be implemented here",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading account report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No report data available. Please select date range and try again.</p>
      </div>
    )
  }

  const account = report.account
  const accountTypeName = account.account_types?.name || account.account_type

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Detail Report</h1>
          <p className="text-muted-foreground">
            Detailed report for {accountCode || account.code} - {accountName || account.name}
          </p>
        </div>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
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
            <Button onClick={loadReport} disabled={loading}>
              {loading ? "Loading..." : "Refresh Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Account Summary
          </CardTitle>
          <CardDescription>Overview of account balances and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Account Type</div>
              <div className="text-lg font-semibold">
                <Badge className={getAccountTypeColor(accountTypeName)}>{accountTypeName}</Badge>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Opening Balance</div>
              <div className="text-lg font-semibold">{formatCurrency(report.opening_balance)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Current Balance</div>
              <div className="text-lg font-semibold">{formatCurrency(report.current_balance)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Net Change</div>
              <div className={`text-lg font-semibold ${report.summary.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(report.summary.net_change))}
                {report.summary.net_change >= 0 ? ' +' : ' -'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Debits</div>
              <div className="text-lg font-semibold text-blue-600">{formatCurrency(report.summary.total_debits)}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Credits</div>
              <div className="text-lg font-semibold text-red-600">{formatCurrency(report.summary.total_credits)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Transactions</div>
              <div className="text-lg font-semibold">{report.summary.transaction_count}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="sub-accounts">Sub-Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                All journal entries affecting this account from {formatDate(startDate)} to {formatDate(endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Running Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.entry_date)}</TableCell>
                        <TableCell className="font-mono">{transaction.entry_number}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.reference || "-"}</TableCell>
                        <TableCell className="text-right">
                          {transaction.debit_amount > 0 ? formatCurrency(transaction.debit_amount) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.credit_amount > 0 ? formatCurrency(transaction.credit_amount) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(transaction.running_balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found for this account in the selected date range.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sub-accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sub-Accounts
              </CardTitle>
              <CardDescription>Detailed breakdown by sub-account</CardDescription>
            </CardHeader>
            <CardContent>
              {report.sub_accounts && report.sub_accounts.length > 0 ? (
                <div className="space-y-4">
                  {report.sub_accounts.map((subAccount) => (
                    <div key={subAccount.account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleSubAccountExpansion(subAccount.account.id)}
                          >
                            {expandedSubAccounts.has(subAccount.account.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <span className="font-mono text-sm text-gray-600">{subAccount.account.code}</span>
                          <span className="font-medium">{subAccount.account.name}</span>
                          <Badge className={getAccountTypeColor(subAccount.account.account_types?.name || subAccount.account.account_type)}>
                            {subAccount.account.account_types?.name || subAccount.account.account_type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Current Balance</div>
                          <div className="text-lg font-semibold">{formatCurrency(subAccount.current_balance)}</div>
                        </div>
                      </div>

                      {expandedSubAccounts.has(subAccount.account.id) && (
                        <div className="ml-8 space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Opening:</span>{" "}
                              {formatCurrency(subAccount.opening_balance)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Debits:</span>{" "}
                              {formatCurrency(subAccount.summary.total_debits)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Credits:</span>{" "}
                              {formatCurrency(subAccount.summary.total_credits)}
                            </div>
                          </div>

                          {subAccount.transactions.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm font-medium mb-2">Recent Transactions:</div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Entry #</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subAccount.transactions.slice(0, 5).map((transaction) => (
                                    <TableRow key={transaction.id}>
                                      <TableCell className="text-sm">{formatDate(transaction.entry_date)}</TableCell>
                                      <TableCell className="text-sm font-mono">{transaction.entry_number}</TableCell>
                                      <TableCell className="text-sm">{transaction.description}</TableCell>
                                      <TableCell className="text-sm text-right">
                                        {transaction.debit_amount > 0 ? formatCurrency(transaction.debit_amount) : "-"}
                                      </TableCell>
                                      <TableCell className="text-sm text-right">
                                        {transaction.credit_amount > 0 ? formatCurrency(transaction.credit_amount) : "-"}
                                      </TableCell>
                                      <TableCell className="text-sm text-right font-mono">
                                        {formatCurrency(transaction.running_balance)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {subAccount.transactions.length > 5 && (
                                <div className="text-center text-sm text-muted-foreground mt-2">
                                  Showing 5 of {subAccount.transactions.length} transactions
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>This account has no sub-accounts.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

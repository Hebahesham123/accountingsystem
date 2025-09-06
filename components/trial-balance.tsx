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
import { type TrialBalanceItem, AccountingService } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"

export default function TrialBalance() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([])
  const [filteredBalance, setFilteredBalance] = useState<TrialBalanceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState("All Types")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Set default dates (current year)
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)

    setStartDate(yearStart.toISOString().split("T")[0])
    setEndDate(yearEnd.toISOString().split("T")[0])

    loadTrialBalance()
  }, [])

  useEffect(() => {
    // Apply filters whenever trial balance or filters change
    applyFilters()
  }, [trialBalance, accountTypeFilter, searchTerm])

  // Load trial balance when dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadTrialBalance()
    }
  }, [startDate, endDate])

  const loadTrialBalance = async (start?: string, end?: string) => {
    try {
      setLoading(true)
      const data = await AccountingService.getTrialBalance(start || startDate, end || endDate)
      setTrialBalance(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trial balance",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...trialBalance]

    // Filter by account type
    if (accountTypeFilter !== "All Types") {
      filtered = filtered.filter((item) => item.account_type === accountTypeFilter)
    }

    // Filter by search term (account name or code)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.account_name.toLowerCase().includes(searchLower) ||
          item.account_code.toLowerCase().includes(searchLower),
      )
    }

    setFilteredBalance(filtered)
  }

  const handleDateFilter = () => {
    loadTrialBalance(startDate, endDate)
  }

  const getTotalDebits = () => {
    return filteredBalance.reduce((sum, item) => sum + item.debit_total, 0)
  }

  const getTotalCredits = () => {
    return filteredBalance.reduce((sum, item) => sum + item.credit_total, 0)
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

  const exportToCSV = () => {
    const headers = ["Account Code", "Account Name", "Type", "Opening Balance", "Debits", "Credits", "Closing Balance"]
    const csvContent = [
      headers.join(","),
      ...filteredBalance.map((item) =>
        [
          item.account_code,
          `"${item.account_name}"`,
          item.account_type,
          item.opening_balance.toFixed(2),
          item.debit_total.toFixed(2),
          item.credit_total.toFixed(2),
          item.closing_balance.toFixed(2),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trial-balance-${startDate}-to-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>Summary of all account balances to verify double-entry bookkeeping</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={filteredBalance.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Date Filter */}
          <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleDateFilter} disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              {loading ? "Loading..." : "Apply Date Filter"}
            </Button>
          </div>

          {/* Search and Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search by Account Name or Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Filter by Account Type</Label>
              <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All account types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="Liability">Liability</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {filteredBalance.length} of {trialBalance.length} accounts
            </span>
            {accountTypeFilter !== "All Types" && <Badge variant="outline">Type: {accountTypeFilter}</Badge>}
            {searchTerm && <Badge variant="outline">Search: "{searchTerm}"</Badge>}
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Closing Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalance.map((item) => (
                <TableRow key={item.account_id}>
                  <TableCell className="font-mono">{item.account_code}</TableCell>
                  <TableCell className="font-medium">{item.account_name}</TableCell>
                  <TableCell>
                    <Badge className={getAccountTypeColor(item.account_type)}>{item.account_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">${item.opening_balance.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.debit_total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.credit_total.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">${item.closing_balance.toFixed(2)}</TableCell>
                </TableRow>
              ))}

              {filteredBalance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading trial balance..." : "No accounts match your filters"}
                  </TableCell>
                </TableRow>
              )}

              {/* Totals Row */}
              {filteredBalance.length > 0 && (
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    <strong>TOTALS:</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>${getTotalDebits().toFixed(2)}</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <strong>${getTotalCredits().toFixed(2)}</strong>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={Math.abs(getTotalDebits() - getTotalCredits()) < 0.01 ? "default" : "destructive"}>
                      {Math.abs(getTotalDebits() - getTotalCredits()) < 0.01 ? "Balanced" : "Not Balanced"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Balance Verification */}
        {filteredBalance.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Balance Verification:</span>
              <div className="flex gap-4">
                <span>Total Debits: ${getTotalDebits().toFixed(2)}</span>
                <span>Total Credits: ${getTotalCredits().toFixed(2)}</span>
                <Badge variant={Math.abs(getTotalDebits() - getTotalCredits()) < 0.01 ? "default" : "destructive"}>
                  Difference: ${Math.abs(getTotalDebits() - getTotalCredits()).toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

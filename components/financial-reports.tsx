"use client"

import { useState, useEffect } from "react"
import { Download, TrendingUp, DollarSign, PieChart, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { AccountingService, type CashFlowStatement } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"

export default function FinancialReports() {
  const [balanceSheet, setBalanceSheet] = useState<any>(null)
  const [incomeStatement, setIncomeStatement] = useState<any>(null)
  const [cashFlowStatement, setCashFlowStatement] = useState<CashFlowStatement | null>(null)
  const [loading, setLoading] = useState(false)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Set default dates for income statement (current year)
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    setStartDate(yearStart.toISOString().split("T")[0])
    setEndDate(asOfDate)
  }, [asOfDate])

  // Auto-load reports when dates change
  useEffect(() => {
    if (asOfDate) {
      loadBalanceSheet()
    }
  }, [asOfDate])

  useEffect(() => {
    if (startDate && endDate) {
      loadIncomeStatement()
      loadCashFlowStatement()
    }
  }, [startDate, endDate])

  const loadBalanceSheet = async () => {
    try {
      setLoading(true)
      const data = await AccountingService.getBalanceSheet(asOfDate)
      setBalanceSheet(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load balance sheet",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadIncomeStatement = async () => {
    try {
      setLoading(true)
      const data = await AccountingService.getIncomeStatement(startDate, endDate)
      setIncomeStatement(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load income statement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCashFlowStatement = async () => {
    try {
      setLoading(true)
      const data = await AccountingService.getCashFlowStatement(startDate, endDate)
      setCashFlowStatement(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load cash flow statement",
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

  const exportBalanceSheet = () => {
    if (!balanceSheet) return

    // Implementation for exporting balance sheet to PDF/CSV
    toast({
      title: "Export",
      description: "Balance sheet export functionality would be implemented here",
    })
  }

  const exportIncomeStatement = () => {
    if (!incomeStatement) return

    // Implementation for exporting income statement to PDF/CSV
    toast({
      title: "Export",
      description: "Income statement export functionality would be implemented here",
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and view your company's financial statements</p>
        </div>
      </div>

      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="account-reports">Account Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Balance Sheet
                  </CardTitle>
                  <CardDescription>Assets = Liabilities + Equity as of a specific date</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportBalanceSheet} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="as_of_date">As of Date</Label>
                  <Input id="as_of_date" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
                </div>
                <Button onClick={loadBalanceSheet} disabled={loading}>
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
              </div>

              {balanceSheet && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold">Company Name</h2>
                    <h3 className="text-lg font-semibold">Balance Sheet</h3>
                    <p className="text-muted-foreground">As of {new Date(asOfDate).toLocaleDateString()}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Assets */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-green-700">ASSETS</h3>
                      <div className="space-y-2">
                        <Table>
                          <TableBody>
                            {balanceSheet.assets.length > 0 ? (
                              balanceSheet.assets.map((asset: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{asset.name}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(asset.amount)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  No asset accounts with balances
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className="font-semibold border-t">
                              <TableCell>TOTAL ASSETS</TableCell>
                              <TableCell className="text-right">{formatCurrency(balanceSheet.totalAssets)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-red-700">LIABILITIES & EQUITY</h3>
                      <div className="space-y-2">
                        <div className="font-medium">LIABILITIES</div>
                        <Table>
                          <TableBody>
                            {balanceSheet.liabilities.length > 0 ? (
                              balanceSheet.liabilities.map((liability: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{liability.name}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(liability.amount)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  No liability accounts with balances
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className="font-semibold border-t">
                              <TableCell>TOTAL LIABILITIES</TableCell>
                              <TableCell className="text-right">{formatCurrency(balanceSheet.totalLiabilities)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <div className="font-medium mt-4 text-blue-700">EQUITY</div>
                        <Table>
                          <TableBody>
                            {balanceSheet.equity.length > 0 ? (
                              balanceSheet.equity.map((equityItem: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{equityItem.name}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(equityItem.amount)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                  No equity accounts with balances
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className="font-semibold border-t">
                              <TableCell>TOTAL EQUITY</TableCell>
                              <TableCell className="text-right">{formatCurrency(balanceSheet.totalEquity)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <div className="border-t pt-2 mt-4">
                          <div className="flex justify-between font-bold text-lg">
                            <span>TOTAL LIABILITIES & EQUITY</span>
                            <span>{formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Income Statement
                  </CardTitle>
                  <CardDescription>Revenue - Expenses = Net Income for a period</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportIncomeStatement} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <Button onClick={loadIncomeStatement} disabled={loading}>
                  {loading ? "Loading..." : "Generate Report"}
                </Button>
              </div>

              {incomeStatement && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold">Company Name</h2>
                    <h3 className="text-lg font-semibold">Income Statement</h3>
                    <p className="text-muted-foreground">
                      For the period {new Date(startDate).toLocaleDateString()} to{" "}
                      {new Date(endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <Table>
                      <TableBody>
                        <TableRow className="font-semibold text-lg">
                          <TableCell colSpan={2} className="text-green-700">
                            REVENUE
                          </TableCell>
                        </TableRow>
                        {incomeStatement.revenue.length > 0 ? (
                          incomeStatement.revenue.map((revenueItem: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="pl-6">{revenueItem.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(revenueItem.amount)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell className="pl-6 text-muted-foreground">No revenue activity</TableCell>
                            <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Revenue</TableCell>
                          <TableCell className="text-right">{formatCurrency(incomeStatement.totalRevenue)}</TableCell>
                        </TableRow>

                        <TableRow className="font-semibold text-lg">
                          <TableCell colSpan={2} className="text-red-700 pt-6">
                            EXPENSES
                          </TableCell>
                        </TableRow>
                        {incomeStatement.expenses.length > 0 ? (
                          incomeStatement.expenses.map((expenseItem: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="pl-6">{expenseItem.name}</TableCell>
                              <TableCell className="text-right">{formatCurrency(expenseItem.amount)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell className="pl-6 text-muted-foreground">No expense activity</TableCell>
                            <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Total Expenses</TableCell>
                          <TableCell className="text-right">{formatCurrency(incomeStatement.totalExpenses)}</TableCell>
                        </TableRow>

                        <TableRow className="font-bold text-lg border-t-2 border-black">
                          <TableCell>NET INCOME</TableCell>
                          <TableCell className={`text-right ${incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(incomeStatement.netIncome))}
                            {incomeStatement.netIncome >= 0 ? '' : ' (Loss)'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cash Flow Statement
                  </CardTitle>
                  <CardDescription>
                    Track cash inflows and outflows from operating, investing, and financing activities
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadCashFlowStatement} disabled={loading} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? "Loading..." : "Generate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="cash_start_date">Start Date</Label>
                  <Input id="cash_start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash_end_date">End Date</Label>
                  <Input id="cash_end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <Button onClick={loadCashFlowStatement} disabled={loading || !startDate || !endDate}>
                  {loading ? "Loading..." : "Generate Cash Flow"}
                </Button>
              </div>

              {cashFlowStatement && (
                <div className="space-y-6">
                  {/* Operating Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-green-700">OPERATING ACTIVITIES</h3>
                    <Table>
                      <TableBody>
                        {cashFlowStatement.operating_activities.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="pl-6">{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Net Cash from Operating Activities</TableCell>
                          <TableCell className="text-right">{formatCurrency(cashFlowStatement.net_cash_flow.operating)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Investing Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-700">INVESTING ACTIVITIES</h3>
                    <Table>
                      <TableBody>
                        {cashFlowStatement.investing_activities.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="pl-6">{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Net Cash from Investing Activities</TableCell>
                          <TableCell className="text-right">{formatCurrency(cashFlowStatement.net_cash_flow.investing)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Financing Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-purple-700">FINANCING ACTIVITIES</h3>
                    <Table>
                      <TableBody>
                        {cashFlowStatement.financing_activities.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="pl-6">{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold border-t">
                          <TableCell>Net Cash from Financing Activities</TableCell>
                          <TableCell className="text-right">{formatCurrency(cashFlowStatement.net_cash_flow.financing)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-4">
                    <Table>
                      <TableBody>
                        <TableRow className="font-semibold">
                          <TableCell>Net Increase (Decrease) in Cash</TableCell>
                          <TableCell className="text-right">{formatCurrency(cashFlowStatement.net_cash_flow.total)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Cash at Beginning of Period</TableCell>
                          <TableCell className="text-right">{formatCurrency(cashFlowStatement.cash_at_beginning)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold text-lg border-t-2 border-black">
                          <TableCell>Cash at End of Period</TableCell>
                          <TableCell className="text-right">{formatCurrency(cashFlowStatement.cash_at_end)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!cashFlowStatement && !loading && (
                <div className="text-center p-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Generate Cash Flow" to view your cash flow statement.</p>
                  <p className="text-sm mt-2">This will show operating, investing, and financing cash flows for the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Account Reports
              </CardTitle>
              <CardDescription>
                Detailed reports for individual accounts and sub-accounts with transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Comprehensive Account Reports</h3>
                <p className="text-muted-foreground mb-6">
                  Generate detailed reports for each account showing:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left max-w-2xl mx-auto">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Opening and current balances</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Complete transaction history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Debit and credit summaries</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Sub-account breakdowns</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full md:w-auto">
                    <a href="/account-reports">
                      <FileText className="h-4 w-4 mr-2" />
                      View All Account Reports
                    </a>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Or navigate to Chart of Accounts to view individual account reports
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Search, Filter, FileText, Eye, RotateCcw, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { type JournalEntry, AccountingService } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"
import JournalEntryReview from "@/components/journal-entry-review"

export default function JournalEntriesList() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    accountType: "All Types", // Updated default value to be a non-empty string
    searchTerm: "",
  })

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setFilters((prev) => ({
      ...prev,
      startDate: monthStart.toISOString().split("T")[0],
      endDate: monthEnd.toISOString().split("T")[0],
    }))

    // Load entries immediately
    loadEntries()
  }, [])

  // Add a separate useEffect to reload when filters change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadEntries()
    }
  }, [filters.startDate, filters.endDate])

  // Fix the loadEntries function and add better error handling
  const loadEntries = async () => {
    try {
      setLoading(true)
      console.log("Loading entries with filters:", filters) // Debug log

      const filterParams = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        accountType: filters.accountType === "All Types" ? undefined : filters.accountType,
        searchTerm: filters.searchTerm || undefined,
      }

      const data = await AccountingService.getJournalEntries(filterParams)
      console.log("Loaded entries:", data) // Debug log
      setEntries(data)
    } catch (error) {
      console.error("Error loading entries:", error)
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const applyFilters = () => {
    loadEntries()
  }

  // Auto-apply filters when they change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadEntries()
    }
  }, [filters.accountType, filters.searchTerm])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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

  const handleReverseEntry = async (entryId: string) => {
    try {
      await AccountingService.reverseJournalEntry(entryId)
      toast({
        title: "Success",
        description: "Journal entry debit and credit amounts have been swapped",
      })
      // Reload entries to show the updated amounts
      loadEntries()
    } catch (error) {
      console.error("Error reversing journal entry:", error)
      toast({
        title: "Error",
        description: "Failed to reverse journal entry amounts",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-muted-foreground">View and manage all journal entries</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter journal entries by date, account type, or search term</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select value={filters.accountType} onValueChange={(value) => handleFilterChange("accountType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
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
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search entries..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={applyFilters} disabled={loading} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Apply Filters"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Journal Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">{entry.entry_number}</TableCell>
                    <TableCell>{formatDate(entry.entry_date)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{entry.description}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.reference || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(entry.total_debit)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.is_balanced ? "default" : "destructive"}>
                        {entry.is_balanced ? "Balanced" : "Unbalanced"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[99vw] w-[99vw] max-h-[95vh] h-[95vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle>Journal Entry Review</DialogTitle>
                            </DialogHeader>
                            {selectedEntry && (
                              <JournalEntryReview 
                                entry={selectedEntry} 
                                onClose={() => setSelectedEntry(null)} 
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        {entry.journal_entry_lines?.some((line: any) => line.image_data) && (
                          <div className="flex items-center" title="This entry has supporting documents">
                            <Image className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReverseEntry(entry.id)}
                          title="Swap Debit/Credit Amounts"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading journal entries..." : "No journal entries found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

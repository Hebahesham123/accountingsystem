"use client"

import { useState, useEffect } from "react"
import { Search, Filter, FileText, Eye, RotateCcw, Image, Plus, Calendar, DollarSign, Users, AlertCircle, CheckCircle, Clock, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type JournalEntry, AccountingService } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"
import JournalEntryReview from "@/components/journal-entry-review"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function JournalEntriesList() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalDebits: 0,
    totalCredits: 0,
    balancedEntries: 0,
    entriesWithLines: 0,
    entriesWithoutLines: 0
  })
  const { toast } = useToast()

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    accountType: "All Types",
    searchTerm: "",
    status: "All Statuses"
  })

  useEffect(() => {
    // Set default dates (current year to show more entries)
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)

    setFilters((prev) => ({
      ...prev,
      startDate: yearStart.toISOString().split("T")[0],
      endDate: yearEnd.toISOString().split("T")[0],
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

  // Enhanced loadEntries function with statistics
  const loadEntries = async () => {
    try {
      setLoading(true)
      console.log("Loading entries with filters:", filters)

      const filterParams = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        accountType: filters.accountType === "All Types" ? undefined : filters.accountType,
        searchTerm: filters.searchTerm || undefined,
      }

      console.log("Filter params:", filterParams)
      const data = await AccountingService.getJournalEntries(filterParams)
      console.log("Loaded entries:", data)
      console.log("Number of entries loaded:", data?.length || 0)
      
      setEntries(data)

      // Calculate statistics
      const totalDebits = data.reduce((sum, entry) => sum + (entry.total_debit || 0), 0)
      const totalCredits = data.reduce((sum, entry) => sum + (entry.total_credit || 0), 0)
      const balancedEntries = data.filter(entry => entry.is_balanced).length
      const entriesWithLines = data.filter(entry => entry.journal_entry_lines && entry.journal_entry_lines.length > 0).length
      const entriesWithoutLines = data.length - entriesWithLines

      setStats({
        totalEntries: data.length,
        totalDebits,
        totalCredits,
        balancedEntries,
        entriesWithLines,
        entriesWithoutLines
      })
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

  const handleFilterChange = (field: string, value: string) =>
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))

  const applyFilters = () => {
    loadEntries()
  }

  // Auto-apply filters when they change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadEntries()
    }
  }, [filters.accountType, filters.searchTerm, filters.status])

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

  const getStatusBadge = (entry: JournalEntry) => {
    const hasLines = entry.journal_entry_lines && entry.journal_entry_lines.length > 0
    
    if (!hasLines) {
      return (
        <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Missing Lines
        </Badge>
      )
    }
    
    if (entry.is_balanced) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Balanced
        </Badge>
      )
    }
    
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Unbalanced
      </Badge>
    )
  }

  // Enhanced reverse function with better error handling
  const handleReverseEntry = async (entryId: string) => {
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
        throw new Error("No journal entry lines found to reverse")
      }

      // Update each line by swapping debit and credit amounts
      for (const line of lines) {
        const { error: updateError } = await supabase
          .from("journal_entry_lines")
          .update({
            debit_amount: line.credit_amount,
            credit_amount: line.debit_amount
          })
          .eq("id", line.id)

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
        description: error instanceof Error ? error.message : "Failed to reverse journal entry amounts",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) {
      return
    }

    try {
      // First delete the journal entry lines
      const { error: linesError } = await supabase
        .from("journal_entry_lines")
        .delete()
        .eq("journal_entry_id", entryId)

      if (linesError) {
        console.error("Error deleting journal entry lines:", linesError)
        throw new Error("Failed to delete journal entry lines")
      }

      // Then delete the journal entry header
      const { error: entryError } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entryId)

      if (entryError) {
        console.error("Error deleting journal entry:", entryError)
        throw new Error("Failed to delete journal entry")
      }

      toast({
        title: "Success",
        description: "Journal entry deleted successfully",
      })
      
      // Reload entries
      loadEntries()
    } catch (error) {
      console.error("Error deleting journal entry:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete journal entry",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-1">Manage and review all journal entries</p>
        </div>
        <div className="flex gap-3">
          <Link href="/journal-entries/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.balancedEntries} balanced
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDebits)}</div>
            <p className="text-xs text-muted-foreground">
              All entries combined
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalCredits)}</div>
            <p className="text-xs text-muted-foreground">
              All entries combined
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Integrity</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.entriesWithoutLines}</div>
            <p className="text-xs text-muted-foreground">
              Missing lines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select value={filters.accountType} onValueChange={(value) => handleFilterChange("accountType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Statuses">All Statuses</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Unbalanced">Unbalanced</SelectItem>
                  <SelectItem value="Missing Lines">Missing Lines</SelectItem>
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
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} disabled={loading} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              {loading ? "Loading..." : "Apply Filters"}
            </Button>
            <Button 
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  startDate: "",
                  endDate: "",
                  accountType: "All Types",
                  searchTerm: "",
                  status: "All Statuses"
                }))
              }} 
              variant="outline"
              disabled={loading}
            >
              Show All
            </Button>
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
          <CardDescription>
            Complete details of all journal entries with enhanced functionality
          </CardDescription>
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
                  <TableHead>Lines</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Loading entries...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No journal entries found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-medium">
                        {entry.entry_number}
                      </TableCell>
                      <TableCell>{formatDate(entry.entry_date)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.description || "No description"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {entry.reference || "No reference"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-medium">
                            {formatCurrency(entry.total_debit)}
                          </span>
                          <span className="text-blue-600 font-medium">
                            {formatCurrency(entry.total_credit)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {entry.journal_entry_lines?.length || 0}
                          </span>
                          {entry.journal_entry_lines && entry.journal_entry_lines.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Complete
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(entry)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Link href={`/journal-entries/${entry.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          {entry.journal_entry_lines && entry.journal_entry_lines.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReverseEntry(entry.id)}
                              title="Reverse debit and credit amounts"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entry Review Modal */}
      {selectedEntry && (
        <JournalEntryReview 
          entry={selectedEntry} 
          onClose={() => setSelectedEntry(null)} 
        />
      )}
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calculator, Save, RotateCcw, Plus, Trash2, Search, ChevronRight, ChevronDown, Upload, Image, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type Account, AccountingService } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"

interface JournalLine {
  id: string
  account_id: string
  description: string
  type: "debit" | "credit"
  amount: number
  image_data?: string
}

interface HierarchicalAccount extends Account {
  children?: HierarchicalAccount[]
  level: number
}

export default function JournalEntryForm() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [hierarchicalAccounts, setHierarchicalAccounts] = useState<HierarchicalAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [searchValue, setSearchValue] = useState("")
  const [openPopovers, setOpenPopovers] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    description: "",
  })
  const [entryNumber, setEntryNumber] = useState<string>("")

  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", account_id: "", description: "", type: "debit", amount: 0 },
    { id: "2", account_id: "", description: "", type: "credit", amount: 0 },
  ])

  useEffect(() => {
    loadAccounts()
    generateEntryNumber()
  }, [])

  const generateEntryNumber = async () => {
    try {
      const number = await AccountingService.generateEntryNumber()
      setEntryNumber(number)
    } catch (error) {
      console.error("Error generating entry number:", error)
      setEntryNumber("JE-001") // Fallback
    }
  }

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const data = await AccountingService.getChartOfAccounts()
      setAccounts(data)
      
      // Build hierarchical structure
      const hierarchical = buildAccountHierarchy(data)
      setHierarchicalAccounts(hierarchical)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  const buildAccountHierarchy = (accounts: Account[]): HierarchicalAccount[] => {
    const accountMap = new Map<string, HierarchicalAccount>()
    const rootAccounts: HierarchicalAccount[] = []

    // First pass: create all account objects with level 0
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        children: [],
        level: 0
      })
    })

    // Second pass: build parent-child relationships
    accounts.forEach(account => {
      const hierarchicalAccount = accountMap.get(account.id)!
      
      if (account.parent_account_id) {
        const parent = accountMap.get(account.parent_account_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(hierarchicalAccount)
          hierarchicalAccount.level = parent.level + 1
        }
      } else {
        rootAccounts.push(hierarchicalAccount)
      }
    })

    // Sort accounts by code within each level
    const sortAccounts = (accountList: HierarchicalAccount[]) => {
      accountList.sort((a, b) => a.code.localeCompare(b.code))
      accountList.forEach(account => {
        if (account.children && account.children.length > 0) {
          sortAccounts(account.children)
        }
      })
    }

    sortAccounts(rootAccounts)
    return rootAccounts
  }

  const toggleAccountExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedAccounts(newExpanded)
  }

  const getAccountTypeIcon = (type: string) => {
    const icons = {
      Asset: "💰",
      Liability: "📋",
      Equity: "🏛️",
      Revenue: "📈",
      Expense: "💸",
    }
    return icons[type as keyof typeof icons] || "📊"
  }

  const renderAccountOption = (account: HierarchicalAccount, depth = 0, onSelect?: (accountId: string) => void) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedAccounts.has(account.id)
    const accountTypeName = account.account_types?.name || account.account_type
    const isSubAccount = !!account.parent_account_id

    return (
      <div key={account.id}>
        <CommandItem
          value={account.id}
          onSelect={() => {
            if (onSelect) {
              onSelect(account.id)
            }
          }}
          className="flex items-center gap-2 cursor-pointer"
          style={{ paddingLeft: `${depth * 20 + 16}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                toggleAccountExpansion(account.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          ) : (
            <div className="w-4 mr-1" />
          )}
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{getAccountTypeIcon(accountTypeName)}</span>
            {isSubAccount && (
              <span className="text-blue-500 text-xs">📁</span>
            )}
            <span className="font-mono text-sm text-gray-600">{account.code}</span>
            <span className="font-medium">{account.name}</span>
            <Badge className={getAccountTypeColor(accountTypeName)}>{accountTypeName}</Badge>
          </div>
        </CommandItem>

        {hasChildren && isExpanded && (
          <div>
            {account.children!.map(child => renderAccountOption(child, depth + 1, onSelect))}
          </div>
        )}
      </div>
    )
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

  const filterAccounts = (accounts: HierarchicalAccount[], searchTerm: string): HierarchicalAccount[] => {
    if (!searchTerm) return accounts
    
    const searchLower = searchTerm.toLowerCase()
    
    return accounts.filter(account => {
      const matchesSearch = 
        account.code.toLowerCase().includes(searchLower) ||
        account.name.toLowerCase().includes(searchLower) ||
        (account.account_types?.name || account.account_type).toLowerCase().includes(searchLower)
      
      if (matchesSearch) return true
      
      // Check children recursively
      if (account.children && account.children.length > 0) {
        const filteredChildren = filterAccounts(account.children, searchTerm)
        if (filteredChildren.length > 0) {
          // Auto-expand parent accounts when searching
          setExpandedAccounts(prev => new Set([...prev, account.id]))
          return true
        }
      }
      
      return false
    }).map(account => ({
      ...account,
      children: account.children ? filterAccounts(account.children, searchTerm) : undefined
    }))
  }

  const getFilteredAccounts = () => {
    return filterAccounts(hierarchicalAccounts, searchValue)
  }

  const handleAccountSearch = (value: string) => {
    setSearchValue(value)
    
    // If clearing search, collapse all expanded accounts
    if (!value) {
      setExpandedAccounts(new Set())
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLineChange = (lineId: string, field: keyof JournalLine, value: any) => {
    setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)))
  }

  const handleImageUpload = (lineId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      handleLineChange(lineId, "image_data", result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (lineId: string) => {
    handleLineChange(lineId, "image_data", undefined)
  }

  const addLine = () => {
    const newLine: JournalLine = {
      id: Date.now().toString(),
      account_id: "",
      description: "",
      type: "debit",
      amount: 0,
    }
    setLines([...lines, newLine])
  }

  const removeLine = (lineId: string) => {
    if (lines.length > 2) {
      setLines(lines.filter((line) => line.id !== lineId))
    }
  }

  const getTotalDebits = () => {
    return lines.filter((line) => line.type === "debit").reduce((sum, line) => sum + line.amount, 0)
  }

  const getTotalCredits = () => {
    return lines.filter((line) => line.type === "credit").reduce((sum, line) => sum + line.amount, 0)
  }

  const isBalanced = () => {
    return Math.abs(getTotalDebits() - getTotalCredits()) < 0.01
  }

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split("T")[0],
      description: "",
    })
    setLines([
      { id: "1", account_id: "", description: "", type: "debit", amount: 0 },
      { id: "2", account_id: "", description: "", type: "credit", amount: 0 },
    ])
    generateEntryNumber() // Generate new entry number for next entry
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please enter a description for this journal entry",
        variant: "destructive",
      })
      return
    }

    const validLines = lines.filter((line) => line.account_id && line.amount > 0)

    if (validLines.length < 2) {
      toast({
        title: "Insufficient Lines",
        description: "At least two lines with accounts and amounts are required",
        variant: "destructive",
      })
      return
    }

    if (!isBalanced()) {
      toast({
        title: "Entry Not Balanced",
        description: `Total debits ($${getTotalDebits().toFixed(2)}) must equal total credits ($${getTotalCredits().toFixed(2)})`,
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Convert lines to the format expected by the service
      const entryLines = validLines.map((line) => ({
        account_id: line.account_id,
        description: line.description || formData.description,
        debit_amount: line.type === "debit" ? line.amount : 0,
        credit_amount: line.type === "credit" ? line.amount : 0,
        image_data: line.image_data,
      }))

      await AccountingService.createJournalEntry({
        entry_date: formData.entry_date,
        description: formData.description,
        lines: entryLines,
      })

      toast({
        title: "Success",
        description: `Journal entry ${entryNumber} created successfully`,
      })

      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    return account ? `${account.code} - ${account.name}` : ""
  }

  const getAccountType = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    return account?.account_type || ""
  }

  const getAccountDisplayInfo = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return { code: "", name: "", type: "", isSubAccount: false, parentName: "", hierarchyPath: "", balance: 0 }
    
    const isSubAccount = !!account.parent_account_id
    const parentAccount = account.parent_account_id ? accounts.find(a => a.id === account.parent_account_id) : null
    
    // Build hierarchy path
    let hierarchyPath = ""
    if (isSubAccount && parentAccount) {
      hierarchyPath = `${parentAccount.code} → ${account.code}`
    }
    
    // For now, we'll set balance to 0 - this could be enhanced to fetch real balances
    const balance = 0
    
    return {
      code: account.code,
      name: account.name,
      type: account.account_types?.name || account.account_type,
      isSubAccount,
      parentName: parentAccount?.name || "",
      hierarchyPath,
      balance
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleAccountSelection = (lineId: string, accountId: string) => {
    handleLineChange(lineId, "account_id", accountId)
    setSearchValue("") // Clear search after selection
    
    // Close the popover for this line
    setOpenPopovers(prev => {
      const newSet = new Set(prev)
      newSet.delete(lineId)
      return newSet
    })
  }

  const togglePopover = (lineId: string, open: boolean) => {
    setOpenPopovers(prev => {
      const newSet = new Set(prev)
      if (open) {
        newSet.add(lineId)
      } else {
        newSet.delete(lineId)
      }
      return newSet
    })
    
    // Clear search when opening popover
    if (open) {
      setSearchValue("")
      setExpandedAccounts(new Set())
    }
  }

  if (loadingAccounts) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create Journal Entry
          </CardTitle>
          <CardDescription>
            Create a journal entry with multiple lines. Each line can be either debit or credit.
            You can select any account or sub-account from the chart of accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Entry Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry_date">Entry Date *</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => handleInputChange("entry_date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Entry Number</Label>
                <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
                  <Badge variant="outline" className="font-mono">
                    {entryNumber || "Loading..."}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Balance Status</Label>
                <div className="flex items-center h-10">
                  <Badge variant={isBalanced() ? "default" : "destructive"}>
                    {isBalanced() ? "Balanced ✓" : "Not Balanced ✗"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe this journal entry..."
                required
              />
            </div>

            <Separator />

            {/* Journal Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Journal Entry Lines</h3>
                <Button type="button" variant="outline" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => {
                  const accountInfo = getAccountDisplayInfo(line.account_id)
                  
                  return (
                    <div key={line.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">Line {index + 1}</Badge>
                        {lines.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Account *</Label>
                          <Popover
                            open={openPopovers.has(line.id)}
                            onOpenChange={open => togglePopover(line.id, open)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between text-left"
                              >
                                {line.account_id ? (
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                      {accountInfo.code} - {accountInfo.name}
                                    </span>
                                    {accountInfo.isSubAccount && (
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <div>Sub-account of: {accountInfo.parentName}</div>
                                        <div className="text-blue-600 font-mono">
                                          {accountInfo.hierarchyPath}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  "Select account..."
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-0" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Search accounts by code or name..." 
                                  value={searchValue}
                                  onValueChange={handleAccountSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>No accounts found.</CommandEmpty>
                                  <CommandGroup>
                                    {getFilteredAccounts().map(account => 
                                      renderAccountOption(account, 0, (accountId) => {
                                        handleAccountSelection(line.id, accountId)
                                      })
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          
                          {line.account_id && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <span>Type: {accountInfo.type}</span>
                                <span>Balance: {formatCurrency(accountInfo.balance)}</span>
                              </div>
                              {accountInfo.isSubAccount && (
                                <div className="text-blue-600 space-y-1">
                                  <div>Sub-account of: {accountInfo.parentName}</div>
                                  <div className="font-mono text-xs">
                                    {accountInfo.hierarchyPath}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Type *</Label>
                          <Select
                            value={line.type}
                            onValueChange={(value: "debit" | "credit") => handleLineChange(line.id, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debit">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800">Debit</Badge>
                                  <span>Dr</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="credit">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-red-100 text-red-800">Credit</Badge>
                                  <span>Cr</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.amount || ""}
                            onChange={(e) => handleLineChange(line.id, "amount", Number.parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Line Description</Label>
                          <Input
                            value={line.description}
                            onChange={(e) => handleLineChange(line.id, "description", e.target.value)}
                            placeholder="Optional line description"
                          />
                        </div>
                      </div>

                      {/* Image Upload Section */}
                      <div className="mt-4 space-y-2">
                        <Label>Supporting Document</Label>
                        <div className="flex items-center gap-2">
                          {line.image_data ? (
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={line.image_data}
                                  alt="Uploaded document"
                                  className="w-48 h-36 object-contain rounded border cursor-pointer hover:opacity-80 hover:scale-105 transition-transform bg-white"
                                  onClick={() => {
                                    // Open image in new tab for full view
                                    const newWindow = window.open()
                                    if (newWindow) {
                                      newWindow.document.write(`
                                        <html>
                                          <head>
                                            <title>Document Preview - 1080x1080</title>
                                            <style>
                                              body { 
                                                margin:0; 
                                                padding:20px; 
                                                text-align:center; 
                                                background:#f5f5f5; 
                                                font-family: Arial, sans-serif; 
                                                overflow-x: auto;
                                              }
                                              img { 
                                                width: 1080px; 
                                                height: 1080px; 
                                                object-fit: contain; 
                                                border-radius:8px; 
                                                box-shadow:0 4px 12px rgba(0,0,0,0.15);
                                                border: 2px solid #e5e7eb;
                                              }
                                              .header { 
                                                margin-bottom: 20px; 
                                                color: #333; 
                                                font-size: 18px;
                                              }
                                              .container {
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                min-height: 100vh;
                                                justify-content: center;
                                              }
                                            </style>
                                          </head>
                                          <body>
                                            <div class="container">
                                              <div class="header">
                                                <h2>Supporting Document - Full Size (1080x1080)</h2>
                                                <p>Click outside the image or press ESC to close</p>
                                              </div>
                                              <img src="${line.image_data}" />
                                            </div>
                                          </body>
                                        </html>
                                      `)
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                  onClick={() => removeImage(line.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-600">Document Uploaded</span>
                                <span className="text-xs text-muted-foreground">Click to view full size</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleImageUpload(line.id, file)
                                  }
                                }}
                                className="hidden"
                                id={`image-upload-${line.id}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`image-upload-${line.id}`)?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                              </Button>
                              <span className="text-sm text-muted-foreground">Receipt, invoice, etc.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals Summary */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium mb-3">Entry Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-700">Total Debits</div>
                    <div className="text-2xl font-bold">${getTotalDebits().toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-700">Total Credits</div>
                    <div className="text-2xl font-bold">${getTotalCredits().toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Difference</div>
                    <div className="text-2xl font-bold">
                      ${Math.abs(getTotalDebits() - getTotalCredits()).toFixed(2)}
                    </div>
                    <Badge variant={isBalanced() ? "default" : "destructive"} className="mt-1">
                      {isBalanced() ? "Balanced" : "Not Balanced"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button type="submit" disabled={loading || !isBalanced()}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

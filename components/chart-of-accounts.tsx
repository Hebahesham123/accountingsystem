"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, AlertCircle, FileText, FolderOpen, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { type Account, type AccountType, AccountingService } from "@/lib/accounting-utils"
import { useToast } from "@/hooks/use-toast"

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isAccountTypeDialogOpen, setIsAccountTypeDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editingAccountType, setEditingAccountType] = useState<AccountType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [accountFormData, setAccountFormData] = useState({
    code: "",
    name: "",
    description: "",
    account_type_id: "",
    parent_account_id: "",
    is_header: false,
  })

  const [accountTypeFormData, setAccountTypeFormData] = useState({
    name: "",
    description: "",
    normal_balance: "debit" as "debit" | "credit",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [accountsData, accountTypesData] = await Promise.all([
        AccountingService.getChartOfAccounts(),
        AccountingService.getAccountTypes(),
      ])
      setAccounts(accountsData)
      setAccountTypes(accountTypesData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccountInputChange = async (field: string, value: string | boolean) => {
    const newData = {
      ...accountFormData,
      [field]: value,
    }
    
    setAccountFormData(newData)
    
    // Auto-generate code when account type or parent account changes
    if (field === "account_type_id" || field === "parent_account_id") {
      try {
        const generatedCode = await AccountingService.generateAccountCode(
          field === "account_type_id" ? value as string : newData.account_type_id,
          field === "parent_account_id" ? (value === "none" ? undefined : value as string) : newData.parent_account_id
        )
        
        setAccountFormData((prev) => ({
          ...prev,
          code: generatedCode,
        }))
      } catch (error) {
        console.error("Error generating account code:", error)
        // Don't show error to user, just use a fallback
        const fallbackCode = `${Date.now().toString().slice(-4)}`
        setAccountFormData((prev) => ({
          ...prev,
          code: fallbackCode,
        }))
      }
    }
  }

  const handleAccountTypeInputChange = (field: string, value: string) => {
    setAccountTypeFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountFormData.name.trim() || !accountFormData.account_type_id) {
      toast({
        title: "Missing Information",
        description: "Account name and type are required",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      if (editingAccount) {
        // Update existing account
        const updateData = {
          code: accountFormData.code.trim() || undefined,
          name: accountFormData.name.trim(),
          description: accountFormData.description.trim() || undefined,
          account_type_id: accountFormData.account_type_id,
          parent_account_id: accountFormData.parent_account_id === "none" ? undefined : accountFormData.parent_account_id,
          is_header: accountFormData.is_header,
        }
        
        await AccountingService.updateAccount(editingAccount.id, updateData)

        toast({
          title: "Success",
          description: "Account updated successfully",
        })
      } else {
        // Create new account
        const accountData = {
          code: accountFormData.code.trim() || undefined,
          name: accountFormData.name.trim(),
          description: accountFormData.description.trim() || undefined,
          account_type_id: accountFormData.account_type_id,
          parent_account_id: accountFormData.parent_account_id === "none" ? undefined : accountFormData.parent_account_id,
          is_header: accountFormData.is_header,
        }
        
        await AccountingService.createAccount(accountData)

        toast({
          title: "Success",
          description: "Account created successfully",
        })
      }

      setIsAccountDialogOpen(false)
      resetAccountForm()
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save account",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (account: Account) => {
    try {
      setSaving(true)
      
      // Try the normal deletion process first
      try {
        const canDelete = await AccountingService.canDeleteAccount(account.id)
        
        if (!canDelete) {
          toast({
            title: "Cannot Delete Account",
            description: "This account has transactions or sub-accounts and cannot be deleted",
            variant: "destructive",
          })
          return
        }

        await AccountingService.deleteAccount(account.id)
      } catch (error) {
        console.log("Normal delete failed, trying simple delete:", error)
        // If normal delete fails, try simple delete
        await AccountingService.simpleDeleteAccount(account.id)
      }

      toast({
        title: "Success",
        description: "Account deleted successfully",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAccountTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountTypeFormData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Account type name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      if (editingAccountType) {
        await AccountingService.updateAccountType(editingAccountType.id, {
          name: accountTypeFormData.name.trim(),
          description: accountTypeFormData.description.trim() || undefined,
          normal_balance: accountTypeFormData.normal_balance,
        })

        toast({
          title: "Success",
          description: "Account type updated successfully",
        })
      } else {
        await AccountingService.createAccountType({
          name: accountTypeFormData.name.trim(),
          description: accountTypeFormData.description.trim() || undefined,
          normal_balance: accountTypeFormData.normal_balance,
        })

        toast({
          title: "Success",
          description: "Account type created successfully",
        })
      }

      setIsAccountTypeDialogOpen(false)
      resetAccountTypeForm()
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save account type",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccountType = async (type: AccountType) => {
    try {
      setSaving(true)
      await AccountingService.deleteAccountType(type.id)
      
      toast({
        title: "Success",
        description: "Account type deleted successfully",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account type",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetAccountForm = () => {
    setAccountFormData({
      code: "",
      name: "",
      description: "",
      account_type_id: "",
      parent_account_id: "none",
      is_header: false,
    })
    setEditingAccount(null)
  }

  const resetAccountTypeForm = () => {
    setAccountTypeFormData({
      name: "",
      description: "",
      normal_balance: "debit",
    })
    setEditingAccountType(null)
  }

  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedNodes(newExpanded)
  }

  const getAccountTypeColor = (type: string) => {
    const colors = {
      Assets: "bg-green-100 text-green-800",
      Liabilities: "bg-red-100 text-red-800",
      Equity: "bg-blue-100 text-blue-800",
      Revenue: "bg-purple-100 text-purple-800",
      Expenses: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const buildAccountTree = (accounts: Account[], parentId: string | null = null): Account[] => {
    return accounts
      .filter((account) => account.parent_account_id === parentId)
      .map((account) => ({
        ...account,
        children: buildAccountTree(accounts, account.id),
      }))
  }

  const renderAccountNode = (account: Account & { children?: Account[] }, level = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedNodes.has(account.id)
    const accountTypeName = account.account_types?.name || account.account_type

    return (
      <div key={account.id} className="w-full">
        <div
          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
          style={{ marginLeft: `${level * 24}px` }}
        >
          {hasChildren ? (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleExpanded(account.id)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 flex items-center gap-3">
            {account.is_header ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
            <span className="font-mono text-sm text-gray-600">{account.code}</span>
            <span className="font-medium">{account.name}</span>
            <Badge className={getAccountTypeColor(accountTypeName)}>{accountTypeName}</Badge>
            {account.account_types?.normal_balance && (
              <Badge variant="outline" className="text-xs">
                {account.account_types.normal_balance === "debit" ? "Dr" : "Cr"}
              </Badge>
            )}
            {account.is_header && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Header Account
              </Badge>
            )}
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingAccount(null)
                setAccountFormData({
                  code: "",
                  name: "",
                  description: "",
                  account_type_id: account.account_type_id || account.account_type.toLowerCase(),
                  parent_account_id: account.id,
                  is_header: false,
                })
                setIsAccountDialogOpen(true)
              }}
              title="Add Sub-Account"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Sub
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingAccount(account)
                setAccountFormData({
                  code: account.code,
                  name: account.name,
                  description: account.description || "",
                  account_type_id: account.account_type_id || account.account_type.toLowerCase(),
                  parent_account_id: account.parent_account_id || "none",
                  is_header: account.is_header || false,
                })
                setIsAccountDialogOpen(true)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the account "{account.name}" ({account.code})?
                    <br />
                    <br />
                    <strong>This action cannot be undone.</strong> The account will only be deleted if it has no transactions or sub-accounts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteAccount(account)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={`/account-reports/${account.id}`}>
                <FileText className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{account.children!.map((child) => renderAccountNode(child, level + 1))}</div>
        )}
      </div>
    )
  }

  const accountTree = buildAccountTree(accounts)

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading chart of accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="account-types">Account Types</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chart of Accounts</CardTitle>
                  <CardDescription>Manage your company's hierarchical chart of accounts structure</CardDescription>
                </div>
                <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetAccountForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAccount 
                          ? "Edit Account" 
                          : accountFormData.parent_account_id && accountFormData.parent_account_id !== "none"
                            ? "Add Sub-Account" 
                            : "Add New Account"
                        }
                      </DialogTitle>
                      <DialogDescription>
                        {editingAccount
                          ? "Update the account information below."
                          : accountFormData.parent_account_id && accountFormData.parent_account_id !== "none"
                            ? "Create a new sub-account under the selected parent account."
                            : "Create a new account in your chart of accounts."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAccountSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="code">Account Code</Label>
                            <span className="text-sm text-muted-foreground">(Auto-generated)</span>
                          </div>
                          <Input
                            id="code"
                            value={accountFormData.code}
                            onChange={(e) => handleAccountInputChange("code", e.target.value)}
                            placeholder="Auto-generated when you select account type"
                            className="bg-muted/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Account codes are automatically generated based on account type and hierarchy
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account_type_id">Account Type *</Label>
                          <Select
                            value={accountFormData.account_type_id}
                            onValueChange={(value) => handleAccountInputChange("account_type_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {accountTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getAccountTypeColor(type.name)}>{type.name}</Badge>
                                    <span className="text-xs">({type.normal_balance})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Account Name *</Label>
                        <Input
                          id="name"
                          value={accountFormData.name}
                          onChange={(e) => handleAccountInputChange("name", e.target.value)}
                          placeholder="e.g., Cash"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parent_account_id">Parent Account</Label>
                        <Select
                          value={accountFormData.parent_account_id}
                          onValueChange={(value) => handleAccountInputChange("parent_account_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent account (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Top Level)</SelectItem>
                            {accounts
                              .filter((account) => account.is_active)
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">{account.code}</span>
                                    <span>{account.name}</span>
                                    {account.is_header && (
                                      <Badge variant="outline" className="text-xs">Header</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select a parent account to create a sub-account, or leave empty for a top-level account.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={accountFormData.description}
                          onChange={(e) => handleAccountInputChange("description", e.target.value)}
                          placeholder="Optional description"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_header"
                          checked={accountFormData.is_header}
                          onCheckedChange={(checked) => handleAccountInputChange("is_header", checked)}
                        />
                        <Label htmlFor="is_header">Header Account (cannot have transactions)</Label>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : editingAccount ? "Update" : "Create"} Account
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {accountTree.length > 0 ? (
                  accountTree.map((account) => renderAccountNode(account))
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No accounts found. Create your first account to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-types">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Account Types</CardTitle>
                  <CardDescription>
                    Manage custom account types for your chart of accounts. System types can be edited but not deleted.
                  </CardDescription>
                </div>
                <Dialog open={isAccountTypeDialogOpen} onOpenChange={setIsAccountTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetAccountTypeForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingAccountType ? "Edit Account Type" : "Add New Account Type"}</DialogTitle>
                      <DialogDescription>
                        {editingAccountType
                          ? "Update the account type information below."
                          : "Create a custom account type for your chart of accounts."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAccountTypeSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="type_name">Account Type Name *</Label>
                        <Input
                          id="type_name"
                          value={accountTypeFormData.name}
                          onChange={(e) => handleAccountTypeInputChange("name", e.target.value)}
                          placeholder="e.g., Current Asset, Fixed Asset, etc."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="normal_balance">Normal Balance *</Label>
                        <Select
                          value={accountTypeFormData.normal_balance}
                          onValueChange={(value: "debit" | "credit") =>
                            handleAccountTypeInputChange("normal_balance", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800">Debit</Badge>
                                <span className="text-sm">Increases with debits (Assets, Expenses)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="credit">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-100 text-red-800">Credit</Badge>
                                <span className="text-sm">Increases with credits (Liabilities, Equity, Revenue)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type_description">Description</Label>
                        <Textarea
                          id="type_description"
                          value={accountTypeFormData.description}
                          onChange={(e) => handleAccountTypeInputChange("description", e.target.value)}
                          placeholder="Describe this account type..."
                        />
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAccountTypeDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : editingAccountType ? "Update" : "Create"} Account Type
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountTypes.map((type) => (
                  <Card key={type.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getAccountTypeColor(type.name)}>{type.name}</Badge>
                      {type.is_system && <Badge variant="outline">System</Badge>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Normal Balance:</span>
                        <Badge variant="outline" className="text-xs">
                          {type.normal_balance === "debit" ? "Debit" : "Credit"}
                        </Badge>
                      </div>
                      {type.description && <p className="text-sm text-muted-foreground">{type.description}</p>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAccountType(type)
                          setAccountTypeFormData({
                            name: type.name,
                            description: type.description || "",
                            normal_balance: type.normal_balance,
                          })
                          setIsAccountTypeDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={type.is_system}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the account type "{type.name}"?
                              <br />
                              <br />
                              <strong>This action cannot be undone.</strong> The account type will only be deleted if it's not being used by any accounts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccountType(type)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Account Type
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

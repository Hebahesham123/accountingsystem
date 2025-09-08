"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, FileText, TrendingUp, Users, PieChart, BookOpen, DollarSign, BarChart3 } from "lucide-react"
import { AccountingService, type DashboardStats } from "@/lib/accounting-utils"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/components/auth/auth-provider"

export default function HomePage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    netIncome: 0,
    journalEntriesCount: 0,
    activeAccountsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await AccountingService.getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }
  const features = [
    {
      title: "Chart of Accounts",
      description: "Manage your hierarchical chart of accounts structure",
      icon: BookOpen,
      href: "/chart-of-accounts",
      color: "text-green-600",
    },
    {
      title: "Journal Entries",
      description: "Create and manage double-entry journal entries",
      icon: FileText,
      href: "/journal-entries",
      color: "text-blue-600",
    },
    {
      title: "General Ledger",
      description: "View detailed transaction history by account",
      icon: BarChart3,
      href: "/general-ledger",
      color: "text-indigo-600",
    },
    {
      title: "Trial Balance",
      description: "View trial balance and verify account balances",
      icon: Calculator,
      href: "/trial-balance",
      color: "text-purple-600",
    },
    {
      title: "Financial Reports",
      description: "Generate balance sheet, income statement, and cash flow",
      icon: TrendingUp,
      href: "/financial-reports",
      color: "text-orange-600",
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/users",
      color: "text-red-600",
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {profile?.name || 'User'}!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete double-entry bookkeeping system with chart of accounts, journal entries, financial reporting, and
            audit trails. Built for accuracy and compliance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : formatCurrency(stats.totalAssets)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <PieChart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Net Income</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : formatCurrency(stats.netIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Journal Entries</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.journalEntriesCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.activeAccountsCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href}>
                    <Button className="w-full">Access {feature.title}</Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Key Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Double-Entry Bookkeeping</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Automatic balance validation (Debits = Credits)</li>
                <li>• Hierarchical chart of accounts structure</li>
                <li>• Complete audit trail for all transactions</li>
                <li>• Support for multiple accounting periods</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Financial Reporting</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Balance Sheet (Assets = Liabilities + Equity)</li>
                <li>• Income Statement (Revenue - Expenses)</li>
                <li>• Trial Balance with date filtering</li>
                <li>• General Ledger by account</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">User Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Role-based access control (Admin, Accountant, User)</li>
                <li>• Audit trail for all user actions</li>
                <li>• Period locking to prevent unauthorized changes</li>
                <li>• Secure authentication and authorization</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Data Integrity</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Automatic balance calculations</li>
                <li>• Prevent deletion of accounts with activity</li>
                <li>• Opening balance validation</li>
                <li>• Real-time balance updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}

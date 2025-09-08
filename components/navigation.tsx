"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calculator, FileText, TrendingUp, BookOpen, BarChart3, Home, Menu, ClipboardList } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chart of Accounts", href: "/chart-of-accounts", icon: BookOpen },
  { name: "Journal Entries", href: "/journal-entries", icon: FileText },
  { name: "General Ledger", href: "/general-ledger", icon: BarChart3 },
  { name: "Trial Balance", href: "/trial-balance", icon: Calculator },
  { name: "Financial Reports", href: "/financial-reports", icon: TrendingUp },
  { name: "Account Reports", href: "/account-reports", icon: ClipboardList },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Calculator className="h-6 w-6" />
              <span>Accounting System</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.name} href={item.href}>
                    <Button variant={pathname === item.href ? "default" : "ghost"} size="sm" className="gap-2">
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-2 mt-8">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={pathname === item.href ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

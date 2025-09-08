"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calculator, FileText, TrendingUp, BookOpen, BarChart3, Home, Menu, ClipboardList, User, LogOut, Settings, Users } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chart of Accounts", href: "/chart-of-accounts", icon: BookOpen },
  { name: "Journal Entries", href: "/journal-entries", icon: FileText },
  { name: "General Ledger", href: "/general-ledger", icon: BarChart3 },
  { name: "Trial Balance", href: "/trial-balance", icon: Calculator },
  { name: "Financial Reports", href: "/financial-reports", icon: TrendingUp },
  { name: "Account Reports", href: "/account-reports", icon: ClipboardList },
]

const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: Users },
]

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Calculator className="h-6 w-6" />
              <span>Accounting System</span>
            </Link>

            {/* Desktop Navigation - Only show if user is authenticated */}
            {user && (
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
                {/* Admin Navigation */}
                {profile?.role === 'admin' && adminNavigation.map((item) => {
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
            )}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center gap-4">
            {user && profile ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url} alt={profile.name} />
                          <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{profile.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {profile.email}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground capitalize">
                            {profile.role}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      <VisuallyHidden>
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Main navigation menu with user options</SheetDescription>
                      </VisuallyHidden>
                      <div className="flex flex-col gap-2 mt-8">
                        {/* User Info */}
                        <div className="flex items-center gap-3 p-3 border-b">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url} alt={profile.name} />
                            <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{profile.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                          </div>
                        </div>
                        
                        {/* Navigation Links */}
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
                        
                        <div className="border-t pt-2 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 text-red-600"
                            onClick={handleSignOut}
                          >
                            <LogOut className="h-4 w-4" />
                            Sign out
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              /* Auth Button when not logged in */
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

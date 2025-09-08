import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldX, Home } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Accounting System</h1>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              <ShieldX className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                You need higher privileges to access this resource.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact your administrator if you believe this is an error.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">
                  Sign In with Different Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

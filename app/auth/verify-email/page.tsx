import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Accounting System</h1>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              <Mail className="h-12 w-12 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Please check your email and click the verification link to activate your account.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, check your spam folder.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Go to Login
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

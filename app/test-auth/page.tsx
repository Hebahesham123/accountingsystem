'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const result = await signOut()
    if (!result.error) {
      router.push('/auth/login')
    } else {
      console.error('Sign out error:', result.error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
            <CardDescription>
              This page helps debug authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">User Status:</h3>
              <p>User: {user ? 'Logged In' : 'Not Logged In'}</p>
              <p>Profile: {profile ? 'Loaded' : 'Not Loaded'}</p>
            </div>

            {user && profile && (
              <div>
                <h3 className="font-semibold">User Details:</h3>
                <p>Email: {profile.email}</p>
                <p>Name: {profile.name}</p>
                <p>Role: {profile.role}</p>
                <p>User ID: {profile.id}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSignOut} variant="destructive">
                Test Sign Out
              </Button>
              <Button onClick={() => router.push('/')}>
                Go to Dashboard
              </Button>
              <Button onClick={() => router.push('/auth/login')}>
                Go to Login
              </Button>
            </div>

            <div>
              <h3 className="font-semibold">Debug Info:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify({ user: !!user, profile: !!profile, loading }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

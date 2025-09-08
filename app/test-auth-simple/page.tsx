'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase } from '@/lib/supabase'

export default function TestAuthSimplePage() {
  const { user, profile, loading } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState('')

  const loadSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      setSession(sessionData.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const testAuthFunction = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_profile')
      if (error) throw error
      console.log('Auth function result:', data)
      alert('Auth function works! Check console for details.')
    } catch (err) {
      console.error('Auth function error:', err)
      alert('Auth function error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Simple Auth Test</h1>
          <p className="text-muted-foreground mt-2">
            Test authentication without complex requirements
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Auth Context State */}
          <Card>
            <CardHeader>
              <CardTitle>Auth Context State</CardTitle>
              <CardDescription>Current authentication state from React context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Loading:</strong> 
                <Badge variant={loading ? "default" : "secondary"} className="ml-2">
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div>
                <strong>User:</strong> 
                <Badge variant={user ? "default" : "secondary"} className="ml-2">
                  {user ? "Logged In" : "Not Logged In"}
                </Badge>
              </div>
              
              {user && (
                <div className="text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Confirmed:</strong> {user.email_confirmed_at ? "Yes" : "No"}</p>
                </div>
              )}
              
              <div>
                <strong>Profile:</strong> 
                <Badge variant={profile ? "default" : "secondary"} className="ml-2">
                  {profile ? "Loaded" : "Not Loaded"}
                </Badge>
              </div>
              
              {profile && (
                <div className="text-sm">
                  <p><strong>Name:</strong> {profile.name}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Direct Session State */}
          <Card>
            <CardHeader>
              <CardTitle>Direct Session State</CardTitle>
              <CardDescription>Session from Supabase directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Session:</strong> 
                <Badge variant={session ? "default" : "secondary"} className="ml-2">
                  {session ? "Active" : "No Session"}
                </Badge>
              </div>
              
              {session && (
                <div className="text-sm">
                  <p><strong>User ID:</strong> {session.user.id}</p>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>Confirmed:</strong> {session.user.email_confirmed_at ? "Yes" : "No"}</p>
                  <p><strong>Access Token:</strong> {session.access_token ? "Present" : "Missing"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Test authentication functions and navigation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={loadSession}>
                Refresh Session
              </Button>
              <Button onClick={testAuthFunction} variant="outline">
                Test Auth Function
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/chart-of-accounts'}
              >
                Go to Chart of Accounts
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="destructive" 
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Overall authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            {user && session ? (
              <Alert>
                <AlertDescription>
                  ✅ <strong>Authentication Working!</strong> You are logged in and can access all features.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  ❌ <strong>Authentication Issue!</strong> Please sign in to access features.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase } from '@/lib/supabase'

export default function DebugAuthPage() {
  const { user, profile, loading } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [dbProfile, setDbProfile] = useState<any>(null)
  const [error, setError] = useState('')

  const loadDebugInfo = async () => {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      setSession(sessionData.session)

      // Get profile from database directly
      if (sessionData.session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single()
        
        if (profileError) throw profileError
        setDbProfile(profileData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load debug info')
    }
  }

  useEffect(() => {
    loadDebugInfo()
  }, [])

  const testAuthFunction = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_profile')
      if (error) throw error
      console.log('Auth function result:', data)
      alert('Check console for auth function result')
    } catch (err) {
      console.error('Auth function error:', err)
      alert('Auth function error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <p className="text-muted-foreground mt-2">
            Debug authentication state and functions
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
                  <p><strong>Email:</strong> {profile.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Direct Database State */}
          <Card>
            <CardHeader>
              <CardTitle>Direct Database State</CardTitle>
              <CardDescription>Authentication state from Supabase directly</CardDescription>
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
                </div>
              )}
              
              <div>
                <strong>DB Profile:</strong> 
                <Badge variant={dbProfile ? "default" : "secondary"} className="ml-2">
                  {dbProfile ? "Found" : "Not Found"}
                </Badge>
              </div>
              
              {dbProfile && (
                <div className="text-sm">
                  <p><strong>Name:</strong> {dbProfile.name}</p>
                  <p><strong>Role:</strong> {dbProfile.role}</p>
                  <p><strong>Email:</strong> {dbProfile.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
            <CardDescription>Test authentication functions and refresh data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={loadDebugInfo}>
                Refresh Debug Info
              </Button>
              <Button onClick={testAuthFunction}>
                Test Auth Function
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth/login'}
              >
                Go to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
            <CardDescription>Raw authentication data for debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Auth Context User:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              
              <div>
                <strong>Auth Context Profile:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
              
              <div>
                <strong>Direct Session:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
              
              <div>
                <strong>Direct DB Profile:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(dbProfile, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

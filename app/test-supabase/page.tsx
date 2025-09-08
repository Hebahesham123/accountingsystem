'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('password123')

  const addResult = (test: string, result: any, error?: any) => {
    setTestResults(prev => [...prev, {
      test,
      result,
      error: error?.message || error,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    setTestResults([])

    try {
      // Test 1: Basic connection
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
      addResult('Supabase Connection', data, error)
    } catch (err) {
      addResult('Supabase Connection', null, err)
    }

    try {
      // Test 2: Check auth.users table
      const { data, error } = await supabase.auth.getSession()
      addResult('Auth Session Check', data, error)
    } catch (err) {
      addResult('Auth Session Check', null, err)
    }

    try {
      // Test 3: Check user_profiles table
      const { data, error } = await supabase.from('user_profiles').select('*').limit(5)
      addResult('User Profiles Table', data, error)
    } catch (err) {
      addResult('User Profiles Table', null, err)
    }

    try {
      // Test 4: Test sign up
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      })
      addResult('Test Sign Up', data, error)
    } catch (err) {
      addResult('Test Sign Up', null, err)
    }

    try {
      // Test 5: Test sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      addResult('Test Sign In', data, error)
    } catch (err) {
      addResult('Test Sign In', null, err)
    }

    try {
      // Test 6: Test get_current_user_profile function
      const { data, error } = await supabase.rpc('get_current_user_profile')
      addResult('Get Current User Profile Function', data, error)
    } catch (err) {
      addResult('Get Current User Profile Function', null, err)
    }

    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection Test</CardTitle>
            <CardDescription>
              This page tests all aspects of the Supabase connection and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Test Email</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testPassword">Test Password</Label>
                <Input
                  id="testPassword"
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={testSupabaseConnection} disabled={loading}>
                {loading ? 'Testing...' : 'Run All Tests'}
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{result.test}</h4>
                        <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                      </div>
                      {result.error ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            <strong>Error:</strong> {result.error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div>
                          <strong>Success:</strong>
                          <pre className="bg-gray-100 p-2 rounded text-sm mt-2 overflow-auto">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

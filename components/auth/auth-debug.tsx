'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthDebug() {
  const [supabaseConfig, setSupabaseConfig] = useState<{
    url: string | null
    key: string | null
    urlValid: boolean
    keyValid: boolean
  }>({
    url: null,
    key: null,
    urlValid: false,
    keyValid: false
  })
  
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message: string
  }>({
    status: 'idle',
    message: ''
  })

  useEffect(() => {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setSupabaseConfig({
      url,
      key,
      urlValid: url ? url.includes('supabase.co') : false,
      keyValid: key ? key.startsWith('eyJ') : false
    })
  }, [])

  const testConnection = async () => {
    setConnectionTest({ status: 'testing', message: 'Testing connection...' })
    
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setConnectionTest({ 
          status: 'error', 
          message: `Connection failed: ${error.message}` 
        })
      } else {
        setConnectionTest({ 
          status: 'success', 
          message: 'Connection successful! Supabase is properly configured.' 
        })
      }
    } catch (err) {
      setConnectionTest({ 
        status: 'error', 
        message: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Authentication Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Environment Variables</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL:</span>
                <Badge variant={supabaseConfig.urlValid ? "default" : "destructive"}>
                  {supabaseConfig.url ? 'Set' : 'Missing'}
                </Badge>
                {supabaseConfig.url && (
                  <span className="text-xs text-muted-foreground">
                    {supabaseConfig.url.substring(0, 30)}...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <Badge variant={supabaseConfig.keyValid ? "default" : "destructive"}>
                  {supabaseConfig.key ? 'Set' : 'Missing'}
                </Badge>
                {supabaseConfig.key && (
                  <span className="text-xs text-muted-foreground">
                    {supabaseConfig.key.substring(0, 20)}...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Connection Test</h3>
            <div className="space-y-2">
              <Button onClick={testConnection} disabled={connectionTest.status === 'testing'}>
                {connectionTest.status === 'testing' ? 'Testing...' : 'Test Connection'}
              </Button>
              
              {connectionTest.status !== 'idle' && (
                <Alert variant={connectionTest.status === 'success' ? 'default' : 'destructive'}>
                  <AlertDescription>{connectionTest.message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {(!supabaseConfig.url || !supabaseConfig.key) && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Missing Environment Variables!</strong><br />
                To fix the sign-in issue, you need to set up environment variables in your deployment platform.
                <br /><br />
                <strong>For Vercel:</strong>
                <br />1. Go to your Vercel dashboard
                <br />2. Select your project → Settings → Environment Variables
                <br />3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
                <br />4. Redeploy your project
                <br /><br />
                <strong>For Netlify:</strong>
                <br />1. Go to Site settings → Environment variables
                <br />2. Add the same variables
                <br />3. Redeploy your site
                <br /><br />
                See DEPLOYMENT_GUIDE.md for detailed instructions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'

interface DomainErrorHandlerProps {
  children: React.ReactNode
}

export function DomainErrorHandler({ children }: DomainErrorHandlerProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isDomain, setIsDomain] = useState(false)

  useEffect(() => {
    // Check if we're running on a domain (not localhost)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost')
    
    setIsDomain(!isLocalhost)

    // Check for common domain-related errors
    const checkDomainIssues = () => {
      const errors = []

      // Check if Supabase URL is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_project_url')) {
        errors.push('Supabase URL not configured')
      }

      // Check if Supabase key is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your_supabase_anon_key')) {
        errors.push('Supabase API key not configured')
      }

      // Check for HTTPS
      if (isDomain && window.location.protocol !== 'https:') {
        errors.push('HTTPS required for domain deployment')
      }

      if (errors.length > 0) {
        setHasError(true)
        setErrorMessage(errors.join(', '))
      }
    }

    checkDomainIssues()

    // Listen for unhandled errors
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Supabase') || 
          event.error?.message?.includes('CORS') ||
          event.error?.message?.includes('Network')) {
        setHasError(true)
        setErrorMessage('Connection error - check domain configuration')
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [isDomain])

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleSetupGuide = () => {
    window.open('/DOMAIN_DEPLOYMENT_FIX.md', '_blank')
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Domain Configuration Issue</strong>
              <p className="mt-2 text-sm">
                {errorMessage}
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSetupGuide}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Setup Guide
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Quick Fix:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Create .env.local with Supabase credentials</li>
              <li>Configure Supabase Site URL for your domain</li>
              <li>Add redirect URLs in Supabase dashboard</li>
              <li>Ensure HTTPS is enabled</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


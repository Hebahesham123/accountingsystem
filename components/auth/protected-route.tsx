'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'accountant' | 'user'
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'user',
  fallbackPath = '/auth/login'
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push(fallbackPath)
        return
      }

      if (!profile) {
        // User authenticated but no profile, wait a bit for profile to load
        return
      }

      // Check role requirements
      if (requiredRole === 'admin' && profile.role !== 'admin') {
        router.push('/unauthorized')
        return
      }

      if (requiredRole === 'accountant' && !['admin', 'accountant'].includes(profile.role)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [user, profile, loading, requiredRole, router, fallbackPath])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading if user is authenticated but profile is still loading
  if (user && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or doesn't have required role
  if (!user || !profile) {
    return null
  }

  // Check role requirements
  if (requiredRole === 'admin' && profile.role !== 'admin') {
    return null
  }

  if (requiredRole === 'accountant' && !['admin', 'accountant'].includes(profile.role)) {
    return null
  }

  return <>{children}</>
}

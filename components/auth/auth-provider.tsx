'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { AuthService, UserProfile, AuthState } from '@/lib/auth'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (name: string, avatarUrl?: string) => Promise<{ data: any; error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get current session
        const { data: sessionData, error: sessionError } = await AuthService.getCurrentSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          return
        }
        
        if (sessionData.session?.user) {
          console.log('User found:', sessionData.session.user.email)
          setUser(sessionData.session.user)
          
          // Get user profile
          console.log('Loading user profile...')
          const userProfile = await AuthService.getCurrentUserProfile()
          console.log('Profile loaded:', userProfile)
          setProfile(userProfile)
        } else {
          console.log('No user session found')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
        console.log('Auth initialization complete')
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in:', session.user.email)
        setUser(session.user)
        const userProfile = await AuthService.getCurrentUserProfile()
        console.log('Profile loaded after sign in:', userProfile)
        setProfile(userProfile)
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn(email, password)
    if (result.data?.user) {
      const userProfile = await AuthService.getCurrentUserProfile()
      setProfile(userProfile)
    }
    return result
  }

  const signUp = async (email: string, password: string, name: string) => {
    return await AuthService.signUp(email, password, name)
  }

  const signOut = async () => {
    const result = await AuthService.signOut()
    if (!result.error) {
      setUser(null)
      setProfile(null)
    }
    return result
  }

  const updateProfile = async (name: string, avatarUrl?: string) => {
    const result = await AuthService.updateUserProfile(name, avatarUrl)
    if (!result.error) {
      // Refresh profile data
      const userProfile = await AuthService.getCurrentUserProfile()
      setProfile(userProfile)
    }
    return result
  }

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await AuthService.getCurrentUserProfile()
      setProfile(userProfile)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

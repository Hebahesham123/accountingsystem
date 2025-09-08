import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'accountant' | 'user'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

// Auth service class
export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  // Get current user profile
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      console.log('Getting current user profile...')
      
      // Try the new JSON function first
      const { data, error } = await supabase
        .rpc('get_current_user_profile')

      if (error) {
        console.error('Get user profile error:', error)
        // Try the table function as fallback
        const { data: tableData, error: tableError } = await supabase
          .rpc('get_current_user_profile_table')
          .single()
        
        if (tableError) {
          console.error('Table function also failed:', tableError)
          throw error
        }
        
        console.log('User profile retrieved (table function):', tableData)
        return tableData
      }
      
      console.log('User profile retrieved (JSON function):', data)
      return data
    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  // Update user profile
  static async updateUserProfile(name: string, avatarUrl?: string) {
    try {
      const { data, error } = await supabase
        .rpc('update_user_profile', {
          p_name: name,
          p_avatar_url: avatarUrl
        })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      return { data: null, error }
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { data: null, error }
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get session error:', error)
      return { data: null, error }
    }
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper function to check if user has required role
export function hasRole(userProfile: UserProfile | null, requiredRole: 'admin' | 'accountant' | 'user'): boolean {
  if (!userProfile) return false
  
  const roleHierarchy = {
    'user': 1,
    'accountant': 2,
    'admin': 3
  }
  
  return roleHierarchy[userProfile.role] >= roleHierarchy[requiredRole]
}

// Helper function to check if user is admin
export function isAdmin(userProfile: UserProfile | null): boolean {
  return hasRole(userProfile, 'admin')
}

// Helper function to check if user is accountant or admin
export function isAccountantOrAdmin(userProfile: UserProfile | null): boolean {
  return hasRole(userProfile, 'accountant')
}

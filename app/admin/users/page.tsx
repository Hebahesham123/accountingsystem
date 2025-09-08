'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, UserPlus, Shield, User, Mail, Calendar } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import ProtectedRoute from '@/components/auth/protected-route'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'accountant' | 'user'
  created_at: string
  updated_at: string
}

export default function AdminUsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'accountant' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      await loadUsers() // Reload users
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'accountant':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'accountant':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              You need admin privileges to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage users and their roles in the accounting system
              </p>
            </div>
            <Button onClick={() => window.open('https://supabase.com/dashboard/project/_/auth/users', '_blank')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User in Supabase
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong> To create new users, click "Create User in Supabase" above. 
              This will open the Supabase dashboard where you can add users manually. 
              User profiles will be created automatically when users sign in for the first time.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <div>
                              <h3 className="font-semibold">{user.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={user.role === 'admin' ? 'default' : 'outline'}
                              onClick={() => updateUserRole(user.id, 'admin')}
                            >
                              Admin
                            </Button>
                            <Button
                              size="sm"
                              variant={user.role === 'accountant' ? 'default' : 'outline'}
                              onClick={() => updateUserRole(user.id, 'accountant')}
                            >
                              Accountant
                            </Button>
                            <Button
                              size="sm"
                              variant={user.role === 'user' ? 'default' : 'outline'}
                              onClick={() => updateUserRole(user.id, 'user')}
                            >
                              User
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

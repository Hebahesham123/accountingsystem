'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Calendar, Shield, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import ProtectedRoute from '@/components/auth/protected-route'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setError('')

    try {
      const { error } = await updateProfile(formData.name)
      
      if (error) {
        setError(error.message || 'Failed to update profile')
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{profile.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="h-4 w-4" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{profile.id.slice(0, 8)}...</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Status</Label>
                  <p className="text-sm text-green-600">Active</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="space-y-1">
                    {profile.role === 'admin' && (
                      <>
                        <p className="text-xs text-muted-foreground">• Full system access</p>
                        <p className="text-xs text-muted-foreground">• User management</p>
                        <p className="text-xs text-muted-foreground">• System configuration</p>
                      </>
                    )}
                    {profile.role === 'accountant' && (
                      <>
                        <p className="text-xs text-muted-foreground">• Create journal entries</p>
                        <p className="text-xs text-muted-foreground">• View all reports</p>
                        <p className="text-xs text-muted-foreground">• Manage accounts</p>
                      </>
                    )}
                    {profile.role === 'user' && (
                      <>
                        <p className="text-xs text-muted-foreground">• View reports</p>
                        <p className="text-xs text-muted-foreground">• Read-only access</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

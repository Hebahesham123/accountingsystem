# Authentication Setup Guide

This guide will help you set up authentication for your accounting system using Supabase Auth.

## Overview

The authentication system includes:
- **User Registration & Login**: Email/password authentication
- **Role-based Access Control**: Admin, Accountant, and User roles
- **Protected Routes**: Automatic redirects for unauthorized access
- **User Profile Management**: Profile editing and avatar support
- **Session Management**: Persistent login sessions

## Setup Steps

### 1. Database Setup

Run the authentication setup script in your Supabase SQL editor:

```sql
-- Run this script in your Supabase SQL editor
\i scripts/39-setup-authentication.sql
```

This script will:
- Create `user_profiles` table linked to `auth.users`
- Set up Row Level Security (RLS) policies
- Create functions for user management
- Migrate existing users if any

### 2. Supabase Configuration

In your Supabase project dashboard:

1. **Enable Email Authentication**:
   - Go to Authentication > Settings
   - Enable "Enable email confirmations"
   - Configure email templates if needed

2. **Set up Email Templates** (Optional):
   - Customize signup confirmation email
   - Customize password reset email

3. **Configure Redirect URLs**:
   - Add `http://localhost:3000/auth/verify-email` for development
   - Add your production domain for production

### 3. Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Test the Authentication

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test User Registration**:
   - Go to `http://localhost:3000/auth/signup`
   - Create a new account
   - Check your email for verification

3. **Test User Login**:
   - Go to `http://localhost:3000/auth/login`
   - Sign in with your credentials

4. **Test Protected Routes**:
   - Try accessing `/` without being logged in
   - Should redirect to login page

## Features

### User Roles

- **Admin**: Full system access, user management, system configuration
- **Accountant**: Create journal entries, view all reports, manage accounts
- **User**: View reports, read-only access

### Authentication Components

- **LoginForm**: Email/password login with forgot password
- **SignupForm**: User registration with email verification
- **AuthProvider**: Context provider for authentication state
- **ProtectedRoute**: Route protection wrapper
- **Navigation**: Updated with user menu and auth buttons

### Pages

- `/auth/login` - Login page
- `/auth/signup` - Registration page
- `/auth/verify-email` - Email verification page
- `/profile` - User profile management
- `/unauthorized` - Access denied page

## Usage Examples

### Protecting a Route

```tsx
import ProtectedRoute from '@/components/auth/protected-route'

export default function MyPage() {
  return (
    <ProtectedRoute requiredRole="accountant">
      <div>This content is only visible to accountants and admins</div>
    </ProtectedRoute>
  )
}
```

### Using Authentication in Components

```tsx
import { useAuth } from '@/components/auth/auth-provider'

export default function MyComponent() {
  const { user, profile, signOut } = useAuth()

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome, {profile?.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Checking User Roles

```tsx
import { hasRole, isAdmin } from '@/lib/auth'

export default function AdminPanel() {
  const { profile } = useAuth()

  if (!isAdmin(profile)) {
    return <div>Access denied</div>
  }

  return <div>Admin panel content</div>
}
```

## Security Features

### Row Level Security (RLS)

The system uses Supabase RLS to ensure data security:

- Users can only view/edit their own profile
- Admins can view all profiles
- All policies are enforced at the database level

### Session Management

- Automatic session refresh
- Secure cookie handling
- Logout on all devices

### Route Protection

- Middleware-based route protection
- Automatic redirects for unauthorized access
- Role-based access control

## Troubleshooting

### Common Issues

1. **"Invalid login credentials"**:
   - Check if email is verified
   - Ensure password is correct
   - Check Supabase auth logs

2. **"User not found"**:
   - Run the authentication setup script
   - Check if user profile was created

3. **"Access denied"**:
   - Check user role permissions
   - Verify RLS policies are enabled

4. **Session not persisting**:
   - Check cookie settings
   - Verify middleware configuration

### Debug Steps

1. **Check Supabase Logs**:
   - Go to Supabase dashboard > Logs
   - Look for authentication errors

2. **Verify Database Setup**:
   ```sql
   -- Check if user_profiles table exists
   SELECT * FROM user_profiles LIMIT 1;
   
   -- Check if functions exist
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%user%';
   ```

3. **Test Authentication Flow**:
   - Try creating a new account
   - Check email verification
   - Test login/logout

## Production Deployment

### Environment Setup

1. **Update Supabase Settings**:
   - Add production domain to allowed origins
   - Configure production email templates
   - Set up proper redirect URLs

2. **Security Considerations**:
   - Use HTTPS in production
   - Configure proper CORS settings
   - Set up rate limiting

3. **Monitoring**:
   - Set up authentication monitoring
   - Monitor failed login attempts
   - Track user registration metrics

## Next Steps

After setting up authentication, you can:

1. **Customize User Roles**: Add more granular permissions
2. **Add Social Login**: Integrate Google, GitHub, etc.
3. **Implement 2FA**: Add two-factor authentication
4. **User Management**: Create admin panel for user management
5. **Audit Logging**: Track all authentication events

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the authentication logs
3. Test with a fresh user account
4. Verify all environment variables are set correctly

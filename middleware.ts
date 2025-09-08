import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get the current session
    let {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    // Check for auth cookies
    const authCookie = req.cookies.get('sb-access-token')
    const refreshCookie = req.cookies.get('sb-refresh-token')

    // If no session but we have refresh token, try to refresh
    if (!session && refreshCookie) {
      console.log('Middleware - Attempting to refresh session...')
      const refreshResult = await supabase.auth.refreshSession()
      if (refreshResult.data.session) {
        session = refreshResult.data.session
        console.log('Middleware - Session refreshed successfully')
      }
    }

    // Debug logging
    console.log('Middleware - Path:', req.nextUrl.pathname)
    console.log('Middleware - Session exists:', !!session)
    console.log('Middleware - Session error:', sessionError)
    if (session) {
      console.log('Middleware - User email:', session.user?.email)
      console.log('Middleware - User confirmed:', !!session.user?.email_confirmed_at)
      console.log('Middleware - Access token present:', !!session.access_token)
    }

    console.log('Middleware - Auth cookie present:', !!authCookie)
    console.log('Middleware - Refresh cookie present:', !!refreshCookie)
    
    // List all Supabase cookies for debugging
    const supabaseCookies = Array.from(req.cookies.getAll()).filter(cookie => 
      cookie.name.startsWith('sb-')
    )
    console.log('Middleware - Supabase cookies:', supabaseCookies.map(c => c.name))

  // Define protected routes (simplified - only admin routes need protection)
  const protectedRoutes = [
    '/admin'
  ]

  // Define auth routes (should redirect if already logged in)
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/verify-email']

  const { pathname } = req.nextUrl

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    console.log('Middleware - Redirecting to login, no session for protected route:', pathname)
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && session) {
    console.log('Middleware - Redirecting to dashboard, user already logged in')
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Log successful access
  if (isProtectedRoute && session) {
    console.log('Middleware - Allowing access to protected route:', pathname)
  }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, allow the request to continue
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

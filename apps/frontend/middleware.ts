import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Next.js Middleware for authentication and authorization
 * Runs on all requests to protected routes
 * 
 * Note: Middleware runs in Edge Runtime, so we use direct Supabase calls
 * instead of our SessionManager which uses Node.js APIs
 */

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/invite',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/api/auth/callback',
]

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/system',
  '/tenant-management',
]

// Define API routes that need special handling
const apiRoutes = [
  '/api',
]

// Create Supabase client for middleware
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })

  // Check if route is admin-only
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Check if route is API
  const isApiRoute = apiRoutes.some(route => pathname.startsWith(route))

  try {
    // Get auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value
    const tenantId = request.cookies.get('tenant-id')?.value
    
    let user = null
    let isAuthenticated = false

    // Verify authentication if token exists
    if (authToken) {
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(authToken)
        
        if (!error && supabaseUser) {
          // Get user record from our database
          const { data: userRecord } = await supabase
            .from('users')
            .select('id, email, tenantId, role, clientId, status')
            .or(`supabaseId.eq.${supabaseUser.id},email.eq.${supabaseUser.email}`)
            .eq('status', 'ACTIVE')
            .single()

          if (userRecord) {
            user = {
              id: userRecord.id,
              email: userRecord.email,
              tenantId: userRecord.tenantId,
              role: userRecord.role,
              clientId: userRecord.clientId,
            }
            isAuthenticated = true
          }
        }
      } catch (error) {
        // Token is invalid, treat as unauthenticated
        console.log('Invalid auth token in middleware')
      }
    }

    // Handle public routes
    if (isPublicRoute) {
      // If user is authenticated and tries to access auth pages, redirect to dashboard
      if (isAuthenticated && ['/login', '/register', '/forgot-password'].includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      // Allow access to public routes
      return NextResponse.next()
    }

    // Handle API routes
    if (isApiRoute) {
      // For API routes, check authentication but don't redirect
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }

      // Add user context to headers for API routes
      const response = NextResponse.next()
      if (user) {
        response.headers.set('x-user-id', user.id)
        response.headers.set('x-user-role', user.role)
        if (user.tenantId) {
          response.headers.set('x-tenant-id', user.tenantId)
        }
        if (user.clientId) {
          response.headers.set('x-client-id', user.clientId)
        }
      }
      
      return response
    }

    // Handle protected routes
    if (!isAuthenticated) {
      // Store the attempted URL for redirect after login
      const loginUrl = new URL('/login', request.url)
      if (pathname !== '/dashboard') {
        loginUrl.searchParams.set('redirect', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    // Handle admin routes
    if (isAdminRoute) {
      if (!user || !['SUPER_ADMIN', 'COWORK_ADMIN'].includes(user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Handle super admin routes
    if (pathname.startsWith('/system')) {
      if (!user || user.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Handle tenant selection
    if (pathname === '/dashboard' && user && !user.tenantId && user.role !== 'SUPER_ADMIN') {
      // User needs to select a tenant
      return NextResponse.redirect(new URL('/select-tenant', request.url))
    }

    // Add user context to headers for server components
    const response = NextResponse.next()
    if (user) {
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-role', user.role)
      if (user.tenantId) {
        response.headers.set('x-tenant-id', user.tenantId)
      }
      if (user.clientId) {
        response.headers.set('x-client-id', user.clientId)
      }
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
    // If there's an error with session handling, redirect to login
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return NextResponse.next()
  }
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
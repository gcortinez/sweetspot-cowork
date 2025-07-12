import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware for authentication and authorization using Supabase SSR
 * Automatically refreshes sessions and handles authentication
 */

// Define auth routes that should redirect to dashboard if already logged in
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/reset',
]

export async function middleware(request: NextRequest) {
  // Update session with Supabase SSR - this handles token refresh automatically
  const response = await updateSession(request)
  
  const { pathname } = request.nextUrl

  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return response
  }

  // Check if user is authenticated by looking for Supabase session cookies
  const hasSupabaseSession = request.cookies.has('sb-access-token') || 
                            request.cookies.has('sb-refresh-token')

  // Redirect authenticated users away from auth pages
  if (hasSupabaseSession && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow all other routes to proceed - individual pages will handle their own auth checks
  return response
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
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/admin(.*)',
  '/super-admin(.*)',
  '/leads(.*)',
  '/spaces(.*)',
  '/settings(.*)',
])

// Define auth routes that should redirect authenticated users
const isAuthRoute = createRouteMatcher([
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/auth/reset(.*)',
])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth()
  const isAuthenticated = !!userId
  
  console.log('🛡️ Clerk Middleware:', {
    path: request.nextUrl.pathname,
    isAuthenticated,
    isProtectedRoute: isProtectedRoute(request),
    isAuthRoute: isAuthRoute(request),
  })

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute(request)) {
    console.log('🔄 Redirecting authenticated user to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect routes that require authentication
  if (!isAuthenticated && isProtectedRoute(request)) {
    console.log('🚨 Redirecting unauthenticated user to login')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

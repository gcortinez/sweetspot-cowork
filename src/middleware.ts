import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/coworks(.*)',
  '/api/platform(.*)'
])

// Define routes that suspended users can access
const isSuspendedAllowedRoute = createRouteMatcher([
  '/suspended',
  '/api/auth(.*)',
  '/api/internal(.*)'
])

// Define auth routes (sign in/up pages)
const isAuthRoute = createRouteMatcher([
  '/auth/login(.*)',
  '/auth/register(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  const { userId, sessionClaims } = await auth()

  console.log('🛡️ Clerk Middleware:', {
    path: pathname,
    isAuthenticated: !!userId,
    isProtectedRoute: isProtectedRoute(req),
    isAuthRoute: isAuthRoute(req)
  })

  // Redirect authenticated users away from auth routes
  if (userId && isAuthRoute(req)) {
    console.log('🔄 Redirecting authenticated user to dashboard')
    return Response.redirect(new URL('/dashboard', req.url))
  }

  // Protect routes for authenticated users only
  if (isProtectedRoute(req)) {
    await auth.protect()
    
    // Check if user is suspended (only for authenticated users on protected routes)
    if (userId && sessionClaims) {
      try {
        // Get email from different possible locations in sessionClaims
        const userEmail = sessionClaims.email || sessionClaims.primaryEmailAddress?.emailAddress || sessionClaims.emailAddresses?.[0]?.emailAddress
        console.log('🔍 Checking suspension for user:', {
          clerkId: userId,
          email: userEmail,
          sessionClaims: Object.keys(sessionClaims)
        })
        
        // Call internal API to check user status
        const response = await fetch(new URL('/api/internal/user-status', req.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerkId: userId,
            email: userEmail
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('📊 User status response:', data)

          if (data.success && data.user && data.user.status === 'SUSPENDED' && !isSuspendedAllowedRoute(req)) {
            console.log('🚫 User is suspended, redirecting to suspended page')
            return Response.redirect(new URL('/suspended', req.url))
          }

          if (data.success) {
            if (!data.user) {
              console.log('⚠️ User not found in database')
            } else if (data.user.status !== 'SUSPENDED') {
              console.log('✅ User status is:', data.user.status)
            }
          }
        } else {
          console.error('❌ Failed to check user status:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ Error checking user status:', error)
        // Continue to allow access if there's an error checking status
      }
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

// Define auth routes (sign in/up pages)
const isAuthRoute = createRouteMatcher(['/auth/login(.*)'])

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl
  const { userId } = auth()

  console.log('🛡️ Clerk Middleware:', {
    path: pathname,
    isAuthenticated: !!userId,
    isProtectedRoute: isProtectedRoute(req),
    isAuthRoute: isAuthRoute(req)
  })

  // If user is signed in and tries to access auth routes, redirect to dashboard
  if (userId && isAuthRoute(req)) {
    console.log('🔄 Redirecting authenticated user to dashboard')
    return Response.redirect(new URL('/dashboard', req.url))
  }

  // For protected routes, require authentication
  if (isProtectedRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
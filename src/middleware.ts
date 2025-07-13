import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/coworks(.*)',
  '/api/platform(.*)'
])

// Define auth routes (sign in/up pages)
const isAuthRoute = createRouteMatcher([
  '/auth/login(.*)',
  '/auth/register(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  const { userId } = await auth()

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
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
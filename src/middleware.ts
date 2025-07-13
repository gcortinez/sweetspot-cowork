import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/coworks(.*)',
  '/api/platform(.*)'
])

// Define routes that suspended users can access
const isSuspendedAllowedRoute = createRouteMatcher([
  '/suspended',
  '/api/auth(.*)'
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
    
    // Check if user is suspended (only for authenticated users on protected routes)
    if (userId) {
      try {
        const clerkUser = await currentUser()
        if (clerkUser) {
          console.log('🔍 Checking suspension for user:', {
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress
          })
          
          // Find user in database by Clerk ID
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { clerkId: clerkUser.id },
                { email: clerkUser.emailAddresses[0]?.emailAddress }
              ]
            },
            select: {
              id: true,
              status: true,
              email: true,
              clerkId: true
            }
          })

          console.log('📊 User found in database:', user)

          if (user && user.status === 'SUSPENDED' && !isSuspendedAllowedRoute(req)) {
            console.log('🚫 User is suspended, redirecting to suspended page')
            return Response.redirect(new URL('/suspended', req.url))
          }

          if (!user) {
            console.log('⚠️ User not found in database')
          } else if (user.status !== 'SUSPENDED') {
            console.log('✅ User status is:', user.status)
          }
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
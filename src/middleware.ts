import { NextRequest, NextResponse } from "next/server";

// Define route patterns
const authRoutes = ["/auth/login", "/auth/register", "/auth/reset"];
const protectedRoutes = ["/dashboard", "/admin", "/settings", "/profile"];
const publicRoutes = ["/", "/about", "/contact", "/pricing", "/simple", "/test", "/unauthorized"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes that are already excluded
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("auth-token")?.value;
  const isAuthenticated = !!token;

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === "/";

  // Only redirect authenticated users away from auth pages if they're directly accessing them
  if (isAuthRoute && isAuthenticated) {
    // Check if this is a direct navigation (not a programmatic redirect)
    const referer = request.headers.get('referer');
    const isDirectNavigation = !referer || !referer.includes(request.nextUrl.origin);
    
    if (isDirectNavigation) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to public routes and other routes
  return NextResponse.next();
}

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

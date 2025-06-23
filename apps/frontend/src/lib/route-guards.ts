import { UserRole } from "@sweetspot/shared";
import { redirect } from "next/navigation";

export interface RouteGuardOptions {
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  minRole?: UserRole;
  guestOnly?: boolean;
  redirectTo?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null; // Allow null for super admins
  clientId?: string;
}

// Role hierarchy for comparison
const ROLE_HIERARCHY: Record<UserRole, number> = {
  END_USER: 1,
  CLIENT_ADMIN: 2,
  COWORK_ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Check if user has required role level
 */
export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get redirect URL based on user role
 */
export function getDefaultRedirectForRole(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard";
    case "COWORK_ADMIN":
      return "/dashboard";
    case "CLIENT_ADMIN":
      return "/dashboard";
    case "END_USER":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

/**
 * Get unauthorized redirect URL
 */
export function getUnauthorizedRedirect(requiredRole?: UserRole): string {
  if (requiredRole) {
    return `/unauthorized?required=${requiredRole}`;
  }
  return "/unauthorized";
}

/**
 * Client-side route guard function
 */
export function guardRoute(
  user: User | null,
  isLoading: boolean,
  options: RouteGuardOptions
): {
  shouldRedirect: boolean;
  redirectTo?: string;
  isAuthorized: boolean;
} {
  // If still loading, don't redirect yet
  if (isLoading) {
    return { shouldRedirect: false, isAuthorized: false };
  }

  // Guest-only routes (auth pages)
  if (options.guestOnly) {
    if (user) {
      return {
        shouldRedirect: true,
        redirectTo: options.redirectTo || getDefaultRedirectForRole(user.role),
        isAuthorized: false,
      };
    }
    return { shouldRedirect: false, isAuthorized: true };
  }

  // Protected routes requiring authentication
  if (options.requireAuth && !user) {
    return {
      shouldRedirect: true,
      redirectTo: options.redirectTo || "/auth/login",
      isAuthorized: false,
    };
  }

  // If no user but auth not required, allow access
  if (!user) {
    return { shouldRedirect: false, isAuthorized: true };
  }

  // Check role requirements
  if (options.requireRoles && !hasAnyRole(user.role, options.requireRoles)) {
    return {
      shouldRedirect: true,
      redirectTo: options.redirectTo || getUnauthorizedRedirect(),
      isAuthorized: false,
    };
  }

  if (options.minRole && !hasRequiredRole(user.role, options.minRole)) {
    return {
      shouldRedirect: true,
      redirectTo:
        options.redirectTo || getUnauthorizedRedirect(options.minRole),
      isAuthorized: false,
    };
  }

  // All checks passed
  return { shouldRedirect: false, isAuthorized: true };
}

/**
 * Server-side route guard for page components
 */
export function serverGuardRoute(
  user: User | null,
  options: RouteGuardOptions
): void {
  const result = guardRoute(user, false, options);

  if (result.shouldRedirect && result.redirectTo) {
    redirect(result.redirectTo);
  }
}

/**
 * Route guard hook for client components
 */
export function useRouteGuard(
  user: User | null,
  isLoading: boolean,
  options: RouteGuardOptions
): {
  isAuthorized: boolean;
  isLoading: boolean;
} {
  const result = guardRoute(user, isLoading, options);

  // Handle client-side redirects - Use router instead of window.location to avoid full page refresh
  // This is commented out to prevent route guard from conflicting with AuthGuard
  // Let AuthGuard handle all redirects to avoid conflicts
  /*
  if (
    result.shouldRedirect &&
    result.redirectTo &&
    typeof window !== "undefined"
  ) {
    window.location.href = result.redirectTo;
  }
  */

  return {
    isAuthorized: result.isAuthorized,
    isLoading,
  };
}

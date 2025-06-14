"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@sweetspot/shared";

interface AuthGuardProps {
  children: ReactNode;

  // Authentication requirements
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  requireAnyRole?: UserRole[];
  minRole?: UserRole;

  // Redirect options
  redirectTo?: string;
  unauthorizedRedirect?: string;

  // Fallback components
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;

  // Behavior options
  showUnauthorized?: boolean;
  inverse?: boolean; // For guest-only routes
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireRoles,
  requireAnyRole,
  minRole,
  redirectTo = "/auth/login",
  unauthorizedRedirect = "/unauthorized",
  loadingComponent,
  unauthorizedComponent,
  showUnauthorized = false,
  inverse = false,
}: AuthGuardProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    hasRole,
    hasAnyRole,
    canAccess,
  } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized || isLoading) return;

    // Handle inverse guard (guest-only routes)
    if (inverse) {
      if (isAuthenticated) {
        router.push("/dashboard");
      }
      return;
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // If not authenticated, no need to check roles
    if (!isAuthenticated || !user) return;

    // Check role requirements
    let hasRequiredRole = true;

    if (requireRoles && requireRoles.length > 0) {
      hasRequiredRole = requireRoles.some((role) => hasRole(role));
    }

    if (requireAnyRole && requireAnyRole.length > 0) {
      hasRequiredRole = hasAnyRole(requireAnyRole);
    }

    if (minRole) {
      hasRequiredRole = canAccess(minRole);
    }

    // Redirect if role requirements not met
    if (!hasRequiredRole) {
      if (showUnauthorized) {
        // Stay on page but show unauthorized state
        return;
      } else {
        router.push(unauthorizedRedirect);
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    isInitialized,
    user?.id, // Only depend on user ID to avoid re-renders
    requireAuth,
    inverse,
    // Remove function dependencies that cause re-renders
  ]);

  // Show loading state
  if (!isInitialized || isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle inverse guard (guest-only)
  if (inverse) {
    return isAuthenticated ? null : <>{children}</>;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect
  }

  // Check role requirements
  if (isAuthenticated && user) {
    let hasRequiredRole = true;

    if (requireRoles && requireRoles.length > 0) {
      hasRequiredRole = requireRoles.some((role) => hasRole(role));
    }

    if (requireAnyRole && requireAnyRole.length > 0) {
      hasRequiredRole = hasAnyRole(requireAnyRole);
    }

    if (minRole) {
      hasRequiredRole = canAccess(minRole);
    }

    if (!hasRequiredRole) {
      if (showUnauthorized) {
        if (unauthorizedComponent) {
          return <>{unauthorizedComponent}</>;
        }

        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access this content.
              </p>
              <p className="text-sm text-muted-foreground">
                Current role: <span className="font-medium">{user.role}</span>
              </p>
            </div>
          </div>
        );
      } else {
        return null; // Will redirect
      }
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience components for common use cases
export function RequireAuth({
  children,
  ...props
}: Omit<AuthGuardProps, "requireAuth">) {
  return (
    <AuthGuard requireAuth={true} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireRole({
  role,
  children,
  ...props
}: Omit<AuthGuardProps, "requireRoles"> & { role: UserRole }) {
  return (
    <AuthGuard requireRoles={[role]} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireMinRole({
  role,
  children,
  ...props
}: Omit<AuthGuardProps, "minRole"> & { role: UserRole }) {
  return (
    <AuthGuard minRole={role} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireAnyRole({
  roles,
  children,
  ...props
}: Omit<AuthGuardProps, "requireAnyRole"> & { roles: UserRole[] }) {
  return (
    <AuthGuard requireAnyRole={roles} {...props}>
      {children}
    </AuthGuard>
  );
}

export function GuestOnly({
  children,
  ...props
}: Omit<AuthGuardProps, "inverse" | "requireAuth">) {
  return (
    <AuthGuard inverse={true} requireAuth={false} {...props}>
      {children}
    </AuthGuard>
  );
}

// Admin-specific guards
export function RequireAdmin({
  children,
  ...props
}: Omit<AuthGuardProps, "minRole">) {
  return (
    <AuthGuard minRole="COWORK_ADMIN" {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireSuperAdmin({
  children,
  ...props
}: Omit<AuthGuardProps, "requireRoles">) {
  return (
    <AuthGuard requireRoles={["SUPER_ADMIN"]} {...props}>
      {children}
    </AuthGuard>
  );
}

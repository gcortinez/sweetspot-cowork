"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/database";

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  requireAnyRole?: UserRole[];
  minRole?: UserRole;
  redirectTo?: string;
  unauthorizedRedirect?: string;
  autoRedirect?: boolean;
}

interface AuthGuardResult {
  isAuthorized: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: any;
  error: string | null;
  canAccess: boolean;
  redirect: () => void;
}

/**
 * Hook for implementing authentication guards in components
 */
export function useAuthGuard(
  options: UseAuthGuardOptions = {}
): AuthGuardResult {
  const {
    requireAuth = true,
    requireRoles,
    requireAnyRole,
    minRole,
    redirectTo = "/auth/login",
    unauthorizedRedirect = "/unauthorized",
    autoRedirect = true,
  } = options;

  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    error,
    hasRole,
    hasAnyRole,
    canAccess: canAccessRole,
  } = useAuth();

  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    let authorized = true;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      authorized = false;
      if (autoRedirect) {
        router.push(redirectTo);
      }
      setCanAccess(false);
      return;
    }

    // If not authenticated, no need to check roles
    if (!isAuthenticated || !user) {
      setCanAccess(!requireAuth);
      return;
    }

    // Check role requirements
    if (requireRoles && requireRoles.length > 0) {
      authorized = requireRoles.some((role) => hasRole(role));
    }

    if (requireAnyRole && requireAnyRole.length > 0) {
      authorized = hasAnyRole(requireAnyRole);
    }

    if (minRole) {
      authorized = canAccessRole(minRole);
    }

    if (!authorized && autoRedirect) {
      router.push(unauthorizedRedirect);
    }

    setCanAccess(authorized);
  }, [
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    requireAuth,
    requireRoles,
    requireAnyRole,
    minRole,
    redirectTo,
    unauthorizedRedirect,
    autoRedirect,
    router,
    hasRole,
    hasAnyRole,
    canAccessRole,
  ]);

  const redirect = () => {
    if (!isAuthenticated) {
      router.push(redirectTo);
    } else {
      router.push(unauthorizedRedirect);
    }
  };

  return {
    isAuthorized: canAccess,
    isLoading,
    isInitialized,
    user,
    error,
    canAccess,
    redirect,
  };
}

/**
 * Hook for requiring authentication
 */
export function useRequireAuth(redirectTo = "/auth/login") {
  return useAuthGuard({ requireAuth: true, redirectTo });
}

/**
 * Hook for requiring specific role
 */
export function useRequireRole(
  role: UserRole,
  unauthorizedRedirect = "/unauthorized"
) {
  return useAuthGuard({ requireRoles: [role], unauthorizedRedirect });
}

/**
 * Hook for requiring minimum role level
 */
export function useRequireMinRole(
  role: UserRole,
  unauthorizedRedirect = "/unauthorized"
) {
  return useAuthGuard({ minRole: role, unauthorizedRedirect });
}

/**
 * Hook for requiring any of the specified roles
 */
export function useRequireAnyRole(
  roles: UserRole[],
  unauthorizedRedirect = "/unauthorized"
) {
  return useAuthGuard({ requireAnyRole: roles, unauthorizedRedirect });
}

/**
 * Hook for guest-only access (redirect authenticated users)
 */
export function useGuestOnly(redirectTo = "/dashboard") {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, isInitialized, redirectTo, router]);

  return {
    isGuest: !isAuthenticated,
    isLoading,
    isInitialized,
  };
}

/**
 * Hook for admin-only access
 */
export function useRequireAdmin(unauthorizedRedirect = "/unauthorized") {
  return useAuthGuard({ minRole: "COWORK_ADMIN", unauthorizedRedirect });
}

/**
 * Hook for super admin-only access
 */
export function useRequireSuperAdmin(unauthorizedRedirect = "/unauthorized") {
  return useAuthGuard({ requireRoles: ["SUPER_ADMIN"], unauthorizedRedirect });
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleAccess() {
  const { user, hasRole, hasAnyRole, canAccess } = useAuth();

  return {
    user,
    isEndUser: hasRole("END_USER"),
    isClientAdmin: hasRole("CLIENT_ADMIN"),
    isCoworkAdmin: hasRole("COWORK_ADMIN"),
    isSuperAdmin: hasRole("SUPER_ADMIN"),
    isAdmin: hasAnyRole(["COWORK_ADMIN", "SUPER_ADMIN"]),
    canAccessEndUser: canAccess("END_USER"),
    canAccessClientAdmin: canAccess("CLIENT_ADMIN"),
    canAccessCoworkAdmin: canAccess("COWORK_ADMIN"),
    canAccessSuperAdmin: canAccess("SUPER_ADMIN"),
    hasRole,
    hasAnyRole,
    canAccess,
  };
}

/**
 * Hook for checking if user can perform specific actions
 */
export function usePermissions() {
  const { user, canAccess } = useAuth();

  const permissions = {
    // User management
    canManageUsers: canAccess("CLIENT_ADMIN"),
    canViewAllUsers: canAccess("COWORK_ADMIN"),
    canDeleteUsers: canAccess("COWORK_ADMIN"),

    // Tenant management
    canManageTenants: canAccess("SUPER_ADMIN"),
    canViewTenants: canAccess("COWORK_ADMIN"),

    // Client management
    canManageClients: canAccess("CLIENT_ADMIN"),
    canViewAllClients: canAccess("COWORK_ADMIN"),

    // System administration
    canAccessSystemSettings: canAccess("SUPER_ADMIN"),
    canViewSystemLogs: canAccess("COWORK_ADMIN"),
    canManageIntegrations: canAccess("COWORK_ADMIN"),

    // Billing and payments
    canViewBilling: canAccess("CLIENT_ADMIN"),
    canManageBilling: canAccess("COWORK_ADMIN"),

    // Reports and analytics
    canViewReports: canAccess("CLIENT_ADMIN"),
    canViewAdvancedReports: canAccess("COWORK_ADMIN"),
    canExportData: canAccess("COWORK_ADMIN"),
  };

  return {
    user,
    ...permissions,
    hasPermission: (permission: keyof typeof permissions) =>
      permissions[permission],
  };
}

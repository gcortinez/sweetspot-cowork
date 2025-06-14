"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-auth";

interface PermissionGateProps {
  children: ReactNode;

  // Permission requirements
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission

  // Behavior options
  fallback?: ReactNode;
  inverse?: boolean;

  // Debug mode
  debug?: boolean;
}

/**
 * PermissionGate component for conditional rendering based on specific permissions
 *
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - Whether user needs all permissions (true) or any (false)
 * @param fallback - Component to show when access is denied
 * @param inverse - Show content when user doesn't have permission
 * @param debug - Show debug information
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  inverse = false,
  debug = false,
}: PermissionGateProps) {
  const permissionHooks = usePermissions();

  // If no user, deny access (unless inverse)
  if (!permissionHooks.user) {
    if (debug) {
      console.log("PermissionGate: No user found");
    }
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = permissionHooks.hasPermission(permission as any);
    if (debug) {
      console.log(
        `PermissionGate: Permission ${permission}, access: ${hasAccess}`
      );
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      // User must have ALL permissions
      hasAccess = permissions.every((perm) =>
        permissionHooks.hasPermission(perm as any)
      );
      if (debug) {
        console.log(
          `PermissionGate: All permissions required ${permissions.join(
            ", "
          )}, access: ${hasAccess}`
        );
      }
    } else {
      // User must have ANY permission
      hasAccess = permissions.some((perm) =>
        permissionHooks.hasPermission(perm as any)
      );
      if (debug) {
        console.log(
          `PermissionGate: Any permission required ${permissions.join(
            ", "
          )}, access: ${hasAccess}`
        );
      }
    }
  }

  // Apply inverse logic if specified
  const shouldShow = inverse ? !hasAccess : hasAccess;

  if (debug) {
    console.log(
      `PermissionGate: Final decision - shouldShow: ${shouldShow}, inverse: ${inverse}`
    );
  }

  return shouldShow ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common permissions
export function CanManageUsers({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canManageUsers" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewAllUsers({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewAllUsers" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanDeleteUsers({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canDeleteUsers" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanManageTenants({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canManageTenants" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewTenants({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewTenants" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanManageClients({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canManageClients" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewAllClients({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewAllClients" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanAccessSystemSettings({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canAccessSystemSettings" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewSystemLogs({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewSystemLogs" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanManageIntegrations({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canManageIntegrations" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewBilling({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewBilling" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanManageBilling({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canManageBilling" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewReports({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewReports" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanViewAdvancedReports({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canViewAdvancedReports" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanExportData({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate permission="canExportData" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

"use client";

import { ReactNode } from "react";
import { useRoleAccess } from "@/contexts/auth-context";
import type { UserRole } from "@/types/database";

interface RoleGateProps {
  children: ReactNode;

  // Role requirements
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
  minRole?: UserRole;

  // Behavior options
  fallback?: ReactNode;
  inverse?: boolean; // Show content when user DOESN'T have the role

  // Debug mode
  debug?: boolean;
}

/**
 * RoleGate component for conditional rendering based on user roles
 *
 * @param allowedRoles - Array of roles that can see the content
 * @param requiredRole - Specific role required (exact match)
 * @param minRole - Minimum role level required (hierarchical)
 * @param fallback - Component to show when access is denied
 * @param inverse - Show content when user doesn't have the role
 * @param debug - Show debug information
 */
export function RoleGate({
  children,
  allowedRoles,
  requiredRole,
  minRole,
  fallback = null,
  inverse = false,
  debug = false,
}: RoleGateProps) {
  const {
    user,
    hasRole,
    hasAnyRole,
    canAccess,
    isEndUser,
    isClientAdmin,
    isCoworkAdmin,
    isSuperAdmin,
  } = useRoleAccess();

  // If no user, deny access (unless inverse)
  if (!user) {
    if (debug) {
      console.log("RoleGate: No user found");
    }
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Check specific role requirement
  if (requiredRole) {
    hasAccess = hasRole(requiredRole);
    if (debug) {
      console.log(
        `RoleGate: Required role ${requiredRole}, user has: ${user.role}, access: ${hasAccess}`
      );
    }
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = hasAnyRole(allowedRoles);
    if (debug) {
      console.log(
        `RoleGate: Allowed roles ${allowedRoles.join(", ")}, user has: ${
          user.role
        }, access: ${hasAccess}`
      );
    }
  }

  // Check minimum role level
  if (minRole) {
    hasAccess = canAccess(minRole);
    if (debug) {
      console.log(
        `RoleGate: Min role ${minRole}, user has: ${user.role}, access: ${hasAccess}`
      );
    }
  }

  // Apply inverse logic if specified
  const shouldShow = inverse ? !hasAccess : hasAccess;

  if (debug) {
    console.log(
      `RoleGate: Final decision - shouldShow: ${shouldShow}, inverse: ${inverse}`
    );
  }

  return shouldShow ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common role checks
export function EndUserOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate requiredRole="END_USER" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function ClientAdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate requiredRole="CLIENT_ADMIN" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function CoworkAdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate requiredRole="COWORK_ADMIN" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function SuperAdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate requiredRole="SUPER_ADMIN" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate
      allowedRoles={["COWORK_ADMIN", "SUPER_ADMIN"]}
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
}

export function ClientAdminOrAbove({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate minRole="CLIENT_ADMIN" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function CoworkAdminOrAbove({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate minRole="COWORK_ADMIN" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

// Inverse components (show when user doesn't have role)
export function NotEndUser({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate requiredRole="END_USER" inverse fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function NotAdmin({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGate
      allowedRoles={["COWORK_ADMIN", "SUPER_ADMIN"]}
      inverse
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
}

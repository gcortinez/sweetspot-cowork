"use client";

import React, { ComponentType } from "react";
import { AuthGuard } from "./auth-guard";
import type { UserRole } from "@sweetspot/shared";

interface WithAuthOptions {
  // Authentication requirements
  requireAuth?: boolean;
  requireRoles?: UserRole[];
  requireAnyRole?: UserRole[];
  minRole?: UserRole;

  // Redirect options
  redirectTo?: string;
  unauthorizedRedirect?: string;

  // Behavior options
  showUnauthorized?: boolean;
  inverse?: boolean;

  // Loading component
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

/**
 * Higher-Order Component that wraps a component with authentication protection
 *
 * @param Component - The component to protect
 * @param options - Authentication and authorization options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withAuth(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Convenience HOCs for common use cases
export function withRequireAuth<P extends object>(
  Component: ComponentType<P>,
  options: Omit<WithAuthOptions, "requireAuth"> = {}
) {
  return withAuth(Component, { requireAuth: true, ...options });
}

export function withRequireRole<P extends object>(
  Component: ComponentType<P>,
  role: UserRole,
  options: Omit<WithAuthOptions, "requireRoles"> = {}
) {
  return withAuth(Component, { requireRoles: [role], ...options });
}

export function withRequireMinRole<P extends object>(
  Component: ComponentType<P>,
  role: UserRole,
  options: Omit<WithAuthOptions, "minRole"> = {}
) {
  return withAuth(Component, { minRole: role, ...options });
}

export function withRequireAnyRole<P extends object>(
  Component: ComponentType<P>,
  roles: UserRole[],
  options: Omit<WithAuthOptions, "requireAnyRole"> = {}
) {
  return withAuth(Component, { requireAnyRole: roles, ...options });
}

export function withGuestOnly<P extends object>(
  Component: ComponentType<P>,
  options: Omit<WithAuthOptions, "inverse" | "requireAuth"> = {}
) {
  return withAuth(Component, { inverse: true, requireAuth: false, ...options });
}

// Admin-specific HOCs
export function withRequireAdmin<P extends object>(
  Component: ComponentType<P>,
  options: Omit<WithAuthOptions, "minRole"> = {}
) {
  return withAuth(Component, { minRole: "COWORK_ADMIN", ...options });
}

export function withRequireSuperAdmin<P extends object>(
  Component: ComponentType<P>,
  options: Omit<WithAuthOptions, "requireRoles"> = {}
) {
  return withAuth(Component, { requireRoles: ["SUPER_ADMIN"], ...options });
}

// Example usage:
// const ProtectedComponent = withRequireAuth(MyComponent)
// const AdminComponent = withRequireAdmin(AdminPanel)
// const SuperAdminComponent = withRequireSuperAdmin(SuperAdminPanel)
// const GuestComponent = withGuestOnly(LandingPage)

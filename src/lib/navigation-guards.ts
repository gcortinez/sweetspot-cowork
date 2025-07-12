"use client";

import { AuthUser, UserRole } from "@/types/database";
import { redirect } from "next/navigation";

interface CoworkContext {
  isSuperAdminWithoutCowork: boolean;
  isSuperAdminWithMultipleCoworks: boolean;
  hasCoworkAccess: boolean;
  activeCowork: any | null;
  userCoworks: any[];
}

/**
 * Navigation guard for super admin context
 * Redirects super admin users based on their cowork access
 */
export function applySuperAdminNavigationGuards(
  user: AuthUser | null,
  coworkContext: CoworkContext,
  currentPath: string
): string | null {
  if (!user || user.role !== "SUPER_ADMIN") {
    return null; // No redirect needed for non-super admins
  }

  // Case 1: Super admin without any cowork access
  if (coworkContext.isSuperAdminWithoutCowork) {
    // Should only see super admin panel
    if (!currentPath.startsWith("/super-admin")) {
      return "/super-admin";
    }
    return null; // Already in correct section
  }

  // Case 2: Super admin with multiple coworks but no active cowork selected
  if (coworkContext.isSuperAdminWithMultipleCoworks && !coworkContext.activeCowork) {
    // Redirect to dashboard to show cowork selector
    if (currentPath !== "/dashboard") {
      return "/dashboard";
    }
    return null;
  }

  // Case 3: Super admin with cowork access - normal flow
  if (coworkContext.hasCoworkAccess) {
    // Can access both super admin and cowork sections
    return null;
  }

  return null;
}

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(
  user: AuthUser | null,
  coworkContext: CoworkContext,
  route: string
): boolean {
  if (!user) return false;

  // Super admin routes
  if (route.startsWith("/super-admin")) {
    return user.role === "SUPER_ADMIN";
  }

  // Cowork-specific routes
  const coworkRoutes = [
    "/dashboard",
    "/spaces",
    "/bookings", 
    "/users",
    "/analytics",
    "/billing",
    "/leads",
    "/opportunities"
  ];

  const isCoworkRoute = coworkRoutes.some(coworkRoute => 
    route.startsWith(coworkRoute)
  );

  if (isCoworkRoute) {
    // Super admin without cowork access cannot access cowork routes
    if (user.role === "SUPER_ADMIN" && coworkContext.isSuperAdminWithoutCowork) {
      return false;
    }
    
    // Need either active cowork or be non-super admin with tenant
    return coworkContext.hasCoworkAccess;
  }

  // Personal routes (always accessible)
  const personalRoutes = ["/profile", "/notifications", "/settings", "/help"];
  const isPersonalRoute = personalRoutes.some(personalRoute => 
    route.startsWith(personalRoute)
  );

  if (isPersonalRoute) {
    return true;
  }

  // Default: check if user has general access
  return true;
}

/**
 * Get appropriate default route for user
 */
export function getDefaultRouteForUser(
  user: AuthUser | null,
  coworkContext: CoworkContext
): string {
  if (!user) return "/auth/login";

  // Super admin without cowork access -> Super admin panel
  if (user.role === "SUPER_ADMIN" && coworkContext.isSuperAdminWithoutCowork) {
    return "/super-admin";
  }

  // Super admin with multiple coworks but no active -> Dashboard with selector
  if (user.role === "SUPER_ADMIN" && coworkContext.isSuperAdminWithMultipleCoworks && !coworkContext.activeCowork) {
    return "/dashboard";
  }

  // Default dashboard for users with cowork access
  if (coworkContext.hasCoworkAccess) {
    return "/dashboard";
  }

  // Fallback
  return "/profile";
}

/**
 * Route protection options interface
 */
export interface RouteGuardOptions {
  requiredRole?: UserRole;
  requireCoworkAccess?: boolean;
  requireSuperAdmin?: boolean;
  allowSuperAdminWithoutCowork?: boolean;
  fallbackRoute?: string;
}

/**
 * Utility to check if a route should be protected
 */
export function isProtectedRoute(route: string): boolean {
  const protectedPrefixes = [
    "/dashboard",
    "/super-admin", 
    "/spaces",
    "/bookings",
    "/users",
    "/analytics",
    "/billing",
    "/leads",
    "/opportunities",
    "/profile",
    "/settings"
  ];

  return protectedPrefixes.some(prefix => route.startsWith(prefix));
}

/**
 * Navigation breadcrumbs based on context
 */
export function getContextualBreadcrumbs(
  route: string,
  user: AuthUser | null,
  coworkContext: CoworkContext
): Array<{ label: string; href: string; icon?: string }> {
  const breadcrumbs: Array<{ label: string; href: string; icon?: string }> = [];

  // Root breadcrumb
  if (user?.role === "SUPER_ADMIN" && coworkContext.isSuperAdminWithoutCowork) {
    breadcrumbs.push({ label: "Super Admin", href: "/super-admin", icon: "Crown" });
  } else if (coworkContext.hasCoworkAccess) {
    breadcrumbs.push({ 
      label: coworkContext.activeCowork?.name || "Dashboard", 
      href: "/dashboard", 
      icon: "Building2" 
    });
  }

  // Route-specific breadcrumbs
  if (route.startsWith("/super-admin")) {
    if (route === "/super-admin") {
      breadcrumbs.push({ label: "Panel Principal", href: "/super-admin" });
    } else if (route.startsWith("/super-admin/coworks")) {
      breadcrumbs.push({ label: "Gestión de Coworks", href: "/super-admin/coworks" });
    } else if (route.startsWith("/super-admin/analytics")) {
      breadcrumbs.push({ label: "Analytics del Sistema", href: "/super-admin/analytics" });
    }
  } else if (route.startsWith("/dashboard")) {
    // Dashboard breadcrumbs handled by root
  } else if (route.startsWith("/spaces")) {
    breadcrumbs.push({ label: "Espacios", href: "/spaces" });
  } else if (route.startsWith("/leads")) {
    breadcrumbs.push({ label: "Prospectos", href: "/leads" });
  }

  return breadcrumbs;
}
"use client";

import { useMemo } from "react";
import { useRoleAccess, usePermissions } from "./use-auth";
import type { UserRole } from "@/types/database";

/**
 * Hook for role-based conditional rendering
 */
export function useRoleBasedRendering() {
  const roleAccess = useRoleAccess();
  const permissions = usePermissions();

  return useMemo(
    () => ({
      // Role checks
      showForRole: (role: UserRole) => roleAccess.hasRole(role),
      showForMinRole: (minRole: UserRole) => roleAccess.canAccess(minRole),
      showForAnyRole: (roles: UserRole[]) => roleAccess.hasAnyRole(roles),
      hideForRole: (role: UserRole) => !roleAccess.hasRole(role),

      // Permission checks
      showForPermission: (permission: string) =>
        permissions.hasPermission(permission as any),
      showForAnyPermission: (perms: string[]) =>
        perms.some((p) => permissions.hasPermission(p as any)),
      showForAllPermissions: (perms: string[]) =>
        perms.every((p) => permissions.hasPermission(p as any)),

      // Combined checks
      showForRoleAndPermission: (role: UserRole, permission: string) =>
        roleAccess.hasRole(role) &&
        permissions.hasPermission(permission as any),

      // Feature access
      showForFeature: (feature: string) => {
        // This would integrate with feature flags system
        // For now, return true for all features
        return true;
      },

      // User info
      user: roleAccess.user,
      isAuthenticated: !!roleAccess.user,
    }),
    [roleAccess, permissions]
  );
}

/**
 * Hook for navigation-specific role checks
 */
export function useNavigationAccess() {
  const { user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();
  const permissions = usePermissions();

  return useMemo(
    () => ({
      // Navigation sections
      canAccessDashboard: !!user,
      canAccessUserManagement: permissions.hasPermission("canManageUsers"),
      canAccessClientManagement: permissions.hasPermission("canManageClients"),
      canAccessTenantManagement:
        isSuperAdmin && permissions.hasPermission("canManageTenants"),
      canAccessSystemSettings:
        isSuperAdmin && permissions.hasPermission("canAccessSystemSettings"),
      canAccessBilling:
        (isClientAdmin || isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canViewBilling"),
      canAccessReports:
        (isClientAdmin || isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canViewReports"),
      canAccessAdvancedReports:
        (isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canViewAdvancedReports"),
      canAccessIntegrations:
        (isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canManageIntegrations"),
      canAccessSystemLogs:
        (isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canViewSystemLogs"),

      // Quick role checks
      isEndUser,
      isClientAdmin,
      isCoworkAdmin,
      isSuperAdmin,
      isAdmin: isClientAdmin || isCoworkAdmin || isSuperAdmin,

      // User info
      user,
    }),
    [user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin, permissions]
  );
}

/**
 * Hook for action-specific permissions
 */
export function useActionPermissions() {
  const { user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();
  const permissions = usePermissions();

  return useMemo(
    () => ({
      // User actions
      canCreateUser: permissions.hasPermission("canManageUsers"),
      canEditUser: permissions.hasPermission("canManageUsers"),
      canDeleteUser: permissions.hasPermission("canDeleteUsers"),
      canViewAllUsers: permissions.hasPermission("canViewAllUsers"),
      canExportUsers: permissions.hasPermission("canExportData"),

      // Client actions
      canCreateClient: permissions.hasPermission("canManageClients"),
      canEditClient: permissions.hasPermission("canManageClients"),
      canDeleteClient: permissions.hasPermission("canManageClients"),
      canViewAllClients: permissions.hasPermission("canViewAllClients"),

      // Tenant actions
      canCreateTenant:
        isSuperAdmin && permissions.hasPermission("canManageTenants"),
      canEditTenant:
        isSuperAdmin && permissions.hasPermission("canManageTenants"),
      canDeleteTenant:
        isSuperAdmin && permissions.hasPermission("canManageTenants"),
      canViewTenants:
        isSuperAdmin && permissions.hasPermission("canViewTenants"),

      // System actions
      canAccessSystemSettings:
        isSuperAdmin && permissions.hasPermission("canAccessSystemSettings"),
      canViewSystemLogs:
        (isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canViewSystemLogs"),
      canManageIntegrations:
        (isCoworkAdmin || isSuperAdmin) &&
        permissions.hasPermission("canManageIntegrations"),

      // Billing actions
      canViewBilling: permissions.hasPermission("canViewBilling"),
      canManageBilling: permissions.hasPermission("canManageBilling"),

      // Reporting actions
      canViewReports: permissions.hasPermission("canViewReports"),
      canViewAdvancedReports: permissions.hasPermission(
        "canViewAdvancedReports"
      ),
      canExportData: permissions.hasPermission("canExportData"),

      // Workspace actions
      canCreateWorkspace: isCoworkAdmin || isSuperAdmin,
      canEditWorkspace: isClientAdmin || isCoworkAdmin || isSuperAdmin,
      canDeleteWorkspace: isCoworkAdmin || isSuperAdmin,

      // Booking actions
      canViewAllBookings: isClientAdmin || isCoworkAdmin || isSuperAdmin,
      canManageBookings: isClientAdmin || isCoworkAdmin || isSuperAdmin,
      canCancelAnyBooking: isCoworkAdmin || isSuperAdmin,

      // User info
      user,
      isAuthenticated: !!user,
    }),
    [user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin, permissions]
  );
}

/**
 * Hook for UI element visibility
 */
export function useUIPermissions() {
  const { user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();
  const permissions = usePermissions();

  return useMemo(
    () => ({
      // Button visibility
      showCreateButton: (resource: string) => {
        switch (resource) {
          case "user":
            return permissions.hasPermission("canManageUsers");
          case "client":
            return permissions.hasPermission("canManageClients");
          case "tenant":
            return (
              isSuperAdmin && permissions.hasPermission("canManageTenants")
            );
          case "workspace":
            return isCoworkAdmin || isSuperAdmin;
          default:
            return false;
        }
      },

      showEditButton: (resource: string) => {
        switch (resource) {
          case "user":
            return permissions.hasPermission("canManageUsers");
          case "client":
            return permissions.hasPermission("canManageClients");
          case "tenant":
            return (
              isSuperAdmin && permissions.hasPermission("canManageTenants")
            );
          case "workspace":
            return isClientAdmin || isCoworkAdmin || isSuperAdmin;
          default:
            return false;
        }
      },

      showDeleteButton: (resource: string) => {
        switch (resource) {
          case "user":
            return permissions.hasPermission("canDeleteUsers");
          case "client":
            return permissions.hasPermission("canManageClients");
          case "tenant":
            return (
              isSuperAdmin && permissions.hasPermission("canManageTenants")
            );
          case "workspace":
            return isCoworkAdmin || isSuperAdmin;
          default:
            return false;
        }
      },

      // Section visibility
      showAdminSection: isClientAdmin || isCoworkAdmin || isSuperAdmin,
      showSuperAdminSection: isSuperAdmin,
      showCoworkAdminSection: isCoworkAdmin || isSuperAdmin,
      showClientAdminSection: isClientAdmin || isCoworkAdmin || isSuperAdmin,

      // Feature visibility
      showBillingFeatures: permissions.hasPermission("canViewBilling"),
      showReportingFeatures: permissions.hasPermission("canViewReports"),
      showAdvancedFeatures: isCoworkAdmin || isSuperAdmin,
      showSystemFeatures: isSuperAdmin,

      // User info
      user,
      userRole: user?.role,
      isAuthenticated: !!user,
    }),
    [user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin, permissions]
  );
}

/**
 * Hook for data filtering based on roles
 */
export function useDataAccess() {
  const { user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin } =
    useRoleAccess();
  const permissions = usePermissions();

  return useMemo(
    () => ({
      // Data scope
      getDataScope: () => {
        if (isSuperAdmin) return "global";
        if (isCoworkAdmin) return "tenant";
        if (isClientAdmin) return "client";
        return "user";
      },

      // Filter functions
      canViewUserData: (targetUserId: string) => {
        if (isSuperAdmin || isCoworkAdmin) return true;
        if (isClientAdmin && permissions.hasPermission("canViewAllUsers"))
          return true;
        return user?.id === targetUserId;
      },

      canViewClientData: (targetClientId: string) => {
        if (isSuperAdmin || isCoworkAdmin) return true;
        if (isClientAdmin) return user?.clientId === targetClientId;
        return false;
      },

      canViewTenantData: (targetTenantId: string) => {
        if (isSuperAdmin) return true;
        return user?.tenantId === targetTenantId;
      },

      // Access levels
      hasGlobalAccess: isSuperAdmin,
      hasTenantAccess: isCoworkAdmin || isSuperAdmin,
      hasClientAccess: isClientAdmin || isCoworkAdmin || isSuperAdmin,
      hasUserAccess: !!user,

      // User context
      user,
      userTenantId: user?.tenantId,
      userClientId: user?.clientId,
      userRole: user?.role,
    }),
    [user, isEndUser, isClientAdmin, isCoworkAdmin, isSuperAdmin, permissions]
  );
}

// Re-export commonly used hooks
export { useRoleAccess, usePermissions } from "./use-auth";

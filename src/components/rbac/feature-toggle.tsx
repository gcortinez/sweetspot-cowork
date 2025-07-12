"use client";

import { ReactNode } from "react";
import { useRoleAccess, usePermissions } from "@/contexts/auth-context";
import type { UserRole } from "@/types/database";

interface FeatureToggleProps {
  children: ReactNode;

  // Feature identification
  feature: string;

  // Access control
  requiredRole?: UserRole;
  minRole?: UserRole;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];

  // Behavior options
  fallback?: ReactNode;
  showFallbackMessage?: boolean;
  fallbackMessage?: string;

  // Debug mode
  debug?: boolean;
}

// Feature definitions with their access requirements
interface FeatureConfig {
  requiredRole?: UserRole;
  minRole?: UserRole;
  allowedRoles?: UserRole[];
  permissions?: string[];
}

const FEATURES: Record<string, FeatureConfig> = {
  // User Management Features
  "user-management": {
    minRole: "CLIENT_ADMIN",
    permissions: ["canManageUsers"],
  },
  "user-deletion": {
    minRole: "COWORK_ADMIN",
    permissions: ["canDeleteUsers"],
  },
  "user-export": {
    minRole: "COWORK_ADMIN",
    permissions: ["canExportData"],
  },

  // Tenant Management Features
  "tenant-management": {
    requiredRole: "SUPER_ADMIN",
    permissions: ["canManageTenants"],
  },
  "tenant-creation": {
    requiredRole: "SUPER_ADMIN",
    permissions: ["canManageTenants"],
  },

  // Client Management Features
  "client-management": {
    minRole: "CLIENT_ADMIN",
    permissions: ["canManageClients"],
  },
  "client-analytics": {
    minRole: "CLIENT_ADMIN",
    permissions: ["canViewReports"],
  },

  // System Features
  "system-settings": {
    requiredRole: "SUPER_ADMIN",
    permissions: ["canAccessSystemSettings"],
  },
  "system-logs": {
    minRole: "COWORK_ADMIN",
    permissions: ["canViewSystemLogs"],
  },
  integrations: {
    minRole: "COWORK_ADMIN",
    permissions: ["canManageIntegrations"],
  },

  // Billing Features
  "billing-view": {
    minRole: "CLIENT_ADMIN",
    permissions: ["canViewBilling"],
  },
  "billing-management": {
    minRole: "COWORK_ADMIN",
    permissions: ["canManageBilling"],
  },

  // Reporting Features
  "basic-reports": {
    minRole: "CLIENT_ADMIN",
    permissions: ["canViewReports"],
  },
  "advanced-reports": {
    minRole: "COWORK_ADMIN",
    permissions: ["canViewAdvancedReports"],
  },
  "data-export": {
    minRole: "COWORK_ADMIN",
    permissions: ["canExportData"],
  },

  // Workspace Features
  "workspace-creation": {
    minRole: "COWORK_ADMIN",
  },
  "workspace-settings": {
    minRole: "CLIENT_ADMIN",
  },

  // Booking Features
  "booking-management": {
    minRole: "CLIENT_ADMIN",
  },
  "booking-analytics": {
    minRole: "CLIENT_ADMIN",
    permissions: ["canViewReports"],
  },
};

type FeatureName = keyof typeof FEATURES;

/**
 * FeatureToggle component for controlling feature access based on roles and permissions
 *
 * @param feature - Feature name to check access for
 * @param requiredRole - Override: specific role required
 * @param minRole - Override: minimum role level required
 * @param allowedRoles - Override: array of allowed roles
 * @param requiredPermissions - Override: required permissions
 * @param fallback - Component to show when access is denied
 * @param showFallbackMessage - Whether to show a default fallback message
 * @param fallbackMessage - Custom fallback message
 * @param debug - Show debug information
 */
export function FeatureToggle({
  children,
  feature,
  requiredRole,
  minRole,
  allowedRoles,
  requiredPermissions,
  fallback,
  showFallbackMessage = false,
  fallbackMessage,
  debug = false,
}: FeatureToggleProps) {
  const { user, hasRole, hasAnyRole, canAccess } = useRoleAccess();
  const permissions = usePermissions();

  // If no user, deny access
  if (!user) {
    if (debug) {
      console.log(`FeatureToggle[${feature}]: No user found`);
    }
    return showFallbackMessage ? (
      <div className="text-sm text-muted-foreground p-4 text-center">
        {fallbackMessage || "Please log in to access this feature"}
      </div>
    ) : (
      <>{fallback}</>
    );
  }

  // Get feature configuration
  const featureConfig = FEATURES[feature as FeatureName];

  if (!featureConfig && !requiredRole && !minRole && !allowedRoles) {
    if (debug) {
      console.warn(
        `FeatureToggle[${feature}]: Unknown feature and no access rules provided`
      );
    }
    return <>{children}</>;
  }

  let hasAccess = true;

  // Use provided overrides or feature config
  const roleToCheck = requiredRole || featureConfig?.requiredRole;
  const minRoleToCheck = minRole || featureConfig?.minRole;
  const allowedRolesToCheck = allowedRoles || featureConfig?.allowedRoles;
  const permissionsToCheck = requiredPermissions || featureConfig?.permissions;

  // Check specific role requirement
  if (roleToCheck) {
    hasAccess = hasRole(roleToCheck);
    if (debug) {
      console.log(
        `FeatureToggle[${feature}]: Required role ${roleToCheck}, user has: ${user.role}, access: ${hasAccess}`
      );
    }
  }

  // Check minimum role level
  if (minRoleToCheck && hasAccess) {
    hasAccess = canAccess(minRoleToCheck);
    if (debug) {
      console.log(
        `FeatureToggle[${feature}]: Min role ${minRoleToCheck}, user has: ${user.role}, access: ${hasAccess}`
      );
    }
  }

  // Check allowed roles
  if (allowedRolesToCheck && allowedRolesToCheck.length > 0 && hasAccess) {
    hasAccess = hasAnyRole(allowedRolesToCheck);
    if (debug) {
      console.log(
        `FeatureToggle[${feature}]: Allowed roles ${allowedRolesToCheck.join(
          ", "
        )}, user has: ${user.role}, access: ${hasAccess}`
      );
    }
  }

  // Check required permissions
  if (permissionsToCheck && permissionsToCheck.length > 0 && hasAccess) {
    hasAccess = permissionsToCheck.every((permission) =>
      permissions.hasPermission(permission as any)
    );
    if (debug) {
      console.log(
        `FeatureToggle[${feature}]: Required permissions ${permissionsToCheck.join(
          ", "
        )}, access: ${hasAccess}`
      );
    }
  }

  if (debug) {
    console.log(
      `FeatureToggle[${feature}]: Final decision - hasAccess: ${hasAccess}`
    );
  }

  if (!hasAccess) {
    if (showFallbackMessage) {
      return (
        <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">
          {fallbackMessage ||
            `You don't have access to the ${feature.replace("-", " ")} feature`}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common features
export function UserManagementFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="user-management" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

export function TenantManagementFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="tenant-management" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

export function ClientManagementFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="client-management" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

export function SystemSettingsFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="system-settings" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

export function BillingFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="billing-view" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

export function ReportsFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="basic-reports" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

export function AdvancedReportsFeature({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <FeatureToggle feature="advanced-reports" fallback={fallback}>
      {children}
    </FeatureToggle>
  );
}

/**
 * Temporary utility functions to handle super admin operations
 * This helps manage the null tenant scenarios for super admins
 */

export const isSuperAdminWithoutTenant = (user: { role: string; tenantId: string | null }): boolean => {
  return user.role === "SUPER_ADMIN" && user.tenantId === null;
};

export const getTenantIdForOperation = (user: { role: string; tenantId: string | null }): string | null => {
  // For super admins without tenant, return null
  if (isSuperAdminWithoutTenant(user)) {
    return null;
  }
  return user.tenantId;
};

export const shouldSkipTenantValidation = (user: { role: string; tenantId: string | null }): boolean => {
  return isSuperAdminWithoutTenant(user);
};
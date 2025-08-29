/**
 * Permission utilities for role-based access control
 * Implements hierarchical permission system where higher roles inherit all permissions from lower roles
 */

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 3,
  COWORK_ADMIN: 2,
  COWORK_USER: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

/**
 * Get the effective role for a user
 * SUPER_ADMIN acts as COWORK_ADMIN when they have an active cowork selected
 */
export function getEffectiveRole(userRole: string, hasActiveCowork: boolean): string {
  if (userRole === 'SUPER_ADMIN' && hasActiveCowork) {
    return 'COWORK_ADMIN'; // SUPER_ADMIN acts as COWORK_ADMIN in cowork context
  }
  return userRole;
}

/**
 * Check if a user has permission based on role hierarchy
 * Higher roles inherit all permissions from lower roles
 * 
 * @param userRole - The user's actual role
 * @param requiredRole - The minimum role required for the action
 * @param hasActiveCowork - Whether the user has selected a cowork (relevant for SUPER_ADMIN)
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(
  userRole: string, 
  requiredRole: string, 
  hasActiveCowork: boolean = false
): boolean {
  // Get effective role (handles SUPER_ADMIN -> COWORK_ADMIN conversion)
  const effectiveRole = getEffectiveRole(userRole, hasActiveCowork);
  
  const userHierarchy = ROLE_HIERARCHY[effectiveRole as UserRole] || 0;
  const requiredHierarchy = ROLE_HIERARCHY[requiredRole as UserRole] || 0;
  
  return userHierarchy >= requiredHierarchy;
}

/**
 * Get roles that a user can assign to others
 * Users can only assign roles lower than their own
 */
export function getAssignableRoles(userRole: string, hasActiveCowork: boolean = false): UserRole[] {
  const effectiveRole = getEffectiveRole(userRole, hasActiveCowork);
  
  switch (effectiveRole) {
    case 'SUPER_ADMIN':
      // SUPER_ADMIN can assign any role
      return ['SUPER_ADMIN', 'COWORK_ADMIN', 'COWORK_USER'];
    
    case 'COWORK_ADMIN':
      // COWORK_ADMIN can assign roles within their cowork
      return ['COWORK_USER'];
    
    default:
      // COWORK_USER cannot assign roles
      return [];
  }
}

/**
 * Check if a user can manage another user based on roles
 */
export function canManageUser(
  managerRole: string,
  targetUserRole: string,
  hasActiveCowork: boolean = false
): boolean {
  const effectiveManagerRole = getEffectiveRole(managerRole, hasActiveCowork);
  
  const managerHierarchy = ROLE_HIERARCHY[effectiveManagerRole as UserRole] || 0;
  const targetHierarchy = ROLE_HIERARCHY[targetUserRole as UserRole] || 0;
  
  // Can only manage users with lower hierarchy
  return managerHierarchy > targetHierarchy;
}

/**
 * Role labels for UI display
 */
export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COWORK_ADMIN: 'Admin de Cowork',
  COWORK_USER: 'Usuario',
} as const;

/**
 * Role descriptions for UI tooltips
 */
export const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: 'Administra toda la plataforma y puede acceder a cualquier cowork',
  COWORK_ADMIN: 'Administra la configuración del cowork y todos sus usuarios',
  COWORK_USER: 'Usuario con acceso a funcionalidades básicas del cowork',
} as const;

/**
 * Role colors for UI badges
 */
export const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  COWORK_ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  COWORK_USER: 'bg-green-100 text-green-800 border-green-200',
} as const;
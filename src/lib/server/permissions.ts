import { UserRole } from '@/types/database'
import { TenantContext } from './tenant-context'

/**
 * Granular permissions system for Server Actions
 * Provides fine-grained access control beyond basic role hierarchy
 */

// Permission types
export type Permission = 
  // Tenant permissions
  | 'tenant:create' | 'tenant:read' | 'tenant:update' | 'tenant:delete' | 'tenant:manage_settings'
  // User permissions
  | 'user:create' | 'user:read' | 'user:update' | 'user:delete' | 'user:assign_roles' | 'user:view_all'
  // Client permissions
  | 'client:create' | 'client:read' | 'client:update' | 'client:delete' | 'client:manage_settings'
  // Space permissions
  | 'space:create' | 'space:read' | 'space:update' | 'space:delete' | 'space:manage_availability'
  // Booking permissions
  | 'booking:create' | 'booking:read' | 'booking:update' | 'booking:delete' | 'booking:approve' | 'booking:view_all'
  // Financial permissions
  | 'financial:read' | 'financial:create_invoice' | 'financial:manage_payments' | 'financial:view_reports'
  // System permissions
  | 'system:admin' | 'system:manage_integrations' | 'system:view_logs'

// Permission groups for easier management
export const PermissionGroups = {
  TENANT_ADMIN: [
    'tenant:read', 'tenant:update', 'tenant:manage_settings',
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:assign_roles', 'user:view_all',
    'client:create', 'client:read', 'client:update', 'client:delete', 'client:manage_settings',
    'space:create', 'space:read', 'space:update', 'space:delete', 'space:manage_availability',
    'booking:read', 'booking:update', 'booking:delete', 'booking:approve', 'booking:view_all',
    'financial:read', 'financial:create_invoice', 'financial:manage_payments', 'financial:view_reports'
  ] as Permission[],
  
  CLIENT_ADMIN: [
    'user:create', 'user:read', 'user:update', 'user:view_all',
    'client:read', 'client:update', 'client:manage_settings',
    'space:read',
    'booking:create', 'booking:read', 'booking:update', 'booking:view_all',
    'financial:read'
  ] as Permission[],
  
  END_USER: [
    'user:read',
    'client:read',
    'space:read',
    'booking:create', 'booking:read', 'booking:update'
  ] as Permission[],
  
  SUPER_ADMIN: [
    'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete', 'tenant:manage_settings',
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:assign_roles', 'user:view_all',
    'client:create', 'client:read', 'client:update', 'client:delete', 'client:manage_settings',
    'space:create', 'space:read', 'space:update', 'space:delete', 'space:manage_availability',
    'booking:create', 'booking:read', 'booking:update', 'booking:delete', 'booking:approve', 'booking:view_all',
    'financial:read', 'financial:create_invoice', 'financial:manage_payments', 'financial:view_reports',
    'system:admin', 'system:manage_integrations', 'system:view_logs'
  ] as Permission[]
} as const

// Resource-based permissions for more granular control
export interface ResourcePermission {
  resource: 'tenant' | 'user' | 'client' | 'space' | 'booking' | 'invoice' | 'payment'
  resourceId: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  conditions?: {
    ownedBy?: string // User ID
    belongsToClient?: string // Client ID
    belongsToTenant?: string // Tenant ID
    status?: string[] // Allowed statuses
    timeRange?: { start?: Date; end?: Date }
  }
}

/**
 * Permission checker class
 */
export class PermissionChecker {
  constructor(
    private context: TenantContext,
    private customPermissions: Permission[] = []
  ) {}

  /**
   * Get all permissions for the current user
   */
  getUserPermissions(): Permission[] {
    // Get base permissions based on role
    let basePermissions: Permission[] = []
    
    switch (this.context.role) {
      case 'SUPER_ADMIN':
        basePermissions = PermissionGroups.SUPER_ADMIN
        break
      case 'COWORK_ADMIN':
        basePermissions = PermissionGroups.TENANT_ADMIN
        break
      case 'CLIENT_ADMIN':
        basePermissions = PermissionGroups.CLIENT_ADMIN
        break
      case 'END_USER':
        basePermissions = PermissionGroups.END_USER
        break
      default:
        basePermissions = []
    }

    // Combine with custom permissions
    return [...new Set([...basePermissions, ...this.customPermissions])]
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    const userPermissions = this.getUserPermissions()
    return userPermissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * Check resource-specific permission with conditions
   */
  hasResourcePermission(resourcePermission: ResourcePermission): boolean {
    const { resource, action, conditions } = resourcePermission

    // Check base permission
    const basePermission = `${resource}:${action}` as Permission
    if (!this.hasPermission(basePermission)) {
      return false
    }

    // Apply conditions
    if (conditions) {
      // Check ownership
      if (conditions.ownedBy && conditions.ownedBy !== this.context.userId) {
        return false
      }

      // Check client membership
      if (conditions.belongsToClient && conditions.belongsToClient !== this.context.clientId) {
        // Allow if user is admin of the tenant
        if (!this.hasPermission('user:view_all')) {
          return false
        }
      }

      // Check tenant membership
      if (conditions.belongsToTenant && conditions.belongsToTenant !== this.context.tenantId) {
        // Only super admin can access cross-tenant resources
        if (this.context.role !== 'SUPER_ADMIN') {
          return false
        }
      }
    }

    return true
  }

  /**
   * Check if user can access specific user
   */
  canAccessUser(targetUserId: string, targetUserClientId?: string): boolean {
    // Users can always access themselves
    if (targetUserId === this.context.userId) {
      return true
    }

    // Super admin can access anyone
    if (this.context.role === 'SUPER_ADMIN') {
      return true
    }

    // Cowork admin can access users in their tenant
    if (this.context.role === 'COWORK_ADMIN') {
      return true
    }

    // Client admin can access users in their client
    if (this.context.role === 'CLIENT_ADMIN' && this.context.clientId) {
      return targetUserClientId === this.context.clientId
    }

    // End users can only access users in their client
    if (this.context.role === 'END_USER' && this.context.clientId) {
      return targetUserClientId === this.context.clientId
    }

    return false
  }

  /**
   * Check if user can access specific client
   */
  canAccessClient(targetClientId: string): boolean {
    // Super admin can access any client
    if (this.context.role === 'SUPER_ADMIN') {
      return true
    }

    // Cowork admin can access clients in their tenant
    if (this.context.role === 'COWORK_ADMIN') {
      return true
    }

    // Users can only access their own client
    return targetClientId === this.context.clientId
  }

  /**
   * Check if user can modify roles
   */
  canAssignRole(targetRole: UserRole): boolean {
    if (!this.hasPermission('user:assign_roles')) {
      return false
    }

    // Super admin can assign any role
    if (this.context.role === 'SUPER_ADMIN') {
      return true
    }

    // Cowork admin cannot assign SUPER_ADMIN or COWORK_ADMIN roles
    if (this.context.role === 'COWORK_ADMIN') {
      return !['SUPER_ADMIN', 'COWORK_ADMIN'].includes(targetRole)
    }

    return false
  }

  /**
   * Get filtered permissions for display purposes
   */
  getDisplayPermissions(): { category: string; permissions: Permission[] }[] {
    const userPermissions = this.getUserPermissions()
    
    const categories = [
      {
        category: 'Tenant Management',
        permissions: userPermissions.filter(p => p.startsWith('tenant:'))
      },
      {
        category: 'User Management',
        permissions: userPermissions.filter(p => p.startsWith('user:'))
      },
      {
        category: 'Client Management',
        permissions: userPermissions.filter(p => p.startsWith('client:'))
      },
      {
        category: 'Space Management',
        permissions: userPermissions.filter(p => p.startsWith('space:'))
      },
      {
        category: 'Booking Management',
        permissions: userPermissions.filter(p => p.startsWith('booking:'))
      },
      {
        category: 'Financial Management',
        permissions: userPermissions.filter(p => p.startsWith('financial:'))
      },
      {
        category: 'System Administration',
        permissions: userPermissions.filter(p => p.startsWith('system:'))
      },
    ]

    return categories.filter(cat => cat.permissions.length > 0)
  }
}

/**
 * Permission validation decorators and helpers
 */

/**
 * Require specific permission
 */
export function requirePermission(permission: Permission) {
  return function (context: TenantContext) {
    const checker = new PermissionChecker(context)
    if (!checker.hasPermission(permission)) {
      throw new Error(`Permission denied: ${permission} required`)
    }
    return context
  }
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return function (context: TenantContext) {
    const checker = new PermissionChecker(context)
    if (!checker.hasAnyPermission(permissions)) {
      throw new Error(`Permission denied: One of [${permissions.join(', ')}] required`)
    }
    return context
  }
}

/**
 * Require all of the specified permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return function (context: TenantContext) {
    const checker = new PermissionChecker(context)
    if (!checker.hasAllPermissions(permissions)) {
      throw new Error(`Permission denied: All of [${permissions.join(', ')}] required`)
    }
    return context
  }
}

/**
 * Create a permission checker for the current context
 */
export function createPermissionChecker(
  context: TenantContext, 
  customPermissions: Permission[] = []
): PermissionChecker {
  return new PermissionChecker(context, customPermissions)
}

/**
 * Permission validation for specific actions
 */
export const PermissionValidators = {
  // Tenant operations
  createTenant: requirePermission('tenant:create'),
  updateTenant: requirePermission('tenant:update'),
  deleteTenant: requirePermission('tenant:delete'),
  manageTenantSettings: requirePermission('tenant:manage_settings'),

  // User operations
  createUser: requirePermission('user:create'),
  updateUser: requirePermission('user:update'),
  deleteUser: requirePermission('user:delete'),
  assignUserRole: requirePermission('user:assign_roles'),
  viewAllUsers: requirePermission('user:view_all'),

  // Client operations
  createClient: requirePermission('client:create'),
  updateClient: requirePermission('client:update'),
  deleteClient: requirePermission('client:delete'),
  manageClientSettings: requirePermission('client:manage_settings'),

  // Financial operations
  viewFinancials: requirePermission('financial:read'),
  createInvoice: requirePermission('financial:create_invoice'),
  managePayments: requirePermission('financial:manage_payments'),
  viewReports: requirePermission('financial:view_reports'),

  // System operations
  systemAdmin: requirePermission('system:admin'),
  manageIntegrations: requirePermission('system:manage_integrations'),
  viewLogs: requirePermission('system:view_logs'),
} as const
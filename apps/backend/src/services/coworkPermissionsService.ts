import { UserRole } from "@sweetspot/shared";
import { supabaseAdmin } from "../lib/supabase";

// Define permission levels
export enum PermissionLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  DELETE = 3,
  ADMIN = 4,
  SUPER_ADMIN = 5
}

// Define resource types
export enum ResourceType {
  COWORK = "cowork",
  USER = "user", 
  CLIENT = "client",
  SPACE = "space",
  BOOKING = "booking",
  INVOICE = "invoice",
  PAYMENT = "payment",
  VISITOR = "visitor",
  ACCESS_LOG = "access_log",
  ANALYTICS = "analytics",
  SETTINGS = "settings",
  AUDIT_LOG = "audit_log"
}

// Define actions
export enum Action {
  CREATE = "create",
  READ = "read", 
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  VIEW_ALL = "view_all",
  EXPORT = "export",
  APPROVE = "approve"
}

interface PermissionRule {
  role: UserRole;
  resource: ResourceType;
  actions: Action[];
  conditions?: {
    ownResourceOnly?: boolean;
    sameCoworkOnly?: boolean;
    sameClientOnly?: boolean;
  };
}

// Permission matrix defining what each role can do
const PERMISSION_MATRIX: PermissionRule[] = [
  // SUPER_ADMIN - Can do everything across all coworks
  {
    role: "SUPER_ADMIN",
    resource: ResourceType.COWORK,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE, Action.VIEW_ALL]
  },
  {
    role: "SUPER_ADMIN", 
    resource: ResourceType.USER,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE, Action.VIEW_ALL]
  },
  {
    role: "SUPER_ADMIN",
    resource: ResourceType.ANALYTICS,
    actions: [Action.READ, Action.VIEW_ALL, Action.EXPORT]
  },
  {
    role: "SUPER_ADMIN",
    resource: ResourceType.AUDIT_LOG,
    actions: [Action.READ, Action.VIEW_ALL, Action.EXPORT]
  },

  // COWORK_ADMIN - Can manage everything within their cowork
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.USER,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.CLIENT,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.SPACE,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.BOOKING,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE, Action.APPROVE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.INVOICE,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.PAYMENT,
    actions: [Action.READ, Action.UPDATE, Action.MANAGE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.VISITOR,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE, Action.APPROVE],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.ACCESS_LOG,
    actions: [Action.READ, Action.VIEW_ALL],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.ANALYTICS,
    actions: [Action.READ, Action.VIEW_ALL, Action.EXPORT],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "COWORK_ADMIN",
    resource: ResourceType.SETTINGS,
    actions: [Action.READ, Action.UPDATE],
    conditions: { sameCoworkOnly: true }
  },

  // CLIENT_ADMIN - Can manage their client's data
  {
    role: "CLIENT_ADMIN",
    resource: ResourceType.USER,
    actions: [Action.CREATE, Action.READ, Action.UPDATE],
    conditions: { sameClientOnly: true }
  },
  {
    role: "CLIENT_ADMIN",
    resource: ResourceType.BOOKING,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    conditions: { sameClientOnly: true }
  },
  {
    role: "CLIENT_ADMIN",
    resource: ResourceType.INVOICE,
    actions: [Action.READ],
    conditions: { sameClientOnly: true }
  },
  {
    role: "CLIENT_ADMIN",
    resource: ResourceType.PAYMENT,
    actions: [Action.READ],
    conditions: { sameClientOnly: true }
  },
  {
    role: "CLIENT_ADMIN",
    resource: ResourceType.VISITOR,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    conditions: { sameClientOnly: true }
  },
  {
    role: "CLIENT_ADMIN",
    resource: ResourceType.SPACE,
    actions: [Action.READ],
    conditions: { sameCoworkOnly: true }
  },

  // END_USER - Can only manage their own data
  {
    role: "END_USER",
    resource: ResourceType.BOOKING,
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    conditions: { ownResourceOnly: true }
  },
  {
    role: "END_USER",
    resource: ResourceType.USER,
    actions: [Action.READ, Action.UPDATE],
    conditions: { ownResourceOnly: true }
  },
  {
    role: "END_USER",
    resource: ResourceType.VISITOR,
    actions: [Action.CREATE, Action.READ, Action.UPDATE],
    conditions: { ownResourceOnly: true }
  },
  {
    role: "END_USER",
    resource: ResourceType.SPACE,
    actions: [Action.READ],
    conditions: { sameCoworkOnly: true }
  },
  {
    role: "END_USER",
    resource: ResourceType.INVOICE,
    actions: [Action.READ],
    conditions: { ownResourceOnly: true }
  }
];

export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  tenantId: string | null; // null for super admins without tenant
  clientId?: string;
  targetResourceId?: string;
  targetResourceOwnerId?: string;
  targetResourceTenantId?: string;
  targetResourceClientId?: string;
}

export class CoworkPermissionsService {
  /**
   * Check if user has permission to perform action on resource
   */
  static async hasPermission(
    context: PermissionContext,
    resource: ResourceType,
    action: Action
  ): Promise<boolean> {
    try {
      console.log(`🔐 Checking permission: ${context.userRole} can ${action} ${resource}`);

      // Find applicable permission rules
      const applicableRules = PERMISSION_MATRIX.filter(
        rule => rule.role === context.userRole && rule.resource === resource
      );

      if (applicableRules.length === 0) {
        console.log(`❌ No permission rules found for ${context.userRole} on ${resource}`);
        return false;
      }

      // Check if any rule allows the action
      for (const rule of applicableRules) {
        if (!rule.actions.includes(action)) {
          continue;
        }

        // Check conditions
        if (rule.conditions) {
          const conditionsMet = await this.checkConditions(context, rule.conditions);
          if (!conditionsMet) {
            continue;
          }
        }

        console.log(`✅ Permission granted: ${context.userRole} can ${action} ${resource}`);
        return true;
      }

      console.log(`❌ Permission denied: ${context.userRole} cannot ${action} ${resource}`);
      return false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Check permission conditions
   */
  private static async checkConditions(
    context: PermissionContext,
    conditions: NonNullable<PermissionRule['conditions']>
  ): Promise<boolean> {
    // Super admins bypass all conditions
    if (context.userRole === "SUPER_ADMIN") {
      console.log(`✅ Super admin bypasses all conditions`);
      return true;
    }

    // Own resource only - user can only access their own resources
    if (conditions.ownResourceOnly) {
      if (context.targetResourceOwnerId && context.targetResourceOwnerId !== context.userId) {
        console.log(`❌ Condition failed: ownResourceOnly - ${context.userId} !== ${context.targetResourceOwnerId}`);
        return false;
      }
    }

    // Same cowork only - user can only access resources in their cowork
    if (conditions.sameCoworkOnly) {
      if (!context.tenantId) {
        console.log(`❌ Condition failed: sameCoworkOnly - user has no tenantId`);
        return false;
      }
      if (context.targetResourceTenantId && context.targetResourceTenantId !== context.tenantId) {
        console.log(`❌ Condition failed: sameCoworkOnly - ${context.tenantId} !== ${context.targetResourceTenantId}`);
        return false;
      }
    }

    // Same client only - user can only access resources in their client
    if (conditions.sameClientOnly) {
      if (!context.clientId) {
        console.log(`❌ Condition failed: sameClientOnly - user has no clientId`);
        return false;
      }
      if (context.targetResourceClientId && context.targetResourceClientId !== context.clientId) {
        console.log(`❌ Condition failed: sameClientOnly - ${context.clientId} !== ${context.targetResourceClientId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get user's permissions for a resource type
   */
  static getUserPermissions(userRole: UserRole, resource: ResourceType): Action[] {
    const applicableRules = PERMISSION_MATRIX.filter(
      rule => rule.role === userRole && rule.resource === resource
    );

    const permissions = new Set<Action>();
    applicableRules.forEach(rule => {
      rule.actions.forEach(action => permissions.add(action));
    });

    return Array.from(permissions);
  }

  /**
   * Check if user can access a specific cowork
   */
  static async canAccessCowork(userId: string, coworkId: string): Promise<boolean> {
    try {
      // Get user info
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("role, tenantId")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return false;
      }

      // Super admin can access any cowork
      if (user.role === "SUPER_ADMIN") {
        return true;
      }

      // Other users can only access their assigned cowork
      return user.tenantId === coworkId;
    } catch (error) {
      console.error("Error checking cowork access:", error);
      return false;
    }
  }

  /**
   * Filter resources based on user permissions
   */
  static async filterResourcesByPermission<T extends { id: string; tenantId?: string; userId?: string; clientId?: string }>(
    resources: T[],
    context: PermissionContext,
    resourceType: ResourceType
  ): Promise<T[]> {
    // Super admin sees everything
    if (context.userRole === "SUPER_ADMIN") {
      return resources;
    }

    const filteredResources: T[] = [];

    for (const resource of resources) {
      const resourceContext: PermissionContext = {
        ...context,
        targetResourceId: resource.id,
        targetResourceTenantId: resource.tenantId,
        targetResourceOwnerId: resource.userId,
        targetResourceClientId: resource.clientId
      };

      const canRead = await this.hasPermission(
        resourceContext,
        resourceType,
        Action.READ
      );

      if (canRead) {
        filteredResources.push(resource);
      }
    }

    return filteredResources;
  }

  /**
   * Validate resource access before performing operation
   */
  static async validateResourceAccess(
    context: PermissionContext,
    resource: ResourceType,
    action: Action,
    resourceData?: any
  ): Promise<{ allowed: boolean; error?: string }> {
    // Check basic permission
    const hasBasicPermission = await this.hasPermission(context, resource, action);
    
    if (!hasBasicPermission) {
      return {
        allowed: false,
        error: `Insufficient permissions to ${action} ${resource}`
      };
    }

    // Additional validation for specific resources
    if (resourceData) {
      // Validate tenant context for multi-tenant resources
      if (resourceData.tenantId && context.userRole !== "SUPER_ADMIN") {
        if (resourceData.tenantId !== context.tenantId) {
          return {
            allowed: false,
            error: "Resource belongs to different cowork"
          };
        }
      }

      // Validate client context for client-scoped resources
      if (resourceData.clientId && context.userRole === "CLIENT_ADMIN") {
        if (resourceData.clientId !== context.clientId) {
          return {
            allowed: false,
            error: "Resource belongs to different client"
          };
        }
      }

      // Validate ownership for user-owned resources
      if (resourceData.userId && context.userRole === "END_USER") {
        if (resourceData.userId !== context.userId) {
          return {
            allowed: false,
            error: "Resource belongs to different user"
          };
        }
      }
    }

    return { allowed: true };
  }
}

// Export convenience functions
export const hasPermission = CoworkPermissionsService.hasPermission;
export const canAccessCowork = CoworkPermissionsService.canAccessCowork;
export const validateResourceAccess = CoworkPermissionsService.validateResourceAccess;
export const filterResourcesByPermission = CoworkPermissionsService.filterResourcesByPermission;
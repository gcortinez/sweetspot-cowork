import { Response, NextFunction } from "express";
import { UserRole } from "@sweetspot/shared";
import { CoworkContextRequest } from "./coworkContext";
import { 
  CoworkPermissionsService, 
  ResourceType, 
  Action, 
  PermissionContext 
} from "../services/coworkPermissionsService";

export interface PermissionsRequest extends CoworkContextRequest {
  permissionContext?: PermissionContext;
}

/**
 * Middleware to set permission context
 */
export const setPermissionContext = (
  req: PermissionsRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next();
    return;
  }

  // Set permission context
  req.permissionContext = {
    userId: req.user.id,
    userRole: req.user.role as UserRole,
    tenantId: req.user.tenantId,
    clientId: req.user.clientId || undefined,
  };

  next();
};

/**
 * Higher-order function to create permission check middleware
 */
export const requirePermission = (
  resource: ResourceType,
  action: Action,
  options?: {
    getResourceId?: (req: PermissionsRequest) => string | undefined;
    getResourceData?: (req: PermissionsRequest) => Promise<any>;
  }
) => {
  return async (
    req: PermissionsRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.permissionContext) {
        res.status(401).json({
          success: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "User authentication is required"
        });
        return;
      }

      let context = req.permissionContext;

      // If resource ID getter is provided, add it to context
      if (options?.getResourceId) {
        const resourceId = options.getResourceId(req);
        if (resourceId) {
          context = {
            ...context,
            targetResourceId: resourceId
          };
        }
      }

      // If resource data getter is provided, fetch and validate
      let resourceData;
      if (options?.getResourceData) {
        resourceData = await options.getResourceData(req);
        if (resourceData) {
          context = {
            ...context,
            targetResourceOwnerId: resourceData.userId,
            targetResourceTenantId: resourceData.tenantId,
            targetResourceClientId: resourceData.clientId
          };
        }
      }

      // Validate permission
      const validation = await CoworkPermissionsService.validateResourceAccess(
        context,
        resource,
        action,
        resourceData
      );

      if (!validation.allowed) {
        res.status(403).json({
          success: false,
          error: "PERMISSION_DENIED",
          message: validation.error || `Insufficient permissions to ${action} ${resource}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error in permission check:", error);
      res.status(500).json({
        success: false,
        error: "PERMISSION_CHECK_FAILED",
        message: "Failed to validate permissions"
      });
    }
  };
};

/**
 * Middleware to require super admin permissions
 */
export const requireSuperAdmin = (
  req: PermissionsRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    res.status(403).json({
      success: false,
      error: "SUPER_ADMIN_REQUIRED",
      message: "Super admin permissions required"
    });
    return;
  }

  next();
};

/**
 * Middleware to require cowork admin or higher permissions
 */
export const requireCoworkAdmin = (
  req: PermissionsRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "AUTHENTICATION_REQUIRED",
      message: "User authentication is required"
    });
    return;
  }

  const adminRoles: UserRole[] = ["SUPER_ADMIN", "COWORK_ADMIN"];
  if (!adminRoles.includes(req.user.role as UserRole)) {
    res.status(403).json({
      success: false,
      error: "ADMIN_REQUIRED",
      message: "Administrator permissions required"
    });
    return;
  }

  next();
};

/**
 * Middleware to require client admin or higher permissions
 */
export const requireClientAdmin = (
  req: PermissionsRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "AUTHENTICATION_REQUIRED", 
      message: "User authentication is required"
    });
    return;
  }

  const adminRoles: UserRole[] = ["SUPER_ADMIN", "COWORK_ADMIN", "CLIENT_ADMIN"];
  if (!adminRoles.includes(req.user.role as UserRole)) {
    res.status(403).json({
      success: false,
      error: "CLIENT_ADMIN_REQUIRED",
      message: "Client administrator permissions required"
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user can access a specific cowork
 */
export const requireCoworkAccess = (coworkIdParam: string = "coworkId") => {
  return async (
    req: PermissionsRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "User authentication is required"
        });
        return;
      }

      const coworkId = req.params[coworkIdParam];
      if (!coworkId) {
        res.status(400).json({
          success: false,
          error: "MISSING_COWORK_ID",
          message: "Cowork ID is required"
        });
        return;
      }

      const hasAccess = await CoworkPermissionsService.canAccessCowork(
        req.user.id,
        coworkId
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: "COWORK_ACCESS_DENIED",
          message: "You don't have access to this cowork"
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Error checking cowork access:", error);
      res.status(500).json({
        success: false,
        error: "ACCESS_CHECK_FAILED",
        message: "Failed to validate cowork access"
      });
    }
  };
};

/**
 * Utility function to check permissions in controllers
 */
export const checkPermissionInController = async (
  req: PermissionsRequest,
  resource: ResourceType,
  action: Action,
  resourceData?: any
): Promise<{ allowed: boolean; error?: string }> => {
  if (!req.permissionContext) {
    return {
      allowed: false,
      error: "Permission context not available"
    };
  }

  return CoworkPermissionsService.validateResourceAccess(
    req.permissionContext,
    resource,
    action,
    resourceData
  );
};
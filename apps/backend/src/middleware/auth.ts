import { Request, Response, NextFunction } from "express";
import {
  getTenantContext,
  TenantContext,
  validateTenantAccess,
} from "../lib/rls";
import { verifySession } from "../lib/supabase";

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenantContext?: TenantContext;
      accessToken?: string;
    }
  }
}

/**
 * Middleware to verify JWT token and extract user information
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
        code: "MISSING_TOKEN",
      });
    }

    // Verify the token with Supabase
    const user = await verifySession(token);

    if (!user) {
      return res.status(401).json({
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    // Add user and token to request
    req.user = user;
    req.accessToken = token;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      code: "AUTH_FAILED",
    });
  }
};

/**
 * Middleware to extract and validate tenant context
 */
export const extractTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.accessToken) {
      return res.status(401).json({
        error: "Access token required for tenant context",
        code: "MISSING_TOKEN",
      });
    }

    const tenantContext = await getTenantContext(req.accessToken);

    if (!tenantContext) {
      return res.status(403).json({
        error: "Invalid tenant context",
        code: "INVALID_TENANT_CONTEXT",
      });
    }

    req.tenantContext = tenantContext;
    next();
  } catch (error) {
    console.error("Tenant context error:", error);
    return res.status(500).json({
      error: "Failed to extract tenant context",
      code: "TENANT_CONTEXT_ERROR",
    });
  }
};

/**
 * Middleware to validate tenant access for specific tenant operations
 */
export const validateTenantParam = (paramName: string = "tenantId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetTenantId = req.params[paramName];

      if (!targetTenantId) {
        return res.status(400).json({
          error: `Missing ${paramName} parameter`,
          code: "MISSING_TENANT_PARAM",
        });
      }

      if (!req.tenantContext) {
        return res.status(403).json({
          error: "Tenant context required",
          code: "MISSING_TENANT_CONTEXT",
        });
      }

      const hasAccess = validateTenantAccess(req.tenantContext, targetTenantId);

      if (!hasAccess) {
        return res.status(403).json({
          error: "Access denied to this tenant",
          code: "TENANT_ACCESS_DENIED",
        });
      }

      next();
    } catch (error) {
      console.error("Tenant validation error:", error);
      return res.status(500).json({
        error: "Failed to validate tenant access",
        code: "TENANT_VALIDATION_ERROR",
      });
    }
  };
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.tenantContext) {
        return res.status(403).json({
          error: "Tenant context required",
          code: "MISSING_TENANT_CONTEXT",
        });
      }

      const userRole = req.tenantContext.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRoles: allowedRoles,
          userRole,
        });
      }

      next();
    } catch (error) {
      console.error("Role validation error:", error);
      return res.status(500).json({
        error: "Failed to validate user role",
        code: "ROLE_VALIDATION_ERROR",
      });
    }
  };
};

/**
 * Middleware to require admin privileges (SUPER_ADMIN or COWORK_ADMIN)
 */
export const requireAdmin = requireRole(["SUPER_ADMIN", "COWORK_ADMIN"]);

/**
 * Middleware to require super admin privileges
 */
export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);

/**
 * Middleware to allow client admin access to their own client data
 */
export const requireClientAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.tenantContext) {
      return res.status(403).json({
        error: "Tenant context required",
        code: "MISSING_TENANT_CONTEXT",
      });
    }

    const { role, clientId } = req.tenantContext;
    const targetClientId = req.params.clientId;

    // Admins can access any client in their tenant
    if (["SUPER_ADMIN", "COWORK_ADMIN"].includes(role)) {
      return next();
    }

    // Client admins can only access their own client
    if (role === "CLIENT_ADMIN" && clientId === targetClientId) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied to this client",
      code: "CLIENT_ACCESS_DENIED",
    });
  } catch (error) {
    console.error("Client access validation error:", error);
    return res.status(500).json({
      error: "Failed to validate client access",
      code: "CLIENT_ACCESS_ERROR",
    });
  }
};

/**
 * Middleware to validate user can access their own data or admin can access any
 */
export const requireUserAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.tenantContext) {
      return res.status(403).json({
        error: "Tenant context required",
        code: "MISSING_TENANT_CONTEXT",
      });
    }

    const { role, userId } = req.tenantContext;
    const targetUserId = req.params.userId;

    // Admins can access any user in their tenant
    if (["SUPER_ADMIN", "COWORK_ADMIN"].includes(role)) {
      return next();
    }

    // Users can only access their own data
    if (userId === targetUserId) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied to this user data",
      code: "USER_ACCESS_DENIED",
    });
  } catch (error) {
    console.error("User access validation error:", error);
    return res.status(500).json({
      error: "Failed to validate user access",
      code: "USER_ACCESS_ERROR",
    });
  }
};

/**
 * Error handler for authentication and authorization errors
 */
export const authErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Auth error:", error);

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
      code: "INVALID_JWT",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
      code: "EXPIRED_JWT",
    });
  }

  if (error.code === "PGRST301") {
    return res.status(403).json({
      error: "Row Level Security policy violation",
      code: "RLS_VIOLATION",
    });
  }

  // Default error response
  return res.status(500).json({
    error: "Internal authentication error",
    code: "AUTH_INTERNAL_ERROR",
  });
};

/**
 * Combined middleware for full authentication and tenant context
 */
export const authenticateAndExtractTenant = [
  authenticateToken,
  extractTenantContext,
];

/**
 * Combined middleware for tenant-specific operations
 */
export const authenticateWithTenantValidation = (
  tenantParam: string = "tenantId"
) => [
  authenticateToken,
  extractTenantContext,
  validateTenantParam(tenantParam),
];

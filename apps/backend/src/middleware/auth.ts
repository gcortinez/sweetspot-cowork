import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { getTenantContext } from "../lib/rls";
import { UserRole } from "@sweetspot/shared";
import { AuthenticatedRequest, BaseRequest } from "../types/api";
import { ResponseHelper } from "../utils/response";
import { logger } from "../utils/logger";
import { asyncHandler } from "./errorHandler";
import { securityEventService } from "../services/securityEventService";

/**
 * Authentication middleware
 * Validates JWT token and extracts user/tenant context
 */
export const authenticate = async (
  req: BaseRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Authentication failed: Missing or invalid authorization header", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });
      ResponseHelper.unauthorized(res, "Missing or invalid authorization header");
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Handle bypass tokens for testing
    if (token.startsWith("bypass_token_")) {
      logger.debug("Using bypass token for testing", { 
        path: req.path,
        ip: req.ip,
      });
      
      // Set mock user and tenant for bypass tokens
      req.user = {
        id: "user_1749874837193", // Use the real user ID from database
        email: "admin@sweetspot.io",
        tenantId: "tenant_1749874836546",
        role: "SUPER_ADMIN",
        clientId: undefined,
      };
      req.tenant = {
        id: "tenant_1749874836546",
        name: "SweetSpot HQ",
        slug: "sweetspot-hq",
      };
      return next();
    }

    // Get session information for real tokens
    const session = await AuthService.getSession(token);
    if (!session.isValid) {
      logger.warn("Authentication failed: Invalid or expired token", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });
      ResponseHelper.unauthorized(res, "Invalid or expired token");
      return;
    }

    // Add user and tenant context to request
    req.user = session.user;
    req.tenant = session.tenant;

    logger.info("Authentication successful", {
      userId: req.user.id,
      tenantId: req.tenant?.id,
      userRole: req.user.role,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error("Authentication error", {
      error: (error as Error).message,
      path: req.path,
      ip: req.ip
    });
    ResponseHelper.unauthorized(res, "Authentication failed");
  }
};

/**
 * Optional authentication middleware
 * Adds user context if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: BaseRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      
      // Handle bypass tokens for testing
      if (token.startsWith("bypass_token_")) {
        req.user = {
          id: "user_1749874836637",
          email: "admin@sweetspot.io",
          tenantId: "tenant_1749874836546",
          role: "SUPER_ADMIN",
          clientId: undefined,
        };
        req.tenant = {
          id: "tenant_1749874836546",
          name: "SweetSpot HQ",
          slug: "sweetspot-hq",
        };
      } else {
        const session = await AuthService.getSession(token);
        if (session.isValid) {
          req.user = session.user;
          req.tenant = session.tenant;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires specific role or higher
 */
export const requireRole = (requiredRole: UserRole) => {
  return async (
    req: BaseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      logger.warn("Authorization failed: No user context", {
        path: req.path,
        ip: req.ip,
        requiredRole,
      });
      ResponseHelper.unauthorized(res, "Authentication required");
      return;
    }

    // Role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      END_USER: 1,
      CLIENT_ADMIN: 2,
      COWORK_ADMIN: 3,
      SUPER_ADMIN: 4,
    };

    const userRoleLevel = roleHierarchy[req.user.role as UserRole];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      logger.warn("Authorization failed: Insufficient role level", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole,
        path: req.path,
        ip: req.ip,
      });
      ResponseHelper.forbidden(res, `Insufficient permissions. Required role: ${requiredRole}`);
      return;
    }

    logger.debug("Role authorization successful", {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRole,
      path: req.path,
    });

    next();
  };
};

/**
 * Tenant access middleware
 * Ensures user can only access their own tenant's data
 */
export const requireTenantAccess = (tenantIdParam: string = "tenantId") => {
  return async (
    req: BaseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Super admin can access any tenant
      if (req.user.role === "SUPER_ADMIN") {
        next();
        return;
      }

      // Get tenant ID from request params, body, or query
      const requestedTenantId =
        req.params[tenantIdParam] ||
        req.body[tenantIdParam] ||
        req.query[tenantIdParam];

      if (!requestedTenantId) {
        res.status(400).json({
          success: false,
          error: "Tenant ID required",
        });
        return;
      }

      // Check if user belongs to the requested tenant
      if (req.user.tenantId !== requestedTenantId) {
        res.status(403).json({
          success: false,
          error: "Access denied to this tenant",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Tenant access error:", error);
      res.status(403).json({
        success: false,
        error: "Tenant access validation failed",
      });
    }
  };
};

/**
 * Client access middleware
 * Ensures user can only access their own client's data (for CLIENT_ADMIN and END_USER)
 */
export const requireClientAccess = (clientIdParam: string = "clientId") => {
  return async (
    req: BaseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Super admin and cowork admin can access any client
      if (req.user.role === "SUPER_ADMIN" || req.user.role === "COWORK_ADMIN") {
        next();
        return;
      }

      // Get client ID from request params, body, or query
      const requestedClientId =
        req.params[clientIdParam] ||
        req.body[clientIdParam] ||
        req.query[clientIdParam];

      if (!requestedClientId) {
        res.status(400).json({
          success: false,
          error: "Client ID required",
        });
        return;
      }

      // Check if user belongs to the requested client
      if (req.user.clientId !== requestedClientId) {
        res.status(403).json({
          success: false,
          error: "Access denied to this client",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Client access error:", error);
      res.status(403).json({
        success: false,
        error: "Client access validation failed",
      });
    }
  };
};

/**
 * Self-access middleware
 * Ensures user can only access their own data
 */
export const requireSelfAccess = (userIdParam: string = "userId") => {
  return async (
    req: BaseRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      // Super admin and cowork admin can access any user
      if (req.user.role === "SUPER_ADMIN" || req.user.role === "COWORK_ADMIN") {
        next();
        return;
      }

      // Get user ID from request params, body, or query
      const requestedUserId =
        req.params[userIdParam] ||
        req.body[userIdParam] ||
        req.query[userIdParam];

      if (!requestedUserId) {
        res.status(400).json({
          success: false,
          error: "User ID required",
        });
        return;
      }

      // Check if user is accessing their own data
      if (req.user.id !== requestedUserId) {
        res.status(403).json({
          success: false,
          error: "Access denied to this user data",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Self access error:", error);
      res.status(403).json({
        success: false,
        error: "Self access validation failed",
      });
    }
  };
};

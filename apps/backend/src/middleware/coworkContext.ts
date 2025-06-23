import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/api";
import { UserRole } from "@sweetspot/shared";
import { TenantService } from "../services/tenantService";
import { AuthService } from "../services/authService";

export interface CoworkContextRequest extends AuthenticatedRequest {
  activeCowork?: {
    id: string;
    name: string;
    slug: string;
  };
  userCoworks?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  isSuperAdmin?: boolean;
}

/**
 * Middleware to set active cowork context
 * This middleware should be used after authentication middleware
 */
export const setCoworkContext = async (
  req: CoworkContextRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    console.log(`🔄 Setting cowork context for user ${req.user.id} (role: ${req.user.role})`);

    // Get user's accessible coworks
    const coworksResult = await AuthService.getUserCoworks(req.user.id, req.user.role as UserRole);

    if (!coworksResult.success) {
      console.error("Failed to get user coworks:", coworksResult.error);
      next();
      return;
    }

    // Set context data
    req.userCoworks = coworksResult.userCoworks || [];
    req.isSuperAdmin = coworksResult.isSuperAdmin || false;

    // Determine active cowork
    let activeCowork = null;

    // Check for cowork selection in headers (for frontend cowork switching)
    const requestedCoworkId = req.headers['x-active-cowork'] as string;
    const requestedCoworkSlug = req.headers['x-active-cowork-slug'] as string;

    if (requestedCoworkId) {
      // Validate user has access to requested cowork
      const hasAccess = req.userCoworks?.some(cowork => 
        cowork.id === requestedCoworkId
      );

      if (hasAccess) {
        const requestedCowork = req.userCoworks?.find(cowork => 
          cowork.id === requestedCoworkId
        );
        if (requestedCowork) {
          activeCowork = {
            id: requestedCowork.id,
            name: requestedCowork.name,
            slug: requestedCowork.slug,
          };
        }
      } else {
        console.warn(`⚠️ User ${req.user.id} attempted to access unauthorized cowork ${requestedCoworkId}`);
      }
    } else if (requestedCoworkSlug) {
      // Validate user has access to requested cowork by slug
      const hasAccess = req.userCoworks?.some(cowork => 
        cowork.slug === requestedCoworkSlug
      );

      if (hasAccess) {
        const requestedCowork = req.userCoworks?.find(cowork => 
          cowork.slug === requestedCoworkSlug
        );
        if (requestedCowork) {
          activeCowork = {
            id: requestedCowork.id,
            name: requestedCowork.name,
            slug: requestedCowork.slug,
          };
        }
      } else {
        console.warn(`⚠️ User ${req.user.id} attempted to access unauthorized cowork ${requestedCoworkSlug}`);
      }
    }

    // If no specific cowork requested, use default
    if (!activeCowork && coworksResult.defaultCowork) {
      activeCowork = coworksResult.defaultCowork;
    }

    // Set active cowork
    req.activeCowork = activeCowork || undefined;

    console.log(`✅ Active cowork set: ${activeCowork ? `${activeCowork.name} (${activeCowork.id})` : 'none'}`);

    next();
  } catch (error) {
    console.error("Error in setCoworkContext:", error);
    // Don't fail the request, just continue without context
    next();
  }
};

/**
 * Middleware to require an active cowork (for routes that need cowork context)
 */
export const requireActiveCowork = (
  req: CoworkContextRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.activeCowork) {
    res.status(400).json({
      success: false,
      error: "COWORK_CONTEXT_REQUIRED",
      message: "An active cowork must be selected for this operation",
    });
    return;
  }

  next();
};

/**
 * Middleware to validate cowork access for super admin routes
 */
export const validateCoworkAccess = (
  req: CoworkContextRequest,
  res: Response,
  next: NextFunction
): void => {
  const targetCoworkId = req.params.coworkId || req.params.tenantId;

  if (!targetCoworkId) {
    res.status(400).json({
      success: false,
      error: "MISSING_COWORK_ID",
      message: "Cowork ID is required for this operation",
    });
    return;
  }

  // Super admin can access any cowork
  if (req.isSuperAdmin) {
    next();
    return;
  }

  // Regular users need explicit access
  const hasAccess = req.userCoworks?.some(cowork => 
    cowork.id === targetCoworkId
  );

  if (!hasAccess) {
    res.status(403).json({
      success: false,
      error: "COWORK_ACCESS_DENIED",
      message: "You don't have access to this cowork",
    });
    return;
  }

  next();
};
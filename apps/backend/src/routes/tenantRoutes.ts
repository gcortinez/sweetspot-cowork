import { Router } from "express";
import { TenantController } from "../controllers/tenantController";
import {
  authenticate,
  requireRole,
  requireTenantAccess,
} from "../middleware/auth";

const router = Router();

/**
 * Tenant Routes
 * All routes require authentication and appropriate permissions
 */

// Public utility routes (no auth required)
router.post("/generate-slug", TenantController.generateSlug as any);
router.get("/check-slug/:slug", TenantController.checkSlugAvailability as any);

// Super admin only routes
router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.createTenant as any
);
router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.getAllTenants as any
);

// Tenant-specific routes (require tenant access or super admin)
router.get("/slug/:slug", authenticate, TenantController.getTenantBySlug as any);
router.get(
  "/:tenantId",
  authenticate,
  requireTenantAccess("tenantId"),
  TenantController.getTenantById as any
);
router.put(
  "/:tenantId",
  authenticate,
  requireTenantAccess("tenantId"),
  TenantController.updateTenant as any
);
router.delete(
  "/:tenantId",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.deleteTenant as any
);

// Tenant management routes (super admin only)
router.post(
  "/:tenantId/suspend",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.suspendTenant as any
);
router.post(
  "/:tenantId/activate",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.activateTenant as any
);

// Tenant statistics (require tenant access)
router.get(
  "/:tenantId/stats",
  authenticate,
  requireTenantAccess("tenantId"),
  TenantController.getTenantStats as any
);

export default router;

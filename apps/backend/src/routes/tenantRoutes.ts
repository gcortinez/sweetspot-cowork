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
router.post("/generate-slug", TenantController.generateSlug);
router.get("/check-slug/:slug", TenantController.checkSlugAvailability);

// Super admin only routes
router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.createTenant
);
router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.getAllTenants
);

// Tenant-specific routes (require tenant access or super admin)
router.get("/slug/:slug", authenticate, TenantController.getTenantBySlug);
router.get(
  "/:tenantId",
  authenticate,
  requireTenantAccess("tenantId"),
  TenantController.getTenantById
);
router.put(
  "/:tenantId",
  authenticate,
  requireTenantAccess("tenantId"),
  TenantController.updateTenant
);
router.delete(
  "/:tenantId",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.deleteTenant
);

// Tenant management routes (super admin only)
router.post(
  "/:tenantId/suspend",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.suspendTenant
);
router.post(
  "/:tenantId/activate",
  authenticate,
  requireRole("SUPER_ADMIN"),
  TenantController.activateTenant
);

// Tenant statistics (require tenant access)
router.get(
  "/:tenantId/stats",
  authenticate,
  requireTenantAccess("tenantId"),
  TenantController.getTenantStats
);

export default router;

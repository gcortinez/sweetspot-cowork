"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantController_1 = require("../controllers/tenantController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/generate-slug", tenantController_1.TenantController.generateSlug);
router.get("/check-slug/:slug", tenantController_1.TenantController.checkSlugAvailability);
router.post("/", auth_1.authenticate, (0, auth_1.requireRole)("SUPER_ADMIN"), tenantController_1.TenantController.createTenant);
router.get("/", auth_1.authenticate, (0, auth_1.requireRole)("SUPER_ADMIN"), tenantController_1.TenantController.getAllTenants);
router.get("/slug/:slug", auth_1.authenticate, tenantController_1.TenantController.getTenantBySlug);
router.get("/:tenantId", auth_1.authenticate, (0, auth_1.requireTenantAccess)("tenantId"), tenantController_1.TenantController.getTenantById);
router.put("/:tenantId", auth_1.authenticate, (0, auth_1.requireTenantAccess)("tenantId"), tenantController_1.TenantController.updateTenant);
router.delete("/:tenantId", auth_1.authenticate, (0, auth_1.requireRole)("SUPER_ADMIN"), tenantController_1.TenantController.deleteTenant);
router.post("/:tenantId/suspend", auth_1.authenticate, (0, auth_1.requireRole)("SUPER_ADMIN"), tenantController_1.TenantController.suspendTenant);
router.post("/:tenantId/activate", auth_1.authenticate, (0, auth_1.requireRole)("SUPER_ADMIN"), tenantController_1.TenantController.activateTenant);
router.get("/:tenantId/stats", auth_1.authenticate, (0, auth_1.requireTenantAccess)("tenantId"), tenantController_1.TenantController.getTenantStats);
exports.default = router;
//# sourceMappingURL=tenantRoutes.js.map
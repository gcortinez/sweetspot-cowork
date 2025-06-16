import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogStatistics,
  exportAuditLogs,
  getUserAuditLogs,
  getEntityAuditLogs,
  getMyAuditLogs,
  cleanupAuditLogs,
  getSecurityEvents,
} from "../controllers/auditLogController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

// General audit log queries (admin only)
router.get("/", getAuditLogs);
router.get("/statistics", getAuditLogStatistics);
router.get("/export", exportAuditLogs);
router.get("/security-events", getSecurityEvents);

// User-specific logs
router.get("/my-activity", getMyAuditLogs);
router.get("/user/:userId", getUserAuditLogs);

// Entity-specific logs (admin only)
router.get("/entity/:entityType/:entityId", getEntityAuditLogs);

// Cleanup old logs (super admin only)
router.post("/cleanup", cleanupAuditLogs);

export { router as auditLogRoutes };

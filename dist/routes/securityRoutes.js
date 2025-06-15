"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const twoFactorController = __importStar(require("../controllers/twoFactorController"));
const auditLogController = __importStar(require("../controllers/auditLogController"));
const securityEventController = __importStar(require("../controllers/securityEventController"));
const securityController_1 = require("../controllers/securityController");
const rateLimiting_1 = require("../middleware/rateLimiting");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/auth/2fa/setup', twoFactorController.setupTwoFactor);
router.post('/auth/2fa/enable', twoFactorController.enableTwoFactor);
router.post('/auth/2fa/disable', twoFactorController.disableTwoFactor);
router.post('/auth/2fa/verify', twoFactorController.verifyTwoFactor);
router.post('/auth/2fa/backup-codes', twoFactorController.generateBackupCodes);
router.get('/auth/2fa/status', twoFactorController.getTwoFactorStatus);
router.post('/auth/2fa/require-check', twoFactorController.checkTwoFactorRequired);
router.get('/audit-logs', auditLogController.getAuditLogs);
router.get('/audit-logs/statistics', auditLogController.getAuditLogStatistics);
router.post('/audit-logs/export', auditLogController.exportAuditLogs);
router.get('/audit-logs/user/:userId', auditLogController.getUserAuditLogs);
router.get('/audit-logs/entity/:entityType/:entityId', auditLogController.getEntityAuditLogs);
router.get('/audit-logs/my-activity', auditLogController.getMyAuditLogs);
router.delete('/audit-logs/cleanup', auditLogController.cleanupAuditLogs);
router.get('/events', securityEventController.getSecurityEvents);
router.get('/events/statistics', securityEventController.getSecurityEventStatistics);
router.put('/events/:eventId/resolve', securityEventController.resolveSecurityEvent);
router.get('/events/unresolved', securityEventController.getUnresolvedEvents);
router.get('/events/critical', securityEventController.getCriticalEvents);
router.get('/events/failed-logins', securityEventController.getFailedLogins);
router.get('/events/threat-detection', securityEventController.detectThreats);
router.get('/events/by-ip/:ipAddress', securityEventController.getEventsByIP);
router.get('/events/user/:userId', securityEventController.getUserSecurityEvents);
router.get('/events/dashboard', securityEventController.getSecurityDashboard);
router.get('/sessions', securityController_1.getUserSessions);
router.delete('/sessions/:sessionId', securityController_1.invalidateSession);
router.delete('/sessions', securityController_1.invalidateAllOtherSessions);
router.put('/sessions/config', securityController_1.updateSessionConfig);
router.post('/ip-whitelist', (0, auth_1.requireRole)('COWORK_ADMIN'), rateLimiting_1.adminRateLimit, securityController_1.addToIPWhitelist);
router.delete('/ip-whitelist/:ipAddress', (0, auth_1.requireRole)('COWORK_ADMIN'), rateLimiting_1.adminRateLimit, securityController_1.removeFromIPWhitelist);
router.get('/ip-whitelist/:ipAddress/check', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.checkIPWhitelist);
router.get('/events-enhanced', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.getSecurityEvents);
router.get('/events-enhanced/stats', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.getSecurityEventStats);
router.put('/events-enhanced/:eventId/resolve', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.resolveSecurityEvent);
router.get('/audit-logs-enhanced', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.getAuditLogs);
router.get('/audit-logs-enhanced/export', (0, auth_1.requireRole)('COWORK_ADMIN'), rateLimiting_1.exportRateLimit, securityController_1.exportAuditLogs);
router.post('/encryption/generate-key', (0, auth_1.requireRole)('SUPER_ADMIN'), securityController_1.generateEncryptionKey);
router.post('/encryption/test', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.testEncryption);
router.get('/dashboard-enhanced', (0, auth_1.requireRole)('COWORK_ADMIN'), securityController_1.getSecurityDashboard);
exports.default = router;
//# sourceMappingURL=securityRoutes.js.map
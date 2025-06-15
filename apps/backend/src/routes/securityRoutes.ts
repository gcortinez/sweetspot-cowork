import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as twoFactorController from '../controllers/twoFactorController';
import * as auditLogController from '../controllers/auditLogController';
import * as securityEventController from '../controllers/securityEventController';
import {
  getUserSessions,
  invalidateSession,
  invalidateAllOtherSessions,
  updateSessionConfig,
  addToIPWhitelist,
  removeFromIPWhitelist,
  checkIPWhitelist,
  getSecurityEvents,
  getSecurityEventStats,
  resolveSecurityEvent,
  getAuditLogs,
  exportAuditLogs,
  generateEncryptionKey,
  testEncryption,
  getSecurityDashboard
} from '../controllers/securityController';
import { exportRateLimit, adminRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// TWO-FACTOR AUTHENTICATION ROUTES
// ============================================================================

// Setup 2FA
router.post('/auth/2fa/setup', twoFactorController.setupTwoFactor);

// Enable 2FA after verification
router.post('/auth/2fa/enable', twoFactorController.enableTwoFactor);

// Disable 2FA
router.post('/auth/2fa/disable', twoFactorController.disableTwoFactor);

// Verify 2FA token
router.post('/auth/2fa/verify', twoFactorController.verifyTwoFactor);

// Generate new backup codes
router.post('/auth/2fa/backup-codes', twoFactorController.generateBackupCodes);

// Get 2FA status
router.get('/auth/2fa/status', twoFactorController.getTwoFactorStatus);

// Check if 2FA is required for operation
router.post('/auth/2fa/require-check', twoFactorController.checkTwoFactorRequired);

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

// Get audit logs (admin only)
router.get('/audit-logs', auditLogController.getAuditLogs);

// Get audit log statistics (admin only)
router.get('/audit-logs/statistics', auditLogController.getAuditLogStatistics);

// Export audit logs (admin only)
router.post('/audit-logs/export', auditLogController.exportAuditLogs);

// Get user audit logs (admin only)
router.get('/audit-logs/user/:userId', auditLogController.getUserAuditLogs);

// Get entity audit logs (admin only)
router.get('/audit-logs/entity/:entityType/:entityId', auditLogController.getEntityAuditLogs);

// Get my audit logs (user's own activity)
router.get('/audit-logs/my-activity', auditLogController.getMyAuditLogs);

// Clean up old audit logs (super admin only)
router.delete('/audit-logs/cleanup', auditLogController.cleanupAuditLogs);

// ============================================================================
// SECURITY EVENT ROUTES
// ============================================================================

// Get security events (admin only)
router.get('/events', securityEventController.getSecurityEvents);

// Get security event statistics (admin only)
router.get('/events/statistics', securityEventController.getSecurityEventStatistics);

// Resolve security event (admin only)
router.put('/events/:eventId/resolve', securityEventController.resolveSecurityEvent);

// Get unresolved events (admin only)
router.get('/events/unresolved', securityEventController.getUnresolvedEvents);

// Get critical events (admin only)
router.get('/events/critical', securityEventController.getCriticalEvents);

// Get failed login attempts (admin only)
router.get('/events/failed-logins', securityEventController.getFailedLogins);

// Threat detection (admin only)
router.get('/events/threat-detection', securityEventController.detectThreats);

// Get events by IP address (admin only)
router.get('/events/by-ip/:ipAddress', securityEventController.getEventsByIP);

// Get user security events (admin only)
router.get('/events/user/:userId', securityEventController.getUserSecurityEvents);

// Security dashboard summary (admin only)
router.get('/events/dashboard', securityEventController.getSecurityDashboard);

// ============================================================================
// SESSION MANAGEMENT ROUTES
// ============================================================================

// Get current user's active sessions
router.get('/sessions', getUserSessions);

// Invalidate a specific session
router.delete('/sessions/:sessionId', invalidateSession);

// Invalidate all other sessions except current
router.delete('/sessions', invalidateAllOtherSessions);

// Update session security configuration
router.put('/sessions/config', updateSessionConfig);

// ============================================================================
// IP WHITELISTING ROUTES (Admin Only)
// ============================================================================

// Add IP to whitelist
router.post('/ip-whitelist', requireRole('COWORK_ADMIN'), adminRateLimit, addToIPWhitelist);

// Remove IP from whitelist
router.delete('/ip-whitelist/:ipAddress', requireRole('COWORK_ADMIN'), adminRateLimit, removeFromIPWhitelist);

// Check if IP is whitelisted
router.get('/ip-whitelist/:ipAddress/check', requireRole('COWORK_ADMIN'), checkIPWhitelist);

// ============================================================================
// SECURITY EVENTS ROUTES (Enhanced)
// ============================================================================

// Get security events with filtering and pagination
router.get('/events-enhanced', requireRole('COWORK_ADMIN'), getSecurityEvents);

// Get security event statistics
router.get('/events-enhanced/stats', requireRole('COWORK_ADMIN'), getSecurityEventStats);

// Resolve a security event
router.put('/events-enhanced/:eventId/resolve', requireRole('COWORK_ADMIN'), resolveSecurityEvent);

// ============================================================================
// AUDIT LOG ROUTES (Enhanced)
// ============================================================================

// Get audit logs with filtering and pagination
router.get('/audit-logs-enhanced', requireRole('COWORK_ADMIN'), getAuditLogs);

// Export audit logs
router.get('/audit-logs-enhanced/export', requireRole('COWORK_ADMIN'), exportRateLimit, exportAuditLogs);

// ============================================================================
// ENCRYPTION ROUTES (Super Admin Only)
// ============================================================================

// Generate new encryption key
router.post('/encryption/generate-key', requireRole('SUPER_ADMIN'), generateEncryptionKey);

// Test encryption functionality
router.post('/encryption/test', requireRole('COWORK_ADMIN'), testEncryption);

// ============================================================================
// SECURITY DASHBOARD ROUTES
// ============================================================================

// Get security dashboard data
router.get('/dashboard-enhanced', requireRole('COWORK_ADMIN'), getSecurityDashboard);

export default router;
import { Router, Request, Response } from 'express';
import { superAdminController } from '../controllers/superAdminController';
import { authenticate } from '../middleware/auth';
import { setCoworkContext } from '../middleware/coworkContext';
import { setPermissionContext, requireSuperAdmin, requireCoworkAccess } from '../middleware/permissions';
import { AuthenticatedRequest } from '../types/api';

const router = Router();

/**
 * Super Admin Routes
 * All routes require authentication and SUPER_ADMIN role
 * The role verification is done within each controller method
 */

// Test endpoint without authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Super Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint with authentication  
router.get('/test-auth', authenticate as any, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Super Admin auth routes are working!',
    user: (req as any).user || null,
    timestamp: new Date().toISOString()
  });
});

// Apply authentication and permission middleware to all protected routes
const protectedMiddleware = [authenticate, setCoworkContext, setPermissionContext, requireSuperAdmin].map(m => m as any);

// Cowork management routes
router.get('/coworks', ...protectedMiddleware, superAdminController.getCoworks as any);
router.get('/coworks/:id', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.getCoworkById as any);
router.post('/coworks', ...protectedMiddleware, superAdminController.createCowork as any);
router.put('/coworks/:id', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.updateCowork as any);
router.delete('/coworks/:id', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.deleteCowork as any);

// Cowork status management
router.put('/coworks/:id/suspend', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.suspendCowork as any);
router.put('/coworks/:id/activate', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.activateCowork as any);

// Cross-tenant data access
router.get('/coworks/:id/users', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.getCoworkUsers as any);
router.get('/coworks/:id/clients', ...protectedMiddleware, (requireCoworkAccess('id') as any), superAdminController.getCoworkClients as any);

// System analytics and billing - simplified middleware for super admin without tenant
router.get('/analytics', authenticate as any, requireSuperAdmin as any, superAdminController.getSystemAnalytics as any);

// Billing routes - temporarily disabled for testing
// router.get('/billing/overview', superAdminController.getBillingOverview as any);
// router.get('/billing/coworks', superAdminController.getCoworksBilling as any);
// router.get('/billing/metrics', superAdminController.getBillingMetrics as any);
// router.get('/billing/transactions', superAdminController.getBillingTransactions as any);
// router.post('/billing/report', superAdminController.generateFinancialReport as any);

// Audit and Security routes - temporarily disabled for testing
// router.get('/audit/stats', superAdminController.getAuditStats as any);
// router.get('/audit/logs', superAdminController.getAuditLogs as any);
// router.get('/audit/alerts', superAdminController.getSecurityAlerts as any);
// router.get('/audit/trail/:resource/:id', superAdminController.getResourceAuditTrail as any);
// router.post('/audit/export', superAdminController.exportAuditLogs as any);

export { router as superAdminRoutes };
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as accessControlController from '../controllers/accessControlController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// ============================================================================
// QR CODE ROUTES
// ============================================================================

// Generate a new QR code
router.post('/qr-codes', accessControlController.generateQRCode as any);

// Scan a QR code
router.post('/qr-codes/scan', accessControlController.scanQRCode as any);

// Get user's QR codes
router.get('/users/:userId/qr-codes', accessControlController.getUserQRCodes as any);

// Get current user's QR codes
router.get('/my-qr-codes', accessControlController.getUserQRCodes as any);

// Revoke a QR code
router.delete('/qr-codes/:qrCodeId', accessControlController.revokeQRCode as any);

// Get QR code scan history
router.get('/qr-codes/scans', accessControlController.getQRCodeScans as any);

// ============================================================================
// ACCESS ZONE ROUTES
// ============================================================================

// Create a new access zone
router.post('/access-zones', accessControlController.createAccessZone as any);

// Get all access zones
router.get('/access-zones', accessControlController.getAccessZones as any);

// Update an access zone
router.put('/access-zones/:zoneId', accessControlController.updateAccessZone as any);

// ============================================================================
// ACCESS RULE ROUTES
// ============================================================================

// Create a new access rule
router.post('/access-rules', accessControlController.createAccessRule as any);

// Get all access rules
router.get('/access-rules', accessControlController.getAccessRules as any);

// Update an access rule
router.put('/access-rules/:ruleId', accessControlController.updateAccessRule as any);

// Delete (soft) an access rule
router.delete('/access-rules/:ruleId', accessControlController.deleteAccessRule as any);

// ============================================================================
// OCCUPANCY ROUTES
// ============================================================================

// Get current occupancy
router.get('/occupancy', accessControlController.getCurrentOccupancy as any);

// Update occupancy (for manual entry/exit tracking)
router.post('/occupancy/update', accessControlController.updateOccupancy as any);

// ============================================================================
// ACCESS LOG ROUTES
// ============================================================================

// Get access logs
router.get('/access-logs', accessControlController.getAccessLogs as any);

// ============================================================================
// VIOLATION ROUTES
// ============================================================================

// Get access violations
router.get('/violations', accessControlController.getAccessViolations as any);

// Resolve an access violation
router.put('/violations/:violationId/resolve', accessControlController.resolveAccessViolation as any);

export default router;
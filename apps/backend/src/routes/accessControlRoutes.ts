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
router.post('/qr-codes', accessControlController.generateQRCode);

// Scan a QR code
router.post('/qr-codes/scan', accessControlController.scanQRCode);

// Get user's QR codes
router.get('/users/:userId/qr-codes', accessControlController.getUserQRCodes);

// Get current user's QR codes
router.get('/my-qr-codes', accessControlController.getUserQRCodes);

// Revoke a QR code
router.delete('/qr-codes/:qrCodeId', accessControlController.revokeQRCode);

// Get QR code scan history
router.get('/qr-codes/scans', accessControlController.getQRCodeScans);

// ============================================================================
// ACCESS ZONE ROUTES
// ============================================================================

// Create a new access zone
router.post('/access-zones', accessControlController.createAccessZone);

// Get all access zones
router.get('/access-zones', accessControlController.getAccessZones);

// Update an access zone
router.put('/access-zones/:zoneId', accessControlController.updateAccessZone);

// ============================================================================
// ACCESS RULE ROUTES
// ============================================================================

// Create a new access rule
router.post('/access-rules', accessControlController.createAccessRule);

// Get all access rules
router.get('/access-rules', accessControlController.getAccessRules);

// Update an access rule
router.put('/access-rules/:ruleId', accessControlController.updateAccessRule);

// Delete (soft) an access rule
router.delete('/access-rules/:ruleId', accessControlController.deleteAccessRule);

// ============================================================================
// OCCUPANCY ROUTES
// ============================================================================

// Get current occupancy
router.get('/occupancy', accessControlController.getCurrentOccupancy);

// Update occupancy (for manual entry/exit tracking)
router.post('/occupancy/update', accessControlController.updateOccupancy);

// ============================================================================
// ACCESS LOG ROUTES
// ============================================================================

// Get access logs
router.get('/access-logs', accessControlController.getAccessLogs);

// ============================================================================
// VIOLATION ROUTES
// ============================================================================

// Get access violations
router.get('/violations', accessControlController.getAccessViolations);

// Resolve an access violation
router.put('/violations/:violationId/resolve', accessControlController.resolveAccessViolation);

export default router;
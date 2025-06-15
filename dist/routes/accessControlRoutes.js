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
const accessControlController = __importStar(require("../controllers/accessControlController"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/qr-codes', accessControlController.generateQRCode);
router.post('/qr-codes/scan', accessControlController.scanQRCode);
router.get('/users/:userId/qr-codes', accessControlController.getUserQRCodes);
router.get('/my-qr-codes', accessControlController.getUserQRCodes);
router.delete('/qr-codes/:qrCodeId', accessControlController.revokeQRCode);
router.get('/qr-codes/scans', accessControlController.getQRCodeScans);
router.post('/access-zones', accessControlController.createAccessZone);
router.get('/access-zones', accessControlController.getAccessZones);
router.put('/access-zones/:zoneId', accessControlController.updateAccessZone);
router.post('/access-rules', accessControlController.createAccessRule);
router.get('/access-rules', accessControlController.getAccessRules);
router.put('/access-rules/:ruleId', accessControlController.updateAccessRule);
router.delete('/access-rules/:ruleId', accessControlController.deleteAccessRule);
router.get('/occupancy', accessControlController.getCurrentOccupancy);
router.post('/occupancy/update', accessControlController.updateOccupancy);
router.get('/access-logs', accessControlController.getAccessLogs);
router.get('/violations', accessControlController.getAccessViolations);
router.put('/violations/:violationId/resolve', accessControlController.resolveAccessViolation);
exports.default = router;
//# sourceMappingURL=accessControlRoutes.js.map
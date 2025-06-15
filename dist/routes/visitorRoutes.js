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
const tenant_1 = require("../middleware/tenant");
const rateLimiting_1 = require("../middleware/rateLimiting");
const visitorController = __importStar(require("../controllers/visitorController"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(tenant_1.validateTenantAccess);
const strictRateLimit = (0, rateLimiting_1.rateLimitMiddleware)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
const accessCodeRateLimit = (0, rateLimiting_1.rateLimitMiddleware)({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many access code requests, please try again later.'
});
router.post('/', strictRateLimit, visitorController.createVisitor);
router.put('/:visitorId', strictRateLimit, visitorController.updateVisitor);
router.delete('/:visitorId', visitorController.deleteVisitor);
router.get('/:visitorId', visitorController.getVisitor);
router.get('/', visitorController.getVisitors);
router.get('/today/list', visitorController.getTodaysVisitors);
router.get('/active/list', visitorController.getActiveVisitors);
router.get('/qr/:qrCode', visitorController.getVisitorByQRCode);
router.get('/:visitorId/history', visitorController.getVisitorHistory);
router.post('/checkin', visitorController.checkInVisitor);
router.post('/checkout', visitorController.checkOutVisitor);
router.put('/:visitorId/extend', visitorController.extendVisitorStay);
router.post('/pre-registrations', visitorController.createPreRegistration);
router.get('/pre-registrations', visitorController.getPreRegistrations);
router.post('/pre-registrations/:preRegistrationId/approve', visitorController.processPreRegistrationApproval);
router.post('/pre-registrations/:preRegistrationId/invite', visitorController.sendInvitation);
router.post('/pre-registrations/:preRegistrationId/convert', visitorController.convertPreRegistrationToVisitor);
router.get('/pre-registrations/pending/approvals', visitorController.getPendingApprovals);
router.get('/pre-registrations/upcoming/visits', visitorController.getUpcomingVisits);
router.get('/analytics/statistics', visitorController.getVisitorStatistics);
router.get('/analytics/pre-registrations', visitorController.getPreRegistrationStatistics);
router.post('/access-codes', accessCodeRateLimit, visitorController.generateAccessCode);
router.get('/access-codes/:code/validate', visitorController.validateAccessCode);
router.post('/access-codes/:code/use', accessCodeRateLimit, visitorController.useAccessCode);
router.post('/access/verify', visitorController.verifyAccess);
router.post('/access/check-in', visitorController.processAccessCheckIn);
router.post('/access/check-out', visitorController.processAccessCheckOut);
router.get('/analytics/enhanced', visitorController.getVisitorAnalytics);
router.get('/analytics/trends', visitorController.getVisitorTrends);
router.get('/analytics/peak-analysis', visitorController.getPeakAnalysis);
router.get('/analytics/host-performance', visitorController.getHostPerformance);
router.get('/analytics/conversion-funnel', visitorController.getConversionFunnel);
router.get('/analytics/access-control', visitorController.getAccessControlMetrics);
router.get('/notifications', visitorController.getNotifications);
router.post('/notifications/:notificationId/read', visitorController.markNotificationAsRead);
router.post('/notifications/read-all', visitorController.markAllNotificationsAsRead);
router.post('/notifications/:notificationId/acknowledge', visitorController.acknowledgeNotification);
router.get('/notifications/stats', visitorController.getNotificationStats);
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Visitor API endpoint not found',
        path: req.originalUrl
    });
});
exports.default = router;
//# sourceMappingURL=visitorRoutes.js.map
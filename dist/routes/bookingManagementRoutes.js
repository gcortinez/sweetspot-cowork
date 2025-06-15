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
const bookingController = __importStar(require("../controllers/bookingManagementController"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(tenant_1.validateTenantAccess);
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/my', bookingController.getMyBookings);
router.get('/upcoming', bookingController.getUpcomingBookings);
router.get('/today', bookingController.getTodaysBookings);
router.get('/statistics', bookingController.getBookingStatistics);
router.get('/:bookingId', bookingController.getBookingById);
router.put('/:bookingId', bookingController.updateBooking);
router.delete('/:bookingId', bookingController.cancelBooking);
router.get('/approvals/pending', bookingController.getPendingApprovals);
router.post('/:bookingId/approve', bookingController.processBookingApproval);
router.post('/:bookingId/checkin', bookingController.checkInToRoom);
router.post('/:bookingId/quick-checkin', bookingController.quickCheckIn);
router.post('/checkin/qr/:qrCode', bookingController.qrCheckIn);
router.post('/checkins/:checkInId/checkout', bookingController.checkOutFromRoom);
exports.default = router;
//# sourceMappingURL=bookingManagementRoutes.js.map
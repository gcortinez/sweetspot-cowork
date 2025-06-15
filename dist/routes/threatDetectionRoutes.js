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
const threatDetectionController = __importStar(require("../controllers/threatDetectionController"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(tenant_1.validateTenantAccess);
router.post('/analyze-behavior', threatDetectionController.analyzeBehavior);
router.get('/behavior-profile/:userId', threatDetectionController.getUserBehaviorProfile);
router.get('/patterns', threatDetectionController.detectSecurityPatterns);
router.get('/predictions', threatDetectionController.predictThreats);
router.get('/analyze', threatDetectionController.analyzeSecurityEvents);
router.get('/alerts', threatDetectionController.getSecurityAlerts);
router.patch('/alerts/:alertId/resolve', threatDetectionController.resolveSecurityAlert);
router.get('/config', threatDetectionController.getThreatDetectionConfig);
router.put('/config', threatDetectionController.updateThreatDetectionConfig);
router.get('/statistics', threatDetectionController.getThreatStatistics);
exports.default = router;
//# sourceMappingURL=threatDetectionRoutes.js.map
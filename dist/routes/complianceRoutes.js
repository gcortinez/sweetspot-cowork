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
const complianceController = __importStar(require("../controllers/complianceController"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(tenant_1.validateTenantAccess);
router.get('/dashboard', complianceController.getComplianceDashboard);
router.get('/alerts', complianceController.getComplianceAlerts);
router.post('/sox/report', complianceController.generateSOXReport);
router.post('/sox/download', complianceController.downloadSOXReport);
router.post('/gdpr/report', complianceController.generateGDPRReport);
router.post('/gdpr/download', complianceController.downloadGDPRReport);
router.post('/gdpr/data-subject/:dataSubjectId', complianceController.generateDataSubjectReport);
router.post('/hipaa/report', complianceController.generateHIPAAReport);
router.post('/hipaa/download', complianceController.downloadHIPAAReport);
router.post('/hipaa/patient/:patientId', complianceController.generatePatientAccessLog);
router.post('/pci-dss/report', complianceController.generatePCIDSSReport);
router.post('/pci-dss/download', complianceController.downloadPCIDSSReport);
exports.default = router;
//# sourceMappingURL=complianceRoutes.js.map
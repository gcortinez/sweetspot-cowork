"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractAnalyticsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const contractAnalyticsController_1 = require("../controllers/contractAnalyticsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.contractAnalyticsRoutes = router;
router.use(auth_1.authenticate);
router.get('/overview', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractAnalyticsController_1.contractAnalyticsController.getContractOverview.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/revenue', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractAnalyticsController_1.contractAnalyticsController.getRevenueAnalysis.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/clients', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractAnalyticsController_1.contractAnalyticsController.getClientAnalysis.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/renewals', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractAnalyticsController_1.contractAnalyticsController.getRenewalPerformance.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/lifecycle', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractAnalyticsController_1.contractAnalyticsController.getContractLifecycleMetrics.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/expiry-forecast', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractAnalyticsController_1.contractAnalyticsController.getExpiryForecast.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/dashboard', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractAnalyticsController_1.contractAnalyticsController.getDashboardMetrics.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/kpis', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractAnalyticsController_1.contractAnalyticsController.getKPIs.bind(contractAnalyticsController_1.contractAnalyticsController));
router.post('/reports', (0, auth_1.authorize)(['ADMIN', 'MANAGER']), contractAnalyticsController_1.contractAnalyticsController.generateReport.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/reports', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractAnalyticsController_1.contractAnalyticsController.getReportHistory.bind(contractAnalyticsController_1.contractAnalyticsController));
router.get('/reports/:reportId/download', (0, auth_1.authorize)(['ADMIN', 'MANAGER', 'EMPLOYEE']), contractAnalyticsController_1.contractAnalyticsController.downloadReport.bind(contractAnalyticsController_1.contractAnalyticsController));
//# sourceMappingURL=contractAnalyticsRoutes.js.map
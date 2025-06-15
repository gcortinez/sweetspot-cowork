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
const financialController = __importStar(require("../controllers/financialController"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(tenant_1.validateTenantAccess);
router.get('/overview', financialController.getFinancialOverview);
router.get('/metrics', financialController.getFinancialMetrics);
router.post('/reports', financialController.createFinancialReport);
router.get('/reports', financialController.getFinancialReports);
router.get('/reports/:reportId', financialController.getFinancialReport);
router.delete('/reports/:reportId', financialController.deleteFinancialReport);
router.post('/forecasts', financialController.createRevenueForecast);
router.get('/forecasts', financialController.getRevenueForecasts);
router.put('/forecasts/:forecastId/accuracy', financialController.updateForecastAccuracy);
router.post('/analysis/profit', financialController.createProfitAnalysis);
router.post('/reconciliation', financialController.createPaymentReconciliation);
router.get('/reconciliation', financialController.getPaymentReconciliations);
router.get('/reconciliation/:reconciliationId', financialController.getPaymentReconciliation);
router.post('/reconciliation/items/:reconciliationItemId/match', financialController.manualMatchTransaction);
router.delete('/reconciliation/items/:reconciliationItemId/match', financialController.unmatchTransaction);
router.post('/reconciliation/:reconciliationId/adjustments', financialController.addReconciliationAdjustment);
router.post('/reconciliation/:reconciliationId/approve', financialController.approveReconciliation);
router.post('/reconciliation/:reconciliationId/reject', financialController.rejectReconciliation);
router.get('/reconciliation/:reconciliationId/report', financialController.getReconciliationReport);
router.post('/dashboards', financialController.createFinancialDashboard);
router.get('/dashboards', financialController.getFinancialDashboards);
router.get('/dashboards/:dashboardId', financialController.getFinancialDashboard);
router.post('/dashboards/:dashboardId/refresh', financialController.refreshFinancialDashboard);
exports.default = router;
//# sourceMappingURL=financialRoutes.js.map
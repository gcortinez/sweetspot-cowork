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
const billingController = __importStar(require("../controllers/billingController"));
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(tenant_1.validateTenantAccess);
router.post('/cycles', billingController.createBillingCycle);
router.get('/cycles', billingController.getBillingCycles);
router.post('/subscriptions', billingController.createSubscription);
router.get('/subscriptions', billingController.getSubscriptions);
router.put('/subscriptions/:subscriptionId', billingController.updateSubscription);
router.post('/subscriptions/:subscriptionId/cancel', billingController.cancelSubscription);
router.post('/subscriptions/:subscriptionId/invoice', billingController.generateInvoice);
router.post('/usage', billingController.trackConsumption);
router.get('/usage', billingController.getUsageRecords);
router.get('/usage/clients/:clientId/summary', billingController.getConsumptionSummary);
router.get('/usage/clients/:clientId/report', billingController.getUsageReport);
router.post('/invoices/recurring/generate', billingController.generateRecurringInvoices);
router.post('/payment-methods', billingController.createPaymentMethod);
router.get('/payment-methods/clients/:clientId', billingController.getPaymentMethods);
router.put('/payment-methods/:paymentMethodId', billingController.updatePaymentMethod);
router.delete('/payment-methods/:paymentMethodId', billingController.deletePaymentMethod);
router.post('/payments/intents', billingController.createPaymentIntent);
router.post('/payments/clients/:clientId/process', billingController.processPayment);
router.post('/payments/:paymentId/refund', billingController.refundPayment);
router.get('/settings', billingController.getBillingSettings);
router.put('/settings', billingController.updateBillingSettings);
router.post('/automation/run-all', billingController.runAutomationWorkflows);
router.post('/automation/invoice-generation', billingController.runInvoiceGenerationWorkflow);
router.post('/automation/payment-collection', billingController.runPaymentCollectionWorkflow);
router.get('/reports/billing', billingController.getBillingReport);
router.get('/reports/payments', billingController.getPaymentAnalytics);
router.get('/reports/reconciliation', billingController.reconcilePayments);
exports.default = router;
//# sourceMappingURL=billing.js.map
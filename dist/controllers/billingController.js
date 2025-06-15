"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcilePayments = exports.getPaymentAnalytics = exports.getBillingReport = exports.runPaymentCollectionWorkflow = exports.runInvoiceGenerationWorkflow = exports.runAutomationWorkflows = exports.updateBillingSettings = exports.getBillingSettings = exports.createPaymentIntent = exports.refundPayment = exports.processPayment = exports.deletePaymentMethod = exports.updatePaymentMethod = exports.getPaymentMethods = exports.createPaymentMethod = exports.generateRecurringInvoices = exports.generateInvoice = exports.getUsageReport = exports.getConsumptionSummary = exports.getUsageRecords = exports.trackConsumption = exports.cancelSubscription = exports.updateSubscription = exports.getSubscriptions = exports.createSubscription = exports.getBillingCycles = exports.createBillingCycle = void 0;
const zod_1 = require("zod");
const billingService_1 = require("../services/billingService");
const paymentService_1 = require("../services/paymentService");
const consumptionTrackingService_1 = require("../services/consumptionTrackingService");
const billingAutomationService_1 = require("../services/billingAutomationService");
const client_1 = require("@prisma/client");
const billingService = new billingService_1.BillingService();
const createBillingCycleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    cycle: zod_1.z.nativeEnum(client_1.BillingCycle),
    dayOfMonth: zod_1.z.number().min(1).max(31).optional(),
    dayOfWeek: zod_1.z.number().min(0).max(6).optional(),
    cutoffDays: zod_1.z.number().min(0).default(0),
    gracePeriodDays: zod_1.z.number().min(0).default(0),
    autoGenerate: zod_1.z.boolean().default(true),
});
const createSubscriptionSchema = zod_1.z.object({
    clientId: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid(),
    billingCycleId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    autoRenew: zod_1.z.boolean().default(true),
    proration: zod_1.z.boolean().default(false),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const trackConsumptionSchema = zod_1.z.object({
    clientId: zod_1.z.string().uuid(),
    subscriptionId: zod_1.z.string().uuid().optional(),
    resourceType: zod_1.z.nativeEnum(client_1.UsageResourceType),
    resourceId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().positive(),
    unit: zod_1.z.string().min(1),
    unitPrice: zod_1.z.number().min(0).optional(),
    usageDate: zod_1.z.string().transform((val) => new Date(val)).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const createPaymentMethodSchema = zod_1.z.object({
    clientId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH', 'OTHER']),
    provider: zod_1.z.nativeEnum(client_1.PaymentProvider),
    providerData: zod_1.z.record(zod_1.z.any()),
    last4: zod_1.z.string().optional(),
    brand: zod_1.z.string().optional(),
    expiryMonth: zod_1.z.number().min(1).max(12).optional(),
    expiryYear: zod_1.z.number().min(2024).optional(),
    isDefault: zod_1.z.boolean().default(false),
});
const updateBillingSettingsSchema = zod_1.z.object({
    currency: zod_1.z.string().length(3).optional(),
    timezone: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(1).optional(),
    taxIncluded: zod_1.z.boolean().optional(),
    invoicePrefix: zod_1.z.string().optional(),
    paymentTermsDays: zod_1.z.number().min(0).optional(),
    latePaymentFee: zod_1.z.number().min(0).optional(),
    latePaymentFeeType: zod_1.z.enum(['FIXED', 'PERCENTAGE']).optional(),
    autoGenerateInvoices: zod_1.z.boolean().optional(),
    autoSendInvoices: zod_1.z.boolean().optional(),
    autoCollectPayments: zod_1.z.boolean().optional(),
    retryFailedPayments: zod_1.z.boolean().optional(),
    maxRetryAttempts: zod_1.z.number().min(1).max(10).optional(),
    retryIntervalDays: zod_1.z.number().min(1).optional(),
    gracePeriodDays: zod_1.z.number().min(0).optional(),
    dunningEnabled: zod_1.z.boolean().optional(),
});
const createBillingCycle = async (req, res) => {
    try {
        const data = createBillingCycleSchema.parse(req.body);
        const billingCycle = await billingService.createBillingCycle(req.tenantId, data);
        res.status(201).json({
            success: true,
            data: billingCycle,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createBillingCycle = createBillingCycle;
const getBillingCycles = async (req, res) => {
    try {
        const billingCycles = await billingService.getBillingCycles(req.tenantId);
        res.json({
            success: true,
            data: billingCycles,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getBillingCycles = getBillingCycles;
const createSubscription = async (req, res) => {
    try {
        const data = createSubscriptionSchema.parse(req.body);
        const subscription = await billingService.createSubscription(req.tenantId, data);
        res.status(201).json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createSubscription = createSubscription;
const getSubscriptions = async (req, res) => {
    try {
        const filters = {
            clientId: req.query.clientId,
            status: req.query.status,
            billingStatus: req.query.billingStatus,
        };
        Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
        const subscriptions = await billingService.getSubscriptions(req.tenantId, filters);
        res.json({
            success: true,
            data: subscriptions,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getSubscriptions = getSubscriptions;
const updateSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const data = req.body;
        const subscription = await billingService.updateSubscription(req.tenantId, subscriptionId, data);
        res.json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updateSubscription = updateSubscription;
const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { endDate } = req.body;
        const subscription = await billingService.cancelSubscription(req.tenantId, subscriptionId, endDate ? new Date(endDate) : undefined);
        res.json({
            success: true,
            data: subscription,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.cancelSubscription = cancelSubscription;
const trackConsumption = async (req, res) => {
    try {
        const data = trackConsumptionSchema.parse(req.body);
        const usageRecord = await consumptionTrackingService_1.consumptionTrackingService.trackConsumption(req.tenantId, data);
        res.status(201).json({
            success: true,
            data: usageRecord,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.trackConsumption = trackConsumption;
const getUsageRecords = async (req, res) => {
    try {
        const filters = {
            clientId: req.query.clientId,
            subscriptionId: req.query.subscriptionId,
            resourceType: req.query.resourceType,
            billingPeriod: req.query.billingPeriod,
            invoiced: req.query.invoiced === 'true',
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        };
        Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);
        const usageRecords = await billingService.getUsageRecords(req.tenantId, filters);
        res.json({
            success: true,
            data: usageRecords,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getUsageRecords = getUsageRecords;
const getConsumptionSummary = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required',
            });
        }
        const summary = await consumptionTrackingService_1.consumptionTrackingService.getConsumptionSummary(req.tenantId, clientId, new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getConsumptionSummary = getConsumptionSummary;
const getUsageReport = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { period } = req.query;
        if (!period) {
            return res.status(400).json({
                success: false,
                error: 'Period is required (format: YYYY-MM)',
            });
        }
        const report = await consumptionTrackingService_1.consumptionTrackingService.getUsageReport(req.tenantId, clientId, period);
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getUsageReport = getUsageReport;
const generateInvoice = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const options = req.body;
        const invoice = await billingService.generateInvoiceForSubscription(req.tenantId, subscriptionId, options);
        res.status(201).json({
            success: true,
            data: invoice,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateInvoice = generateInvoice;
const generateRecurringInvoices = async (req, res) => {
    try {
        const results = await billingService.generateRecurringInvoices(req.tenantId);
        res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateRecurringInvoices = generateRecurringInvoices;
const createPaymentMethod = async (req, res) => {
    try {
        const data = createPaymentMethodSchema.parse(req.body);
        const paymentMethod = await paymentService_1.paymentService.createPaymentMethod(req.tenantId, data);
        res.status(201).json({
            success: true,
            data: paymentMethod,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createPaymentMethod = createPaymentMethod;
const getPaymentMethods = async (req, res) => {
    try {
        const { clientId } = req.params;
        const paymentMethods = await paymentService_1.paymentService.getPaymentMethods(req.tenantId, clientId);
        res.json({
            success: true,
            data: paymentMethods,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getPaymentMethods = getPaymentMethods;
const updatePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        const data = req.body;
        const paymentMethod = await paymentService_1.paymentService.updatePaymentMethod(req.tenantId, paymentMethodId, data);
        res.json({
            success: true,
            data: paymentMethod,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        await paymentService_1.paymentService.deletePaymentMethod(req.tenantId, paymentMethodId);
        res.json({
            success: true,
            message: 'Payment method deleted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
const processPayment = async (req, res) => {
    try {
        const { clientId } = req.params;
        const data = req.body;
        const payment = await paymentService_1.paymentService.processPayment(req.tenantId, clientId, data);
        res.json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.processPayment = processPayment;
const refundPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { amount, reason, metadata } = req.body;
        const result = await paymentService_1.paymentService.refundPayment(req.tenantId, paymentId, {
            amount,
            reason,
            metadata,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.refundPayment = refundPayment;
const createPaymentIntent = async (req, res) => {
    try {
        const data = req.body;
        const intent = await paymentService_1.paymentService.createPaymentIntent(req.tenantId, data);
        res.status(201).json({
            success: true,
            data: intent,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createPaymentIntent = createPaymentIntent;
const getBillingSettings = async (req, res) => {
    try {
        const settings = await billingService.getBillingSettings(req.tenantId);
        res.json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getBillingSettings = getBillingSettings;
const updateBillingSettings = async (req, res) => {
    try {
        const data = updateBillingSettingsSchema.parse(req.body);
        const settings = await billingService.updateBillingSettings(req.tenantId, data);
        res.json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updateBillingSettings = updateBillingSettings;
const runAutomationWorkflows = async (req, res) => {
    try {
        const results = await billingAutomationService_1.billingAutomationService.runAllAutomationWorkflows(req.tenantId);
        res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.runAutomationWorkflows = runAutomationWorkflows;
const runInvoiceGenerationWorkflow = async (req, res) => {
    try {
        const result = await billingAutomationService_1.billingAutomationService.runInvoiceGenerationWorkflow(req.tenantId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.runInvoiceGenerationWorkflow = runInvoiceGenerationWorkflow;
const runPaymentCollectionWorkflow = async (req, res) => {
    try {
        const result = await billingAutomationService_1.billingAutomationService.runPaymentCollectionWorkflow(req.tenantId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.runPaymentCollectionWorkflow = runPaymentCollectionWorkflow;
const getBillingReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required',
            });
        }
        const report = await billingService.getBillingReport(req.tenantId, new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getBillingReport = getBillingReport;
const getPaymentAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required',
            });
        }
        const analytics = await paymentService_1.paymentService.getPaymentAnalytics(req.tenantId, new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getPaymentAnalytics = getPaymentAnalytics;
const reconcilePayments = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required',
            });
        }
        const reconciliation = await paymentService_1.paymentService.reconcilePayments(req.tenantId, new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: reconciliation,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.reconcilePayments = reconcilePayments;
//# sourceMappingURL=billingController.js.map
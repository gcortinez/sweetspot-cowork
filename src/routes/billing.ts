import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import * as billingController from '../controllers/billingController';

const router = Router();

// Apply authentication and tenant validation to all routes
router.use(requireAuth);
router.use(validateTenantAccess);

// ============================================================================
// BILLING CYCLE MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/billing/cycles
 * @desc    Create a new billing cycle configuration
 * @access  Private (Cowork Admin)
 */
router.post('/cycles', billingController.createBillingCycle);

/**
 * @route   GET /api/billing/cycles
 * @desc    Get all billing cycle configurations
 * @access  Private (Cowork Admin)
 */
router.get('/cycles', billingController.getBillingCycles);

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/billing/subscriptions
 * @desc    Create a new subscription
 * @access  Private (Cowork Admin, Client Admin)
 */
router.post('/subscriptions', billingController.createSubscription);

/**
 * @route   GET /api/billing/subscriptions
 * @desc    Get subscriptions with optional filters
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/subscriptions', billingController.getSubscriptions);

/**
 * @route   PUT /api/billing/subscriptions/:subscriptionId
 * @desc    Update a subscription
 * @access  Private (Cowork Admin, Client Admin)
 */
router.put('/subscriptions/:subscriptionId', billingController.updateSubscription);

/**
 * @route   POST /api/billing/subscriptions/:subscriptionId/cancel
 * @desc    Cancel a subscription
 * @access  Private (Cowork Admin, Client Admin)
 */
router.post('/subscriptions/:subscriptionId/cancel', billingController.cancelSubscription);

/**
 * @route   POST /api/billing/subscriptions/:subscriptionId/invoice
 * @desc    Generate invoice for a subscription
 * @access  Private (Cowork Admin)
 */
router.post('/subscriptions/:subscriptionId/invoice', billingController.generateInvoice);

// ============================================================================
// CONSUMPTION TRACKING
// ============================================================================

/**
 * @route   POST /api/billing/usage
 * @desc    Track resource consumption/usage
 * @access  Private (System, Cowork Admin)
 */
router.post('/usage', billingController.trackConsumption);

/**
 * @route   GET /api/billing/usage
 * @desc    Get usage records with filters
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/usage', billingController.getUsageRecords);

/**
 * @route   GET /api/billing/usage/clients/:clientId/summary
 * @desc    Get consumption summary for a client
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/usage/clients/:clientId/summary', billingController.getConsumptionSummary);

/**
 * @route   GET /api/billing/usage/clients/:clientId/report
 * @desc    Get usage report for a client
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/usage/clients/:clientId/report', billingController.getUsageReport);

// ============================================================================
// INVOICE MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/billing/invoices/recurring/generate
 * @desc    Generate all due recurring invoices
 * @access  Private (Cowork Admin, System)
 */
router.post('/invoices/recurring/generate', billingController.generateRecurringInvoices);

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * @route   POST /api/billing/payment-methods
 * @desc    Create a new payment method
 * @access  Private (Client Admin, End User)
 */
router.post('/payment-methods', billingController.createPaymentMethod);

/**
 * @route   GET /api/billing/payment-methods/clients/:clientId
 * @desc    Get payment methods for a client
 * @access  Private (Cowork Admin, Client Admin)
 */
router.get('/payment-methods/clients/:clientId', billingController.getPaymentMethods);

/**
 * @route   PUT /api/billing/payment-methods/:paymentMethodId
 * @desc    Update a payment method
 * @access  Private (Client Admin, End User)
 */
router.put('/payment-methods/:paymentMethodId', billingController.updatePaymentMethod);

/**
 * @route   DELETE /api/billing/payment-methods/:paymentMethodId
 * @desc    Delete a payment method
 * @access  Private (Client Admin, End User)
 */
router.delete('/payment-methods/:paymentMethodId', billingController.deletePaymentMethod);

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

/**
 * @route   POST /api/billing/payments/intents
 * @desc    Create a payment intent for client-side processing
 * @access  Private (Client Admin, End User)
 */
router.post('/payments/intents', billingController.createPaymentIntent);

/**
 * @route   POST /api/billing/payments/clients/:clientId/process
 * @desc    Process a payment for a client
 * @access  Private (Cowork Admin, Client Admin)
 */
router.post('/payments/clients/:clientId/process', billingController.processPayment);

/**
 * @route   POST /api/billing/payments/:paymentId/refund
 * @desc    Refund a payment
 * @access  Private (Cowork Admin)
 */
router.post('/payments/:paymentId/refund', billingController.refundPayment);

// ============================================================================
// BILLING SETTINGS
// ============================================================================

/**
 * @route   GET /api/billing/settings
 * @desc    Get billing settings for the tenant
 * @access  Private (Cowork Admin)
 */
router.get('/settings', billingController.getBillingSettings);

/**
 * @route   PUT /api/billing/settings
 * @desc    Update billing settings
 * @access  Private (Cowork Admin)
 */
router.put('/settings', billingController.updateBillingSettings);

// ============================================================================
// BILLING AUTOMATION
// ============================================================================

/**
 * @route   POST /api/billing/automation/run-all
 * @desc    Run all billing automation workflows
 * @access  Private (Cowork Admin, System)
 */
router.post('/automation/run-all', billingController.runAutomationWorkflows);

/**
 * @route   POST /api/billing/automation/invoice-generation
 * @desc    Run invoice generation workflow
 * @access  Private (Cowork Admin, System)
 */
router.post('/automation/invoice-generation', billingController.runInvoiceGenerationWorkflow);

/**
 * @route   POST /api/billing/automation/payment-collection
 * @desc    Run payment collection workflow
 * @access  Private (Cowork Admin, System)
 */
router.post('/automation/payment-collection', billingController.runPaymentCollectionWorkflow);

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

/**
 * @route   GET /api/billing/reports/billing
 * @desc    Get comprehensive billing report
 * @access  Private (Cowork Admin)
 */
router.get('/reports/billing', billingController.getBillingReport);

/**
 * @route   GET /api/billing/reports/payments
 * @desc    Get payment analytics report
 * @access  Private (Cowork Admin)
 */
router.get('/reports/payments', billingController.getPaymentAnalytics);

/**
 * @route   GET /api/billing/reports/reconciliation
 * @desc    Get payment reconciliation report
 * @access  Private (Cowork Admin)
 */
router.get('/reports/reconciliation', billingController.reconcilePayments);

export default router;
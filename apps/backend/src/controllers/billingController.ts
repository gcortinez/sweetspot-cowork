import { Request, Response } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billingService';
import { paymentService } from '../services/paymentService';
import { consumptionTrackingService } from '../services/consumptionTrackingService';
import { billingAutomationService } from '../services/billingAutomationService';
import { AuthenticatedRequest } from '../types/api';
import { 
  BillingCycle, 
  SubscriptionStatus, 
  BillingStatus, 
  UsageResourceType,
  PaymentProvider 
} from '@prisma/client';

const billingService = new BillingService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createBillingCycleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cycle: z.nativeEnum(BillingCycle),
  dayOfMonth: z.number().min(1).max(31).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  cutoffDays: z.number().min(0).default(0),
  gracePeriodDays: z.number().min(0).default(0),
  autoGenerate: z.boolean().default(true),
});

const createSubscriptionSchema = z.object({
  clientId: z.string().uuid(),
  planId: z.string().uuid(),
  billingCycleId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  autoRenew: z.boolean().default(true),
  proration: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

const trackConsumptionSchema = z.object({
  clientId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  resourceType: z.nativeEnum(UsageResourceType),
  resourceId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitPrice: z.number().min(0).optional(),
  usageDate: z.string().transform((val) => new Date(val)).optional(),
  metadata: z.record(z.any()).optional(),
});

const createPaymentMethodSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH', 'OTHER']),
  provider: z.nativeEnum(PaymentProvider),
  providerData: z.record(z.any()),
  last4: z.string().optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(2024).optional(),
  isDefault: z.boolean().default(false),
});

const updateBillingSettingsSchema = z.object({
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  taxIncluded: z.boolean().optional(),
  invoicePrefix: z.string().optional(),
  paymentTermsDays: z.number().min(0).optional(),
  latePaymentFee: z.number().min(0).optional(),
  latePaymentFeeType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  autoGenerateInvoices: z.boolean().optional(),
  autoSendInvoices: z.boolean().optional(),
  autoCollectPayments: z.boolean().optional(),
  retryFailedPayments: z.boolean().optional(),
  maxRetryAttempts: z.number().min(1).max(10).optional(),
  retryIntervalDays: z.number().min(1).optional(),
  gracePeriodDays: z.number().min(0).optional(),
  dunningEnabled: z.boolean().optional(),
});

// ============================================================================
// BILLING CYCLE MANAGEMENT
// ============================================================================

export const createBillingCycle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createBillingCycleSchema.parse(req.body);
    const billingCycle = await billingService.createBillingCycle(req.tenantId!, data);
    
    res.status(201).json({
      success: true,
      data: billingCycle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getBillingCycles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const billingCycles = await billingService.getBillingCycles(req.tenantId!);
    
    res.json({
      success: true,
      data: billingCycles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export const createSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createSubscriptionSchema.parse(req.body);
    const subscription = await billingService.createSubscription(req.tenantId!, data);
    
    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      clientId: req.query.clientId as string,
      status: req.query.status as SubscriptionStatus,
      billingStatus: req.query.billingStatus as BillingStatus,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      (filters as any)[key] === undefined && delete (filters as any)[key]
    );

    const subscriptions = await billingService.getSubscriptions(req.tenantId!, filters);
    
    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const data = req.body;
    
    const subscription = await billingService.updateSubscription(req.tenantId!, subscriptionId, data);
    
    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { endDate } = req.body;
    
    const subscription = await billingService.cancelSubscription(
      req.tenantId!, 
      subscriptionId, 
      endDate ? new Date(endDate) : undefined
    );
    
    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// CONSUMPTION TRACKING
// ============================================================================

export const trackConsumption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = trackConsumptionSchema.parse(req.body);
    const usageRecord = await consumptionTrackingService.trackConsumption(req.tenantId!, data);
    
    res.status(201).json({
      success: true,
      data: usageRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getUsageRecords = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      clientId: req.query.clientId as string,
      subscriptionId: req.query.subscriptionId as string,
      resourceType: req.query.resourceType as UsageResourceType,
      billingPeriod: req.query.billingPeriod as string,
      invoiced: req.query.invoiced === 'true',
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      (filters as any)[key] === undefined && delete (filters as any)[key]
    );

    const usageRecords = await billingService.getUsageRecords(req.tenantId!, filters);
    
    res.json({
      success: true,
      data: usageRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getConsumptionSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const summary = await consumptionTrackingService.getConsumptionSummary(
      req.tenantId!,
      clientId,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getUsageReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { period } = req.query;
    
    if (!period) {
      return res.status(400).json({
        success: false,
        error: 'Period is required (format: YYYY-MM)',
      });
    }

    const report = await consumptionTrackingService.getUsageReport(
      req.tenantId!,
      clientId,
      period as string
    );
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// INVOICE GENERATION
// ============================================================================

export const generateInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const options = req.body;
    
    const invoice = await billingService.generateInvoiceForSubscription(
      req.tenantId!,
      subscriptionId,
      options
    );
    
    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const generateRecurringInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const results = await billingService.generateRecurringInvoices(req.tenantId!);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export const createPaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createPaymentMethodSchema.parse(req.body);
    const paymentMethod = await paymentService.createPaymentMethod(req.tenantId!, data);
    
    res.status(201).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const paymentMethods = await paymentService.getPaymentMethods(req.tenantId!, clientId);
    
    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updatePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentMethodId } = req.params;
    const data = req.body;
    
    const paymentMethod = await paymentService.updatePaymentMethod(req.tenantId!, paymentMethodId, data);
    
    res.json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deletePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentMethodId } = req.params;
    await paymentService.deletePaymentMethod(req.tenantId!, paymentMethodId);
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

export const processPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const data = req.body;
    
    const payment = await paymentService.processPayment(req.tenantId!, clientId, data);
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const refundPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason, metadata } = req.body;
    
    const result = await paymentService.refundPayment(req.tenantId!, paymentId, {
      amount,
      reason,
      metadata,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const intent = await paymentService.createPaymentIntent(req.tenantId!, data);
    
    res.status(201).json({
      success: true,
      data: intent,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// BILLING SETTINGS
// ============================================================================

export const getBillingSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await billingService.getBillingSettings(req.tenantId!);
    
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateBillingSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateBillingSettingsSchema.parse(req.body);
    const settings = await billingService.updateBillingSettings(req.tenantId!, data);
    
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// BILLING AUTOMATION
// ============================================================================

export const runAutomationWorkflows = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const results = await billingAutomationService.runAllAutomationWorkflows(req.tenantId!);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const runInvoiceGenerationWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await billingAutomationService.runInvoiceGenerationWorkflow(req.tenantId!);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const runPaymentCollectionWorkflow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await billingAutomationService.runPaymentCollectionWorkflow(req.tenantId!);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

export const getBillingReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const report = await billingService.getBillingReport(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getPaymentAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const analytics = await paymentService.getPaymentAnalytics(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const reconcilePayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const reconciliation = await paymentService.reconcilePayments(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json({
      success: true,
      data: reconciliation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
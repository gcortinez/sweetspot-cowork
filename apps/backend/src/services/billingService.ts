import { prisma } from '../lib/prisma';
import { 
  BillingCycle, 
  SubscriptionStatus, 
  BillingStatus, 
  UsageResourceType,
  RecurringInvoiceStatus,
  PaymentProvider,
  FeeType 
} from '@prisma/client';

export interface CreateSubscriptionData {
  clientId: string;
  planId: string;
  billingCycleId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  autoRenew?: boolean;
  proration?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateUsageRecordData {
  clientId: string;
  subscriptionId?: string;
  resourceType: UsageResourceType;
  resourceId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  usageDate: Date;
  metadata?: Record<string, any>;
}

export interface BillingCycleData {
  name: string;
  description?: string;
  cycle: BillingCycle;
  dayOfMonth?: number;
  dayOfWeek?: number;
  cutoffDays?: number;
  gracePeriodDays?: number;
  autoGenerate?: boolean;
}

export interface InvoiceGenerationOptions {
  includeUsage?: boolean;
  billingPeriod?: string;
  dueDate?: Date;
  autoSend?: boolean;
  template?: string;
}

export interface BillingReport {
  totalRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  overdueInvoices: number;
  unpaidAmount: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
}

export class BillingService {
  
  // ============================================================================
  // BILLING CYCLE MANAGEMENT
  // ============================================================================
  
  async createBillingCycle(tenantId: string, data: BillingCycleData) {
    return await prisma.billingCycleConfig.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        cycle: data.cycle,
        dayOfMonth: data.dayOfMonth,
        dayOfWeek: data.dayOfWeek,
        cutoffDays: data.cutoffDays || 0,
        gracePeriodDays: data.gracePeriodDays || 0,
        autoGenerate: data.autoGenerate ?? true,
      },
    });
  }

  async getBillingCycles(tenantId: string) {
    return await prisma.billingCycleConfig.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBillingCycle(tenantId: string, cycleId: string, data: Partial<BillingCycleData>) {
    return await prisma.billingCycleConfig.updateMany({
      where: { id: cycleId, tenantId },
      data,
    });
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================
  
  async createSubscription(tenantId: string, data: CreateSubscriptionData) {
    const billingCycle = await prisma.billingCycleConfig.findFirst({
      where: { id: data.billingCycleId, tenantId },
    });

    if (!billingCycle) {
      throw new Error('Billing cycle not found');
    }

    const nextBillingDate = this.calculateNextBillingDate(data.startDate, billingCycle);

    return await prisma.subscription.create({
      data: {
        tenantId,
        clientId: data.clientId,
        planId: data.planId,
        billingCycleId: data.billingCycleId,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        currentPeriodStart: data.startDate,
        currentPeriodEnd: nextBillingDate,
        nextBillingDate,
        autoRenew: data.autoRenew ?? true,
        proration: data.proration ?? false,
        metadata: data.metadata || {},
      },
      include: {
        client: true,
        plan: true,
        billingCycle: true,
      },
    });
  }

  async getSubscriptions(tenantId: string, filters?: {
    clientId?: string;
    status?: SubscriptionStatus;
    billingStatus?: BillingStatus;
  }) {
    return await prisma.subscription.findMany({
      where: {
        tenantId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.billingStatus && { billingStatus: filters.billingStatus }),
      },
      include: {
        client: true,
        plan: true,
        billingCycle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSubscription(tenantId: string, subscriptionId: string, data: {
    status?: SubscriptionStatus;
    billingStatus?: BillingStatus;
    endDate?: Date;
    autoRenew?: boolean;
    metadata?: Record<string, any>;
  }) {
    return await prisma.subscription.updateMany({
      where: { id: subscriptionId, tenantId },
      data,
    });
  }

  async cancelSubscription(tenantId: string, subscriptionId: string, endDate?: Date) {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        endDate: endDate || new Date(),
        autoRenew: false,
      },
    });
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================
  
  async recordUsage(tenantId: string, data: CreateUsageRecordData) {
    const totalCost = data.quantity * data.unitPrice;
    const billingPeriod = this.getBillingPeriod(data.usageDate);

    return await prisma.usageRecord.create({
      data: {
        tenantId,
        clientId: data.clientId,
        subscriptionId: data.subscriptionId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalCost,
        usageDate: data.usageDate,
        billingPeriod,
        metadata: data.metadata || {},
      },
    });
  }

  async getUsageRecords(tenantId: string, filters?: {
    clientId?: string;
    subscriptionId?: string;
    resourceType?: UsageResourceType;
    billingPeriod?: string;
    invoiced?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.usageRecord.findMany({
      where: {
        tenantId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.subscriptionId && { subscriptionId: filters.subscriptionId }),
        ...(filters?.resourceType && { resourceType: filters.resourceType }),
        ...(filters?.billingPeriod && { billingPeriod: filters.billingPeriod }),
        ...(filters?.invoiced !== undefined && { invoiced: filters.invoiced }),
        ...(filters?.startDate || filters?.endDate) && {
          usageDate: {
            ...(filters?.startDate && { gte: filters.startDate }),
            ...(filters?.endDate && { lte: filters.endDate }),
          },
        },
      },
      include: {
        client: true,
        subscription: true,
      },
      orderBy: { usageDate: 'desc' },
    });
  }

  async getUsageSummary(tenantId: string, clientId: string, billingPeriod: string) {
    const usageRecords = await this.getUsageRecords(tenantId, {
      clientId,
      billingPeriod,
      invoiced: false,
    });

    const summary = usageRecords.reduce((acc, record) => {
      const key = `${record.resourceType}_${record.resourceId}`;
      if (!acc[key]) {
        acc[key] = {
          resourceType: record.resourceType,
          resourceId: record.resourceId,
          unit: record.unit,
          totalQuantity: 0,
          totalCost: 0,
          records: [],
        };
      }
      acc[key].totalQuantity += parseFloat(record.quantity.toString());
      acc[key].totalCost += parseFloat(record.totalCost.toString());
      acc[key].records.push(record);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(summary);
  }

  // ============================================================================
  // INVOICE GENERATION
  // ============================================================================
  
  async generateInvoiceForSubscription(
    tenantId: string, 
    subscriptionId: string, 
    options: InvoiceGenerationOptions = {}
  ) {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: {
        client: true,
        plan: true,
        billingCycle: true,
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const billingSettings = await this.getBillingSettings(tenantId);
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    
    // Get usage records for the billing period
    const billingPeriod = options.billingPeriod || this.getBillingPeriod(new Date());
    let usageRecords: any[] = [];
    
    if (options.includeUsage) {
      usageRecords = await this.getUsageRecords(tenantId, {
        clientId: subscription.clientId,
        subscriptionId: subscription.id,
        billingPeriod,
        invoiced: false,
      });
    }

    // Calculate invoice totals
    const planCost = parseFloat(subscription.plan.price.toString());
    const usageCost = usageRecords.reduce((sum, record) => 
      sum + parseFloat(record.totalCost.toString()), 0
    );
    const subtotal = planCost + usageCost;
    const tax = subtotal * parseFloat(billingSettings.taxRate.toString());
    const total = subtotal + tax;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        clientId: subscription.clientId,
        number: invoiceNumber,
        title: `${subscription.name} - ${billingPeriod}`,
        description: `Invoice for ${subscription.name} subscription`,
        subtotal,
        tax,
        total,
        currency: billingSettings.currency,
        dueDate: options.dueDate || this.calculateDueDate(billingSettings.paymentTermsDays),
        createdById: 'system', // TODO: Get from context
        items: {
          create: [
            // Plan cost
            {
              description: `${subscription.plan.name} - ${billingPeriod}`,
              quantity: 1,
              unitPrice: subscription.plan.price,
              total: subscription.plan.price,
            },
            // Usage items
            ...usageRecords.map(record => ({
              description: `${record.resourceType} - ${record.unit}`,
              quantity: parseFloat(record.quantity.toString()),
              unitPrice: record.unitPrice,
              total: record.totalCost,
            })),
          ],
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    // Mark usage records as invoiced
    if (usageRecords.length > 0) {
      await prisma.usageRecord.updateMany({
        where: {
          id: { in: usageRecords.map(r => r.id) },
        },
        data: {
          invoiced: true,
          invoiceId: invoice.id,
        },
      });
    }

    return invoice;
  }

  async generateRecurringInvoices(tenantId: string) {
    const recurringInvoices = await prisma.recurringInvoice.findMany({
      where: {
        tenantId,
        status: RecurringInvoiceStatus.ACTIVE,
        nextGeneration: { lte: new Date() },
      },
      include: {
        subscription: {
          include: {
            client: true,
            plan: true,
            billingCycle: true,
          },
        },
      },
    });

    const results = [];

    for (const recurringInvoice of recurringInvoices) {
      try {
        const invoice = await this.generateInvoiceForSubscription(
          tenantId,
          recurringInvoice.subscriptionId,
          {
            includeUsage: recurringInvoice.includePreviousUsage,
            autoSend: recurringInvoice.autoSend,
          }
        );

        // Update next generation date
        const nextGeneration = this.calculateNextBillingDate(
          new Date(),
          recurringInvoice.subscription.billingCycle
        );

        await prisma.recurringInvoice.update({
          where: { id: recurringInvoice.id },
          data: {
            lastGenerated: new Date(),
            nextGeneration,
          },
        });

        results.push({ success: true, invoice });
      } catch (error) {
        results.push({ 
          success: false, 
          error: (error as Error).message,
          recurringInvoiceId: recurringInvoice.id,
        });
      }
    }

    return results;
  }

  // ============================================================================
  // BILLING SETTINGS
  // ============================================================================
  
  async getBillingSettings(tenantId: string) {
    let settings = await prisma.billingSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      settings = await prisma.billingSettings.create({
        data: { tenantId },
      });
    }

    return settings;
  }

  async updateBillingSettings(tenantId: string, data: Partial<{
    currency: string;
    timezone: string;
    taxRate: number;
    taxIncluded: boolean;
    invoicePrefix: string;
    paymentTermsDays: number;
    latePaymentFee: number;
    latePaymentFeeType: FeeType;
    autoGenerateInvoices: boolean;
    autoSendInvoices: boolean;
    autoCollectPayments: boolean;
    retryFailedPayments: boolean;
    maxRetryAttempts: number;
    retryIntervalDays: number;
    gracePeriodDays: number;
    dunningEnabled: boolean;
    emailTemplates: Record<string, any>;
    webhookUrls: string[];
  }>) {
    return await prisma.billingSettings.update({
      where: { tenantId },
      data,
    });
  }

  // ============================================================================
  // REPORTING & ANALYTICS
  // ============================================================================
  
  async getBillingReport(tenantId: string, startDate: Date, endDate: Date): Promise<BillingReport> {
    const [
      totalRevenue,
      subscriptionStats,
      invoiceStats,
      previousPeriodRevenue,
    ] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        where: {
          tenantId,
          processedAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      
      // Subscription statistics
      prisma.subscription.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      
      // Invoice statistics
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'OVERDUE',
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      
      // Previous period for comparison
      prisma.payment.aggregate({
        where: {
          tenantId,
          processedAt: {
            gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
            lt: startDate,
          },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
    ]);

    const totalSubscriptions = subscriptionStats.reduce((sum, stat) => sum + stat._count.status, 0);
    const activeSubscriptions = subscriptionStats.find(s => s.status === 'ACTIVE')?._count.status || 0;
    const currentRevenue = parseFloat(totalRevenue._sum.amount?.toString() || '0');
    const previousRevenue = parseFloat(previousPeriodRevenue._sum.amount?.toString() || '0');

    // Calculate Monthly Recurring Revenue (MRR)
    const monthlySubscriptions = await prisma.subscription.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        billingCycle: {
          cycle: 'MONTHLY',
        },
      },
      include: { plan: true },
    });

    const mrr = monthlySubscriptions.reduce((sum, sub) => 
      sum + parseFloat(sub.plan.price.toString()), 0
    );

    return {
      totalRevenue: currentRevenue,
      totalSubscriptions,
      activeSubscriptions,
      overdueInvoices: invoiceStats._count.id,
      unpaidAmount: parseFloat(invoiceStats._sum.total?.toString() || '0'),
      monthlyRecurringRevenue: mrr,
      churnRate: this.calculateChurnRate(previousRevenue, currentRevenue),
      averageRevenuePerUser: activeSubscriptions > 0 ? currentRevenue / activeSubscriptions : 0,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private calculateNextBillingDate(startDate: Date, billingCycle: any): Date {
    const date = new Date(startDate);
    
    switch (billingCycle.cycle) {
      case 'DAILY':
        date.setDate(date.getDate() + 1);
        break;
      case 'WEEKLY':
        date.setDate(date.getDate() + 7);
        break;
      case 'MONTHLY':
        if (billingCycle.dayOfMonth) {
          date.setMonth(date.getMonth() + 1);
          date.setDate(billingCycle.dayOfMonth);
        } else {
          date.setMonth(date.getMonth() + 1);
        }
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        if (billingCycle.dayOfMonth) {
          date.setDate(billingCycle.dayOfMonth);
        }
        break;
      case 'YEARLY':
        date.setFullYear(date.getFullYear() + 1);
        if (billingCycle.dayOfMonth) {
          date.setDate(billingCycle.dayOfMonth);
        }
        break;
    }
    
    return date;
  }

  private getBillingPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private calculateDueDate(paymentTermsDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + paymentTermsDays);
    return date;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const settings = await this.getBillingSettings(tenantId);
    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = settings.invoiceNumberStart;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.number.replace(settings.invoicePrefix, ''));
      nextNumber = isNaN(lastNumber) ? settings.invoiceNumberStart : lastNumber + 1;
    }

    return `${settings.invoicePrefix}${nextNumber}`;
  }

  private calculateChurnRate(previousRevenue: number, currentRevenue: number): number {
    if (previousRevenue === 0) return 0;
    return Math.max(0, (previousRevenue - currentRevenue) / previousRevenue * 100);
  }
}
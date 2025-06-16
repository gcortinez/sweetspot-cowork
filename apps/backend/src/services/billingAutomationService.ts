import { prisma } from "../lib/prisma";
import { BillingService } from "./billingService";
import { paymentService } from "./paymentService";
import { consumptionTrackingService } from "./consumptionTrackingService";
import {
  SubscriptionStatus,
  BillingStatus,
  InvoiceStatus,
  PaymentStatus,
  RecurringInvoiceStatus,
  PaymentMethod,
} from "@prisma/client";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: "schedule" | "event" | "threshold";
  conditions: Record<string, any>;
  actions: Array<{
    type:
      | "generate_invoice"
      | "send_reminder"
      | "suspend_service"
      | "collect_payment"
      | "send_notification";
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
}

export interface BillingJob {
  id: string;
  type:
    | "invoice_generation"
    | "payment_collection"
    | "subscription_renewal"
    | "usage_processing"
    | "dunning";
  tenantId: string;
  scheduledFor: Date;
  data: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  error?: string;
  result?: Record<string, any>;
}

export interface BillingWorkflowResult {
  success: boolean;
  jobsCreated: number;
  invoicesGenerated: number;
  paymentsProcessed: number;
  errors: string[];
  warnings: string[];
}

export class BillingAutomationService {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
  }

  // ============================================================================
  // AUTOMATED INVOICE GENERATION
  // ============================================================================

  async runInvoiceGenerationWorkflow(
    tenantId: string
  ): Promise<BillingWorkflowResult> {
    const result: BillingWorkflowResult = {
      success: true,
      jobsCreated: 0,
      invoicesGenerated: 0,
      paymentsProcessed: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Get billing settings
      const billingSettings = await this.billingService.getBillingSettings(
        tenantId
      );

      if (!billingSettings.autoGenerateInvoices) {
        result.warnings.push("Auto invoice generation is disabled");
        return result;
      }

      // Get subscriptions due for billing
      const dueSubscriptions = await prisma.subscription.findMany({
        where: {
          tenantId,
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: { lte: new Date() },
        },
        include: {
          client: true,
          plan: true,
          billingCycle: true,
        },
      });

      result.jobsCreated = dueSubscriptions.length;

      for (const subscription of dueSubscriptions) {
        try {
          // Generate invoice for subscription
          const invoice =
            await this.billingService.generateInvoiceForSubscription(
              tenantId,
              subscription.id,
              {
                includeUsage: true,
                autoSend: billingSettings.autoSendInvoices,
              }
            );

          result.invoicesGenerated++;

          // Update subscription next billing date
          const nextBillingDate = this.calculateNextBillingDate(
            new Date(),
            subscription.billingCycle
          );

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              lastBillingDate: new Date(),
              nextBillingDate,
              currentPeriodStart: subscription.currentPeriodEnd,
              currentPeriodEnd: nextBillingDate,
            },
          });

          // Auto-collect payment if enabled
          if (billingSettings.autoCollectPayments) {
            await this.schedulePaymentCollection(tenantId, invoice.id);
          }

          // Send invoice if auto-send is enabled
          if (billingSettings.autoSendInvoices) {
            await this.sendInvoiceNotification(tenantId, invoice.id);
          }
        } catch (error) {
          result.errors.push(
            `Failed to generate invoice for subscription ${subscription.id}: ${
              (error as Error).message
            }`
          );
          result.success = false;
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Invoice generation workflow failed: ${(error as Error).message}`
      );
      return result;
    }
  }

  // ============================================================================
  // AUTOMATED PAYMENT COLLECTION
  // ============================================================================

  async runPaymentCollectionWorkflow(
    tenantId: string
  ): Promise<BillingWorkflowResult> {
    const result: BillingWorkflowResult = {
      success: true,
      jobsCreated: 0,
      invoicesGenerated: 0,
      paymentsProcessed: 0,
      errors: [],
      warnings: [],
    };

    try {
      const billingSettings = await this.billingService.getBillingSettings(
        tenantId
      );

      if (!billingSettings.autoCollectPayments) {
        result.warnings.push("Auto payment collection is disabled");
        return result;
      }

      // Get unpaid invoices within grace period
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
          dueDate: {
            gte: new Date(
              Date.now() - billingSettings.gracePeriodDays * 24 * 60 * 60 * 1000
            ),
          },
        },
        include: {
          client: {
            include: {
              paymentMethods: {
                where: { isDefault: true, isActive: true },
              },
            },
          },
        },
      });

      result.jobsCreated = unpaidInvoices.length;

      for (const invoice of unpaidInvoices) {
        try {
          if (invoice.client.paymentMethods.length === 0) {
            result.warnings.push(
              `No payment method found for client ${invoice.client.name}`
            );
            continue;
          }

          // Attempt to collect payment
          const payment = await paymentService.createPayment(tenantId, {
            clientId: invoice.clientId,
            invoiceId: invoice.id,
            amount: parseFloat(invoice.total.toString()),
            currency: invoice.currency,
            method: PaymentMethod.BANK_TRANSFER, // Default method
            reference: `INV-${invoice.number}`,
          });

          if (payment.status === PaymentStatus.COMPLETED) {
            // Update invoice as paid
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: InvoiceStatus.PAID,
                paidAt: new Date(),
              },
            });

            result.paymentsProcessed++;
          } else {
            result.warnings.push(
              `Payment failed for invoice ${invoice.number}`
            );

            // Schedule retry if enabled
            if (billingSettings.retryFailedPayments) {
              await this.schedulePaymentRetry(tenantId, invoice.id, payment.id);
            }
          }
        } catch (error) {
          result.errors.push(
            `Failed to collect payment for invoice ${invoice.number}: ${
              (error as Error).message
            }`
          );
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Payment collection workflow failed: ${(error as Error).message}`
      );
      return result;
    }
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  async runSubscriptionMaintenanceWorkflow(
    tenantId: string
  ): Promise<BillingWorkflowResult> {
    const result: BillingWorkflowResult = {
      success: true,
      jobsCreated: 0,
      invoicesGenerated: 0,
      paymentsProcessed: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Handle expired subscriptions
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          tenantId,
          status: SubscriptionStatus.ACTIVE,
          endDate: { lte: new Date() },
        },
      });

      for (const subscription of expiredSubscriptions) {
        if (subscription.autoRenew) {
          // Attempt to renew subscription
          try {
            await this.renewSubscription(tenantId, subscription.id);
            result.jobsCreated++;
          } catch (error) {
            result.errors.push(
              `Failed to renew subscription ${subscription.id}: ${
                (error as Error).message
              }`
            );
          }
        } else {
          // Cancel subscription
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.EXPIRED },
          });
        }
      }

      // Handle past due subscriptions
      const pastDueSubscriptions = await prisma.subscription.findMany({
        where: {
          tenantId,
          billingStatus: BillingStatus.PAST_DUE,
          status: SubscriptionStatus.ACTIVE,
        },
        include: {
          client: true,
        },
      });

      for (const subscription of pastDueSubscriptions) {
        // Check if subscription should be suspended
        const daysPastDue = this.getDaysPastDue(subscription.nextBillingDate);
        const billingSettings = await this.billingService.getBillingSettings(
          tenantId
        );

        if (daysPastDue > billingSettings.gracePeriodDays) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { billingStatus: BillingStatus.SUSPENDED },
          });

          result.warnings.push(
            `Subscription ${subscription.id} suspended due to non-payment`
          );
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Subscription maintenance workflow failed: ${(error as Error).message}`
      );
      return result;
    }
  }

  // ============================================================================
  // DUNNING MANAGEMENT
  // ============================================================================

  async runDunningWorkflow(tenantId: string): Promise<BillingWorkflowResult> {
    const result: BillingWorkflowResult = {
      success: true,
      jobsCreated: 0,
      invoicesGenerated: 0,
      paymentsProcessed: 0,
      errors: [],
      warnings: [],
    };

    try {
      const billingSettings = await this.billingService.getBillingSettings(
        tenantId
      );

      if (!billingSettings.dunningEnabled) {
        result.warnings.push("Dunning process is disabled");
        return result;
      }

      // Get overdue invoices
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: InvoiceStatus.OVERDUE,
          dueDate: { lt: new Date() },
        },
        include: {
          client: true,
        },
      });

      for (const invoice of overdueInvoices) {
        const daysPastDue = this.getDaysPastDue(invoice.dueDate);

        // Determine dunning stage based on days past due
        let dunningStage: "reminder" | "warning" | "final_notice" | "suspend";

        if (daysPastDue <= 7) {
          dunningStage = "reminder";
        } else if (daysPastDue <= 14) {
          dunningStage = "warning";
        } else if (daysPastDue <= 30) {
          dunningStage = "final_notice";
        } else {
          dunningStage = "suspend";
        }

        try {
          await this.executeDunningAction(tenantId, invoice.id, dunningStage);
          result.jobsCreated++;
        } catch (error) {
          result.errors.push(
            `Dunning action failed for invoice ${invoice.number}: ${
              (error as Error).message
            }`
          );
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Dunning workflow failed: ${(error as Error).message}`
      );
      return result;
    }
  }

  // ============================================================================
  // USAGE PROCESSING
  // ============================================================================

  async runUsageProcessingWorkflow(
    tenantId: string
  ): Promise<BillingWorkflowResult> {
    const result: BillingWorkflowResult = {
      success: true,
      jobsCreated: 0,
      invoicesGenerated: 0,
      paymentsProcessed: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Process unbilled usage records
      const unbilledUsage = await consumptionTrackingService.getUnbilledUsage(
        tenantId
      );

      // Group by client and billing period
      const groupedUsage = unbilledUsage.reduce((acc, record) => {
        const key = `${record.clientId}_${record.billingPeriod}`;

        if (!acc[key]) {
          acc[key] = {
            clientId: record.clientId,
            billingPeriod: record.billingPeriod,
            records: [],
          };
        }

        acc[key].records.push(record);
        return acc;
      }, {} as Record<string, any>);

      // Process each group
      for (const [key, group] of Object.entries(groupedUsage)) {
        try {
          // Check if we should generate an invoice for this usage
          const shouldInvoice = await this.shouldGenerateUsageInvoice(
            tenantId,
            group
          );

          if (shouldInvoice) {
            // Generate usage-only invoice
            await this.generateUsageInvoice(tenantId, group);
            result.invoicesGenerated++;
          }

          result.jobsCreated++;
        } catch (error) {
          result.errors.push(
            `Failed to process usage for ${key}: ${(error as Error).message}`
          );
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Usage processing workflow failed: ${(error as Error).message}`
      );
      return result;
    }
  }

  // ============================================================================
  // AUTOMATION ORCHESTRATION
  // ============================================================================

  async runAllAutomationWorkflows(
    tenantId: string
  ): Promise<Record<string, BillingWorkflowResult>> {
    const results: Record<string, BillingWorkflowResult> = {};

    // Run workflows in sequence
    results.invoiceGeneration = await this.runInvoiceGenerationWorkflow(
      tenantId
    );
    results.paymentCollection = await this.runPaymentCollectionWorkflow(
      tenantId
    );
    results.subscriptionMaintenance =
      await this.runSubscriptionMaintenanceWorkflow(tenantId);
    results.dunning = await this.runDunningWorkflow(tenantId);
    results.usageProcessing = await this.runUsageProcessingWorkflow(tenantId);

    return results;
  }

  async scheduleAutomationJob(job: Omit<BillingJob, "id">): Promise<string> {
    // In a real implementation, this would use a job queue like Bull, Agenda, or similar
    // For now, we'll just store the job and process it immediately if scheduled for now

    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store job (in real implementation, this would go to a job queue)
    const storedJob: BillingJob = {
      id: jobId,
      ...job,
      status: "pending",
      attempts: 0,
    };

    // If scheduled for immediate execution, process it
    if (job.scheduledFor <= new Date()) {
      await this.processJob(storedJob);
    }

    return jobId;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async processJob(job: BillingJob): Promise<void> {
    try {
      job.status = "running";
      job.attempts++;
      job.lastAttempt = new Date();

      let result: any;

      switch (job.type) {
        case "invoice_generation":
          result = await this.runInvoiceGenerationWorkflow(job.tenantId);
          break;
        case "payment_collection":
          result = await this.runPaymentCollectionWorkflow(job.tenantId);
          break;
        case "subscription_renewal":
          result = await this.runSubscriptionMaintenanceWorkflow(job.tenantId);
          break;
        case "usage_processing":
          result = await this.runUsageProcessingWorkflow(job.tenantId);
          break;
        case "dunning":
          result = await this.runDunningWorkflow(job.tenantId);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = "completed";
      job.result = result;
    } catch (error) {
      job.status = "failed";
      job.error = (error as Error).message;

      // Retry if under max attempts
      if (job.attempts < job.maxAttempts) {
        job.status = "pending";
        // Schedule retry (in real implementation)
      }
    }
  }

  private calculateNextBillingDate(currentDate: Date, billingCycle: any): Date {
    const date = new Date(currentDate);

    switch (billingCycle.cycle) {
      case "DAILY":
        date.setDate(date.getDate() + 1);
        break;
      case "WEEKLY":
        date.setDate(date.getDate() + 7);
        break;
      case "MONTHLY":
        date.setMonth(date.getMonth() + 1);
        if (billingCycle.dayOfMonth) {
          date.setDate(billingCycle.dayOfMonth);
        }
        break;
      case "QUARTERLY":
        date.setMonth(date.getMonth() + 3);
        break;
      case "YEARLY":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  private getDaysPastDue(dueDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async renewSubscription(
    tenantId: string,
    subscriptionId: string
  ): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: { billingCycle: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const newEndDate = new Date(subscription.endDate!);

    switch (subscription.billingCycle.cycle) {
      case "MONTHLY":
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case "QUARTERLY":
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case "YEARLY":
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: newEndDate,
        status: SubscriptionStatus.ACTIVE,
        billingStatus: BillingStatus.ACTIVE,
      },
    });
  }

  private async executeDunningAction(
    tenantId: string,
    invoiceId: string,
    stage: string
  ): Promise<void> {
    // In a real implementation, this would send emails, SMS, etc.
    // For now, we'll just log the action
    console.log(`Executing dunning action ${stage} for invoice ${invoiceId}`);

    if (stage === "suspend") {
      // Suspend client services
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { client: true },
      });

      if (invoice) {
        // Suspend client subscriptions
        await prisma.subscription.updateMany({
          where: {
            tenantId,
            clientId: invoice.clientId,
          },
          data: {
            billingStatus: BillingStatus.SUSPENDED,
          },
        });
      }
    }
  }

  private async shouldGenerateUsageInvoice(
    tenantId: string,
    group: any
  ): Promise<boolean> {
    const totalCost = group.records.reduce(
      (sum: number, record: any) =>
        sum + parseFloat(record.totalCost.toString()),
      0
    );

    // Only generate invoice if usage cost exceeds minimum threshold
    const minimumInvoiceAmount = 10; // $10 minimum
    return totalCost >= minimumInvoiceAmount;
  }

  private async generateUsageInvoice(
    tenantId: string,
    group: any
  ): Promise<void> {
    const billingSettings = await this.billingService.getBillingSettings(
      tenantId
    );
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const totalCost = group.records.reduce(
      (sum: number, record: any) =>
        sum + parseFloat(record.totalCost.toString()),
      0
    );

    const tax = totalCost * parseFloat(billingSettings.taxRate.toString());
    const total = totalCost + tax;

    // Create usage invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        clientId: group.clientId,
        number: invoiceNumber,
        title: `Usage Invoice - ${group.billingPeriod}`,
        description: `Usage charges for ${group.billingPeriod}`,
        subtotal: totalCost,
        tax,
        total,
        currency: billingSettings.currency,
        dueDate: new Date(
          Date.now() + billingSettings.paymentTermsDays * 24 * 60 * 60 * 1000
        ),
        createdById: "system", // TODO: Get from context
        items: {
          create: group.records.map((record: any) => ({
            description: `${record.resourceType} - ${record.unit}`,
            quantity: parseFloat(record.quantity.toString()),
            unitPrice: record.unitPrice,
            total: record.totalCost,
          })),
        },
      },
    });

    // Mark usage records as invoiced
    await consumptionTrackingService.markUsageAsBilled(
      tenantId,
      group.records.map((r: any) => r.id),
      invoice.id
    );
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const settings = await this.billingService.getBillingSettings(tenantId);
    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = settings.invoiceNumberStart;
    if (lastInvoice) {
      const lastNumber = parseInt(
        lastInvoice.number.replace(settings.invoicePrefix, "")
      );
      nextNumber = isNaN(lastNumber)
        ? settings.invoiceNumberStart
        : lastNumber + 1;
    }

    return `${settings.invoicePrefix}${nextNumber}`;
  }

  private async schedulePaymentCollection(
    tenantId: string,
    invoiceId: string
  ): Promise<void> {
    await this.scheduleAutomationJob({
      type: "payment_collection",
      tenantId,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
      data: { invoiceId },
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
    });
  }

  private async schedulePaymentRetry(
    tenantId: string,
    invoiceId: string,
    paymentId: string
  ): Promise<void> {
    await this.scheduleAutomationJob({
      type: "payment_collection",
      tenantId,
      scheduledFor: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours later
      data: { invoiceId, paymentId, isRetry: true },
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
    });
  }

  private async sendInvoiceNotification(
    tenantId: string,
    invoiceId: string
  ): Promise<void> {
    // In a real implementation, this would send email notifications
    console.log(`Sending invoice notification for ${invoiceId}`);
  }
}

export const billingAutomationService = new BillingAutomationService();

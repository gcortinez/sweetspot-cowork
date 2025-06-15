"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingAutomationService = exports.BillingAutomationService = void 0;
const prisma_1 = require("../lib/prisma");
const billingService_1 = require("./billingService");
const paymentService_1 = require("./paymentService");
const consumptionTrackingService_1 = require("./consumptionTrackingService");
const client_1 = require("@prisma/client");
class BillingAutomationService {
    billingService;
    constructor() {
        this.billingService = new billingService_1.BillingService();
    }
    async runInvoiceGenerationWorkflow(tenantId) {
        const result = {
            success: true,
            jobsCreated: 0,
            invoicesGenerated: 0,
            paymentsProcessed: 0,
            errors: [],
            warnings: [],
        };
        try {
            const billingSettings = await this.billingService.getBillingSettings(tenantId);
            if (!billingSettings.autoGenerateInvoices) {
                result.warnings.push('Auto invoice generation is disabled');
                return result;
            }
            const dueSubscriptions = await prisma_1.prisma.subscription.findMany({
                where: {
                    tenantId,
                    status: client_1.SubscriptionStatus.ACTIVE,
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
                    const invoice = await this.billingService.generateInvoiceForSubscription(tenantId, subscription.id, {
                        includeUsage: true,
                        autoSend: billingSettings.autoSendInvoices,
                    });
                    result.invoicesGenerated++;
                    const nextBillingDate = this.calculateNextBillingDate(new Date(), subscription.billingCycle);
                    await prisma_1.prisma.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            lastBillingDate: new Date(),
                            nextBillingDate,
                            currentPeriodStart: subscription.currentPeriodEnd,
                            currentPeriodEnd: nextBillingDate,
                        },
                    });
                    if (billingSettings.autoCollectPayments) {
                        await this.schedulePaymentCollection(tenantId, invoice.id);
                    }
                    if (billingSettings.autoSendInvoices) {
                        await this.sendInvoiceNotification(tenantId, invoice.id);
                    }
                }
                catch (error) {
                    result.errors.push(`Failed to generate invoice for subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    result.success = false;
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`Invoice generation workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }
    async runPaymentCollectionWorkflow(tenantId) {
        const result = {
            success: true,
            jobsCreated: 0,
            invoicesGenerated: 0,
            paymentsProcessed: 0,
            errors: [],
            warnings: [],
        };
        try {
            const billingSettings = await this.billingService.getBillingSettings(tenantId);
            if (!billingSettings.autoCollectPayments) {
                result.warnings.push('Auto payment collection is disabled');
                return result;
            }
            const unpaidInvoices = await prisma_1.prisma.invoice.findMany({
                where: {
                    tenantId,
                    status: { in: [client_1.InvoiceStatus.SENT, client_1.InvoiceStatus.OVERDUE] },
                    dueDate: {
                        gte: new Date(Date.now() - billingSettings.gracePeriodDays * 24 * 60 * 60 * 1000)
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
                        result.warnings.push(`No payment method found for client ${invoice.client.name}`);
                        continue;
                    }
                    const payment = await paymentService_1.paymentService.processPayment(tenantId, invoice.clientId, {
                        amount: parseFloat(invoice.total.toString()),
                        currency: invoice.currency,
                        description: `Payment for invoice ${invoice.number}`,
                    });
                    if (payment.status === client_1.PaymentStatus.COMPLETED) {
                        await prisma_1.prisma.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                status: client_1.InvoiceStatus.PAID,
                                paidAt: new Date(),
                            },
                        });
                        result.paymentsProcessed++;
                    }
                    else {
                        result.warnings.push(`Payment failed for invoice ${invoice.number}`);
                        if (billingSettings.retryFailedPayments) {
                            await this.schedulePaymentRetry(tenantId, invoice.id, payment.id);
                        }
                    }
                }
                catch (error) {
                    result.errors.push(`Failed to collect payment for invoice ${invoice.number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`Payment collection workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }
    async runSubscriptionMaintenanceWorkflow(tenantId) {
        const result = {
            success: true,
            jobsCreated: 0,
            invoicesGenerated: 0,
            paymentsProcessed: 0,
            errors: [],
            warnings: [],
        };
        try {
            const expiredSubscriptions = await prisma_1.prisma.subscription.findMany({
                where: {
                    tenantId,
                    status: client_1.SubscriptionStatus.ACTIVE,
                    endDate: { lte: new Date() },
                },
            });
            for (const subscription of expiredSubscriptions) {
                if (subscription.autoRenew) {
                    try {
                        await this.renewSubscription(tenantId, subscription.id);
                        result.jobsCreated++;
                    }
                    catch (error) {
                        result.errors.push(`Failed to renew subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
                else {
                    await prisma_1.prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: client_1.SubscriptionStatus.EXPIRED },
                    });
                }
            }
            const pastDueSubscriptions = await prisma_1.prisma.subscription.findMany({
                where: {
                    tenantId,
                    billingStatus: client_1.BillingStatus.PAST_DUE,
                    status: client_1.SubscriptionStatus.ACTIVE,
                },
                include: {
                    client: true,
                },
            });
            for (const subscription of pastDueSubscriptions) {
                const daysPastDue = this.getDaysPastDue(subscription.nextBillingDate);
                const billingSettings = await this.billingService.getBillingSettings(tenantId);
                if (daysPastDue > billingSettings.gracePeriodDays) {
                    await prisma_1.prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { billingStatus: client_1.BillingStatus.SUSPENDED },
                    });
                    result.warnings.push(`Subscription ${subscription.id} suspended due to non-payment`);
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`Subscription maintenance workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }
    async runDunningWorkflow(tenantId) {
        const result = {
            success: true,
            jobsCreated: 0,
            invoicesGenerated: 0,
            paymentsProcessed: 0,
            errors: [],
            warnings: [],
        };
        try {
            const billingSettings = await this.billingService.getBillingSettings(tenantId);
            if (!billingSettings.dunningEnabled) {
                result.warnings.push('Dunning process is disabled');
                return result;
            }
            const overdueInvoices = await prisma_1.prisma.invoice.findMany({
                where: {
                    tenantId,
                    status: client_1.InvoiceStatus.OVERDUE,
                    dueDate: { lt: new Date() },
                },
                include: {
                    client: true,
                },
            });
            for (const invoice of overdueInvoices) {
                const daysPastDue = this.getDaysPastDue(invoice.dueDate);
                let dunningStage;
                if (daysPastDue <= 7) {
                    dunningStage = 'reminder';
                }
                else if (daysPastDue <= 14) {
                    dunningStage = 'warning';
                }
                else if (daysPastDue <= 30) {
                    dunningStage = 'final_notice';
                }
                else {
                    dunningStage = 'suspend';
                }
                try {
                    await this.executeDunningAction(tenantId, invoice.id, dunningStage);
                    result.jobsCreated++;
                }
                catch (error) {
                    result.errors.push(`Dunning action failed for invoice ${invoice.number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`Dunning workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }
    async runUsageProcessingWorkflow(tenantId) {
        const result = {
            success: true,
            jobsCreated: 0,
            invoicesGenerated: 0,
            paymentsProcessed: 0,
            errors: [],
            warnings: [],
        };
        try {
            const unbilledUsage = await consumptionTrackingService_1.consumptionTrackingService.getUnbilledUsage(tenantId);
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
            }, {});
            for (const [key, group] of Object.entries(groupedUsage)) {
                try {
                    const shouldInvoice = await this.shouldGenerateUsageInvoice(tenantId, group);
                    if (shouldInvoice) {
                        await this.generateUsageInvoice(tenantId, group);
                        result.invoicesGenerated++;
                    }
                    result.jobsCreated++;
                }
                catch (error) {
                    result.errors.push(`Failed to process usage for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`Usage processing workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }
    async runAllAutomationWorkflows(tenantId) {
        const results = {};
        results.invoiceGeneration = await this.runInvoiceGenerationWorkflow(tenantId);
        results.paymentCollection = await this.runPaymentCollectionWorkflow(tenantId);
        results.subscriptionMaintenance = await this.runSubscriptionMaintenanceWorkflow(tenantId);
        results.dunning = await this.runDunningWorkflow(tenantId);
        results.usageProcessing = await this.runUsageProcessingWorkflow(tenantId);
        return results;
    }
    async scheduleAutomationJob(job) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const storedJob = {
            id: jobId,
            ...job,
            status: 'pending',
            attempts: 0,
        };
        if (job.scheduledFor <= new Date()) {
            await this.processJob(storedJob);
        }
        return jobId;
    }
    async processJob(job) {
        try {
            job.status = 'running';
            job.attempts++;
            job.lastAttempt = new Date();
            let result;
            switch (job.type) {
                case 'invoice_generation':
                    result = await this.runInvoiceGenerationWorkflow(job.tenantId);
                    break;
                case 'payment_collection':
                    result = await this.runPaymentCollectionWorkflow(job.tenantId);
                    break;
                case 'subscription_renewal':
                    result = await this.runSubscriptionMaintenanceWorkflow(job.tenantId);
                    break;
                case 'usage_processing':
                    result = await this.runUsageProcessingWorkflow(job.tenantId);
                    break;
                case 'dunning':
                    result = await this.runDunningWorkflow(job.tenantId);
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }
            job.status = 'completed';
            job.result = result;
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            if (job.attempts < job.maxAttempts) {
                job.status = 'pending';
            }
        }
    }
    calculateNextBillingDate(currentDate, billingCycle) {
        const date = new Date(currentDate);
        switch (billingCycle.cycle) {
            case 'DAILY':
                date.setDate(date.getDate() + 1);
                break;
            case 'WEEKLY':
                date.setDate(date.getDate() + 7);
                break;
            case 'MONTHLY':
                date.setMonth(date.getMonth() + 1);
                if (billingCycle.dayOfMonth) {
                    date.setDate(billingCycle.dayOfMonth);
                }
                break;
            case 'QUARTERLY':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'YEARLY':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        return date;
    }
    getDaysPastDue(dueDate) {
        const now = new Date();
        const diffTime = now.getTime() - dueDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    async renewSubscription(tenantId, subscriptionId) {
        const subscription = await prisma_1.prisma.subscription.findFirst({
            where: { id: subscriptionId, tenantId },
            include: { billingCycle: true },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        const newEndDate = new Date(subscription.endDate);
        switch (subscription.billingCycle.cycle) {
            case 'MONTHLY':
                newEndDate.setMonth(newEndDate.getMonth() + 1);
                break;
            case 'QUARTERLY':
                newEndDate.setMonth(newEndDate.getMonth() + 3);
                break;
            case 'YEARLY':
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                break;
        }
        await prisma_1.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                endDate: newEndDate,
                status: client_1.SubscriptionStatus.ACTIVE,
                billingStatus: client_1.BillingStatus.ACTIVE,
            },
        });
    }
    async executeDunningAction(tenantId, invoiceId, stage) {
        console.log(`Executing dunning action ${stage} for invoice ${invoiceId}`);
        if (stage === 'suspend') {
            const invoice = await prisma_1.prisma.invoice.findFirst({
                where: { id: invoiceId, tenantId },
                include: { client: true },
            });
            if (invoice) {
                await prisma_1.prisma.subscription.updateMany({
                    where: {
                        tenantId,
                        clientId: invoice.clientId,
                    },
                    data: {
                        billingStatus: client_1.BillingStatus.SUSPENDED,
                    },
                });
            }
        }
    }
    async shouldGenerateUsageInvoice(tenantId, group) {
        const totalCost = group.records.reduce((sum, record) => sum + parseFloat(record.totalCost.toString()), 0);
        const minimumInvoiceAmount = 10;
        return totalCost >= minimumInvoiceAmount;
    }
    async generateUsageInvoice(tenantId, group) {
        const billingSettings = await this.billingService.getBillingSettings(tenantId);
        const invoiceNumber = await this.generateInvoiceNumber(tenantId);
        const totalCost = group.records.reduce((sum, record) => sum + parseFloat(record.totalCost.toString()), 0);
        const tax = totalCost * parseFloat(billingSettings.taxRate.toString());
        const total = totalCost + tax;
        const invoice = await prisma_1.prisma.invoice.create({
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
                dueDate: new Date(Date.now() + billingSettings.paymentTermsDays * 24 * 60 * 60 * 1000),
                createdById: 'system',
                items: {
                    create: group.records.map((record) => ({
                        description: `${record.resourceType} - ${record.unit}`,
                        quantity: parseFloat(record.quantity.toString()),
                        unitPrice: record.unitPrice,
                        total: record.totalCost,
                    })),
                },
            },
        });
        await consumptionTrackingService_1.consumptionTrackingService.markUsageAsBilled(tenantId, group.records.map((r) => r.id), invoice.id);
    }
    async generateInvoiceNumber(tenantId) {
        const settings = await this.billingService.getBillingSettings(tenantId);
        const lastInvoice = await prisma_1.prisma.invoice.findFirst({
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
    async schedulePaymentCollection(tenantId, invoiceId) {
        await this.scheduleAutomationJob({
            type: 'payment_collection',
            tenantId,
            scheduledFor: new Date(Date.now() + 5 * 60 * 1000),
            data: { invoiceId },
            maxAttempts: 3,
        });
    }
    async schedulePaymentRetry(tenantId, invoiceId, paymentId) {
        const billingSettings = await this.billingService.getBillingSettings(tenantId);
        const retryDate = new Date(Date.now() + billingSettings.retryIntervalDays * 24 * 60 * 60 * 1000);
        await this.scheduleAutomationJob({
            type: 'payment_collection',
            tenantId,
            scheduledFor: retryDate,
            data: { invoiceId, paymentId, isRetry: true },
            maxAttempts: billingSettings.maxRetryAttempts,
        });
    }
    async sendInvoiceNotification(tenantId, invoiceId) {
        console.log(`Sending invoice notification for ${invoiceId}`);
    }
}
exports.BillingAutomationService = BillingAutomationService;
exports.billingAutomationService = new BillingAutomationService();
//# sourceMappingURL=billingAutomationService.js.map
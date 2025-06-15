"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class BillingService {
    async createBillingCycle(tenantId, data) {
        return await prisma_1.prisma.billingCycleConfig.create({
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
    async getBillingCycles(tenantId) {
        return await prisma_1.prisma.billingCycleConfig.findMany({
            where: { tenantId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateBillingCycle(tenantId, cycleId, data) {
        return await prisma_1.prisma.billingCycleConfig.updateMany({
            where: { id: cycleId, tenantId },
            data,
        });
    }
    async createSubscription(tenantId, data) {
        const billingCycle = await prisma_1.prisma.billingCycleConfig.findFirst({
            where: { id: data.billingCycleId, tenantId },
        });
        if (!billingCycle) {
            throw new Error('Billing cycle not found');
        }
        const nextBillingDate = this.calculateNextBillingDate(data.startDate, billingCycle);
        return await prisma_1.prisma.subscription.create({
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
    async getSubscriptions(tenantId, filters) {
        return await prisma_1.prisma.subscription.findMany({
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
    async updateSubscription(tenantId, subscriptionId, data) {
        return await prisma_1.prisma.subscription.updateMany({
            where: { id: subscriptionId, tenantId },
            data,
        });
    }
    async cancelSubscription(tenantId, subscriptionId, endDate) {
        const subscription = await prisma_1.prisma.subscription.findFirst({
            where: { id: subscriptionId, tenantId },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        return await prisma_1.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: client_1.SubscriptionStatus.CANCELLED,
                endDate: endDate || new Date(),
                autoRenew: false,
            },
        });
    }
    async recordUsage(tenantId, data) {
        const totalCost = data.quantity * data.unitPrice;
        const billingPeriod = this.getBillingPeriod(data.usageDate);
        return await prisma_1.prisma.usageRecord.create({
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
    async getUsageRecords(tenantId, filters) {
        return await prisma_1.prisma.usageRecord.findMany({
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
    async getUsageSummary(tenantId, clientId, billingPeriod) {
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
        }, {});
        return Object.values(summary);
    }
    async generateInvoiceForSubscription(tenantId, subscriptionId, options = {}) {
        const subscription = await prisma_1.prisma.subscription.findFirst({
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
        const billingPeriod = options.billingPeriod || this.getBillingPeriod(new Date());
        let usageRecords = [];
        if (options.includeUsage) {
            usageRecords = await this.getUsageRecords(tenantId, {
                clientId: subscription.clientId,
                subscriptionId: subscription.id,
                billingPeriod,
                invoiced: false,
            });
        }
        const planCost = parseFloat(subscription.plan.price.toString());
        const usageCost = usageRecords.reduce((sum, record) => sum + parseFloat(record.totalCost.toString()), 0);
        const subtotal = planCost + usageCost;
        const tax = subtotal * parseFloat(billingSettings.taxRate.toString());
        const total = subtotal + tax;
        const invoice = await prisma_1.prisma.invoice.create({
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
                createdById: 'system',
                items: {
                    create: [
                        {
                            description: `${subscription.plan.name} - ${billingPeriod}`,
                            quantity: 1,
                            unitPrice: subscription.plan.price,
                            total: subscription.plan.price,
                        },
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
        if (usageRecords.length > 0) {
            await prisma_1.prisma.usageRecord.updateMany({
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
    async generateRecurringInvoices(tenantId) {
        const recurringInvoices = await prisma_1.prisma.recurringInvoice.findMany({
            where: {
                tenantId,
                status: client_1.RecurringInvoiceStatus.ACTIVE,
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
                const invoice = await this.generateInvoiceForSubscription(tenantId, recurringInvoice.subscriptionId, {
                    includeUsage: recurringInvoice.includePreviousUsage,
                    autoSend: recurringInvoice.autoSend,
                });
                const nextGeneration = this.calculateNextBillingDate(new Date(), recurringInvoice.subscription.billingCycle);
                await prisma_1.prisma.recurringInvoice.update({
                    where: { id: recurringInvoice.id },
                    data: {
                        lastGenerated: new Date(),
                        nextGeneration,
                    },
                });
                results.push({ success: true, invoice });
            }
            catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    recurringInvoiceId: recurringInvoice.id,
                });
            }
        }
        return results;
    }
    async getBillingSettings(tenantId) {
        let settings = await prisma_1.prisma.billingSettings.findUnique({
            where: { tenantId },
        });
        if (!settings) {
            settings = await prisma_1.prisma.billingSettings.create({
                data: { tenantId },
            });
        }
        return settings;
    }
    async updateBillingSettings(tenantId, data) {
        return await prisma_1.prisma.billingSettings.update({
            where: { tenantId },
            data,
        });
    }
    async getBillingReport(tenantId, startDate, endDate) {
        const [totalRevenue, subscriptionStats, invoiceStats, previousPeriodRevenue,] = await Promise.all([
            prisma_1.prisma.payment.aggregate({
                where: {
                    tenantId,
                    processedAt: { gte: startDate, lte: endDate },
                    status: 'COMPLETED',
                },
                _sum: { amount: true },
            }),
            prisma_1.prisma.subscription.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
            }),
            prisma_1.prisma.invoice.aggregate({
                where: {
                    tenantId,
                    status: 'OVERDUE',
                },
                _sum: { total: true },
                _count: { id: true },
            }),
            prisma_1.prisma.payment.aggregate({
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
        const monthlySubscriptions = await prisma_1.prisma.subscription.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
                billingCycle: {
                    cycle: 'MONTHLY',
                },
            },
            include: { plan: true },
        });
        const mrr = monthlySubscriptions.reduce((sum, sub) => sum + parseFloat(sub.plan.price.toString()), 0);
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
    calculateNextBillingDate(startDate, billingCycle) {
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
                }
                else {
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
    getBillingPeriod(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    calculateDueDate(paymentTermsDays) {
        const date = new Date();
        date.setDate(date.getDate() + paymentTermsDays);
        return date;
    }
    async generateInvoiceNumber(tenantId) {
        const settings = await this.getBillingSettings(tenantId);
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
    calculateChurnRate(previousRevenue, currentRevenue) {
        if (previousRevenue === 0)
            return 0;
        return Math.max(0, (previousRevenue - currentRevenue) / previousRevenue * 100);
    }
}
exports.BillingService = BillingService;
//# sourceMappingURL=billingService.js.map
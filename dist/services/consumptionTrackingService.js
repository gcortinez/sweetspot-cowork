"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumptionTrackingService = exports.ConsumptionTrackingService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class ConsumptionTrackingService {
    async trackConsumption(tenantId, data) {
        let unitPrice = data.unitPrice;
        if (!unitPrice) {
            unitPrice = await this.getResourcePrice(tenantId, data.resourceType, data.resourceId);
        }
        const totalCost = data.quantity * unitPrice;
        const usageDate = data.usageDate || new Date();
        const billingPeriod = this.getBillingPeriod(usageDate);
        const usageRecord = await prisma_1.prisma.usageRecord.create({
            data: {
                tenantId,
                clientId: data.clientId,
                subscriptionId: data.subscriptionId,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                quantity: data.quantity,
                unit: data.unit,
                unitPrice,
                totalCost,
                usageDate,
                billingPeriod,
                metadata: data.metadata || {},
            },
            include: {
                client: true,
                subscription: true,
            },
        });
        await this.updateConsumptionMetrics(tenantId, data);
        return usageRecord;
    }
    async trackSpaceUsage(tenantId, spaceId, userId, startTime, endTime) {
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const space = await prisma_1.prisma.space.findFirst({
            where: { id: spaceId, tenantId },
        });
        if (!space) {
            throw new Error('Space not found');
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: { id: userId, tenantId },
            include: { client: true },
        });
        if (!user || !user.client) {
            throw new Error('User or client not found');
        }
        const unitPrice = space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : 0;
        return await this.trackConsumption(tenantId, {
            clientId: user.clientId,
            resourceType: client_1.UsageResourceType.SPACE_BOOKING,
            resourceId: spaceId,
            quantity: duration,
            unit: 'hours',
            unitPrice,
            usageDate: startTime,
            metadata: {
                spaceType: space.type,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                userId,
            },
        });
    }
    async trackServiceUsage(tenantId, serviceId, userId, quantity) {
        const service = await prisma_1.prisma.service.findFirst({
            where: { id: serviceId, tenantId },
        });
        if (!service) {
            throw new Error('Service not found');
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: { id: userId, tenantId },
            include: { client: true },
        });
        if (!user || !user.client) {
            throw new Error('User or client not found');
        }
        const unitPrice = parseFloat(service.price.toString());
        return await this.trackConsumption(tenantId, {
            clientId: user.clientId,
            resourceType: client_1.UsageResourceType.SERVICE_CONSUMPTION,
            resourceId: serviceId,
            quantity,
            unit: service.unit,
            unitPrice,
            metadata: {
                serviceCategory: service.category,
                serviceName: service.name,
                userId,
            },
        });
    }
    async trackMembershipUsage(tenantId, membershipId, billingPeriod) {
        const membership = await prisma_1.prisma.membership.findFirst({
            where: { id: membershipId, tenantId },
            include: {
                client: true,
                plan: true,
            },
        });
        if (!membership) {
            throw new Error('Membership not found');
        }
        const unitPrice = parseFloat(membership.plan.price.toString());
        return await this.trackConsumption(tenantId, {
            clientId: membership.clientId,
            resourceType: client_1.UsageResourceType.MEMBERSHIP_PLAN,
            resourceId: membership.planId,
            quantity: 1,
            unit: 'month',
            unitPrice,
            metadata: {
                membershipId,
                planType: membership.plan.type,
                billingCycle: membership.plan.billingCycle,
                billingPeriod,
            },
        });
    }
    async getConsumptionSummary(tenantId, clientId, startDate, endDate) {
        const usageRecords = await prisma_1.prisma.usageRecord.findMany({
            where: {
                tenantId,
                clientId,
                usageDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { usageDate: 'desc' },
        });
        const groupedUsage = usageRecords.reduce((acc, record) => {
            const key = `${record.resourceType}_${record.resourceId}`;
            if (!acc[key]) {
                acc[key] = {
                    resourceType: record.resourceType,
                    resourceId: record.resourceId,
                    records: [],
                    totalQuantity: 0,
                    totalCost: 0,
                    unit: record.unit,
                };
            }
            acc[key].records.push(record);
            acc[key].totalQuantity += parseFloat(record.quantity.toString());
            acc[key].totalCost += parseFloat(record.totalCost.toString());
            return acc;
        }, {});
        const summaries = [];
        for (const [key, group] of Object.entries(groupedUsage)) {
            const resourceName = await this.getResourceName(tenantId, group.resourceType, group.resourceId);
            const trend = this.calculateUsageTrend(group.records);
            summaries.push({
                resourceType: group.resourceType,
                resourceId: group.resourceId,
                resourceName,
                totalQuantity: group.totalQuantity,
                totalCost: group.totalCost,
                unit: group.unit,
                averageUnitPrice: group.totalCost / group.totalQuantity,
                usageCount: group.records.length,
                lastUsed: new Date(Math.max(...group.records.map((r) => r.usageDate.getTime()))),
                trend,
            });
        }
        return summaries.sort((a, b) => b.totalCost - a.totalCost);
    }
    async getUsageReport(tenantId, clientId, period) {
        const { startDate, endDate } = this.parsePeriod(period);
        const { startDate: prevStartDate, endDate: prevEndDate } = this.getPreviousPeriod(period);
        const client = await prisma_1.prisma.client.findFirst({
            where: { id: clientId, tenantId },
            select: { name: true },
        });
        if (!client) {
            throw new Error('Client not found');
        }
        const [currentUsage, previousUsage] = await Promise.all([
            prisma_1.prisma.usageRecord.findMany({
                where: {
                    tenantId,
                    clientId,
                    usageDate: { gte: startDate, lte: endDate },
                },
            }),
            prisma_1.prisma.usageRecord.findMany({
                where: {
                    tenantId,
                    clientId,
                    usageDate: { gte: prevStartDate, lte: prevEndDate },
                },
            }),
        ]);
        const totalCost = currentUsage.reduce((sum, record) => sum + parseFloat(record.totalCost.toString()), 0);
        const previousTotalCost = previousUsage.reduce((sum, record) => sum + parseFloat(record.totalCost.toString()), 0);
        const byResourceType = this.groupByResourceType(currentUsage, totalCost);
        const topResources = await this.getTopResources(tenantId, currentUsage);
        const costChange = totalCost - previousTotalCost;
        const quantityChange = currentUsage.length - previousUsage.length;
        const percentageChange = previousTotalCost > 0 ? (costChange / previousTotalCost) * 100 : 0;
        return {
            period,
            clientId,
            clientName: client.name,
            totalCost,
            byResourceType,
            topResources,
            comparisonToPrevious: {
                costChange,
                quantityChange,
                percentageChange,
            },
        };
    }
    async getConsumptionTrends(tenantId, clientId, resourceType, months = 12) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - months);
        const where = {
            tenantId,
            usageDate: { gte: startDate, lte: endDate },
        };
        if (clientId)
            where.clientId = clientId;
        if (resourceType)
            where.resourceType = resourceType;
        const usageRecords = await prisma_1.prisma.usageRecord.findMany({
            where,
            orderBy: { usageDate: 'asc' },
        });
        const monthlyData = usageRecords.reduce((acc, record) => {
            const monthKey = record.usageDate.toISOString().substring(0, 7);
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: monthKey,
                    totalQuantity: 0,
                    totalCost: 0,
                    recordCount: 0,
                };
            }
            acc[monthKey].totalQuantity += parseFloat(record.quantity.toString());
            acc[monthKey].totalCost += parseFloat(record.totalCost.toString());
            acc[monthKey].recordCount += 1;
            return acc;
        }, {});
        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }
    async getUnbilledUsage(tenantId, clientId, billingPeriod) {
        const where = {
            tenantId,
            invoiced: false,
        };
        if (clientId)
            where.clientId = clientId;
        if (billingPeriod)
            where.billingPeriod = billingPeriod;
        return await prisma_1.prisma.usageRecord.findMany({
            where,
            include: {
                client: true,
                subscription: true,
            },
            orderBy: { usageDate: 'desc' },
        });
    }
    async markUsageAsBilled(tenantId, usageRecordIds, invoiceId) {
        return await prisma_1.prisma.usageRecord.updateMany({
            where: {
                id: { in: usageRecordIds },
                tenantId,
            },
            data: {
                invoiced: true,
                invoiceId,
            },
        });
    }
    async getUsageForBilling(tenantId, subscriptionId, billingPeriod) {
        return await prisma_1.prisma.usageRecord.findMany({
            where: {
                tenantId,
                subscriptionId,
                billingPeriod,
                invoiced: false,
            },
            include: {
                client: true,
                subscription: true,
            },
        });
    }
    async getResourcePrice(tenantId, resourceType, resourceId) {
        switch (resourceType) {
            case client_1.UsageResourceType.SPACE_BOOKING:
                const space = await prisma_1.prisma.space.findFirst({
                    where: { id: resourceId, tenantId },
                });
                return space?.hourlyRate ? parseFloat(space.hourlyRate.toString()) : 0;
            case client_1.UsageResourceType.SERVICE_CONSUMPTION:
                const service = await prisma_1.prisma.service.findFirst({
                    where: { id: resourceId, tenantId },
                });
                return service ? parseFloat(service.price.toString()) : 0;
            case client_1.UsageResourceType.MEMBERSHIP_PLAN:
                const plan = await prisma_1.prisma.plan.findFirst({
                    where: { id: resourceId, tenantId },
                });
                return plan ? parseFloat(plan.price.toString()) : 0;
            default:
                return 0;
        }
    }
    async getResourceName(tenantId, resourceType, resourceId) {
        switch (resourceType) {
            case client_1.UsageResourceType.SPACE_BOOKING:
                const space = await prisma_1.prisma.space.findFirst({
                    where: { id: resourceId, tenantId },
                    select: { name: true },
                });
                return space?.name || 'Unknown Space';
            case client_1.UsageResourceType.SERVICE_CONSUMPTION:
                const service = await prisma_1.prisma.service.findFirst({
                    where: { id: resourceId, tenantId },
                    select: { name: true },
                });
                return service?.name || 'Unknown Service';
            case client_1.UsageResourceType.MEMBERSHIP_PLAN:
                const plan = await prisma_1.prisma.plan.findFirst({
                    where: { id: resourceId, tenantId },
                    select: { name: true },
                });
                return plan?.name || 'Unknown Plan';
            default:
                return 'Unknown Resource';
        }
    }
    getBillingPeriod(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    parsePeriod(period) {
        const [year, month] = period.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        return { startDate, endDate };
    }
    getPreviousPeriod(period) {
        const [year, month] = period.split('-').map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const startDate = new Date(prevYear, prevMonth - 1, 1);
        const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);
        return { startDate, endDate };
    }
    calculateUsageTrend(records) {
        if (records.length < 2)
            return 'stable';
        const sortedRecords = records.sort((a, b) => a.usageDate.getTime() - b.usageDate.getTime());
        const midpoint = Math.floor(records.length / 2);
        const firstHalf = sortedRecords.slice(0, midpoint);
        const secondHalf = sortedRecords.slice(midpoint);
        const firstHalfAvg = firstHalf.reduce((sum, r) => sum + parseFloat(r.quantity.toString()), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, r) => sum + parseFloat(r.quantity.toString()), 0) / secondHalf.length;
        const changeThreshold = 0.1;
        const percentageChange = Math.abs(secondHalfAvg - firstHalfAvg) / firstHalfAvg;
        if (percentageChange < changeThreshold)
            return 'stable';
        return secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
    }
    groupByResourceType(records, totalCost) {
        const grouped = records.reduce((acc, record) => {
            const type = record.resourceType;
            if (!acc[type]) {
                acc[type] = {
                    quantity: 0,
                    cost: 0,
                    percentage: 0,
                };
            }
            acc[type].quantity += parseFloat(record.quantity.toString());
            acc[type].cost += parseFloat(record.totalCost.toString());
            return acc;
        }, {});
        Object.keys(grouped).forEach(type => {
            grouped[type].percentage = totalCost > 0
                ? (grouped[type].cost / totalCost) * 100
                : 0;
        });
        return grouped;
    }
    async getTopResources(tenantId, records) {
        const resourceTotals = records.reduce((acc, record) => {
            const key = record.resourceId;
            if (!acc[key]) {
                acc[key] = {
                    resourceId: record.resourceId,
                    resourceType: record.resourceType,
                    quantity: 0,
                    cost: 0,
                };
            }
            acc[key].quantity += parseFloat(record.quantity.toString());
            acc[key].cost += parseFloat(record.totalCost.toString());
            return acc;
        }, {});
        const topResources = Object.values(resourceTotals)
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 10);
        for (const resource of topResources) {
            resource.resourceName = await this.getResourceName(tenantId, resource.resourceType, resource.resourceId);
        }
        return topResources;
    }
    async updateConsumptionMetrics(tenantId, data) {
    }
}
exports.ConsumptionTrackingService = ConsumptionTrackingService;
exports.consumptionTrackingService = new ConsumptionTrackingService();
//# sourceMappingURL=consumptionTrackingService.js.map
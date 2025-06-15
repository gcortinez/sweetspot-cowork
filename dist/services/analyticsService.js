"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class AnalyticsService {
    getDateRange(period) {
        const now = new Date();
        let from;
        switch (period) {
            case '7d':
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'ytd':
                from = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        return { from, to: now };
    }
    async getCrmOverview(tenantId, period = '30d') {
        const dateRange = this.getDateRange(period);
        const [totalLeads, totalClients, totalOpportunities, totalActivities, totalConversions, wonOpportunities, activeUsers,] = await Promise.all([
            prisma_1.prisma.lead.count({ where: { tenantId } }),
            prisma_1.prisma.client.count({ where: { tenantId } }),
            prisma_1.prisma.opportunity.count({ where: { tenantId } }),
            prisma_1.prisma.activity.count({ where: { tenantId } }),
            prisma_1.prisma.leadConversion.count({ where: { tenantId } }),
            prisma_1.prisma.opportunity.findMany({
                where: { tenantId, stage: 'CLOSED_WON' },
                select: { value: true, createdAt: true, updatedAt: true },
            }),
            prisma_1.prisma.user.count({
                where: {
                    tenantId,
                    lastActiveAt: { gte: dateRange.from }
                }
            }),
        ]);
        const totalRevenue = wonOpportunities.reduce((sum, opp) => sum + opp.value, 0);
        const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
        const averageDealSize = wonOpportunities.length > 0 ? totalRevenue / wonOpportunities.length : 0;
        const averageSalesCycle = wonOpportunities.length > 0
            ? wonOpportunities.reduce((sum, opp) => {
                const cycleDays = (opp.updatedAt.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                return sum + cycleDays;
            }, 0) / wonOpportunities.length
            : 0;
        return {
            totalLeads,
            totalClients,
            totalOpportunities,
            totalActivities,
            totalConversions,
            totalRevenue,
            conversionRate,
            averageDealSize,
            averageSalesCycle,
            activeUsers,
        };
    }
    async getLeadAnalytics(tenantId, period = '30d') {
        const dateRange = this.getDateRange(period);
        const [totalLeads, newLeads, qualifiedLeads, convertedLeads, lostLeads, allLeads, sourceStats, statusStats,] = await Promise.all([
            prisma_1.prisma.lead.count({ where: { tenantId } }),
            prisma_1.prisma.lead.count({
                where: { tenantId, createdAt: { gte: dateRange.from, lte: dateRange.to } }
            }),
            prisma_1.prisma.lead.count({ where: { tenantId, status: 'QUALIFIED' } }),
            prisma_1.prisma.lead.count({ where: { tenantId, status: 'CONVERTED' } }),
            prisma_1.prisma.lead.count({ where: { tenantId, status: 'LOST' } }),
            prisma_1.prisma.lead.findMany({
                where: { tenantId },
                select: { score: true },
            }),
            prisma_1.prisma.lead.groupBy({
                by: ['source'],
                where: { tenantId },
                _count: { source: true },
            }),
            prisma_1.prisma.lead.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
            }),
        ]);
        const averageLeadScore = allLeads.length > 0
            ? allLeads.reduce((sum, lead) => sum + lead.score, 0) / allLeads.length
            : 0;
        const leadsBySource = await Promise.all(sourceStats.map(async ({ source, _count }) => {
            const conversions = await prisma_1.prisma.leadConversion.count({
                where: {
                    tenantId,
                    lead: { source },
                },
            });
            return {
                source,
                count: _count.source,
                percentage: totalLeads > 0 ? (_count.source / totalLeads) * 100 : 0,
                conversionRate: _count.source > 0 ? (conversions / _count.source) * 100 : 0,
            };
        }));
        const leadsByStatus = statusStats.map(({ status, _count }) => ({
            status,
            count: _count.status,
            percentage: totalLeads > 0 ? (_count.status / totalLeads) * 100 : 0,
        }));
        const leadTrends = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(dateRange.to.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            const [dayNewLeads, dayQualified, dayConversions] = await Promise.all([
                prisma_1.prisma.lead.count({
                    where: { tenantId, createdAt: { gte: date, lt: nextDate } }
                }),
                prisma_1.prisma.lead.count({
                    where: { tenantId, status: 'QUALIFIED', updatedAt: { gte: date, lt: nextDate } }
                }),
                prisma_1.prisma.leadConversion.count({
                    where: { tenantId, createdAt: { gte: date, lt: nextDate } }
                }),
            ]);
            leadTrends.push({
                date: date.toISOString().split('T')[0],
                newLeads: dayNewLeads,
                qualifiedLeads: dayQualified,
                conversions: dayConversions,
            });
        }
        return {
            totalLeads,
            newLeads,
            qualifiedLeads,
            convertedLeads,
            lostLeads,
            averageLeadScore,
            leadsBySource,
            leadsByStatus,
            leadTrends,
        };
    }
    async getSalesAnalytics(tenantId, period = '30d') {
        const dateRange = this.getDateRange(period);
        const [totalOpportunities, wonOpportunities, lostOpportunities, allOpportunities, stageStats,] = await Promise.all([
            prisma_1.prisma.opportunity.count({ where: { tenantId } }),
            prisma_1.prisma.opportunity.findMany({
                where: { tenantId, stage: 'CLOSED_WON' },
                select: { value: true, assignedToId: true },
                include: {
                    assignedTo: {
                        select: { firstName: true, lastName: true },
                    },
                },
            }),
            prisma_1.prisma.opportunity.findMany({
                where: { tenantId, stage: 'CLOSED_LOST' },
                select: { value: true },
            }),
            prisma_1.prisma.opportunity.findMany({
                where: { tenantId },
                select: { value: true, probability: true, stage: true },
            }),
            prisma_1.prisma.opportunity.groupBy({
                by: ['stage'],
                where: { tenantId },
                _count: { stage: true },
                _sum: { value: true },
            }),
        ]);
        const totalValue = allOpportunities.reduce((sum, opp) => sum + opp.value, 0);
        const wonValue = wonOpportunities.reduce((sum, opp) => sum + opp.value, 0);
        const lostValue = lostOpportunities.reduce((sum, opp) => sum + opp.value, 0);
        const winRate = totalOpportunities > 0 ? (wonOpportunities.length / totalOpportunities) * 100 : 0;
        const averageDealSize = wonOpportunities.length > 0 ? wonValue / wonOpportunities.length : 0;
        const pipelineValue = allOpportunities
            .filter(opp => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage))
            .reduce((sum, opp) => sum + opp.value, 0);
        const forecastedRevenue = allOpportunities
            .filter(opp => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage))
            .reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
        const opportunitiesByStage = stageStats.map(({ stage, _count, _sum }) => ({
            stage,
            count: _count.stage,
            value: _sum.value || 0,
            percentage: totalOpportunities > 0 ? (_count.stage / totalOpportunities) * 100 : 0,
        }));
        const performerMap = new Map();
        wonOpportunities.forEach(opp => {
            if (opp.assignedToId) {
                const key = opp.assignedToId;
                if (!performerMap.has(key)) {
                    performerMap.set(key, {
                        userId: key,
                        userName: opp.assignedTo ? `${opp.assignedTo.firstName} ${opp.assignedTo.lastName}` : 'Unknown',
                        opportunitiesWon: 0,
                        totalValue: 0,
                    });
                }
                const performer = performerMap.get(key);
                performer.opportunitiesWon++;
                performer.totalValue += opp.value;
            }
        });
        const topPerformers = Array.from(performerMap.values())
            .map(async (performer) => {
            const totalAssigned = await prisma_1.prisma.opportunity.count({
                where: { tenantId, assignedToId: performer.userId },
            });
            return {
                ...performer,
                conversionRate: totalAssigned > 0 ? (performer.opportunitiesWon / totalAssigned) * 100 : 0,
            };
        });
        const resolvedTopPerformers = await Promise.all(topPerformers);
        const salesTrends = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(dateRange.to.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            const [dayOpportunities, dayWonDeals] = await Promise.all([
                prisma_1.prisma.opportunity.findMany({
                    where: { tenantId, createdAt: { gte: date, lt: nextDate } },
                    select: { value: true },
                }),
                prisma_1.prisma.opportunity.findMany({
                    where: {
                        tenantId,
                        stage: 'CLOSED_WON',
                        updatedAt: { gte: date, lt: nextDate }
                    },
                    select: { value: true },
                }),
            ]);
            salesTrends.push({
                date: date.toISOString().split('T')[0],
                opportunities: dayOpportunities.length,
                value: dayOpportunities.reduce((sum, opp) => sum + opp.value, 0),
                wonDeals: dayWonDeals.length,
                wonValue: dayWonDeals.reduce((sum, opp) => sum + opp.value, 0),
            });
        }
        return {
            totalOpportunities,
            totalValue,
            wonOpportunities: wonOpportunities.length,
            wonValue,
            lostOpportunities: lostOpportunities.length,
            lostValue,
            winRate,
            averageDealSize,
            averageSalesCycle: 0,
            pipelineValue,
            forecastedRevenue,
            opportunitiesByStage,
            salesTrends,
            topPerformers: resolvedTopPerformers.sort((a, b) => b.totalValue - a.totalValue).slice(0, 10),
        };
    }
    async getActivityAnalytics(tenantId, period = '30d') {
        const dateRange = this.getDateRange(period);
        const [totalActivities, completedActivities, pendingActivities, overdueActivities, typeStats, userStats,] = await Promise.all([
            prisma_1.prisma.activity.count({ where: { tenantId } }),
            prisma_1.prisma.activity.count({ where: { tenantId, status: 'COMPLETED' } }),
            prisma_1.prisma.activity.count({ where: { tenantId, status: 'PENDING' } }),
            prisma_1.prisma.activity.count({
                where: {
                    tenantId,
                    status: 'PENDING',
                    scheduledAt: { lt: new Date() },
                },
            }),
            prisma_1.prisma.activity.groupBy({
                by: ['type'],
                where: { tenantId },
                _count: { type: true },
            }),
            prisma_1.prisma.activity.groupBy({
                by: ['userId'],
                where: { tenantId },
                _count: { userId: true },
            }),
        ]);
        const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
        const activitiesByType = await Promise.all(typeStats.map(async ({ type, _count }) => {
            const completed = await prisma_1.prisma.activity.count({
                where: { tenantId, type, status: 'COMPLETED' },
            });
            return {
                type,
                count: _count.type,
                percentage: totalActivities > 0 ? (_count.type / totalActivities) * 100 : 0,
                completionRate: _count.type > 0 ? (completed / _count.type) * 100 : 0,
            };
        }));
        const userIds = userStats.map(stat => stat.userId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true },
        });
        const activitiesByUser = await Promise.all(userStats.map(async ({ userId, _count }) => {
            const user = users.find(u => u.id === userId);
            const completed = await prisma_1.prisma.activity.count({
                where: { tenantId, userId, status: 'COMPLETED' },
            });
            return {
                userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                totalActivities: _count.userId,
                completedActivities: completed,
                completionRate: _count.userId > 0 ? (completed / _count.userId) * 100 : 0,
            };
        }));
        const activityTrends = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(dateRange.to.getTime() - i * 24 * 60 * 60 * 1000);
            const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
            const [dayTotal, dayCompleted] = await Promise.all([
                prisma_1.prisma.activity.count({
                    where: { tenantId, createdAt: { gte: date, lt: nextDate } }
                }),
                prisma_1.prisma.activity.count({
                    where: {
                        tenantId,
                        status: 'COMPLETED',
                        completedAt: { gte: date, lt: nextDate }
                    }
                }),
            ]);
            activityTrends.push({
                date: date.toISOString().split('T')[0],
                total: dayTotal,
                completed: dayCompleted,
                completionRate: dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0,
            });
        }
        return {
            totalActivities,
            completedActivities,
            pendingActivities,
            overdueActivities,
            completionRate,
            averageResponseTime: 2.5,
            activitiesByType,
            activitiesByUser,
            activityTrends,
        };
    }
    async getUserPerformance(tenantId, period = '30d') {
        const dateRange = this.getDateRange(period);
        const users = await prisma_1.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });
        const userPerformance = await Promise.all(users.map(async (user) => {
            const [leadsAssigned, leadsConverted, opportunitiesAssigned, opportunitiesWon, activitiesCompleted, totalActivities,] = await Promise.all([
                prisma_1.prisma.lead.count({ where: { tenantId, assignedToId: user.id } }),
                prisma_1.prisma.leadConversion.count({ where: { tenantId, convertedById: user.id } }),
                prisma_1.prisma.opportunity.count({ where: { tenantId, assignedToId: user.id } }),
                prisma_1.prisma.opportunity.count({
                    where: { tenantId, assignedToId: user.id, stage: 'CLOSED_WON' }
                }),
                prisma_1.prisma.activity.count({
                    where: { tenantId, userId: user.id, status: 'COMPLETED' }
                }),
                prisma_1.prisma.activity.count({ where: { tenantId, userId: user.id } }),
            ]);
            const wonOpportunities = await prisma_1.prisma.opportunity.findMany({
                where: { tenantId, assignedToId: user.id, stage: 'CLOSED_WON' },
                select: { value: true },
            });
            const conversionRate = leadsAssigned > 0 ? (leadsConverted / leadsAssigned) * 100 : 0;
            const winRate = opportunitiesAssigned > 0 ? (opportunitiesWon / opportunitiesAssigned) * 100 : 0;
            const totalRevenue = wonOpportunities.reduce((sum, opp) => sum + opp.value, 0);
            const activityCompletionRate = totalActivities > 0 ? (activitiesCompleted / totalActivities) * 100 : 0;
            const performanceScore = Math.round((conversionRate * 0.3) +
                (winRate * 0.3) +
                (activityCompletionRate * 0.2) +
                (Math.min(totalRevenue / 10000, 100) * 0.2));
            return {
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`,
                userEmail: user.email,
                leadsAssigned,
                leadsConverted,
                conversionRate,
                opportunitiesAssigned,
                opportunitiesWon,
                winRate,
                totalRevenue,
                activitiesCompleted,
                activityCompletionRate,
                averageResponseTime: 2.5,
                performanceScore,
            };
        }));
        return userPerformance.sort((a, b) => b.performanceScore - a.performanceScore);
    }
    async generateCustomReport(tenantId, reportType, filters, metrics, dateRange) {
        switch (reportType) {
            case 'LEADS':
                return this.generateLeadReport(tenantId, filters, metrics, dateRange);
            case 'OPPORTUNITIES':
                return this.generateOpportunityReport(tenantId, filters, metrics, dateRange);
            case 'ACTIVITIES':
                return this.generateActivityReport(tenantId, filters, metrics, dateRange);
            case 'CONVERSIONS':
                return this.generateConversionReport(tenantId, filters, metrics, dateRange);
            default:
                throw new errors_1.ValidationError('Invalid report type');
        }
    }
    async generateLeadReport(tenantId, filters, metrics, dateRange) {
        const where = {
            tenantId,
            createdAt: { gte: dateRange.from, lte: dateRange.to }
        };
        if (filters.source)
            where.source = filters.source;
        if (filters.status)
            where.status = filters.status;
        if (filters.assignedToId)
            where.assignedToId = filters.assignedToId;
        const leads = await prisma_1.prisma.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { firstName: true, lastName: true },
                },
                conversions: true,
            },
        });
        return {
            reportType: 'LEADS',
            filters,
            metrics,
            dateRange,
            data: leads,
            summary: {
                totalLeads: leads.length,
                averageScore: leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length || 0,
                conversionRate: leads.filter(lead => lead.conversions.length > 0).length / leads.length * 100 || 0,
            },
        };
    }
    async generateOpportunityReport(tenantId, filters, metrics, dateRange) {
        const where = {
            tenantId,
            createdAt: { gte: dateRange.from, lte: dateRange.to }
        };
        if (filters.stage)
            where.stage = filters.stage;
        if (filters.assignedToId)
            where.assignedToId = filters.assignedToId;
        const opportunities = await prisma_1.prisma.opportunity.findMany({
            where,
            include: {
                assignedTo: {
                    select: { firstName: true, lastName: true },
                },
                client: {
                    select: { name: true },
                },
            },
        });
        return {
            reportType: 'OPPORTUNITIES',
            filters,
            metrics,
            dateRange,
            data: opportunities,
            summary: {
                totalOpportunities: opportunities.length,
                totalValue: opportunities.reduce((sum, opp) => sum + opp.value, 0),
                averageDealSize: opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length || 0,
                winRate: opportunities.filter(opp => opp.stage === 'CLOSED_WON').length / opportunities.length * 100 || 0,
            },
        };
    }
    async generateActivityReport(tenantId, filters, metrics, dateRange) {
        const where = {
            tenantId,
            createdAt: { gte: dateRange.from, lte: dateRange.to }
        };
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        if (filters.userId)
            where.userId = filters.userId;
        const activities = await prisma_1.prisma.activity.findMany({
            where,
            include: {
                user: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
        return {
            reportType: 'ACTIVITIES',
            filters,
            metrics,
            dateRange,
            data: activities,
            summary: {
                totalActivities: activities.length,
                completedActivities: activities.filter(act => act.status === 'COMPLETED').length,
                completionRate: activities.filter(act => act.status === 'COMPLETED').length / activities.length * 100 || 0,
            },
        };
    }
    async generateConversionReport(tenantId, filters, metrics, dateRange) {
        const where = {
            tenantId,
            createdAt: { gte: dateRange.from, lte: dateRange.to }
        };
        if (filters.convertedById)
            where.convertedById = filters.convertedById;
        const conversions = await prisma_1.prisma.leadConversion.findMany({
            where,
            include: {
                lead: {
                    select: { firstName: true, lastName: true, source: true, score: true },
                },
                client: {
                    select: { name: true },
                },
                convertedBy: {
                    select: { firstName: true, lastName: true },
                },
                opportunity: {
                    select: { title: true, value: true },
                },
            },
        });
        return {
            reportType: 'CONVERSIONS',
            filters,
            metrics,
            dateRange,
            data: conversions,
            summary: {
                totalConversions: conversions.length,
                averageLeadScore: conversions.reduce((sum, conv) => sum + conv.lead.score, 0) / conversions.length || 0,
                totalOpportunityValue: conversions.reduce((sum, conv) => sum + (conv.opportunity?.value || 0), 0),
            },
        };
    }
}
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map
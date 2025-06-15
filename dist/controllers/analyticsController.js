"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = void 0;
const zod_1 = require("zod");
const analyticsService_1 = require("../services/analyticsService");
const response_1 = require("../utils/response");
const analyticsQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['7d', '30d', '90d', '1y', 'ytd']).optional().default('30d'),
    dateFrom: zod_1.z.string().datetime().optional(),
    dateTo: zod_1.z.string().datetime().optional(),
});
const customReportSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Report name is required'),
    description: zod_1.z.string().optional(),
    reportType: zod_1.z.enum(['LEADS', 'OPPORTUNITIES', 'ACTIVITIES', 'CONVERSIONS', 'CUSTOM']),
    filters: zod_1.z.record(zod_1.z.any()).optional().default({}),
    metrics: zod_1.z.array(zod_1.z.string()).min(1, 'At least one metric is required'),
    dateFrom: zod_1.z.string().datetime(),
    dateTo: zod_1.z.string().datetime(),
});
const userPerformanceQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
    userId: zod_1.z.string().optional(),
});
class AnalyticsController {
    async getCrmOverview(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const overview = await analyticsService_1.analyticsService.getCrmOverview(tenantId, query.period);
            return overview;
        }, res);
    }
    async getLeadAnalytics(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const analytics = await analyticsService_1.analyticsService.getLeadAnalytics(tenantId, query.period);
            return analytics;
        }, res);
    }
    async getSalesAnalytics(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const analytics = await analyticsService_1.analyticsService.getSalesAnalytics(tenantId, query.period);
            return analytics;
        }, res);
    }
    async getActivityAnalytics(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const analytics = await analyticsService_1.analyticsService.getActivityAnalytics(tenantId, query.period);
            return analytics;
        }, res);
    }
    async getUserPerformance(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = userPerformanceQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const performance = await analyticsService_1.analyticsService.getUserPerformance(tenantId, query.period);
            return performance;
        }, res);
    }
    async getUserPerformanceById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { userId } = req.params;
            const query = userPerformanceQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const allPerformance = await analyticsService_1.analyticsService.getUserPerformance(tenantId, query.period);
            const userPerformance = allPerformance.find(p => p.userId === userId);
            if (!userPerformance) {
                throw new Error('User performance data not found');
            }
            return userPerformance;
        }, res);
    }
    async generateCustomReport(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = customReportSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const dateRange = {
                from: new Date(data.dateFrom),
                to: new Date(data.dateTo),
            };
            const report = await analyticsService_1.analyticsService.generateCustomReport(tenantId, data.reportType, data.filters, data.metrics, dateRange);
            return {
                id: `report_${Date.now()}`,
                name: data.name,
                description: data.description,
                reportType: data.reportType,
                filters: data.filters,
                metrics: data.metrics,
                dateRange,
                generatedAt: new Date(),
                ...report,
            };
        }, res, 201);
    }
    async getAnalyticsDashboard(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const [overview, leadAnalytics, salesAnalytics, activityAnalytics, userPerformance] = await Promise.all([
                analyticsService_1.analyticsService.getCrmOverview(tenantId, query.period),
                analyticsService_1.analyticsService.getLeadAnalytics(tenantId, query.period),
                analyticsService_1.analyticsService.getSalesAnalytics(tenantId, query.period),
                analyticsService_1.analyticsService.getActivityAnalytics(tenantId, query.period),
                analyticsService_1.analyticsService.getUserPerformance(tenantId, query.period),
            ]);
            return {
                period: query.period,
                generatedAt: new Date(),
                overview,
                leads: {
                    total: leadAnalytics.totalLeads,
                    new: leadAnalytics.newLeads,
                    qualified: leadAnalytics.qualifiedLeads,
                    converted: leadAnalytics.convertedLeads,
                    averageScore: leadAnalytics.averageLeadScore,
                    bySource: leadAnalytics.leadsBySource.slice(0, 5),
                    trends: leadAnalytics.leadTrends.slice(-7),
                },
                sales: {
                    total: salesAnalytics.totalOpportunities,
                    won: salesAnalytics.wonOpportunities,
                    winRate: salesAnalytics.winRate,
                    totalValue: salesAnalytics.totalValue,
                    pipelineValue: salesAnalytics.pipelineValue,
                    forecastedRevenue: salesAnalytics.forecastedRevenue,
                    byStage: salesAnalytics.opportunitiesByStage,
                    topPerformers: salesAnalytics.topPerformers.slice(0, 5),
                },
                activities: {
                    total: activityAnalytics.totalActivities,
                    completed: activityAnalytics.completedActivities,
                    pending: activityAnalytics.pendingActivities,
                    overdue: activityAnalytics.overdueActivities,
                    completionRate: activityAnalytics.completionRate,
                    byType: activityAnalytics.activitiesByType.slice(0, 5),
                },
                performance: {
                    topPerformers: userPerformance.slice(0, 5),
                    averagePerformanceScore: userPerformance.length > 0
                        ? userPerformance.reduce((sum, p) => sum + p.performanceScore, 0) / userPerformance.length
                        : 0,
                },
            };
        }, res);
    }
    async getTrends(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const [leadAnalytics, salesAnalytics, activityAnalytics] = await Promise.all([
                analyticsService_1.analyticsService.getLeadAnalytics(tenantId, query.period),
                analyticsService_1.analyticsService.getSalesAnalytics(tenantId, query.period),
                analyticsService_1.analyticsService.getActivityAnalytics(tenantId, query.period),
            ]);
            return {
                period: query.period,
                leads: leadAnalytics.leadTrends,
                sales: salesAnalytics.salesTrends,
                activities: activityAnalytics.activityTrends,
            };
        }, res);
    }
    async getConversionFunnel(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const [leadAnalytics, salesAnalytics] = await Promise.all([
                analyticsService_1.analyticsService.getLeadAnalytics(tenantId, query.period),
                analyticsService_1.analyticsService.getSalesAnalytics(tenantId, query.period),
            ]);
            const funnel = [
                {
                    stage: 'Total Leads',
                    count: leadAnalytics.totalLeads,
                    percentage: 100,
                    dropOff: 0,
                },
                {
                    stage: 'Qualified Leads',
                    count: leadAnalytics.qualifiedLeads,
                    percentage: leadAnalytics.totalLeads > 0 ? (leadAnalytics.qualifiedLeads / leadAnalytics.totalLeads) * 100 : 0,
                    dropOff: leadAnalytics.totalLeads > 0 ? ((leadAnalytics.totalLeads - leadAnalytics.qualifiedLeads) / leadAnalytics.totalLeads) * 100 : 0,
                },
                {
                    stage: 'Opportunities Created',
                    count: salesAnalytics.totalOpportunities,
                    percentage: leadAnalytics.totalLeads > 0 ? (salesAnalytics.totalOpportunities / leadAnalytics.totalLeads) * 100 : 0,
                    dropOff: leadAnalytics.totalLeads > 0 ? ((leadAnalytics.totalLeads - salesAnalytics.totalOpportunities) / leadAnalytics.totalLeads) * 100 : 0,
                },
                {
                    stage: 'Deals Won',
                    count: salesAnalytics.wonOpportunities,
                    percentage: leadAnalytics.totalLeads > 0 ? (salesAnalytics.wonOpportunities / leadAnalytics.totalLeads) * 100 : 0,
                    dropOff: leadAnalytics.totalLeads > 0 ? ((leadAnalytics.totalLeads - salesAnalytics.wonOpportunities) / leadAnalytics.totalLeads) * 100 : 0,
                },
            ];
            return {
                period: query.period,
                funnel,
                overallConversionRate: leadAnalytics.totalLeads > 0 ? (salesAnalytics.wonOpportunities / leadAnalytics.totalLeads) * 100 : 0,
                totalRevenue: salesAnalytics.wonValue,
            };
        }, res);
    }
    async exportAnalytics(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = analyticsQuerySchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const dashboard = await this.getAnalyticsDashboard(req, res);
            return {
                exportType: 'ANALYTICS_SUMMARY',
                period: query.period,
                exportedAt: new Date(),
                exportedBy: {
                    id: req.user.id,
                    email: req.user.email,
                },
                data: dashboard,
            };
        }, res);
    }
}
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analyticsController.js.map
import { Response } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services/analyticsService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';

// Analytics query schema
const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'ytd']).optional().default('30d'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Custom report schema
const customReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  reportType: z.enum(['LEADS', 'OPPORTUNITIES', 'ACTIVITIES', 'CONVERSIONS', 'CUSTOM']),
  filters: z.record(z.any()).optional().default({}),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});

// User performance query schema
const userPerformanceQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  userId: z.string().optional(),
});

class AnalyticsController {
  // GET /api/analytics/overview
  async getCrmOverview(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const overview = await analyticsService.getCrmOverview(tenantId, query.period);
      return overview;
    }, res);
  }

  // GET /api/analytics/leads
  async getLeadAnalytics(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const analytics = await analyticsService.getLeadAnalytics(tenantId, query.period);
      return analytics;
    }, res);
  }

  // GET /api/analytics/sales
  async getSalesAnalytics(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const analytics = await analyticsService.getSalesAnalytics(tenantId, query.period);
      return analytics;
    }, res);
  }

  // GET /api/analytics/activities
  async getActivityAnalytics(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const analytics = await analyticsService.getActivityAnalytics(tenantId, query.period);
      return analytics;
    }, res);
  }

  // GET /api/analytics/performance
  async getUserPerformance(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = userPerformanceQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const performance = await analyticsService.getUserPerformance(tenantId, query.period);
      return performance;
    }, res);
  }

  // GET /api/analytics/performance/:userId
  async getUserPerformanceById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { userId } = req.params;
      const query = userPerformanceQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const allPerformance = await analyticsService.getUserPerformance(tenantId, query.period);
      const userPerformance = allPerformance.find(p => p.userId === userId);
      
      if (!userPerformance) {
        throw new Error('User performance data not found');
      }
      
      return userPerformance;
    }, res);
  }

  // POST /api/analytics/reports
  async generateCustomReport(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = customReportSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const dateRange = {
        from: new Date(data.dateFrom),
        to: new Date(data.dateTo),
      };
      
      const report = await analyticsService.generateCustomReport(
        tenantId,
        data.reportType,
        data.filters,
        data.metrics,
        dateRange
      );
      
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

  // GET /api/analytics/dashboard
  async getAnalyticsDashboard(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      // Get all main analytics in parallel
      const [overview, leadAnalytics, salesAnalytics, activityAnalytics, userPerformance] = await Promise.all([
        analyticsService.getCrmOverview(tenantId, query.period),
        analyticsService.getLeadAnalytics(tenantId, query.period),
        analyticsService.getSalesAnalytics(tenantId, query.period),
        analyticsService.getActivityAnalytics(tenantId, query.period),
        analyticsService.getUserPerformance(tenantId, query.period),
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
          trends: leadAnalytics.leadTrends.slice(-7), // Last 7 days
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

  // GET /api/analytics/trends
  async getTrends(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const [leadAnalytics, salesAnalytics, activityAnalytics] = await Promise.all([
        analyticsService.getLeadAnalytics(tenantId, query.period),
        analyticsService.getSalesAnalytics(tenantId, query.period),
        analyticsService.getActivityAnalytics(tenantId, query.period),
      ]);
      
      return {
        period: query.period,
        leads: leadAnalytics.leadTrends,
        sales: salesAnalytics.salesTrends,
        activities: activityAnalytics.activityTrends,
      };
    }, res);
  }

  // GET /api/analytics/funnel
  async getConversionFunnel(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = analyticsQuerySchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const [leadAnalytics, salesAnalytics] = await Promise.all([
        analyticsService.getLeadAnalytics(tenantId, query.period),
        analyticsService.getSalesAnalytics(tenantId, query.period),
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

  // GET /api/analytics/export
  async exportAnalytics(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
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

export const analyticsController = new AnalyticsController();
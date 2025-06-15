import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class AnalyticsController {
    getCrmOverview(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getLeadAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getSalesAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivityAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserPerformance(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserPerformanceById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    generateCustomReport(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAnalyticsDashboard(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTrends(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getConversionFunnel(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    exportAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const analyticsController: AnalyticsController;
export {};
//# sourceMappingURL=analyticsController.d.ts.map
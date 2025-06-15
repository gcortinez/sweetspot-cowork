import { Request, Response } from 'express';
export declare class ContractAnalyticsController {
    getContractOverview(req: Request, res: Response): Promise<Response>;
    getRevenueAnalysis(req: Request, res: Response): Promise<Response>;
    getClientAnalysis(req: Request, res: Response): Promise<Response>;
    getRenewalPerformance(req: Request, res: Response): Promise<Response>;
    getContractLifecycleMetrics(req: Request, res: Response): Promise<Response>;
    getExpiryForecast(req: Request, res: Response): Promise<Response>;
    generateReport(req: Request, res: Response): Promise<Response>;
    getReportHistory(req: Request, res: Response): Promise<Response>;
    getDashboardMetrics(req: Request, res: Response): Promise<Response>;
    downloadReport(req: Request, res: Response): Promise<Response>;
    getKPIs(req: Request, res: Response): Promise<Response>;
}
export declare const contractAnalyticsController: ContractAnalyticsController;
//# sourceMappingURL=contractAnalyticsController.d.ts.map
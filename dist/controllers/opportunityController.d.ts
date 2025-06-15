import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class OpportunityController {
    getOpportunities(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getOpportunityById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createOpportunity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateOpportunity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteOpportunity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateStage(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    assignOpportunity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPipelineStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPipelineFunnel(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createFromLead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const opportunityController: OpportunityController;
export {};
//# sourceMappingURL=opportunityController.d.ts.map
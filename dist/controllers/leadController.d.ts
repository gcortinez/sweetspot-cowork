import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class LeadController {
    getLeads(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getLeadById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createLead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateLead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteLead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    assignLead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateLeadScore(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    addLeadNote(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getLeadStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const leadController: LeadController;
export {};
//# sourceMappingURL=leadController.d.ts.map
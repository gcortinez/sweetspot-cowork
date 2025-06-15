import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class QuotationController {
    createQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getQuotations(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getQuotationById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    sendQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    acceptQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    rejectQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    markAsViewed(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    convertToContract(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    duplicateQuotation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getQuotationStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getQuotationsByClient(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getQuotationsByOpportunity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getExpiringQuotations(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const quotationController: QuotationController;
export {};
//# sourceMappingURL=quotationController.d.ts.map
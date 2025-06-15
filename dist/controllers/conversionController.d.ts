import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class ConversionController {
    convertLeadToClient(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    batchConvertLeads(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getConversions(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getConversionById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getConversionStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getConversionFunnel(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getQualifiedLeads(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    previewConversion(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserConversionPerformance(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const conversionController: ConversionController;
export {};
//# sourceMappingURL=conversionController.d.ts.map
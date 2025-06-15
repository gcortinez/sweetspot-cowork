import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class CommunicationController {
    createCommunication(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCommunications(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCommunicationById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateCommunication(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteCommunication(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCommunicationThread(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCommunicationStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    bulkDelete(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getCommunicationsByEntity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUnreadCommunications(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    exportCommunications(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const communicationController: CommunicationController;
export {};
//# sourceMappingURL=communicationController.d.ts.map
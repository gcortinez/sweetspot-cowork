import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class ActivityController {
    getActivities(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivityById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createActivity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateActivity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteActivity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    completeActivity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    bulkAction(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivityStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivityTimeline(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUpcomingActivities(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getOverdueActivities(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivitiesByEntity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const activityController: ActivityController;
export {};
//# sourceMappingURL=activityController.d.ts.map
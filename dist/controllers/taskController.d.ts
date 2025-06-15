import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
declare class TaskController {
    createTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTasks(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTaskById(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    completeTask(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTaskStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUpcomingReminders(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getMyTasks(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getOverdueTasks(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    bulkUpdateTasks(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTasksByEntity(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTasksByTag(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllTags(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTasksDueToday(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTaskDashboard(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const taskController: TaskController;
export {};
//# sourceMappingURL=taskController.d.ts.map
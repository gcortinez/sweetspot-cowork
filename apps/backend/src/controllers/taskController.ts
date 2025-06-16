import { Response } from 'express';
import { z } from 'zod';
import { taskService } from '../services/taskService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';

// Task creation schema
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().datetime(),
  reminderDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  activityId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

// Task update schema
const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  reminderDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

// Query tasks schema
const queryTasksSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
  entityType: z.enum(['LEAD', 'CLIENT', 'OPPORTUNITY', 'ACTIVITY']).optional(),
  entityId: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  overdue: z.string().transform(val => val === 'true').optional(),
  searchTerm: z.string().optional(),
  tags: z.string().transform(val => val.split(',').filter(Boolean)).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Complete task schema
const completeTaskSchema = z.object({
  actualHours: z.number().min(0).optional(),
});

// Bulk update schema
const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
  updates: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

class TaskController {
  // POST /api/tasks
  async createTask(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = createTaskSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const createdById = req.user.id;
      
      const task = await taskService.createTask(tenantId, createdById, data);
      return task;
    }, res, 201);
  }

  // GET /api/tasks
  async getTasks(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryTasksSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const result = await taskService.getTasks(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/tasks/:id
  async getTaskById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const task = await taskService.getTaskById(tenantId, id);
      return task;
    }, res);
  }

  // PUT /api/tasks/:id
  async updateTask(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = updateTaskSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const task = await taskService.updateTask(tenantId, id, data);
      return task;
    }, res);
  }

  // DELETE /api/tasks/:id
  async deleteTask(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const result = await taskService.deleteTask(tenantId, id);
      return result;
    }, res);
  }

  // POST /api/tasks/:id/complete
  async completeTask(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = completeTaskSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const completedById = req.user.id;
      
      const task = await taskService.completeTask(tenantId, id, completedById, data.actualHours);
      return task;
    }, res);
  }

  // GET /api/tasks/stats
  async getTaskStats(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const stats = await taskService.getTaskStats(tenantId);
      return stats;
    }, res);
  }

  // GET /api/tasks/reminders
  async getUpcomingReminders(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const userId = req.query.userId as string || req.user.id;
      
      const reminders = await taskService.getUpcomingReminders(tenantId, userId);
      return reminders;
    }, res);
  }

  // GET /api/tasks/my-tasks
  async getMyTasks(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryTasksSchema.parse({
        ...req.query,
        assignedToId: req.user.id,
      });
      const tenantId = req.user.tenantId;
      
      const result = await taskService.getTasks(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/tasks/overdue
  async getOverdueTasks(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryTasksSchema.parse({
        ...req.query,
        overdue: 'true',
      });
      const tenantId = req.user.tenantId;
      
      const result = await taskService.getTasks(tenantId, query);
      return result;
    }, res);
  }

  // POST /api/tasks/bulk-update
  async bulkUpdateTasks(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = bulkUpdateSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const result = await taskService.bulkUpdateTasks(tenantId, data.taskIds, data.updates);
      return result;
    }, res);
  }

  // GET /api/tasks/by-entity/:entityType/:entityId
  async getTasksByEntity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { entityType, entityId } = req.params;
      
      // Validate entityType
      if (!['LEAD', 'CLIENT', 'OPPORTUNITY', 'ACTIVITY'].includes(entityType)) {
        throw new Error('Invalid entity type');
      }
      
      const query = queryTasksSchema.parse({
        ...req.query,
        entityType,
        entityId,
      });
      const tenantId = req.user.tenantId;
      
      const result = await taskService.getTasks(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/tasks/by-tag/:tag
  async getTasksByTag(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { tag } = req.params;
      const tenantId = req.user.tenantId;
      
      const tasks = await taskService.getTasksByTag(tenantId, tag);
      return tasks;
    }, res);
  }

  // GET /api/tasks/tags
  async getAllTags(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const tags = await taskService.getAllTags(tenantId);
      return tags;
    }, res);
  }

  // GET /api/tasks/due-today
  async getTasksDueToday(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const query = queryTasksSchema.parse({
        ...req.query,
        dueDateFrom: startOfDay.toISOString(),
        dueDateTo: endOfDay.toISOString(),
        status: req.query.status || undefined, // Allow filtering by status
      });
      const tenantId = req.user.tenantId;
      
      const result = await taskService.getTasks(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/tasks/dashboard
  async getTaskDashboard(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      
      const [stats, myTasks, upcomingReminders, overdueTasks] = await Promise.all([
        taskService.getTaskStats(tenantId),
        taskService.getTasks(tenantId, {
          page: 1,
          limit: 5,
          assignedToId: userId,
          status: 'PENDING',
          sortBy: 'dueDate',
          sortOrder: 'asc',
        }),
        taskService.getUpcomingReminders(tenantId, userId),
        taskService.getTasks(tenantId, {
          page: 1,
          limit: 5,
          assignedToId: userId,
          overdue: true,
          sortBy: 'dueDate',
          sortOrder: 'asc',
        }),
      ]);
      
      return {
        stats,
        myTasks: myTasks.tasks,
        upcomingReminders: upcomingReminders.slice(0, 5),
        overdueTasks: overdueTasks.tasks,
      };
    }, res);
  }
}

export const taskController = new TaskController();
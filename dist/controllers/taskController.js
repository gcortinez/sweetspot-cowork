"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskController = void 0;
const zod_1 = require("zod");
const taskService_1 = require("../services/taskService");
const response_1 = require("../utils/response");
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueDate: zod_1.z.string().datetime().optional(),
    reminderDate: zod_1.z.string().datetime().optional(),
    assignedToId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    activityId: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    estimatedHours: zod_1.z.number().min(0).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    reminderDate: zod_1.z.string().datetime().optional(),
    assignedToId: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    estimatedHours: zod_1.z.number().min(0).optional(),
    actualHours: zod_1.z.number().min(0).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const queryTasksSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: zod_1.z.string().optional(),
    entityType: zod_1.z.enum(['LEAD', 'CLIENT', 'OPPORTUNITY', 'ACTIVITY']).optional(),
    entityId: zod_1.z.string().optional(),
    dueDateFrom: zod_1.z.string().datetime().optional(),
    dueDateTo: zod_1.z.string().datetime().optional(),
    overdue: zod_1.z.string().transform(val => val === 'true').optional(),
    searchTerm: zod_1.z.string().optional(),
    tags: zod_1.z.string().transform(val => val.split(',').filter(Boolean)).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'dueDate', 'priority', 'title']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
const completeTaskSchema = zod_1.z.object({
    actualHours: zod_1.z.number().min(0).optional(),
});
const bulkUpdateSchema = zod_1.z.object({
    taskIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one task ID is required'),
    updates: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        assignedToId: zod_1.z.string().optional(),
        dueDate: zod_1.z.string().datetime().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
class TaskController {
    async createTask(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createTaskSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const createdById = req.user.id;
            const task = await taskService_1.taskService.createTask(tenantId, createdById, data);
            return task;
        }, res, 201);
    }
    async getTasks(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryTasksSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.getTasks(tenantId, query);
            return result;
        }, res);
    }
    async getTaskById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const task = await taskService_1.taskService.getTaskById(tenantId, id);
            return task;
        }, res);
    }
    async updateTask(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updateTaskSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const task = await taskService_1.taskService.updateTask(tenantId, id, data);
            return task;
        }, res);
    }
    async deleteTask(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.deleteTask(tenantId, id);
            return result;
        }, res);
    }
    async completeTask(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = completeTaskSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const completedById = req.user.id;
            const task = await taskService_1.taskService.completeTask(tenantId, id, completedById, data.actualHours);
            return task;
        }, res);
    }
    async getTaskStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await taskService_1.taskService.getTaskStats(tenantId);
            return stats;
        }, res);
    }
    async getUpcomingReminders(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const userId = req.query.userId || req.user.id;
            const reminders = await taskService_1.taskService.getUpcomingReminders(tenantId, userId);
            return reminders;
        }, res);
    }
    async getMyTasks(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryTasksSchema.parse({
                ...req.query,
                assignedToId: req.user.id,
            });
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.getTasks(tenantId, query);
            return result;
        }, res);
    }
    async getOverdueTasks(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryTasksSchema.parse({
                ...req.query,
                overdue: 'true',
            });
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.getTasks(tenantId, query);
            return result;
        }, res);
    }
    async bulkUpdateTasks(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = bulkUpdateSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.bulkUpdateTasks(tenantId, data.taskIds, data.updates);
            return result;
        }, res);
    }
    async getTasksByEntity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { entityType, entityId } = req.params;
            if (!['LEAD', 'CLIENT', 'OPPORTUNITY', 'ACTIVITY'].includes(entityType)) {
                throw new Error('Invalid entity type');
            }
            const query = queryTasksSchema.parse({
                ...req.query,
                entityType,
                entityId,
            });
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.getTasks(tenantId, query);
            return result;
        }, res);
    }
    async getTasksByTag(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { tag } = req.params;
            const tenantId = req.user.tenantId;
            const tasks = await taskService_1.taskService.getTasksByTag(tenantId, tag);
            return tasks;
        }, res);
    }
    async getAllTags(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const tags = await taskService_1.taskService.getAllTags(tenantId);
            return tags;
        }, res);
    }
    async getTasksDueToday(req, res) {
        return (0, response_1.handleController)(async () => {
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
                status: req.query.status || undefined,
            });
            const tenantId = req.user.tenantId;
            const result = await taskService_1.taskService.getTasks(tenantId, query);
            return result;
        }, res);
    }
    async getTaskDashboard(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const userId = req.user.id;
            const [stats, myTasks, upcomingReminders, overdueTasks] = await Promise.all([
                taskService_1.taskService.getTaskStats(tenantId),
                taskService_1.taskService.getTasks(tenantId, {
                    page: 1,
                    limit: 5,
                    assignedToId: userId,
                    status: 'PENDING',
                    sortBy: 'dueDate',
                    sortOrder: 'asc',
                }),
                taskService_1.taskService.getUpcomingReminders(tenantId, userId),
                taskService_1.taskService.getTasks(tenantId, {
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
exports.taskController = new TaskController();
//# sourceMappingURL=taskController.js.map
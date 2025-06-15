"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityController = void 0;
const zod_1 = require("zod");
const activityService_1 = require("../services/activityService");
const response_1 = require("../utils/response");
const createActivitySchema = zod_1.z.object({
    type: zod_1.z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'TOUR', 'FOLLOW_UP', 'DOCUMENT']),
    subject: zod_1.z.string().min(1, 'Subject is required'),
    description: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    duration: zod_1.z.number().min(0, 'Duration must be positive').optional(),
    location: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    outcome: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().datetime().optional(),
});
const updateActivitySchema = createActivitySchema.partial();
const queryActivitiesSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    search: zod_1.z.string().optional(),
    type: zod_1.z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'TOUR', 'FOLLOW_UP', 'DOCUMENT']).optional(),
    clientId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    completed: zod_1.z.string().transform(val => val === 'true').optional(),
    overdue: zod_1.z.string().transform(val => val === 'true').optional(),
    dateFrom: zod_1.z.string().datetime().optional(),
    dateTo: zod_1.z.string().datetime().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'dueDate', 'completedAt', 'type']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
const bulkActionSchema = zod_1.z.object({
    activityIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one activity ID is required'),
    action: zod_1.z.enum(['complete', 'delete', 'assign']),
    assignedToId: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().datetime().optional(),
});
class ActivityController {
    async getActivities(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryActivitiesSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await activityService_1.activityService.getActivities(tenantId, query);
            return result;
        }, res);
    }
    async getActivityById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const activity = await activityService_1.activityService.getActivityById(tenantId, id);
            return activity;
        }, res);
    }
    async createActivity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createActivitySchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const userId = req.user.id;
            const activity = await activityService_1.activityService.createActivity(tenantId, userId, data);
            return activity;
        }, res, 201);
    }
    async updateActivity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updateActivitySchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const activity = await activityService_1.activityService.updateActivity(tenantId, id, data);
            return activity;
        }, res);
    }
    async deleteActivity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            await activityService_1.activityService.deleteActivity(tenantId, id);
            return { message: 'Activity deleted successfully' };
        }, res);
    }
    async completeActivity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const { outcome } = zod_1.z.object({ outcome: zod_1.z.string().optional() }).parse(req.body);
            const tenantId = req.user.tenantId;
            const activity = await activityService_1.activityService.completeActivity(tenantId, id, outcome);
            return activity;
        }, res);
    }
    async bulkAction(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = bulkActionSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const result = await activityService_1.activityService.bulkAction(tenantId, data);
            return result;
        }, res);
    }
    async getActivityStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await activityService_1.activityService.getActivityStats(tenantId);
            return stats;
        }, res);
    }
    async getActivityTimeline(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = zod_1.z.object({
                clientId: zod_1.z.string().optional(),
                leadId: zod_1.z.string().optional(),
                opportunityId: zod_1.z.string().optional(),
                days: zod_1.z.string().transform(Number).optional().default('30'),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const timeline = await activityService_1.activityService.getActivityTimeline(tenantId, query);
            return timeline;
        }, res);
    }
    async getUpcomingActivities(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = zod_1.z.object({
                days: zod_1.z.string().transform(Number).optional().default('7'),
                userId: zod_1.z.string().optional(),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const userId = query.userId || req.user.id;
            const activities = await activityService_1.activityService.getUpcomingActivities(tenantId, userId, query.days);
            return activities;
        }, res);
    }
    async getOverdueActivities(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = zod_1.z.object({
                userId: zod_1.z.string().optional(),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const userId = query.userId || req.user.id;
            const activities = await activityService_1.activityService.getOverdueActivities(tenantId, userId);
            return activities;
        }, res);
    }
    async getActivitiesByEntity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { entityType, entityId } = req.params;
            const tenantId = req.user.tenantId;
            if (!['lead', 'client', 'opportunity'].includes(entityType)) {
                throw new Error('Invalid entity type');
            }
            const activities = await activityService_1.activityService.getActivitiesByEntity(tenantId, entityType, entityId);
            return activities;
        }, res);
    }
}
exports.activityController = new ActivityController();
//# sourceMappingURL=activityController.js.map
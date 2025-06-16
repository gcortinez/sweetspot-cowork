import { Response } from 'express';
import { z } from 'zod';
import { activityService } from '../services/activityService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest, ErrorCode } from '../types/api';

// Create activity schema
const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'TOUR', 'FOLLOW_UP', 'DOCUMENT']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  duration: z.number().min(0, 'Duration must be positive').optional(), // in minutes
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  outcome: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

// Update activity schema
const updateActivitySchema = createActivitySchema.partial();

// Query activities schema
const queryActivitiesSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  search: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'TOUR', 'FOLLOW_UP', 'DOCUMENT']).optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  userId: z.string().optional(),
  completed: z.string().transform(val => val === 'true').optional(),
  overdue: z.string().transform(val => val === 'true').optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'completedAt', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Bulk action schema
const bulkActionSchema = z.object({
  activityIds: z.array(z.string()).min(1, 'At least one activity ID is required'),
  action: z.enum(['complete', 'delete', 'assign']),
  assignedToId: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

class ActivityController {
  // GET /api/activities
  async getActivities(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryActivitiesSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const result = await activityService.getActivities(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/activities/:id
  async getActivityById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const activity = await activityService.getActivityById(tenantId, id);
      return activity;
    }, res);
  }

  // POST /api/activities
  async createActivity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = createActivitySchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      
      const activity = await activityService.createActivity(tenantId, userId, data);
      return activity;
    }, res, 201);
  }

  // PUT /api/activities/:id
  async updateActivity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = updateActivitySchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const activity = await activityService.updateActivity(tenantId, id, data);
      return activity;
    }, res);
  }

  // DELETE /api/activities/:id
  async deleteActivity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      await activityService.deleteActivity(tenantId, id);
      return { message: 'Activity deleted successfully' };
    }, res);
  }

  // POST /api/activities/:id/complete
  async completeActivity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const { outcome } = z.object({ outcome: z.string().optional() }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const activity = await activityService.completeActivity(tenantId, id, outcome);
      return activity;
    }, res);
  }

  // POST /api/activities/bulk
  async bulkAction(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = bulkActionSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const result = await activityService.bulkAction(tenantId, data);
      return result;
    }, res);
  }

  // GET /api/activities/stats
  async getActivityStats(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const stats = await activityService.getActivityStats(tenantId);
      return stats;
    }, res);
  }

  // GET /api/activities/timeline
  async getActivityTimeline(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = z.object({
        clientId: z.string().optional(),
        leadId: z.string().optional(),
        opportunityId: z.string().optional(),
        days: z.string().transform(Number).optional().default('30'),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      const timeline = await activityService.getActivityTimeline(tenantId, query);
      return timeline;
    }, res);
  }

  // GET /api/activities/upcoming
  async getUpcomingActivities(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = z.object({
        days: z.string().transform(Number).optional().default('7'),
        userId: z.string().optional(),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      const userId = query.userId || req.user.id;
      
      const activities = await activityService.getUpcomingActivities(tenantId, userId, query.days);
      return activities;
    }, res);
  }

  // GET /api/activities/overdue
  async getOverdueActivities(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = z.object({
        userId: z.string().optional(),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      const userId = query.userId || req.user.id;
      
      const activities = await activityService.getOverdueActivities(tenantId, userId);
      return activities;
    }, res);
  }

  // GET /api/activities/by-entity/:entityType/:entityId
  async getActivitiesByEntity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { entityType, entityId } = req.params;
      const tenantId = req.user.tenantId;
      
      if (!['lead', 'client', 'opportunity'].includes(entityType)) {
        throw new Error('Invalid entity type');
      }
      
      const activities = await activityService.getActivitiesByEntity(tenantId, entityType as 'lead' | 'client' | 'opportunity', entityId);
      return activities;
    }, res);
  }
}

export const activityController = new ActivityController();
import { Response } from 'express';
import { z } from 'zod';
import { communicationService } from '../services/communicationService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest, ErrorCode } from '../types/api';

// Communication creation schema
const createCommunicationSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE', 'SMS', 'MEETING', 'NOTE', 'DOCUMENT', 'SOCIAL_MEDIA']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().optional(),
  fromEmail: z.string().email().optional(),
  toEmail: z.string().email().optional(),
  fromPhone: z.string().optional(),
  toPhone: z.string().optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  activityId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Communication update schema
const updateCommunicationSchema = z.object({
  subject: z.string().optional(),
  content: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Query communications schema
const queryCommunicationsSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  type: z.enum(['EMAIL', 'PHONE', 'SMS', 'MEETING', 'NOTE', 'DOCUMENT', 'SOCIAL_MEDIA']).optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  entityType: z.enum(['LEAD', 'CLIENT', 'OPPORTUNITY']).optional(),
  entityId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.enum(['createdAt', 'subject', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Communication thread schema
const communicationThreadSchema = z.object({
  entityType: z.enum(['LEAD', 'CLIENT', 'OPPORTUNITY']),
  entityId: z.string(),
});

// Bulk delete schema
const bulkDeleteSchema = z.object({
  communicationIds: z.array(z.string()).min(1, 'At least one communication ID is required'),
});

class CommunicationController {
  // POST /api/communications
  async createCommunication(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = createCommunicationSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      
      const communication = await communicationService.createCommunication(tenantId, userId, data);
      return communication;
    }, res, 201);
  }

  // GET /api/communications
  async getCommunications(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryCommunicationsSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const result = await communicationService.getCommunications(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/communications/:id
  async getCommunicationById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const communication = await communicationService.getCommunicationById(tenantId, id);
      return communication;
    }, res);
  }

  // PUT /api/communications/:id
  async updateCommunication(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = updateCommunicationSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const communication = await communicationService.updateCommunication(tenantId, id, data);
      return communication;
    }, res);
  }

  // DELETE /api/communications/:id
  async deleteCommunication(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const result = await communicationService.deleteCommunication(tenantId, id);
      return result;
    }, res);
  }

  // GET /api/communications/thread
  async getCommunicationThread(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = communicationThreadSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const thread = await communicationService.getCommunicationThread(
        tenantId, 
        query.entityType, 
        query.entityId
      );
      return thread;
    }, res);
  }

  // GET /api/communications/stats
  async getCommunicationStats(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const stats = await communicationService.getCommunicationStats(tenantId);
      return stats;
    }, res);
  }

  // POST /api/communications/:id/mark-read
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      
      const communication = await communicationService.markAsRead(tenantId, id, userId);
      return communication;
    }, res);
  }

  // POST /api/communications/bulk-delete
  async bulkDelete(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = bulkDeleteSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const result = await communicationService.bulkDelete(tenantId, data.communicationIds);
      return result;
    }, res);
  }

  // GET /api/communications/by-entity/:entityType/:entityId
  async getCommunicationsByEntity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { entityType, entityId } = req.params;
      
      // Validate entityType
      if (!['LEAD', 'CLIENT', 'OPPORTUNITY'].includes(entityType)) {
        throw new Error('Invalid entity type');
      }
      
      const query = queryCommunicationsSchema.parse({
        ...req.query,
        entityType,
        entityId,
      });
      const tenantId = req.user.tenantId;
      
      const result = await communicationService.getCommunications(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/communications/unread
  async getUnreadCommunications(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      
      // Get communications where user is not in readBy array
      const query = queryCommunicationsSchema.parse(req.query);
      
      const result = await communicationService.getCommunications(tenantId, {
        ...query,
        direction: 'INBOUND', // Only inbound communications can be "unread"
      });
      
      // Filter unread communications
      const unreadCommunications = result.communications.filter(comm => {
        const metadata = comm.metadata as Record<string, any> || {};
        const readBy = metadata.readBy || [];
        return !readBy.includes(userId);
      });
      
      return {
        communications: unreadCommunications,
        pagination: {
          ...result.pagination,
          total: unreadCommunications.length,
        },
      };
    }, res);
  }

  // GET /api/communications/export
  async exportCommunications(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryCommunicationsSchema.parse({
        ...req.query,
        limit: '1000', // Export up to 1000 communications
        page: '1',
      });
      const tenantId = req.user.tenantId;
      
      const result = await communicationService.getCommunications(tenantId, query);
      
      // Format for export
      const exportData = result.communications.map(comm => ({
        id: comm.id,
        type: comm.type,
        direction: comm.direction,
        subject: comm.subject,
        content: comm.content,
        fromEmail: comm.fromEmail,
        toEmail: comm.toEmail,
        fromPhone: comm.fromPhone,
        toPhone: comm.toPhone,
        entityType: comm.leadId ? 'LEAD' : comm.clientId ? 'CLIENT' : comm.opportunityId ? 'OPPORTUNITY' : 'NONE',
        entityName: comm.lead 
          ? `${comm.lead.firstName} ${comm.lead.lastName}`
          : comm.client 
          ? comm.client.name
          : comm.opportunity
          ? comm.opportunity.title
          : 'Unknown',
        userName: `${comm.user.firstName} ${comm.user.lastName}`,
        createdAt: comm.createdAt,
        attachments: Array.isArray(comm.attachments) ? comm.attachments.length : 0,
      }));
      
      return {
        data: exportData,
        exportedAt: new Date().toISOString(),
        totalRecords: exportData.length,
        filters: query,
      };
    }, res);
  }
}

export const communicationController = new CommunicationController();
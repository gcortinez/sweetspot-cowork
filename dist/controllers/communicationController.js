"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationController = void 0;
const zod_1 = require("zod");
const communicationService_1 = require("../services/communicationService");
const response_1 = require("../utils/response");
const createCommunicationSchema = zod_1.z.object({
    type: zod_1.z.enum(['EMAIL', 'PHONE', 'SMS', 'MEETING', 'NOTE', 'DOCUMENT', 'SOCIAL_MEDIA']),
    direction: zod_1.z.enum(['INBOUND', 'OUTBOUND']),
    subject: zod_1.z.string().min(1, 'Subject is required'),
    content: zod_1.z.string().optional(),
    fromEmail: zod_1.z.string().email().optional(),
    toEmail: zod_1.z.string().email().optional(),
    fromPhone: zod_1.z.string().optional(),
    toPhone: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    activityId: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const updateCommunicationSchema = zod_1.z.object({
    subject: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const queryCommunicationsSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    type: zod_1.z.enum(['EMAIL', 'PHONE', 'SMS', 'MEETING', 'NOTE', 'DOCUMENT', 'SOCIAL_MEDIA']).optional(),
    direction: zod_1.z.enum(['INBOUND', 'OUTBOUND']).optional(),
    entityType: zod_1.z.enum(['LEAD', 'CLIENT', 'OPPORTUNITY']).optional(),
    entityId: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().datetime().optional(),
    dateTo: zod_1.z.string().datetime().optional(),
    searchTerm: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'subject', 'type']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
const communicationThreadSchema = zod_1.z.object({
    entityType: zod_1.z.enum(['LEAD', 'CLIENT', 'OPPORTUNITY']),
    entityId: zod_1.z.string(),
});
const bulkDeleteSchema = zod_1.z.object({
    communicationIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one communication ID is required'),
});
class CommunicationController {
    async createCommunication(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createCommunicationSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const userId = req.user.id;
            const communication = await communicationService_1.communicationService.createCommunication(tenantId, userId, data);
            return communication;
        }, res, 201);
    }
    async getCommunications(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryCommunicationsSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await communicationService_1.communicationService.getCommunications(tenantId, query);
            return result;
        }, res);
    }
    async getCommunicationById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const communication = await communicationService_1.communicationService.getCommunicationById(tenantId, id);
            return communication;
        }, res);
    }
    async updateCommunication(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updateCommunicationSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const communication = await communicationService_1.communicationService.updateCommunication(tenantId, id, data);
            return communication;
        }, res);
    }
    async deleteCommunication(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const result = await communicationService_1.communicationService.deleteCommunication(tenantId, id);
            return result;
        }, res);
    }
    async getCommunicationThread(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = communicationThreadSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const thread = await communicationService_1.communicationService.getCommunicationThread(tenantId, query.entityType, query.entityId);
            return thread;
        }, res);
    }
    async getCommunicationStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await communicationService_1.communicationService.getCommunicationStats(tenantId);
            return stats;
        }, res);
    }
    async markAsRead(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const userId = req.user.id;
            const communication = await communicationService_1.communicationService.markAsRead(tenantId, id, userId);
            return communication;
        }, res);
    }
    async bulkDelete(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = bulkDeleteSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const result = await communicationService_1.communicationService.bulkDelete(tenantId, data.communicationIds);
            return result;
        }, res);
    }
    async getCommunicationsByEntity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { entityType, entityId } = req.params;
            if (!['LEAD', 'CLIENT', 'OPPORTUNITY'].includes(entityType)) {
                throw new Error('Invalid entity type');
            }
            const query = queryCommunicationsSchema.parse({
                ...req.query,
                entityType,
                entityId,
            });
            const tenantId = req.user.tenantId;
            const result = await communicationService_1.communicationService.getCommunications(tenantId, query);
            return result;
        }, res);
    }
    async getUnreadCommunications(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const userId = req.user.id;
            const query = queryCommunicationsSchema.parse(req.query);
            const result = await communicationService_1.communicationService.getCommunications(tenantId, {
                ...query,
                direction: 'INBOUND',
            });
            const unreadCommunications = result.communications.filter(comm => {
                const metadata = comm.metadata || {};
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
    async exportCommunications(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryCommunicationsSchema.parse({
                ...req.query,
                limit: '1000',
                page: '1',
            });
            const tenantId = req.user.tenantId;
            const result = await communicationService_1.communicationService.getCommunications(tenantId, query);
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
                attachments: comm.attachments?.length || 0,
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
exports.communicationController = new CommunicationController();
//# sourceMappingURL=communicationController.js.map
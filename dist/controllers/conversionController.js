"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversionController = void 0;
const zod_1 = require("zod");
const conversionService_1 = require("../services/conversionService");
const response_1 = require("../utils/response");
const leadConversionSchema = zod_1.z.object({
    leadId: zod_1.z.string(),
    clientData: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Client name is required'),
        email: zod_1.z.string().email('Valid email is required'),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        taxId: zod_1.z.string().optional(),
        contactPerson: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }),
    createOpportunity: zod_1.z.boolean().default(false),
    opportunityData: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Opportunity title is required'),
        description: zod_1.z.string().optional(),
        value: zod_1.z.number().min(0, 'Value must be positive'),
        probability: zod_1.z.number().min(0).max(100, 'Probability must be between 0-100').default(50),
        stage: zod_1.z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION']).default('INITIAL_CONTACT'),
        expectedCloseDate: zod_1.z.string().datetime().optional(),
    }).optional(),
    conversionNotes: zod_1.z.string().optional(),
});
const batchConversionSchema = zod_1.z.object({
    leadIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one lead ID is required'),
    defaultClientData: zod_1.z.object({
        contactPerson: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }).optional(),
    createOpportunities: zod_1.z.boolean().default(false),
    conversionNotes: zod_1.z.string().optional(),
});
const queryConversionsSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    dateFrom: zod_1.z.string().datetime().optional(),
    dateTo: zod_1.z.string().datetime().optional(),
    convertedById: zod_1.z.string().optional(),
    hasOpportunity: zod_1.z.string().transform(val => val === 'true').optional(),
    sortBy: zod_1.z.enum(['createdAt', 'convertedBy']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
class ConversionController {
    async convertLeadToClient(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = leadConversionSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const convertedById = req.user.id;
            const result = await conversionService_1.conversionService.convertLeadToClient(tenantId, convertedById, data);
            return result;
        }, res, 201);
    }
    async batchConvertLeads(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = batchConversionSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const convertedById = req.user.id;
            const result = await conversionService_1.conversionService.batchConvertLeads(tenantId, convertedById, data);
            return result;
        }, res, 201);
    }
    async getConversions(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryConversionsSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await conversionService_1.conversionService.getConversions(tenantId, query);
            return result;
        }, res);
    }
    async getConversionById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const conversion = await conversionService_1.conversionService.getConversionById(tenantId, id);
            return conversion;
        }, res);
    }
    async getConversionStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await conversionService_1.conversionService.getConversionStats(tenantId);
            return stats;
        }, res);
    }
    async getConversionFunnel(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = zod_1.z.object({
                period: zod_1.z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const funnel = await conversionService_1.conversionService.getConversionFunnel(tenantId, query.period);
            return funnel;
        }, res);
    }
    async getQualifiedLeads(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = zod_1.z.object({
                page: zod_1.z.string().transform(Number).optional().default('1'),
                limit: zod_1.z.string().transform(Number).optional().default('10'),
                minScore: zod_1.z.string().transform(Number).optional().default('70'),
                assignedToId: zod_1.z.string().optional(),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const leads = await conversionService_1.conversionService.getQualifiedLeads(tenantId, query);
            return leads;
        }, res);
    }
    async previewConversion(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { leadId } = zod_1.z.object({ leadId: zod_1.z.string() }).parse(req.body);
            const tenantId = req.user.tenantId;
            const preview = await conversionService_1.conversionService.previewConversion(tenantId, leadId);
            return preview;
        }, res);
    }
    async getUserConversionPerformance(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { userId } = req.params;
            const query = zod_1.z.object({
                period: zod_1.z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
            }).parse(req.query);
            const tenantId = req.user.tenantId;
            const performance = await conversionService_1.conversionService.getUserConversionPerformance(tenantId, userId, query.period);
            return performance;
        }, res);
    }
}
exports.conversionController = new ConversionController();
//# sourceMappingURL=conversionController.js.map
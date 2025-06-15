"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityController = void 0;
const zod_1 = require("zod");
const opportunityService_1 = require("../services/opportunityService");
const response_1 = require("../utils/response");
const createOpportunitySchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    value: zod_1.z.number().min(0, 'Value must be positive'),
    probability: zod_1.z.number().min(0).max(100, 'Probability must be between 0-100').default(50),
    expectedRevenue: zod_1.z.number().min(0, 'Expected revenue must be positive'),
    stage: zod_1.z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
    expectedCloseDate: zod_1.z.string().datetime().optional(),
    leadId: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
    competitorInfo: zod_1.z.string().optional(),
});
const updateOpportunitySchema = createOpportunitySchema.partial().extend({
    lostReason: zod_1.z.string().optional(),
    actualCloseDate: zod_1.z.string().datetime().optional(),
});
const queryOpportunitiesSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    search: zod_1.z.string().optional(),
    stage: zod_1.z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
    assignedToId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
    minValue: zod_1.z.string().transform(Number).optional(),
    maxValue: zod_1.z.string().transform(Number).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'value', 'expectedCloseDate', 'probability']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
const stageTransitionSchema = zod_1.z.object({
    stage: zod_1.z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
    reason: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
class OpportunityController {
    async getOpportunities(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryOpportunitiesSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await opportunityService_1.opportunityService.getOpportunities(tenantId, query);
            return result;
        }, res);
    }
    async getOpportunityById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const opportunity = await opportunityService_1.opportunityService.getOpportunityById(tenantId, id);
            return opportunity;
        }, res);
    }
    async createOpportunity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createOpportunitySchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const opportunity = await opportunityService_1.opportunityService.createOpportunity(tenantId, data);
            return opportunity;
        }, res, 201);
    }
    async updateOpportunity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updateOpportunitySchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const opportunity = await opportunityService_1.opportunityService.updateOpportunity(tenantId, id, data);
            return opportunity;
        }, res);
    }
    async deleteOpportunity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            await opportunityService_1.opportunityService.deleteOpportunity(tenantId, id);
            return { message: 'Opportunity deleted successfully' };
        }, res);
    }
    async updateStage(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = stageTransitionSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const userId = req.user.id;
            const opportunity = await opportunityService_1.opportunityService.updateStage(tenantId, id, data.stage, userId, data.reason, data.notes);
            return opportunity;
        }, res);
    }
    async assignOpportunity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const { assignedToId } = zod_1.z.object({ assignedToId: zod_1.z.string() }).parse(req.body);
            const tenantId = req.user.tenantId;
            const opportunity = await opportunityService_1.opportunityService.assignOpportunity(tenantId, id, assignedToId);
            return opportunity;
        }, res);
    }
    async getPipelineStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await opportunityService_1.opportunityService.getPipelineStats(tenantId);
            return stats;
        }, res);
    }
    async getPipelineFunnel(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const funnel = await opportunityService_1.opportunityService.getPipelineFunnel(tenantId);
            return funnel;
        }, res);
    }
    async createFromLead(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { leadId } = req.params;
            const data = createOpportunitySchema.omit({ leadId: true }).parse(req.body);
            const tenantId = req.user.tenantId;
            const opportunity = await opportunityService_1.opportunityService.createOpportunityFromLead(tenantId, leadId, data);
            return opportunity;
        }, res, 201);
    }
}
exports.opportunityController = new OpportunityController();
//# sourceMappingURL=opportunityController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadController = void 0;
const zod_1 = require("zod");
const leadService_1 = require("../services/leadService");
const response_1 = require("../utils/response");
const createLeadSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Valid email is required'),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    source: zod_1.z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']),
    channel: zod_1.z.string().optional(),
    budget: zod_1.z.number().optional(),
    interests: zod_1.z.array(zod_1.z.string()).optional(),
    score: zod_1.z.number().min(0).max(100).optional(),
    qualificationNotes: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().optional(),
});
const updateLeadSchema = createLeadSchema.partial().extend({
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST']).optional(),
});
const queryLeadsSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST']).optional(),
    source: zod_1.z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
    assignedToId: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'score', 'lastContactAt']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
class LeadController {
    async getLeads(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryLeadsSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await leadService_1.leadService.getLeads(tenantId, query);
            return result;
        }, res);
    }
    async getLeadById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const lead = await leadService_1.leadService.getLeadById(tenantId, id);
            return lead;
        }, res);
    }
    async createLead(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createLeadSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const lead = await leadService_1.leadService.createLead(tenantId, data);
            return lead;
        }, res, 201);
    }
    async updateLead(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updateLeadSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const lead = await leadService_1.leadService.updateLead(tenantId, id, data);
            return lead;
        }, res);
    }
    async deleteLead(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            await leadService_1.leadService.deleteLead(tenantId, id);
            return { message: 'Lead deleted successfully' };
        }, res);
    }
    async assignLead(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const { assignedToId } = zod_1.z.object({ assignedToId: zod_1.z.string() }).parse(req.body);
            const tenantId = req.user.tenantId;
            const lead = await leadService_1.leadService.assignLead(tenantId, id, assignedToId);
            return lead;
        }, res);
    }
    async updateLeadScore(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const { score } = zod_1.z.object({ score: zod_1.z.number().min(0).max(100) }).parse(req.body);
            const tenantId = req.user.tenantId;
            const lead = await leadService_1.leadService.updateLeadScore(tenantId, id, score);
            return lead;
        }, res);
    }
    async addLeadNote(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const { note } = zod_1.z.object({ note: zod_1.z.string().min(1) }).parse(req.body);
            const tenantId = req.user.tenantId;
            const lead = await leadService_1.leadService.addLeadNote(tenantId, id, note);
            return lead;
        }, res);
    }
    async getLeadStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await leadService_1.leadService.getLeadStats(tenantId);
            return stats;
        }, res);
    }
}
exports.leadController = new LeadController();
//# sourceMappingURL=leadController.js.map
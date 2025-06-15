"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationController = void 0;
const zod_1 = require("zod");
const quotationService_1 = require("../services/quotationService");
const response_1 = require("../utils/response");
const quotationItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Description is required'),
    planType: zod_1.z.string().optional(),
    spaceType: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1'),
    unitPrice: zod_1.z.number().min(0, 'Unit price must be positive'),
    duration: zod_1.z.number().int().min(1, 'Duration must be at least 1 month'),
    billingCycle: zod_1.z.string().optional(),
    total: zod_1.z.number().min(0, 'Total must be positive'),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const createQuotationSchema = zod_1.z.object({
    clientId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    items: zod_1.z.array(quotationItemSchema).min(1, 'At least one item is required'),
    discounts: zod_1.z.number().min(0).optional().default(0),
    taxes: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().optional().default('USD'),
    validUntil: zod_1.z.string().datetime('Valid until date must be a valid datetime'),
    terms: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const updateQuotationSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    items: zod_1.z.array(quotationItemSchema).optional(),
    discounts: zod_1.z.number().min(0).optional(),
    taxes: zod_1.z.number().min(0).optional(),
    validUntil: zod_1.z.string().datetime().optional(),
    terms: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
});
const queryQuotationsSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('10'),
    status: zod_1.z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
    clientId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().datetime().optional(),
    dateTo: zod_1.z.string().datetime().optional(),
    searchTerm: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'total', 'validUntil', 'title']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
const convertToContractSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Contract title is required'),
    description: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime('Start date must be a valid datetime'),
    endDate: zod_1.z.string().datetime().optional(),
    autoRenew: zod_1.z.boolean().optional().default(false),
    renewalPeriod: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
});
class QuotationController {
    async createQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const data = createQuotationSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const createdBy = req.user.id;
            const quotation = await quotationService_1.quotationService.createQuotation(tenantId, createdBy, data);
            return quotation;
        }, res, 201);
    }
    async getQuotations(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const query = queryQuotationsSchema.parse(req.query);
            const tenantId = req.user.tenantId;
            const result = await quotationService_1.quotationService.getQuotations(tenantId, query);
            return result;
        }, res);
    }
    async getQuotationById(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const quotation = await quotationService_1.quotationService.getQuotationById(tenantId, id);
            return quotation;
        }, res);
    }
    async updateQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = updateQuotationSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const quotation = await quotationService_1.quotationService.updateQuotation(tenantId, id, data);
            return quotation;
        }, res);
    }
    async deleteQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const result = await quotationService_1.quotationService.deleteQuotation(tenantId, id);
            return result;
        }, res);
    }
    async sendQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const quotation = await quotationService_1.quotationService.sendQuotation(tenantId, id);
            return quotation;
        }, res);
    }
    async acceptQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const approvedBy = req.user.id;
            const quotation = await quotationService_1.quotationService.acceptQuotation(tenantId, id, approvedBy);
            return quotation;
        }, res);
    }
    async rejectQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const { reason } = zod_1.z.object({ reason: zod_1.z.string().optional() }).parse(req.body);
            const tenantId = req.user.tenantId;
            const quotation = await quotationService_1.quotationService.rejectQuotation(tenantId, id, reason);
            return quotation;
        }, res);
    }
    async markAsViewed(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const quotation = await quotationService_1.quotationService.markQuotationAsViewed(tenantId, id);
            return quotation;
        }, res);
    }
    async convertToContract(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const data = convertToContractSchema.parse(req.body);
            const tenantId = req.user.tenantId;
            const createdBy = req.user.id;
            const contract = await quotationService_1.quotationService.convertToContract(tenantId, id, createdBy, data);
            return contract;
        }, res, 201);
    }
    async duplicateQuotation(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { id } = req.params;
            const tenantId = req.user.tenantId;
            const createdBy = req.user.id;
            const quotation = await quotationService_1.quotationService.duplicateQuotation(tenantId, id, createdBy);
            return quotation;
        }, res, 201);
    }
    async getQuotationStats(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const tenantId = req.user.tenantId;
            const stats = await quotationService_1.quotationService.getQuotationStats(tenantId);
            return stats;
        }, res);
    }
    async getQuotationsByClient(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { clientId } = req.params;
            const query = queryQuotationsSchema.parse({
                ...req.query,
                clientId,
            });
            const tenantId = req.user.tenantId;
            const result = await quotationService_1.quotationService.getQuotations(tenantId, query);
            return result;
        }, res);
    }
    async getQuotationsByOpportunity(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const { opportunityId } = req.params;
            const query = queryQuotationsSchema.parse({
                ...req.query,
                opportunityId,
            });
            const tenantId = req.user.tenantId;
            const result = await quotationService_1.quotationService.getQuotations(tenantId, query);
            return result;
        }, res);
    }
    async getExpiringQuotations(req, res) {
        return (0, response_1.handleController)(async () => {
            if (!req.user?.tenantId) {
                throw new Error('Tenant context required');
            }
            const daysAhead = parseInt(req.query.days) || 7;
            const now = new Date();
            const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
            const query = queryQuotationsSchema.parse({
                ...req.query,
                status: undefined,
                dateFrom: now.toISOString(),
                dateTo: futureDate.toISOString(),
            });
            const tenantId = req.user.tenantId;
            const result = await quotationService_1.quotationService.getQuotations(tenantId, query);
            const expiringQuotations = result.quotations.filter(q => ['SENT', 'VIEWED'].includes(q.status) &&
                q.validUntil >= now &&
                q.validUntil <= futureDate);
            return {
                quotations: expiringQuotations,
                pagination: {
                    ...result.pagination,
                    total: expiringQuotations.length,
                },
            };
        }, res);
    }
}
exports.quotationController = new QuotationController();
//# sourceMappingURL=quotationController.js.map
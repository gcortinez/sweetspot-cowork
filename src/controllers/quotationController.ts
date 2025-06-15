import { Response } from 'express';
import { z } from 'zod';
import { quotationService } from '../services/quotationService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';

// Quotation item schema
const quotationItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  planType: z.string().optional(),
  spaceType: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  duration: z.number().int().min(1, 'Duration must be at least 1 month'),
  billingCycle: z.string().optional(),
  total: z.number().min(0, 'Total must be positive'),
  metadata: z.record(z.any()).optional(),
});

// Create quotation schema
const createQuotationSchema = z.object({
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
  discounts: z.number().min(0).optional().default(0),
  taxes: z.number().min(0).optional(),
  currency: z.string().optional().default('USD'),
  validUntil: z.string().datetime('Valid until date must be a valid datetime'),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

// Update quotation schema
const updateQuotationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  items: z.array(quotationItemSchema).optional(),
  discounts: z.number().min(0).optional(),
  taxes: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
});

// Query quotations schema
const queryQuotationsSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']).optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  leadId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.enum(['createdAt', 'total', 'validUntil', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Convert to contract schema
const convertToContractSchema = z.object({
  title: z.string().min(1, 'Contract title is required'),
  description: z.string().optional(),
  terms: z.string().optional(),
  startDate: z.string().datetime('Start date must be a valid datetime'),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional().default(false),
  renewalPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
});

class QuotationController {
  // POST /api/quotations
  async createQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = createQuotationSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      
      const quotation = await quotationService.createQuotation(tenantId, createdBy, data);
      return quotation;
    }, res, 201);
  }

  // GET /api/quotations
  async getQuotations(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryQuotationsSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const result = await quotationService.getQuotations(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/quotations/:id
  async getQuotationById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const quotation = await quotationService.getQuotationById(tenantId, id);
      return quotation;
    }, res);
  }

  // PUT /api/quotations/:id
  async updateQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = updateQuotationSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const quotation = await quotationService.updateQuotation(tenantId, id, data);
      return quotation;
    }, res);
  }

  // DELETE /api/quotations/:id
  async deleteQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const result = await quotationService.deleteQuotation(tenantId, id);
      return result;
    }, res);
  }

  // POST /api/quotations/:id/send
  async sendQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const quotation = await quotationService.sendQuotation(tenantId, id);
      return quotation;
    }, res);
  }

  // POST /api/quotations/:id/accept
  async acceptQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const approvedBy = req.user.id;
      
      const quotation = await quotationService.acceptQuotation(tenantId, id, approvedBy);
      return quotation;
    }, res);
  }

  // POST /api/quotations/:id/reject
  async rejectQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const quotation = await quotationService.rejectQuotation(tenantId, id, reason);
      return quotation;
    }, res);
  }

  // POST /api/quotations/:id/view
  async markAsViewed(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const quotation = await quotationService.markQuotationAsViewed(tenantId, id);
      return quotation;
    }, res);
  }

  // POST /api/quotations/:id/convert-to-contract
  async convertToContract(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = convertToContractSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      
      const contract = await quotationService.convertToContract(tenantId, id, createdBy, data);
      return contract;
    }, res, 201);
  }

  // POST /api/quotations/:id/duplicate
  async duplicateQuotation(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      
      const quotation = await quotationService.duplicateQuotation(tenantId, id, createdBy);
      return quotation;
    }, res, 201);
  }

  // GET /api/quotations/stats
  async getQuotationStats(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const stats = await quotationService.getQuotationStats(tenantId);
      return stats;
    }, res);
  }

  // GET /api/quotations/by-client/:clientId
  async getQuotationsByClient(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { clientId } = req.params;
      const query = queryQuotationsSchema.parse({
        ...req.query,
        clientId,
      });
      const tenantId = req.user.tenantId;
      
      const result = await quotationService.getQuotations(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/quotations/by-opportunity/:opportunityId
  async getQuotationsByOpportunity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { opportunityId } = req.params;
      const query = queryQuotationsSchema.parse({
        ...req.query,
        opportunityId,
      });
      const tenantId = req.user.tenantId;
      
      const result = await quotationService.getQuotations(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/quotations/expiring
  async getExpiringQuotations(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const daysAhead = parseInt(req.query.days as string) || 7;
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      const query = queryQuotationsSchema.parse({
        ...req.query,
        status: undefined, // Don't filter by status
        dateFrom: now.toISOString(),
        dateTo: futureDate.toISOString(),
      });
      const tenantId = req.user.tenantId;
      
      const result = await quotationService.getQuotations(tenantId, query);
      
      // Filter to only include quotations expiring in the time range
      const expiringQuotations = result.quotations.filter(q => 
        ['SENT', 'VIEWED'].includes(q.status) &&
        q.validUntil >= now &&
        q.validUntil <= futureDate
      );
      
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

export const quotationController = new QuotationController();
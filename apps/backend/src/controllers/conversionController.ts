import { Response } from 'express';
import { z } from 'zod';
import { conversionService } from '../services/conversionService';
import { handleController } from '../utils/response';
import { BaseRequest, ErrorCode } from '../types/api';

// Lead conversion schema
const leadConversionSchema = z.object({
  leadId: z.string(),
  clientData: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
  }),
  createOpportunity: z.boolean().default(false),
  opportunityData: z.object({
    title: z.string().min(1, 'Opportunity title is required'),
    description: z.string().optional(),
    value: z.number().min(0, 'Value must be positive'),
    probability: z.number().min(0).max(100, 'Probability must be between 0-100').default(50),
    stage: z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION']).default('INITIAL_CONTACT'),
    expectedCloseDate: z.string().datetime().optional(),
  }).optional(),
  conversionNotes: z.string().optional(),
});

// Batch conversion schema
const batchConversionSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead ID is required'),
  defaultClientData: z.object({
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  createOpportunities: z.boolean().default(false),
  conversionNotes: z.string().optional(),
});

// Query conversions schema
const queryConversionsSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  convertedById: z.string().optional(),
  hasOpportunity: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'convertedBy']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

class ConversionController {
  // POST /api/conversions/lead-to-client
  async convertLeadToClient(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = leadConversionSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const convertedById = req.user.id;
      
      const result = await conversionService.convertLeadToClient(tenantId, convertedById, data);
      return result;
    }, res, 201);
  }

  // POST /api/conversions/batch-convert
  async batchConvertLeads(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const data = batchConversionSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const convertedById = req.user.id;
      
      const result = await conversionService.batchConvertLeads(tenantId, convertedById, data);
      return result;
    }, res, 201);
  }

  // GET /api/conversions
  async getConversions(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const query = queryConversionsSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const result = await conversionService.getConversions(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/conversions/:id
  async getConversionById(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const conversion = await conversionService.getConversionById(tenantId, id);
      return conversion;
    }, res);
  }

  // GET /api/conversions/stats
  async getConversionStats(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const tenantId = req.user.tenantId;
      const stats = await conversionService.getConversionStats(tenantId);
      return stats;
    }, res);
  }

  // GET /api/conversions/conversion-funnel
  async getConversionFunnel(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const query = z.object({
        period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      const funnel = await conversionService.getConversionFunnel(tenantId, query.period);
      return funnel;
    }, res);
  }

  // GET /api/conversions/qualified-leads
  async getQualifiedLeads(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const query = z.object({
        page: z.string().transform(Number).optional().default('1'),
        limit: z.string().transform(Number).optional().default('10'),
        minScore: z.string().transform(Number).optional().default('70'),
        assignedToId: z.string().optional(),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      const leads = await conversionService.getQualifiedLeads(tenantId, query);
      return leads;
    }, res);
  }

  // POST /api/conversions/preview
  async previewConversion(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { leadId } = z.object({ leadId: z.string() }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const preview = await conversionService.previewConversion(tenantId, leadId);
      return preview;
    }, res);
  }

  // GET /api/conversions/performance/:userId
  async getUserConversionPerformance(req: BaseRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error(ErrorCode.UNAUTHORIZED_ACCESS);
      }
      
      const { userId } = req.params;
      const query = z.object({
        period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
      }).parse(req.query);
      
      const tenantId = req.user.tenantId;
      const performance = await conversionService.getUserConversionPerformance(tenantId, userId, query.period);
      return performance;
    }, res);
  }
}

export const conversionController = new ConversionController();
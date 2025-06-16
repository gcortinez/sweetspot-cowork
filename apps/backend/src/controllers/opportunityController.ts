import { Response } from 'express';
import { z } from 'zod';
import { opportunityService } from '../services/opportunityService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';

// Create opportunity schema
const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be positive'),
  probability: z.number().min(0).max(100, 'Probability must be between 0-100').default(50),
  expectedRevenue: z.number().min(0, 'Expected revenue must be positive'),
  stage: z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD']),
  expectedCloseDate: z.string().datetime().optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  competitorInfo: z.string().optional(),
});

// Update opportunity schema
const updateOpportunitySchema = createOpportunitySchema.partial().extend({
  lostReason: z.string().optional(),
  actualCloseDate: z.string().datetime().optional(),
});

// Query opportunities schema
const queryOpportunitiesSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  search: z.string().optional(),
  stage: z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD']).optional(),
  assignedToId: z.string().optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  minValue: z.string().transform(Number).optional(),
  maxValue: z.string().transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'value', 'expectedCloseDate', 'probability']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Stage transition schema
const stageTransitionSchema = z.object({
  stage: z.enum(['INITIAL_CONTACT', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONTRACT_REVIEW', 'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

class OpportunityController {
  // GET /api/opportunities
  async getOpportunities(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryOpportunitiesSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      const result = await opportunityService.getOpportunities(tenantId, query);
      return result;
    }, res);
  }

  // GET /api/opportunities/:id
  async getOpportunityById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const opportunity = await opportunityService.getOpportunityById(tenantId, id);
      return opportunity;
    }, res);
  }

  // POST /api/opportunities
  async createOpportunity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = createOpportunitySchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const opportunity = await opportunityService.createOpportunity(tenantId, data);
      return opportunity;
    }, res, 201);
  }

  // PUT /api/opportunities/:id
  async updateOpportunity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = updateOpportunitySchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const opportunity = await opportunityService.updateOpportunity(tenantId, id, data);
      return opportunity;
    }, res);
  }

  // DELETE /api/opportunities/:id
  async deleteOpportunity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      await opportunityService.deleteOpportunity(tenantId, id);
      return { message: 'Opportunity deleted successfully' };
    }, res);
  }

  // POST /api/opportunities/:id/stage
  async updateStage(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = stageTransitionSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      
      const opportunity = await opportunityService.updateStage(tenantId, id, data.stage, userId, data.reason, data.notes);
      return opportunity;
    }, res);
  }

  // POST /api/opportunities/:id/assign
  async assignOpportunity(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const { assignedToId } = z.object({ assignedToId: z.string() }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const opportunity = await opportunityService.assignOpportunity(tenantId, id, assignedToId);
      return opportunity;
    }, res);
  }

  // GET /api/opportunities/pipeline/stats
  async getPipelineStats(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const stats = await opportunityService.getPipelineStats(tenantId);
      return stats;
    }, res);
  }

  // GET /api/opportunities/pipeline/funnel
  async getPipelineFunnel(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      const funnel = await opportunityService.getPipelineFunnel(tenantId);
      return funnel;
    }, res);
  }

  // POST /api/opportunities/from-lead/:leadId
  async createFromLead(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { leadId } = req.params;
      const data = createOpportunitySchema.omit({ leadId: true }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const opportunity = await opportunityService.createOpportunityFromLead(tenantId, leadId, data);
      return opportunity;
    }, res, 201);
  }
}

export const opportunityController = new OpportunityController();
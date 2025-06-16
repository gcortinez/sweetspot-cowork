import { Response } from 'express';
import { z } from 'zod';
import { leadService } from '../services/leadService';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';

// Create lead schema
const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  score: z.number().min(0).max(100).optional(),
  qualificationNotes: z.string().optional(),
  assignedToId: z.string().optional(),
});

// Update lead schema
const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST']).optional(),
});

// Query leads schema
const queryLeadsSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST']).optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
  assignedToId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'score', 'lastContactAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

class LeadController {
  // GET /api/leads
  async getLeads(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      console.log('=== LEAD CONTROLLER DEBUG ===');
      console.log('User info:', {
        userId: req.user?.id,
        email: req.user?.email,
        tenantId: req.user?.tenantId,
        role: req.user?.role
      });
      
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const query = queryLeadsSchema.parse(req.query);
      const tenantId = req.user.tenantId;
      
      console.log('Calling leadService.getLeads with tenantId:', tenantId);
      const result = await leadService.getLeads(tenantId, query);
      console.log('Result from leadService:', {
        totalLeads: result.leads.length,
        pagination: result.pagination
      });
      console.log('=============================');
      
      return result;
    }, res);
  }

  // GET /api/leads/:id
  async getLeadById(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      const lead = await leadService.getLeadById(tenantId, id);
      return lead;
    }, res);
  }

  // POST /api/leads
  async createLead(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const data = createLeadSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const lead = await leadService.createLead(tenantId, data);
      return lead;
    }, res, 201);
  }

  // PUT /api/leads/:id
  async updateLead(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const data = updateLeadSchema.parse(req.body);
      const tenantId = req.user.tenantId;
      
      const lead = await leadService.updateLead(tenantId, id, data);
      return lead;
    }, res);
  }

  // DELETE /api/leads/:id
  async deleteLead(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      
      await leadService.deleteLead(tenantId, id);
      return { message: 'Lead deleted successfully' };
    }, res);
  }

  // POST /api/leads/:id/assign
  async assignLead(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const { assignedToId } = z.object({ assignedToId: z.string() }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const lead = await leadService.assignLead(tenantId, id, assignedToId);
      return lead;
    }, res);
  }

  // POST /api/leads/:id/update-score
  async updateLeadScore(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const { score } = z.object({ score: z.number().min(0).max(100) }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const lead = await leadService.updateLeadScore(tenantId, id, score);
      return lead;
    }, res);
  }

  // POST /api/leads/:id/add-note
  async addLeadNote(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const { id } = req.params;
      const { note } = z.object({ note: z.string().min(1) }).parse(req.body);
      const tenantId = req.user.tenantId;
      
      const lead = await leadService.addLeadNote(tenantId, id, note);
      return lead;
    }, res);
  }

  // GET /api/leads/stats
  async getLeadStats(req: AuthenticatedRequest, res: Response) {
    return handleController(async () => {
      if (!req.user?.tenantId) {
        throw new Error('Tenant context required');
      }
      
      const tenantId = req.user.tenantId;
      
      const stats = await leadService.getLeadStats(tenantId);
      return stats;
    }, res);
  }
}

export const leadController = new LeadController();
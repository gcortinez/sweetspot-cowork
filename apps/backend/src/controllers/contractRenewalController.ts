import { Request, Response } from 'express';
import { z } from 'zod';
import { contractRenewalService, RenewalTrigger, RenewalType, NotificationType } from '../services/contractRenewalService';
import { RenewalStatus } from '../services/contractLifecycleService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';

const CreateRenewalRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  contractTypes: z.array(z.string()).min(1),
  trigger: z.nativeEnum(RenewalTrigger),
  triggerDays: z.number().min(1).max(365).optional(),
  renewalType: z.nativeEnum(RenewalType),
  autoApprove: z.boolean(),
  renewalPeriod: z.number().min(1).max(120),
  priceAdjustment: z.object({
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.number(),
  }).optional(),
  notificationSettings: z.object({
    enabled: z.boolean(),
    types: z.array(z.nativeEnum(NotificationType)),
    recipients: z.array(z.string().email()),
    template: z.string().optional(),
  }),
  conditions: z.object({
    minContractValue: z.number().min(0).optional(),
    maxContractValue: z.number().min(0).optional(),
    clientTypes: z.array(z.string()).optional(),
    excludeClientIds: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateRenewalRuleSchema = CreateRenewalRuleSchema.partial();

const ProcessRenewalSchema = z.object({
  action: z.enum(['APPROVE', 'DECLINE']),
  notes: z.string().optional(),
  declineReason: z.string().optional(),
  modifyTerms: z.boolean().optional(),
  newValue: z.number().min(0).optional(),
  newEndDate: z.coerce.date().optional(),
});

const RenewalQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.nativeEnum(RenewalStatus).optional(),
  contractId: z.string().optional(),
  ruleId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class ContractRenewalController {
  async createRenewalRule(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = CreateRenewalRuleSchema.parse(req.body);

      logger.info('Creating renewal rule', {
        tenantId,
        createdBy,
        ruleName: validatedData.name,
        trigger: validatedData.trigger,
      });

      const rule = await contractRenewalService.createRenewalRule(
        tenantId,
        createdBy,
        validatedData
      );

      logger.info('Renewal rule created successfully', {
        tenantId,
        ruleId: rule.id,
        ruleName: rule.name,
      });

      return ResponseHelper.success(res, rule, 'Renewal rule created successfully', 201);
    } catch (error) {
      logger.error('Error creating renewal rule', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof ValidationError) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Failed to create renewal rule', 500);
    }
  }

  async getRenewalRules(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching renewal rules', { tenantId });

      const rules = await contractRenewalService.getRenewalRules(tenantId);

      return ResponseHelper.success(res, rules, 'Renewal rules retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal rules', { error });
      return ResponseHelper.error(res, 'Failed to fetch renewal rules', 500);
    }
  }

  async updateRenewalRule(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = UpdateRenewalRuleSchema.parse(req.body);

      logger.info('Updating renewal rule', {
        tenantId,
        ruleId: id,
        updatedBy: req.user?.id,
      });

      const rule = await contractRenewalService.updateRenewalRule(
        tenantId,
        id,
        validatedData
      );

      logger.info('Renewal rule updated successfully', {
        tenantId,
        ruleId: id,
      });

      return ResponseHelper.success(res, rule, 'Renewal rule updated successfully');
    } catch (error) {
      logger.error('Error updating renewal rule', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to update renewal rule', 500);
    }
  }

  async deleteRenewalRule(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.info('Deleting renewal rule', {
        tenantId,
        ruleId: id,
        deletedBy: req.user?.id,
      });

      const result = await contractRenewalService.deleteRenewalRule(tenantId, id);

      logger.info('Renewal rule deleted successfully', {
        tenantId,
        ruleId: id,
      });

      return ResponseHelper.success(res, result, 'Renewal rule deleted successfully');
    } catch (error) {
      logger.error('Error deleting renewal rule', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to delete renewal rule', 500);
    }
  }

  async createRenewalProposal(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;
      const { contractId } = req.params;

      if (!tenantId || !createdBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { ruleId } = req.body;

      logger.info('Creating renewal proposal', {
        tenantId,
        contractId,
        ruleId,
        createdBy,
      });

      const proposal = await contractRenewalService.createRenewalProposal(
        tenantId,
        contractId,
        createdBy,
        ruleId
      );

      logger.info('Renewal proposal created successfully', {
        tenantId,
        proposalId: proposal.id,
        contractId,
        status: proposal.status,
      });

      return ResponseHelper.success(res, proposal, 'Renewal proposal created successfully', 201);
    } catch (error) {
      logger.error('Error creating renewal proposal', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to create renewal proposal', 500);
    }
  }

  async getRenewalProposals(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const query = RenewalQuerySchema.parse(req.query);

      logger.debug('Fetching renewal proposals', { tenantId, query });

      const result = await contractRenewalService.getRenewalProposals(tenantId, query);

      return ResponseHelper.success(res, result, 'Renewal proposals retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal proposals', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
      }

      return ResponseHelper.error(res, 'Failed to fetch renewal proposals', 500);
    }
  }

  async processRenewalProposal(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const processedBy = req.user?.id;
      const { id } = req.params;

      if (!tenantId || !processedBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = ProcessRenewalSchema.parse(req.body);

      logger.info('Processing renewal proposal', {
        tenantId,
        proposalId: id,
        action: validatedData.action,
        processedBy,
      });

      const proposal = await contractRenewalService.processRenewalProposal(
        tenantId,
        id,
        processedBy,
        validatedData
      );

      logger.info('Renewal proposal processed successfully', {
        tenantId,
        proposalId: id,
        action: validatedData.action,
        newStatus: proposal.status,
      });

      return ResponseHelper.success(res, proposal, `Renewal proposal ${validatedData.action.toLowerCase()}d successfully`);
    } catch (error) {
      logger.error('Error processing renewal proposal', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to process renewal proposal', 500);
    }
  }

  async checkAndCreateRenewals(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.info('Running renewal check for tenant', { tenantId });

      const result = await contractRenewalService.checkAndCreateRenewals(tenantId);

      logger.info('Renewal check completed', {
        tenantId,
        created: result.created,
        processed: result.processed,
        notifications: result.notifications,
      });

      return ResponseHelper.success(res, result, 'Renewal check completed successfully');
    } catch (error) {
      logger.error('Error running renewal check', { error });
      return ResponseHelper.error(res, 'Failed to run renewal check', 500);
    }
  }

  async getRenewalStats(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching renewal statistics', { tenantId });

      const stats = await contractRenewalService.getRenewalStats(tenantId);

      return ResponseHelper.success(res, stats, 'Renewal statistics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal statistics', { error });
      return ResponseHelper.error(res, 'Failed to fetch renewal statistics', 500);
    }
  }

  async toggleRuleStatus(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return ResponseHelper.error(res, 'isActive must be a boolean', 400);
      }

      logger.info('Toggling renewal rule status', {
        tenantId,
        ruleId: id,
        isActive,
        updatedBy: req.user?.id,
      });

      const rule = await contractRenewalService.updateRenewalRule(
        tenantId,
        id,
        { isActive }
      );

      logger.info('Renewal rule status updated', {
        tenantId,
        ruleId: id,
        isActive: rule.isActive,
      });

      return ResponseHelper.success(res, rule, `Renewal rule ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      logger.error('Error toggling renewal rule status', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to update renewal rule status', 500);
    }
  }
}

export const contractRenewalController = new ContractRenewalController();
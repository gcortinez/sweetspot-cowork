import { Response } from 'express';
import { z } from 'zod';
import { contractRenewalService, RenewalTrigger, RenewalType, NotificationType } from '../services/contractRenewalService';
import { RenewalStatus } from '../services/contractLifecycleService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';
import { BaseRequest, ErrorCode, HttpStatusCode } from '../types/api';

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
  async createRenewalRule(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return ResponseHelper.unauthorized(res);
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

      return ResponseHelper.success(res, rule, 'Renewal rule created successfully', HttpStatusCode.CREATED);
    } catch (error) {
      logger.error('Error creating renewal rule', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.validationError(res, 'Validation failed', error.errors);
      }

      if (error instanceof ValidationError) {
        return ResponseHelper.error(res, ErrorCode.VALIDATION_ERROR, error.message, HttpStatusCode.BAD_REQUEST);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to create renewal rule', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getRenewalRules(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      logger.debug('Fetching renewal rules', { tenantId });

      const rules = await contractRenewalService.getRenewalRules(tenantId);

      return ResponseHelper.success(res, rules, 'Renewal rules retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal rules', { error });
      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to fetch renewal rules', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateRenewalRule(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
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
        return ResponseHelper.validationError(res, 'Validation failed', error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to update renewal rule', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteRenewalRule(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
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
        return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to delete renewal rule', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createRenewalProposal(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;
      const { contractId } = req.params;

      if (!tenantId || !createdBy) {
        return ResponseHelper.unauthorized(res);
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

      return ResponseHelper.success(res, proposal, 'Renewal proposal created successfully', HttpStatusCode.CREATED);
    } catch (error) {
      logger.error('Error creating renewal proposal', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to create renewal proposal', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getRenewalProposals(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const query = RenewalQuerySchema.parse(req.query);

      logger.debug('Fetching renewal proposals', { tenantId, query });

      const result = await contractRenewalService.getRenewalProposals(tenantId, query);

      return ResponseHelper.success(res, result, 'Renewal proposals retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal proposals', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, ErrorCode.VALIDATION_ERROR, 'Invalid query parameters', HttpStatusCode.BAD_REQUEST);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to fetch renewal proposals', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async processRenewalProposal(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const processedBy = req.user?.id;
      const { id } = req.params;

      if (!tenantId || !processedBy) {
        return ResponseHelper.unauthorized(res);
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
        return ResponseHelper.validationError(res, 'Validation failed', error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to process renewal proposal', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkAndCreateRenewals(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
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
      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to run renewal check', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getRenewalStats(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      logger.debug('Fetching renewal statistics', { tenantId });

      const stats = await contractRenewalService.getRenewalStats(tenantId);

      return ResponseHelper.success(res, stats, 'Renewal statistics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching renewal statistics', { error });
      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to fetch renewal statistics', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleRuleStatus(req: BaseRequest, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.unauthorized(res);
      }

      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return ResponseHelper.error(res, ErrorCode.VALIDATION_ERROR, 'isActive must be a boolean', HttpStatusCode.BAD_REQUEST);
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
        return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, ErrorCode.DATABASE_ERROR, 'Failed to update renewal rule status', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

export const contractRenewalController = new ContractRenewalController();
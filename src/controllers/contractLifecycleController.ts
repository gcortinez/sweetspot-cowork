import { Request, Response } from 'express';
import { z } from 'zod';
import { contractLifecycleService, ContractStatus, ContractType } from '../services/contractLifecycleService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';

const ContractPartySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['CLIENT', 'COMPANY']),
  signedAt: z.coerce.date().optional(),
  userId: z.string().optional(),
  clientId: z.string().optional(),
});

const ContractTermSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  order: z.number().min(1),
  isRequired: z.boolean(),
});

const CreateContractSchema = z.object({
  templateId: z.string().optional(),
  quotationId: z.string().optional(),
  opportunityId: z.string().optional(),
  type: z.nativeEnum(ContractType),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  parties: z.array(ContractPartySchema).min(2),
  terms: z.array(ContractTermSchema),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  autoRenewal: z.boolean(),
  renewalPeriod: z.number().min(1).optional(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateContractSchema = CreateContractSchema.partial();

const ContractQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.nativeEnum(ContractStatus).optional(),
  type: z.nativeEnum(ContractType).optional(),
  clientId: z.string().optional(),
  templateId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  expiringDays: z.coerce.number().min(1).max(365).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const SuspendContractSchema = z.object({
  reason: z.string().optional(),
});

const TerminateContractSchema = z.object({
  reason: z.string().optional(),
  terminationDate: z.coerce.date().optional(),
});

const CancelContractSchema = z.object({
  reason: z.string().optional(),
});

export class ContractLifecycleController {
  async createContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = CreateContractSchema.parse(req.body);

      logger.info('Creating contract', {
        tenantId,
        createdBy,
        type: validatedData.type,
        title: validatedData.title,
      });

      const contract = await contractLifecycleService.createContract(
        tenantId,
        createdBy,
        validatedData
      );

      logger.info('Contract created successfully', {
        tenantId,
        contractId: contract.id,
        type: contract.type,
      });

      return ResponseHelper.success(res, contract, 'Contract created successfully', 201);
    } catch (error) {
      logger.error('Error creating contract', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof ValidationError) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Failed to create contract', 500);
    }
  }

  async getContracts(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const query = ContractQuerySchema.parse(req.query);

      logger.debug('Fetching contracts', { tenantId, query });

      const result = await contractLifecycleService.getContracts(tenantId, query);

      return ResponseHelper.success(res, result, 'Contracts retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contracts', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
      }

      return ResponseHelper.error(res, 'Failed to fetch contracts', 500);
    }
  }

  async getContractById(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching contract by ID', { tenantId, contractId: id });

      const contract = await contractLifecycleService.getContractById(tenantId, id);

      return ResponseHelper.success(res, contract, 'Contract retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to fetch contract', 500);
    }
  }

  async updateContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = UpdateContractSchema.parse(req.body);

      logger.info('Updating contract', {
        tenantId,
        contractId: id,
        updatedBy: req.user?.id,
      });

      const contract = await contractLifecycleService.updateContract(
        tenantId,
        id,
        validatedData
      );

      logger.info('Contract updated successfully', {
        tenantId,
        contractId: id,
      });

      return ResponseHelper.success(res, contract, 'Contract updated successfully');
    } catch (error) {
      logger.error('Error updating contract', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to update contract', 500);
    }
  }

  async activateContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const activatedBy = req.user?.id;

      if (!tenantId || !activatedBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.info('Activating contract', {
        tenantId,
        contractId: id,
        activatedBy,
      });

      const contract = await contractLifecycleService.activateContract(
        tenantId,
        id,
        activatedBy
      );

      logger.info('Contract activated successfully', {
        tenantId,
        contractId: id,
      });

      return ResponseHelper.success(res, contract, 'Contract activated successfully');
    } catch (error) {
      logger.error('Error activating contract', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to activate contract', 500);
    }
  }

  async suspendContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const suspendedBy = req.user?.id;

      if (!tenantId || !suspendedBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { reason } = SuspendContractSchema.parse(req.body);

      logger.info('Suspending contract', {
        tenantId,
        contractId: id,
        suspendedBy,
        reason,
      });

      const contract = await contractLifecycleService.suspendContract(
        tenantId,
        id,
        suspendedBy,
        reason
      );

      logger.info('Contract suspended successfully', {
        tenantId,
        contractId: id,
      });

      return ResponseHelper.success(res, contract, 'Contract suspended successfully');
    } catch (error) {
      logger.error('Error suspending contract', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to suspend contract', 500);
    }
  }

  async reactivateContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const reactivatedBy = req.user?.id;

      if (!tenantId || !reactivatedBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.info('Reactivating contract', {
        tenantId,
        contractId: id,
        reactivatedBy,
      });

      const contract = await contractLifecycleService.reactivateContract(
        tenantId,
        id,
        reactivatedBy
      );

      logger.info('Contract reactivated successfully', {
        tenantId,
        contractId: id,
      });

      return ResponseHelper.success(res, contract, 'Contract reactivated successfully');
    } catch (error) {
      logger.error('Error reactivating contract', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to reactivate contract', 500);
    }
  }

  async terminateContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const terminatedBy = req.user?.id;

      if (!tenantId || !terminatedBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { reason, terminationDate } = TerminateContractSchema.parse(req.body);

      logger.info('Terminating contract', {
        tenantId,
        contractId: id,
        terminatedBy,
        reason,
        terminationDate,
      });

      const contract = await contractLifecycleService.terminateContract(
        tenantId,
        id,
        terminatedBy,
        reason,
        terminationDate
      );

      logger.info('Contract terminated successfully', {
        tenantId,
        contractId: id,
      });

      return ResponseHelper.success(res, contract, 'Contract terminated successfully');
    } catch (error) {
      logger.error('Error terminating contract', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to terminate contract', 500);
    }
  }

  async cancelContract(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const cancelledBy = req.user?.id;

      if (!tenantId || !cancelledBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { reason } = CancelContractSchema.parse(req.body);

      logger.info('Cancelling contract', {
        tenantId,
        contractId: id,
        cancelledBy,
        reason,
      });

      const contract = await contractLifecycleService.cancelContract(
        tenantId,
        id,
        cancelledBy,
        reason
      );

      logger.info('Contract cancelled successfully', {
        tenantId,
        contractId: id,
      });

      return ResponseHelper.success(res, contract, 'Contract cancelled successfully');
    } catch (error) {
      logger.error('Error cancelling contract', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to cancel contract', 500);
    }
  }

  async getContractActivity(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching contract activity', { tenantId, contractId: id });

      const activity = await contractLifecycleService.getContractActivity(tenantId, id);

      return ResponseHelper.success(res, activity, 'Contract activity retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract activity', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to fetch contract activity', 500);
    }
  }

  async getContractStats(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching contract statistics', { tenantId });

      const stats = await contractLifecycleService.getContractStats(tenantId);

      return ResponseHelper.success(res, stats, 'Contract statistics retrieved successfully');
    } catch (error) {
      logger.error('Error fetching contract statistics', { error });
      return ResponseHelper.error(res, 'Failed to fetch contract statistics', 500);
    }
  }

  async getExpiringContracts(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      if (isNaN(days) || days < 1 || days > 365) {
        return ResponseHelper.error(res, 'Invalid days parameter. Must be between 1 and 365', 400);
      }

      logger.debug('Fetching expiring contracts', { tenantId, days });

      const contracts = await contractLifecycleService.getExpiringContracts(tenantId, days);

      return ResponseHelper.success(res, contracts, `Contracts expiring in ${days} days retrieved successfully`);
    } catch (error) {
      logger.error('Error fetching expiring contracts', { error });
      return ResponseHelper.error(res, 'Failed to fetch expiring contracts', 500);
    }
  }

  async sendContractForSignature(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const sentBy = req.user?.id;

      if (!tenantId || !sentBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.info('Sending contract for signature', {
        tenantId,
        contractId: id,
        sentBy,
      });

      const result = await contractLifecycleService.sendContractForSignature(
        tenantId,
        id,
        sentBy
      );

      logger.info('Contract sent for signature successfully', {
        tenantId,
        contractId: id,
        workflowId: result.workflowId,
      });

      return ResponseHelper.success(res, result, 'Contract sent for signature successfully');
    } catch (error) {
      logger.error('Error sending contract for signature', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to send contract for signature', 500);
    }
  }
}

export const contractLifecycleController = new ContractLifecycleController();
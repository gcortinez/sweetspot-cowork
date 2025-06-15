import { Request, Response } from 'express';
import { z } from 'zod';
import { digitalSignatureService, SignatureStatus, SignatureType } from '../services/digitalSignatureService';
import { ResponseHelper } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';

const SignerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  order: z.number().min(1),
  isRequired: z.boolean(),
  userId: z.string().optional(),
  clientId: z.string().optional(),
});

const SignatureFieldSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
  page: z.number().min(1),
  signerId: z.string().min(1),
  type: z.nativeEnum(SignatureType),
  required: z.boolean(),
  label: z.string().optional(),
});

const CreateSignatureWorkflowSchema = z.object({
  contractId: z.string().min(1),
  title: z.string().min(1).max(255),
  documentContent: z.string().min(1),
  documentUrl: z.string().url().optional(),
  signers: z.array(SignerSchema).min(1),
  signatureFields: z.array(SignatureFieldSchema).min(1),
  message: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
  requireAllSigners: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateSignatureWorkflowSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  message: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
  requireAllSigners: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const SignDocumentSchema = z.object({
  signatureFieldId: z.string().min(1),
  signatureType: z.nativeEnum(SignatureType),
  signatureData: z.string().min(1), // Base64 encoded signature
});

const DeclineSignatureSchema = z.object({
  reason: z.string().optional(),
});

const CancelWorkflowSchema = z.object({
  reason: z.string().optional(),
});

const SignatureWorkflowQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.nativeEnum(SignatureStatus).optional(),
  contractId: z.string().optional(),
  signerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class DigitalSignatureController {
  async createWorkflow(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = CreateSignatureWorkflowSchema.parse(req.body);

      logger.info('Creating signature workflow', {
        tenantId,
        createdBy,
        contractId: validatedData.contractId,
        title: validatedData.title,
      });

      const workflow = await digitalSignatureService.createSignatureWorkflow(
        tenantId,
        createdBy,
        validatedData
      );

      logger.info('Signature workflow created successfully', {
        tenantId,
        workflowId: workflow.id,
        contractId: workflow.contractId,
      });

      return ResponseHelper.success(res, workflow, 'Signature workflow created successfully', 201);
    } catch (error) {
      logger.error('Error creating signature workflow', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof ValidationError) {
        return ResponseHelper.error(res, error.message, 400);
      }

      return ResponseHelper.error(res, 'Failed to create signature workflow', 500);
    }
  }

  async getWorkflows(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const query = SignatureWorkflowQuerySchema.parse(req.query);

      logger.debug('Fetching signature workflows', { tenantId, query });

      const result = await digitalSignatureService.getSignatureWorkflows(tenantId, query);

      return ResponseHelper.success(res, result, 'Signature workflows retrieved successfully');
    } catch (error) {
      logger.error('Error fetching signature workflows', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
      }

      return ResponseHelper.error(res, 'Failed to fetch signature workflows', 500);
    }
  }

  async getWorkflowById(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching signature workflow by ID', { tenantId, workflowId: id });

      const workflow = await digitalSignatureService.getWorkflowById(tenantId, id);

      return ResponseHelper.success(res, workflow, 'Signature workflow retrieved successfully');
    } catch (error) {
      logger.error('Error fetching signature workflow', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to fetch signature workflow', 500);
    }
  }

  async updateWorkflow(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = UpdateSignatureWorkflowSchema.parse(req.body);

      logger.info('Updating signature workflow', {
        tenantId,
        workflowId: id,
        updatedBy: req.user?.id,
      });

      const workflow = await digitalSignatureService.updateWorkflow(
        tenantId,
        id,
        validatedData
      );

      logger.info('Signature workflow updated successfully', {
        tenantId,
        workflowId: id,
      });

      return ResponseHelper.success(res, workflow, 'Signature workflow updated successfully');
    } catch (error) {
      logger.error('Error updating signature workflow', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to update signature workflow', 500);
    }
  }

  async signDocument(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { workflowId, signerId } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const validatedData = SignDocumentSchema.parse(req.body);

      // Get signer details from request
      const signerDetails = {
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
      };

      logger.info('Processing document signature', {
        tenantId,
        workflowId,
        signerId,
        signatureFieldId: validatedData.signatureFieldId,
      });

      const result = await digitalSignatureService.signDocument(
        tenantId,
        workflowId,
        signerId,
        {
          ...validatedData,
          signerDetails,
        }
      );

      logger.info('Document signed successfully', {
        tenantId,
        workflowId,
        signerId,
        workflowStatus: result.workflow.status,
      });

      return ResponseHelper.success(res, result, 'Document signed successfully');
    } catch (error) {
      logger.error('Error signing document', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to sign document', 500);
    }
  }

  async declineSignature(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { workflowId, signerId } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { reason } = DeclineSignatureSchema.parse(req.body);

      logger.info('Processing signature decline', {
        tenantId,
        workflowId,
        signerId,
        reason,
      });

      const workflow = await digitalSignatureService.declineSignature(
        tenantId,
        workflowId,
        signerId,
        reason
      );

      logger.info('Signature declined successfully', {
        tenantId,
        workflowId,
        signerId,
      });

      return ResponseHelper.success(res, workflow, 'Signature declined successfully');
    } catch (error) {
      logger.error('Error declining signature', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to decline signature', 500);
    }
  }

  async cancelWorkflow(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;
      const cancelledBy = req.user?.id;

      if (!tenantId || !cancelledBy) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      const { reason } = CancelWorkflowSchema.parse(req.body);

      logger.info('Cancelling signature workflow', {
        tenantId,
        workflowId: id,
        cancelledBy,
        reason,
      });

      const workflow = await digitalSignatureService.cancelWorkflow(
        tenantId,
        id,
        cancelledBy,
        reason
      );

      logger.info('Signature workflow cancelled successfully', {
        tenantId,
        workflowId: id,
      });

      return ResponseHelper.success(res, workflow, 'Signature workflow cancelled successfully');
    } catch (error) {
      logger.error('Error cancelling signature workflow', { error });

      if (error instanceof z.ZodError) {
        return ResponseHelper.error(res, 'Validation failed', 400, error.errors);
      }

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to cancel signature workflow', 500);
    }
  }

  async getSignerView(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { workflowId, signerId } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching signer view', { tenantId, workflowId, signerId });

      const signerView = await digitalSignatureService.getSignerView(
        tenantId,
        workflowId,
        signerId
      );

      return ResponseHelper.success(res, signerView, 'Signer view retrieved successfully');
    } catch (error) {
      logger.error('Error fetching signer view', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to fetch signer view', 500);
    }
  }

  async getAuditTrail(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Fetching signature audit trail', { tenantId, workflowId: id });

      const auditTrail = await digitalSignatureService.getAuditTrail(tenantId, id);

      return ResponseHelper.success(res, auditTrail, 'Audit trail retrieved successfully');
    } catch (error) {
      logger.error('Error fetching audit trail', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to fetch audit trail', 500);
    }
  }

  async verifySignature(req: Request, res: Response): Promise<Response> {
    try {
      const tenantId = req.user?.tenantId;
      const { workflowId, signatureId } = req.params;

      if (!tenantId) {
        return ResponseHelper.error(res, 'Unauthorized', 401);
      }

      logger.debug('Verifying signature', { tenantId, workflowId, signatureId });

      const verification = await digitalSignatureService.verifySignature(
        tenantId,
        workflowId,
        signatureId
      );

      return ResponseHelper.success(res, verification, 'Signature verification completed');
    } catch (error) {
      logger.error('Error verifying signature', { error });

      if (error instanceof AppError) {
        return ResponseHelper.error(res, error.message, error.statusCode);
      }

      return ResponseHelper.error(res, 'Failed to verify signature', 500);
    }
  }
}

export const digitalSignatureController = new DigitalSignatureController();
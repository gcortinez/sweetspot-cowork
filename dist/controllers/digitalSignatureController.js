"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitalSignatureController = exports.DigitalSignatureController = void 0;
const zod_1 = require("zod");
const digitalSignatureService_1 = require("../services/digitalSignatureService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const SignerSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    role: zod_1.z.string().optional(),
    order: zod_1.z.number().min(1),
    isRequired: zod_1.z.boolean(),
    userId: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
});
const SignatureFieldSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    x: zod_1.z.number().min(0),
    y: zod_1.z.number().min(0),
    width: zod_1.z.number().min(1),
    height: zod_1.z.number().min(1),
    page: zod_1.z.number().min(1),
    signerId: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(digitalSignatureService_1.SignatureType),
    required: zod_1.z.boolean(),
    label: zod_1.z.string().optional(),
});
const CreateSignatureWorkflowSchema = zod_1.z.object({
    contractId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(255),
    documentContent: zod_1.z.string().min(1),
    documentUrl: zod_1.z.string().url().optional(),
    signers: zod_1.z.array(SignerSchema).min(1),
    signatureFields: zod_1.z.array(SignatureFieldSchema).min(1),
    message: zod_1.z.string().optional(),
    expiresAt: zod_1.z.coerce.date().optional(),
    requireAllSigners: zod_1.z.boolean().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const UpdateSignatureWorkflowSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255).optional(),
    message: zod_1.z.string().optional(),
    expiresAt: zod_1.z.coerce.date().optional(),
    requireAllSigners: zod_1.z.boolean().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const SignDocumentSchema = zod_1.z.object({
    signatureFieldId: zod_1.z.string().min(1),
    signatureType: zod_1.z.nativeEnum(digitalSignatureService_1.SignatureType),
    signatureData: zod_1.z.string().min(1),
});
const DeclineSignatureSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
const CancelWorkflowSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
const SignatureWorkflowQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    status: zod_1.z.nativeEnum(digitalSignatureService_1.SignatureStatus).optional(),
    contractId: zod_1.z.string().optional(),
    signerId: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
class DigitalSignatureController {
    async createWorkflow(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const createdBy = req.user?.id;
            if (!tenantId || !createdBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = CreateSignatureWorkflowSchema.parse(req.body);
            logger_1.logger.info('Creating signature workflow', {
                tenantId,
                createdBy,
                contractId: validatedData.contractId,
                title: validatedData.title,
            });
            const workflow = await digitalSignatureService_1.digitalSignatureService.createSignatureWorkflow(tenantId, createdBy, validatedData);
            logger_1.logger.info('Signature workflow created successfully', {
                tenantId,
                workflowId: workflow.id,
                contractId: workflow.contractId,
            });
            return response_1.ResponseHelper.success(res, workflow, 'Signature workflow created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Error creating signature workflow', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.ValidationError) {
                return response_1.ResponseHelper.error(res, error.message, 400);
            }
            return response_1.ResponseHelper.error(res, 'Failed to create signature workflow', 500);
        }
    }
    async getWorkflows(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = SignatureWorkflowQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching signature workflows', { tenantId, query });
            const result = await digitalSignatureService_1.digitalSignatureService.getSignatureWorkflows(tenantId, query);
            return response_1.ResponseHelper.success(res, result, 'Signature workflows retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching signature workflows', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch signature workflows', 500);
        }
    }
    async getWorkflowById(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching signature workflow by ID', { tenantId, workflowId: id });
            const workflow = await digitalSignatureService_1.digitalSignatureService.getWorkflowById(tenantId, id);
            return response_1.ResponseHelper.success(res, workflow, 'Signature workflow retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching signature workflow', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch signature workflow', 500);
        }
    }
    async updateWorkflow(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = UpdateSignatureWorkflowSchema.parse(req.body);
            logger_1.logger.info('Updating signature workflow', {
                tenantId,
                workflowId: id,
                updatedBy: req.user?.id,
            });
            const workflow = await digitalSignatureService_1.digitalSignatureService.updateWorkflow(tenantId, id, validatedData);
            logger_1.logger.info('Signature workflow updated successfully', {
                tenantId,
                workflowId: id,
            });
            return response_1.ResponseHelper.success(res, workflow, 'Signature workflow updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error updating signature workflow', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to update signature workflow', 500);
        }
    }
    async signDocument(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { workflowId, signerId } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = SignDocumentSchema.parse(req.body);
            const signerDetails = {
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                timestamp: new Date(),
            };
            logger_1.logger.info('Processing document signature', {
                tenantId,
                workflowId,
                signerId,
                signatureFieldId: validatedData.signatureFieldId,
            });
            const result = await digitalSignatureService_1.digitalSignatureService.signDocument(tenantId, workflowId, signerId, {
                ...validatedData,
                signerDetails,
            });
            logger_1.logger.info('Document signed successfully', {
                tenantId,
                workflowId,
                signerId,
                workflowStatus: result.workflow.status,
            });
            return response_1.ResponseHelper.success(res, result, 'Document signed successfully');
        }
        catch (error) {
            logger_1.logger.error('Error signing document', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to sign document', 500);
        }
    }
    async declineSignature(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { workflowId, signerId } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { reason } = DeclineSignatureSchema.parse(req.body);
            logger_1.logger.info('Processing signature decline', {
                tenantId,
                workflowId,
                signerId,
                reason,
            });
            const workflow = await digitalSignatureService_1.digitalSignatureService.declineSignature(tenantId, workflowId, signerId, reason);
            logger_1.logger.info('Signature declined successfully', {
                tenantId,
                workflowId,
                signerId,
            });
            return response_1.ResponseHelper.success(res, workflow, 'Signature declined successfully');
        }
        catch (error) {
            logger_1.logger.error('Error declining signature', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to decline signature', 500);
        }
    }
    async cancelWorkflow(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const cancelledBy = req.user?.id;
            if (!tenantId || !cancelledBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { reason } = CancelWorkflowSchema.parse(req.body);
            logger_1.logger.info('Cancelling signature workflow', {
                tenantId,
                workflowId: id,
                cancelledBy,
                reason,
            });
            const workflow = await digitalSignatureService_1.digitalSignatureService.cancelWorkflow(tenantId, id, cancelledBy, reason);
            logger_1.logger.info('Signature workflow cancelled successfully', {
                tenantId,
                workflowId: id,
            });
            return response_1.ResponseHelper.success(res, workflow, 'Signature workflow cancelled successfully');
        }
        catch (error) {
            logger_1.logger.error('Error cancelling signature workflow', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to cancel signature workflow', 500);
        }
    }
    async getSignerView(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { workflowId, signerId } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching signer view', { tenantId, workflowId, signerId });
            const signerView = await digitalSignatureService_1.digitalSignatureService.getSignerView(tenantId, workflowId, signerId);
            return response_1.ResponseHelper.success(res, signerView, 'Signer view retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching signer view', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch signer view', 500);
        }
    }
    async getAuditTrail(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching signature audit trail', { tenantId, workflowId: id });
            const auditTrail = await digitalSignatureService_1.digitalSignatureService.getAuditTrail(tenantId, id);
            return response_1.ResponseHelper.success(res, auditTrail, 'Audit trail retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching audit trail', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch audit trail', 500);
        }
    }
    async verifySignature(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { workflowId, signatureId } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Verifying signature', { tenantId, workflowId, signatureId });
            const verification = await digitalSignatureService_1.digitalSignatureService.verifySignature(tenantId, workflowId, signatureId);
            return response_1.ResponseHelper.success(res, verification, 'Signature verification completed');
        }
        catch (error) {
            logger_1.logger.error('Error verifying signature', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to verify signature', 500);
        }
    }
}
exports.DigitalSignatureController = DigitalSignatureController;
exports.digitalSignatureController = new DigitalSignatureController();
//# sourceMappingURL=digitalSignatureController.js.map
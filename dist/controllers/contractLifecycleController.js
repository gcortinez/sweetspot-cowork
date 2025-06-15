"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractLifecycleController = exports.ContractLifecycleController = void 0;
const zod_1 = require("zod");
const contractLifecycleService_1 = require("../services/contractLifecycleService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const ContractPartySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['CLIENT', 'COMPANY']),
    signedAt: zod_1.z.coerce.date().optional(),
    userId: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
});
const ContractTermSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    order: zod_1.z.number().min(1),
    isRequired: zod_1.z.boolean(),
});
const CreateContractSchema = zod_1.z.object({
    templateId: zod_1.z.string().optional(),
    quotationId: zod_1.z.string().optional(),
    opportunityId: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(contractLifecycleService_1.ContractType),
    title: zod_1.z.string().min(1).max(255),
    content: zod_1.z.string().min(1),
    parties: zod_1.z.array(ContractPartySchema).min(2),
    terms: zod_1.z.array(ContractTermSchema),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date().optional(),
    autoRenewal: zod_1.z.boolean(),
    renewalPeriod: zod_1.z.number().min(1).optional(),
    value: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().length(3).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const UpdateContractSchema = CreateContractSchema.partial();
const ContractQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    status: zod_1.z.nativeEnum(contractLifecycleService_1.ContractStatus).optional(),
    type: zod_1.z.nativeEnum(contractLifecycleService_1.ContractType).optional(),
    clientId: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    expiringDays: zod_1.z.coerce.number().min(1).max(365).optional(),
    sortBy: zod_1.z.string().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
const SuspendContractSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
const TerminateContractSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
    terminationDate: zod_1.z.coerce.date().optional(),
});
const CancelContractSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
class ContractLifecycleController {
    async createContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const createdBy = req.user?.id;
            if (!tenantId || !createdBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = CreateContractSchema.parse(req.body);
            logger_1.logger.info('Creating contract', {
                tenantId,
                createdBy,
                type: validatedData.type,
                title: validatedData.title,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.createContract(tenantId, createdBy, validatedData);
            logger_1.logger.info('Contract created successfully', {
                tenantId,
                contractId: contract.id,
                type: contract.type,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Error creating contract', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.ValidationError) {
                return response_1.ResponseHelper.error(res, error.message, 400);
            }
            return response_1.ResponseHelper.error(res, 'Failed to create contract', 500);
        }
    }
    async getContracts(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = ContractQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching contracts', { tenantId, query });
            const result = await contractLifecycleService_1.contractLifecycleService.getContracts(tenantId, query);
            return response_1.ResponseHelper.success(res, result, 'Contracts retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contracts', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contracts', 500);
        }
    }
    async getContractById(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching contract by ID', { tenantId, contractId: id });
            const contract = await contractLifecycleService_1.contractLifecycleService.getContractById(tenantId, id);
            return response_1.ResponseHelper.success(res, contract, 'Contract retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract', 500);
        }
    }
    async updateContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = UpdateContractSchema.parse(req.body);
            logger_1.logger.info('Updating contract', {
                tenantId,
                contractId: id,
                updatedBy: req.user?.id,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.updateContract(tenantId, id, validatedData);
            logger_1.logger.info('Contract updated successfully', {
                tenantId,
                contractId: id,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error updating contract', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to update contract', 500);
        }
    }
    async activateContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const activatedBy = req.user?.id;
            if (!tenantId || !activatedBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Activating contract', {
                tenantId,
                contractId: id,
                activatedBy,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.activateContract(tenantId, id, activatedBy);
            logger_1.logger.info('Contract activated successfully', {
                tenantId,
                contractId: id,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract activated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error activating contract', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to activate contract', 500);
        }
    }
    async suspendContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const suspendedBy = req.user?.id;
            if (!tenantId || !suspendedBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { reason } = SuspendContractSchema.parse(req.body);
            logger_1.logger.info('Suspending contract', {
                tenantId,
                contractId: id,
                suspendedBy,
                reason,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.suspendContract(tenantId, id, suspendedBy, reason);
            logger_1.logger.info('Contract suspended successfully', {
                tenantId,
                contractId: id,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract suspended successfully');
        }
        catch (error) {
            logger_1.logger.error('Error suspending contract', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to suspend contract', 500);
        }
    }
    async reactivateContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const reactivatedBy = req.user?.id;
            if (!tenantId || !reactivatedBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Reactivating contract', {
                tenantId,
                contractId: id,
                reactivatedBy,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.reactivateContract(tenantId, id, reactivatedBy);
            logger_1.logger.info('Contract reactivated successfully', {
                tenantId,
                contractId: id,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract reactivated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error reactivating contract', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to reactivate contract', 500);
        }
    }
    async terminateContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const terminatedBy = req.user?.id;
            if (!tenantId || !terminatedBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { reason, terminationDate } = TerminateContractSchema.parse(req.body);
            logger_1.logger.info('Terminating contract', {
                tenantId,
                contractId: id,
                terminatedBy,
                reason,
                terminationDate,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.terminateContract(tenantId, id, terminatedBy, reason, terminationDate);
            logger_1.logger.info('Contract terminated successfully', {
                tenantId,
                contractId: id,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract terminated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error terminating contract', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to terminate contract', 500);
        }
    }
    async cancelContract(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const cancelledBy = req.user?.id;
            if (!tenantId || !cancelledBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { reason } = CancelContractSchema.parse(req.body);
            logger_1.logger.info('Cancelling contract', {
                tenantId,
                contractId: id,
                cancelledBy,
                reason,
            });
            const contract = await contractLifecycleService_1.contractLifecycleService.cancelContract(tenantId, id, cancelledBy, reason);
            logger_1.logger.info('Contract cancelled successfully', {
                tenantId,
                contractId: id,
            });
            return response_1.ResponseHelper.success(res, contract, 'Contract cancelled successfully');
        }
        catch (error) {
            logger_1.logger.error('Error cancelling contract', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to cancel contract', 500);
        }
    }
    async getContractActivity(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching contract activity', { tenantId, contractId: id });
            const activity = await contractLifecycleService_1.contractLifecycleService.getContractActivity(tenantId, id);
            return response_1.ResponseHelper.success(res, activity, 'Contract activity retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract activity', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract activity', 500);
        }
    }
    async getContractStats(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching contract statistics', { tenantId });
            const stats = await contractLifecycleService_1.contractLifecycleService.getContractStats(tenantId);
            return response_1.ResponseHelper.success(res, stats, 'Contract statistics retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching contract statistics', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch contract statistics', 500);
        }
    }
    async getExpiringContracts(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const days = req.query.days ? parseInt(req.query.days) : 30;
            if (isNaN(days) || days < 1 || days > 365) {
                return response_1.ResponseHelper.error(res, 'Invalid days parameter. Must be between 1 and 365', 400);
            }
            logger_1.logger.debug('Fetching expiring contracts', { tenantId, days });
            const contracts = await contractLifecycleService_1.contractLifecycleService.getExpiringContracts(tenantId, days);
            return response_1.ResponseHelper.success(res, contracts, `Contracts expiring in ${days} days retrieved successfully`);
        }
        catch (error) {
            logger_1.logger.error('Error fetching expiring contracts', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch expiring contracts', 500);
        }
    }
    async sendContractForSignature(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            const sentBy = req.user?.id;
            if (!tenantId || !sentBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Sending contract for signature', {
                tenantId,
                contractId: id,
                sentBy,
            });
            const result = await contractLifecycleService_1.contractLifecycleService.sendContractForSignature(tenantId, id, sentBy);
            logger_1.logger.info('Contract sent for signature successfully', {
                tenantId,
                contractId: id,
                workflowId: result.workflowId,
            });
            return response_1.ResponseHelper.success(res, result, 'Contract sent for signature successfully');
        }
        catch (error) {
            logger_1.logger.error('Error sending contract for signature', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to send contract for signature', 500);
        }
    }
}
exports.ContractLifecycleController = ContractLifecycleController;
exports.contractLifecycleController = new ContractLifecycleController();
//# sourceMappingURL=contractLifecycleController.js.map
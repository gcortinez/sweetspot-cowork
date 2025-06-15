"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractRenewalController = exports.ContractRenewalController = void 0;
const zod_1 = require("zod");
const contractRenewalService_1 = require("../services/contractRenewalService");
const contractLifecycleService_1 = require("../services/contractLifecycleService");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const CreateRenewalRuleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    contractTypes: zod_1.z.array(zod_1.z.string()).min(1),
    trigger: zod_1.z.nativeEnum(contractRenewalService_1.RenewalTrigger),
    triggerDays: zod_1.z.number().min(1).max(365).optional(),
    renewalType: zod_1.z.nativeEnum(contractRenewalService_1.RenewalType),
    autoApprove: zod_1.z.boolean(),
    renewalPeriod: zod_1.z.number().min(1).max(120),
    priceAdjustment: zod_1.z.object({
        type: zod_1.z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
        value: zod_1.z.number(),
    }).optional(),
    notificationSettings: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        types: zod_1.z.array(zod_1.z.nativeEnum(contractRenewalService_1.NotificationType)),
        recipients: zod_1.z.array(zod_1.z.string().email()),
        template: zod_1.z.string().optional(),
    }),
    conditions: zod_1.z.object({
        minContractValue: zod_1.z.number().min(0).optional(),
        maxContractValue: zod_1.z.number().min(0).optional(),
        clientTypes: zod_1.z.array(zod_1.z.string()).optional(),
        excludeClientIds: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
const UpdateRenewalRuleSchema = CreateRenewalRuleSchema.partial();
const ProcessRenewalSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVE', 'DECLINE']),
    notes: zod_1.z.string().optional(),
    declineReason: zod_1.z.string().optional(),
    modifyTerms: zod_1.z.boolean().optional(),
    newValue: zod_1.z.number().min(0).optional(),
    newEndDate: zod_1.z.coerce.date().optional(),
});
const RenewalQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    status: zod_1.z.nativeEnum(contractLifecycleService_1.RenewalStatus).optional(),
    contractId: zod_1.z.string().optional(),
    ruleId: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
class ContractRenewalController {
    async createRenewalRule(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const createdBy = req.user?.id;
            if (!tenantId || !createdBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = CreateRenewalRuleSchema.parse(req.body);
            logger_1.logger.info('Creating renewal rule', {
                tenantId,
                createdBy,
                ruleName: validatedData.name,
                trigger: validatedData.trigger,
            });
            const rule = await contractRenewalService_1.contractRenewalService.createRenewalRule(tenantId, createdBy, validatedData);
            logger_1.logger.info('Renewal rule created successfully', {
                tenantId,
                ruleId: rule.id,
                ruleName: rule.name,
            });
            return response_1.ResponseHelper.success(res, rule, 'Renewal rule created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Error creating renewal rule', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.ValidationError) {
                return response_1.ResponseHelper.error(res, error.message, 400);
            }
            return response_1.ResponseHelper.error(res, 'Failed to create renewal rule', 500);
        }
    }
    async getRenewalRules(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching renewal rules', { tenantId });
            const rules = await contractRenewalService_1.contractRenewalService.getRenewalRules(tenantId);
            return response_1.ResponseHelper.success(res, rules, 'Renewal rules retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching renewal rules', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch renewal rules', 500);
        }
    }
    async updateRenewalRule(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = UpdateRenewalRuleSchema.parse(req.body);
            logger_1.logger.info('Updating renewal rule', {
                tenantId,
                ruleId: id,
                updatedBy: req.user?.id,
            });
            const rule = await contractRenewalService_1.contractRenewalService.updateRenewalRule(tenantId, id, validatedData);
            logger_1.logger.info('Renewal rule updated successfully', {
                tenantId,
                ruleId: id,
            });
            return response_1.ResponseHelper.success(res, rule, 'Renewal rule updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Error updating renewal rule', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to update renewal rule', 500);
        }
    }
    async deleteRenewalRule(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Deleting renewal rule', {
                tenantId,
                ruleId: id,
                deletedBy: req.user?.id,
            });
            const result = await contractRenewalService_1.contractRenewalService.deleteRenewalRule(tenantId, id);
            logger_1.logger.info('Renewal rule deleted successfully', {
                tenantId,
                ruleId: id,
            });
            return response_1.ResponseHelper.success(res, result, 'Renewal rule deleted successfully');
        }
        catch (error) {
            logger_1.logger.error('Error deleting renewal rule', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to delete renewal rule', 500);
        }
    }
    async createRenewalProposal(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const createdBy = req.user?.id;
            const { contractId } = req.params;
            if (!tenantId || !createdBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { ruleId } = req.body;
            logger_1.logger.info('Creating renewal proposal', {
                tenantId,
                contractId,
                ruleId,
                createdBy,
            });
            const proposal = await contractRenewalService_1.contractRenewalService.createRenewalProposal(tenantId, contractId, createdBy, ruleId);
            logger_1.logger.info('Renewal proposal created successfully', {
                tenantId,
                proposalId: proposal.id,
                contractId,
                status: proposal.status,
            });
            return response_1.ResponseHelper.success(res, proposal, 'Renewal proposal created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Error creating renewal proposal', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to create renewal proposal', 500);
        }
    }
    async getRenewalProposals(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const query = RenewalQuerySchema.parse(req.query);
            logger_1.logger.debug('Fetching renewal proposals', { tenantId, query });
            const result = await contractRenewalService_1.contractRenewalService.getRenewalProposals(tenantId, query);
            return response_1.ResponseHelper.success(res, result, 'Renewal proposals retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching renewal proposals', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Invalid query parameters', 400, error.errors);
            }
            return response_1.ResponseHelper.error(res, 'Failed to fetch renewal proposals', 500);
        }
    }
    async processRenewalProposal(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const processedBy = req.user?.id;
            const { id } = req.params;
            if (!tenantId || !processedBy) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const validatedData = ProcessRenewalSchema.parse(req.body);
            logger_1.logger.info('Processing renewal proposal', {
                tenantId,
                proposalId: id,
                action: validatedData.action,
                processedBy,
            });
            const proposal = await contractRenewalService_1.contractRenewalService.processRenewalProposal(tenantId, id, processedBy, validatedData);
            logger_1.logger.info('Renewal proposal processed successfully', {
                tenantId,
                proposalId: id,
                action: validatedData.action,
                newStatus: proposal.status,
            });
            return response_1.ResponseHelper.success(res, proposal, `Renewal proposal ${validatedData.action.toLowerCase()}d successfully`);
        }
        catch (error) {
            logger_1.logger.error('Error processing renewal proposal', { error });
            if (error instanceof zod_1.z.ZodError) {
                return response_1.ResponseHelper.error(res, 'Validation failed', 400, error.errors);
            }
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to process renewal proposal', 500);
        }
    }
    async checkAndCreateRenewals(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.info('Running renewal check for tenant', { tenantId });
            const result = await contractRenewalService_1.contractRenewalService.checkAndCreateRenewals(tenantId);
            logger_1.logger.info('Renewal check completed', {
                tenantId,
                created: result.created,
                processed: result.processed,
                notifications: result.notifications,
            });
            return response_1.ResponseHelper.success(res, result, 'Renewal check completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Error running renewal check', { error });
            return response_1.ResponseHelper.error(res, 'Failed to run renewal check', 500);
        }
    }
    async getRenewalStats(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            logger_1.logger.debug('Fetching renewal statistics', { tenantId });
            const stats = await contractRenewalService_1.contractRenewalService.getRenewalStats(tenantId);
            return response_1.ResponseHelper.success(res, stats, 'Renewal statistics retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Error fetching renewal statistics', { error });
            return response_1.ResponseHelper.error(res, 'Failed to fetch renewal statistics', 500);
        }
    }
    async toggleRuleStatus(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            const { id } = req.params;
            if (!tenantId) {
                return response_1.ResponseHelper.error(res, 'Unauthorized', 401);
            }
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return response_1.ResponseHelper.error(res, 'isActive must be a boolean', 400);
            }
            logger_1.logger.info('Toggling renewal rule status', {
                tenantId,
                ruleId: id,
                isActive,
                updatedBy: req.user?.id,
            });
            const rule = await contractRenewalService_1.contractRenewalService.updateRenewalRule(tenantId, id, { isActive });
            logger_1.logger.info('Renewal rule status updated', {
                tenantId,
                ruleId: id,
                isActive: rule.isActive,
            });
            return response_1.ResponseHelper.success(res, rule, `Renewal rule ${isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (error) {
            logger_1.logger.error('Error toggling renewal rule status', { error });
            if (error instanceof errors_1.AppError) {
                return response_1.ResponseHelper.error(res, error.message, error.statusCode);
            }
            return response_1.ResponseHelper.error(res, 'Failed to update renewal rule status', 500);
        }
    }
}
exports.ContractRenewalController = ContractRenewalController;
exports.contractRenewalController = new ContractRenewalController();
//# sourceMappingURL=contractRenewalController.js.map
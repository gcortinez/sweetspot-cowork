"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTwoFactorRequired = exports.getTwoFactorStatus = exports.generateBackupCodes = exports.verifyTwoFactor = exports.disableTwoFactor = exports.enableTwoFactor = exports.setupTwoFactor = void 0;
const zod_1 = require("zod");
const twoFactorService_1 = require("../services/twoFactorService");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const EnableTwoFactorSchema = zod_1.z.object({
    secret: zod_1.z.string().min(1, 'Secret is required'),
    token: zod_1.z.string().regex(/^\d{6}$/, 'Token must be 6 digits'),
    backupCodes: zod_1.z.array(zod_1.z.string()).min(10, 'Must have 10 backup codes')
});
const VerifyTwoFactorSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required')
});
const DisableTwoFactorSchema = zod_1.z.object({
    token: zod_1.z.string().regex(/^\d{6}$/, 'Token must be 6 digits')
});
const getTenantId = (req) => {
    if (!req.user?.tenantId) {
        throw new errors_1.ValidationError('Tenant context required');
    }
    return req.user.tenantId;
};
const getUserId = (req) => {
    if (!req.user?.id) {
        throw new errors_1.ValidationError('User context required');
    }
    return req.user.id;
};
const setupTwoFactor = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const setupData = await twoFactorService_1.twoFactorService.setupTwoFactor(userId, tenantId);
        response_1.ApiResponse.success(res, {
            secret: setupData.secret,
            qrCodeUrl: setupData.qrCodeUrl,
            manualEntryKey: setupData.manualEntryKey,
            backupCodes: setupData.backupCodes
        }, '2FA setup initiated. Please verify with your authenticator app.');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.setupTwoFactor = setupTwoFactor;
const enableTwoFactor = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const validatedData = EnableTwoFactorSchema.parse(req.body);
        await twoFactorService_1.twoFactorService.enableTwoFactor(userId, tenantId, validatedData.secret, validatedData.token, validatedData.backupCodes);
        response_1.ApiResponse.success(res, null, '2FA has been enabled successfully');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.enableTwoFactor = enableTwoFactor;
const disableTwoFactor = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const validatedData = DisableTwoFactorSchema.parse(req.body);
        await twoFactorService_1.twoFactorService.disableTwoFactor(userId, tenantId, validatedData.token);
        response_1.ApiResponse.success(res, null, '2FA has been disabled');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.disableTwoFactor = disableTwoFactor;
const verifyTwoFactor = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const validatedData = VerifyTwoFactorSchema.parse(req.body);
        const result = await twoFactorService_1.twoFactorService.verifyTwoFactor(userId, tenantId, validatedData.token);
        if (result.success) {
            response_1.ApiResponse.success(res, {
                verified: true,
                usedBackupCode: result.usedBackupCode,
                remainingBackupCodes: result.remainingBackupCodes
            }, '2FA verification successful');
        }
        else {
            response_1.ApiResponse.error(res, new errors_1.ValidationError('Invalid verification code'), 401);
        }
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.verifyTwoFactor = verifyTwoFactor;
const generateBackupCodes = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const backupCodes = await twoFactorService_1.twoFactorService.generateNewBackupCodes(userId, tenantId);
        response_1.ApiResponse.success(res, {
            backupCodes
        }, 'New backup codes generated. Please store them securely.');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.generateBackupCodes = generateBackupCodes;
const getTwoFactorStatus = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const status = await twoFactorService_1.twoFactorService.getTwoFactorStatus(userId, tenantId);
        response_1.ApiResponse.success(res, status, '2FA status retrieved');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.getTwoFactorStatus = getTwoFactorStatus;
const checkTwoFactorRequired = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const { operation } = req.body;
        if (!operation) {
            throw new errors_1.ValidationError('Operation is required');
        }
        const required = await twoFactorService_1.twoFactorService.requireTwoFactorForOperation(userId, tenantId, operation);
        response_1.ApiResponse.success(res, {
            required,
            operation
        }, required ? '2FA verification required for this operation' : '2FA not required');
    }
    catch (error) {
        response_1.ApiResponse.error(res, error);
    }
};
exports.checkTwoFactorRequired = checkTwoFactorRequired;
//# sourceMappingURL=twoFactorController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorService = exports.TwoFactorService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
const auditLogService_1 = require("./auditLogService");
class TwoFactorService {
    APP_NAME = 'SweetSpot Cowork';
    async setupTwoFactor(userId, tenantId) {
        try {
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId, tenantId }
            });
            if (!user) {
                throw new errors_1.ValidationError('User not found');
            }
            const secret = speakeasy_1.default.generateSecret({
                name: `${this.APP_NAME}:${user.email}`,
                issuer: this.APP_NAME,
                length: 32
            });
            const backupCodes = this.generateBackupCodes();
            const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
            return {
                secret: secret.base32,
                backupCodes,
                qrCodeUrl,
                manualEntryKey: secret.base32
            };
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to setup 2FA: ${error.message}`);
        }
    }
    async enableTwoFactor(userId, tenantId, secret, token, backupCodes) {
        try {
            const isValid = this.verifyToken(secret, token);
            if (!isValid) {
                throw new errors_1.ValidationError('Invalid verification code');
            }
            await prisma_1.prisma.user.update({
                where: { id: userId, tenantId },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: secret,
                    twoFactorBackupCodes: backupCodes,
                    lastTwoFactorVerified: new Date()
                }
            });
            await auditLogService_1.auditLogService.log({
                tenantId,
                userId,
                action: 'ENABLE_2FA',
                entityType: 'User',
                entityId: userId,
                details: { message: '2FA enabled successfully' }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to enable 2FA: ${error.message}`);
        }
    }
    async disableTwoFactor(userId, tenantId, token) {
        try {
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId, tenantId, twoFactorEnabled: true }
            });
            if (!user || !user.twoFactorSecret) {
                throw new errors_1.ValidationError('2FA is not enabled for this user');
            }
            const isValid = this.verifyToken(user.twoFactorSecret, token);
            if (!isValid) {
                throw new errors_1.ValidationError('Invalid verification code');
            }
            await prisma_1.prisma.user.update({
                where: { id: userId, tenantId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    twoFactorBackupCodes: [],
                    lastTwoFactorVerified: null
                }
            });
            await auditLogService_1.auditLogService.log({
                tenantId,
                userId,
                action: 'DISABLE_2FA',
                entityType: 'User',
                entityId: userId,
                details: { message: '2FA disabled' }
            });
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to disable 2FA: ${error.message}`);
        }
    }
    async verifyTwoFactor(userId, tenantId, token) {
        try {
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId, tenantId, twoFactorEnabled: true }
            });
            if (!user || !user.twoFactorSecret) {
                throw new errors_1.UnauthorizedError('2FA is not enabled for this user');
            }
            const isValidToken = this.verifyToken(user.twoFactorSecret, token);
            if (isValidToken) {
                await prisma_1.prisma.user.update({
                    where: { id: userId, tenantId },
                    data: { lastTwoFactorVerified: new Date() }
                });
                await auditLogService_1.auditLogService.log({
                    tenantId,
                    userId,
                    action: 'VERIFY_2FA',
                    entityType: 'User',
                    entityId: userId,
                    details: { method: 'totp' }
                });
                return { success: true };
            }
            const backupCodes = user.twoFactorBackupCodes;
            if (backupCodes && backupCodes.includes(token)) {
                const remainingCodes = backupCodes.filter(code => code !== token);
                await prisma_1.prisma.user.update({
                    where: { id: userId, tenantId },
                    data: {
                        twoFactorBackupCodes: remainingCodes,
                        lastTwoFactorVerified: new Date()
                    }
                });
                await auditLogService_1.auditLogService.log({
                    tenantId,
                    userId,
                    action: 'VERIFY_2FA',
                    entityType: 'User',
                    entityId: userId,
                    details: {
                        method: 'backup_code',
                        remainingBackupCodes: remainingCodes.length
                    }
                });
                return {
                    success: true,
                    usedBackupCode: true,
                    remainingBackupCodes: remainingCodes.length
                };
            }
            return { success: false };
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to verify 2FA: ${error.message}`);
        }
    }
    async generateNewBackupCodes(userId, tenantId) {
        try {
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId, tenantId, twoFactorEnabled: true }
            });
            if (!user) {
                throw new errors_1.ValidationError('2FA is not enabled for this user');
            }
            const backupCodes = this.generateBackupCodes();
            await prisma_1.prisma.user.update({
                where: { id: userId, tenantId },
                data: { twoFactorBackupCodes: backupCodes }
            });
            await auditLogService_1.auditLogService.log({
                tenantId,
                userId,
                action: 'UPDATE',
                entityType: 'User',
                entityId: userId,
                details: { message: 'Generated new backup codes' }
            });
            return backupCodes;
        }
        catch (error) {
            throw new errors_1.ValidationError(`Failed to generate backup codes: ${error.message}`);
        }
    }
    async isTwoFactorEnabled(userId, tenantId) {
        const user = await prisma_1.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: { twoFactorEnabled: true }
        });
        return user?.twoFactorEnabled || false;
    }
    async getTwoFactorStatus(userId, tenantId) {
        const user = await prisma_1.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: {
                twoFactorEnabled: true,
                twoFactorBackupCodes: true,
                lastTwoFactorVerified: true
            }
        });
        if (!user) {
            throw new errors_1.ValidationError('User not found');
        }
        const backupCodes = user.twoFactorBackupCodes;
        return {
            enabled: user.twoFactorEnabled,
            backupCodesRemaining: backupCodes ? backupCodes.length : 0,
            lastVerified: user.lastTwoFactorVerified
        };
    }
    verifyToken(secret, token) {
        return speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2
        });
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    async requireTwoFactorForOperation(userId, tenantId, operation) {
        const user = await prisma_1.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: {
                twoFactorEnabled: true,
                lastTwoFactorVerified: true,
                role: true
            }
        });
        if (!user) {
            throw new errors_1.ValidationError('User not found');
        }
        if (!user.twoFactorEnabled) {
            return false;
        }
        const lastVerified = user.lastTwoFactorVerified;
        if (!lastVerified) {
            return true;
        }
        const timeSinceVerification = Date.now() - lastVerified.getTime();
        const thirtyMinutes = 30 * 60 * 1000;
        const sensitiveOperations = ['DISABLE_2FA', 'USER_DELETE', 'SYSTEM_CONFIG', 'EXPORT_DATA'];
        if (sensitiveOperations.includes(operation) || timeSinceVerification > thirtyMinutes) {
            return true;
        }
        return false;
    }
}
exports.TwoFactorService = TwoFactorService;
exports.twoFactorService = new TwoFactorService();
//# sourceMappingURL=twoFactorService.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
const encryptionService_1 = require("./encryptionService");
const auditLogService_1 = require("./auditLogService");
const securityEventService_1 = require("./securityEventService");
class SessionService {
    accessTokenSecret;
    refreshTokenSecret;
    defaultConfig = {
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d',
        maxConcurrentSessions: 5,
        requireTwoFactor: false,
        trackLocation: true
    };
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET || 'fallback-secret';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            logger_1.logger.warn('JWT secrets not configured properly in environment variables');
        }
    }
    async createSession(sessionData, config = {}) {
        const mergedConfig = { ...this.defaultConfig, ...config };
        const sessionId = this.generateSecureSessionId();
        try {
            if (mergedConfig.maxConcurrentSessions) {
                await this.enforceSessionLimit(sessionData.userId, mergedConfig.maxConcurrentSessions);
            }
            const expiresAt = new Date(Date.now() + this.parseExpiryTime(mergedConfig.refreshTokenExpiry));
            await prisma_1.prisma.userSession.create({
                data: {
                    id: sessionId,
                    userId: sessionData.userId,
                    tenantId: sessionData.tenantId,
                    refreshToken: encryptionService_1.encryptionService.hash(sessionId),
                    deviceInfo: sessionData.deviceInfo,
                    ipAddress: sessionData.ipAddress,
                    userAgent: sessionData.userAgent,
                    expiresAt,
                    lastActivity: new Date(),
                    isActive: true
                }
            });
            const accessToken = this.generateAccessToken(sessionData, sessionId, mergedConfig);
            const refreshToken = this.generateRefreshToken(sessionId, mergedConfig);
            await auditLogService_1.auditLogService.log({
                tenantId: sessionData.tenantId,
                userId: sessionData.userId,
                action: 'CREATE',
                entityType: 'Session',
                entityId: sessionId,
                details: {
                    action: 'Session created',
                    deviceInfo: sessionData.deviceInfo,
                    ipAddress: sessionData.ipAddress
                }
            });
            logger_1.logger.info('Session created successfully', {
                sessionId,
                userId: sessionData.userId,
                tenantId: sessionData.tenantId,
                ipAddress: sessionData.ipAddress
            });
            return {
                accessToken,
                refreshToken,
                sessionId,
                expiresAt
            };
        }
        catch (error) {
            logger_1.logger.error('Session creation failed', {
                userId: sessionData.userId,
                error: error.message
            });
            throw new Error('Failed to create session');
        }
    }
    async validateSession(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
            if (!decoded.sessionId || !decoded.userId) {
                return { isValid: false };
            }
            const session = await prisma_1.prisma.userSession.findFirst({
                where: {
                    id: decoded.sessionId,
                    userId: decoded.userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            tenantId: true,
                            clientId: true
                        }
                    }
                }
            });
            if (!session) {
                return { isValid: false };
            }
            await this.updateSessionActivity(decoded.sessionId);
            const sessionData = {
                id: session.id,
                userId: session.userId,
                tenantId: session.tenantId,
                role: session.user.role,
                clientId: session.user.clientId,
                deviceInfo: session.deviceInfo,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent
            };
            const needsRefresh = decoded.exp && (decoded.exp - Date.now() / 1000) < 300;
            return {
                isValid: true,
                sessionData,
                sessionId: decoded.sessionId,
                needsRefresh
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { isValid: false, needsRefresh: true };
            }
            logger_1.logger.error('Session validation failed', { error: error.message });
            return { isValid: false };
        }
    }
    async refreshSession(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, this.refreshTokenSecret);
            if (!decoded.sessionId) {
                return null;
            }
            const session = await prisma_1.prisma.userSession.findFirst({
                where: {
                    id: decoded.sessionId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            tenantId: true,
                            clientId: true
                        }
                    }
                }
            });
            if (!session) {
                return null;
            }
            const sessionData = {
                id: session.id,
                userId: session.userId,
                tenantId: session.tenantId,
                role: session.user.role,
                clientId: session.user.clientId,
                deviceInfo: session.deviceInfo,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent
            };
            const newAccessToken = this.generateAccessToken(sessionData, decoded.sessionId);
            const newRefreshToken = this.generateRefreshToken(decoded.sessionId);
            await this.updateSessionActivity(decoded.sessionId);
            await auditLogService_1.auditLogService.log({
                tenantId: session.tenantId,
                userId: session.userId,
                action: 'UPDATE',
                entityType: 'Session',
                entityId: session.id,
                details: {
                    action: 'Session refreshed'
                }
            });
            return {
                accessToken: newAccessToken,
                newRefreshToken,
                sessionId: decoded.sessionId
            };
        }
        catch (error) {
            logger_1.logger.error('Session refresh failed', { error: error.message });
            return null;
        }
    }
    async invalidateSession(sessionId, userId) {
        try {
            const session = await prisma_1.prisma.userSession.findFirst({
                where: {
                    id: sessionId,
                    ...(userId && { userId })
                }
            });
            if (!session) {
                return;
            }
            await prisma_1.prisma.userSession.update({
                where: { id: sessionId },
                data: {
                    isActive: false,
                    endedAt: new Date()
                }
            });
            await auditLogService_1.auditLogService.log({
                tenantId: session.tenantId,
                userId: session.userId,
                action: 'DELETE',
                entityType: 'Session',
                entityId: sessionId,
                details: {
                    action: 'Session invalidated'
                }
            });
            logger_1.logger.info('Session invalidated', { sessionId, userId });
        }
        catch (error) {
            logger_1.logger.error('Session invalidation failed', {
                sessionId,
                userId,
                error: error.message
            });
        }
    }
    async invalidateAllUserSessions(userId, exceptSessionId) {
        try {
            const whereClause = {
                userId,
                isActive: true
            };
            if (exceptSessionId) {
                whereClause.id = { not: exceptSessionId };
            }
            const sessions = await prisma_1.prisma.userSession.findMany({
                where: whereClause,
                select: { id: true, tenantId: true }
            });
            await prisma_1.prisma.userSession.updateMany({
                where: whereClause,
                data: {
                    isActive: false,
                    endedAt: new Date()
                }
            });
            for (const session of sessions) {
                await auditLogService_1.auditLogService.log({
                    tenantId: session.tenantId,
                    userId,
                    action: 'DELETE',
                    entityType: 'Session',
                    entityId: session.id,
                    details: {
                        action: 'Session invalidated (bulk)'
                    }
                });
            }
            logger_1.logger.info('All user sessions invalidated', {
                userId,
                exceptSessionId,
                invalidatedCount: sessions.length
            });
        }
        catch (error) {
            logger_1.logger.error('Bulk session invalidation failed', {
                userId,
                error: error.message
            });
        }
    }
    async getUserActiveSessions(userId) {
        try {
            const sessions = await prisma_1.prisma.userSession.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                select: {
                    id: true,
                    userId: true,
                    deviceInfo: true,
                    ipAddress: true,
                    lastActivity: true,
                    createdAt: true,
                    isActive: true
                },
                orderBy: {
                    lastActivity: 'desc'
                }
            });
            return sessions;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user active sessions', {
                userId,
                error: error.message
            });
            return [];
        }
    }
    async cleanupExpiredSessions() {
        try {
            const expiredCount = await prisma_1.prisma.userSession.updateMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
                    ],
                    isActive: true
                },
                data: {
                    isActive: false,
                    endedAt: new Date()
                }
            });
            if (expiredCount.count > 0) {
                logger_1.logger.info('Expired sessions cleaned up', { count: expiredCount.count });
            }
        }
        catch (error) {
            logger_1.logger.error('Session cleanup failed', { error: error.message });
        }
    }
    async detectSuspiciousActivity(sessionId, currentIp) {
        try {
            const session = await prisma_1.prisma.userSession.findUnique({
                where: { id: sessionId }
            });
            if (!session)
                return false;
            if (session.ipAddress && session.ipAddress !== currentIp) {
                await securityEventService_1.securityEventService.logSuspiciousActivity(session.tenantId, 'IP_ADDRESS_CHANGE', session.userId, currentIp, session.userAgent, {
                    originalIp: session.ipAddress,
                    newIp: currentIp,
                    sessionId
                });
                logger_1.logger.warn('Suspicious session activity detected - IP change', {
                    sessionId,
                    userId: session.userId,
                    originalIp: session.ipAddress,
                    newIp: currentIp
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Suspicious activity detection failed', {
                sessionId,
                error: error.message
            });
            return false;
        }
    }
    generateSecureSessionId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    generateAccessToken(sessionData, sessionId, config = {}) {
        const payload = {
            userId: sessionData.userId,
            tenantId: sessionData.tenantId,
            role: sessionData.role,
            clientId: sessionData.clientId,
            sessionId,
            type: 'access'
        };
        return jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
            expiresIn: config.accessTokenExpiry || this.defaultConfig.accessTokenExpiry,
            issuer: 'sweetspot-api',
            audience: 'sweetspot-app'
        });
    }
    generateRefreshToken(sessionId, config = {}) {
        const payload = {
            sessionId,
            type: 'refresh'
        };
        return jsonwebtoken_1.default.sign(payload, this.refreshTokenSecret, {
            expiresIn: config.refreshTokenExpiry || this.defaultConfig.refreshTokenExpiry,
            issuer: 'sweetspot-api',
            audience: 'sweetspot-app'
        });
    }
    parseExpiryTime(expiry) {
        if (typeof expiry === 'number')
            return expiry;
        if (!expiry)
            return 7 * 24 * 60 * 60 * 1000;
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000;
        const [, number, unit] = match;
        return parseInt(number) * units[unit];
    }
    async enforceSessionLimit(userId, maxSessions) {
        const activeSessions = await prisma_1.prisma.userSession.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            orderBy: { lastActivity: 'asc' }
        });
        if (activeSessions.length >= maxSessions) {
            const sessionsToRemove = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
            for (const session of sessionsToRemove) {
                await this.invalidateSession(session.id);
            }
        }
    }
    async updateSessionActivity(sessionId) {
        try {
            await prisma_1.prisma.userSession.update({
                where: { id: sessionId },
                data: { lastActivity: new Date() }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update session activity', {
                sessionId,
                error: error.message
            });
        }
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
//# sourceMappingURL=sessionService.js.map
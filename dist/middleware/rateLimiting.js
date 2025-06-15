"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.isRateLimited = exports.createCustomRateLimit = exports.exportRateLimit = exports.adminRateLimit = exports.resetBruteForceCounters = exports.bruteForcePrevention = exports.progressiveDelay = exports.passwordResetRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const logger_1 = require("../utils/logger");
const securityEventService_1 = require("../services/securityEventService");
class MemoryStore {
    store = {};
    cleanupInterval;
    constructor() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    get(key) {
        const entry = this.store[key];
        if (!entry)
            return null;
        if (Date.now() > entry.resetTime) {
            delete this.store[key];
            return null;
        }
        return entry;
    }
    set(key, value) {
        this.store[key] = value;
    }
    increment(key, windowMs) {
        const now = Date.now();
        const entry = this.get(key);
        if (!entry) {
            this.store[key] = {
                count: 1,
                resetTime: now + windowMs,
                firstAttempt: now
            };
            return { count: 1, resetTime: now + windowMs };
        }
        entry.count++;
        return { count: entry.count, resetTime: entry.resetTime };
    }
    reset(key) {
        delete this.store[key];
    }
    cleanup() {
        const now = Date.now();
        Object.keys(this.store).forEach(key => {
            if (this.store[key].resetTime < now) {
                delete this.store[key];
            }
        });
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.store = {};
    }
}
const store = new MemoryStore();
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res) => {
        const ip = req.ip;
        const userAgent = req.get('User-Agent');
        logger_1.logger.warn('Rate limit exceeded', {
            ip,
            userAgent,
            path: req.path,
            method: req.method
        });
        try {
            const authenticatedReq = req;
            if (authenticatedReq.user?.tenantId) {
                await securityEventService_1.securityEventService.logRateLimitExceeded(authenticatedReq.user.tenantId, req.path, ip, userAgent, authenticatedReq.user.id);
            }
        }
        catch (error) {
        }
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true,
    handler: async (req, res) => {
        const ip = req.ip;
        const userAgent = req.get('User-Agent');
        logger_1.logger.warn('Auth rate limit exceeded', {
            ip,
            userAgent,
            path: req.path
        });
        res.status(429).json({
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});
exports.passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        error: 'Too many password reset attempts, please try again later.',
        retryAfter: '1 hour'
    },
    handler: async (req, res) => {
        const ip = req.ip;
        const userAgent = req.get('User-Agent');
        logger_1.logger.warn('Password reset rate limit exceeded', {
            ip,
            userAgent,
            email: req.body?.email
        });
        res.status(429).json({
            error: 'Too many password reset attempts, please try again later.',
            retryAfter: '1 hour'
        });
    }
});
exports.progressiveDelay = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 5,
    delayMs: 500,
    maxDelayMs: 10000,
});
const bruteForcePrevention = async (req, res, next) => {
    const ip = req.ip;
    const email = req.body?.email;
    if (!email) {
        return next();
    }
    const ipKey = `bf_ip_${ip}`;
    const emailKey = `bf_email_${email}`;
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 5;
    const ipAttempts = store.increment(ipKey, windowMs);
    const emailAttempts = store.increment(emailKey, windowMs);
    if (ipAttempts.count > maxAttempts || emailAttempts.count > maxAttempts) {
        logger_1.logger.warn('Brute force attempt detected', {
            ip,
            email,
            ipAttempts: ipAttempts.count,
            emailAttempts: emailAttempts.count
        });
        try {
            await securityEventService_1.securityEventService.logMultipleFailedLogins('system', email, Math.max(ipAttempts.count, emailAttempts.count), ip, req.get('User-Agent'));
        }
        catch (error) {
            logger_1.logger.error('Failed to log security event', error);
        }
        return res.status(429).json({
            error: 'Account temporarily locked due to multiple failed login attempts',
            retryAfter: Math.ceil((ipAttempts.resetTime - Date.now()) / 1000 / 60) + ' minutes'
        });
    }
    req.bruteForceInfo = {
        ipAttempts: ipAttempts.count,
        emailAttempts: emailAttempts.count,
        ipKey,
        emailKey
    };
    next();
};
exports.bruteForcePrevention = bruteForcePrevention;
const resetBruteForceCounters = (email, ip) => {
    const ipKey = `bf_ip_${ip}`;
    const emailKey = `bf_email_${email}`;
    store.reset(ipKey);
    store.reset(emailKey);
    logger_1.logger.info('Brute force counters reset', { email, ip });
};
exports.resetBruteForceCounters = resetBruteForceCounters;
exports.adminRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many admin requests, please try again later.',
        retryAfter: '5 minutes'
    },
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const authenticatedReq = req;
            return authenticatedReq.user?.role === 'SUPER_ADMIN';
        }
        return false;
    },
    handler: async (req, res) => {
        const ip = req.ip;
        const userAgent = req.get('User-Agent');
        const authenticatedReq = req;
        logger_1.logger.warn('Admin rate limit exceeded', {
            ip,
            userAgent,
            path: req.path,
            userId: authenticatedReq.user?.id
        });
        if (authenticatedReq.user?.tenantId) {
            await securityEventService_1.securityEventService.logRateLimitExceeded(authenticatedReq.user.tenantId, req.path, ip, userAgent, authenticatedReq.user.id);
        }
        res.status(429).json({
            error: 'Too many admin requests, please try again later.',
            retryAfter: '5 minutes'
        });
    }
});
exports.exportRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => {
        const authenticatedReq = req;
        return `export_${authenticatedReq.user?.id || req.ip}`;
    },
    message: {
        error: 'Too many export requests, please try again later.',
        retryAfter: '1 hour'
    },
    handler: async (req, res) => {
        const authenticatedReq = req;
        logger_1.logger.warn('Export rate limit exceeded', {
            userId: authenticatedReq.user?.id,
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            error: 'Too many export requests, please try again later.',
            retryAfter: '1 hour'
        });
    }
});
const createCustomRateLimit = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: { error: options.message },
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger_1.logger.warn('Custom rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                method: req.method
            });
            res.status(429).json({
                error: options.message
            });
        }
    });
};
exports.createCustomRateLimit = createCustomRateLimit;
const isRateLimited = (ip, key) => {
    const entry = store.get(`${key}_${ip}`);
    return entry !== null && entry.count > 5;
};
exports.isRateLimited = isRateLimited;
const cleanup = () => {
    store.destroy();
};
exports.cleanup = cleanup;
//# sourceMappingURL=rateLimiting.js.map
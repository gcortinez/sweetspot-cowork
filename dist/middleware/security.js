"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressiveDelay = exports.bruteForcePrevention = exports.exportRateLimit = exports.adminRateLimit = exports.passwordResetRateLimit = exports.enhancedAuthRateLimit = exports.generalRateLimit = exports.ipFilter = exports.securityMonitoring = exports.requestSizeLimit = exports.sanitizeInput = exports.corsOptions = exports.securityHeaders = exports.strictRateLimit = exports.apiRateLimit = exports.authRateLimit = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("../config");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const rateLimiting_1 = require("./rateLimiting");
Object.defineProperty(exports, "generalRateLimit", { enumerable: true, get: function () { return rateLimiting_1.generalRateLimit; } });
Object.defineProperty(exports, "enhancedAuthRateLimit", { enumerable: true, get: function () { return rateLimiting_1.authRateLimit; } });
Object.defineProperty(exports, "passwordResetRateLimit", { enumerable: true, get: function () { return rateLimiting_1.passwordResetRateLimit; } });
Object.defineProperty(exports, "adminRateLimit", { enumerable: true, get: function () { return rateLimiting_1.adminRateLimit; } });
Object.defineProperty(exports, "exportRateLimit", { enumerable: true, get: function () { return rateLimiting_1.exportRateLimit; } });
Object.defineProperty(exports, "bruteForcePrevention", { enumerable: true, get: function () { return rateLimiting_1.bruteForcePrevention; } });
Object.defineProperty(exports, "progressiveDelay", { enumerable: true, get: function () { return rateLimiting_1.progressiveDelay; } });
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.maxRequests,
        message: {
            error: "Too many requests",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil(config_1.config.rateLimit.windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger_1.logger.warn("Rate limit exceeded", {
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                path: req.path,
            });
            return response_1.ResponseHelper.rateLimitExceeded(res, Math.ceil(config_1.config.rateLimit.windowMs / 1000));
        },
        ...options,
    });
};
exports.createRateLimiter = createRateLimiter;
exports.authRateLimit = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
});
exports.apiRateLimit = (0, exports.createRateLimiter)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.maxRequests,
});
exports.strictRateLimit = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 10,
});
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            manifestSrc: ["'self'"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});
exports.corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            config_1.config.frontend.url,
            "http://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3000",
            "https://localhost:3001",
        ];
        if (config_1.config.environment === "development") {
            if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
                return callback(null, true);
            }
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn("CORS rejection", { origin, allowedOrigins });
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "X-Tenant-ID",
        "X-Request-ID",
        "X-Client-Version",
    ],
    exposedHeaders: [
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
    maxAge: 86400,
    optionsSuccessStatus: 200,
};
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        return str
            .replace(/[<>]/g, "")
            .replace(/javascript:/gi, "")
            .replace(/on\w+=/gi, "")
            .trim();
    };
    const sanitizeObject = (obj) => {
        if (typeof obj === "string") {
            return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === "object") {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
const requestSizeLimit = (req, res, next) => {
    const contentLength = req.get("Content-Length");
    if (contentLength && parseInt(contentLength) > config_1.config.upload.maxFileSize) {
        return response_1.ResponseHelper.fileTooLarge(res, `${config_1.config.upload.maxFileSize / 1024 / 1024}MB`);
    }
    next();
};
exports.requestSizeLimit = requestSizeLimit;
const securityMonitoring = (req, res, next) => {
    const suspiciousPatterns = [
        /(\.\.\/)/,
        /(union.*select)/i,
        /(script.*>)/i,
        /(eval\s*\()/i,
        /(base64_decode)/i,
        /(phpinfo)/i,
        /(\/etc\/passwd)/i,
        /(cmd\.exe)/i,
    ];
    const requestString = JSON.stringify({
        url: req.originalUrl,
        body: req.body,
        query: req.query,
    }).toLowerCase();
    const matchedPattern = suspiciousPatterns.find(pattern => pattern.test(requestString));
    if (matchedPattern) {
        logger_1.logger.warn("Suspicious request detected", {
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            url: req.originalUrl,
            pattern: matchedPattern.toString(),
            body: req.body,
            query: req.query,
        });
    }
    next();
};
exports.securityMonitoring = securityMonitoring;
const ipFilter = (whitelist, blacklist) => {
    return (req, res, next) => {
        const clientIP = req.ip;
        if (blacklist && blacklist.includes(clientIP)) {
            logger_1.logger.warn("Blocked IP attempt", { ip: clientIP });
            return response_1.ResponseHelper.forbidden(res, "Access denied");
        }
        if (whitelist && whitelist.length > 0 && !whitelist.includes(clientIP)) {
            logger_1.logger.warn("Non-whitelisted IP attempt", { ip: clientIP });
            return response_1.ResponseHelper.forbidden(res, "Access denied");
        }
        next();
    };
};
exports.ipFilter = ipFilter;
exports.default = {
    createRateLimiter: exports.createRateLimiter,
    authRateLimit: exports.authRateLimit,
    apiRateLimit: exports.apiRateLimit,
    strictRateLimit: exports.strictRateLimit,
    securityHeaders: exports.securityHeaders,
    corsOptions: exports.corsOptions,
    sanitizeInput: exports.sanitizeInput,
    requestSizeLimit: exports.requestSizeLimit,
    securityMonitoring: exports.securityMonitoring,
    ipFilter: exports.ipFilter,
};
//# sourceMappingURL=security.js.map
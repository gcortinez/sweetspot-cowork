"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationId = exports.requestLogger = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const defaultOptions = {
    includeBody: false,
    includeQuery: true,
    includeHeaders: false,
    excludePaths: [],
    excludeHealthCheck: true,
};
const requestLogger = (options = {}) => {
    const config = { ...defaultOptions, ...options };
    return (req, res, next) => {
        const requestId = (0, uuid_1.v4)();
        req.requestId = requestId;
        res.setHeader("X-Request-ID", requestId);
        const startTime = Date.now();
        if (config.excludePaths?.some(path => req.path.includes(path))) {
            return next();
        }
        if (config.excludeHealthCheck && req.path === "/health") {
            return next();
        }
        const requestContext = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
        };
        if (config.includeQuery && Object.keys(req.query).length > 0) {
            requestContext.query = req.query;
        }
        if (config.includeBody && req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = sanitizeBody(req.body);
            requestContext.body = sanitizedBody;
        }
        if (config.includeHeaders) {
            requestContext.headers = sanitizeHeaders(req.headers);
        }
        if (req.user) {
            requestContext.userId = req.user.id;
            requestContext.userRole = req.user.role;
        }
        if (req.tenant) {
            requestContext.tenantId = req.tenant.id;
        }
        logger_1.logger.logRequest(req.method, req.originalUrl, requestId, req.user?.id, req.tenant?.id);
        logger_1.logger.debug("Incoming request", requestContext);
        const originalSend = res.send;
        res.send = function (data) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            logger_1.logger.logResponse(req.method, req.originalUrl, res.statusCode, duration, requestId);
            if (logger_1.logger.debug) {
                const responseContext = {
                    requestId,
                    statusCode: res.statusCode,
                    duration,
                    responseSize: Buffer.byteLength(data),
                };
                if (process.env.LOG_LEVEL === "debug" && res.statusCode >= 400) {
                    try {
                        const responseBody = JSON.parse(data);
                        responseContext.responseBody = responseBody;
                    }
                    catch {
                    }
                }
                logger_1.logger.debug("Response sent", responseContext);
            }
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.requestLogger = requestLogger;
function sanitizeBody(body) {
    if (typeof body !== "object" || body === null) {
        return body;
    }
    const sensitiveFields = [
        "password",
        "confirmPassword",
        "token",
        "refreshToken",
        "accessToken",
        "apiKey",
        "secret",
        "privateKey",
        "creditCard",
        "ssn",
        "socialSecurityNumber",
    ];
    const sanitized = { ...body };
    for (const field of sensitiveFields) {
        if (sanitized[field] !== undefined) {
            sanitized[field] = "[REDACTED]";
        }
    }
    return sanitized;
}
function sanitizeHeaders(headers) {
    const sensitiveHeaders = [
        "authorization",
        "cookie",
        "x-api-key",
        "x-auth-token",
        "x-access-token",
    ];
    const sanitized = { ...headers };
    for (const header of sensitiveHeaders) {
        if (sanitized[header] !== undefined) {
            sanitized[header] = "[REDACTED]";
        }
    }
    return sanitized;
}
const correlationId = (req, res, next) => {
    const requestId = req.requestId || (0, uuid_1.v4)();
    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
};
exports.correlationId = correlationId;
exports.default = exports.requestLogger;
//# sourceMappingURL=requestLogger.js.map
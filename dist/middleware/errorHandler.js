"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const api_1 = require("../types/api");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    code;
    details;
    field;
    constructor(message, statusCode = api_1.HttpStatusCode.INTERNAL_SERVER_ERROR, code = api_1.ErrorCode.INTERNAL_ERROR, details, field) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.field = field;
        this.name = "AppError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    const context = {
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.user?.id,
        tenantId: req.tenant?.id,
    };
    logger_1.logger.error("Unhandled error occurred", context, error);
    if (error instanceof zod_1.ZodError) {
        const validationErrors = error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
        }));
        return response_1.ResponseHelper.validationError(res, "Validation failed", { errors: validationErrors }, validationErrors[0]?.field);
    }
    if (error instanceof client_1.PrismaClientKnownRequestError) {
        return handlePrismaError(error, res);
    }
    if (error instanceof client_1.PrismaClientValidationError) {
        return response_1.ResponseHelper.badRequest(res, "Invalid database operation", {
            type: "PrismaValidationError",
            originalError: error.message,
        });
    }
    if (error instanceof AppError || error.statusCode) {
        const customError = error;
        return response_1.ResponseHelper.error(res, customError.code || api_1.ErrorCode.INTERNAL_ERROR, customError.message, customError.statusCode || api_1.HttpStatusCode.INTERNAL_SERVER_ERROR, customError.details, customError.field);
    }
    if (error instanceof SyntaxError && "body" in error) {
        return response_1.ResponseHelper.badRequest(res, "Invalid JSON format in request body");
    }
    if (error.name === "JsonWebTokenError") {
        return response_1.ResponseHelper.unauthorized(res, "Invalid authentication token");
    }
    if (error.name === "TokenExpiredError") {
        return response_1.ResponseHelper.error(res, api_1.ErrorCode.TOKEN_EXPIRED, "Authentication token has expired", api_1.HttpStatusCode.UNAUTHORIZED);
    }
    if (error.message?.includes("File too large")) {
        return response_1.ResponseHelper.fileTooLarge(res, "10MB");
    }
    if (error.message?.includes("Unexpected field")) {
        return response_1.ResponseHelper.badRequest(res, "Unexpected field in file upload");
    }
    return response_1.ResponseHelper.internalError(res, process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : error.message);
};
exports.errorHandler = errorHandler;
const handlePrismaError = (error, res) => {
    switch (error.code) {
        case "P2002":
            const target = error.meta?.target;
            const field = target?.[0] || "field";
            return response_1.ResponseHelper.conflict(res, `${field} already exists`);
        case "P2025":
            return response_1.ResponseHelper.notFound(res);
        case "P2003":
            return response_1.ResponseHelper.badRequest(res, "Referenced record does not exist");
        case "P2004":
            return response_1.ResponseHelper.badRequest(res, "Database constraint violation");
        case "P2014":
            return response_1.ResponseHelper.badRequest(res, "Required relation missing");
        case "P2016":
            return response_1.ResponseHelper.badRequest(res, "Invalid query parameters");
        case "P2021":
            return response_1.ResponseHelper.internalError(res, "Database schema error");
        case "P2022":
            return response_1.ResponseHelper.internalError(res, "Database column error");
        case "P1001":
            return response_1.ResponseHelper.serviceUnavailable(res, "Database connection timeout");
        case "P1002":
            return response_1.ResponseHelper.serviceUnavailable(res, "Database connection timeout");
        case "P1008":
            return response_1.ResponseHelper.serviceUnavailable(res, "Database operation timeout");
        default:
            logger_1.logger.error(`Unhandled Prisma error: ${error.code}`, {
                code: error.code,
                message: error.message,
                meta: error.meta,
            });
            return response_1.ResponseHelper.internalError(res, "Database operation failed");
    }
};
const notFoundHandler = (req, res) => {
    return response_1.ResponseHelper.error(res, api_1.ErrorCode.INVALID_ROUTE, `Route ${req.method} ${req.originalUrl} not found`, api_1.HttpStatusCode.NOT_FOUND, {
        method: req.method,
        path: req.originalUrl,
        availableRoutes: [
            "GET /health",
            "POST /api/auth/login",
            "GET /api/auth/me",
            "GET /api/tenants",
        ],
    });
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorHandler.js.map
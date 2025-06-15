"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = exports.handleController = exports.invalidTenant = exports.tenantSuspended = exports.tenantNotFound = exports.invalidFileType = exports.fileTooLarge = exports.fileUploadSuccess = exports.paginated = exports.serviceUnavailable = exports.internalError = exports.rateLimitExceeded = exports.validationError = exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.error = exports.noContent = exports.created = exports.success = exports.ResponseHelper = void 0;
const api_1 = require("../types/api");
const logger_1 = require("./logger");
class ResponseHelper {
    static createMeta() {
        return {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        };
    }
    static success(res, data, message, statusCode = api_1.HttpStatusCode.OK, meta) {
        const response = {
            success: true,
            data,
            message,
            meta: { ...this.createMeta(), ...meta },
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message) {
        return this.success(res, data, message || "Resource created successfully", api_1.HttpStatusCode.CREATED);
    }
    static noContent(res, message) {
        const response = {
            success: true,
            message: message || "Operation completed successfully",
            meta: this.createMeta(),
        };
        return res.status(api_1.HttpStatusCode.NO_CONTENT).json(response);
    }
    static error(res, code, message, statusCode = api_1.HttpStatusCode.INTERNAL_SERVER_ERROR, details, field) {
        const error = {
            code,
            message,
            details,
            field,
            timestamp: new Date().toISOString(),
        };
        const response = {
            success: false,
            error,
            meta: this.createMeta(),
        };
        logger_1.logger.error(`API Error: ${code}`, {
            statusCode,
            message,
            details,
            field,
        });
        return res.status(statusCode).json(response);
    }
    static badRequest(res, message, details, field) {
        return this.error(res, api_1.ErrorCode.INVALID_INPUT, message, api_1.HttpStatusCode.BAD_REQUEST, details, field);
    }
    static unauthorized(res, message = "Authentication required") {
        return this.error(res, api_1.ErrorCode.UNAUTHORIZED_ACCESS, message, api_1.HttpStatusCode.UNAUTHORIZED);
    }
    static forbidden(res, message = "Insufficient permissions") {
        return this.error(res, api_1.ErrorCode.INSUFFICIENT_PERMISSIONS, message, api_1.HttpStatusCode.FORBIDDEN);
    }
    static notFound(res, resource = "Resource") {
        return this.error(res, api_1.ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, api_1.HttpStatusCode.NOT_FOUND);
    }
    static conflict(res, message) {
        return this.error(res, api_1.ErrorCode.RESOURCE_CONFLICT, message, api_1.HttpStatusCode.CONFLICT);
    }
    static validationError(res, message, details, field) {
        return this.error(res, api_1.ErrorCode.VALIDATION_ERROR, message, api_1.HttpStatusCode.UNPROCESSABLE_ENTITY, details, field);
    }
    static rateLimitExceeded(res, retryAfter) {
        if (retryAfter) {
            res.set("Retry-After", retryAfter.toString());
        }
        return this.error(res, api_1.ErrorCode.RATE_LIMIT_EXCEEDED, "Too many requests", api_1.HttpStatusCode.TOO_MANY_REQUESTS);
    }
    static internalError(res, message = "Internal server error") {
        return this.error(res, api_1.ErrorCode.INTERNAL_ERROR, message, api_1.HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    static serviceUnavailable(res, message = "Service temporarily unavailable") {
        return this.error(res, api_1.ErrorCode.SERVICE_UNAVAILABLE, message, api_1.HttpStatusCode.SERVICE_UNAVAILABLE);
    }
    static paginated(res, data, pagination, message) {
        const totalPages = Math.ceil(pagination.total / pagination.limit);
        const hasNext = pagination.page < totalPages;
        const hasPrev = pagination.page > 1;
        const meta = {
            ...this.createMeta(),
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages,
                hasNext,
                hasPrev,
            },
        };
        const response = {
            success: true,
            data,
            message,
            meta,
        };
        return res.status(api_1.HttpStatusCode.OK).json(response);
    }
    static fileUploadSuccess(res, fileInfo, message) {
        return this.success(res, fileInfo, message || "File uploaded successfully", api_1.HttpStatusCode.CREATED);
    }
    static fileTooLarge(res, maxSize) {
        return this.error(res, api_1.ErrorCode.FILE_TOO_LARGE, `File size exceeds maximum allowed size of ${maxSize}`, api_1.HttpStatusCode.BAD_REQUEST);
    }
    static invalidFileType(res, allowedTypes) {
        return this.error(res, api_1.ErrorCode.INVALID_FILE_TYPE, `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`, api_1.HttpStatusCode.BAD_REQUEST);
    }
    static tenantNotFound(res) {
        return this.error(res, api_1.ErrorCode.TENANT_NOT_FOUND, "Tenant not found or access denied", api_1.HttpStatusCode.NOT_FOUND);
    }
    static tenantSuspended(res) {
        return this.error(res, api_1.ErrorCode.TENANT_SUSPENDED, "Tenant account is suspended", api_1.HttpStatusCode.FORBIDDEN);
    }
    static invalidTenant(res) {
        return this.error(res, api_1.ErrorCode.INVALID_TENANT, "Invalid tenant configuration", api_1.HttpStatusCode.BAD_REQUEST);
    }
}
exports.ResponseHelper = ResponseHelper;
exports.success = ResponseHelper.success, exports.created = ResponseHelper.created, exports.noContent = ResponseHelper.noContent, exports.error = ResponseHelper.error, exports.badRequest = ResponseHelper.badRequest, exports.unauthorized = ResponseHelper.unauthorized, exports.forbidden = ResponseHelper.forbidden, exports.notFound = ResponseHelper.notFound, exports.conflict = ResponseHelper.conflict, exports.validationError = ResponseHelper.validationError, exports.rateLimitExceeded = ResponseHelper.rateLimitExceeded, exports.internalError = ResponseHelper.internalError, exports.serviceUnavailable = ResponseHelper.serviceUnavailable, exports.paginated = ResponseHelper.paginated, exports.fileUploadSuccess = ResponseHelper.fileUploadSuccess, exports.fileTooLarge = ResponseHelper.fileTooLarge, exports.invalidFileType = ResponseHelper.invalidFileType, exports.tenantNotFound = ResponseHelper.tenantNotFound, exports.tenantSuspended = ResponseHelper.tenantSuspended, exports.invalidTenant = ResponseHelper.invalidTenant;
const handleController = async (controllerFn, res, statusCode = api_1.HttpStatusCode.OK) => {
    try {
        const result = await controllerFn();
        return ResponseHelper.success(res, result, undefined, statusCode);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.name === 'ValidationError') {
                return ResponseHelper.badRequest(res, error.message);
            }
            if (error.name === 'NotFoundError') {
                return ResponseHelper.notFound(res, error.message);
            }
            if (error.name === 'UnauthorizedError') {
                return ResponseHelper.unauthorized(res, error.message);
            }
            if (error.name === 'ForbiddenError') {
                return ResponseHelper.forbidden(res, error.message);
            }
            if (error.name === 'ConflictError') {
                return ResponseHelper.conflict(res, error.message);
            }
        }
        logger_1.logger.error('Controller error:', { error: error instanceof Error ? error.message : error });
        return ResponseHelper.internalError(res);
    }
};
exports.handleController = handleController;
exports.ApiResponse = ResponseHelper;
exports.default = ResponseHelper;
//# sourceMappingURL=response.js.map
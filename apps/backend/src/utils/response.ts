import { Response } from "express";
import { ApiResponse, ApiError, ResponseMeta, HttpStatusCode, ErrorCode } from "../types/api";
import { logger } from "./logger";

export class ResponseHelper {
  private static createMeta(): ResponseMeta {
    return {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }

  // Success responses
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: HttpStatusCode = HttpStatusCode.OK,
    meta?: Partial<ResponseMeta>
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      meta: { ...this.createMeta(), ...meta },
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return this.success(res, data, message || "Resource created successfully", HttpStatusCode.CREATED);
  }

  static noContent(res: Response, message?: string): Response {
    const response: ApiResponse = {
      success: true,
      message: message || "Operation completed successfully",
      meta: this.createMeta(),
    };

    return res.status(HttpStatusCode.NO_CONTENT).json(response);
  }

  // Error responses
  static error(
    res: Response,
    code: ErrorCode,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: any,
    field?: string
  ): Response {
    const error: ApiError = {
      code,
      message,
      details,
      field,
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse = {
      success: false,
      error,
      meta: this.createMeta(),
    };

    // Log the error
    logger.error(`API Error: ${code}`, {
      statusCode,
      message,
      details,
      field,
    });

    return res.status(statusCode).json(response);
  }

  // Specific error types
  static badRequest(res: Response, message: string, details?: any, field?: string): Response {
    return this.error(res, ErrorCode.INVALID_INPUT, message, HttpStatusCode.BAD_REQUEST, details, field);
  }

  static unauthorized(res: Response, message: string = "Authentication required"): Response {
    return this.error(res, ErrorCode.UNAUTHORIZED_ACCESS, message, HttpStatusCode.UNAUTHORIZED);
  }

  static forbidden(res: Response, message: string = "Insufficient permissions"): Response {
    return this.error(res, ErrorCode.INSUFFICIENT_PERMISSIONS, message, HttpStatusCode.FORBIDDEN);
  }

  static notFound(res: Response, resource: string = "Resource"): Response {
    return this.error(
      res,
      ErrorCode.RESOURCE_NOT_FOUND,
      `${resource} not found`,
      HttpStatusCode.NOT_FOUND
    );
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, ErrorCode.RESOURCE_CONFLICT, message, HttpStatusCode.CONFLICT);
  }

  static validationError(res: Response, message: string, details?: any, field?: string): Response {
    return this.error(
      res,
      ErrorCode.VALIDATION_ERROR,
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      details,
      field
    );
  }

  static rateLimitExceeded(res: Response, retryAfter?: number): Response {
    if (retryAfter) {
      res.set("Retry-After", retryAfter.toString());
    }

    return this.error(
      res,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      "Too many requests",
      HttpStatusCode.TOO_MANY_REQUESTS
    );
  }

  static internalError(res: Response, message: string = "Internal server error"): Response {
    return this.error(res, ErrorCode.INTERNAL_ERROR, message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  static serviceUnavailable(res: Response, message: string = "Service temporarily unavailable"): Response {
    return this.error(res, ErrorCode.SERVICE_UNAVAILABLE, message, HttpStatusCode.SERVICE_UNAVAILABLE);
  }

  // Paginated responses
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const hasNext = pagination.page < totalPages;
    const hasPrev = pagination.page > 1;

    const meta: ResponseMeta = {
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

    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      meta,
    };

    return res.status(HttpStatusCode.OK).json(response);
  }

  // File upload responses
  static fileUploadSuccess(res: Response, fileInfo: any, message?: string): Response {
    return this.success(res, fileInfo, message || "File uploaded successfully", HttpStatusCode.CREATED);
  }

  static fileTooLarge(res: Response, maxSize: string): Response {
    return this.error(
      res,
      ErrorCode.FILE_TOO_LARGE,
      `File size exceeds maximum allowed size of ${maxSize}`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  static invalidFileType(res: Response, allowedTypes: string[]): Response {
    return this.error(
      res,
      ErrorCode.INVALID_FILE_TYPE,
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  // Multi-tenant specific responses
  static tenantNotFound(res: Response): Response {
    return this.error(
      res,
      ErrorCode.TENANT_NOT_FOUND,
      "Tenant not found or access denied",
      HttpStatusCode.NOT_FOUND
    );
  }

  static tenantSuspended(res: Response): Response {
    return this.error(
      res,
      ErrorCode.TENANT_SUSPENDED,
      "Tenant account is suspended",
      HttpStatusCode.FORBIDDEN
    );
  }

  static invalidTenant(res: Response): Response {
    return this.error(
      res,
      ErrorCode.INVALID_TENANT,
      "Invalid tenant configuration",
      HttpStatusCode.BAD_REQUEST
    );
  }
}

// Export commonly used response methods
export const {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  rateLimitExceeded,
  internalError,
  serviceUnavailable,
  paginated,
  fileUploadSuccess,
  fileTooLarge,
  invalidFileType,
  tenantNotFound,
  tenantSuspended,
  invalidTenant,
} = ResponseHelper;

// Controller helper function
export const handleController = async <T>(
  controllerFn: () => Promise<T>,
  res: Response,
  statusCode: HttpStatusCode = HttpStatusCode.OK
): Promise<Response> => {
  try {
    const result = await controllerFn();
    return ResponseHelper.success(res, result, undefined, statusCode);
  } catch (error) {
    if (error instanceof Error) {
      // Handle known errors
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
    
    // Log and return generic error for unknown errors
    logger.error('Controller error:', { error: error instanceof Error ? error.message : error });
    return ResponseHelper.internalError(res);
  }
};

export default ResponseHelper;
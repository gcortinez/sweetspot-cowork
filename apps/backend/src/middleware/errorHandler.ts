import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client";
import { ResponseHelper } from "../utils/response";
import { ErrorCode, HttpStatusCode } from "../types/api";
import { logger } from "../utils/logger";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  field?: string;
}

export class AppError extends Error implements CustomError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public field?: string;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: any,
    field?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.field = field;
    this.name = "AppError";

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | CustomError | ZodError | PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log the error with context
  const context = {
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: (req as any).user?.id,
    tenantId: (req as any).tenant?.id,
  };

  logger.error("Unhandled error occurred", context, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));

    return ResponseHelper.validationError(
      res,
      "Validation failed",
      { errors: validationErrors },
      validationErrors[0]?.field
    );
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  if (error instanceof PrismaClientValidationError) {
    return ResponseHelper.badRequest(res, "Invalid database operation", {
      type: "PrismaValidationError",
      originalError: error.message,
    });
  }

  // Handle custom application errors
  if (error instanceof AppError || (error as CustomError).statusCode) {
    const customError = error as CustomError;
    return ResponseHelper.error(
      res,
      (customError.code as ErrorCode) || ErrorCode.INTERNAL_ERROR,
      customError.message,
      customError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
      customError.details,
      customError.field
    );
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && "body" in error) {
    return ResponseHelper.badRequest(res, "Invalid JSON format in request body");
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    return ResponseHelper.unauthorized(res, "Invalid authentication token");
  }

  if (error.name === "TokenExpiredError") {
    return ResponseHelper.error(
      res,
      ErrorCode.TOKEN_EXPIRED,
      "Authentication token has expired",
      HttpStatusCode.UNAUTHORIZED
    );
  }

  // Handle multer file upload errors
  if (error.message?.includes("File too large")) {
    return ResponseHelper.fileTooLarge(res, "10MB");
  }

  if (error.message?.includes("Unexpected field")) {
    return ResponseHelper.badRequest(res, "Unexpected field in file upload");
  }

  // Default to internal server error
  return ResponseHelper.internalError(
    res,
    process.env.NODE_ENV === "production" 
      ? "Something went wrong" 
      : error.message
  );
};

const handlePrismaError = (
  error: PrismaClientKnownRequestError,
  res: Response
): Response => {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || "field";
      return ResponseHelper.conflict(res, `${field} already exists`);

    case "P2025":
      // Record not found
      return ResponseHelper.notFound(res);

    case "P2003":
      // Foreign key constraint violation
      return ResponseHelper.badRequest(res, "Referenced record does not exist");

    case "P2004":
      // Constraint violation
      return ResponseHelper.badRequest(res, "Database constraint violation");

    case "P2014":
      // Required relation violation
      return ResponseHelper.badRequest(res, "Required relation missing");

    case "P2016":
      // Query interpretation error
      return ResponseHelper.badRequest(res, "Invalid query parameters");

    case "P2021":
      // Table does not exist
      return ResponseHelper.internalError(res, "Database schema error");

    case "P2022":
      // Column does not exist
      return ResponseHelper.internalError(res, "Database column error");

    case "P1001":
      // Connection timeout
      return ResponseHelper.serviceUnavailable(res, "Database connection timeout");

    case "P1002":
      // Connection timeout
      return ResponseHelper.serviceUnavailable(res, "Database connection timeout");

    case "P1008":
      // Timeout
      return ResponseHelper.serviceUnavailable(res, "Database operation timeout");

    default:
      logger.error(`Unhandled Prisma error: ${error.code}`, {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      return ResponseHelper.internalError(res, "Database operation failed");
  }
};

// 404 handler for unknown routes
export const notFoundHandler = (req: Request, res: Response): Response => {
  return ResponseHelper.error(
    res,
    ErrorCode.INVALID_ROUTE,
    `Route ${req.method} ${req.originalUrl} not found`,
    HttpStatusCode.NOT_FOUND,
    {
      method: req.method,
      path: req.originalUrl,
      availableRoutes: [
        "GET /health",
        "POST /api/auth/login",
        "GET /api/auth/me",
        "GET /api/tenants",
      ],
    }
  );
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
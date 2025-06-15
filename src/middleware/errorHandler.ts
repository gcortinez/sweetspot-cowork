import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
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
  error: Error | CustomError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

    ResponseHelper.validationError(
      res,
      "Validation failed",
      { errors: validationErrors },
      validationErrors[0]?.field
    );
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    ResponseHelper.badRequest(res, "Invalid database operation", {
      type: "PrismaValidationError",
      originalError: error.message,
    });
  }

  // Handle custom application errors
  if (error instanceof AppError || (error as CustomError).statusCode) {
    const customError = error as CustomError;
    ResponseHelper.error(
      res,
      (customError.code as ErrorCode) || ErrorCode.INTERNAL_ERROR,
      customError.message,
      customError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
      customError.details,
      customError.field
    );
    return;
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && "body" in error) {
    ResponseHelper.badRequest(res, "Invalid JSON format in request body");
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    ResponseHelper.unauthorized(res, "Invalid authentication token");
  }

  if (error.name === "TokenExpiredError") {
    ResponseHelper.error(
      res,
      ErrorCode.TOKEN_EXPIRED,
      "Authentication token has expired",
      HttpStatusCode.UNAUTHORIZED
    );
    return;
  }

  // Handle multer file upload errors
  if (error.message?.includes("File too large")) {
    ResponseHelper.fileTooLarge(res, "10MB");
  }

  if (error.message?.includes("Unexpected field")) {
    ResponseHelper.badRequest(res, "Unexpected field in file upload");
  }

  // Default to internal server error
  ResponseHelper.internalError(
    res,
    process.env.NODE_ENV === "production" 
      ? "Something went wrong" 
      : error.message
  );
};

const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  res: Response
): void => {
  switch (error.code) {
    case "P2002":
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || "field";
      ResponseHelper.conflict(res, `${field} already exists`);
      return;

    case "P2025":
      // Record not found
      ResponseHelper.notFound(res);
      return;

    case "P2003":
      // Foreign key constraint violation
      ResponseHelper.badRequest(res, "Referenced record does not exist");
      return;

    case "P2004":
      // Constraint violation
      ResponseHelper.badRequest(res, "Database constraint violation");
      return;

    case "P2014":
      // Required relation violation
      ResponseHelper.badRequest(res, "Required relation missing");
      return;

    case "P2016":
      // Query interpretation error
      ResponseHelper.badRequest(res, "Invalid query parameters");
      return;

    case "P2021":
      // Table does not exist
      ResponseHelper.internalError(res, "Database schema error");
      return;

    case "P2022":
      // Column does not exist
      ResponseHelper.internalError(res, "Database column error");
      return;

    case "P1001":
      // Connection timeout
      ResponseHelper.serviceUnavailable(res, "Database connection timeout");
      return;

    case "P1002":
      // Connection timeout
      ResponseHelper.serviceUnavailable(res, "Database connection timeout");
      return;

    case "P1008":
      // Timeout
      ResponseHelper.serviceUnavailable(res, "Database operation timeout");
      return;

    default:
      logger.error(`Unhandled Prisma error: ${error.code}`, {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      ResponseHelper.internalError(res, "Database operation failed");
      return;
  }
};

// 404 handler for unknown routes
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseHelper.error(
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
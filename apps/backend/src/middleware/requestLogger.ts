import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../types/api";

export interface RequestLoggerOptions {
  includeBody?: boolean;
  includeQuery?: boolean;
  includeHeaders?: boolean;
  excludePaths?: string[];
  excludeHealthCheck?: boolean;
}

const defaultOptions: RequestLoggerOptions = {
  includeBody: false,
  includeQuery: true,
  includeHeaders: false,
  excludePaths: [],
  excludeHealthCheck: true,
};

export const requestLogger = (options: RequestLoggerOptions = {}) => {
  const config = { ...defaultOptions, ...options };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Generate unique request ID
    const requestId = uuidv4();
    req.requestId = requestId;

    // Add request ID to response headers
    res.setHeader("X-Request-ID", requestId);

    const startTime = Date.now();

    // Skip logging for excluded paths
    if (config.excludePaths?.some(path => req.path.includes(path))) {
      return next();
    }

    // Skip health check endpoint if configured
    if (config.excludeHealthCheck && req.path === "/health") {
      return next();
    }

    // Prepare request context
    const requestContext: Record<string, any> = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    // Add query parameters if enabled
    if (config.includeQuery && Object.keys(req.query).length > 0) {
      requestContext.query = req.query;
    }

    // Add request body if enabled (be careful with sensitive data)
    if (config.includeBody && req.body && Object.keys(req.body).length > 0) {
      // Filter out sensitive fields
      const sanitizedBody = sanitizeBody(req.body);
      requestContext.body = sanitizedBody;
    }

    // Add headers if enabled
    if (config.includeHeaders) {
      requestContext.headers = sanitizeHeaders(req.headers);
    }

    // Add user info if available
    if (req.user) {
      requestContext.userId = req.user.id;
      requestContext.userRole = req.user.role;
    }

    // Add tenant info if available
    if (req.tenant) {
      requestContext.tenantId = req.tenant.id;
    }

    // Log incoming request
    logger.logRequest(
      req.method,
      req.originalUrl,
      requestId,
      req.user?.id,
      req.tenant?.id
    );

    // Debug level logging with full context
    logger.debug("Incoming request", requestContext);

    // Capture response when it finishes
    const originalSend = res.send;
    res.send = function(data: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log response
      logger.logResponse(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        requestId
      );

      // Debug level logging for response
      if (logger.debug) {
        const responseContext = {
          requestId,
          statusCode: res.statusCode,
          duration,
          responseSize: Buffer.byteLength(data),
        };

        // Include response body in debug mode (be careful with sensitive data)
        if (process.env.LOG_LEVEL === "debug" && res.statusCode >= 400) {
          try {
            const responseBody = JSON.parse(data);
            responseContext.responseBody = responseBody;
          } catch {
            // Response is not JSON, skip adding body
          }
        }

        logger.debug("Response sent", responseContext);
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  };
};

// Sanitize request body to remove sensitive information
function sanitizeBody(body: any): any {
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

// Sanitize headers to remove sensitive information
function sanitizeHeaders(headers: any): any {
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

// Middleware to add correlation ID to all logs in the request context
export const correlationId = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Use existing request ID or generate new one
  const requestId = req.requestId || uuidv4();
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

export default requestLogger;
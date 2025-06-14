import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "../config";
import { ResponseHelper } from "../utils/response";
import { logger } from "../utils/logger";

// Rate limiting configurations
export const createRateLimiter = (options?: Partial<rateLimit.Options>) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
      });

      return ResponseHelper.rateLimitExceeded(
        res,
        Math.ceil(config.rateLimit.windowMs / 1000)
      );
    },
    ...options,
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const apiRateLimit = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
});

export const strictRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Very limited for sensitive operations
});

// Security headers configuration
export const securityHeaders = helmet({
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
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration with environment-specific settings
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.frontend.url,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://localhost:3001",
    ];

    // In development, allow localhost with any port
    if (config.environment === "development") {
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn("CORS rejection", { origin, allowedOrigins });
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
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize common XSS patterns
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = req.get("Content-Length");
  
  if (contentLength && parseInt(contentLength) > config.upload.maxFileSize) {
    return ResponseHelper.fileTooLarge(res, `${config.upload.maxFileSize / 1024 / 1024}MB`);
  }
  
  next();
};

// Security monitoring middleware
export const securityMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\.\.\/)/, // Path traversal
    /(union.*select)/i, // SQL injection
    /(script.*>)/i, // XSS
    /(eval\s*\()/i, // Code injection
    /(base64_decode)/i, // Suspicious functions
    /(phpinfo)/i, // PHP-specific attacks
    /(\/etc\/passwd)/i, // File inclusion
    /(cmd\.exe)/i, // Command injection
  ];

  const requestString = JSON.stringify({
    url: req.originalUrl,
    body: req.body,
    query: req.query,
  }).toLowerCase();

  const matchedPattern = suspiciousPatterns.find(pattern => pattern.test(requestString));

  if (matchedPattern) {
    logger.warn("Suspicious request detected", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.originalUrl,
      pattern: matchedPattern.toString(),
      body: req.body,
      query: req.query,
    });

    // You might want to block the request or just log it
    // For now, we'll just log and continue
  }

  next();
};

// IP whitelist/blacklist middleware
export const ipFilter = (whitelist?: string[], blacklist?: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip;

    if (blacklist && blacklist.includes(clientIP)) {
      logger.warn("Blocked IP attempt", { ip: clientIP });
      return ResponseHelper.forbidden(res, "Access denied");
    }

    if (whitelist && whitelist.length > 0 && !whitelist.includes(clientIP)) {
      logger.warn("Non-whitelisted IP attempt", { ip: clientIP });
      return ResponseHelper.forbidden(res, "Access denied");
    }

    next();
  };
};

export default {
  createRateLimiter,
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  securityHeaders,
  corsOptions,
  sanitizeInput,
  requestSizeLimit,
  securityMonitoring,
  ipFilter,
};
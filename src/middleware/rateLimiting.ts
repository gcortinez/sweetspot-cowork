import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { securityEventService } from '../services/securityEventService';
import { AuthenticatedRequest } from '../types/api';

// ============================================================================
// RATE LIMITING STORE (In-memory with Redis option)
// ============================================================================

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    firstAttempt: number;
  };
}

class MemoryStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get(key: string) {
    const entry = this.store[key];
    if (!entry) return null;
    
    if (Date.now() > entry.resetTime) {
      delete this.store[key];
      return null;
    }
    
    return entry;
  }

  set(key: string, value: any) {
    this.store[key] = value;
  }

  increment(key: string, windowMs: number) {
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

  reset(key: string) {
    delete this.store[key];
  }

  private cleanup() {
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

// ============================================================================
// RATE LIMITING CONFIGURATIONS
// ============================================================================

const store = new MemoryStore();

/**
 * General API rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: async (req: Request, res: Response) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    logger.warn('Rate limit exceeded', {
      ip,
      userAgent,
      path: req.path,
      method: req.method
    });

    // Log security event if we can determine tenant
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (authenticatedReq.user?.tenantId) {
        await securityEventService.logRateLimitExceeded(
          authenticatedReq.user.tenantId,
          req.path,
          ip,
          userAgent,
          authenticatedReq.user.id
        );
      }
    } catch (error) {
      // Don't let logging errors affect rate limiting
    }

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: async (req: Request, res: Response) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    logger.warn('Auth rate limit exceeded', {
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

/**
 * Strict rate limiting for password reset
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  handler: async (req: Request, res: Response) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    logger.warn('Password reset rate limit exceeded', {
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

/**
 * Progressive delay for repeated requests
 */
export const progressiveDelay = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per windowMs without delay
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 10000, // maximum delay of 10 seconds
});

// ============================================================================
// BRUTE FORCE PROTECTION
// ============================================================================

/**
 * Brute force protection for login attempts
 */
export const bruteForcePrevention = async (
  req: Request,
  res: Response,
  next: Function
) => {
  const ip = req.ip;
  const email = req.body?.email;
  
  if (!email) {
    return next();
  }

  // Create keys for both IP and email-based tracking
  const ipKey = `bf_ip_${ip}`;
  const emailKey = `bf_email_${email}`;
  
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  // Check IP-based attempts
  const ipAttempts = store.increment(ipKey, windowMs);
  const emailAttempts = store.increment(emailKey, windowMs);
  
  // Block if too many attempts from IP or for this email
  if (ipAttempts.count > maxAttempts || emailAttempts.count > maxAttempts) {
    logger.warn('Brute force attempt detected', {
      ip,
      email,
      ipAttempts: ipAttempts.count,
      emailAttempts: emailAttempts.count
    });

    // Log security event
    try {
      // We need to get tenant from email - this might require a database lookup
      // For now, we'll log without tenant context
      await securityEventService.logMultipleFailedLogins(
        'system', // Use system as fallback tenant
        email,
        Math.max(ipAttempts.count, emailAttempts.count),
        ip,
        req.get('User-Agent')
      );
    } catch (error) {
      logger.error('Failed to log security event', error);
    }

    return res.status(429).json({
      error: 'Account temporarily locked due to multiple failed login attempts',
      retryAfter: Math.ceil((ipAttempts.resetTime - Date.now()) / 1000 / 60) + ' minutes'
    });
  }

  // Store attempt info for later use
  req.bruteForceInfo = {
    ipAttempts: ipAttempts.count,
    emailAttempts: emailAttempts.count,
    ipKey,
    emailKey
  };

  next();
};

/**
 * Reset brute force counters on successful login
 */
export const resetBruteForceCounters = (email: string, ip: string) => {
  const ipKey = `bf_ip_${ip}`;
  const emailKey = `bf_email_${email}`;
  
  store.reset(ipKey);
  store.reset(emailKey);
  
  logger.info('Brute force counters reset', { email, ip });
};

// ============================================================================
// ADMIN-SPECIFIC RATE LIMITING
// ============================================================================

/**
 * Strict rate limiting for admin endpoints
 */
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 admin requests per 5 minutes
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: '5 minutes'
  },
  skip: (req: Request) => {
    // Skip rate limiting for super admins in development
    if (process.env.NODE_ENV === 'development') {
      const authenticatedReq = req as AuthenticatedRequest;
      return authenticatedReq.user?.role === 'SUPER_ADMIN';
    }
    return false;
  },
  handler: async (req: Request, res: Response) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const authenticatedReq = req as AuthenticatedRequest;
    
    logger.warn('Admin rate limit exceeded', {
      ip,
      userAgent,
      path: req.path,
      userId: authenticatedReq.user?.id
    });

    // Log security event
    if (authenticatedReq.user?.tenantId) {
      await securityEventService.logRateLimitExceeded(
        authenticatedReq.user.tenantId,
        req.path,
        ip,
        userAgent,
        authenticatedReq.user.id
      );
    }

    res.status(429).json({
      error: 'Too many admin requests, please try again later.',
      retryAfter: '5 minutes'
    });
  }
});

/**
 * Rate limiting for data export endpoints
 */
export const exportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 exports per hour
  keyGenerator: (req: Request) => {
    const authenticatedReq = req as AuthenticatedRequest;
    return `export_${authenticatedReq.user?.id || req.ip}`;
  },
  message: {
    error: 'Too many export requests, please try again later.',
    retryAfter: '1 hour'
  },
  handler: async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    
    logger.warn('Export rate limit exceeded', {
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create custom rate limiter with specific configuration
 */
export const createCustomRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Custom rate limit exceeded', {
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

/**
 * Check if IP is currently rate limited
 */
export const isRateLimited = (ip: string, key: string): boolean => {
  const entry = store.get(`${key}_${ip}`);
  return entry !== null && entry.count > 5; // Adjust threshold as needed
};

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Cleanup function for graceful shutdown
 */
export const cleanup = () => {
  store.destroy();
};

// Extend Request interface for brute force info
declare global {
  namespace Express {
    interface Request {
      bruteForceInfo?: {
        ipAttempts: number;
        emailAttempts: number;
        ipKey: string;
        emailKey: string;
      };
    }
  }
}
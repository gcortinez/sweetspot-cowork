import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/api';

/**
 * Fields that should be encrypted at rest
 */
export const ENCRYPTED_FIELDS = {
  user: ['phone', 'emergencyContactPhone', 'address'],
  client: ['contactEmail', 'contactPhone', 'address', 'billingAddress'],
  visitor: ['phone', 'email', 'companyEmail'],
  payment: ['accountNumber', 'routingNumber', 'cardLastFour'],
  contract: ['signerEmail', 'signerPhone'],
  quotation: ['customerEmail', 'customerPhone'],
  communication: ['recipientEmail', 'recipientPhone'],
  lead: ['email', 'phone', 'companyEmail'],
  opportunity: ['contactEmail', 'contactPhone']
};

/**
 * Middleware to encrypt sensitive fields before database operations
 */
export const encryptSensitiveFields = (entityType: keyof typeof ENCRYPTED_FIELDS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldsToEncrypt = ENCRYPTED_FIELDS[entityType];
      if (!fieldsToEncrypt || !req.body) {
        return next();
      }

      // For now, just log that encryption would happen here
      logger.debug('Encryption middleware would encrypt fields', { 
        entityType, 
        fields: fieldsToEncrypt 
      });

      next();
    } catch (error) {
      logger.error('Field encryption middleware failed', { 
        entityType, 
        error: (error as Error).message 
      });
      next(error);
    }
  };
};

/**
 * Middleware to decrypt sensitive fields after database operations
 */
export const decryptSensitiveFields = (entityType: keyof typeof ENCRYPTED_FIELDS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const fieldsToDecrypt = ENCRYPTED_FIELDS[entityType];
      if (!fieldsToDecrypt) {
        return next();
      }

      // For now, just log that decryption would happen here
      logger.debug('Decryption middleware would decrypt fields', { 
        entityType, 
        fields: fieldsToDecrypt 
      });

      next();
    } catch (error) {
      logger.error('Field decryption middleware failed', { 
        entityType, 
        error: (error as Error).message 
      });
      next(error);
    }
  };
};

/**
 * Middleware to enforce HTTPS in production
 */
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    logger.warn('Insecure HTTP request blocked', { 
      ip: req.ip, 
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    res.status(426).json({
      error: 'HTTPS required',
      message: 'This endpoint requires a secure connection'
    });
    return;
  }
  
  next();
};

/**
 * Middleware to add security headers for data in transit
 */
export const secureDataTransit = (req: Request, res: Response, next: NextFunction): void => {
  // Set secure headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of sensitive data
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Middleware to log access to encrypted data
 */
export const logEncryptedDataAccess = (entityType: keyof typeof ENCRYPTED_FIELDS) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Log access to encrypted data
      if (req.user && data) {
        logger.info('Encrypted data accessed', {
          userId: req.user.id,
          tenantId: req.user.tenantId,
          entityType,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Utility function to encrypt specific field in database operations
 */
export const encryptDatabaseField = (value: string | null, fieldName: string): string | null => {
  if (!value) return null;
  
  try {
    // For now, return the value as-is (encryption would be implemented here)
    logger.debug('Would encrypt database field', { fieldName });
    return value;
  } catch (error) {
    logger.error('Database field encryption failed', { 
      fieldName, 
      error: (error as Error).message 
    });
    throw error;
  }
};

/**
 * Utility function to decrypt specific field from database operations
 */
export const decryptDatabaseField = (encryptedValue: string | null, fieldName: string): string | null => {
  if (!encryptedValue) return null;
  
  try {
    // For now, return the value as-is (decryption would be implemented here)
    logger.debug('Would decrypt database field', { fieldName });
    return encryptedValue;
  } catch (error) {
    logger.error('Database field decryption failed', { 
      fieldName, 
      error: (error as Error).message 
    });
    return null; // Return null instead of throwing to prevent data loss
  }
};

/**
 * Prisma middleware for automatic encryption/decryption
 */
export const createPrismaEncryptionMiddleware = () => {
  return async (params: any, next: any) => {
    const { model, action } = params;
    
    // Get fields to encrypt for this model
    const modelName = model?.toLowerCase();
    const fieldsToEncrypt = ENCRYPTED_FIELDS[modelName as keyof typeof ENCRYPTED_FIELDS];
    
    if (!fieldsToEncrypt) {
      return next(params);
    }
    
    // For now, just log what would be encrypted/decrypted
    logger.debug('Prisma encryption middleware', {
      model: modelName,
      action,
      fieldsToEncrypt
    });
    
    // Execute the query without modification for now
    return next(params);
  };
};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrismaEncryptionMiddleware = exports.decryptDatabaseField = exports.encryptDatabaseField = exports.logEncryptedDataAccess = exports.secureDataTransit = exports.enforceHTTPS = exports.decryptSensitiveFields = exports.encryptSensitiveFields = exports.ENCRYPTED_FIELDS = void 0;
const logger_1 = require("../utils/logger");
exports.ENCRYPTED_FIELDS = {
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
const encryptSensitiveFields = (entityType) => {
    return (req, res, next) => {
        try {
            const fieldsToEncrypt = exports.ENCRYPTED_FIELDS[entityType];
            if (!fieldsToEncrypt || !req.body) {
                return next();
            }
            logger_1.logger.debug('Encryption middleware would encrypt fields', {
                entityType,
                fields: fieldsToEncrypt
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Field encryption middleware failed', {
                entityType,
                error: error.message
            });
            next(error);
        }
    };
};
exports.encryptSensitiveFields = encryptSensitiveFields;
const decryptSensitiveFields = (entityType) => {
    return (req, res, next) => {
        try {
            const fieldsToDecrypt = exports.ENCRYPTED_FIELDS[entityType];
            if (!fieldsToDecrypt) {
                return next();
            }
            logger_1.logger.debug('Decryption middleware would decrypt fields', {
                entityType,
                fields: fieldsToDecrypt
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Field decryption middleware failed', {
                entityType,
                error: error.message
            });
            next(error);
        }
    };
};
exports.decryptSensitiveFields = decryptSensitiveFields;
const enforceHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        logger_1.logger.warn('Insecure HTTP request blocked', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('User-Agent')
        });
        return res.status(426).json({
            error: 'HTTPS required',
            message: 'This endpoint requires a secure connection'
        });
    }
    next();
};
exports.enforceHTTPS = enforceHTTPS;
const secureDataTransit = (req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.includes('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
};
exports.secureDataTransit = secureDataTransit;
const logEncryptedDataAccess = (entityType) => {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (data) {
            if (req.user && data) {
                logger_1.logger.info('Encrypted data accessed', {
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
exports.logEncryptedDataAccess = logEncryptedDataAccess;
const encryptDatabaseField = (value, fieldName) => {
    if (!value)
        return null;
    try {
        logger_1.logger.debug('Would encrypt database field', { fieldName });
        return value;
    }
    catch (error) {
        logger_1.logger.error('Database field encryption failed', {
            fieldName,
            error: error.message
        });
        throw error;
    }
};
exports.encryptDatabaseField = encryptDatabaseField;
const decryptDatabaseField = (encryptedValue, fieldName) => {
    if (!encryptedValue)
        return null;
    try {
        logger_1.logger.debug('Would decrypt database field', { fieldName });
        return encryptedValue;
    }
    catch (error) {
        logger_1.logger.error('Database field decryption failed', {
            fieldName,
            error: error.message
        });
        return null;
    }
};
exports.decryptDatabaseField = decryptDatabaseField;
const createPrismaEncryptionMiddleware = () => {
    return async (params, next) => {
        const { model, action } = params;
        const modelName = model?.toLowerCase();
        const fieldsToEncrypt = exports.ENCRYPTED_FIELDS[modelName];
        if (!fieldsToEncrypt) {
            return next(params);
        }
        logger_1.logger.debug('Prisma encryption middleware', {
            model: modelName,
            action,
            fieldsToEncrypt
        });
        return next(params);
    };
};
exports.createPrismaEncryptionMiddleware = createPrismaEncryptionMiddleware;
//# sourceMappingURL=encryption.js.map
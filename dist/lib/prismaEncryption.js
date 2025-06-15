"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionUtils = exports.EncryptionPolicyManager = exports.PrismaEncryptionMiddleware = void 0;
exports.createDefaultEncryptionMiddleware = createDefaultEncryptionMiddleware;
const encryptionService_1 = require("../services/encryptionService");
const ENCRYPTED_FIELDS = {
    User: ['phone', 'twoFactorSecret'],
    Client: ['phone', 'taxId'],
    Lead: ['phone'],
    Visitor: ['phone'],
    StoredPaymentMethod: ['providerData', 'last4'],
    Contract: ['terms'],
    Communication: ['content'],
    SecurityEvent: ['metadata'],
    UserSession: ['refreshToken', 'deviceInfo'],
    AuditLog: ['details'],
};
const SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /ssn/i,
    /social/i,
    /credit/i,
    /card/i,
    /bank/i,
    /account/i,
];
class PrismaEncryptionMiddleware {
    config;
    constructor(config = {}) {
        this.config = {
            enableFieldEncryption: true,
            enableAuditLogging: true,
            skipModels: [],
            customFieldMap: {},
            ...config,
        };
    }
    createMiddleware() {
        return async (params, next) => {
            if (!this.config.enableFieldEncryption) {
                return next(params);
            }
            if (this.config.skipModels.includes(params.model || '')) {
                return next(params);
            }
            try {
                switch (params.action) {
                    case 'create':
                    case 'createMany':
                        params = await this.handleCreate(params);
                        break;
                    case 'update':
                    case 'updateMany':
                    case 'upsert':
                        params = await this.handleUpdate(params);
                        break;
                    case 'findFirst':
                    case 'findMany':
                    case 'findUnique':
                        const result = await next(params);
                        return await this.handleRead(result, params.model);
                    default:
                        return next(params);
                }
                const result = await next(params);
                if (this.shouldDecryptResult(params.action)) {
                    return await this.handleRead(result, params.model);
                }
                return result;
            }
            catch (error) {
                console.error('Encryption middleware error:', error);
                return next(params);
            }
        };
    }
    async handleCreate(params) {
        if (!params.args?.data)
            return params;
        if (Array.isArray(params.args.data)) {
            params.args.data = await Promise.all(params.args.data.map((item) => this.encryptFields(item, params.model)));
        }
        else {
            params.args.data = await this.encryptFields(params.args.data, params.model);
        }
        return params;
    }
    async handleUpdate(params) {
        if (!params.args?.data)
            return params;
        params.args.data = await this.encryptFields(params.args.data, params.model);
        return params;
    }
    async handleRead(result, model) {
        if (!result || !model)
            return result;
        if (Array.isArray(result)) {
            return Promise.all(result.map(item => this.decryptFields(item, model)));
        }
        else if (typeof result === 'object') {
            return this.decryptFields(result, model);
        }
        return result;
    }
    async encryptFields(data, model) {
        if (!data || typeof data !== 'object' || !model)
            return data;
        const fieldsToEncrypt = this.getFieldsToEncrypt(model);
        const encryptedData = { ...data };
        for (const field of fieldsToEncrypt) {
            if (data[field] !== undefined && data[field] !== null) {
                try {
                    const valueToEncrypt = typeof data[field] === 'string'
                        ? data[field]
                        : JSON.stringify(data[field]);
                    encryptedData[field] = await encryptionService_1.encryptionService.encrypt(valueToEncrypt);
                }
                catch (error) {
                    console.error(`Failed to encrypt field ${field} in model ${model}:`, error);
                }
            }
        }
        return encryptedData;
    }
    async decryptFields(data, model) {
        if (!data || typeof data !== 'object')
            return data;
        const fieldsToDecrypt = this.getFieldsToEncrypt(model);
        const decryptedData = { ...data };
        for (const field of fieldsToDecrypt) {
            if (data[field] !== undefined && data[field] !== null && typeof data[field] === 'string') {
                try {
                    if (this.isEncryptedValue(data[field])) {
                        const decryptedValue = await encryptionService_1.encryptionService.decrypt(data[field]);
                        try {
                            decryptedData[field] = JSON.parse(decryptedValue);
                        }
                        catch {
                            decryptedData[field] = decryptedValue;
                        }
                    }
                }
                catch (error) {
                    console.error(`Failed to decrypt field ${field} in model ${model}:`, error);
                }
            }
        }
        return decryptedData;
    }
    getFieldsToEncrypt(model) {
        const predefinedFields = ENCRYPTED_FIELDS[model] || [];
        const customFields = this.config.customFieldMap[model] || [];
        return [...new Set([...predefinedFields, ...customFields])];
    }
    isSensitiveField(fieldName) {
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
    }
    isEncryptedValue(value) {
        return typeof value === 'string' &&
            value.includes(':') &&
            value.length > 50;
    }
    shouldDecryptResult(action) {
        return ['findFirst', 'findMany', 'findUnique', 'create', 'update', 'upsert'].includes(action);
    }
    static async encryptField(value) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return encryptionService_1.encryptionService.encrypt(stringValue);
    }
    static async decryptField(encryptedValue) {
        const decryptedString = await encryptionService_1.encryptionService.decrypt(encryptedValue);
        try {
            return JSON.parse(decryptedString);
        }
        catch {
            return decryptedString;
        }
    }
    static isEncrypted(value) {
        return typeof value === 'string' &&
            value.includes(':') &&
            value.length > 50;
    }
    static async encryptObject(obj, fieldsToEncrypt) {
        const result = { ...obj };
        for (const field of fieldsToEncrypt) {
            if (obj[field] !== undefined && obj[field] !== null) {
                result[field] = await this.encryptField(obj[field]);
            }
        }
        return result;
    }
    static async decryptObject(obj, fieldsToDecrypt) {
        const result = { ...obj };
        for (const field of fieldsToDecrypt) {
            if (obj[field] !== undefined && obj[field] !== null && this.isEncrypted(obj[field])) {
                result[field] = await this.decryptField(obj[field]);
            }
        }
        return result;
    }
}
exports.PrismaEncryptionMiddleware = PrismaEncryptionMiddleware;
class EncryptionPolicyManager {
    policies = new Map();
    addPolicy(policy) {
        this.policies.set(policy.model, policy);
    }
    getPolicy(model) {
        return this.policies.get(model);
    }
    getAllPolicies() {
        return Array.from(this.policies.values());
    }
    removePolicy(model) {
        return this.policies.delete(model);
    }
    shouldEncryptField(model, field, data) {
        const policy = this.getPolicy(model);
        if (!policy)
            return false;
        if (!policy.fields.includes(field))
            return false;
        if (policy.conditions?.encrypt) {
            return policy.conditions.encrypt(data);
        }
        return true;
    }
    shouldDecryptField(model, field, data) {
        const policy = this.getPolicy(model);
        if (!policy)
            return false;
        if (!policy.fields.includes(field))
            return false;
        if (policy.conditions?.decrypt) {
            return policy.conditions.decrypt(data);
        }
        return true;
    }
    needsKeyRotation(model) {
        const policy = this.getPolicy(model);
        if (!policy?.keyRotation?.enabled)
            return false;
        if (!policy.keyRotation.lastRotated)
            return true;
        const daysSinceRotation = Math.floor((Date.now() - policy.keyRotation.lastRotated.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceRotation >= policy.keyRotation.intervalDays;
    }
}
exports.EncryptionPolicyManager = EncryptionPolicyManager;
function createDefaultEncryptionMiddleware() {
    const middleware = new PrismaEncryptionMiddleware({
        enableFieldEncryption: true,
        enableAuditLogging: true,
        skipModels: [],
        customFieldMap: {
            User: ['phone', 'twoFactorSecret', 'twoFactorBackupCodes'],
            Client: ['phone', 'taxId'],
            StoredPaymentMethod: ['providerData'],
            Communication: ['content'],
            SecurityEvent: ['metadata'],
            AuditLog: ['details', 'oldValues', 'newValues'],
        },
    });
    return middleware.createMiddleware();
}
exports.encryptionUtils = {
    async encryptForStorage(data) {
        return PrismaEncryptionMiddleware.encryptField(data);
    },
    async decryptFromStorage(encryptedData) {
        return PrismaEncryptionMiddleware.decryptField(encryptedData);
    },
    isEncrypted(data) {
        return PrismaEncryptionMiddleware.isEncrypted(data);
    },
    async encryptBackup(backup) {
        const encryptedBackup = {};
        for (const [key, value] of Object.entries(backup)) {
            encryptedBackup[key] = await this.encryptForStorage(value);
        }
        return encryptedBackup;
    },
    async decryptBackup(encryptedBackup) {
        const backup = {};
        for (const [key, value] of Object.entries(encryptedBackup)) {
            backup[key] = await this.decryptFromStorage(value);
        }
        return backup;
    },
};
//# sourceMappingURL=prismaEncryption.js.map
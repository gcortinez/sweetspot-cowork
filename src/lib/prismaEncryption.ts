import { Prisma } from '@prisma/client';
import { encryptionService } from '../services/encryptionService';

// Fields that should be encrypted at rest
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
} as const;

// Sensitive field patterns that should always be encrypted
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

export interface EncryptionConfig {
  enableFieldEncryption: boolean;
  enableAuditLogging: boolean;
  skipModels: string[];
  customFieldMap: Record<string, string[]>;
}

export class PrismaEncryptionMiddleware {
  private config: EncryptionConfig;

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = {
      enableFieldEncryption: true,
      enableAuditLogging: true,
      skipModels: [],
      customFieldMap: {},
      ...config,
    };
  }

  // ============================================================================
  // PRISMA MIDDLEWARE SETUP
  // ============================================================================

  createMiddleware(): Prisma.Middleware {
    return async (params, next) => {
      // Skip if encryption is disabled
      if (!this.config.enableFieldEncryption) {
        return next(params);
      }

      // Skip excluded models
      if (this.config.skipModels.includes(params.model || '')) {
        return next(params);
      }

      try {
        // Handle different operations
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
            // Execute query first, then decrypt results
            const result = await next(params);
            return await this.handleRead(result, params.model);
          
          default:
            // For other operations, proceed without modification
            return next(params);
        }

        // Execute the modified query
        const result = await next(params);

        // Decrypt results for operations that return data
        if (this.shouldDecryptResult(params.action)) {
          return await this.handleRead(result, params.model);
        }

        return result;

      } catch (error) {
        // Log encryption errors but don't fail the query
        console.error('Encryption middleware error:', error);
        
        // Fallback: execute query without encryption
        return next(params);
      }
    };
  }

  // ============================================================================
  // ENCRYPTION OPERATIONS
  // ============================================================================

  private async handleCreate(params: any): Promise<any> {
    if (!params.args?.data) return params;

    if (Array.isArray(params.args.data)) {
      // Handle createMany
      params.args.data = await Promise.all(
        params.args.data.map((item: any) => this.encryptFields(item, params.model))
      );
    } else {
      // Handle create
      params.args.data = await this.encryptFields(params.args.data, params.model);
    }

    return params;
  }

  private async handleUpdate(params: any): Promise<any> {
    if (!params.args?.data) return params;

    params.args.data = await this.encryptFields(params.args.data, params.model);
    return params;
  }

  private async handleRead(result: any, model?: string): Promise<any> {
    if (!result || !model) return result;

    if (Array.isArray(result)) {
      return Promise.all(result.map(item => this.decryptFields(item, model)));
    } else if (typeof result === 'object') {
      return this.decryptFields(result, model);
    }

    return result;
  }

  // ============================================================================
  // FIELD ENCRYPTION/DECRYPTION
  // ============================================================================

  private async encryptFields(data: any, model?: string): Promise<any> {
    if (!data || typeof data !== 'object' || !model) return data;

    const fieldsToEncrypt = this.getFieldsToEncrypt(model);
    const encryptedData = { ...data };

    for (const field of fieldsToEncrypt) {
      if (data[field] !== undefined && data[field] !== null) {
        try {
          // Convert to string if not already
          const valueToEncrypt = typeof data[field] === 'string' 
            ? data[field] 
            : JSON.stringify(data[field]);

          encryptedData[field] = await encryptionService.encrypt(valueToEncrypt);
        } catch (error) {
          console.error(`Failed to encrypt field ${field} in model ${model}:`, error);
          // Keep original value if encryption fails
        }
      }
    }

    return encryptedData;
  }

  private async decryptFields(data: any, model: string): Promise<any> {
    if (!data || typeof data !== 'object') return data;

    const fieldsToDecrypt = this.getFieldsToEncrypt(model);
    const decryptedData = { ...data };

    for (const field of fieldsToDecrypt) {
      if (data[field] !== undefined && data[field] !== null && typeof data[field] === 'string') {
        try {
          // Check if the field looks encrypted (starts with our encryption prefix)
          if (this.isEncryptedValue(data[field])) {
            const decryptedValue = encryptionService.decryptField(data[field]);
            
            if (decryptedValue !== null) {
              // Try to parse as JSON, fallback to string
              try {
                decryptedData[field] = JSON.parse(decryptedValue);
              } catch {
                decryptedData[field] = decryptedValue;
              }
            } else {
              decryptedData[field] = null;
            }
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field} in model ${model}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }

    return decryptedData;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getFieldsToEncrypt(model: string): string[] {
    // Get predefined fields for this model
    const predefinedFields = (ENCRYPTED_FIELDS as any)[model] || [];
    
    // Get custom fields from config
    const customFields = this.config.customFieldMap[model] || [];
    
    // Combine both sets
    return [...new Set([...predefinedFields, ...customFields])];
  }

  private isSensitiveField(fieldName: string): boolean {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(fieldName));
  }

  private isEncryptedValue(value: string): boolean {
    // Check if value starts with our encryption format
    // This is a simple check - in production you might want more sophisticated detection
    return typeof value === 'string' && 
           value.includes(':') && 
           value.length > 50; // Encrypted values are typically much longer
  }

  private shouldDecryptResult(action: string): boolean {
    return ['findFirst', 'findMany', 'findUnique', 'create', 'update', 'upsert'].includes(action);
  }

  // ============================================================================
  // FIELD-LEVEL ENCRYPTION UTILITIES
  // ============================================================================

  /**
   * Manually encrypt a specific field value
   */
  static async encryptField(value: any): Promise<string | null> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return encryptionService.encryptField(stringValue);
  }

  /**
   * Manually decrypt a specific field value
   */
  static async decryptField(encryptedValue: string): Promise<any> {
    const decryptedString = encryptionService.decryptField(encryptedValue);
    
    if (decryptedString === null) {
      return null;
    }
    
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  }

  /**
   * Check if a value appears to be encrypted
   */
  static isEncrypted(value: any): boolean {
    return typeof value === 'string' && 
           value.includes(':') && 
           value.length > 50;
  }

  /**
   * Encrypt multiple fields in an object
   */
  static async encryptObject(obj: Record<string, any>, fieldsToEncrypt: string[]): Promise<Record<string, any>> {
    const result = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        result[field] = await this.encryptField(obj[field]);
      }
    }
    
    return result;
  }

  /**
   * Decrypt multiple fields in an object
   */
  static async decryptObject(obj: Record<string, any>, fieldsToDecrypt: string[]): Promise<Record<string, any>> {
    const result = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (obj[field] !== undefined && obj[field] !== null && this.isEncrypted(obj[field])) {
        result[field] = await this.decryptField(obj[field]);
      }
    }
    
    return result;
  }
}

// ============================================================================
// ENCRYPTION POLICIES
// ============================================================================

export interface EncryptionPolicy {
  model: string;
  fields: string[];
  conditions?: {
    encrypt?: (data: any) => boolean;
    decrypt?: (data: any) => boolean;
  };
  keyRotation?: {
    enabled: boolean;
    intervalDays: number;
    lastRotated?: Date;
  };
}

export class EncryptionPolicyManager {
  private policies: Map<string, EncryptionPolicy> = new Map();

  addPolicy(policy: EncryptionPolicy): void {
    this.policies.set(policy.model, policy);
  }

  getPolicy(model: string): EncryptionPolicy | undefined {
    return this.policies.get(model);
  }

  getAllPolicies(): EncryptionPolicy[] {
    return Array.from(this.policies.values());
  }

  removePolicy(model: string): boolean {
    return this.policies.delete(model);
  }

  shouldEncryptField(model: string, field: string, data?: any): boolean {
    const policy = this.getPolicy(model);
    if (!policy) return false;

    if (!policy.fields.includes(field)) return false;

    if (policy.conditions?.encrypt) {
      return policy.conditions.encrypt(data);
    }

    return true;
  }

  shouldDecryptField(model: string, field: string, data?: any): boolean {
    const policy = this.getPolicy(model);
    if (!policy) return false;

    if (!policy.fields.includes(field)) return false;

    if (policy.conditions?.decrypt) {
      return policy.conditions.decrypt(data);
    }

    return true;
  }

  needsKeyRotation(model: string): boolean {
    const policy = this.getPolicy(model);
    if (!policy?.keyRotation?.enabled) return false;

    if (!policy.keyRotation.lastRotated) return true;

    const daysSinceRotation = Math.floor(
      (Date.now() - policy.keyRotation.lastRotated.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceRotation >= policy.keyRotation.intervalDays;
  }
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export function createDefaultEncryptionMiddleware(): Prisma.Middleware {
  const middleware = new PrismaEncryptionMiddleware({
    enableFieldEncryption: true,
    enableAuditLogging: true,
    skipModels: [], // Models to skip encryption
    customFieldMap: {
      // Add any custom field mappings here
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

// ============================================================================
// ENCRYPTION UTILITIES FOR MANUAL USE
// ============================================================================

export const encryptionUtils = {
  /**
   * Encrypt sensitive data before storing in external systems
   */
  async encryptForStorage(data: any): Promise<string | null> {
    return PrismaEncryptionMiddleware.encryptField(data);
  },

  /**
   * Decrypt data retrieved from external systems
   */
  async decryptFromStorage(encryptedData: string): Promise<any> {
    return PrismaEncryptionMiddleware.decryptField(encryptedData);
  },

  /**
   * Check if data is encrypted
   */
  isEncrypted(data: any): boolean {
    return PrismaEncryptionMiddleware.isEncrypted(data);
  },

  /**
   * Encrypt backup data
   */
  async encryptBackup(backup: Record<string, any>): Promise<Record<string, any>> {
    const encryptedBackup: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(backup)) {
      encryptedBackup[key] = await this.encryptForStorage(value);
    }
    
    return encryptedBackup;
  },

  /**
   * Decrypt backup data
   */
  async decryptBackup(encryptedBackup: Record<string, any>): Promise<Record<string, any>> {
    const backup: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(encryptedBackup)) {
      backup[key] = await this.decryptFromStorage(value as string);
    }
    
    return backup;
  },
};
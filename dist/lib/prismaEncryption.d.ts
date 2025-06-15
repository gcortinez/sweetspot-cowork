import { Prisma } from '@prisma/client';
export interface EncryptionConfig {
    enableFieldEncryption: boolean;
    enableAuditLogging: boolean;
    skipModels: string[];
    customFieldMap: Record<string, string[]>;
}
export declare class PrismaEncryptionMiddleware {
    private config;
    constructor(config?: Partial<EncryptionConfig>);
    createMiddleware(): Prisma.Middleware;
    private handleCreate;
    private handleUpdate;
    private handleRead;
    private encryptFields;
    private decryptFields;
    private getFieldsToEncrypt;
    private isSensitiveField;
    private isEncryptedValue;
    private shouldDecryptResult;
    static encryptField(value: any): Promise<string>;
    static decryptField(encryptedValue: string): Promise<any>;
    static isEncrypted(value: any): boolean;
    static encryptObject(obj: Record<string, any>, fieldsToEncrypt: string[]): Promise<Record<string, any>>;
    static decryptObject(obj: Record<string, any>, fieldsToDecrypt: string[]): Promise<Record<string, any>>;
}
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
export declare class EncryptionPolicyManager {
    private policies;
    addPolicy(policy: EncryptionPolicy): void;
    getPolicy(model: string): EncryptionPolicy | undefined;
    getAllPolicies(): EncryptionPolicy[];
    removePolicy(model: string): boolean;
    shouldEncryptField(model: string, field: string, data?: any): boolean;
    shouldDecryptField(model: string, field: string, data?: any): boolean;
    needsKeyRotation(model: string): boolean;
}
export declare function createDefaultEncryptionMiddleware(): Prisma.Middleware;
export declare const encryptionUtils: {
    encryptForStorage(data: any): Promise<string>;
    decryptFromStorage(encryptedData: string): Promise<any>;
    isEncrypted(data: any): boolean;
    encryptBackup(backup: Record<string, any>): Promise<Record<string, any>>;
    decryptBackup(encryptedBackup: Record<string, any>): Promise<Record<string, any>>;
};
//# sourceMappingURL=prismaEncryption.d.ts.map
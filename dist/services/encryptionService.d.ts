export interface EncryptionResult {
    encryptedData: string;
    iv: string;
    tag: string;
}
export interface DecryptionOptions {
    encryptedData: string;
    iv: string;
    tag: string;
}
export declare class EncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly tagLength;
    private getEncryptionKey;
    generateEncryptionKey(): string;
    encrypt(data: string): EncryptionResult;
    decrypt(options: DecryptionOptions): string;
    hash(data: string, salt?: string): string;
    verifyHash(data: string, hashedData: string): boolean;
    encryptField(value: string | null): string | null;
    decryptField(encryptedValue: string | null): string | null;
    encryptObject(obj: Record<string, any>): string;
    decryptObject<T>(encryptedValue: string): T | null;
    generateSecureToken(length?: number): string;
    generateSecurePassword(length?: number): string;
    encryptPrismaFields<T extends Record<string, any>>(data: T, fieldsToEncrypt: string[]): T;
    decryptPrismaFields<T extends Record<string, any>>(data: T, fieldsToDecrypt: string[]): T;
    createEncryptedBackup(data: any): string;
    restoreFromEncryptedBackup<T>(encryptedBackup: string): T | null;
}
export declare const encryptionService: EncryptionService;
//# sourceMappingURL=encryptionService.d.ts.map
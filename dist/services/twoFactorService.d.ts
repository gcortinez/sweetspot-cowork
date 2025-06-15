export interface TwoFactorSetupData {
    secret: string;
    backupCodes: string[];
    qrCodeUrl: string;
    manualEntryKey: string;
}
export interface TwoFactorVerificationResult {
    success: boolean;
    usedBackupCode?: boolean;
    remainingBackupCodes?: number;
}
export declare class TwoFactorService {
    private readonly APP_NAME;
    setupTwoFactor(userId: string, tenantId: string): Promise<TwoFactorSetupData>;
    enableTwoFactor(userId: string, tenantId: string, secret: string, token: string, backupCodes: string[]): Promise<void>;
    disableTwoFactor(userId: string, tenantId: string, token: string): Promise<void>;
    verifyTwoFactor(userId: string, tenantId: string, token: string): Promise<TwoFactorVerificationResult>;
    generateNewBackupCodes(userId: string, tenantId: string): Promise<string[]>;
    isTwoFactorEnabled(userId: string, tenantId: string): Promise<boolean>;
    getTwoFactorStatus(userId: string, tenantId: string): Promise<{
        enabled: boolean;
        backupCodesRemaining: number;
        lastVerified: Date | null;
    }>;
    private verifyToken;
    private generateBackupCodes;
    requireTwoFactorForOperation(userId: string, tenantId: string, operation: string): Promise<boolean>;
}
export declare const twoFactorService: TwoFactorService;
//# sourceMappingURL=twoFactorService.d.ts.map
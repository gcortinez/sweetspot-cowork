import { Request } from 'express';
export interface IPWhitelistEntry {
    id: string;
    tenantId: string;
    ipAddress: string;
    cidrRange?: string;
    description?: string;
    allowedFor: string[];
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    expiresAt?: Date;
}
export interface IPWhitelistCheck {
    allowed: boolean;
    matchedRule?: IPWhitelistEntry;
    reason?: string;
}
export declare class IPWhitelistService {
    isIPWhitelisted(tenantId: string, ipAddress: string, accessType?: string): Promise<IPWhitelistCheck>;
    addToWhitelist(tenantId: string, ipAddress: string, options: {
        cidrRange?: string;
        description?: string;
        allowedFor?: string[];
        expiresAt?: Date;
        createdBy: string;
    }): Promise<void>;
    removeFromWhitelist(tenantId: string, ipAddress: string, removedBy: string): Promise<void>;
    createIPWhitelistMiddleware(accessType?: string): (req: Request, res: any, next: any) => Promise<any>;
    private getEnvironmentWhitelist;
    private isIPInCIDR;
    private ipToNumber;
    private isLocalhost;
    private isPrivateIP;
    private isValidIP;
    private isValidCIDR;
    static getClientIP(req: Request): string;
    private getEmergencyWhitelist;
    isEmergencyWhitelisted(ipAddress: string): Promise<boolean>;
}
export declare const ipWhitelistService: IPWhitelistService;
//# sourceMappingURL=ipWhitelistService.d.ts.map
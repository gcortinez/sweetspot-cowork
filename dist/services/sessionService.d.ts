export interface SessionData {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    clientId?: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface SessionConfig {
    accessTokenExpiry?: string | number;
    refreshTokenExpiry?: string | number;
    maxConcurrentSessions?: number;
    requireTwoFactor?: boolean;
    trackLocation?: boolean;
}
export interface ActiveSession {
    id: string;
    userId: string;
    deviceInfo?: string;
    ipAddress?: string;
    lastActivity: Date;
    createdAt: Date;
    isActive: boolean;
}
export declare class SessionService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly defaultConfig;
    constructor();
    createSession(sessionData: SessionData, config?: SessionConfig): Promise<{
        accessToken: string;
        refreshToken: string;
        sessionId: string;
        expiresAt: Date;
    }>;
    validateSession(token: string): Promise<{
        isValid: boolean;
        sessionData?: SessionData;
        sessionId?: string;
        needsRefresh?: boolean;
    }>;
    refreshSession(refreshToken: string): Promise<{
        accessToken: string;
        newRefreshToken: string;
        sessionId: string;
    } | null>;
    invalidateSession(sessionId: string, userId?: string): Promise<void>;
    invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<void>;
    getUserActiveSessions(userId: string): Promise<ActiveSession[]>;
    cleanupExpiredSessions(): Promise<void>;
    detectSuspiciousActivity(sessionId: string, currentIp: string): Promise<boolean>;
    private generateSecureSessionId;
    private generateAccessToken;
    private generateRefreshToken;
    private parseExpiryTime;
    private enforceSessionLimit;
    private updateSessionActivity;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=sessionService.d.ts.map
export interface SecurityDashboardData {
    overview: SecurityOverview;
    realTimeMetrics: RealTimeMetrics;
    threatIntelligence: ThreatIntelligence;
    complianceStatus: ComplianceStatus;
    securityTrends: SecurityTrends;
    incidentTracking: IncidentTracking;
    systemHealth: SystemHealth;
    alerts: SecurityAlert[];
    recommendations: SecurityRecommendation[];
}
export interface SecurityOverview {
    securityScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    activeThreats: number;
    resolvedIncidents: number;
    pendingAlerts: number;
    lastUpdated: Date;
}
export interface RealTimeMetrics {
    loginAttempts: {
        successful: number;
        failed: number;
        suspicious: number;
        lastHour: number;
    };
    accessControl: {
        authorizedAccess: number;
        deniedAccess: number;
        violationsToday: number;
        qrScansToday: number;
    };
    systemActivity: {
        activeUsers: number;
        activeSessions: number;
        dataExports: number;
        configChanges: number;
    };
    networkSecurity: {
        requests: number;
        blockedRequests: number;
        rateLimitHits: number;
        maliciousAttempts: number;
    };
}
export interface ThreatIntelligence {
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    activeThreats: Array<{
        type: string;
        severity: string;
        count: number;
        lastSeen: Date;
        source: string;
    }>;
    attackPatterns: Array<{
        pattern: string;
        frequency: number;
        mitigation: string;
    }>;
    ipReputation: Array<{
        ip: string;
        reputation: 'GOOD' | 'SUSPICIOUS' | 'MALICIOUS';
        attempts: number;
        blocked: boolean;
    }>;
    geolocation: Array<{
        country: string;
        requests: number;
        suspicious: number;
        blocked: number;
    }>;
}
export interface ComplianceStatus {
    overall: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_REVIEW';
    frameworks: {
        sox: {
            status: string;
            score: number;
            issues: number;
        };
        gdpr: {
            status: string;
            score: number;
            issues: number;
        };
        hipaa: {
            status: string;
            score: number;
            issues: number;
        };
        pciDss: {
            status: string;
            score: number;
            issues: number;
        };
    };
    dataProtection: {
        encryptionStatus: 'ENABLED' | 'PARTIAL' | 'DISABLED';
        backupStatus: 'CURRENT' | 'OUTDATED' | 'FAILED';
        retentionCompliance: 'COMPLIANT' | 'NON_COMPLIANT';
    };
    auditTrail: {
        completeness: number;
        retention: number;
        lastAudit: Date;
    };
}
export interface SecurityTrends {
    timeline: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
    data: Array<{
        timestamp: Date;
        securityEvents: number;
        failedLogins: number;
        accessViolations: number;
        complianceScore: number;
    }>;
    predictions: Array<{
        timestamp: Date;
        predictedThreats: number;
        confidence: number;
    }>;
}
export interface IncidentTracking {
    openIncidents: number;
    averageResolutionTime: number;
    incidents: Array<{
        id: string;
        type: string;
        severity: string;
        status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
        assignedTo?: string;
        createdAt: Date;
        resolvedAt?: Date;
        description: string;
    }>;
    recentResolutions: Array<{
        id: string;
        type: string;
        resolutionTime: number;
        resolvedAt: Date;
    }>;
}
export interface SystemHealth {
    database: {
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        connections: number;
        queryTime: number;
        lastBackup: Date;
    };
    encryption: {
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        keyRotation: Date;
        encryptedFields: number;
    };
    authentication: {
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        twoFactorEnabled: number;
        sessionSecurity: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    monitoring: {
        status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        auditLogging: boolean;
        securityEventTracking: boolean;
        alerting: boolean;
    };
}
export interface SecurityAlert {
    id: string;
    type: 'THREAT' | 'COMPLIANCE' | 'SYSTEM' | 'ACCESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    timestamp: Date;
    acknowledged: boolean;
    actionRequired: string;
    source: string;
}
export interface SecurityRecommendation {
    id: string;
    category: 'SECURITY' | 'COMPLIANCE' | 'PERFORMANCE' | 'CONFIGURATION';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    impact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    implementation: string;
}
export declare class SecurityDashboardService {
    getDashboardData(tenantId: string, timeframe?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'): Promise<SecurityDashboardData>;
    getSecurityOverview(tenantId: string): Promise<SecurityOverview>;
    getRealTimeMetrics(tenantId: string): Promise<RealTimeMetrics>;
    private getLoginMetrics;
    private getAccessMetrics;
    private getSystemMetrics;
    private getNetworkMetrics;
    getThreatIntelligence(tenantId: string): Promise<ThreatIntelligence>;
    private categorizeThreats;
    private identifyAttackPatterns;
    private analyzeIPReputation;
    private analyzeGeolocation;
    private calculateThreatLevel;
    getComplianceStatus(tenantId: string): Promise<ComplianceStatus>;
    getSecurityTrends(tenantId: string, timeframe: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'): Promise<SecurityTrends>;
    private getTimeIntervals;
    private generateSecurityPredictions;
    private getTimeIncrement;
    getIncidentTracking(tenantId: string): Promise<IncidentTracking>;
    getSystemHealth(tenantId: string): Promise<SystemHealth>;
    getSecurityAlerts(tenantId: string): Promise<SecurityAlert[]>;
    getSecurityRecommendations(tenantId: string): Promise<SecurityRecommendation[]>;
    private calculateSecurityScore;
    private determineRiskLevel;
    private mapEventTypeToAlertType;
    private generateAlertTitle;
    private generateActionRequired;
}
export declare const securityDashboardService: SecurityDashboardService;
//# sourceMappingURL=securityDashboardService.d.ts.map
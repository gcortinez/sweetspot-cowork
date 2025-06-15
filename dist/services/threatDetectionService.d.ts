import { SecuritySeverity } from '@prisma/client';
export interface ThreatDetectionConfig {
    enableBehavioralAnalysis: boolean;
    enableAnomalyDetection: boolean;
    enablePatternRecognition: boolean;
    sensitivityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
    alertThreshold: number;
    learningWindowDays: number;
}
export interface SecurityPattern {
    id: string;
    type: 'LOGIN_ANOMALY' | 'ACCESS_VIOLATION' | 'DATA_EXFILTRATION' | 'BRUTE_FORCE' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_ACTIVITY';
    confidence: number;
    severity: SecuritySeverity;
    description: string;
    indicators: string[];
    firstSeen: Date;
    lastSeen: Date;
    occurrences: number;
    tenantId: string;
}
export interface ThreatScore {
    overall: number;
    behavioral: number;
    temporal: number;
    geographical: number;
    volumetric: number;
    contextual: number;
}
export interface ThreatPrediction {
    threatType: string;
    probability: number;
    timeframe: '1_HOUR' | '6_HOURS' | '24_HOURS' | '7_DAYS';
    confidence: number;
    riskFactors: string[];
    mitigationStrategies: string[];
}
export interface UserBehaviorProfile {
    userId: string;
    tenantId: string;
    baselineMetrics: {
        avgSessionDuration: number;
        typicalLoginTimes: number[];
        commonIpAddresses: string[];
        frequentlyAccessedResources: string[];
        normalDataVolumeRange: {
            min: number;
            max: number;
        };
        typicalDeviceFingerprints: string[];
    };
    anomalyScore: number;
    lastUpdated: Date;
    trainingSamples: number;
}
export interface SecurityAlert {
    id: string;
    type: 'BEHAVIORAL_ANOMALY' | 'PATTERN_MATCH' | 'ML_PREDICTION' | 'RULE_VIOLATION';
    severity: SecuritySeverity;
    confidence: number;
    title: string;
    description: string;
    userId?: string;
    tenantId: string;
    metadata: Record<string, any>;
    timestamp: Date;
    resolved: boolean;
    falsePositive: boolean;
}
export declare class ThreatDetectionService {
    private config;
    private userProfiles;
    private securityPatterns;
    constructor(config?: Partial<ThreatDetectionConfig>);
    analyzeBehavior(userId: string, tenantId: string, currentActivity: any): Promise<ThreatScore>;
    private calculateBehavioralScore;
    private calculateTemporalScore;
    private calculateGeographicalScore;
    private calculateVolumetricScore;
    private calculateContextualScore;
    detectSecurityPatterns(tenantId: string, timeWindowHours?: number): Promise<SecurityPattern[]>;
    private detectBruteForcePatterns;
    private detectPrivilegeEscalationPatterns;
    private detectDataExfiltrationPatterns;
    private detectAccessViolationPatterns;
    predictThreats(tenantId: string): Promise<ThreatPrediction[]>;
    private predictBruteForceAttacks;
    private predictDataBreaches;
    private predictInsiderThreats;
    private calculateInsiderThreatScore;
    updateUserBehaviorProfile(userId: string, tenantId: string, activity: any): Promise<void>;
    private updateBaselineMetrics;
    getUserBehaviorProfile(userId: string, tenantId: string): Promise<UserBehaviorProfile | null>;
    generateSecurityAlert(type: SecurityAlert['type'], severity: SecuritySeverity, title: string, description: string, tenantId: string, metadata?: Record<string, any>, userId?: string): Promise<SecurityAlert>;
    analyzeSecurityEvents(tenantId: string): Promise<{
        threatScore: number;
        patterns: SecurityPattern[];
        predictions: ThreatPrediction[];
        alerts: SecurityAlert[];
    }>;
    private calculateOverallThreatScore;
}
export declare const threatDetectionService: ThreatDetectionService;
//# sourceMappingURL=threatDetectionService.d.ts.map
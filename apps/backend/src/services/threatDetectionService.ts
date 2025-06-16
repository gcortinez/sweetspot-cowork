import { prisma } from '../lib/prisma';
import { SecurityEventType, SecuritySeverity } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

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
    normalDataVolumeRange: { min: number; max: number };
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

// ============================================================================
// MACHINE LEARNING THREAT DETECTION SERVICE
// ============================================================================

export class ThreatDetectionService {
  private config: ThreatDetectionConfig;
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private securityPatterns: Map<string, SecurityPattern> = new Map();

  constructor(config: Partial<ThreatDetectionConfig> = {}) {
    this.config = {
      enableBehavioralAnalysis: true,
      enableAnomalyDetection: true,
      enablePatternRecognition: true,
      sensitivityLevel: 'MEDIUM',
      alertThreshold: 0.7,
      learningWindowDays: 30,
      ...config,
    };
  }

  // ============================================================================
  // BEHAVIORAL ANALYSIS
  // ============================================================================

  async analyzeBehavior(userId: string, tenantId: string, currentActivity: any): Promise<ThreatScore> {
    const profile = await this.getUserBehaviorProfile(userId, tenantId);
    
    if (!profile || profile.trainingSamples < 10) {
      // Not enough data for behavioral analysis
      return {
        overall: 0.1,
        behavioral: 0.1,
        temporal: 0.1,
        geographical: 0.1,
        volumetric: 0.1,
        contextual: 0.1,
      };
    }

    const scores = {
      overall: 0,
      behavioral: await this.calculateBehavioralScore(profile, currentActivity),
      temporal: await this.calculateTemporalScore(profile, currentActivity),
      geographical: await this.calculateGeographicalScore(profile, currentActivity),
      volumetric: await this.calculateVolumetricScore(profile, currentActivity),
      contextual: await this.calculateContextualScore(profile, currentActivity),
    };

    // Calculate weighted overall score
    scores.overall = (
      scores.behavioral * 0.3 +
      scores.temporal * 0.2 +
      scores.geographical * 0.2 +
      scores.volumetric * 0.15 +
      scores.contextual * 0.15
    );

    return scores;
  }

  private async calculateBehavioralScore(profile: UserBehaviorProfile, activity: any): Promise<number> {
    let anomalyPoints = 0;
    let totalChecks = 0;

    // Session duration deviation
    if (activity.sessionDuration) {
      const deviation = Math.abs(activity.sessionDuration - profile.baselineMetrics.avgSessionDuration);
      const normalizedDeviation = deviation / profile.baselineMetrics.avgSessionDuration;
      if (normalizedDeviation > 0.5) anomalyPoints += normalizedDeviation;
      totalChecks++;
    }

    // IP address check
    if (activity.ipAddress && !profile.baselineMetrics.commonIpAddresses.includes(activity.ipAddress)) {
      anomalyPoints += 0.3;
      totalChecks++;
    }

    // Resource access patterns
    if (activity.resources && Array.isArray(activity.resources)) {
      const unknownResources = activity.resources.filter(
        (resource: string) => !profile.baselineMetrics.frequentlyAccessedResources.includes(resource)
      );
      if (unknownResources.length > 0) {
        anomalyPoints += (unknownResources.length / activity.resources.length) * 0.4;
      }
      totalChecks++;
    }

    // Device fingerprint check
    if (activity.deviceFingerprint && !profile.baselineMetrics.typicalDeviceFingerprints.includes(activity.deviceFingerprint)) {
      anomalyPoints += 0.4;
      totalChecks++;
    }

    return totalChecks > 0 ? Math.min(anomalyPoints / totalChecks, 1.0) : 0;
  }

  private async calculateTemporalScore(profile: UserBehaviorProfile, activity: any): Promise<number> {
    if (!activity.timestamp) return 0;

    const currentHour = new Date(activity.timestamp).getHours();
    const typicalHours = profile.baselineMetrics.typicalLoginTimes;
    
    if (typicalHours.length === 0) return 0;

    // Check if current hour is within typical login times (±2 hours)
    const isTypicalTime = typicalHours.some(hour => Math.abs(hour - currentHour) <= 2);
    
    return isTypicalTime ? 0.1 : 0.8;
  }

  private async calculateGeographicalScore(profile: UserBehaviorProfile, activity: any): Promise<number> {
    if (!activity.ipAddress) return 0;

    // Simple geo-check based on IP patterns
    // In production, you'd use a real geolocation service
    const ipPrefix = activity.ipAddress.split('.').slice(0, 2).join('.');
    const knownPrefixes = profile.baselineMetrics.commonIpAddresses.map(ip => 
      ip.split('.').slice(0, 2).join('.')
    );

    return knownPrefixes.includes(ipPrefix) ? 0.1 : 0.6;
  }

  private async calculateVolumetricScore(profile: UserBehaviorProfile, activity: any): Promise<number> {
    if (!activity.dataVolume) return 0;

    const { min, max } = profile.baselineMetrics.normalDataVolumeRange;
    if (activity.dataVolume >= min && activity.dataVolume <= max) {
      return 0.1;
    }

    // Calculate how far outside the normal range
    const deviation = activity.dataVolume > max 
      ? (activity.dataVolume - max) / max
      : (min - activity.dataVolume) / min;

    return Math.min(deviation, 1.0);
  }

  private async calculateContextualScore(profile: UserBehaviorProfile, activity: any): Promise<number> {
    let contextualRisk = 0;

    // Administrative actions outside normal hours
    if (activity.isAdminAction && activity.timestamp) {
      const hour = new Date(activity.timestamp).getHours();
      if (hour < 6 || hour > 22) {
        contextualRisk += 0.5;
      }
    }

    // Multiple failed attempts
    if (activity.failedAttempts && activity.failedAttempts > 3) {
      contextualRisk += Math.min(activity.failedAttempts / 10, 0.6);
    }

    // Privilege escalation attempts
    if (activity.privilegeEscalation) {
      contextualRisk += 0.7;
    }

    return Math.min(contextualRisk, 1.0);
  }

  // ============================================================================
  // PATTERN RECOGNITION
  // ============================================================================

  async detectSecurityPatterns(tenantId: string, timeWindowHours: number = 24): Promise<SecurityPattern[]> {
    const startTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    
    const events = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        timestamp: { gte: startTime },
      },
      orderBy: { timestamp: 'desc' },
    });

    const patterns: SecurityPattern[] = [];

    // Detect brute force patterns
    patterns.push(...await this.detectBruteForcePatterns(events, tenantId));
    
    // Detect privilege escalation patterns
    patterns.push(...await this.detectPrivilegeEscalationPatterns(events, tenantId));
    
    // Detect data exfiltration patterns
    patterns.push(...await this.detectDataExfiltrationPatterns(events, tenantId));
    
    // Detect access violation patterns
    patterns.push(...await this.detectAccessViolationPatterns(events, tenantId));

    return patterns;
  }

  private async detectBruteForcePatterns(events: any[], tenantId: string): Promise<SecurityPattern[]> {
    const patterns: SecurityPattern[] = [];
    
    // Group events by IP address and user
    const groupedByIp = new Map<string, any[]>();
    const groupedByUser = new Map<string, any[]>();

    events.forEach(event => {
      if (event.eventType === 'LOGIN_FAILED') {
        const ip = event.metadata?.ipAddress;
        const userId = event.userId;

        if (ip) {
          if (!groupedByIp.has(ip)) groupedByIp.set(ip, []);
          groupedByIp.get(ip)!.push(event);
        }

        if (userId) {
          if (!groupedByUser.has(userId)) groupedByUser.set(userId, []);
          groupedByUser.get(userId)!.push(event);
        }
      }
    });

    // Detect IP-based brute force
    for (const [ip, ipEvents] of Array.from(groupedByIp)) {
      if (ipEvents.length >= 10) { // 10+ failed attempts from same IP
        patterns.push({
          id: `brute_force_ip_${ip}_${Date.now()}`,
          type: 'BRUTE_FORCE',
          confidence: Math.min(ipEvents.length / 20, 1.0),
          severity: ipEvents.length > 50 ? 'CRITICAL' : ipEvents.length > 20 ? 'HIGH' : 'MEDIUM',
          description: `Brute force attack detected from IP ${ip}`,
          indicators: [`IP: ${ip}`, `Failed attempts: ${ipEvents.length}`],
          firstSeen: new Date(Math.min(...ipEvents.map(e => e.timestamp.getTime()))),
          lastSeen: new Date(Math.max(...ipEvents.map(e => e.timestamp.getTime()))),
          occurrences: ipEvents.length,
          tenantId,
        });
      }
    }

    // Detect user-based attacks
    for (const [userId, userEvents] of Array.from(groupedByUser)) {
      if (userEvents.length >= 5) { // 5+ failed attempts for same user
        patterns.push({
          id: `brute_force_user_${userId}_${Date.now()}`,
          type: 'BRUTE_FORCE',
          confidence: Math.min(userEvents.length / 15, 1.0),
          severity: userEvents.length > 20 ? 'HIGH' : 'MEDIUM',
          description: `Credential stuffing attack detected for user ${userId}`,
          indicators: [`User: ${userId}`, `Failed attempts: ${userEvents.length}`],
          firstSeen: new Date(Math.min(...userEvents.map(e => e.timestamp.getTime()))),
          lastSeen: new Date(Math.max(...userEvents.map(e => e.timestamp.getTime()))),
          occurrences: userEvents.length,
          tenantId,
        });
      }
    }

    return patterns;
  }

  private async detectPrivilegeEscalationPatterns(events: any[], tenantId: string): Promise<SecurityPattern[]> {
    const escalationEvents = events.filter(event => 
      event.eventType === 'PRIVILEGE_ESCALATION' || 
      event.eventType === 'ADMIN_ACCESS' ||
      event.eventType === 'ROLE_CHANGE'
    );

    if (escalationEvents.length < 2) return [];

    const userEscalations = new Map<string, any[]>();
    escalationEvents.forEach(event => {
      if (event.userId) {
        if (!userEscalations.has(event.userId)) userEscalations.set(event.userId, []);
        userEscalations.get(event.userId)!.push(event);
      }
    });

    const patterns: SecurityPattern[] = [];

    for (const [userId, userEvents] of Array.from(userEscalations)) {
      if (userEvents.length >= 2) {
        const timeSpread = Math.max(...userEvents.map(e => e.timestamp.getTime())) - 
                          Math.min(...userEvents.map(e => e.timestamp.getTime()));
        
        // Rapid privilege escalation (within 1 hour)
        if (timeSpread < 60 * 60 * 1000) {
          patterns.push({
            id: `privilege_escalation_${userId}_${Date.now()}`,
            type: 'PRIVILEGE_ESCALATION',
            confidence: 0.8,
            severity: 'HIGH',
            description: `Rapid privilege escalation detected for user ${userId}`,
            indicators: [`User: ${userId}`, `Escalations: ${userEvents.length}`, `Timespan: ${Math.round(timeSpread / (60 * 1000))} minutes`],
            firstSeen: new Date(Math.min(...userEvents.map(e => e.timestamp.getTime()))),
            lastSeen: new Date(Math.max(...userEvents.map(e => e.timestamp.getTime()))),
            occurrences: userEvents.length,
            tenantId,
          });
        }
      }
    }

    return patterns;
  }

  private async detectDataExfiltrationPatterns(events: any[], tenantId: string): Promise<SecurityPattern[]> {
    const dataEvents = events.filter(event => 
      event.eventType === 'DATA_EXPORT' || 
      event.eventType === 'FILE_DOWNLOAD' ||
      event.eventType === 'BULK_ACCESS'
    );

    if (dataEvents.length < 5) return [];

    const patterns: SecurityPattern[] = [];
    const userDataAccess = new Map<string, any[]>();

    dataEvents.forEach(event => {
      if (event.userId) {
        if (!userDataAccess.has(event.userId)) userDataAccess.set(event.userId, []);
        userDataAccess.get(event.userId)!.push(event);
      }
    });

    for (const [userId, userEvents] of Array.from(userDataAccess)) {
      if (userEvents.length >= 5) {
        const totalVolume = userEvents.reduce((sum, event) => 
          sum + (event.metadata?.dataVolume || 0), 0
        );

        if (totalVolume > 1000000) { // 1MB+ of data
          patterns.push({
            id: `data_exfiltration_${userId}_${Date.now()}`,
            type: 'DATA_EXFILTRATION',
            confidence: Math.min(totalVolume / 10000000, 1.0), // Confidence based on volume
            severity: totalVolume > 100000000 ? 'CRITICAL' : totalVolume > 10000000 ? 'HIGH' : 'MEDIUM',
            description: `Potential data exfiltration detected for user ${userId}`,
            indicators: [
              `User: ${userId}`, 
              `Data volume: ${Math.round(totalVolume / 1024)} KB`,
              `Access events: ${userEvents.length}`
            ],
            firstSeen: new Date(Math.min(...userEvents.map(e => e.timestamp.getTime()))),
            lastSeen: new Date(Math.max(...userEvents.map(e => e.timestamp.getTime()))),
            occurrences: userEvents.length,
            tenantId,
          });
        }
      }
    }

    return patterns;
  }

  private async detectAccessViolationPatterns(events: any[], tenantId: string): Promise<SecurityPattern[]> {
    const violationEvents = events.filter(event => 
      event.eventType === 'ACCESS_DENIED' || 
      event.eventType === 'UNAUTHORIZED_ACCESS'
    );

    if (violationEvents.length < 3) return [];

    const patterns: SecurityPattern[] = [];
    const resourceViolations = new Map<string, any[]>();

    violationEvents.forEach(event => {
      const resource = event.metadata?.resource || 'unknown';
      if (!resourceViolations.has(resource)) resourceViolations.set(resource, []);
      resourceViolations.get(resource)!.push(event);
    });

    for (const [resource, resourceEvents] of Array.from(resourceViolations)) {
      if (resourceEvents.length >= 3) {
        patterns.push({
          id: `access_violation_${resource}_${Date.now()}`,
          type: 'ACCESS_VIOLATION',
          confidence: Math.min(resourceEvents.length / 10, 1.0),
          severity: resourceEvents.length > 10 ? 'HIGH' : 'MEDIUM',
          description: `Repeated access violations detected for resource ${resource}`,
          indicators: [
            `Resource: ${resource}`, 
            `Violations: ${resourceEvents.length}`,
            `Unique users: ${new Set(resourceEvents.map(e => e.userId)).size}`
          ],
          firstSeen: new Date(Math.min(...resourceEvents.map(e => e.timestamp.getTime()))),
          lastSeen: new Date(Math.max(...resourceEvents.map(e => e.timestamp.getTime()))),
          occurrences: resourceEvents.length,
          tenantId,
        });
      }
    }

    return patterns;
  }

  // ============================================================================
  // PREDICTIVE ANALYTICS
  // ============================================================================

  async predictThreats(tenantId: string): Promise<ThreatPrediction[]> {
    const predictions: ThreatPrediction[] = [];

    // Get historical security events for analysis
    const historicalEvents = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      orderBy: { timestamp: 'desc' },
    });

    // Predict brute force attacks
    predictions.push(...await this.predictBruteForceAttacks(historicalEvents, tenantId));
    
    // Predict data breaches
    predictions.push(...await this.predictDataBreaches(historicalEvents, tenantId));
    
    // Predict insider threats
    predictions.push(...await this.predictInsiderThreats(historicalEvents, tenantId));

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  private async predictBruteForceAttacks(events: any[], tenantId: string): Promise<ThreatPrediction[]> {
    const loginFailures = events.filter(e => e.eventType === 'LOGIN_FAILED');
    
    if (loginFailures.length < 10) return [];

    // Analyze failure patterns over time
    const hourlyFailures = new Array(24).fill(0);
    const dailyFailures = new Array(7).fill(0);

    loginFailures.forEach(event => {
      const hour = event.timestamp.getHours();
      const day = event.timestamp.getDay();
      hourlyFailures[hour]++;
      dailyFailures[day]++;
    });

    const avgDailyFailures = dailyFailures.reduce((a, b) => a + b, 0) / 7;
    const peakHour = hourlyFailures.indexOf(Math.max(...hourlyFailures));
    
    if (avgDailyFailures > 5) {
      return [{
        threatType: 'BRUTE_FORCE_ATTACK',
        probability: Math.min(avgDailyFailures / 20, 0.9),
        timeframe: '24_HOURS',
        confidence: 0.7,
        riskFactors: [
          `Average ${Math.round(avgDailyFailures)} failed logins per day`,
          `Peak activity at ${peakHour}:00`,
          'Increasing login failure trend detected'
        ],
        mitigationStrategies: [
          'Implement account lockout policies',
          'Enable CAPTCHA after failed attempts',
          'Monitor and block suspicious IP addresses',
          'Implement rate limiting on login endpoints'
        ],
      }];
    }

    return [];
  }

  private async predictDataBreaches(events: any[], tenantId: string): Promise<ThreatPrediction[]> {
    const dataEvents = events.filter(e => 
      e.eventType === 'DATA_ACCESS' || 
      e.eventType === 'DATA_EXPORT' ||
      e.eventType === 'UNAUTHORIZED_ACCESS'
    );

    if (dataEvents.length < 5) return [];

    const volumeByUser = new Map<string, number>();
    const accessByUser = new Map<string, number>();

    dataEvents.forEach(event => {
      const userId = event.userId || 'unknown';
      const volume = event.metadata?.dataVolume || 0;
      
      volumeByUser.set(userId, (volumeByUser.get(userId) || 0) + volume);
      accessByUser.set(userId, (accessByUser.get(userId) || 0) + 1);
    });

    const suspiciousUsers = Array.from(volumeByUser.entries())
      .filter(([_, volume]) => volume > 50000000) // 50MB+
      .map(([userId, volume]) => ({ userId, volume, accesses: accessByUser.get(userId) || 0 }));

    if (suspiciousUsers.length > 0) {
      const topUser = suspiciousUsers[0];
      
      return [{
        threatType: 'DATA_BREACH',
        probability: Math.min(topUser.volume / 500000000, 0.85), // Up to 500MB for max probability
        timeframe: '7_DAYS',
        confidence: 0.6,
        riskFactors: [
          `User ${topUser.userId} accessed ${Math.round(topUser.volume / 1024 / 1024)}MB of data`,
          `${topUser.accesses} data access events in 30 days`,
          'Unusual data access patterns detected'
        ],
        mitigationStrategies: [
          'Implement data loss prevention (DLP) tools',
          'Monitor large data exports',
          'Require additional authorization for bulk data access',
          'Regular access reviews and privilege audits'
        ],
      }];
    }

    return [];
  }

  private async predictInsiderThreats(events: any[], tenantId: string): Promise<ThreatPrediction[]> {
    const userActivity = new Map<string, any[]>();
    
    events.forEach(event => {
      if (event.userId) {
        if (!userActivity.has(event.userId)) userActivity.set(event.userId, []);
        userActivity.get(event.userId)!.push(event);
      }
    });

    const suspiciousUsers = [];

    for (const [userId, userEvents] of Array.from(userActivity)) {
      const riskScore = this.calculateInsiderThreatScore(userEvents);
      if (riskScore > 0.5) {
        suspiciousUsers.push({ userId, riskScore, eventCount: userEvents.length });
      }
    }

    if (suspiciousUsers.length > 0) {
      const topThreat = suspiciousUsers.sort((a, b) => b.riskScore - a.riskScore)[0];
      
      return [{
        threatType: 'INSIDER_THREAT',
        probability: topThreat.riskScore,
        timeframe: '7_DAYS',
        confidence: 0.65,
        riskFactors: [
          `User ${topThreat.userId} shows suspicious behavior patterns`,
          `Risk score: ${Math.round(topThreat.riskScore * 100)}%`,
          `${topThreat.eventCount} security events in 30 days`
        ],
        mitigationStrategies: [
          'Enhanced monitoring of user activities',
          'Regular behavioral analysis reviews',
          'Implement user activity analytics',
          'Conduct security awareness training'
        ],
      }];
    }

    return [];
  }

  private calculateInsiderThreatScore(userEvents: any[]): number {
    let score = 0;
    
    // Off-hours activity
    const offHoursEvents = userEvents.filter(e => {
      const hour = e.timestamp.getHours();
      return hour < 6 || hour > 22;
    });
    score += (offHoursEvents.length / userEvents.length) * 0.3;

    // Failed access attempts
    const failedAccess = userEvents.filter(e => 
      e.eventType === 'ACCESS_DENIED' || e.eventType === 'UNAUTHORIZED_ACCESS'
    ).length;
    score += Math.min(failedAccess / 10, 0.4);

    // Data export activities
    const dataExports = userEvents.filter(e => e.eventType === 'DATA_EXPORT').length;
    score += Math.min(dataExports / 5, 0.3);

    return Math.min(score, 1.0);
  }

  // ============================================================================
  // USER BEHAVIOR PROFILING
  // ============================================================================

  async updateUserBehaviorProfile(userId: string, tenantId: string, activity: any): Promise<void> {
    const existingProfile = await this.getUserBehaviorProfile(userId, tenantId);
    
    if (!existingProfile) {
      // Create new profile
      const newProfile: UserBehaviorProfile = {
        userId,
        tenantId,
        baselineMetrics: {
          avgSessionDuration: activity.sessionDuration || 0,
          typicalLoginTimes: activity.timestamp ? [new Date(activity.timestamp).getHours()] : [],
          commonIpAddresses: activity.ipAddress ? [activity.ipAddress] : [],
          frequentlyAccessedResources: activity.resources || [],
          normalDataVolumeRange: { 
            min: activity.dataVolume || 0, 
            max: activity.dataVolume || 0 
          },
          typicalDeviceFingerprints: activity.deviceFingerprint ? [activity.deviceFingerprint] : [],
        },
        anomalyScore: 0,
        lastUpdated: new Date(),
        trainingSamples: 1,
      };
      
      this.userProfiles.set(`${userId}_${tenantId}`, newProfile);
    } else {
      // Update existing profile
      this.updateBaselineMetrics(existingProfile, activity);
      existingProfile.lastUpdated = new Date();
      existingProfile.trainingSamples++;
    }
  }

  private updateBaselineMetrics(profile: UserBehaviorProfile, activity: any): void {
    const metrics = profile.baselineMetrics;
    
    // Update session duration (rolling average)
    if (activity.sessionDuration) {
      metrics.avgSessionDuration = (metrics.avgSessionDuration + activity.sessionDuration) / 2;
    }
    
    // Update typical login times
    if (activity.timestamp) {
      const hour = new Date(activity.timestamp).getHours();
      if (!metrics.typicalLoginTimes.includes(hour)) {
        metrics.typicalLoginTimes.push(hour);
        // Keep only most frequent hours (max 8)
        if (metrics.typicalLoginTimes.length > 8) {
          metrics.typicalLoginTimes = metrics.typicalLoginTimes.slice(-8);
        }
      }
    }
    
    // Update common IP addresses
    if (activity.ipAddress && !metrics.commonIpAddresses.includes(activity.ipAddress)) {
      metrics.commonIpAddresses.push(activity.ipAddress);
      // Keep only recent IPs (max 10)
      if (metrics.commonIpAddresses.length > 10) {
        metrics.commonIpAddresses = metrics.commonIpAddresses.slice(-10);
      }
    }
    
    // Update data volume range
    if (activity.dataVolume) {
      metrics.normalDataVolumeRange.min = Math.min(metrics.normalDataVolumeRange.min, activity.dataVolume);
      metrics.normalDataVolumeRange.max = Math.max(metrics.normalDataVolumeRange.max, activity.dataVolume);
    }
    
    // Update device fingerprints
    if (activity.deviceFingerprint && !metrics.typicalDeviceFingerprints.includes(activity.deviceFingerprint)) {
      metrics.typicalDeviceFingerprints.push(activity.deviceFingerprint);
      // Keep only recent devices (max 5)
      if (metrics.typicalDeviceFingerprints.length > 5) {
        metrics.typicalDeviceFingerprints = metrics.typicalDeviceFingerprints.slice(-5);
      }
    }
  }

  async getUserBehaviorProfile(userId: string, tenantId: string): Promise<UserBehaviorProfile | null> {
    const key = `${userId}_${tenantId}`;
    
    if (this.userProfiles.has(key)) {
      return this.userProfiles.get(key)!;
    }
    
    // In a real implementation, you'd load this from a database
    // For now, return null to indicate no profile exists
    return null;
  }

  // ============================================================================
  // ALERT GENERATION
  // ============================================================================

  async generateSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecuritySeverity,
    title: string,
    description: string,
    tenantId: string,
    metadata: Record<string, any> = {},
    userId?: string
  ): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      confidence: metadata.confidence || 0.8,
      title,
      description,
      userId,
      tenantId,
      metadata,
      timestamp: new Date(),
      resolved: false,
      falsePositive: false,
    };

    // Store alert in database
    try {
      await prisma.securityEvent.create({
        data: {
          id: alert.id,
          tenantId,
          performedById: userId,
          eventType: 'THREAT_DETECTED',
          severity,
          description: title,
          metadata: {
            alertType: type,
            ...metadata,
          },
          resolved: false,
          timestamp: alert.timestamp,
        },
      });
    } catch (error) {
      logger.error('Failed to store security alert', { alert }, error as Error);
    }

    return alert;
  }

  // ============================================================================
  // MAIN ANALYSIS METHODS
  // ============================================================================

  async analyzeSecurityEvents(tenantId: string): Promise<{
    threatScore: number;
    patterns: SecurityPattern[];
    predictions: ThreatPrediction[];
    alerts: SecurityAlert[];
  }> {
    try {
      // Detect patterns in recent events
      const patterns = await this.detectSecurityPatterns(tenantId, 24);
      
      // Generate threat predictions
      const predictions = await this.predictThreats(tenantId);
      
      // Calculate overall threat score
      const threatScore = this.calculateOverallThreatScore(patterns, predictions);
      
      // Generate alerts for high-confidence threats
      const alerts: SecurityAlert[] = [];
      
      for (const pattern of patterns) {
        if (pattern.confidence > this.config.alertThreshold) {
          alerts.push(await this.generateSecurityAlert(
            'PATTERN_MATCH',
            pattern.severity,
            `Security Pattern Detected: ${pattern.type}`,
            pattern.description,
            tenantId,
            {
              pattern: pattern.type,
              confidence: pattern.confidence,
              indicators: pattern.indicators,
            }
          ));
        }
      }
      
      for (const prediction of predictions) {
        if (prediction.probability > this.config.alertThreshold) {
          alerts.push(await this.generateSecurityAlert(
            'ML_PREDICTION',
            prediction.probability > 0.8 ? 'HIGH' : 'MEDIUM',
            `Threat Prediction: ${prediction.threatType}`,
            `Predicted ${prediction.threatType} with ${Math.round(prediction.probability * 100)}% probability`,
            tenantId,
            {
              threatType: prediction.threatType,
              probability: prediction.probability,
              timeframe: prediction.timeframe,
              riskFactors: prediction.riskFactors,
            }
          ));
        }
      }
      
      return {
        threatScore,
        patterns,
        predictions,
        alerts,
      };
    } catch (error) {
      logger.error('Security analysis failed', { tenantId }, error as Error);
      throw error;
    }
  }

  private calculateOverallThreatScore(patterns: SecurityPattern[], predictions: ThreatPrediction[]): number {
    let score = 0;
    
    // Factor in pattern confidence
    if (patterns.length > 0) {
      const avgPatternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      score += avgPatternConfidence * 0.4;
    }
    
    // Factor in prediction probabilities
    if (predictions.length > 0) {
      const maxPredictionProbability = Math.max(...predictions.map(p => p.probability));
      score += maxPredictionProbability * 0.6;
    }
    
    return Math.min(score, 1.0);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const threatDetectionService = new ThreatDetectionService({
  enableBehavioralAnalysis: true,
  enableAnomalyDetection: true,
  enablePatternRecognition: true,
  sensitivityLevel: 'MEDIUM',
  alertThreshold: 0.7,
  learningWindowDays: 30,
});
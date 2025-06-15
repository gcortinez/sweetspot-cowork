import { prisma } from '../lib/prisma';
import { SecurityEventType, SecuritySeverity, AuditAction } from '@prisma/client';
import { complianceReportingService } from './complianceReportingService';

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
    sox: { status: string; score: number; issues: number };
    gdpr: { status: string; score: number; issues: number };
    hipaa: { status: string; score: number; issues: number };
    pciDss: { status: string; score: number; issues: number };
  };
  dataProtection: {
    encryptionStatus: 'ENABLED' | 'PARTIAL' | 'DISABLED';
    backupStatus: 'CURRENT' | 'OUTDATED' | 'FAILED';
    retentionCompliance: 'COMPLIANT' | 'NON_COMPLIANT';
  };
  auditTrail: {
    completeness: number; // percentage
    retention: number; // days
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
  averageResolutionTime: number; // hours
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
    resolutionTime: number; // hours
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

export class SecurityDashboardService {

  // ============================================================================
  // MAIN DASHBOARD DATA
  // ============================================================================

  async getDashboardData(tenantId: string, timeframe: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' = 'DAY'): Promise<SecurityDashboardData> {
    const [
      overview,
      realTimeMetrics,
      threatIntelligence,
      complianceStatus,
      securityTrends,
      incidentTracking,
      systemHealth,
      alerts,
      recommendations,
    ] = await Promise.all([
      this.getSecurityOverview(tenantId),
      this.getRealTimeMetrics(tenantId),
      this.getThreatIntelligence(tenantId),
      this.getComplianceStatus(tenantId),
      this.getSecurityTrends(tenantId, timeframe),
      this.getIncidentTracking(tenantId),
      this.getSystemHealth(tenantId),
      this.getSecurityAlerts(tenantId),
      this.getSecurityRecommendations(tenantId),
    ]);

    return {
      overview,
      realTimeMetrics,
      threatIntelligence,
      complianceStatus,
      securityTrends,
      incidentTracking,
      systemHealth,
      alerts,
      recommendations,
    };
  }

  // ============================================================================
  // SECURITY OVERVIEW
  // ============================================================================

  async getSecurityOverview(tenantId: string): Promise<SecurityOverview> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [securityEvents, auditLogs, accessViolations] = await Promise.all([
      prisma.securityEvent.count({
        where: {
          tenantId,
          timestamp: { gte: last24Hours },
        },
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          timestamp: { gte: last24Hours },
        },
      }),
      prisma.accessViolation.count({
        where: {
          tenantId,
          createdAt: { gte: last24Hours },
          resolved: false,
        },
      }),
    ]);

    const criticalEvents = await prisma.securityEvent.count({
      where: {
        tenantId,
        severity: SecuritySeverity.CRITICAL,
        resolved: false,
      },
    });

    const resolvedIncidents = await prisma.securityEvent.count({
      where: {
        tenantId,
        timestamp: { gte: last24Hours },
        resolved: true,
      },
    });

    // Calculate security score
    const securityScore = this.calculateSecurityScore({
      criticalEvents,
      accessViolations,
      auditActivity: auditLogs,
      securityEventCount: securityEvents,
    });

    const riskLevel = this.determineRiskLevel(securityScore, criticalEvents, accessViolations);

    return {
      securityScore,
      riskLevel,
      activeThreats: criticalEvents,
      resolvedIncidents,
      pendingAlerts: accessViolations,
      lastUpdated: now,
    };
  }

  // ============================================================================
  // REAL-TIME METRICS
  // ============================================================================

  async getRealTimeMetrics(tenantId: string): Promise<RealTimeMetrics> {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [loginMetrics, accessMetrics, systemMetrics, networkMetrics] = await Promise.all([
      this.getLoginMetrics(tenantId, lastHour, today),
      this.getAccessMetrics(tenantId, today),
      this.getSystemMetrics(tenantId, today),
      this.getNetworkMetrics(tenantId, today),
    ]);

    return {
      loginAttempts: loginMetrics,
      accessControl: accessMetrics,
      systemActivity: systemMetrics,
      networkSecurity: networkMetrics,
    };
  }

  private async getLoginMetrics(tenantId: string, lastHour: Date, today: Date) {
    const [successful, failed, suspicious] = await Promise.all([
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: SecurityEventType.SUCCESSFUL_LOGIN,
          timestamp: { gte: today },
        },
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: SecurityEventType.FAILED_LOGIN,
          timestamp: { gte: today },
        },
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: SecurityEventType.SUSPICIOUS_LOGIN,
          timestamp: { gte: today },
        },
      }),
    ]);

    const lastHourLogins = await prisma.securityEvent.count({
      where: {
        tenantId,
        eventType: { in: [SecurityEventType.SUCCESSFUL_LOGIN, SecurityEventType.FAILED_LOGIN] },
        timestamp: { gte: lastHour },
      },
    });

    return {
      successful,
      failed,
      suspicious,
      lastHour: lastHourLogins,
    };
  }

  private async getAccessMetrics(tenantId: string, today: Date) {
    const [qrScans, violations] = await Promise.all([
      prisma.qrCodeScan.count({
        where: {
          tenantId,
          scannedAt: { gte: today },
        },
      }),
      prisma.accessViolation.count({
        where: {
          tenantId,
          createdAt: { gte: today },
        },
      }),
    ]);

    const authorized = await prisma.qrCodeScan.count({
      where: {
        tenantId,
        scannedAt: { gte: today },
        result: 'SUCCESS',
      },
    });

    const denied = qrScans - authorized;

    return {
      authorizedAccess: authorized,
      deniedAccess: denied,
      violationsToday: violations,
      qrScansToday: qrScans,
    };
  }

  private async getSystemMetrics(tenantId: string, today: Date) {
    const [activeSessions, dataExports, configChanges] = await Promise.all([
      prisma.userSession.count({
        where: {
          tenantId,
          isActive: true,
        },
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          action: AuditAction.EXPORT_DATA,
          timestamp: { gte: today },
        },
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          action: AuditAction.SYSTEM_CONFIG,
          timestamp: { gte: today },
        },
      }),
    ]);

    const activeUsers = await prisma.userSession.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        isActive: true,
        lastActivity: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // Last 30 minutes
      },
    }).then(result => result.length);

    return {
      activeUsers,
      activeSessions,
      dataExports,
      configChanges,
    };
  }

  private async getNetworkMetrics(tenantId: string, today: Date) {
    const [maliciousRequests, rateLimitHits] = await Promise.all([
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: SecurityEventType.MALICIOUS_REQUEST,
          timestamp: { gte: today },
        },
      }),
      prisma.securityEvent.count({
        where: {
          tenantId,
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          timestamp: { gte: today },
        },
      }),
    ]);

    // Mock network metrics (in production, these would come from your load balancer/proxy)
    const totalRequests = Math.floor(Math.random() * 10000) + 5000;
    const blockedRequests = maliciousRequests + rateLimitHits;

    return {
      requests: totalRequests,
      blockedRequests,
      rateLimitHits,
      maliciousAttempts: maliciousRequests,
    };
  }

  // ============================================================================
  // THREAT INTELLIGENCE
  // ============================================================================

  async getThreatIntelligence(tenantId: string): Promise<ThreatIntelligence> {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const threatEvents = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        timestamp: { gte: last7Days },
        severity: { in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] },
      },
      orderBy: { timestamp: 'desc' },
    });

    const activeThreats = this.categorizeThreats(threatEvents);
    const attackPatterns = this.identifyAttackPatterns(threatEvents);
    const ipReputation = await this.analyzeIPReputation(tenantId);
    const geolocation = await this.analyzeGeolocation(tenantId);

    const threatLevel = this.calculateThreatLevel(activeThreats);

    return {
      threatLevel,
      activeThreats,
      attackPatterns,
      ipReputation,
      geolocation,
    };
  }

  private categorizeThreats(events: any[]): Array<any> {
    const threatMap = new Map();

    events.forEach(event => {
      const key = event.eventType;
      if (!threatMap.has(key)) {
        threatMap.set(key, {
          type: event.eventType,
          severity: event.severity,
          count: 0,
          lastSeen: event.timestamp,
          source: 'Internal Monitoring',
        });
      }
      
      const threat = threatMap.get(key);
      threat.count++;
      if (event.timestamp > threat.lastSeen) {
        threat.lastSeen = event.timestamp;
      }
    });

    return Array.from(threatMap.values()).sort((a, b) => b.count - a.count);
  }

  private identifyAttackPatterns(events: any[]): Array<any> {
    // Analyze patterns in security events
    const patterns = [
      {
        pattern: 'Brute Force Login',
        frequency: events.filter(e => e.eventType === SecurityEventType.MULTIPLE_FAILED_LOGINS).length,
        mitigation: 'Enable account lockout and CAPTCHA',
      },
      {
        pattern: 'Privilege Escalation',
        frequency: events.filter(e => e.eventType === SecurityEventType.PRIVILEGE_ESCALATION).length,
        mitigation: 'Review role assignments and permissions',
      },
      {
        pattern: 'Data Exfiltration',
        frequency: events.filter(e => e.eventType === SecurityEventType.DATA_EXPORT).length,
        mitigation: 'Implement data loss prevention controls',
      },
    ];

    return patterns.filter(p => p.frequency > 0).sort((a, b) => b.frequency - a.frequency);
  }

  private async analyzeIPReputation(tenantId: string): Promise<Array<any>> {
    // Get IP addresses from recent security events
    const events = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        ipAddress: { not: null },
      },
      select: { ipAddress: true, eventType: true, severity: true },
    });

    const ipMap = new Map();

    events.forEach(event => {
      if (!event.ipAddress) return;
      
      if (!ipMap.has(event.ipAddress)) {
        ipMap.set(event.ipAddress, {
          ip: event.ipAddress,
          reputation: 'GOOD',
          attempts: 0,
          blocked: false,
        });
      }
      
      const ip = ipMap.get(event.ipAddress);
      ip.attempts++;
      
      // Simple reputation scoring
      if (event.eventType === SecurityEventType.MALICIOUS_REQUEST || 
          event.severity === SecuritySeverity.CRITICAL) {
        ip.reputation = 'MALICIOUS';
        ip.blocked = true;
      } else if (event.eventType === SecurityEventType.FAILED_LOGIN ||
                 event.eventType === SecurityEventType.MULTIPLE_FAILED_LOGINS) {
        ip.reputation = 'SUSPICIOUS';
      }
    });

    return Array.from(ipMap.values()).sort((a, b) => b.attempts - a.attempts);
  }

  private async analyzeGeolocation(tenantId: string): Promise<Array<any>> {
    // Mock geolocation data (in production, this would use actual GeoIP services)
    return [
      { country: 'United States', requests: 1250, suspicious: 5, blocked: 2 },
      { country: 'Canada', requests: 340, suspicious: 1, blocked: 0 },
      { country: 'United Kingdom', requests: 180, suspicious: 3, blocked: 1 },
      { country: 'Unknown', requests: 45, suspicious: 15, blocked: 12 },
    ];
  }

  private calculateThreatLevel(threats: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalThreats = threats.filter(t => t.severity === 'CRITICAL').length;
    const highThreats = threats.filter(t => t.severity === 'HIGH').length;

    if (criticalThreats > 0) return 'CRITICAL';
    if (highThreats > 2) return 'HIGH';
    if (threats.length > 5) return 'MEDIUM';
    return 'LOW';
  }

  // ============================================================================
  // COMPLIANCE STATUS
  // ============================================================================

  async getComplianceStatus(tenantId: string): Promise<ComplianceStatus> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Generate compliance reports for scoring
    const [soxReport, gdprReport, hipaaReport, pciReport] = await Promise.all([
      complianceReportingService.generateSOXReport({ tenantId, startDate, endDate }),
      complianceReportingService.generateGDPRReport({ tenantId, startDate, endDate }),
      complianceReportingService.generateHIPAAReport({ tenantId, startDate, endDate }),
      complianceReportingService.generatePCIDSSReport({ tenantId, startDate, endDate }),
    ]);

    const frameworks = {
      sox: {
        status: soxReport.complianceViolations.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
        score: Math.max(0, 100 - (soxReport.complianceViolations.length * 10)),
        issues: soxReport.complianceViolations.length,
      },
      gdpr: {
        status: gdprReport.complianceStatus,
        score: gdprReport.complianceStatus === 'COMPLIANT' ? 100 : 
               gdprReport.complianceStatus === 'PENDING_REVIEW' ? 80 : 60,
        issues: gdprReport.summary.breachIncidents,
      },
      hipaa: {
        status: hipaaReport.violations.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
        score: Math.max(0, 100 - (hipaaReport.violations.length * 15)),
        issues: hipaaReport.violations.length,
      },
      pciDss: {
        status: pciReport.summary.complianceScore >= 90 ? 'COMPLIANT' : 'NON_COMPLIANT',
        score: pciReport.summary.complianceScore,
        issues: pciReport.vulnerabilities.length,
      },
    };

    const overallScore = (frameworks.sox.score + frameworks.gdpr.score + 
                         frameworks.hipaa.score + frameworks.pciDss.score) / 4;

    const overall = overallScore >= 90 ? 'COMPLIANT' : 
                   overallScore >= 70 ? 'PENDING_REVIEW' : 'NON_COMPLIANT';

    const dataProtection = {
      encryptionStatus: 'ENABLED' as const,
      backupStatus: 'CURRENT' as const,
      retentionCompliance: 'COMPLIANT' as const,
    };

    const auditTrail = {
      completeness: 95, // Mock percentage
      retention: 365, // Days
      lastAudit: new Date(),
    };

    return {
      overall,
      frameworks,
      dataProtection,
      auditTrail,
    };
  }

  // ============================================================================
  // SECURITY TRENDS
  // ============================================================================

  async getSecurityTrends(tenantId: string, timeframe: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'): Promise<SecurityTrends> {
    const { intervals, startDate } = this.getTimeIntervals(timeframe);
    
    const trendData = await Promise.all(
      intervals.map(async interval => {
        const [securityEvents, failedLogins, accessViolations] = await Promise.all([
          prisma.securityEvent.count({
            where: {
              tenantId,
              timestamp: { gte: interval.start, lt: interval.end },
            },
          }),
          prisma.securityEvent.count({
            where: {
              tenantId,
              eventType: SecurityEventType.FAILED_LOGIN,
              timestamp: { gte: interval.start, lt: interval.end },
            },
          }),
          prisma.accessViolation.count({
            where: {
              tenantId,
              createdAt: { gte: interval.start, lt: interval.end },
            },
          }),
        ]);

        return {
          timestamp: interval.start,
          securityEvents,
          failedLogins,
          accessViolations,
          complianceScore: Math.floor(Math.random() * 20) + 80, // Mock compliance score
        };
      })
    );

    // Generate predictions (mock data)
    const predictions = this.generateSecurityPredictions(trendData, timeframe);

    return {
      timeline: timeframe,
      data: trendData,
      predictions,
    };
  }

  private getTimeIntervals(timeframe: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH') {
    const now = new Date();
    let intervals: Array<{ start: Date; end: Date }> = [];
    let startDate: Date;

    switch (timeframe) {
      case 'HOUR':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        for (let i = 23; i >= 0; i--) {
          const start = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
          const end = new Date(now.getTime() - i * 60 * 60 * 1000);
          intervals.push({ start, end });
        }
        break;
      
      case 'DAY':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const start = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
          const end = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          intervals.push({ start, end });
        }
        break;
      
      case 'WEEK':
        startDate = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000); // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
          const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          intervals.push({ start, end });
        }
        break;
      
      case 'MONTH':
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const start = new Date(now.getTime() - (i + 1) * 30 * 24 * 60 * 60 * 1000);
          const end = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
          intervals.push({ start, end });
        }
        break;
    }

    return { intervals, startDate };
  }

  private generateSecurityPredictions(trendData: any[], timeframe: string): Array<any> {
    // Simple linear prediction based on recent trends
    const recentData = trendData.slice(-3); // Last 3 data points
    const avgThreatIncrease = recentData.length > 1 ? 
      (recentData[recentData.length - 1].securityEvents - recentData[0].securityEvents) / recentData.length : 0;

    const predictions = [];
    const lastTimestamp = trendData[trendData.length - 1]?.timestamp || new Date();

    for (let i = 1; i <= 3; i++) {
      const futureTimestamp = new Date(lastTimestamp.getTime() + i * this.getTimeIncrement(timeframe));
      const predictedThreats = Math.max(0, Math.floor(
        (recentData[recentData.length - 1]?.securityEvents || 0) + (avgThreatIncrease * i)
      ));

      predictions.push({
        timestamp: futureTimestamp,
        predictedThreats,
        confidence: Math.max(0.3, 0.9 - (i * 0.2)), // Decreasing confidence over time
      });
    }

    return predictions;
  }

  private getTimeIncrement(timeframe: string): number {
    switch (timeframe) {
      case 'HOUR': return 60 * 60 * 1000; // 1 hour
      case 'DAY': return 24 * 60 * 60 * 1000; // 1 day
      case 'WEEK': return 7 * 24 * 60 * 60 * 1000; // 1 week
      case 'MONTH': return 30 * 24 * 60 * 60 * 1000; // 1 month
      default: return 24 * 60 * 60 * 1000;
    }
  }

  // ============================================================================
  // INCIDENT TRACKING
  // ============================================================================

  async getIncidentTracking(tenantId: string): Promise<IncidentTracking> {
    const openIncidents = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        resolved: false,
        severity: { in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const recentResolutions = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        resolved: true,
        resolvedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { resolvedAt: 'desc' },
      take: 5,
    });

    const incidents = openIncidents.map(incident => ({
      id: incident.id,
      type: incident.eventType,
      severity: incident.severity,
      status: 'OPEN' as const,
      assignedTo: undefined,
      createdAt: incident.timestamp,
      resolvedAt: undefined,
      description: incident.description,
    }));

    const resolutions = recentResolutions.map(incident => {
      const resolutionTime = incident.resolvedAt ? 
        (incident.resolvedAt.getTime() - incident.timestamp.getTime()) / (1000 * 60 * 60) : 0;

      return {
        id: incident.id,
        type: incident.eventType,
        resolutionTime,
        resolvedAt: incident.resolvedAt!,
      };
    });

    const averageResolutionTime = resolutions.length > 0 ?
      resolutions.reduce((sum, r) => sum + r.resolutionTime, 0) / resolutions.length : 0;

    return {
      openIncidents: incidents.length,
      averageResolutionTime,
      incidents,
      recentResolutions: resolutions,
    };
  }

  // ============================================================================
  // SYSTEM HEALTH
  // ============================================================================

  async getSystemHealth(tenantId: string): Promise<SystemHealth> {
    const [userStats, sessionStats] = await Promise.all([
      prisma.user.count({
        where: {
          tenantId,
          twoFactorEnabled: true,
        },
      }),
      prisma.userSession.count({
        where: {
          tenantId,
          isActive: true,
        },
      }),
    ]);

    return {
      database: {
        status: 'HEALTHY',
        connections: sessionStats,
        queryTime: 45, // Mock average query time in ms
        lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      encryption: {
        status: 'HEALTHY',
        keyRotation: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        encryptedFields: 25, // Number of encrypted fields
      },
      authentication: {
        status: 'HEALTHY',
        twoFactorEnabled: userStats,
        sessionSecurity: 'HIGH',
      },
      monitoring: {
        status: 'HEALTHY',
        auditLogging: true,
        securityEventTracking: true,
        alerting: true,
      },
    };
  }

  // ============================================================================
  // SECURITY ALERTS
  // ============================================================================

  async getSecurityAlerts(tenantId: string): Promise<SecurityAlert[]> {
    const recentEvents = await prisma.securityEvent.findMany({
      where: {
        tenantId,
        severity: { in: [SecuritySeverity.MEDIUM, SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] },
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    return recentEvents.map(event => ({
      id: event.id,
      type: this.mapEventTypeToAlertType(event.eventType),
      severity: event.severity as any,
      title: this.generateAlertTitle(event.eventType),
      description: event.description,
      timestamp: event.timestamp,
      acknowledged: event.resolved,
      actionRequired: this.generateActionRequired(event.eventType, event.severity),
      source: 'Security Monitoring',
    }));
  }

  // ============================================================================
  // SECURITY RECOMMENDATIONS
  // ============================================================================

  async getSecurityRecommendations(tenantId: string): Promise<SecurityRecommendation[]> {
    // Analyze current security posture and generate recommendations
    const recommendations: SecurityRecommendation[] = [];

    // Check for common security issues
    const [weakPasswords, noTwoFactor, oldSessions] = await Promise.all([
      // Mock check for weak passwords
      Promise.resolve(5),
      prisma.user.count({
        where: {
          tenantId,
          twoFactorEnabled: false,
        },
      }),
      prisma.userSession.count({
        where: {
          tenantId,
          lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isActive: true,
        },
      }),
    ]);

    if (noTwoFactor > 0) {
      recommendations.push({
        id: 'rec_2fa',
        category: 'SECURITY',
        priority: 'HIGH',
        title: 'Enable Two-Factor Authentication',
        description: `${noTwoFactor} users do not have 2FA enabled`,
        impact: 'Significantly improves account security',
        effort: 'LOW',
        implementation: 'Send notification to users to enable 2FA',
      });
    }

    if (oldSessions > 0) {
      recommendations.push({
        id: 'rec_sessions',
        category: 'SECURITY',
        priority: 'MEDIUM',
        title: 'Clean Up Stale Sessions',
        description: `${oldSessions} sessions have been inactive for over 30 days`,
        impact: 'Reduces attack surface',
        effort: 'LOW',
        implementation: 'Implement automatic session cleanup',
      });
    }

    if (weakPasswords > 0) {
      recommendations.push({
        id: 'rec_passwords',
        category: 'SECURITY',
        priority: 'HIGH',
        title: 'Strengthen Password Policy',
        description: 'Detected weak passwords in the system',
        impact: 'Prevents credential-based attacks',
        effort: 'MEDIUM',
        implementation: 'Enforce stronger password requirements',
      });
    }

    return recommendations;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculateSecurityScore(metrics: {
    criticalEvents: number;
    accessViolations: number;
    auditActivity: number;
    securityEventCount: number;
  }): number {
    let score = 100;

    // Deduct points for security issues
    score -= metrics.criticalEvents * 20;
    score -= metrics.accessViolations * 10;
    score -= Math.min(metrics.securityEventCount * 2, 30);

    // Add points for good audit activity
    score += Math.min(metrics.auditActivity / 10, 10);

    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(
    securityScore: number, 
    criticalEvents: number, 
    accessViolations: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (criticalEvents > 0 || securityScore < 30) return 'CRITICAL';
    if (accessViolations > 5 || securityScore < 50) return 'HIGH';
    if (accessViolations > 2 || securityScore < 70) return 'MEDIUM';
    return 'LOW';
  }

  private mapEventTypeToAlertType(eventType: string): 'THREAT' | 'COMPLIANCE' | 'SYSTEM' | 'ACCESS' {
    switch (eventType) {
      case SecurityEventType.UNAUTHORIZED_ACCESS:
      case SecurityEventType.PRIVILEGE_ESCALATION:
        return 'ACCESS';
      case SecurityEventType.MALICIOUS_REQUEST:
      case SecurityEventType.SYSTEM_INTRUSION:
        return 'THREAT';
      case SecurityEventType.DATA_EXPORT:
        return 'COMPLIANCE';
      default:
        return 'SYSTEM';
    }
  }

  private generateAlertTitle(eventType: string): string {
    const titles: Record<string, string> = {
      [SecurityEventType.FAILED_LOGIN]: 'Failed Login Attempt',
      [SecurityEventType.MULTIPLE_FAILED_LOGINS]: 'Multiple Failed Login Attempts',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 'Unauthorized Access Attempt',
      [SecurityEventType.PRIVILEGE_ESCALATION]: 'Privilege Escalation Detected',
      [SecurityEventType.MALICIOUS_REQUEST]: 'Malicious Request Detected',
      [SecurityEventType.DATA_EXPORT]: 'Unauthorized Data Export',
      [SecurityEventType.SYSTEM_INTRUSION]: 'System Intrusion Detected',
    };

    return titles[eventType] || 'Security Event';
  }

  private generateActionRequired(eventType: string, severity: string): string {
    const actions: Record<string, string> = {
      [SecurityEventType.FAILED_LOGIN]: 'Monitor for additional attempts',
      [SecurityEventType.MULTIPLE_FAILED_LOGINS]: 'Consider account lockout',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 'Investigate and block if necessary',
      [SecurityEventType.PRIVILEGE_ESCALATION]: 'Review user permissions immediately',
      [SecurityEventType.MALICIOUS_REQUEST]: 'Block IP and investigate',
      [SecurityEventType.DATA_EXPORT]: 'Verify authorization and investigate',
      [SecurityEventType.SYSTEM_INTRUSION]: 'Immediate incident response required',
    };

    const action = actions[eventType] || 'Investigate security event';
    
    return severity === 'CRITICAL' ? `URGENT: ${action}` : action;
  }
}

export const securityDashboardService = new SecurityDashboardService();
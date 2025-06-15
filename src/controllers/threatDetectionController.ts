import { Request, Response } from 'express';
import { z } from 'zod';
import { threatDetectionService } from '../services/threatDetectionService';
import { AuthenticatedRequest } from '../types/api';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const behaviorAnalysisSchema = z.object({
  userId: z.string(),
  activity: z.object({
    sessionDuration: z.number().optional(),
    timestamp: z.string().optional(),
    ipAddress: z.string().optional(),
    resources: z.array(z.string()).optional(),
    deviceFingerprint: z.string().optional(),
    dataVolume: z.number().optional(),
    isAdminAction: z.boolean().optional(),
    failedAttempts: z.number().optional(),
    privilegeEscalation: z.boolean().optional(),
  }),
});

const patternDetectionSchema = z.object({
  timeWindowHours: z.number().min(1).max(168).default(24), // 1 hour to 1 week
});

const configUpdateSchema = z.object({
  enableBehavioralAnalysis: z.boolean().optional(),
  enableAnomalyDetection: z.boolean().optional(),
  enablePatternRecognition: z.boolean().optional(),
  sensitivityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM']).optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
  learningWindowDays: z.number().min(1).max(90).optional(),
});

// ============================================================================
// BEHAVIORAL ANALYSIS
// ============================================================================

export const analyzeBehavior = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, activity } = behaviorAnalysisSchema.parse(req.body);
    
    const threatScore = await threatDetectionService.analyzeBehavior(
      userId,
      req.tenant!.id,
      activity
    );

    // Update user behavior profile with this activity
    await threatDetectionService.updateUserBehaviorProfile(
      userId,
      req.tenant!.id,
      activity
    );

    res.json({
      success: true,
      data: {
        userId,
        threatScore,
        riskLevel: threatScore.overall > 0.8 ? 'HIGH' : 
                  threatScore.overall > 0.6 ? 'MEDIUM' : 
                  threatScore.overall > 0.3 ? 'LOW' : 'MINIMAL',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getUserBehaviorProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const profile = await threatDetectionService.getUserBehaviorProfile(
      userId,
      req.tenant!.id
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User behavior profile not found',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// PATTERN DETECTION
// ============================================================================

export const detectSecurityPatterns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeWindowHours } = patternDetectionSchema.parse(req.query);
    
    const patterns = await threatDetectionService.detectSecurityPatterns(
      req.tenant!.id,
      timeWindowHours
    );

    res.json({
      success: true,
      data: {
        patterns,
        timeWindow: `${timeWindowHours} hours`,
        detectedAt: new Date(),
        summary: {
          totalPatterns: patterns.length,
          criticalPatterns: patterns.filter(p => p.severity === 'CRITICAL').length,
          highPatterns: patterns.filter(p => p.severity === 'HIGH').length,
          mediumPatterns: patterns.filter(p => p.severity === 'MEDIUM').length,
          patternTypes: [...new Set(patterns.map(p => p.type))],
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// THREAT PREDICTION
// ============================================================================

export const predictThreats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const predictions = await threatDetectionService.predictThreats(req.tenant!.id);

    res.json({
      success: true,
      data: {
        predictions,
        generatedAt: new Date(),
        summary: {
          totalPredictions: predictions.length,
          highProbability: predictions.filter(p => p.probability > 0.7).length,
          mediumProbability: predictions.filter(p => p.probability > 0.4 && p.probability <= 0.7).length,
          lowProbability: predictions.filter(p => p.probability <= 0.4).length,
          threatTypes: [...new Set(predictions.map(p => p.threatType))],
          avgConfidence: predictions.length > 0 
            ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
            : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

export const analyzeSecurityEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysis = await threatDetectionService.analyzeSecurityEvents(req.tenant!.id);

    res.json({
      success: true,
      data: {
        ...analysis,
        analysisTimestamp: new Date(),
        riskLevel: analysis.threatScore > 0.8 ? 'CRITICAL' :
                  analysis.threatScore > 0.6 ? 'HIGH' :
                  analysis.threatScore > 0.4 ? 'MEDIUM' : 'LOW',
        summary: {
          overallThreatScore: analysis.threatScore,
          totalPatterns: analysis.patterns.length,
          totalPredictions: analysis.predictions.length,
          totalAlerts: analysis.alerts.length,
          criticalAlerts: analysis.alerts.filter(a => a.severity === 'CRITICAL').length,
          highConfidenceAlerts: analysis.alerts.filter(a => a.confidence > 0.8).length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

export const getSecurityAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      severity, 
      resolved = 'false', 
      limit = '50',
      offset = '0' 
    } = req.query;

    const { prisma } = require('../lib/prisma');
    
    const whereCondition: any = {
      tenantId: req.tenant!.id,
      eventType: 'THREAT_DETECTED',
    };

    if (severity) {
      whereCondition.severity = severity;
    }

    if (resolved === 'false') {
      whereCondition.resolved = false;
    } else if (resolved === 'true') {
      whereCondition.resolved = true;
    }

    const alerts = await prisma.securityEvent.findMany({
      where: whereCondition,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const totalCount = await prisma.securityEvent.count({
      where: whereCondition,
    });

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount,
        },
        summary: {
          totalAlerts: totalCount,
          criticalAlerts: await prisma.securityEvent.count({
            where: { ...whereCondition, severity: 'CRITICAL' },
          }),
          highAlerts: await prisma.securityEvent.count({
            where: { ...whereCondition, severity: 'HIGH' },
          }),
          unresolvedAlerts: await prisma.securityEvent.count({
            where: { ...whereCondition, resolved: false },
          }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const resolveSecurityAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution, falsePositive = false } = req.body;

    const { prisma } = require('../lib/prisma');

    const updatedAlert = await prisma.securityEvent.update({
      where: {
        id: alertId,
        tenantId: req.tenant!.id,
      },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user!.id,
        resolution,
        metadata: {
          ...req.body.metadata,
          falsePositive,
          resolvedAt: new Date(),
          resolvedBy: req.user!.id,
        },
      },
    });

    // Log the resolution for audit purposes
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant!.id,
        userId: req.user!.id,
        action: 'SECURITY_ALERT_RESOLVED',
        entityType: 'SecurityEvent',
        entityId: alertId,
        details: {
          alertId,
          resolution,
          falsePositive,
        },
        timestamp: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        alert: updatedAlert,
        message: 'Security alert resolved successfully',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export const updateThreatDetectionConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = configUpdateSchema.parse(req.body);
    
    // In a real implementation, you'd store this configuration in the database
    // For now, we'll just return the updated configuration
    
    // Log configuration change
    const { prisma } = require('../lib/prisma');
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant!.id,
        userId: req.user!.id,
        action: 'THREAT_DETECTION_CONFIG_UPDATED',
        entityType: 'ThreatDetectionConfig',
        entityId: req.tenant!.id,
        details: config,
        timestamp: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        config,
        message: 'Threat detection configuration updated successfully',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getThreatDetectionConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real implementation, you'd retrieve this from the database
    // For now, return default configuration
    const defaultConfig = {
      enableBehavioralAnalysis: true,
      enableAnomalyDetection: true,
      enablePatternRecognition: true,
      sensitivityLevel: 'MEDIUM',
      alertThreshold: 0.7,
      learningWindowDays: 30,
    };

    res.json({
      success: true,
      data: {
        config: defaultConfig,
        retrievedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================================
// STATISTICS AND REPORTING
// ============================================================================

export const getThreatStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysPeriod = parseInt(days as string);
    const startDate = new Date(Date.now() - daysPeriod * 24 * 60 * 60 * 1000);

    const { prisma } = require('../lib/prisma');

    // Get security events for the period
    const events = await prisma.securityEvent.findMany({
      where: {
        tenantId: req.tenant!.id,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate statistics
    const totalEvents = events.length;
    const threatEvents = events.filter(e => e.eventType === 'THREAT_DETECTED');
    const resolvedThreats = threatEvents.filter(e => e.resolved);
    const criticalThreats = threatEvents.filter(e => e.severity === 'CRITICAL');
    const highThreats = threatEvents.filter(e => e.severity === 'HIGH');

    // Group by event type
    const eventsByType = events.reduce((acc: any, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    // Group by day for trends
    const eventsByDay = events.reduce((acc: any, event) => {
      const day = event.timestamp.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period: {
          days: daysPeriod,
          startDate,
          endDate: new Date(),
        },
        summary: {
          totalEvents,
          threatEvents: threatEvents.length,
          resolvedThreats: resolvedThreats.length,
          pendingThreats: threatEvents.length - resolvedThreats.length,
          resolutionRate: threatEvents.length > 0 ? (resolvedThreats.length / threatEvents.length) * 100 : 0,
        },
        severity: {
          critical: criticalThreats.length,
          high: highThreats.length,
          medium: threatEvents.filter(e => e.severity === 'MEDIUM').length,
          low: threatEvents.filter(e => e.severity === 'LOW').length,
        },
        trends: {
          eventsByType,
          eventsByDay,
        },
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
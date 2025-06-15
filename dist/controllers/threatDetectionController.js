"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThreatStatistics = exports.getThreatDetectionConfig = exports.updateThreatDetectionConfig = exports.resolveSecurityAlert = exports.getSecurityAlerts = exports.analyzeSecurityEvents = exports.predictThreats = exports.detectSecurityPatterns = exports.getUserBehaviorProfile = exports.analyzeBehavior = void 0;
const zod_1 = require("zod");
const threatDetectionService_1 = require("../services/threatDetectionService");
const behaviorAnalysisSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    activity: zod_1.z.object({
        sessionDuration: zod_1.z.number().optional(),
        timestamp: zod_1.z.string().optional(),
        ipAddress: zod_1.z.string().optional(),
        resources: zod_1.z.array(zod_1.z.string()).optional(),
        deviceFingerprint: zod_1.z.string().optional(),
        dataVolume: zod_1.z.number().optional(),
        isAdminAction: zod_1.z.boolean().optional(),
        failedAttempts: zod_1.z.number().optional(),
        privilegeEscalation: zod_1.z.boolean().optional(),
    }),
});
const patternDetectionSchema = zod_1.z.object({
    timeWindowHours: zod_1.z.number().min(1).max(168).default(24),
});
const configUpdateSchema = zod_1.z.object({
    enableBehavioralAnalysis: zod_1.z.boolean().optional(),
    enableAnomalyDetection: zod_1.z.boolean().optional(),
    enablePatternRecognition: zod_1.z.boolean().optional(),
    sensitivityLevel: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM']).optional(),
    alertThreshold: zod_1.z.number().min(0).max(1).optional(),
    learningWindowDays: zod_1.z.number().min(1).max(90).optional(),
});
const analyzeBehavior = async (req, res) => {
    try {
        const { userId, activity } = behaviorAnalysisSchema.parse(req.body);
        const threatScore = await threatDetectionService_1.threatDetectionService.analyzeBehavior(userId, req.tenant.id, activity);
        await threatDetectionService_1.threatDetectionService.updateUserBehaviorProfile(userId, req.tenant.id, activity);
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
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.analyzeBehavior = analyzeBehavior;
const getUserBehaviorProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await threatDetectionService_1.threatDetectionService.getUserBehaviorProfile(userId, req.tenant.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getUserBehaviorProfile = getUserBehaviorProfile;
const detectSecurityPatterns = async (req, res) => {
    try {
        const { timeWindowHours } = patternDetectionSchema.parse(req.query);
        const patterns = await threatDetectionService_1.threatDetectionService.detectSecurityPatterns(req.tenant.id, timeWindowHours);
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
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.detectSecurityPatterns = detectSecurityPatterns;
const predictThreats = async (req, res) => {
    try {
        const predictions = await threatDetectionService_1.threatDetectionService.predictThreats(req.tenant.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.predictThreats = predictThreats;
const analyzeSecurityEvents = async (req, res) => {
    try {
        const analysis = await threatDetectionService_1.threatDetectionService.analyzeSecurityEvents(req.tenant.id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.analyzeSecurityEvents = analyzeSecurityEvents;
const getSecurityAlerts = async (req, res) => {
    try {
        const { severity, resolved = 'false', limit = '50', offset = '0' } = req.query;
        const { prisma } = require('../lib/prisma');
        const whereCondition = {
            tenantId: req.tenant.id,
            eventType: 'THREAT_DETECTED',
        };
        if (severity) {
            whereCondition.severity = severity;
        }
        if (resolved === 'false') {
            whereCondition.resolved = false;
        }
        else if (resolved === 'true') {
            whereCondition.resolved = true;
        }
        const alerts = await prisma.securityEvent.findMany({
            where: whereCondition,
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
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
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < totalCount,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getSecurityAlerts = getSecurityAlerts;
const resolveSecurityAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const { resolution, falsePositive = false } = req.body;
        const { prisma } = require('../lib/prisma');
        const updatedAlert = await prisma.securityEvent.update({
            where: {
                id: alertId,
                tenantId: req.tenant.id,
            },
            data: {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: req.user.id,
                resolution,
                metadata: {
                    ...req.body.metadata,
                    falsePositive,
                    resolvedAt: new Date(),
                    resolvedBy: req.user.id,
                },
            },
        });
        await prisma.auditLog.create({
            data: {
                tenantId: req.tenant.id,
                userId: req.user.id,
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.resolveSecurityAlert = resolveSecurityAlert;
const updateThreatDetectionConfig = async (req, res) => {
    try {
        const config = configUpdateSchema.parse(req.body);
        const { prisma } = require('../lib/prisma');
        await prisma.auditLog.create({
            data: {
                tenantId: req.tenant.id,
                userId: req.user.id,
                action: 'THREAT_DETECTION_CONFIG_UPDATED',
                entityType: 'ThreatDetectionConfig',
                entityId: req.tenant.id,
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
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updateThreatDetectionConfig = updateThreatDetectionConfig;
const getThreatDetectionConfig = async (req, res) => {
    try {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getThreatDetectionConfig = getThreatDetectionConfig;
const getThreatStatistics = async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const daysPeriod = parseInt(days);
        const startDate = new Date(Date.now() - daysPeriod * 24 * 60 * 60 * 1000);
        const { prisma } = require('../lib/prisma');
        const events = await prisma.securityEvent.findMany({
            where: {
                tenantId: req.tenant.id,
                timestamp: { gte: startDate },
            },
            orderBy: { timestamp: 'desc' },
        });
        const totalEvents = events.length;
        const threatEvents = events.filter(e => e.eventType === 'THREAT_DETECTED');
        const resolvedThreats = threatEvents.filter(e => e.resolved);
        const criticalThreats = threatEvents.filter(e => e.severity === 'CRITICAL');
        const highThreats = threatEvents.filter(e => e.severity === 'HIGH');
        const eventsByType = events.reduce((acc, event) => {
            acc[event.eventType] = (acc[event.eventType] || 0) + 1;
            return acc;
        }, {});
        const eventsByDay = events.reduce((acc, event) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getThreatStatistics = getThreatStatistics;
//# sourceMappingURL=threatDetectionController.js.map
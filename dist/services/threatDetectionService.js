"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threatDetectionService = exports.ThreatDetectionService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
class ThreatDetectionService {
    config;
    userProfiles = new Map();
    securityPatterns = new Map();
    constructor(config = {}) {
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
    async analyzeBehavior(userId, tenantId, currentActivity) {
        const profile = await this.getUserBehaviorProfile(userId, tenantId);
        if (!profile || profile.trainingSamples < 10) {
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
        scores.overall = (scores.behavioral * 0.3 +
            scores.temporal * 0.2 +
            scores.geographical * 0.2 +
            scores.volumetric * 0.15 +
            scores.contextual * 0.15);
        return scores;
    }
    async calculateBehavioralScore(profile, activity) {
        let anomalyPoints = 0;
        let totalChecks = 0;
        if (activity.sessionDuration) {
            const deviation = Math.abs(activity.sessionDuration - profile.baselineMetrics.avgSessionDuration);
            const normalizedDeviation = deviation / profile.baselineMetrics.avgSessionDuration;
            if (normalizedDeviation > 0.5)
                anomalyPoints += normalizedDeviation;
            totalChecks++;
        }
        if (activity.ipAddress && !profile.baselineMetrics.commonIpAddresses.includes(activity.ipAddress)) {
            anomalyPoints += 0.3;
            totalChecks++;
        }
        if (activity.resources && Array.isArray(activity.resources)) {
            const unknownResources = activity.resources.filter((resource) => !profile.baselineMetrics.frequentlyAccessedResources.includes(resource));
            if (unknownResources.length > 0) {
                anomalyPoints += (unknownResources.length / activity.resources.length) * 0.4;
            }
            totalChecks++;
        }
        if (activity.deviceFingerprint && !profile.baselineMetrics.typicalDeviceFingerprints.includes(activity.deviceFingerprint)) {
            anomalyPoints += 0.4;
            totalChecks++;
        }
        return totalChecks > 0 ? Math.min(anomalyPoints / totalChecks, 1.0) : 0;
    }
    async calculateTemporalScore(profile, activity) {
        if (!activity.timestamp)
            return 0;
        const currentHour = new Date(activity.timestamp).getHours();
        const typicalHours = profile.baselineMetrics.typicalLoginTimes;
        if (typicalHours.length === 0)
            return 0;
        const isTypicalTime = typicalHours.some(hour => Math.abs(hour - currentHour) <= 2);
        return isTypicalTime ? 0.1 : 0.8;
    }
    async calculateGeographicalScore(profile, activity) {
        if (!activity.ipAddress)
            return 0;
        const ipPrefix = activity.ipAddress.split('.').slice(0, 2).join('.');
        const knownPrefixes = profile.baselineMetrics.commonIpAddresses.map(ip => ip.split('.').slice(0, 2).join('.'));
        return knownPrefixes.includes(ipPrefix) ? 0.1 : 0.6;
    }
    async calculateVolumetricScore(profile, activity) {
        if (!activity.dataVolume)
            return 0;
        const { min, max } = profile.baselineMetrics.normalDataVolumeRange;
        if (activity.dataVolume >= min && activity.dataVolume <= max) {
            return 0.1;
        }
        const deviation = activity.dataVolume > max
            ? (activity.dataVolume - max) / max
            : (min - activity.dataVolume) / min;
        return Math.min(deviation, 1.0);
    }
    async calculateContextualScore(profile, activity) {
        let contextualRisk = 0;
        if (activity.isAdminAction && activity.timestamp) {
            const hour = new Date(activity.timestamp).getHours();
            if (hour < 6 || hour > 22) {
                contextualRisk += 0.5;
            }
        }
        if (activity.failedAttempts && activity.failedAttempts > 3) {
            contextualRisk += Math.min(activity.failedAttempts / 10, 0.6);
        }
        if (activity.privilegeEscalation) {
            contextualRisk += 0.7;
        }
        return Math.min(contextualRisk, 1.0);
    }
    async detectSecurityPatterns(tenantId, timeWindowHours = 24) {
        const startTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
        const events = await prisma_1.prisma.securityEvent.findMany({
            where: {
                tenantId,
                timestamp: { gte: startTime },
            },
            orderBy: { timestamp: 'desc' },
        });
        const patterns = [];
        patterns.push(...await this.detectBruteForcePatterns(events, tenantId));
        patterns.push(...await this.detectPrivilegeEscalationPatterns(events, tenantId));
        patterns.push(...await this.detectDataExfiltrationPatterns(events, tenantId));
        patterns.push(...await this.detectAccessViolationPatterns(events, tenantId));
        return patterns;
    }
    async detectBruteForcePatterns(events, tenantId) {
        const patterns = [];
        const groupedByIp = new Map();
        const groupedByUser = new Map();
        events.forEach(event => {
            if (event.eventType === 'LOGIN_FAILED') {
                const ip = event.metadata?.ipAddress;
                const userId = event.userId;
                if (ip) {
                    if (!groupedByIp.has(ip))
                        groupedByIp.set(ip, []);
                    groupedByIp.get(ip).push(event);
                }
                if (userId) {
                    if (!groupedByUser.has(userId))
                        groupedByUser.set(userId, []);
                    groupedByUser.get(userId).push(event);
                }
            }
        });
        for (const [ip, ipEvents] of groupedByIp) {
            if (ipEvents.length >= 10) {
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
        for (const [userId, userEvents] of groupedByUser) {
            if (userEvents.length >= 5) {
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
    async detectPrivilegeEscalationPatterns(events, tenantId) {
        const escalationEvents = events.filter(event => event.eventType === 'PRIVILEGE_ESCALATION' ||
            event.eventType === 'ADMIN_ACCESS' ||
            event.eventType === 'ROLE_CHANGE');
        if (escalationEvents.length < 2)
            return [];
        const userEscalations = new Map();
        escalationEvents.forEach(event => {
            if (event.userId) {
                if (!userEscalations.has(event.userId))
                    userEscalations.set(event.userId, []);
                userEscalations.get(event.userId).push(event);
            }
        });
        const patterns = [];
        for (const [userId, userEvents] of userEscalations) {
            if (userEvents.length >= 2) {
                const timeSpread = Math.max(...userEvents.map(e => e.timestamp.getTime())) -
                    Math.min(...userEvents.map(e => e.timestamp.getTime()));
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
    async detectDataExfiltrationPatterns(events, tenantId) {
        const dataEvents = events.filter(event => event.eventType === 'DATA_EXPORT' ||
            event.eventType === 'FILE_DOWNLOAD' ||
            event.eventType === 'BULK_ACCESS');
        if (dataEvents.length < 5)
            return [];
        const patterns = [];
        const userDataAccess = new Map();
        dataEvents.forEach(event => {
            if (event.userId) {
                if (!userDataAccess.has(event.userId))
                    userDataAccess.set(event.userId, []);
                userDataAccess.get(event.userId).push(event);
            }
        });
        for (const [userId, userEvents] of userDataAccess) {
            if (userEvents.length >= 5) {
                const totalVolume = userEvents.reduce((sum, event) => sum + (event.metadata?.dataVolume || 0), 0);
                if (totalVolume > 1000000) {
                    patterns.push({
                        id: `data_exfiltration_${userId}_${Date.now()}`,
                        type: 'DATA_EXFILTRATION',
                        confidence: Math.min(totalVolume / 10000000, 1.0),
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
    async detectAccessViolationPatterns(events, tenantId) {
        const violationEvents = events.filter(event => event.eventType === 'ACCESS_DENIED' ||
            event.eventType === 'UNAUTHORIZED_ACCESS');
        if (violationEvents.length < 3)
            return [];
        const patterns = [];
        const resourceViolations = new Map();
        violationEvents.forEach(event => {
            const resource = event.metadata?.resource || 'unknown';
            if (!resourceViolations.has(resource))
                resourceViolations.set(resource, []);
            resourceViolations.get(resource).push(event);
        });
        for (const [resource, resourceEvents] of resourceViolations) {
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
    async predictThreats(tenantId) {
        const predictions = [];
        const historicalEvents = await prisma_1.prisma.securityEvent.findMany({
            where: {
                tenantId,
                timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { timestamp: 'desc' },
        });
        predictions.push(...await this.predictBruteForceAttacks(historicalEvents, tenantId));
        predictions.push(...await this.predictDataBreaches(historicalEvents, tenantId));
        predictions.push(...await this.predictInsiderThreats(historicalEvents, tenantId));
        return predictions.sort((a, b) => b.probability - a.probability);
    }
    async predictBruteForceAttacks(events, tenantId) {
        const loginFailures = events.filter(e => e.eventType === 'LOGIN_FAILED');
        if (loginFailures.length < 10)
            return [];
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
    async predictDataBreaches(events, tenantId) {
        const dataEvents = events.filter(e => e.eventType === 'DATA_ACCESS' ||
            e.eventType === 'DATA_EXPORT' ||
            e.eventType === 'UNAUTHORIZED_ACCESS');
        if (dataEvents.length < 5)
            return [];
        const volumeByUser = new Map();
        const accessByUser = new Map();
        dataEvents.forEach(event => {
            const userId = event.userId || 'unknown';
            const volume = event.metadata?.dataVolume || 0;
            volumeByUser.set(userId, (volumeByUser.get(userId) || 0) + volume);
            accessByUser.set(userId, (accessByUser.get(userId) || 0) + 1);
        });
        const suspiciousUsers = Array.from(volumeByUser.entries())
            .filter(([_, volume]) => volume > 50000000)
            .map(([userId, volume]) => ({ userId, volume, accesses: accessByUser.get(userId) || 0 }));
        if (suspiciousUsers.length > 0) {
            const topUser = suspiciousUsers[0];
            return [{
                    threatType: 'DATA_BREACH',
                    probability: Math.min(topUser.volume / 500000000, 0.85),
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
    async predictInsiderThreats(events, tenantId) {
        const userActivity = new Map();
        events.forEach(event => {
            if (event.userId) {
                if (!userActivity.has(event.userId))
                    userActivity.set(event.userId, []);
                userActivity.get(event.userId).push(event);
            }
        });
        const suspiciousUsers = [];
        for (const [userId, userEvents] of userActivity) {
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
    calculateInsiderThreatScore(userEvents) {
        let score = 0;
        const offHoursEvents = userEvents.filter(e => {
            const hour = e.timestamp.getHours();
            return hour < 6 || hour > 22;
        });
        score += (offHoursEvents.length / userEvents.length) * 0.3;
        const failedAccess = userEvents.filter(e => e.eventType === 'ACCESS_DENIED' || e.eventType === 'UNAUTHORIZED_ACCESS').length;
        score += Math.min(failedAccess / 10, 0.4);
        const dataExports = userEvents.filter(e => e.eventType === 'DATA_EXPORT').length;
        score += Math.min(dataExports / 5, 0.3);
        return Math.min(score, 1.0);
    }
    async updateUserBehaviorProfile(userId, tenantId, activity) {
        const existingProfile = await this.getUserBehaviorProfile(userId, tenantId);
        if (!existingProfile) {
            const newProfile = {
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
        }
        else {
            this.updateBaselineMetrics(existingProfile, activity);
            existingProfile.lastUpdated = new Date();
            existingProfile.trainingSamples++;
        }
    }
    updateBaselineMetrics(profile, activity) {
        const metrics = profile.baselineMetrics;
        if (activity.sessionDuration) {
            metrics.avgSessionDuration = (metrics.avgSessionDuration + activity.sessionDuration) / 2;
        }
        if (activity.timestamp) {
            const hour = new Date(activity.timestamp).getHours();
            if (!metrics.typicalLoginTimes.includes(hour)) {
                metrics.typicalLoginTimes.push(hour);
                if (metrics.typicalLoginTimes.length > 8) {
                    metrics.typicalLoginTimes = metrics.typicalLoginTimes.slice(-8);
                }
            }
        }
        if (activity.ipAddress && !metrics.commonIpAddresses.includes(activity.ipAddress)) {
            metrics.commonIpAddresses.push(activity.ipAddress);
            if (metrics.commonIpAddresses.length > 10) {
                metrics.commonIpAddresses = metrics.commonIpAddresses.slice(-10);
            }
        }
        if (activity.dataVolume) {
            metrics.normalDataVolumeRange.min = Math.min(metrics.normalDataVolumeRange.min, activity.dataVolume);
            metrics.normalDataVolumeRange.max = Math.max(metrics.normalDataVolumeRange.max, activity.dataVolume);
        }
        if (activity.deviceFingerprint && !metrics.typicalDeviceFingerprints.includes(activity.deviceFingerprint)) {
            metrics.typicalDeviceFingerprints.push(activity.deviceFingerprint);
            if (metrics.typicalDeviceFingerprints.length > 5) {
                metrics.typicalDeviceFingerprints = metrics.typicalDeviceFingerprints.slice(-5);
            }
        }
    }
    async getUserBehaviorProfile(userId, tenantId) {
        const key = `${userId}_${tenantId}`;
        if (this.userProfiles.has(key)) {
            return this.userProfiles.get(key);
        }
        return null;
    }
    async generateSecurityAlert(type, severity, title, description, tenantId, metadata = {}, userId) {
        const alert = {
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
        try {
            await prisma_1.prisma.securityEvent.create({
                data: {
                    id: alert.id,
                    tenantId,
                    userId,
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
        }
        catch (error) {
            logger_1.logger.error('Failed to store security alert', { alert }, error);
        }
        return alert;
    }
    async analyzeSecurityEvents(tenantId) {
        try {
            const patterns = await this.detectSecurityPatterns(tenantId, 24);
            const predictions = await this.predictThreats(tenantId);
            const threatScore = this.calculateOverallThreatScore(patterns, predictions);
            const alerts = [];
            for (const pattern of patterns) {
                if (pattern.confidence > this.config.alertThreshold) {
                    alerts.push(await this.generateSecurityAlert('PATTERN_MATCH', pattern.severity, `Security Pattern Detected: ${pattern.type}`, pattern.description, tenantId, {
                        pattern: pattern.type,
                        confidence: pattern.confidence,
                        indicators: pattern.indicators,
                    }));
                }
            }
            for (const prediction of predictions) {
                if (prediction.probability > this.config.alertThreshold) {
                    alerts.push(await this.generateSecurityAlert('ML_PREDICTION', prediction.probability > 0.8 ? 'HIGH' : 'MEDIUM', `Threat Prediction: ${prediction.threatType}`, `Predicted ${prediction.threatType} with ${Math.round(prediction.probability * 100)}% probability`, tenantId, {
                        threatType: prediction.threatType,
                        probability: prediction.probability,
                        timeframe: prediction.timeframe,
                        riskFactors: prediction.riskFactors,
                    }));
                }
            }
            return {
                threatScore,
                patterns,
                predictions,
                alerts,
            };
        }
        catch (error) {
            logger_1.logger.error('Security analysis failed', { tenantId }, error);
            throw error;
        }
    }
    calculateOverallThreatScore(patterns, predictions) {
        let score = 0;
        if (patterns.length > 0) {
            const avgPatternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
            score += avgPatternConfidence * 0.4;
        }
        if (predictions.length > 0) {
            const maxPredictionProbability = Math.max(...predictions.map(p => p.probability));
            score += maxPredictionProbability * 0.6;
        }
        return Math.min(score, 1.0);
    }
}
exports.ThreatDetectionService = ThreatDetectionService;
exports.threatDetectionService = new ThreatDetectionService({
    enableBehavioralAnalysis: true,
    enableAnomalyDetection: true,
    enablePatternRecognition: true,
    sensitivityLevel: 'MEDIUM',
    alertThreshold: 0.7,
    learningWindowDays: 30,
});
//# sourceMappingURL=threatDetectionService.js.map
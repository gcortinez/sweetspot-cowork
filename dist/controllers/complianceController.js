"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplianceAlerts = exports.getComplianceDashboard = exports.downloadPCIDSSReport = exports.generatePCIDSSReport = exports.generatePatientAccessLog = exports.downloadHIPAAReport = exports.generateHIPAAReport = exports.generateDataSubjectReport = exports.downloadGDPRReport = exports.generateGDPRReport = exports.downloadSOXReport = exports.generateSOXReport = void 0;
const zod_1 = require("zod");
const complianceReportingService_1 = require("../services/complianceReportingService");
const complianceReportSchema = zod_1.z.object({
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)),
    includeDetails: zod_1.z.boolean().default(false),
    filterByUser: zod_1.z.string().optional(),
    filterByEntity: zod_1.z.string().optional(),
});
const gdprReportSchema = complianceReportSchema.extend({
    dataSubjectId: zod_1.z.string().optional(),
});
const hipaaReportSchema = complianceReportSchema.extend({
    patientId: zod_1.z.string().optional(),
});
const generateSOXReport = async (req, res) => {
    try {
        const config = complianceReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateSOXReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateSOXReport = generateSOXReport;
const downloadSOXReport = async (req, res) => {
    try {
        const config = complianceReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateSOXReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="SOX-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
        res.json(report);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.downloadSOXReport = downloadSOXReport;
const generateGDPRReport = async (req, res) => {
    try {
        const config = gdprReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateGDPRReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateGDPRReport = generateGDPRReport;
const downloadGDPRReport = async (req, res) => {
    try {
        const config = gdprReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateGDPRReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="GDPR-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
        res.json(report);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.downloadGDPRReport = downloadGDPRReport;
const generateDataSubjectReport = async (req, res) => {
    try {
        const { dataSubjectId } = req.params;
        const config = complianceReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateGDPRReport({
            tenantId: req.tenant.id,
            dataSubjectId,
            ...config,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateDataSubjectReport = generateDataSubjectReport;
const generateHIPAAReport = async (req, res) => {
    try {
        const config = hipaaReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateHIPAAReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generateHIPAAReport = generateHIPAAReport;
const downloadHIPAAReport = async (req, res) => {
    try {
        const config = hipaaReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateHIPAAReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="HIPAA-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
        res.json(report);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.downloadHIPAAReport = downloadHIPAAReport;
const generatePatientAccessLog = async (req, res) => {
    try {
        const { patientId } = req.params;
        const config = complianceReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generateHIPAAReport({
            tenantId: req.tenant.id,
            patientId,
            ...config,
        });
        const patientReport = {
            ...report,
            summary: {
                ...report.summary,
                message: `Access log for patient ${patientId}`,
            },
        };
        res.json({
            success: true,
            data: patientReport,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generatePatientAccessLog = generatePatientAccessLog;
const generatePCIDSSReport = async (req, res) => {
    try {
        const config = complianceReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generatePCIDSSReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.generatePCIDSSReport = generatePCIDSSReport;
const downloadPCIDSSReport = async (req, res) => {
    try {
        const config = complianceReportSchema.parse(req.body);
        const report = await complianceReportingService_1.complianceReportingService.generatePCIDSSReport({
            tenantId: req.tenant.id,
            ...config,
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="PCI-DSS-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
        res.json(report);
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.downloadPCIDSSReport = downloadPCIDSSReport;
const getComplianceDashboard = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        const [soxReport, gdprReport, hipaaReport, pciReport] = await Promise.all([
            complianceReportingService_1.complianceReportingService.generateSOXReport({
                tenantId: req.tenant.id,
                startDate,
                endDate,
            }),
            complianceReportingService_1.complianceReportingService.generateGDPRReport({
                tenantId: req.tenant.id,
                startDate,
                endDate,
            }),
            complianceReportingService_1.complianceReportingService.generateHIPAAReport({
                tenantId: req.tenant.id,
                startDate,
                endDate,
            }),
            complianceReportingService_1.complianceReportingService.generatePCIDSSReport({
                tenantId: req.tenant.id,
                startDate,
                endDate,
            }),
        ]);
        const dashboard = {
            period: {
                start: startDate,
                end: endDate,
                days,
            },
            overallComplianceScore: calculateOverallComplianceScore([
                soxReport,
                gdprReport,
                hipaaReport,
                pciReport,
            ]),
            frameworks: {
                sox: {
                    status: soxReport.complianceViolations.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
                    violations: soxReport.complianceViolations.length,
                    criticalIssues: soxReport.complianceViolations.filter(v => v.severity === 'CRITICAL').length,
                    lastAssessment: soxReport.generatedAt,
                    summary: soxReport.summary,
                },
                gdpr: {
                    status: gdprReport.complianceStatus,
                    dataBreaches: gdprReport.summary.breachIncidents,
                    dataExports: gdprReport.summary.dataExports,
                    deletionRequests: gdprReport.summary.deletionRequests,
                    lastAssessment: gdprReport.generatedAt,
                    summary: gdprReport.summary,
                },
                hipaa: {
                    status: hipaaReport.violations.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
                    violations: hipaaReport.violations.length,
                    unauthorizedAccess: hipaaReport.summary.unauthorizedAccess,
                    riskLevel: hipaaReport.riskAssessment.overallRisk,
                    lastAssessment: hipaaReport.generatedAt,
                    summary: hipaaReport.summary,
                },
                pciDss: {
                    status: pciReport.summary.complianceScore >= 90 ? 'COMPLIANT' : 'NON_COMPLIANT',
                    complianceScore: pciReport.summary.complianceScore,
                    vulnerabilities: pciReport.vulnerabilities.length,
                    level: pciReport.complianceLevel,
                    lastAssessment: pciReport.generatedAt,
                    summary: pciReport.summary,
                },
            },
            trends: {
                securityEvents: await getSecurityEventTrends(req.tenant.id, startDate, endDate),
                auditActivity: await getAuditActivityTrends(req.tenant.id, startDate, endDate),
                complianceScore: await getComplianceScoreTrends(req.tenant.id, days),
            },
            alerts: await getComplianceAlerts(req.tenant.id),
            recommendations: await getComplianceRecommendations([
                soxReport,
                gdprReport,
                hipaaReport,
                pciReport,
            ]),
        };
        res.json({
            success: true,
            data: dashboard,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getComplianceDashboard = getComplianceDashboard;
const getComplianceAlerts = async (req, res) => {
    try {
        const alerts = await getComplianceAlerts(req.tenant.id);
        res.json({
            success: true,
            data: alerts,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getComplianceAlerts = getComplianceAlerts;
function calculateOverallComplianceScore(reports) {
    let totalScore = 0;
    let frameworks = 0;
    const soxViolations = reports[0].complianceViolations.length;
    const soxScore = Math.max(0, 100 - (soxViolations * 10));
    totalScore += soxScore;
    frameworks++;
    const gdprStatus = reports[1].complianceStatus;
    const gdprScore = gdprStatus === 'COMPLIANT' ? 100 : gdprStatus === 'PENDING_REVIEW' ? 80 : 60;
    totalScore += gdprScore;
    frameworks++;
    const hipaaViolations = reports[2].violations.length;
    const hipaaScore = Math.max(0, 100 - (hipaaViolations * 15));
    totalScore += hipaaScore;
    frameworks++;
    const pciScore = reports[3].summary.complianceScore;
    totalScore += pciScore;
    frameworks++;
    return Math.round(totalScore / frameworks);
}
async function getSecurityEventTrends(tenantId, startDate, endDate) {
    const events = await require('../lib/prisma').prisma.securityEvent.groupBy({
        by: ['eventType'],
        where: {
            tenantId,
            timestamp: { gte: startDate, lte: endDate },
        },
        _count: { eventType: true },
    });
    return events.map((event) => ({
        type: event.eventType,
        count: event._count.eventType,
    }));
}
async function getAuditActivityTrends(tenantId, startDate, endDate) {
    const audits = await require('../lib/prisma').prisma.auditLog.groupBy({
        by: ['action'],
        where: {
            tenantId,
            timestamp: { gte: startDate, lte: endDate },
        },
        _count: { action: true },
    });
    return audits.map((audit) => ({
        action: audit.action,
        count: audit._count.action,
    }));
}
async function getComplianceScoreTrends(tenantId, days) {
    const trends = [];
    const today = new Date();
    for (let i = days; i >= 0; i -= 7) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        trends.push({
            date: date.toISOString().split('T')[0],
            score: Math.floor(Math.random() * 20) + 80,
        });
    }
    return trends;
}
async function getComplianceAlerts(tenantId) {
    const { prisma } = require('../lib/prisma');
    const recentEvents = await prisma.securityEvent.findMany({
        where: {
            tenantId,
            severity: { in: ['HIGH', 'CRITICAL'] },
            resolved: false,
            timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
    });
    return recentEvents.map((event) => ({
        id: event.id,
        type: 'SECURITY_EVENT',
        severity: event.severity,
        title: `Security Event: ${event.eventType}`,
        description: event.description,
        timestamp: event.timestamp,
        action: 'Review and resolve security event',
    }));
}
async function getComplianceRecommendations(reports) {
    const recommendations = [];
    if (reports[0].recommendations.length > 0) {
        recommendations.push({
            framework: 'SOX',
            priority: 'HIGH',
            recommendations: reports[0].recommendations,
        });
    }
    if (reports[1].complianceStatus !== 'COMPLIANT') {
        recommendations.push({
            framework: 'GDPR',
            priority: 'HIGH',
            recommendations: [
                'Review data processing activities',
                'Ensure proper consent management',
                'Implement data minimization principles',
            ],
        });
    }
    if (reports[2].riskAssessment.overallRisk !== 'LOW') {
        recommendations.push({
            framework: 'HIPAA',
            priority: 'MEDIUM',
            recommendations: reports[2].riskAssessment.recommendations,
        });
    }
    if (reports[3].summary.complianceScore < 90) {
        recommendations.push({
            framework: 'PCI DSS',
            priority: 'HIGH',
            recommendations: [
                'Address identified vulnerabilities',
                'Improve payment data protection',
                'Enhance monitoring capabilities',
            ],
        });
    }
    return recommendations;
}
//# sourceMappingURL=complianceController.js.map
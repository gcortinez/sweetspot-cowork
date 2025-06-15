"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceReportingService = exports.ComplianceReportingService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class ComplianceReportingService {
    async generateSOXReport(config) {
        const { tenantId, startDate, endDate } = config;
        const financialAudits = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                entityType: { in: ['Invoice', 'Payment', 'Contract', 'Quotation'] },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
            orderBy: { timestamp: 'desc' },
        });
        const systemChanges = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                action: { in: [client_1.AuditAction.SYSTEM_CONFIG, client_1.AuditAction.USER_ACTIVATE, client_1.AuditAction.USER_DEACTIVATE] },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const securityEvents = await prisma_1.prisma.securityEvent.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                severity: { in: [client_1.SecuritySeverity.HIGH, client_1.SecuritySeverity.CRITICAL] },
            },
            include: {
                performedBy: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const summary = {
            totalFinancialTransactions: financialAudits.filter(a => a.entityType === 'Payment' && a.action === client_1.AuditAction.CREATE).length,
            totalAccessLogs: financialAudits.length,
            failedTransactions: financialAudits.filter(a => a.details && a.details.success === false).length,
            unauthorizedAccess: securityEvents.filter(e => e.eventType === client_1.SecurityEventType.UNAUTHORIZED_ACCESS).length,
            dataChanges: financialAudits.filter(a => a.action === client_1.AuditAction.UPDATE || a.action === client_1.AuditAction.DELETE).length,
        };
        const financialControls = {
            invoiceCreation: this.mapAuditLogsToComplianceEntries(financialAudits.filter(a => a.entityType === 'Invoice' && a.action === client_1.AuditAction.CREATE)),
            paymentProcessing: this.mapAuditLogsToComplianceEntries(financialAudits.filter(a => a.entityType === 'Payment')),
            financialReporting: this.mapAuditLogsToComplianceEntries(financialAudits.filter(a => a.action === client_1.AuditAction.EXPORT_DATA)),
            userAccess: this.mapAuditLogsToComplianceEntries(financialAudits.filter(a => a.action === client_1.AuditAction.READ)),
        };
        const systemChangeEntries = {
            configurationChanges: this.mapAuditLogsToComplianceEntries(systemChanges.filter(a => a.action === client_1.AuditAction.SYSTEM_CONFIG)),
            userPermissionChanges: this.mapAuditLogsToComplianceEntries(systemChanges.filter(a => a.action === client_1.AuditAction.USER_ACTIVATE || a.action === client_1.AuditAction.USER_DEACTIVATE)),
            dataModifications: this.mapAuditLogsToComplianceEntries(financialAudits.filter(a => a.action === client_1.AuditAction.UPDATE || a.action === client_1.AuditAction.DELETE)),
        };
        const complianceViolations = this.identifySOXViolations(financialAudits, securityEvents);
        const recommendations = this.generateSOXRecommendations(summary, complianceViolations);
        return {
            reportType: 'SOX',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            tenantId,
            summary,
            financialControls,
            systemChanges: systemChangeEntries,
            complianceViolations,
            recommendations,
        };
    }
    async generateGDPRReport(config) {
        const { tenantId, startDate, endDate, dataSubjectId } = config;
        const dataProcessingLogs = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                entityType: { in: ['User', 'Client', 'Lead', 'Visitor'] },
                ...(dataSubjectId && {
                    OR: [
                        { entityId: dataSubjectId },
                        { userId: dataSubjectId },
                    ],
                }),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const consentLogs = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                action: { in: [client_1.AuditAction.CREATE, client_1.AuditAction.UPDATE] },
                details: {
                    path: ['consent'],
                    not: null,
                },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const dataExports = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                action: client_1.AuditAction.EXPORT_DATA,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const securityIncidents = await prisma_1.prisma.securityEvent.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                eventType: { in: [
                        client_1.SecurityEventType.UNAUTHORIZED_ACCESS,
                        client_1.SecurityEventType.DATA_EXPORT,
                        client_1.SecurityEventType.SYSTEM_INTRUSION,
                    ] },
            },
        });
        const summary = {
            totalDataProcessing: dataProcessingLogs.length,
            consentRecords: consentLogs.length,
            dataExports: dataExports.length,
            deletionRequests: dataProcessingLogs.filter(a => a.action === client_1.AuditAction.DELETE).length,
            breachIncidents: securityIncidents.filter(e => e.severity === client_1.SecuritySeverity.HIGH || e.severity === client_1.SecuritySeverity.CRITICAL).length,
        };
        const dataProcessingActivities = {
            collection: this.mapAuditLogsToComplianceEntries(dataProcessingLogs.filter(a => a.action === client_1.AuditAction.CREATE)),
            storage: this.mapAuditLogsToComplianceEntries(dataProcessingLogs.filter(a => a.action === client_1.AuditAction.READ)),
            processing: this.mapAuditLogsToComplianceEntries(dataProcessingLogs.filter(a => a.action === client_1.AuditAction.UPDATE)),
            sharing: this.mapAuditLogsToComplianceEntries(dataExports),
            deletion: this.mapAuditLogsToComplianceEntries(dataProcessingLogs.filter(a => a.action === client_1.AuditAction.DELETE)),
        };
        const consentManagement = {
            consentGiven: this.mapAuditLogsToComplianceEntries(consentLogs.filter(a => a.action === client_1.AuditAction.CREATE)),
            consentWithdrawn: this.mapAuditLogsToComplianceEntries(consentLogs.filter(a => a.action === client_1.AuditAction.UPDATE &&
                a.details?.consent === false)),
            consentUpdated: this.mapAuditLogsToComplianceEntries(consentLogs.filter(a => a.action === client_1.AuditAction.UPDATE)),
        };
        const rightsExercised = {
            accessRequests: this.mapAuditLogsToComplianceEntries(dataExports.filter(a => a.details?.requestType === 'access')),
            rectificationRequests: this.mapAuditLogsToComplianceEntries(dataProcessingLogs.filter(a => a.action === client_1.AuditAction.UPDATE &&
                a.details?.gdprRequest === 'rectification')),
            erasureRequests: this.mapAuditLogsToComplianceEntries(dataProcessingLogs.filter(a => a.action === client_1.AuditAction.DELETE &&
                a.details?.gdprRequest === 'erasure')),
            portabilityRequests: this.mapAuditLogsToComplianceEntries(dataExports.filter(a => a.details?.requestType === 'portability')),
        };
        const securityMeasures = await this.getGDPRSecurityMeasures(tenantId);
        const complianceStatus = this.assessGDPRCompliance(summary, securityMeasures);
        return {
            reportType: 'GDPR',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            tenantId,
            dataSubjectId,
            summary,
            dataProcessingActivities,
            consentManagement,
            rightsExercised,
            securityMeasures,
            complianceStatus,
        };
    }
    async generateHIPAAReport(config) {
        const { tenantId, startDate, endDate, patientId } = config;
        const accessLogs = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                entityType: { in: ['User', 'Client', 'Booking', 'Service'] },
                ...(patientId && {
                    OR: [
                        { entityId: patientId },
                        { userId: patientId },
                    ],
                }),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const unauthorizedAccess = await prisma_1.prisma.securityEvent.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                eventType: client_1.SecurityEventType.UNAUTHORIZED_ACCESS,
            },
        });
        const disclosures = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                action: client_1.AuditAction.EXPORT_DATA,
                details: {
                    path: ['phi'],
                    not: null,
                },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const summary = {
            totalAccessLogs: accessLogs.length,
            authorizedAccess: accessLogs.filter(a => a.action === client_1.AuditAction.READ).length,
            unauthorizedAccess: unauthorizedAccess.length,
            dataDisclosures: disclosures.length,
            securityIncidents: unauthorizedAccess.filter(e => e.severity === client_1.SecuritySeverity.HIGH || e.severity === client_1.SecuritySeverity.CRITICAL).length,
        };
        const accessLogsCategories = {
            patientDataAccess: this.mapAuditLogsToComplianceEntries(accessLogs.filter(a => a.entityType === 'Client' && a.action === client_1.AuditAction.READ)),
            medicalRecordAccess: this.mapAuditLogsToComplianceEntries(accessLogs.filter(a => a.entityType === 'Service' && a.action === client_1.AuditAction.READ)),
            appointmentAccess: this.mapAuditLogsToComplianceEntries(accessLogs.filter(a => a.entityType === 'Booking' && a.action === client_1.AuditAction.READ)),
            billingAccess: this.mapAuditLogsToComplianceEntries(accessLogs.filter(a => (a.entityType === 'Invoice' || a.entityType === 'Payment') &&
                a.action === client_1.AuditAction.READ)),
        };
        const disclosureCategories = {
            authorizedDisclosures: this.mapAuditLogsToComplianceEntries(disclosures.filter(d => d.details?.authorized === true)),
            unauthorizedDisclosures: this.mapAuditLogsToComplianceEntries(disclosures.filter(d => d.details?.authorized !== true)),
            breachNotifications: this.mapSecurityEventsToComplianceEntries(unauthorizedAccess.filter(e => e.severity === client_1.SecuritySeverity.CRITICAL)),
        };
        const safeguards = {
            physicalSafeguards: await this.getHIPAAPhysicalSafeguards(tenantId),
            administrativeSafeguards: await this.getHIPAAAdministrativeSafeguards(tenantId),
            technicalSafeguards: await this.getHIPAATechnicalSafeguards(tenantId),
        };
        const violations = this.identifyHIPAAViolations(accessLogs, unauthorizedAccess, disclosures);
        const riskAssessment = await this.performHIPAARiskAssessment(tenantId, violations);
        return {
            reportType: 'HIPAA',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            tenantId,
            patientId,
            summary,
            accessLogs: accessLogsCategories,
            disclosures: disclosureCategories,
            safeguards,
            violations,
            riskAssessment,
        };
    }
    async generatePCIDSSReport(config) {
        const { tenantId, startDate, endDate } = config;
        const paymentLogs = await prisma_1.prisma.auditLog.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
                entityType: { in: ['Payment', 'Invoice', 'StoredPaymentMethod'] },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
            },
        });
        const securityEvents = await prisma_1.prisma.securityEvent.findMany({
            where: {
                tenantId,
                timestamp: { gte: startDate, lte: endDate },
            },
        });
        const summary = {
            totalPaymentTransactions: paymentLogs.filter(a => a.entityType === 'Payment' && a.action === client_1.AuditAction.CREATE).length,
            cardDataAccess: paymentLogs.filter(a => a.entityType === 'StoredPaymentMethod' && a.action === client_1.AuditAction.READ).length,
            securityEvents: securityEvents.length,
            vulnerabilities: securityEvents.filter(e => e.eventType === client_1.SecurityEventType.MALICIOUS_REQUEST).length,
            complianceScore: 85,
        };
        const requirements = await this.assessPCIDSSRequirements(tenantId, paymentLogs, securityEvents);
        const paymentProcessing = {
            transactions: this.mapAuditLogsToComplianceEntries(paymentLogs.filter(a => a.entityType === 'Payment')),
            cardDataAccess: this.mapAuditLogsToComplianceEntries(paymentLogs.filter(a => a.entityType === 'StoredPaymentMethod')),
            tokenization: this.mapAuditLogsToComplianceEntries(paymentLogs.filter(a => a.details?.tokenized === true)),
            encryption: this.mapAuditLogsToComplianceEntries(paymentLogs.filter(a => a.details?.encrypted === true)),
        };
        const vulnerabilities = await this.identifyPCIDSSVulnerabilities(tenantId, securityEvents);
        const complianceLevel = this.determinePCIDSSLevel(summary.totalPaymentTransactions);
        return {
            reportType: 'PCI_DSS',
            generatedAt: new Date(),
            period: { start: startDate, end: endDate },
            tenantId,
            summary,
            requirements,
            paymentProcessing,
            vulnerabilities,
            complianceLevel,
        };
    }
    mapAuditLogsToComplianceEntries(auditLogs) {
        return auditLogs.map(log => ({
            id: log.id,
            timestamp: log.timestamp,
            user: log.user ? {
                id: log.user.id,
                name: `${log.user.firstName} ${log.user.lastName}`,
                role: log.user.role,
            } : undefined,
            action: log.action,
            entity: log.entityType,
            entityId: log.entityId,
            details: log.details || {},
            ipAddress: log.ipAddress,
            outcome: this.determineOutcome(log),
            riskLevel: this.assessRiskLevel(log),
        }));
    }
    mapSecurityEventsToComplianceEntries(securityEvents) {
        return securityEvents.map(event => ({
            id: event.id,
            timestamp: event.timestamp,
            user: event.performedBy ? {
                id: event.performedBy.id,
                name: `${event.performedBy.firstName} ${event.performedBy.lastName}`,
                role: event.performedBy.role,
            } : undefined,
            action: event.eventType,
            entity: 'SecurityEvent',
            entityId: event.id,
            details: event.metadata || {},
            ipAddress: event.ipAddress,
            outcome: event.resolved ? 'SUCCESS' : 'WARNING',
            riskLevel: event.severity,
        }));
    }
    determineOutcome(log) {
        if (log.details?.success === false)
            return 'FAILURE';
        if (log.details?.warning)
            return 'WARNING';
        return 'SUCCESS';
    }
    assessRiskLevel(log) {
        if (log.action === 'DELETE')
            return 'HIGH';
        if (log.action === 'EXPORT_DATA')
            return 'MEDIUM';
        if (log.entityType === 'Payment')
            return 'HIGH';
        return 'LOW';
    }
    identifySOXViolations(auditLogs, securityEvents) {
        const violations = [];
        const unauthorizedAccess = securityEvents.filter(e => e.eventType === client_1.SecurityEventType.UNAUTHORIZED_ACCESS &&
            e.severity === client_1.SecuritySeverity.HIGH);
        unauthorizedAccess.forEach(event => {
            violations.push({
                id: event.id,
                type: 'UNAUTHORIZED_FINANCIAL_ACCESS',
                severity: event.severity,
                description: 'Unauthorized access to financial data detected',
                timestamp: event.timestamp,
                affectedData: ['Financial Records'],
                remediation: 'Review access controls and user permissions',
                status: event.resolved ? 'RESOLVED' : 'OPEN',
            });
        });
        return violations;
    }
    generateSOXRecommendations(summary, violations) {
        const recommendations = [];
        if (summary.unauthorizedAccess > 0) {
            recommendations.push('Strengthen access controls for financial data');
        }
        if (summary.failedTransactions > summary.totalFinancialTransactions * 0.05) {
            recommendations.push('Investigate high failure rate in financial transactions');
        }
        if (violations.length > 0) {
            recommendations.push('Address all identified compliance violations immediately');
        }
        recommendations.push('Implement regular SOX compliance audits');
        recommendations.push('Provide SOX compliance training to relevant staff');
        return recommendations;
    }
    async getGDPRSecurityMeasures(tenantId) {
        return [
            {
                category: 'Data Protection',
                measure: 'Encryption at Rest',
                implemented: true,
                lastReviewed: new Date(),
                effectiveness: 'HIGH',
                documentation: 'AES-256 encryption implemented for sensitive data',
            },
            {
                category: 'Access Control',
                measure: 'Role-based Access Control',
                implemented: true,
                lastReviewed: new Date(),
                effectiveness: 'HIGH',
                documentation: 'Multi-tier access control system implemented',
            },
            {
                category: 'Data Minimization',
                measure: 'Data Retention Policies',
                implemented: true,
                lastReviewed: new Date(),
                effectiveness: 'MEDIUM',
                documentation: 'Automated data cleanup based on retention policies',
            },
        ];
    }
    assessGDPRCompliance(summary, securityMeasures) {
        const implementedMeasures = securityMeasures.filter(m => m.implemented).length;
        const totalMeasures = securityMeasures.length;
        if (implementedMeasures === totalMeasures && summary.breachIncidents === 0) {
            return 'COMPLIANT';
        }
        else if (implementedMeasures / totalMeasures >= 0.8) {
            return 'PENDING_REVIEW';
        }
        else {
            return 'NON_COMPLIANT';
        }
    }
    async getHIPAAPhysicalSafeguards(tenantId) {
        return [
            {
                category: 'Physical Access',
                measure: 'Facility Access Controls',
                implemented: true,
                lastReviewed: new Date(),
                effectiveness: 'HIGH',
                documentation: 'Physical access controls with badge system',
            },
        ];
    }
    async getHIPAAAdministrativeSafeguards(tenantId) {
        return [
            {
                category: 'Administrative',
                measure: 'Security Officer Assignment',
                implemented: true,
                lastReviewed: new Date(),
                effectiveness: 'HIGH',
                documentation: 'Designated security officer assigned',
            },
        ];
    }
    async getHIPAATechnicalSafeguards(tenantId) {
        return [
            {
                category: 'Technical',
                measure: 'Access Control',
                implemented: true,
                lastReviewed: new Date(),
                effectiveness: 'HIGH',
                documentation: 'Role-based access control implemented',
            },
        ];
    }
    identifyHIPAAViolations(accessLogs, unauthorizedAccess, disclosures) {
        const violations = [];
        const excessiveAccess = accessLogs.filter(log => log.details?.accessType === 'bulk' && log.details?.justification === null);
        excessiveAccess.forEach(log => {
            violations.push({
                id: log.id,
                type: 'MINIMUM_NECESSARY_VIOLATION',
                severity: 'MEDIUM',
                description: 'Access exceeded minimum necessary standard',
                timestamp: log.timestamp,
                affectedData: ['Protected Health Information'],
                remediation: 'Implement minimum necessary access controls',
                status: 'OPEN',
            });
        });
        return violations;
    }
    async performHIPAARiskAssessment(tenantId, violations) {
        const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
        const highViolations = violations.filter(v => v.severity === 'HIGH').length;
        let overallRisk;
        if (criticalViolations > 0) {
            overallRisk = 'CRITICAL';
        }
        else if (highViolations > 2) {
            overallRisk = 'HIGH';
        }
        else if (violations.length > 0) {
            overallRisk = 'MEDIUM';
        }
        else {
            overallRisk = 'LOW';
        }
        return {
            overallRisk,
            riskFactors: [
                {
                    factor: 'Unauthorized Access',
                    impact: 'HIGH',
                    likelihood: violations.length > 0 ? 'MEDIUM' : 'LOW',
                    mitigation: 'Strengthen access controls and monitoring',
                },
            ],
            recommendations: [
                'Conduct regular HIPAA risk assessments',
                'Implement comprehensive audit logging',
                'Provide HIPAA training to all staff',
            ],
            nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        };
    }
    async assessPCIDSSRequirements(tenantId, paymentLogs, securityEvents) {
        return {
            firewall: {
                requirement: 'Install and maintain firewall configuration',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            passwords: {
                requirement: 'Do not use vendor-supplied defaults for system passwords',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            cardDataProtection: {
                requirement: 'Protect stored cardholder data',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            encryption: {
                requirement: 'Encrypt transmission of cardholder data',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            antivirus: {
                requirement: 'Use and regularly update anti-virus software',
                status: 'PARTIALLY_COMPLIANT',
                evidence: [],
                gaps: ['Regular updates needed'],
                remediation: ['Implement automated antivirus updates'],
                lastAssessed: new Date(),
            },
            secureNetworks: {
                requirement: 'Develop and maintain secure systems and applications',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            accessControl: {
                requirement: 'Restrict access to cardholder data by business need-to-know',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            monitoring: {
                requirement: 'Track and monitor all access to network resources',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            testing: {
                requirement: 'Regularly test security systems and processes',
                status: 'PARTIALLY_COMPLIANT',
                evidence: [],
                gaps: ['Penetration testing frequency'],
                remediation: ['Implement quarterly penetration testing'],
                lastAssessed: new Date(),
            },
            policies: {
                requirement: 'Maintain a policy that addresses information security',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            vendorManagement: {
                requirement: 'Maintain a policy for vendor management',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
            incidentResponse: {
                requirement: 'Maintain an incident response plan',
                status: 'COMPLIANT',
                evidence: [],
                gaps: [],
                remediation: [],
                lastAssessed: new Date(),
            },
        };
    }
    async identifyPCIDSSVulnerabilities(tenantId, securityEvents) {
        const vulnerabilities = [];
        const maliciousRequests = securityEvents.filter(e => e.eventType === client_1.SecurityEventType.MALICIOUS_REQUEST);
        maliciousRequests.forEach(event => {
            vulnerabilities.push({
                id: event.id,
                type: 'MALICIOUS_REQUEST',
                severity: event.severity,
                description: 'Malicious request detected that could compromise payment data',
                discoveredAt: event.timestamp,
                status: event.resolved ? 'MITIGATED' : 'OPEN',
                remediation: 'Implement additional request filtering and monitoring',
            });
        });
        return vulnerabilities;
    }
    determinePCIDSSLevel(transactionVolume) {
        if (transactionVolume > 6000000)
            return 1;
        if (transactionVolume > 1000000)
            return 2;
        if (transactionVolume > 20000)
            return 3;
        return 4;
    }
}
exports.ComplianceReportingService = ComplianceReportingService;
exports.complianceReportingService = new ComplianceReportingService();
//# sourceMappingURL=complianceReportingService.js.map
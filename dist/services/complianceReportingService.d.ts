export interface ComplianceReportConfig {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    includeDetails?: boolean;
    filterByUser?: string;
    filterByEntity?: string;
}
export interface SOXReport {
    reportType: 'SOX';
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    tenantId: string;
    summary: {
        totalFinancialTransactions: number;
        totalAccessLogs: number;
        failedTransactions: number;
        unauthorizedAccess: number;
        dataChanges: number;
    };
    financialControls: {
        invoiceCreation: ComplianceEntry[];
        paymentProcessing: ComplianceEntry[];
        financialReporting: ComplianceEntry[];
        userAccess: ComplianceEntry[];
    };
    systemChanges: {
        configurationChanges: ComplianceEntry[];
        userPermissionChanges: ComplianceEntry[];
        dataModifications: ComplianceEntry[];
    };
    complianceViolations: ComplianceViolation[];
    recommendations: string[];
}
export interface GDPRReport {
    reportType: 'GDPR';
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    tenantId: string;
    dataSubjectId?: string;
    summary: {
        totalDataProcessing: number;
        consentRecords: number;
        dataExports: number;
        deletionRequests: number;
        breachIncidents: number;
    };
    dataProcessingActivities: {
        collection: ComplianceEntry[];
        storage: ComplianceEntry[];
        processing: ComplianceEntry[];
        sharing: ComplianceEntry[];
        deletion: ComplianceEntry[];
    };
    consentManagement: {
        consentGiven: ComplianceEntry[];
        consentWithdrawn: ComplianceEntry[];
        consentUpdated: ComplianceEntry[];
    };
    rightsExercised: {
        accessRequests: ComplianceEntry[];
        rectificationRequests: ComplianceEntry[];
        erasureRequests: ComplianceEntry[];
        portabilityRequests: ComplianceEntry[];
    };
    securityMeasures: SecurityMeasure[];
    complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_REVIEW';
}
export interface HIPAAReport {
    reportType: 'HIPAA';
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    tenantId: string;
    patientId?: string;
    summary: {
        totalAccessLogs: number;
        authorizedAccess: number;
        unauthorizedAccess: number;
        dataDisclosures: number;
        securityIncidents: number;
    };
    accessLogs: {
        patientDataAccess: ComplianceEntry[];
        medicalRecordAccess: ComplianceEntry[];
        appointmentAccess: ComplianceEntry[];
        billingAccess: ComplianceEntry[];
    };
    disclosures: {
        authorizedDisclosures: ComplianceEntry[];
        unauthorizedDisclosures: ComplianceEntry[];
        breachNotifications: ComplianceEntry[];
    };
    safeguards: {
        physicalSafeguards: SecurityMeasure[];
        administrativeSafeguards: SecurityMeasure[];
        technicalSafeguards: SecurityMeasure[];
    };
    violations: ComplianceViolation[];
    riskAssessment: RiskAssessment;
}
export interface PCIDSSReport {
    reportType: 'PCI_DSS';
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    tenantId: string;
    summary: {
        totalPaymentTransactions: number;
        cardDataAccess: number;
        securityEvents: number;
        vulnerabilities: number;
        complianceScore: number;
    };
    requirements: {
        firewall: ComplianceRequirement;
        passwords: ComplianceRequirement;
        cardDataProtection: ComplianceRequirement;
        encryption: ComplianceRequirement;
        antivirus: ComplianceRequirement;
        secureNetworks: ComplianceRequirement;
        accessControl: ComplianceRequirement;
        monitoring: ComplianceRequirement;
        testing: ComplianceRequirement;
        policies: ComplianceRequirement;
        vendorManagement: ComplianceRequirement;
        incidentResponse: ComplianceRequirement;
    };
    paymentProcessing: {
        transactions: ComplianceEntry[];
        cardDataAccess: ComplianceEntry[];
        tokenization: ComplianceEntry[];
        encryption: ComplianceEntry[];
    };
    vulnerabilities: SecurityVulnerability[];
    complianceLevel: 1 | 2 | 3 | 4;
}
export interface ComplianceEntry {
    id: string;
    timestamp: Date;
    user?: {
        id: string;
        name: string;
        role: string;
    };
    action: string;
    entity?: string;
    entityId?: string;
    details: Record<string, any>;
    ipAddress?: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface ComplianceViolation {
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    timestamp: Date;
    affectedData: string[];
    remediation: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}
export interface SecurityMeasure {
    category: string;
    measure: string;
    implemented: boolean;
    lastReviewed: Date;
    effectiveness: 'HIGH' | 'MEDIUM' | 'LOW';
    documentation: string;
}
export interface ComplianceRequirement {
    requirement: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT';
    evidence: ComplianceEntry[];
    gaps: string[];
    remediation: string[];
    lastAssessed: Date;
}
export interface SecurityVulnerability {
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    discoveredAt: Date;
    status: 'OPEN' | 'PATCHED' | 'MITIGATED';
    cve?: string;
    remediation: string;
}
export interface RiskAssessment {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskFactors: Array<{
        factor: string;
        impact: 'LOW' | 'MEDIUM' | 'HIGH';
        likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
        mitigation: string;
    }>;
    recommendations: string[];
    nextReviewDate: Date;
}
export declare class ComplianceReportingService {
    generateSOXReport(config: ComplianceReportConfig): Promise<SOXReport>;
    generateGDPRReport(config: ComplianceReportConfig & {
        dataSubjectId?: string;
    }): Promise<GDPRReport>;
    generateHIPAAReport(config: ComplianceReportConfig & {
        patientId?: string;
    }): Promise<HIPAAReport>;
    generatePCIDSSReport(config: ComplianceReportConfig): Promise<PCIDSSReport>;
    private mapAuditLogsToComplianceEntries;
    private mapSecurityEventsToComplianceEntries;
    private determineOutcome;
    private assessRiskLevel;
    private identifySOXViolations;
    private generateSOXRecommendations;
    private getGDPRSecurityMeasures;
    private assessGDPRCompliance;
    private getHIPAAPhysicalSafeguards;
    private getHIPAAAdministrativeSafeguards;
    private getHIPAATechnicalSafeguards;
    private identifyHIPAAViolations;
    private performHIPAARiskAssessment;
    private assessPCIDSSRequirements;
    private identifyPCIDSSVulnerabilities;
    private determinePCIDSSLevel;
}
export declare const complianceReportingService: ComplianceReportingService;
//# sourceMappingURL=complianceReportingService.d.ts.map
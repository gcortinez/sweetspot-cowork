import { Response } from 'express';
import { z } from 'zod';
import { complianceReportingService } from '../services/complianceReportingService';
import { dataAnonymizationService } from '../services/dataAnonymizationService';
import { consentManagementService, ConsentType, ConsentSource, LegalBasis } from '../services/consentManagementService';
import { dataExportService, ExportFormat, ExportRequestType } from '../services/dataExportService';
import { dataRetentionService, RetentionAction } from '../services/dataRetentionService';
import { BaseRequest, AuthenticatedRequest, ErrorCode } from '../types/api';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const complianceReportSchema = z.object({
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  includeDetails: z.boolean().default(false),
  filterByUser: z.string().optional(),
  filterByEntity: z.string().optional(),
});

const gdprReportSchema = complianceReportSchema.extend({
  dataSubjectId: z.string().optional(),
});

const hipaaReportSchema = complianceReportSchema.extend({
  patientId: z.string().optional(),
});

// New GDPR/CCPA compliance schemas
const anonymizeUserSchema = z.object({
  userId: z.string(),
  reason: z.string().optional().default('GDPR_REQUEST')
});

const consentRequestSchema = z.object({
  userId: z.string(),
  consentType: z.nativeEnum(ConsentType),
  purpose: z.string(),
  isGranted: z.boolean(),
  version: z.string(),
  source: z.nativeEnum(ConsentSource),
  legalBasis: z.nativeEnum(LegalBasis),
  expiryDays: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

const withdrawConsentSchema = z.object({
  userId: z.string(),
  consentType: z.nativeEnum(ConsentType),
  reason: z.string().optional()
});

const exportRequestSchema = z.object({
  userId: z.string(),
  requestType: z.nativeEnum(ExportRequestType),
  format: z.nativeEnum(ExportFormat).optional().default(ExportFormat.JSON),
  includeRelatedData: z.boolean().optional().default(true)
});

const retentionPolicySchema = z.object({
  name: z.string(),
  description: z.string(),
  entityType: z.string(),
  retentionPeriodDays: z.number().min(1),
  action: z.nativeEnum(RetentionAction),
  legalBasis: z.string(),
  criteria: z.object({
    field: z.string(),
    operation: z.enum(['older_than', 'equals', 'not_accessed_since']),
    value: z.union([z.string(), z.number(), z.date()]),
    additionalConditions: z.record(z.any()).optional()
  }),
  exceptions: z.array(z.string()).optional().default([])
});

// ============================================================================
// SOX COMPLIANCE REPORTING
// ============================================================================

export const generateSOXReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = complianceReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateSOXReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const downloadSOXReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = complianceReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateSOXReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="SOX-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
    
    res.json(report);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

// ============================================================================
// GDPR COMPLIANCE REPORTING
// ============================================================================

export const generateGDPRReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = gdprReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateGDPRReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const downloadGDPRReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = gdprReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateGDPRReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="GDPR-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
    
    res.json(report);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const generateDataSubjectReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataSubjectId } = req.params;
    const config = complianceReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateGDPRReport({
      tenantId: req.tenant!.id,
      dataSubjectId,
      ...config,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

// ============================================================================
// HIPAA COMPLIANCE REPORTING
// ============================================================================

export const generateHIPAAReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = hipaaReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateHIPAAReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const downloadHIPAAReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = hipaaReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateHIPAAReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="HIPAA-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
    
    res.json(report);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const generatePatientAccessLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const config = complianceReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generateHIPAAReport({
      tenantId: req.tenant!.id,
      patientId,
      ...config,
    });

    // Filter to only show access logs for this specific patient
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
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

// ============================================================================
// PCI DSS COMPLIANCE REPORTING
// ============================================================================

export const generatePCIDSSReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = complianceReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generatePCIDSSReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const downloadPCIDSSReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = complianceReportSchema.parse(req.body);
    
    const report = await complianceReportingService.generatePCIDSSReport({
      tenantId: req.tenant!.id,
      ...config,
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="PCI-DSS-Report-${config.startDate.toISOString().split('T')[0]}-to-${config.endDate.toISOString().split('T')[0]}.json"`);
    
    res.json(report);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

// ============================================================================
// GDPR/CCPA DATA PROTECTION ENDPOINTS
// ============================================================================

/**
 * Data Anonymization Endpoints
 */

export const anonymizeUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, reason } = anonymizeUserSchema.parse(req.body);
    
    const result = await dataAnonymizationService.anonymizeUser(
      req.tenant!.id,
      userId,
      req.user!.id,
      reason
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          anonymizedFields: result.anonymizedFields,
          message: 'User data anonymized successfully'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: ErrorCode.INTERNAL_ERROR,
        details: result.errors
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to anonymize user data'
    });
  }
};

export const getAnonymizationReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await dataAnonymizationService.generateAnonymizationReport(req.tenant!.id);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate anonymization report'
    });
  }
};

/**
 * Consent Management Endpoints
 */

export const recordConsent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const consentData = consentRequestSchema.parse(req.body);
    
    const result = await consentManagementService.recordConsent({
      ...consentData,
      tenantId: req.tenant!.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          consentId: result.consentId,
          message: 'Consent recorded successfully'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record consent'
    });
  }
};

export const withdrawConsent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, consentType, reason } = withdrawConsentSchema.parse(req.body);
    
    const result = await consentManagementService.withdrawConsent(
      userId,
      req.tenant!.id,
      consentType,
      reason,
      req.ip
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Consent withdrawn successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to withdraw consent'
    });
  }
};

export const getUserConsentStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const consentStatus = await consentManagementService.getUserConsentStatus(
      userId,
      req.tenant!.id
    );

    res.json({
      success: true,
      data: consentStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get consent status'
    });
  }
};

/**
 * Data Export Endpoints
 */

export const createDataExportRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, requestType, format, includeRelatedData } = exportRequestSchema.parse(req.body);
    
    const result = await dataExportService.createExportRequest(
      userId,
      req.tenant!.id,
      req.user!.id,
      requestType,
      format,
      includeRelatedData
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          exportId: result.exportId,
          estimatedCompletionTime: result.estimatedCompletionTime,
          message: 'Export request created successfully'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create export request'
    });
  }
};

export const getExportStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exportId } = req.params;
    
    const status = await dataExportService.getExportStatus(exportId);

    if (status) {
      res.json({
        success: true,
        data: status
      });
    } else {
      res.status(404).json({
        success: false,
        error: ErrorCode.RESOURCE_NOT_FOUND
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get export status'
    });
  }
};

export const downloadExport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exportId } = req.params;
    
    const result = await dataExportService.downloadExport(exportId, req.user!.id);

    if (result.success && result.filePath) {
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
      res.sendFile(result.filePath);
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download export'
    });
  }
};

/**
 * Data Retention Endpoints
 */

export const createRetentionPolicy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const policyData = retentionPolicySchema.parse(req.body);
    
    const result = await dataRetentionService.createRetentionPolicy(
      req.tenant!.id,
      policyData.name,
      policyData.description,
      policyData.entityType,
      policyData.retentionPeriodDays,
      policyData.action,
      policyData.legalBasis,
      policyData.criteria,
      req.user!.id,
      policyData.exceptions
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          policyId: result.policyId,
          message: 'Retention policy created successfully'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create retention policy'
    });
  }
};

export const executeRetentionPolicies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const executions = await dataRetentionService.executeRetentionPolicies(
      req.tenant!.id,
      req.user!.id
    );

    res.json({
      success: true,
      data: {
        executions,
        message: 'Retention policies executed successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute retention policies'
    });
  }
};

export const getRetentionReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await dataRetentionService.generateRetentionReport(req.tenant!.id);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate retention report'
    });
  }
};

export const createDefaultRetentionPolicies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await dataRetentionService.createDefaultRetentionPolicies(
      req.tenant!.id,
      req.user!.id
    );

    res.json({
      success: result.success,
      data: {
        policiesCreated: result.policiesCreated,
        errors: result.errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create default retention policies'
    });
  }
};

// ============================================================================
// COMPLIANCE DASHBOARD
// ============================================================================

export const getComplianceDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Generate all compliance reports for the dashboard
    const [soxReport, gdprReport, hipaaReport, pciReport, anonymizationReport, consentReport, retentionReport] = await Promise.all([
      complianceReportingService.generateSOXReport({
        tenantId: req.tenant!.id,
        startDate,
        endDate,
      }),
      complianceReportingService.generateGDPRReport({
        tenantId: req.tenant!.id,
        startDate,
        endDate,
      }),
      complianceReportingService.generateHIPAAReport({
        tenantId: req.tenant!.id,
        startDate,
        endDate,
      }),
      complianceReportingService.generatePCIDSSReport({
        tenantId: req.tenant!.id,
        startDate,
        endDate,
      }),
      dataAnonymizationService.generateAnonymizationReport(req.tenant!.id),
      consentManagementService.generateConsentComplianceReport(req.tenant!.id),
      dataRetentionService.generateRetentionReport(req.tenant!.id)
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
      ], anonymizationReport, consentReport, retentionReport),
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
      dataProtection: {
        anonymization: {
          totalUsers: anonymizationReport.totalUsers,
          anonymizedUsers: anonymizationReport.anonymizedUsers,
          pseudonymizedRecords: anonymizationReport.pseudonymizedRecords,
          retentionCompliance: anonymizationReport.retentionCompliance,
          anonymizationRate: anonymizationReport.totalUsers > 0 
            ? (anonymizationReport.anonymizedUsers / anonymizationReport.totalUsers * 100) 
            : 0
        },
        consent: {
          totalUsers: consentReport.totalUsers,
          usersWithValidConsents: consentReport.usersWithValidConsents,
          complianceScore: consentReport.complianceScore,
          expiredConsents: consentReport.expiredConsents,
          withdrawnConsents: consentReport.withdrawnConsents,
          consentsByType: consentReport.consentsByType
        },
        retention: {
          activePolicies: retentionReport.activePolicies,
          totalRecordsReviewed: retentionReport.totalRecordsReviewed,
          recordsDeleted: retentionReport.recordsDeleted,
          recordsAnonymized: retentionReport.recordsAnonymized,
          recordsArchived: retentionReport.recordsArchived,
          complianceScore: retentionReport.complianceScore,
          upcomingActions: retentionReport.upcomingActions,
          violations: retentionReport.violations
        }
      },
      trends: {
        securityEvents: await getSecurityEventTrends(req.tenant!.id, startDate, endDate),
        auditActivity: await getAuditActivityTrends(req.tenant!.id, startDate, endDate),
        complianceScore: await getComplianceScoreTrends(req.tenant!.id, days),
      },
      alerts: await fetchComplianceAlerts(req.tenant!.id),
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

export const getComplianceAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await fetchComplianceAlerts(req.tenant!.id);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : ErrorCode.INTERNAL_ERROR,
    });
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateOverallComplianceScore(
  reports: any[], 
  anonymizationReport: any, 
  consentReport: any, 
  retentionReport: any
): number {
  let totalScore = 0;
  let frameworks = 0;

  // SOX Score
  const soxViolations = reports[0].complianceViolations.length;
  const soxScore = Math.max(0, 100 - (soxViolations * 10));
  totalScore += soxScore;
  frameworks++;

  // GDPR Score (enhanced with data protection metrics)
  const gdprStatus = reports[1].complianceStatus;
  let gdprScore = gdprStatus === 'COMPLIANT' ? 100 : gdprStatus === 'PENDING_REVIEW' ? 80 : 60;
  
  // Adjust GDPR score based on data protection compliance
  const dataProtectionScore = (
    (anonymizationReport.retentionCompliance ? 100 : 70) +
    consentReport.complianceScore +
    retentionReport.complianceScore
  ) / 3;
  
  gdprScore = Math.round((gdprScore + dataProtectionScore) / 2);
  totalScore += gdprScore;
  frameworks++;

  // HIPAA Score
  const hipaaViolations = reports[2].violations.length;
  const hipaaScore = Math.max(0, 100 - (hipaaViolations * 15));
  totalScore += hipaaScore;
  frameworks++;

  // PCI DSS Score
  const pciScore = reports[3].summary.complianceScore;
  totalScore += pciScore;
  frameworks++;

  // Data Protection Score (separate framework)
  totalScore += dataProtectionScore;
  frameworks++;

  return Math.round(totalScore / frameworks);
}

async function getSecurityEventTrends(tenantId: string, startDate: Date, endDate: Date) {
  const events = await require('../lib/prisma').prisma.securityEvent.groupBy({
    by: ['eventType'],
    where: {
      tenantId,
      timestamp: { gte: startDate, lte: endDate },
    },
    _count: { eventType: true },
  });

  return events.map((event: any) => ({
    type: event.eventType,
    count: event._count.eventType,
  }));
}

async function getAuditActivityTrends(tenantId: string, startDate: Date, endDate: Date) {
  const audits = await require('../lib/prisma').prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      tenantId,
      timestamp: { gte: startDate, lte: endDate },
    },
    _count: { action: true },
  });

  return audits.map((audit: any) => ({
    action: audit.action,
    count: audit._count.action,
  }));
}

async function getComplianceScoreTrends(tenantId: string, days: number) {
  // This would typically be stored in a time series database
  // For now, return mock data that would represent historical compliance scores
  const trends = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i -= 7) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      score: Math.floor(Math.random() * 20) + 80, // Mock score between 80-100
    });
  }
  
  return trends;
}

async function fetchComplianceAlerts(tenantId: string) {
  const { prisma } = require('../lib/prisma');
  
  // Get recent high-severity security events
  const recentEvents = await prisma.securityEvent.findMany({
    where: {
      tenantId,
      severity: { in: ['HIGH', 'CRITICAL'] },
      resolved: false,
      timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  return recentEvents.map((event: any) => ({
    id: event.id,
    type: 'SECURITY_EVENT',
    severity: event.severity,
    title: `Security Event: ${event.eventType}`,
    description: event.description,
    timestamp: event.timestamp,
    action: 'Review and resolve security event',
  }));
}

async function getComplianceRecommendations(reports: any[]) {
  const recommendations = [];

  // SOX Recommendations
  if (reports[0].recommendations.length > 0) {
    recommendations.push({
      framework: 'SOX',
      priority: 'HIGH',
      recommendations: reports[0].recommendations,
    });
  }

  // GDPR Recommendations
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

  // HIPAA Recommendations
  if (reports[2].riskAssessment.overallRisk !== 'LOW') {
    recommendations.push({
      framework: 'HIPAA',
      priority: 'MEDIUM',
      recommendations: reports[2].riskAssessment.recommendations,
    });
  }

  // PCI DSS Recommendations
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
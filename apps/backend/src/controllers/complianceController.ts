import { Response } from 'express';
import { z } from 'zod';
import { complianceReportingService } from '../services/complianceReportingService';
import { dataExportService, ExportFormat, ExportRequestType } from '../services/dataExportService';
import { AuthenticatedRequest, ErrorCode } from '../types/api';

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

const hipaaReportSchema = complianceReportSchema.extend({
  patientId: z.string().optional(),
});

const exportRequestSchema = z.object({
  userId: z.string(),
  requestType: z.nativeEnum(ExportRequestType),
  format: z.nativeEnum(ExportFormat).optional().default(ExportFormat.JSON),
  includeRelatedData: z.boolean().optional().default(true)
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
    const [soxReport, hipaaReport, pciReport] = await Promise.all([
      complianceReportingService.generateSOXReport({
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
      })
    ]);

    const dashboard = {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      overallComplianceScore: calculateOverallComplianceScore([
        soxReport,
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
        securityEvents: await getSecurityEventTrends(req.tenant!.id, startDate, endDate),
        auditActivity: await getAuditActivityTrends(req.tenant!.id, startDate, endDate),
        complianceScore: await getComplianceScoreTrends(req.tenant!.id, days),
      },
      alerts: await fetchComplianceAlerts(req.tenant!.id),
      recommendations: await getComplianceRecommendations([
        soxReport,
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

function calculateOverallComplianceScore(reports: any[]): number {
  let totalScore = 0;
  let frameworks = 0;

  // SOX Score
  const soxViolations = reports[0].complianceViolations.length;
  const soxScore = Math.max(0, 100 - (soxViolations * 10));
  totalScore += soxScore;
  frameworks++;

  // HIPAA Score
  const hipaaViolations = reports[1].violations.length;
  const hipaaScore = Math.max(0, 100 - (hipaaViolations * 15));
  totalScore += hipaaScore;
  frameworks++;

  // PCI DSS Score
  const pciScore = reports[2].summary.complianceScore;
  totalScore += pciScore;
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


  // HIPAA Recommendations
  if (reports[1].riskAssessment.overallRisk !== 'LOW') {
    recommendations.push({
      framework: 'HIPAA',
      priority: 'MEDIUM',
      recommendations: reports[1].riskAssessment.recommendations,
    });
  }

  // PCI DSS Recommendations
  if (reports[2].summary.complianceScore < 90) {
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
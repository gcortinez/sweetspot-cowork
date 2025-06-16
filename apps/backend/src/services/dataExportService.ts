import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { auditLogService } from './auditLogService';

// TODO: DataExportRequest model and related enums need to be added to Prisma schema for GDPR compliance
// This service is currently disabled until schema is updated

/**
 * Data Export Service
 * Handles GDPR/CCPA compliance for user data export requests
 */

export interface DataExportRequest {
  id: string;
  userId: string;
  tenantId: string;
  requestedBy: string;
  requestType: ExportRequestType;
  format: ExportFormat;
  includeRelatedData: boolean;
  status: ExportStatus;
  requestDate: Date;
  completedDate?: Date;
  downloadUrl?: string;
  downloadExpiry?: Date;
  metadata?: Record<string, any>;
}

export enum ExportRequestType {
  GDPR_SUBJECT_ACCESS = 'GDPR_SUBJECT_ACCESS',
  CCPA_DATA_REQUEST = 'CCPA_DATA_REQUEST',
  ADMIN_EXPORT = 'ADMIN_EXPORT',
  BACKUP_EXPORT = 'BACKUP_EXPORT',
  ANALYTICS_EXPORT = 'ANALYTICS_EXPORT'
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  XML = 'XML',
  PDF = 'PDF',
  ZIP = 'ZIP'
}

export enum ExportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

export interface UserDataExport {
  exportId: string;
  userId: string;
  tenantId: string;
  exportDate: Date;
  format: ExportFormat;
  
  // Core user data
  profile: any;
  consents: any[];
  sessions: any[];
  
  // Activity data
  accessLogs: any[];
  auditLogs: any[];
  
  // Business data (if applicable)
  bookings?: any[];
  payments?: any[];
  invoices?: any[];
  
  // Relationships
  clientData?: any;
  
  // Metadata
  dataCategories: string[];
  legalBasis: string[];
  retentionPeriods: Record<string, string>;
}

export class DataExportService {
  private readonly exportDir: string;
  private readonly maxRetentionDays: number = 30;

  constructor() {
    this.exportDir = process.env.DATA_EXPORT_DIR || path.join(process.cwd(), 'exports');
    this.ensureExportDirectory();
  }

  /**
   * Create data export request
   */
  async createExportRequest(
    userId: string,
    tenantId: string,
    requestedBy: string,
    requestType: ExportRequestType,
    format: ExportFormat = ExportFormat.JSON,
    includeRelatedData: boolean = true
  ): Promise<{
    success: boolean;
    exportId?: string;
    estimatedCompletionTime?: Date;
    error?: string;
  }> {
    // TODO: DataExportRequest model needs to be added to schema for GDPR compliance
    throw new Error('GDPR data export not yet implemented - schema update required');
  }

  /**
   * Process export request
   */
  private async processExportRequest(exportId: string): Promise<void> {
    // TODO: DataExportRequest model needs to be added to schema for GDPR compliance
    throw new Error('GDPR data export not yet implemented - schema update required');
  }

  /**
   * Gather all user data for export
   */
  private async gatherUserData(
    userId: string,
    tenantId: string,
    includeRelatedData: boolean
  ): Promise<UserDataExport> {
    try {
      // Core user profile
      const profile = await prisma.user.findUnique({
        where: { id: userId, tenantId },
        include: {
          tenant: {
            select: { id: true, name: true, domain: true }
          }
        }
      });

      if (!profile) {
        throw new Error('User not found');
      }

      // TODO: UserConsent and UserSession models need to be added to schema
      const consents: any[] = [];
      const sessions: any[] = [];

      // Access logs
      const accessLogs = await prisma.accessLog.findMany({
        where: { userId, tenantId },
        orderBy: { timestamp: 'desc' },
        take: 1000 // Limit to last 1000 access logs
      });

      // Audit logs
      const auditLogs = await prisma.auditLog.findMany({
        where: { userId, tenantId },
        orderBy: { timestamp: 'desc' },
        take: 1000 // Limit to last 1000 audit logs
      });

      const exportData: UserDataExport = {
        exportId: crypto.randomUUID(),
        userId,
        tenantId,
        exportDate: new Date(),
        format: ExportFormat.JSON,
        profile: this.sanitizeForExport(profile),
        consents: consents.map(c => this.sanitizeForExport(c)),
        sessions: sessions.map(s => this.sanitizeForExport(s)),
        accessLogs: accessLogs.map(l => this.sanitizeForExport(l)),
        auditLogs: auditLogs.map(l => this.sanitizeForExport(l)),
        dataCategories: [
          'Profile Data',
          'Consent Records',
          'Session Data',
          'Access Logs',
          'Audit Logs'
        ],
        legalBasis: ['Consent', 'Contract', 'Legal Obligation'],
        retentionPeriods: {
          'Profile Data': '2 years after account deletion',
          'Consent Records': '3 years for compliance',
          'Session Data': '1 year',
          'Access Logs': '2 years',
          'Audit Logs': '7 years for compliance'
        }
      };

      if (includeRelatedData) {
        // Business data - only if user has explicit consent or legitimate interest
        const bookings = await prisma.booking.findMany({
          where: { userId, tenantId },
          include: {
            space: { select: { name: true, type: true } }
          }
        });

        // Get payments through user's client relationship
        const userWithClient = await prisma.user.findUnique({
          where: { id: userId },
          select: { clientId: true }
        });
        
        const payments = userWithClient?.clientId ? await prisma.payment.findMany({
          where: { clientId: userWithClient.clientId, tenantId }
        }) : [];

        const invoices = userWithClient?.clientId ? await prisma.invoice.findMany({
          where: { clientId: userWithClient.clientId, tenantId }
        }) : [];

        exportData.bookings = bookings.map(b => this.sanitizeForExport(b));
        exportData.payments = payments.map(p => this.sanitizeForExport(p));
        exportData.invoices = invoices.map(i => this.sanitizeForExport(i));
        
        exportData.dataCategories.push('Booking Data', 'Payment Data', 'Invoice Data');

        // Client data if user is associated with a client
        if (userWithClient?.clientId) {
          const clientData = await prisma.client.findUnique({
            where: { id: userWithClient.clientId, tenantId }
          });
          exportData.clientData = this.sanitizeForExport(clientData);
          exportData.dataCategories.push('Client Association Data');
        }
      }

      return exportData;
    } catch (error) {
      logger.error('Failed to gather user data', {
        userId,
        tenantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Generate export file in specified format
   */
  private async generateExportFile(
    userData: UserDataExport,
    format: ExportFormat,
    exportId: string
  ): Promise<string> {
    const fileName = `export_${exportId}_${Date.now()}`;
    let filePath: string;
    let content: string;

    switch (format) {
      case ExportFormat.JSON:
        filePath = path.join(this.exportDir, `${fileName}.json`);
        content = JSON.stringify(userData, null, 2);
        break;

      case ExportFormat.CSV:
        filePath = path.join(this.exportDir, `${fileName}.csv`);
        content = this.convertToCSV(userData);
        break;

      case ExportFormat.XML:
        filePath = path.join(this.exportDir, `${fileName}.xml`);
        content = this.convertToXML(userData);
        break;

      case ExportFormat.PDF:
        filePath = path.join(this.exportDir, `${fileName}.pdf`);
        // For PDF generation, you'd typically use a library like puppeteer or pdfkit
        // For now, we'll create a simple text-based PDF
        content = this.convertToPDFText(userData);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(userData: UserDataExport): string {
    const csvLines: string[] = [];
    
    // Header
    csvLines.push('Data Type,Field,Value,Date');
    
    // Profile data
    if (userData.profile) {
      Object.entries(userData.profile).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          csvLines.push(`Profile,${key},"${value}",${userData.exportDate.toISOString()}`);
        }
      });
    }
    
    // Consents
    userData.consents.forEach((consent, index) => {
      Object.entries(consent).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          csvLines.push(`Consent ${index + 1},${key},"${value}",${consent.consentDate || userData.exportDate.toISOString()}`);
        }
      });
    });
    
    return csvLines.join('\n');
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(userData: UserDataExport): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<userData>');
    lines.push(`  <exportId>${userData.exportId}</exportId>`);
    lines.push(`  <userId>${userData.userId}</userId>`);
    lines.push(`  <exportDate>${userData.exportDate.toISOString()}</exportDate>`);
    
    // Profile
    if (userData.profile) {
      lines.push('  <profile>');
      Object.entries(userData.profile).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          lines.push(`    <${key}>${this.escapeXML(String(value))}</${key}>`);
        }
      });
      lines.push('  </profile>');
    }
    
    // Consents
    lines.push('  <consents>');
    userData.consents.forEach((consent, index) => {
      lines.push(`    <consent id="${index + 1}">`);
      Object.entries(consent).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          lines.push(`      <${key}>${this.escapeXML(String(value))}</${key}>`);
        }
      });
      lines.push('    </consent>');
    });
    lines.push('  </consents>');
    
    lines.push('</userData>');
    return lines.join('\n');
  }

  /**
   * Convert data to PDF-ready text
   */
  private convertToPDFText(userData: UserDataExport): string {
    const lines: string[] = [];
    lines.push('DATA EXPORT REPORT');
    lines.push('==================');
    lines.push('');
    lines.push(`Export ID: ${userData.exportId}`);
    lines.push(`User ID: ${userData.userId}`);
    lines.push(`Export Date: ${userData.exportDate.toISOString()}`);
    lines.push('');
    
    lines.push('PROFILE DATA');
    lines.push('------------');
    if (userData.profile) {
      Object.entries(userData.profile).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          lines.push(`${key}: ${value}`);
        }
      });
    }
    lines.push('');
    
    lines.push('CONSENT RECORDS');
    lines.push('---------------');
    userData.consents.forEach((consent, index) => {
      lines.push(`Consent ${index + 1}:`);
      Object.entries(consent).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          lines.push(`  ${key}: ${value}`);
        }
      });
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * Download export file
   */
  async downloadExport(exportId: string, requestedBy: string): Promise<{
    success: boolean;
    filePath?: string;
    fileName?: string;
    contentType?: string;
    error?: string;
  }> {
    // TODO: DataExportRequest model needs to be added to schema for GDPR compliance
    return {
      success: false,
      error: 'GDPR data export not yet implemented - schema update required'
    };
  }

  /**
   * Get export request status
   */
  async getExportStatus(exportId: string): Promise<DataExportRequest | null> {
    // TODO: DataExportRequest model needs to be added to schema for GDPR compliance
    return null;
  }

  /**
   * Cleanup expired exports
   */
  async cleanupExpiredExports(): Promise<{
    deletedCount: number;
    errors: string[];
  }> {
    // TODO: DataExportRequest model needs to be added to schema for GDPR compliance
    return {
      deletedCount: 0,
      errors: ['GDPR data export not yet implemented - schema update required']
    };
  }

  /**
   * Helper methods
   */
  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.exportDir);
    } catch {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private sanitizeForExport(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields that shouldn't be exported
    const sensitiveFields = ['password', 'hash', 'salt', 'secret', 'token', 'key'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private countRecords(userData: UserDataExport): number {
    return (
      1 + // profile
      userData.consents.length +
      userData.sessions.length +
      userData.accessLogs.length +
      userData.auditLogs.length +
      (userData.bookings?.length || 0) +
      (userData.payments?.length || 0) +
      (userData.invoices?.length || 0)
    );
  }

  private getContentType(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.JSON:
        return 'application/json';
      case ExportFormat.CSV:
        return 'text/csv';
      case ExportFormat.XML:
        return 'application/xml';
      case ExportFormat.PDF:
        return 'application/pdf';
      case ExportFormat.ZIP:
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }
}

export const dataExportService = new DataExportService();
import { prisma } from '../lib/prisma';
import {
  VisitorStatus,
  VisitorPurpose,
  PreRegistrationStatus,
  VisitorAction,
  AccessCodeType,
  CodeStatus,
  NotificationType,
  NotificationUrgency,
  DeliveryMethod,
  NotificationStatus,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface VisitorData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  photoUrl?: string;
  documentType?: string;
  documentNumber?: string;
  hostUserId: string;
  hostName: string;
  hostEmail: string;
  purpose: VisitorPurpose;
  purposeDetails?: string;
  expectedDuration?: number;
  meetingRoom?: string;
  qrCode: string;
  badgeNumber?: string;
  validFrom: Date;
  validUntil: Date;
  accessZones: string[];
  status: VisitorStatus;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  actualDuration?: number;
  isPreRegistered: boolean;
  healthDeclaration?: Record<string, any>;
  emergencyContact?: Record<string, any>;
  ndaSigned: boolean;
  termsAccepted: boolean;
  dataConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVisitorRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  documentType?: string;
  documentNumber?: string;
  hostUserId: string;
  purpose: VisitorPurpose;
  purposeDetails?: string;
  expectedDuration?: number;
  meetingRoom?: string;
  validFrom?: Date;
  validUntil?: Date;
  accessZones?: string[];
  preRegistrationId?: string;
  healthDeclaration?: Record<string, any>;
  emergencyContact?: Record<string, any>;
}

export interface UpdateVisitorRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  photoUrl?: string;
  documentType?: string;
  documentNumber?: string;
  purpose?: VisitorPurpose;
  purposeDetails?: string;
  expectedDuration?: number;
  meetingRoom?: string;
  validUntil?: Date;
  accessZones?: string[];
  healthDeclaration?: Record<string, any>;
  emergencyContact?: Record<string, any>;
}

export interface VisitorFilter {
  status?: VisitorStatus[];
  hostUserId?: string;
  purpose?: VisitorPurpose;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  includeExpired?: boolean;
}

export interface CheckInRequest {
  visitorId: string;
  checkInLocation?: string;
  photoUrl?: string;
  badgeNumber?: string;
  healthDeclaration?: Record<string, any>;
  termsAccepted?: boolean;
  dataConsent?: boolean;
  ndaSigned?: boolean;
}

export interface CheckOutRequest {
  visitorId: string;
  checkOutLocation?: string;
  badgeReturned?: boolean;
  notes?: string;
}

export interface VisitorStatistics {
  totalVisitors: number;
  activeVisitors: number;
  todaysVisitors: number;
  averageVisitDuration: number;
  byPurpose: Array<{
    purpose: VisitorPurpose;
    count: number;
    percentage: number;
  }>;
  byStatus: Array<{
    status: VisitorStatus;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    visitorCount: number;
  }>;
  topHosts: Array<{
    hostId: string;
    hostName: string;
    visitorCount: number;
  }>;
}

export interface AccessCodeData {
  id: string;
  code: string;
  codeType: AccessCodeType;
  visitorId?: string;
  isActive: boolean;
  expiresAt: Date;
  maxUses?: number;
  currentUses: number;
  accessZones?: string[];
  generatedBy: string;
  generatedAt: Date;
  lastUsedAt?: Date;
  status: CodeStatus;
}

export interface CreateAccessCodeRequest {
  codeType: AccessCodeType;
  visitorId?: string;
  expiresAt: Date;
  maxUses?: number;
  accessZones?: string[];
  generatedFor?: string;
  timeRestrictions?: any;
  ipRestrictions?: string[];
}

export interface PreRegistrationData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  expectedArrival: Date;
  purpose: VisitorPurpose;
  purposeDetails?: string;
  hostUserId: string;
  status: PreRegistrationStatus;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  invitationSent: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface PreRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  hostUserId: string;
  expectedArrival: Date;
  expectedDuration?: number;
  purpose: VisitorPurpose;
  purposeDetails?: string;
  meetingRoom?: string;
  accessZones?: string[];
  parkingRequired?: boolean;
  requiresNDA?: boolean;
  requiresHealthCheck?: boolean;
  customRequirements?: any[];
}

// ============================================================================
// VISITOR SERVICE
// ============================================================================

export class VisitorService {

  // ============================================================================
  // VISITOR CRUD OPERATIONS
  // ============================================================================

  async createVisitor(
    tenantId: string,
    data: CreateVisitorRequest
  ): Promise<VisitorData> {
    try {
      // Generate default valid times if not provided
      const now = new Date();
      const validFrom = data.validFrom || now;
      const validUntil = data.validUntil || new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours default

      // Generate unique QR code
      const qrCode = this.generateQRCode();

      const visitor = await prisma.$transaction(async (tx) => {
        // Create visitor record
        const newVisitor = await tx.visitor.create({
          data: {
            tenantId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            company: data.company,
            jobTitle: data.jobTitle,
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            hostUserId: data.hostUserId,
            purpose: data.purpose,
            purposeDetails: data.purposeDetails,
            expectedDuration: data.expectedDuration,
            meetingRoom: data.meetingRoom,
            qrCode,
            validFrom,
            validUntil,
            accessZones: data.accessZones || [],
            preRegistrationId: data.preRegistrationId,
            isPreRegistered: !!data.preRegistrationId,
            healthDeclaration: data.healthDeclaration || {},
            emergencyContact: data.emergencyContact || {},
            status: VisitorStatus.APPROVED, // Auto-approve for now
          },
          include: {
            host: true,
          },
        });

        // Log visitor creation
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: newVisitor.id,
            action: VisitorAction.PRE_REGISTERED,
            performedBy: data.hostUserId,
            details: `Visitor registered by host`,
          },
        });

        // Update pre-registration if linked
        if (data.preRegistrationId) {
          await tx.visitorPreRegistration.update({
            where: { id: data.preRegistrationId },
            data: {
              status: PreRegistrationStatus.CONVERTED,
              visitDate: now,
              visitorId: newVisitor.id,
            },
          });
        }

        return newVisitor;
      });

      return this.mapVisitorToData(visitor);
    } catch (error) {
      logger.error('Failed to create visitor', { tenantId, data }, error as Error);
      throw error;
    }
  }

  async updateVisitor(
    tenantId: string,
    visitorId: string,
    data: UpdateVisitorRequest
  ): Promise<VisitorData> {
    try {
      const visitor = await prisma.visitor.update({
        where: {
          id: visitorId,
          tenantId,
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          host: true,
        },
      });

      return this.mapVisitorToData(visitor);
    } catch (error) {
      logger.error('Failed to update visitor', { tenantId, visitorId, data }, error as Error);
      throw error;
    }
  }

  async deleteVisitor(
    tenantId: string,
    visitorId: string
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update status to cancelled instead of hard delete
        await tx.visitor.update({
          where: {
            id: visitorId,
            tenantId,
          },
          data: {
            status: VisitorStatus.CANCELLED,
          },
        });

        // Log cancellation
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId,
            action: VisitorAction.DENIED,
            details: 'Visitor registration cancelled',
          },
        });
      });

      logger.info('Visitor cancelled successfully', { tenantId, visitorId });
    } catch (error) {
      logger.error('Failed to delete visitor', { tenantId, visitorId }, error as Error);
      throw error;
    }
  }

  async getVisitorById(
    tenantId: string,
    visitorId: string
  ): Promise<VisitorData | null> {
    try {
      const visitor = await prisma.visitor.findFirst({
        where: {
          id: visitorId,
          tenantId,
        },
        include: {
          host: true,
        },
      });

      return visitor ? this.mapVisitorToData(visitor) : null;
    } catch (error) {
      logger.error('Failed to get visitor by ID', { tenantId, visitorId }, error as Error);
      throw error;
    }
  }

  async getVisitorByQRCode(
    tenantId: string,
    qrCode: string
  ): Promise<VisitorData | null> {
    try {
      const visitor = await prisma.visitor.findFirst({
        where: {
          qrCode,
          tenantId,
        },
        include: {
          host: true,
        },
      });

      return visitor ? this.mapVisitorToData(visitor) : null;
    } catch (error) {
      logger.error('Failed to get visitor by QR code', { tenantId, qrCode }, error as Error);
      throw error;
    }
  }

  async getVisitors(
    tenantId: string,
    filters: VisitorFilter = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    visitors: VisitorData[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause = this.buildVisitorWhereClause(tenantId, filters);

      const [visitors, total] = await Promise.all([
        prisma.visitor.findMany({
          where: whereClause,
          include: {
            host: true,
          },
          orderBy: [
            { checkedInAt: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.visitor.count({ where: whereClause }),
      ]);

      const visitorData = visitors.map(visitor => this.mapVisitorToData(visitor));
      const hasMore = (pagination.skip || 0) + visitorData.length < total;

      return {
        visitors: visitorData,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get visitors', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getTodaysVisitors(
    tenantId: string,
    hostUserId?: string
  ): Promise<VisitorData[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const whereClause: any = {
        tenantId,
        validFrom: { lte: tomorrow },
        validUntil: { gte: today },
        status: { notIn: [VisitorStatus.CANCELLED, VisitorStatus.EXPIRED] },
      };

      if (hostUserId) {
        whereClause.hostUserId = hostUserId;
      }

      const visitors = await prisma.visitor.findMany({
        where: whereClause,
        include: {
          host: true,
        },
        orderBy: { validFrom: 'asc' },
      });

      return visitors.map(visitor => this.mapVisitorToData(visitor));
    } catch (error) {
      logger.error('Failed to get today\'s visitors', { tenantId, hostUserId }, error as Error);
      throw error;
    }
  }

  async getActiveVisitors(
    tenantId: string
  ): Promise<VisitorData[]> {
    try {
      const visitors = await prisma.visitor.findMany({
        where: {
          tenantId,
          status: VisitorStatus.CHECKED_IN,
        },
        include: {
          host: true,
        },
        orderBy: { checkedInAt: 'desc' },
      });

      return visitors.map(visitor => this.mapVisitorToData(visitor));
    } catch (error) {
      logger.error('Failed to get active visitors', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // CHECK-IN/CHECK-OUT OPERATIONS
  // ============================================================================

  async checkInVisitor(
    tenantId: string,
    data: CheckInRequest
  ): Promise<VisitorData> {
    try {
      const now = new Date();

      const visitor = await prisma.$transaction(async (tx) => {
        // Get visitor and validate
        const existingVisitor = await tx.visitor.findFirst({
          where: {
            id: data.visitorId,
            tenantId,
            status: { in: [VisitorStatus.APPROVED, VisitorStatus.PENDING] },
          },
          include: {
            host: true,
          },
        });

        if (!existingVisitor) {
          throw new Error('Visitor not found or not eligible for check-in');
        }

        // Validate visit time
        if (now < existingVisitor.validFrom || now > existingVisitor.validUntil) {
          throw new Error('Visitor check-in outside valid time window');
        }

        // Update visitor record
        const updatedVisitor = await tx.visitor.update({
          where: { id: data.visitorId },
          data: {
            status: VisitorStatus.CHECKED_IN,
            checkedInAt: now,
            photoUrl: data.photoUrl || existingVisitor.photoUrl,
            badgeNumber: data.badgeNumber,
            healthDeclaration: data.healthDeclaration || existingVisitor.healthDeclaration || undefined,
            termsAccepted: data.termsAccepted || existingVisitor.termsAccepted,
            dataConsent: data.dataConsent || existingVisitor.dataConsent,
            ndaSigned: data.ndaSigned || existingVisitor.ndaSigned,
          },
          include: {
            host: true,
          },
        });

        // Log check-in
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: data.visitorId,
            action: VisitorAction.CHECKED_IN,
            location: data.checkInLocation,
            details: `Checked in at ${data.checkInLocation || 'main entrance'}`,
          },
        });

        // Create badge if badge number provided
        if (data.badgeNumber) {
          await tx.visitorBadge.create({
            data: {
              tenantId,
              visitorId: data.visitorId,
              badgeNumber: data.badgeNumber,
              printedBy: existingVisitor.hostUserId, // Simplified - would be reception staff
            },
          });

          await tx.visitorLog.create({
            data: {
              tenantId,
              visitorId: data.visitorId,
              action: VisitorAction.BADGE_PRINTED,
              details: `Badge ${data.badgeNumber} issued`,
            },
          });
        }

        // Notify host
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: data.visitorId,
            action: VisitorAction.HOST_NOTIFIED,
            details: `Host notified of visitor arrival`,
          },
        });

        return updatedVisitor;
      });

      logger.info('Visitor checked in successfully', { tenantId, visitorId: data.visitorId });
      return this.mapVisitorToData(visitor);
    } catch (error) {
      logger.error('Failed to check in visitor', { tenantId, data }, error as Error);
      throw error;
    }
  }

  async checkOutVisitor(
    tenantId: string,
    data: CheckOutRequest
  ): Promise<VisitorData> {
    try {
      const now = new Date();

      const visitor = await prisma.$transaction(async (tx) => {
        // Get visitor and validate
        const existingVisitor = await tx.visitor.findFirst({
          where: {
            id: data.visitorId,
            tenantId,
            status: VisitorStatus.CHECKED_IN,
          },
          include: {
            host: true,
          },
        });

        if (!existingVisitor) {
          throw new Error('Visitor not found or not checked in');
        }

        // Calculate actual duration
        const actualDuration = existingVisitor.checkedInAt
          ? Math.floor((now.getTime() - existingVisitor.checkedInAt.getTime()) / (1000 * 60))
          : 0;

        // Update visitor record
        const updatedVisitor = await tx.visitor.update({
          where: { id: data.visitorId },
          data: {
            status: VisitorStatus.CHECKED_OUT,
            checkedOutAt: now,
            actualDuration,
          },
          include: {
            host: true,
          },
        });

        // Log check-out
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: data.visitorId,
            action: VisitorAction.CHECKED_OUT,
            location: data.checkOutLocation,
            details: `Checked out at ${data.checkOutLocation || 'main entrance'}`,
            metadata: { actualDuration, notes: data.notes },
          },
        });

        // Handle badge return
        if (data.badgeReturned && existingVisitor.badgeNumber) {
          const badge = await tx.visitorBadge.findFirst({
            where: {
              visitorId: data.visitorId,
              badgeNumber: existingVisitor.badgeNumber,
              isActive: true,
            },
          });

          if (badge) {
            await tx.visitorBadge.update({
              where: { id: badge.id },
              data: {
                isActive: false,
                returnedAt: now,
                returnedTo: existingVisitor.hostUserId, // Simplified
              },
            });

            await tx.visitorLog.create({
              data: {
                tenantId,
                visitorId: data.visitorId,
                action: VisitorAction.BADGE_RETURNED,
                details: `Badge ${existingVisitor.badgeNumber} returned`,
              },
            });
          }
        }

        return updatedVisitor;
      });

      logger.info('Visitor checked out successfully', { tenantId, visitorId: data.visitorId });
      return this.mapVisitorToData(visitor);
    } catch (error) {
      logger.error('Failed to check out visitor', { tenantId, data }, error as Error);
      throw error;
    }
  }

  async extendVisitorStay(
    tenantId: string,
    visitorId: string,
    newValidUntil: Date,
    reason?: string
  ): Promise<VisitorData> {
    try {
      const visitor = await prisma.$transaction(async (tx) => {
        const updatedVisitor = await tx.visitor.update({
          where: {
            id: visitorId,
            tenantId,
            status: { in: [VisitorStatus.APPROVED, VisitorStatus.CHECKED_IN] },
          },
          data: {
            validUntil: newValidUntil,
          },
          include: {
            host: true,
          },
        });

        // Log extension
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId,
            action: VisitorAction.EXTENDED_STAY,
            details: reason || 'Visit extended',
            metadata: { newValidUntil: newValidUntil.toISOString() },
          },
        });

        return updatedVisitor;
      });

      logger.info('Visitor stay extended', { tenantId, visitorId, newValidUntil });
      return this.mapVisitorToData(visitor);
    } catch (error) {
      logger.error('Failed to extend visitor stay', { tenantId, visitorId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // VISITOR ANALYTICS
  // ============================================================================

  async getVisitorStatistics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VisitorStatistics> {
    try {
      const visitors = await prisma.visitor.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalVisitors = visitors.length;
      const activeVisitors = visitors.filter(v => v.status === VisitorStatus.CHECKED_IN).length;
      const todaysVisitors = visitors.filter(v => v.createdAt >= today).length;

      // Calculate average visit duration
      const completedVisits = visitors.filter(v => v.actualDuration);
      const averageVisitDuration = completedVisits.length > 0
        ? completedVisits.reduce((sum, v) => sum + (v.actualDuration || 0), 0) / completedVisits.length
        : 0;

      // Group by purpose
      const purposeCounts = new Map<VisitorPurpose, number>();
      visitors.forEach(v => {
        const count = purposeCounts.get(v.purpose) || 0;
        purposeCounts.set(v.purpose, count + 1);
      });

      const byPurpose = Array.from(purposeCounts.entries()).map(([purpose, count]) => ({
        purpose,
        count,
        percentage: totalVisitors > 0 ? (count / totalVisitors) * 100 : 0,
      }));

      // Group by status
      const statusCounts = new Map<VisitorStatus, number>();
      visitors.forEach(v => {
        const count = statusCounts.get(v.status) || 0;
        statusCounts.set(v.status, count + 1);
      });

      const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      // Calculate peak hours
      const hourCounts = new Array(24).fill(0);
      visitors.forEach(v => {
        if (v.checkedInAt) {
          const hour = v.checkedInAt.getHours();
          hourCounts[hour]++;
        }
      });

      const peakHours = hourCounts.map((count, hour) => ({
        hour,
        visitorCount: count,
      })).filter(h => h.visitorCount > 0);

      // Top hosts
      const hostCounts = new Map<string, { name: string; count: number }>();
      visitors.forEach(v => {
        const hostId = v.hostUserId;
        const existing = hostCounts.get(hostId) || {
          name: `${v.host.firstName} ${v.host.lastName}`,
          count: 0,
        };
        existing.count++;
        hostCounts.set(hostId, existing);
      });

      const topHosts = Array.from(hostCounts.entries())
        .map(([hostId, data]) => ({
          hostId,
          hostName: data.name,
          visitorCount: data.count,
        }))
        .sort((a, b) => b.visitorCount - a.visitorCount)
        .slice(0, 10);

      return {
        totalVisitors,
        activeVisitors,
        todaysVisitors,
        averageVisitDuration: Math.round(averageVisitDuration),
        byPurpose,
        byStatus,
        peakHours,
        topHosts,
      };
    } catch (error) {
      logger.error('Failed to get visitor statistics', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }

  async getVisitorHistory(
    tenantId: string,
    visitorId: string
  ): Promise<Array<{
    action: VisitorAction;
    timestamp: Date;
    performedBy?: string;
    location?: string;
    details?: string;
  }>> {
    try {
      const logs = await prisma.visitorLog.findMany({
        where: {
          tenantId,
          visitorId,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      return logs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        performedBy: log.user ? `${log.user.firstName} ${log.user.lastName}` : undefined,
        location: log.location || undefined,
        details: log.details || undefined,
      }));
    } catch (error) {
      logger.error('Failed to get visitor history', { tenantId, visitorId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildVisitorWhereClause(tenantId: string, filters: VisitorFilter): any {
    const whereClause: any = { tenantId };

    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    if (filters.hostUserId) {
      whereClause.hostUserId = filters.hostUserId;
    }

    if (filters.purpose) {
      whereClause.purpose = filters.purpose;
    }

    if (filters.fromDate && filters.toDate) {
      whereClause.validFrom = { lte: filters.toDate };
      whereClause.validUntil = { gte: filters.fromDate };
    }

    if (filters.search) {
      whereClause.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (!filters.includeExpired) {
      const now = new Date();
      whereClause.validUntil = { gte: now };
      whereClause.status = {
        notIn: [VisitorStatus.EXPIRED, VisitorStatus.CANCELLED],
      };
    }

    return whereClause;
  }

  private mapVisitorToData(visitor: any): VisitorData {
    return {
      id: visitor.id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email,
      phone: visitor.phone,
      company: visitor.company,
      jobTitle: visitor.jobTitle,
      photoUrl: visitor.photoUrl,
      documentType: visitor.documentType,
      documentNumber: visitor.documentNumber,
      hostUserId: visitor.hostUserId,
      hostName: `${visitor.host.firstName} ${visitor.host.lastName}`,
      hostEmail: visitor.host.email,
      purpose: visitor.purpose,
      purposeDetails: visitor.purposeDetails,
      expectedDuration: visitor.expectedDuration,
      meetingRoom: visitor.meetingRoom,
      qrCode: visitor.qrCode,
      badgeNumber: visitor.badgeNumber,
      validFrom: visitor.validFrom,
      validUntil: visitor.validUntil,
      accessZones: Array.isArray(visitor.accessZones) ? visitor.accessZones : [],
      status: visitor.status,
      checkedInAt: visitor.checkedInAt,
      checkedOutAt: visitor.checkedOutAt,
      actualDuration: visitor.actualDuration,
      isPreRegistered: visitor.isPreRegistered,
      healthDeclaration: visitor.healthDeclaration,
      emergencyContact: visitor.emergencyContact,
      ndaSigned: visitor.ndaSigned,
      termsAccepted: visitor.termsAccepted,
      dataConsent: visitor.dataConsent,
      createdAt: visitor.createdAt,
      updatedAt: visitor.updatedAt,
    };
  }

  async updateExpiredVisitors(tenantId: string): Promise<number> {
    try {
      const now = new Date();
      
      const result = await prisma.visitor.updateMany({
        where: {
          tenantId,
          validUntil: { lt: now },
          status: { notIn: [VisitorStatus.CHECKED_OUT, VisitorStatus.CANCELLED, VisitorStatus.EXPIRED] },
        },
        data: {
          status: VisitorStatus.EXPIRED,
        },
      });

      logger.info('Updated expired visitors', { tenantId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to update expired visitors', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // PRE-REGISTRATION SYSTEM
  // ============================================================================

  async createPreRegistration(
    tenantId: string,
    userId: string,
    request: PreRegistrationRequest
  ): Promise<PreRegistrationData> {
    try {
      const expiresAt = new Date(request.expectedArrival);
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire after 7 days

      const preRegistration = await prisma.visitorPreRegistration.create({
        data: {
          tenantId,
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          phone: request.phone,
          company: request.company,
          jobTitle: request.jobTitle,
          hostUserId: request.hostUserId,
          expectedArrival: request.expectedArrival,
          expectedDuration: request.expectedDuration,
          purpose: request.purpose,
          purposeDetails: request.purposeDetails,
          meetingRoom: request.meetingRoom,
          accessZones: request.accessZones || [],
          parkingRequired: request.parkingRequired || false,
          requiresNDA: request.requiresNDA || false,
          requiresHealthCheck: request.requiresHealthCheck || false,
          customRequirements: request.customRequirements || [],
          status: PreRegistrationStatus.PENDING,
          expiresAt
        }
      });

      // Send notification to host
      await this.sendNotification(tenantId, {
        type: NotificationType.PRE_REGISTRATION_REQUEST,
        recipientId: request.hostUserId,
        preRegistrationId: preRegistration.id,
        title: 'New Visitor Pre-Registration',
        message: `${request.firstName} ${request.lastName} has requested to visit on ${request.expectedArrival.toLocaleDateString()}`,
        urgency: NotificationUrgency.NORMAL
      });

      logger.info('Pre-registration created', { 
        tenantId, 
        preRegistrationId: preRegistration.id, 
        hostUserId: request.hostUserId 
      });

      return this.mapPreRegistrationToData(preRegistration);
    } catch (error) {
      logger.error('Failed to create pre-registration', { tenantId }, error as Error);
      throw error;
    }
  }

  async approvePreRegistration(
    tenantId: string,
    preRegistrationId: string,
    userId: string,
    approvalNotes?: string
  ): Promise<PreRegistrationData> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.update({
        where: { id: preRegistrationId, tenantId },
        data: {
          isApproved: true,
          approvedBy: userId,
          approvedAt: new Date(),
          approvalNotes,
          status: PreRegistrationStatus.APPROVED
        }
      });

      // Send approval notification
      await this.sendNotification(tenantId, {
        type: NotificationType.PRE_REGISTRATION_APPROVED,
        recipientId: preRegistration.hostUserId,
        preRegistrationId: preRegistration.id,
        title: 'Visitor Pre-Registration Approved',
        message: `${preRegistration.firstName} ${preRegistration.lastName} has been approved for visit`,
        urgency: NotificationUrgency.NORMAL
      });

      // Send invitation to visitor if email provided
      if (preRegistration.email) {
        await this.sendVisitorInvitation(tenantId, preRegistration.id);
      }

      logger.info('Pre-registration approved', { 
        tenantId, 
        preRegistrationId, 
        approvedBy: userId 
      });

      return this.mapPreRegistrationToData(preRegistration);
    } catch (error) {
      logger.error('Failed to approve pre-registration', { 
        tenantId, 
        preRegistrationId 
      }, error as Error);
      throw error;
    }
  }

  async convertPreRegistrationToVisitor(
    tenantId: string,
    preRegistrationId: string,
    userId: string
  ): Promise<VisitorData> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.findFirst({
        where: { id: preRegistrationId, tenantId, isApproved: true }
      });

      if (!preRegistration) {
        throw new Error('Pre-registration not found or not approved');
      }

      const validFrom = new Date();
      const validUntil = new Date(preRegistration.expectedArrival);
      if (preRegistration.expectedDuration) {
        validUntil.setMinutes(validUntil.getMinutes() + preRegistration.expectedDuration);
      } else {
        validUntil.setHours(validUntil.getHours() + 8); // Default 8 hours
      }

      // Create visitor from pre-registration
      const visitor = await this.createVisitor(tenantId, {
        firstName: preRegistration.firstName,
        lastName: preRegistration.lastName,
        email: preRegistration.email,
        phone: preRegistration.phone || undefined,
        company: preRegistration.company || undefined,
        jobTitle: preRegistration.jobTitle || undefined,
        purpose: preRegistration.purpose,
        purposeDetails: preRegistration.purposeDetails || undefined,
        hostUserId: preRegistration.hostUserId,
        expectedDuration: preRegistration.expectedDuration || undefined,
        validFrom,
        validUntil,
        accessZones: Array.isArray(preRegistration.accessZones) ? preRegistration.accessZones as string[] : [],
        meetingRoom: preRegistration.meetingRoom || undefined,
        preRegistrationId: preRegistration.id
      });

      // Update pre-registration status
      await prisma.visitorPreRegistration.update({
        where: { id: preRegistrationId },
        data: {
          status: PreRegistrationStatus.CONVERTED,
          visitDate: new Date(),
          visitorId: visitor.id
        }
      });

      logger.info('Pre-registration converted to visitor', { 
        tenantId, 
        preRegistrationId, 
        visitorId: visitor.id 
      });

      return visitor;
    } catch (error) {
      logger.error('Failed to convert pre-registration', { 
        tenantId, 
        preRegistrationId 
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ACCESS CODE MANAGEMENT
  // ============================================================================

  async generateAccessCode(
    tenantId: string,
    userId: string,
    request: CreateAccessCodeRequest
  ): Promise<AccessCodeData> {
    try {
      const code = this.generateAlphanumericCode();
      
      const accessCode = await prisma.visitorAccessCode.create({
        data: {
          tenantId,
          code,
          codeType: request.codeType,
          visitorId: request.visitorId,
          expiresAt: request.expiresAt,
          maxUses: request.maxUses,
          accessZones: request.accessZones || [],
          timeRestrictions: request.timeRestrictions || {},
          ipRestrictions: request.ipRestrictions || [],
          generatedBy: userId,
          generatedFor: request.generatedFor,
          status: CodeStatus.ACTIVE
        }
      });

      // Send notification about access code generation
      if (request.visitorId) {
        const visitor = await prisma.visitor.findUnique({
          where: { id: request.visitorId }
        });
        
        if (visitor) {
          await this.sendNotification(tenantId, {
            type: NotificationType.ACCESS_CODE_GENERATED,
            recipientId: visitor.hostUserId,
            visitorId: visitor.id,
            title: 'Access Code Generated',
            message: `Access code ${code} generated for ${visitor.firstName} ${visitor.lastName}`,
            urgency: NotificationUrgency.NORMAL
          });
        }
      }

      logger.info('Access code generated', { 
        tenantId, 
        accessCodeId: accessCode.id, 
        visitorId: request.visitorId 
      });

      return this.mapAccessCodeToData(accessCode);
    } catch (error) {
      logger.error('Failed to generate access code', { tenantId }, error as Error);
      throw error;
    }
  }

  async validateAccessCode(
    tenantId: string,
    code: string,
    location?: string,
    ipAddress?: string
  ): Promise<{ valid: boolean; accessCode?: AccessCodeData; reason?: string }> {
    try {
      const accessCode = await prisma.visitorAccessCode.findFirst({
        where: { tenantId, code, isActive: true }
      });

      if (!accessCode) {
        return { valid: false, reason: 'Access code not found' };
      }

      // Check expiration
      if (accessCode.expiresAt < new Date()) {
        await this.deactivateAccessCode(tenantId, accessCode.id, 'EXPIRED');
        return { valid: false, reason: 'Access code expired' };
      }

      // Check usage limits
      if (accessCode.maxUses && accessCode.currentUses >= accessCode.maxUses) {
        await this.deactivateAccessCode(tenantId, accessCode.id, 'USED_UP');
        return { valid: false, reason: 'Access code usage limit reached' };
      }

      // Check IP restrictions
      if (ipAddress && accessCode.ipRestrictions) {
        const allowedIPs = accessCode.ipRestrictions as string[];
        if (allowedIPs.length > 0 && !allowedIPs.includes(ipAddress)) {
          return { valid: false, reason: 'IP address not allowed' };
        }
      }

      // Check time restrictions
      if (accessCode.timeRestrictions) {
        const restrictions = accessCode.timeRestrictions as any;
        if (!this.checkTimeRestrictions(restrictions)) {
          return { valid: false, reason: 'Access not allowed at this time' };
        }
      }

      return { valid: true, accessCode: this.mapAccessCodeToData(accessCode) };
    } catch (error) {
      logger.error('Failed to validate access code', { tenantId, code }, error as Error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  async useAccessCode(
    tenantId: string,
    code: string,
    usedBy?: string,
    visitorId?: string,
    location?: string,
    ipAddress?: string,
    deviceInfo?: any
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      const validation = await this.validateAccessCode(tenantId, code, location, ipAddress);
      
      if (!validation.valid) {
        // Log failed usage
        const accessCode = await prisma.visitorAccessCode.findFirst({
          where: { tenantId, code }
        });
        
        if (accessCode) {
          await prisma.accessCodeUsage.create({
            data: {
              accessCodeId: accessCode.id,
              usedBy,
              visitorId,
              location,
              ipAddress,
              deviceInfo: deviceInfo || {},
              success: false,
              accessGranted: false,
              failureReason: validation.reason
            }
          });
        }
        
        return { success: false, reason: validation.reason };
      }

      const accessCode = validation.accessCode!;

      // Record usage
      await prisma.accessCodeUsage.create({
        data: {
          accessCodeId: accessCode.id,
          usedBy,
          visitorId,
          location,
          ipAddress,
          deviceInfo: deviceInfo || {},
          success: true,
          accessGranted: true
        }
      });

      // Update access code usage count
      await prisma.visitorAccessCode.update({
        where: { id: accessCode.id },
        data: {
          currentUses: { increment: 1 },
          lastUsedAt: new Date(),
          lastUsedBy: usedBy || visitorId,
          lastUsedLocation: location
        }
      });

      logger.info('Access code used successfully', { 
        tenantId, 
        accessCodeId: accessCode.id, 
        location 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to use access code', { tenantId, code }, error as Error);
      return { success: false, reason: 'Usage error' };
    }
  }

  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================

  private async sendNotification(
    tenantId: string,
    notification: {
      type: NotificationType;
      recipientId: string;
      visitorId?: string;
      preRegistrationId?: string;
      title: string;
      message: string;
      urgency: NotificationUrgency;
      actionUrl?: string;
      actionText?: string;
    }
  ): Promise<void> {
    try {
      await prisma.visitorNotification.create({
        data: {
          tenantId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          urgency: notification.urgency,
          recipientId: notification.recipientId,
          visitorId: notification.visitorId,
          preRegistrationId: notification.preRegistrationId,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          deliveryMethod: DeliveryMethod.IN_APP,
          channels: ['in_app'],
          status: NotificationStatus.PENDING
        }
      });

      logger.info('Notification sent', { 
        tenantId, 
        type: notification.type, 
        recipientId: notification.recipientId 
      });
    } catch (error) {
      logger.error('Failed to send notification', { tenantId }, error as Error);
    }
  }

  private async sendVisitorInvitation(
    tenantId: string,
    preRegistrationId: string
  ): Promise<void> {
    try {
      await prisma.visitorPreRegistration.update({
        where: { id: preRegistrationId },
        data: {
          invitationSent: true,
          invitationSentAt: new Date()
        }
      });

      logger.info('Visitor invitation sent', { tenantId, preRegistrationId });
    } catch (error) {
      logger.error('Failed to send visitor invitation', { 
        tenantId, 
        preRegistrationId 
      }, error as Error);
    }
  }

  // ============================================================================
  // ADDITIONAL UTILITY METHODS
  // ============================================================================

  private generateQRCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateAlphanumericCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Excluded O, 0 for clarity
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private checkTimeRestrictions(restrictions: any): boolean {
    if (!restrictions || Object.keys(restrictions).length === 0) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday

    // Check day restrictions
    if (restrictions.allowedDays && restrictions.allowedDays.length > 0) {
      if (!restrictions.allowedDays.includes(currentDay)) {
        return false;
      }
    }

    // Check time window
    if (restrictions.startTime && restrictions.endTime) {
      const [startHour, startMinute] = restrictions.startTime.split(':').map(Number);
      const [endHour, endMinute] = restrictions.endTime.split(':').map(Number);
      
      const currentMinutes = currentHour * 60 + currentMinute;
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return false;
      }
    }

    return true;
  }

  private async deactivateAccessCode(
    tenantId: string,
    accessCodeId: string,
    reason: string
  ): Promise<void> {
    try {
      await prisma.visitorAccessCode.update({
        where: { id: accessCodeId },
        data: {
          isActive: false,
          status: reason as CodeStatus,
          deactivatedAt: new Date(),
          deactivationReason: reason
        }
      });
    } catch (error) {
      logger.error('Failed to deactivate access code', { 
        tenantId, 
        accessCodeId 
      }, error as Error);
    }
  }

  private mapPreRegistrationToData(preRegistration: any): PreRegistrationData {
    return {
      id: preRegistration.id,
      firstName: preRegistration.firstName,
      lastName: preRegistration.lastName,
      email: preRegistration.email,
      phone: preRegistration.phone,
      company: preRegistration.company,
      expectedArrival: preRegistration.expectedArrival,
      purpose: preRegistration.purpose,
      purposeDetails: preRegistration.purposeDetails,
      hostUserId: preRegistration.hostUserId,
      status: preRegistration.status,
      isApproved: preRegistration.isApproved,
      approvedBy: preRegistration.approvedBy,
      approvedAt: preRegistration.approvedAt,
      invitationSent: preRegistration.invitationSent,
      createdAt: preRegistration.createdAt,
      expiresAt: preRegistration.expiresAt
    };
  }

  private mapAccessCodeToData(accessCode: any): AccessCodeData {
    return {
      id: accessCode.id,
      code: accessCode.code,
      codeType: accessCode.codeType,
      visitorId: accessCode.visitorId,
      isActive: accessCode.isActive,
      expiresAt: accessCode.expiresAt,
      maxUses: accessCode.maxUses,
      currentUses: accessCode.currentUses,
      accessZones: accessCode.accessZones,
      generatedBy: accessCode.generatedBy,
      generatedAt: accessCode.generatedAt,
      lastUsedAt: accessCode.lastUsedAt,
      status: accessCode.status
    };
  }
}

export const visitorService = new VisitorService();
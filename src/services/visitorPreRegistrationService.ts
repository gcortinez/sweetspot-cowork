import { prisma } from '../lib/prisma';
import {
  PreRegistrationStatus,
  VisitorPurpose,
  VisitorAction,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';
import { visitorService } from './visitorService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface PreRegistrationData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  hostUserId: string;
  hostName: string;
  hostEmail: string;
  expectedArrival: Date;
  expectedDuration?: number;
  purpose: VisitorPurpose;
  purposeDetails?: string;
  meetingRoom?: string;
  isApproved: boolean;
  approvedBy?: string;
  approverName?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  accessZones: string[];
  parkingRequired: boolean;
  parkingSpot?: string;
  invitationSent: boolean;
  invitationSentAt?: Date;
  reminderSent: boolean;
  requiresNDA: boolean;
  requiresHealthCheck: boolean;
  customRequirements: string[];
  status: PreRegistrationStatus;
  visitDate?: Date;
  visitorId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CreatePreRegistrationRequest {
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
  customRequirements?: string[];
  autoApprove?: boolean;
}

export interface UpdatePreRegistrationRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  expectedArrival?: Date;
  expectedDuration?: number;
  purpose?: VisitorPurpose;
  purposeDetails?: string;
  meetingRoom?: string;
  accessZones?: string[];
  parkingRequired?: boolean;
  parkingSpot?: string;
  requiresNDA?: boolean;
  requiresHealthCheck?: boolean;
  customRequirements?: string[];
}

export interface ApprovalRequest {
  approve: boolean;
  notes?: string;
  accessZones?: string[];
  parkingSpot?: string;
  customRequirements?: string[];
}

export interface PreRegistrationFilter {
  status?: PreRegistrationStatus[];
  hostUserId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
  pendingOnly?: boolean;
}

export interface InvitationRequest {
  preRegistrationId: string;
  message?: string;
  includeQRCode?: boolean;
  includeDirections?: boolean;
  includeParking?: boolean;
}

export interface PreRegistrationStatistics {
  totalPreRegistrations: number;
  pendingApproval: number;
  approvedToday: number;
  conversionRate: number; // % that became actual visits
  averageApprovalTime: number; // in hours
  byPurpose: Array<{
    purpose: VisitorPurpose;
    count: number;
  }>;
  byHost: Array<{
    hostId: string;
    hostName: string;
    count: number;
  }>;
  upcomingVisits: Array<{
    date: string;
    count: number;
  }>;
}

// ============================================================================
// VISITOR PRE-REGISTRATION SERVICE
// ============================================================================

export class VisitorPreRegistrationService {

  // ============================================================================
  // PRE-REGISTRATION CRUD OPERATIONS
  // ============================================================================

  async createPreRegistration(
    tenantId: string,
    data: CreatePreRegistrationRequest
  ): Promise<PreRegistrationData> {
    try {
      // Calculate expiration (default 30 days from creation)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Determine initial status
      const initialStatus = data.autoApprove 
        ? PreRegistrationStatus.APPROVED 
        : PreRegistrationStatus.PENDING;

      const preRegistration = await prisma.$transaction(async (tx) => {
        const newPreReg = await tx.visitorPreRegistration.create({
          data: {
            tenantId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            company: data.company,
            jobTitle: data.jobTitle,
            hostUserId: data.hostUserId,
            expectedArrival: data.expectedArrival,
            expectedDuration: data.expectedDuration,
            purpose: data.purpose,
            purposeDetails: data.purposeDetails,
            meetingRoom: data.meetingRoom,
            accessZones: data.accessZones || [],
            parkingRequired: data.parkingRequired || false,
            requiresNDA: data.requiresNDA || false,
            requiresHealthCheck: data.requiresHealthCheck || false,
            customRequirements: data.customRequirements || [],
            status: initialStatus,
            expiresAt,
            ...(data.autoApprove && {
              isApproved: true,
              approvedBy: data.hostUserId,
              approvedAt: new Date(),
              approvalNotes: 'Auto-approved by host',
            }),
          },
          include: {
            host: true,
            approver: true,
          },
        });

        // Log creation
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: newPreReg.id, // Using pre-reg ID temporarily
            action: VisitorAction.PRE_REGISTERED,
            performedBy: data.hostUserId,
            details: `Pre-registration created for ${data.firstName} ${data.lastName}`,
          },
        });

        return newPreReg;
      });

      logger.info('Pre-registration created successfully', { 
        tenantId, 
        preRegistrationId: preRegistration.id,
        email: data.email,
        host: data.hostUserId
      });

      return this.mapPreRegistrationToData(preRegistration);
    } catch (error) {
      logger.error('Failed to create pre-registration', { tenantId, data }, error as Error);
      throw error;
    }
  }

  async updatePreRegistration(
    tenantId: string,
    preRegistrationId: string,
    data: UpdatePreRegistrationRequest
  ): Promise<PreRegistrationData> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.update({
        where: {
          id: preRegistrationId,
          tenantId,
          status: { in: [PreRegistrationStatus.PENDING, PreRegistrationStatus.APPROVED] },
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          host: true,
          approver: true,
        },
      });

      return this.mapPreRegistrationToData(preRegistration);
    } catch (error) {
      logger.error('Failed to update pre-registration', { tenantId, preRegistrationId, data }, error as Error);
      throw error;
    }
  }

  async deletePreRegistration(
    tenantId: string,
    preRegistrationId: string
  ): Promise<void> {
    try {
      await prisma.visitorPreRegistration.update({
        where: {
          id: preRegistrationId,
          tenantId,
          status: { notIn: [PreRegistrationStatus.CONVERTED] },
        },
        data: {
          status: PreRegistrationStatus.CANCELLED,
        },
      });

      logger.info('Pre-registration cancelled successfully', { tenantId, preRegistrationId });
    } catch (error) {
      logger.error('Failed to delete pre-registration', { tenantId, preRegistrationId }, error as Error);
      throw error;
    }
  }

  async getPreRegistrationById(
    tenantId: string,
    preRegistrationId: string
  ): Promise<PreRegistrationData | null> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.findFirst({
        where: {
          id: preRegistrationId,
          tenantId,
        },
        include: {
          host: true,
          approver: true,
        },
      });

      return preRegistration ? this.mapPreRegistrationToData(preRegistration) : null;
    } catch (error) {
      logger.error('Failed to get pre-registration by ID', { tenantId, preRegistrationId }, error as Error);
      throw error;
    }
  }

  async getPreRegistrations(
    tenantId: string,
    filters: PreRegistrationFilter = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    preRegistrations: PreRegistrationData[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause = this.buildPreRegistrationWhereClause(tenantId, filters);

      const [preRegistrations, total] = await Promise.all([
        prisma.visitorPreRegistration.findMany({
          where: whereClause,
          include: {
            host: true,
            approver: true,
          },
          orderBy: [
            { expectedArrival: 'asc' },
            { createdAt: 'desc' },
          ],
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.visitorPreRegistration.count({ where: whereClause }),
      ]);

      const preRegData = preRegistrations.map(preReg => this.mapPreRegistrationToData(preReg));
      const hasMore = (pagination.skip || 0) + preRegData.length < total;

      return {
        preRegistrations: preRegData,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get pre-registrations', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getPendingApprovals(
    tenantId: string,
    hostUserId?: string
  ): Promise<PreRegistrationData[]> {
    try {
      const whereClause: any = {
        tenantId,
        status: PreRegistrationStatus.PENDING,
      };

      if (hostUserId) {
        whereClause.hostUserId = hostUserId;
      }

      const preRegistrations = await prisma.visitorPreRegistration.findMany({
        where: whereClause,
        include: {
          host: true,
          approver: true,
        },
        orderBy: { expectedArrival: 'asc' },
      });

      return preRegistrations.map(preReg => this.mapPreRegistrationToData(preReg));
    } catch (error) {
      logger.error('Failed to get pending approvals', { tenantId, hostUserId }, error as Error);
      throw error;
    }
  }

  async getUpcomingVisits(
    tenantId: string,
    hostUserId?: string,
    days: number = 7
  ): Promise<PreRegistrationData[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      const whereClause: any = {
        tenantId,
        status: PreRegistrationStatus.APPROVED,
        expectedArrival: {
          gte: now,
          lte: futureDate,
        },
      };

      if (hostUserId) {
        whereClause.hostUserId = hostUserId;
      }

      const preRegistrations = await prisma.visitorPreRegistration.findMany({
        where: whereClause,
        include: {
          host: true,
          approver: true,
        },
        orderBy: { expectedArrival: 'asc' },
      });

      return preRegistrations.map(preReg => this.mapPreRegistrationToData(preReg));
    } catch (error) {
      logger.error('Failed to get upcoming visits', { tenantId, hostUserId, days }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // APPROVAL WORKFLOW
  // ============================================================================

  async processApproval(
    tenantId: string,
    preRegistrationId: string,
    approverId: string,
    data: ApprovalRequest
  ): Promise<PreRegistrationData> {
    try {
      const preRegistration = await prisma.$transaction(async (tx) => {
        const preReg = await tx.visitorPreRegistration.findFirst({
          where: {
            id: preRegistrationId,
            tenantId,
            status: PreRegistrationStatus.PENDING,
          },
        });

        if (!preReg) {
          throw new Error('Pre-registration not found or not pending approval');
        }

        const newStatus = data.approve 
          ? PreRegistrationStatus.APPROVED 
          : PreRegistrationStatus.CANCELLED;

        const updatedPreReg = await tx.visitorPreRegistration.update({
          where: { id: preRegistrationId },
          data: {
            status: newStatus,
            isApproved: data.approve,
            approvedBy: approverId,
            approvedAt: new Date(),
            approvalNotes: data.notes,
            ...(data.approve && {
              accessZones: data.accessZones || preReg.accessZones,
              parkingSpot: data.parkingSpot,
              customRequirements: data.customRequirements || preReg.customRequirements,
            }),
          },
          include: {
            host: true,
            approver: true,
          },
        });

        // Log approval/denial
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: preRegistrationId,
            action: data.approve ? VisitorAction.APPROVED : VisitorAction.DENIED,
            performedBy: approverId,
            details: data.notes || (data.approve ? 'Pre-registration approved' : 'Pre-registration denied'),
          },
        });

        return updatedPreReg;
      });

      logger.info('Pre-registration approval processed', { 
        tenantId, 
        preRegistrationId, 
        approved: data.approve,
        approverId 
      });

      return this.mapPreRegistrationToData(preRegistration);
    } catch (error) {
      logger.error('Failed to process approval', { tenantId, preRegistrationId, data }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // INVITATION AND COMMUNICATION
  // ============================================================================

  async sendInvitation(
    tenantId: string,
    data: InvitationRequest
  ): Promise<{
    success: boolean;
    message: string;
    invitationId?: string;
  }> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.findFirst({
        where: {
          id: data.preRegistrationId,
          tenantId,
          status: PreRegistrationStatus.APPROVED,
          invitationSent: false,
        },
        include: {
          host: true,
        },
      });

      if (!preRegistration) {
        return {
          success: false,
          message: 'Pre-registration not found, not approved, or invitation already sent',
        };
      }

      // Update invitation status
      await prisma.$transaction(async (tx) => {
        await tx.visitorPreRegistration.update({
          where: { id: data.preRegistrationId },
          data: {
            invitationSent: true,
            invitationSentAt: new Date(),
          },
        });

        // Log invitation sent
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: data.preRegistrationId,
            action: VisitorAction.INVITATION_SENT,
            details: 'Invitation email sent to visitor',
          },
        });
      });

      // In production, this would integrate with an email service
      const invitationContent = this.generateInvitationContent(preRegistration, data);
      
      logger.info('Invitation sent successfully', { 
        tenantId, 
        preRegistrationId: data.preRegistrationId,
        email: preRegistration.email 
      });

      return {
        success: true,
        message: 'Invitation sent successfully',
        invitationId: `inv_${data.preRegistrationId}`,
      };
    } catch (error) {
      logger.error('Failed to send invitation', { tenantId, data }, error as Error);
      return {
        success: false,
        message: 'Failed to send invitation',
      };
    }
  }

  async sendReminder(
    tenantId: string,
    preRegistrationId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.findFirst({
        where: {
          id: preRegistrationId,
          tenantId,
          status: PreRegistrationStatus.APPROVED,
          invitationSent: true,
        },
      });

      if (!preRegistration) {
        return {
          success: false,
          message: 'Pre-registration not found or not eligible for reminder',
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.visitorPreRegistration.update({
          where: { id: preRegistrationId },
          data: {
            reminderSent: true,
          },
        });

        // Log reminder sent
        await tx.visitorLog.create({
          data: {
            tenantId,
            visitorId: preRegistrationId,
            action: VisitorAction.HOST_NOTIFIED,
            details: 'Reminder email sent to visitor',
          },
        });
      });

      logger.info('Reminder sent successfully', { tenantId, preRegistrationId });

      return {
        success: true,
        message: 'Reminder sent successfully',
      };
    } catch (error) {
      logger.error('Failed to send reminder', { tenantId, preRegistrationId }, error as Error);
      return {
        success: false,
        message: 'Failed to send reminder',
      };
    }
  }

  // ============================================================================
  // CONVERSION TO VISITOR
  // ============================================================================

  async convertToVisitor(
    tenantId: string,
    preRegistrationId: string,
    additionalData?: {
      photoUrl?: string;
      documentType?: string;
      documentNumber?: string;
      healthDeclaration?: Record<string, any>;
      emergencyContact?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    visitor?: any;
    error?: string;
  }> {
    try {
      const preRegistration = await prisma.visitorPreRegistration.findFirst({
        where: {
          id: preRegistrationId,
          tenantId,
          status: PreRegistrationStatus.APPROVED,
        },
      });

      if (!preRegistration) {
        return {
          success: false,
          error: 'Pre-registration not found or not approved',
        };
      }

      // Create visitor from pre-registration
      const visitor = await visitorService.createVisitor(tenantId, {
        firstName: preRegistration.firstName,
        lastName: preRegistration.lastName,
        email: preRegistration.email,
        phone: preRegistration.phone,
        company: preRegistration.company,
        jobTitle: preRegistration.jobTitle,
        hostUserId: preRegistration.hostUserId,
        purpose: preRegistration.purpose,
        purposeDetails: preRegistration.purposeDetails,
        expectedDuration: preRegistration.expectedDuration,
        meetingRoom: preRegistration.meetingRoom,
        validFrom: preRegistration.expectedArrival,
        accessZones: Array.isArray(preRegistration.accessZones) 
          ? preRegistration.accessZones 
          : [],
        preRegistrationId,
        ...additionalData,
      });

      logger.info('Pre-registration converted to visitor', { 
        tenantId, 
        preRegistrationId, 
        visitorId: visitor.id 
      });

      return {
        success: true,
        visitor,
      };
    } catch (error) {
      logger.error('Failed to convert pre-registration to visitor', { tenantId, preRegistrationId }, error as Error);
      return {
        success: false,
        error: 'Conversion failed',
      };
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getPreRegistrationStatistics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PreRegistrationStatistics> {
    try {
      const preRegistrations = await prisma.visitorPreRegistration.findMany({
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
          visitors: true,
        },
      });

      const totalPreRegistrations = preRegistrations.length;
      const pendingApproval = preRegistrations.filter(pr => pr.status === PreRegistrationStatus.PENDING).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = preRegistrations.filter(pr => 
        pr.status === PreRegistrationStatus.APPROVED && 
        pr.approvedAt && 
        pr.approvedAt >= today
      ).length;

      const converted = preRegistrations.filter(pr => pr.status === PreRegistrationStatus.CONVERTED).length;
      const conversionRate = totalPreRegistrations > 0 ? (converted / totalPreRegistrations) * 100 : 0;

      // Calculate average approval time
      const approvedRegistrations = preRegistrations.filter(pr => pr.approvedAt);
      const averageApprovalTime = approvedRegistrations.length > 0
        ? approvedRegistrations.reduce((sum, pr) => {
            const approvalTime = pr.approvedAt!.getTime() - pr.createdAt.getTime();
            return sum + approvalTime;
          }, 0) / approvedRegistrations.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Group by purpose
      const purposeCounts = new Map<VisitorPurpose, number>();
      preRegistrations.forEach(pr => {
        const count = purposeCounts.get(pr.purpose) || 0;
        purposeCounts.set(pr.purpose, count + 1);
      });

      const byPurpose = Array.from(purposeCounts.entries()).map(([purpose, count]) => ({
        purpose,
        count,
      }));

      // Group by host
      const hostCounts = new Map<string, { name: string; count: number }>();
      preRegistrations.forEach(pr => {
        const hostId = pr.hostUserId;
        const existing = hostCounts.get(hostId) || {
          name: `${pr.host.firstName} ${pr.host.lastName}`,
          count: 0,
        };
        existing.count++;
        hostCounts.set(hostId, existing);
      });

      const byHost = Array.from(hostCounts.entries())
        .map(([hostId, data]) => ({
          hostId,
          hostName: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Upcoming visits (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingPreRegs = preRegistrations.filter(pr => 
        pr.status === PreRegistrationStatus.APPROVED &&
        pr.expectedArrival >= today &&
        pr.expectedArrival <= nextWeek
      );

      const dailyCounts = new Map<string, number>();
      upcomingPreRegs.forEach(pr => {
        const dateKey = pr.expectedArrival.toISOString().split('T')[0];
        const count = dailyCounts.get(dateKey) || 0;
        dailyCounts.set(dateKey, count + 1);
      });

      const upcomingVisits = Array.from(dailyCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalPreRegistrations,
        pendingApproval,
        approvedToday,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageApprovalTime: Math.round(averageApprovalTime * 100) / 100,
        byPurpose,
        byHost,
        upcomingVisits,
      };
    } catch (error) {
      logger.error('Failed to get pre-registration statistics', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // CLEANUP AND MAINTENANCE
  // ============================================================================

  async cleanupExpiredPreRegistrations(tenantId: string): Promise<number> {
    try {
      const now = new Date();
      
      const result = await prisma.visitorPreRegistration.updateMany({
        where: {
          tenantId,
          expiresAt: { lt: now },
          status: { in: [PreRegistrationStatus.PENDING, PreRegistrationStatus.APPROVED] },
        },
        data: {
          status: PreRegistrationStatus.EXPIRED,
        },
      });

      logger.info('Cleaned up expired pre-registrations', { tenantId, count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired pre-registrations', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildPreRegistrationWhereClause(tenantId: string, filters: PreRegistrationFilter): any {
    const whereClause: any = { tenantId };

    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    if (filters.hostUserId) {
      whereClause.hostUserId = filters.hostUserId;
    }

    if (filters.fromDate && filters.toDate) {
      whereClause.expectedArrival = {
        gte: filters.fromDate,
        lte: filters.toDate,
      };
    }

    if (filters.search) {
      whereClause.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.pendingOnly) {
      whereClause.status = PreRegistrationStatus.PENDING;
    }

    return whereClause;
  }

  private mapPreRegistrationToData(preReg: any): PreRegistrationData {
    return {
      id: preReg.id,
      firstName: preReg.firstName,
      lastName: preReg.lastName,
      email: preReg.email,
      phone: preReg.phone,
      company: preReg.company,
      jobTitle: preReg.jobTitle,
      hostUserId: preReg.hostUserId,
      hostName: `${preReg.host.firstName} ${preReg.host.lastName}`,
      hostEmail: preReg.host.email,
      expectedArrival: preReg.expectedArrival,
      expectedDuration: preReg.expectedDuration,
      purpose: preReg.purpose,
      purposeDetails: preReg.purposeDetails,
      meetingRoom: preReg.meetingRoom,
      isApproved: preReg.isApproved,
      approvedBy: preReg.approvedBy,
      approverName: preReg.approver ? `${preReg.approver.firstName} ${preReg.approver.lastName}` : undefined,
      approvedAt: preReg.approvedAt,
      approvalNotes: preReg.approvalNotes,
      accessZones: Array.isArray(preReg.accessZones) ? preReg.accessZones : [],
      parkingRequired: preReg.parkingRequired,
      parkingSpot: preReg.parkingSpot,
      invitationSent: preReg.invitationSent,
      invitationSentAt: preReg.invitationSentAt,
      reminderSent: preReg.reminderSent,
      requiresNDA: preReg.requiresNDA,
      requiresHealthCheck: preReg.requiresHealthCheck,
      customRequirements: Array.isArray(preReg.customRequirements) ? preReg.customRequirements : [],
      status: preReg.status,
      visitDate: preReg.visitDate,
      visitorId: preReg.visitorId,
      createdAt: preReg.createdAt,
      updatedAt: preReg.updatedAt,
      expiresAt: preReg.expiresAt,
    };
  }

  private generateInvitationContent(preRegistration: any, invitationData: InvitationRequest): string {
    // In production, this would use email templates
    return `
      Dear ${preRegistration.firstName} ${preRegistration.lastName},
      
      You have been invited to visit our coworking space.
      
      Visit Details:
      - Date: ${preRegistration.expectedArrival.toLocaleDateString()}
      - Time: ${preRegistration.expectedArrival.toLocaleTimeString()}
      - Host: ${preRegistration.host.firstName} ${preRegistration.host.lastName}
      - Purpose: ${preRegistration.purpose}
      
      ${invitationData.message || ''}
      
      Please bring a valid ID and arrive 10 minutes early for check-in.
      
      Best regards,
      The SweetSpot Team
    `;
  }
}

export const visitorPreRegistrationService = new VisitorPreRegistrationService();
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorPreRegistrationService = exports.VisitorPreRegistrationService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const visitorService_1 = require("./visitorService");
class VisitorPreRegistrationService {
    async createPreRegistration(tenantId, data) {
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            const initialStatus = data.autoApprove
                ? client_1.PreRegistrationStatus.APPROVED
                : client_1.PreRegistrationStatus.PENDING;
            const preRegistration = await prisma_1.prisma.$transaction(async (tx) => {
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
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: newPreReg.id,
                        action: client_1.VisitorAction.PRE_REGISTERED,
                        performedBy: data.hostUserId,
                        details: `Pre-registration created for ${data.firstName} ${data.lastName}`,
                    },
                });
                return newPreReg;
            });
            logger_1.logger.info('Pre-registration created successfully', {
                tenantId,
                preRegistrationId: preRegistration.id,
                email: data.email,
                host: data.hostUserId
            });
            return this.mapPreRegistrationToData(preRegistration);
        }
        catch (error) {
            logger_1.logger.error('Failed to create pre-registration', { tenantId, data }, error);
            throw error;
        }
    }
    async updatePreRegistration(tenantId, preRegistrationId, data) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.update({
                where: {
                    id: preRegistrationId,
                    tenantId,
                    status: { in: [client_1.PreRegistrationStatus.PENDING, client_1.PreRegistrationStatus.APPROVED] },
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
        }
        catch (error) {
            logger_1.logger.error('Failed to update pre-registration', { tenantId, preRegistrationId, data }, error);
            throw error;
        }
    }
    async deletePreRegistration(tenantId, preRegistrationId) {
        try {
            await prisma_1.prisma.visitorPreRegistration.update({
                where: {
                    id: preRegistrationId,
                    tenantId,
                    status: { notIn: [client_1.PreRegistrationStatus.CONVERTED] },
                },
                data: {
                    status: client_1.PreRegistrationStatus.CANCELLED,
                },
            });
            logger_1.logger.info('Pre-registration cancelled successfully', { tenantId, preRegistrationId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete pre-registration', { tenantId, preRegistrationId }, error);
            throw error;
        }
    }
    async getPreRegistrationById(tenantId, preRegistrationId) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.findFirst({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get pre-registration by ID', { tenantId, preRegistrationId }, error);
            throw error;
        }
    }
    async getPreRegistrations(tenantId, filters = {}, pagination = {}) {
        try {
            const whereClause = this.buildPreRegistrationWhereClause(tenantId, filters);
            const [preRegistrations, total] = await Promise.all([
                prisma_1.prisma.visitorPreRegistration.findMany({
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
                prisma_1.prisma.visitorPreRegistration.count({ where: whereClause }),
            ]);
            const preRegData = preRegistrations.map(preReg => this.mapPreRegistrationToData(preReg));
            const hasMore = (pagination.skip || 0) + preRegData.length < total;
            return {
                preRegistrations: preRegData,
                total,
                hasMore,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get pre-registrations', { tenantId, filters }, error);
            throw error;
        }
    }
    async getPendingApprovals(tenantId, hostUserId) {
        try {
            const whereClause = {
                tenantId,
                status: client_1.PreRegistrationStatus.PENDING,
            };
            if (hostUserId) {
                whereClause.hostUserId = hostUserId;
            }
            const preRegistrations = await prisma_1.prisma.visitorPreRegistration.findMany({
                where: whereClause,
                include: {
                    host: true,
                    approver: true,
                },
                orderBy: { expectedArrival: 'asc' },
            });
            return preRegistrations.map(preReg => this.mapPreRegistrationToData(preReg));
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending approvals', { tenantId, hostUserId }, error);
            throw error;
        }
    }
    async getUpcomingVisits(tenantId, hostUserId, days = 7) {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + days);
            const whereClause = {
                tenantId,
                status: client_1.PreRegistrationStatus.APPROVED,
                expectedArrival: {
                    gte: now,
                    lte: futureDate,
                },
            };
            if (hostUserId) {
                whereClause.hostUserId = hostUserId;
            }
            const preRegistrations = await prisma_1.prisma.visitorPreRegistration.findMany({
                where: whereClause,
                include: {
                    host: true,
                    approver: true,
                },
                orderBy: { expectedArrival: 'asc' },
            });
            return preRegistrations.map(preReg => this.mapPreRegistrationToData(preReg));
        }
        catch (error) {
            logger_1.logger.error('Failed to get upcoming visits', { tenantId, hostUserId, days }, error);
            throw error;
        }
    }
    async processApproval(tenantId, preRegistrationId, approverId, data) {
        try {
            const preRegistration = await prisma_1.prisma.$transaction(async (tx) => {
                const preReg = await tx.visitorPreRegistration.findFirst({
                    where: {
                        id: preRegistrationId,
                        tenantId,
                        status: client_1.PreRegistrationStatus.PENDING,
                    },
                });
                if (!preReg) {
                    throw new Error('Pre-registration not found or not pending approval');
                }
                const newStatus = data.approve
                    ? client_1.PreRegistrationStatus.APPROVED
                    : client_1.PreRegistrationStatus.CANCELLED;
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
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: preRegistrationId,
                        action: data.approve ? client_1.VisitorAction.APPROVED : client_1.VisitorAction.DENIED,
                        performedBy: approverId,
                        details: data.notes || (data.approve ? 'Pre-registration approved' : 'Pre-registration denied'),
                    },
                });
                return updatedPreReg;
            });
            logger_1.logger.info('Pre-registration approval processed', {
                tenantId,
                preRegistrationId,
                approved: data.approve,
                approverId
            });
            return this.mapPreRegistrationToData(preRegistration);
        }
        catch (error) {
            logger_1.logger.error('Failed to process approval', { tenantId, preRegistrationId, data }, error);
            throw error;
        }
    }
    async sendInvitation(tenantId, data) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.findFirst({
                where: {
                    id: data.preRegistrationId,
                    tenantId,
                    status: client_1.PreRegistrationStatus.APPROVED,
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
            await prisma_1.prisma.$transaction(async (tx) => {
                await tx.visitorPreRegistration.update({
                    where: { id: data.preRegistrationId },
                    data: {
                        invitationSent: true,
                        invitationSentAt: new Date(),
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: data.preRegistrationId,
                        action: client_1.VisitorAction.INVITATION_SENT,
                        details: 'Invitation email sent to visitor',
                    },
                });
            });
            const invitationContent = this.generateInvitationContent(preRegistration, data);
            logger_1.logger.info('Invitation sent successfully', {
                tenantId,
                preRegistrationId: data.preRegistrationId,
                email: preRegistration.email
            });
            return {
                success: true,
                message: 'Invitation sent successfully',
                invitationId: `inv_${data.preRegistrationId}`,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send invitation', { tenantId, data }, error);
            return {
                success: false,
                message: 'Failed to send invitation',
            };
        }
    }
    async sendReminder(tenantId, preRegistrationId) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.findFirst({
                where: {
                    id: preRegistrationId,
                    tenantId,
                    status: client_1.PreRegistrationStatus.APPROVED,
                    invitationSent: true,
                },
            });
            if (!preRegistration) {
                return {
                    success: false,
                    message: 'Pre-registration not found or not eligible for reminder',
                };
            }
            await prisma_1.prisma.$transaction(async (tx) => {
                await tx.visitorPreRegistration.update({
                    where: { id: preRegistrationId },
                    data: {
                        reminderSent: true,
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: preRegistrationId,
                        action: client_1.VisitorAction.HOST_NOTIFIED,
                        details: 'Reminder email sent to visitor',
                    },
                });
            });
            logger_1.logger.info('Reminder sent successfully', { tenantId, preRegistrationId });
            return {
                success: true,
                message: 'Reminder sent successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send reminder', { tenantId, preRegistrationId }, error);
            return {
                success: false,
                message: 'Failed to send reminder',
            };
        }
    }
    async convertToVisitor(tenantId, preRegistrationId, additionalData) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.findFirst({
                where: {
                    id: preRegistrationId,
                    tenantId,
                    status: client_1.PreRegistrationStatus.APPROVED,
                },
            });
            if (!preRegistration) {
                return {
                    success: false,
                    error: 'Pre-registration not found or not approved',
                };
            }
            const visitor = await visitorService_1.visitorService.createVisitor(tenantId, {
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
            logger_1.logger.info('Pre-registration converted to visitor', {
                tenantId,
                preRegistrationId,
                visitorId: visitor.id
            });
            return {
                success: true,
                visitor,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to convert pre-registration to visitor', { tenantId, preRegistrationId }, error);
            return {
                success: false,
                error: 'Conversion failed',
            };
        }
    }
    async getPreRegistrationStatistics(tenantId, startDate, endDate) {
        try {
            const preRegistrations = await prisma_1.prisma.visitorPreRegistration.findMany({
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
            const pendingApproval = preRegistrations.filter(pr => pr.status === client_1.PreRegistrationStatus.PENDING).length;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const approvedToday = preRegistrations.filter(pr => pr.status === client_1.PreRegistrationStatus.APPROVED &&
                pr.approvedAt &&
                pr.approvedAt >= today).length;
            const converted = preRegistrations.filter(pr => pr.status === client_1.PreRegistrationStatus.CONVERTED).length;
            const conversionRate = totalPreRegistrations > 0 ? (converted / totalPreRegistrations) * 100 : 0;
            const approvedRegistrations = preRegistrations.filter(pr => pr.approvedAt);
            const averageApprovalTime = approvedRegistrations.length > 0
                ? approvedRegistrations.reduce((sum, pr) => {
                    const approvalTime = pr.approvedAt.getTime() - pr.createdAt.getTime();
                    return sum + approvalTime;
                }, 0) / approvedRegistrations.length / (1000 * 60 * 60)
                : 0;
            const purposeCounts = new Map();
            preRegistrations.forEach(pr => {
                const count = purposeCounts.get(pr.purpose) || 0;
                purposeCounts.set(pr.purpose, count + 1);
            });
            const byPurpose = Array.from(purposeCounts.entries()).map(([purpose, count]) => ({
                purpose,
                count,
            }));
            const hostCounts = new Map();
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
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const upcomingPreRegs = preRegistrations.filter(pr => pr.status === client_1.PreRegistrationStatus.APPROVED &&
                pr.expectedArrival >= today &&
                pr.expectedArrival <= nextWeek);
            const dailyCounts = new Map();
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get pre-registration statistics', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
    async cleanupExpiredPreRegistrations(tenantId) {
        try {
            const now = new Date();
            const result = await prisma_1.prisma.visitorPreRegistration.updateMany({
                where: {
                    tenantId,
                    expiresAt: { lt: now },
                    status: { in: [client_1.PreRegistrationStatus.PENDING, client_1.PreRegistrationStatus.APPROVED] },
                },
                data: {
                    status: client_1.PreRegistrationStatus.EXPIRED,
                },
            });
            logger_1.logger.info('Cleaned up expired pre-registrations', { tenantId, count: result.count });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup expired pre-registrations', { tenantId }, error);
            throw error;
        }
    }
    buildPreRegistrationWhereClause(tenantId, filters) {
        const whereClause = { tenantId };
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
            whereClause.status = client_1.PreRegistrationStatus.PENDING;
        }
        return whereClause;
    }
    mapPreRegistrationToData(preReg) {
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
    generateInvitationContent(preRegistration, invitationData) {
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
exports.VisitorPreRegistrationService = VisitorPreRegistrationService;
exports.visitorPreRegistrationService = new VisitorPreRegistrationService();
//# sourceMappingURL=visitorPreRegistrationService.js.map
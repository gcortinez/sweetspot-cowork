"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorService = exports.VisitorService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class VisitorService {
    async createVisitor(tenantId, data) {
        try {
            const now = new Date();
            const validFrom = data.validFrom || now;
            const validUntil = data.validUntil || new Date(now.getTime() + 8 * 60 * 60 * 1000);
            const qrCode = this.generateQRCode();
            const visitor = await prisma_1.prisma.$transaction(async (tx) => {
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
                        status: client_1.VisitorStatus.APPROVED,
                    },
                    include: {
                        host: true,
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: newVisitor.id,
                        action: client_1.VisitorAction.PRE_REGISTERED,
                        performedBy: data.hostUserId,
                        details: `Visitor registered by host`,
                    },
                });
                if (data.preRegistrationId) {
                    await tx.visitorPreRegistration.update({
                        where: { id: data.preRegistrationId },
                        data: {
                            status: client_1.PreRegistrationStatus.CONVERTED,
                            visitDate: now,
                            visitorId: newVisitor.id,
                        },
                    });
                }
                return newVisitor;
            });
            return this.mapVisitorToData(visitor);
        }
        catch (error) {
            logger_1.logger.error('Failed to create visitor', { tenantId, data }, error);
            throw error;
        }
    }
    async updateVisitor(tenantId, visitorId, data) {
        try {
            const visitor = await prisma_1.prisma.visitor.update({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to update visitor', { tenantId, visitorId, data }, error);
            throw error;
        }
    }
    async deleteVisitor(tenantId, visitorId) {
        try {
            await prisma_1.prisma.$transaction(async (tx) => {
                await tx.visitor.update({
                    where: {
                        id: visitorId,
                        tenantId,
                    },
                    data: {
                        status: client_1.VisitorStatus.CANCELLED,
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId,
                        action: client_1.VisitorAction.DENIED,
                        details: 'Visitor registration cancelled',
                    },
                });
            });
            logger_1.logger.info('Visitor cancelled successfully', { tenantId, visitorId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete visitor', { tenantId, visitorId }, error);
            throw error;
        }
    }
    async getVisitorById(tenantId, visitorId) {
        try {
            const visitor = await prisma_1.prisma.visitor.findFirst({
                where: {
                    id: visitorId,
                    tenantId,
                },
                include: {
                    host: true,
                },
            });
            return visitor ? this.mapVisitorToData(visitor) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get visitor by ID', { tenantId, visitorId }, error);
            throw error;
        }
    }
    async getVisitorByQRCode(tenantId, qrCode) {
        try {
            const visitor = await prisma_1.prisma.visitor.findFirst({
                where: {
                    qrCode,
                    tenantId,
                },
                include: {
                    host: true,
                },
            });
            return visitor ? this.mapVisitorToData(visitor) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get visitor by QR code', { tenantId, qrCode }, error);
            throw error;
        }
    }
    async getVisitors(tenantId, filters = {}, pagination = {}) {
        try {
            const whereClause = this.buildVisitorWhereClause(tenantId, filters);
            const [visitors, total] = await Promise.all([
                prisma_1.prisma.visitor.findMany({
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
                prisma_1.prisma.visitor.count({ where: whereClause }),
            ]);
            const visitorData = visitors.map(visitor => this.mapVisitorToData(visitor));
            const hasMore = (pagination.skip || 0) + visitorData.length < total;
            return {
                visitors: visitorData,
                total,
                hasMore,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get visitors', { tenantId, filters }, error);
            throw error;
        }
    }
    async getTodaysVisitors(tenantId, hostUserId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const whereClause = {
                tenantId,
                validFrom: { lte: tomorrow },
                validUntil: { gte: today },
                status: { notIn: [client_1.VisitorStatus.CANCELLED, client_1.VisitorStatus.EXPIRED] },
            };
            if (hostUserId) {
                whereClause.hostUserId = hostUserId;
            }
            const visitors = await prisma_1.prisma.visitor.findMany({
                where: whereClause,
                include: {
                    host: true,
                },
                orderBy: { validFrom: 'asc' },
            });
            return visitors.map(visitor => this.mapVisitorToData(visitor));
        }
        catch (error) {
            logger_1.logger.error('Failed to get today\'s visitors', { tenantId, hostUserId }, error);
            throw error;
        }
    }
    async getActiveVisitors(tenantId) {
        try {
            const visitors = await prisma_1.prisma.visitor.findMany({
                where: {
                    tenantId,
                    status: client_1.VisitorStatus.CHECKED_IN,
                },
                include: {
                    host: true,
                },
                orderBy: { checkedInAt: 'desc' },
            });
            return visitors.map(visitor => this.mapVisitorToData(visitor));
        }
        catch (error) {
            logger_1.logger.error('Failed to get active visitors', { tenantId }, error);
            throw error;
        }
    }
    async checkInVisitor(tenantId, data) {
        try {
            const now = new Date();
            const visitor = await prisma_1.prisma.$transaction(async (tx) => {
                const existingVisitor = await tx.visitor.findFirst({
                    where: {
                        id: data.visitorId,
                        tenantId,
                        status: { in: [client_1.VisitorStatus.APPROVED, client_1.VisitorStatus.PENDING] },
                    },
                    include: {
                        host: true,
                    },
                });
                if (!existingVisitor) {
                    throw new Error('Visitor not found or not eligible for check-in');
                }
                if (now < existingVisitor.validFrom || now > existingVisitor.validUntil) {
                    throw new Error('Visitor check-in outside valid time window');
                }
                const updatedVisitor = await tx.visitor.update({
                    where: { id: data.visitorId },
                    data: {
                        status: client_1.VisitorStatus.CHECKED_IN,
                        checkedInAt: now,
                        photoUrl: data.photoUrl || existingVisitor.photoUrl,
                        badgeNumber: data.badgeNumber,
                        healthDeclaration: data.healthDeclaration || existingVisitor.healthDeclaration,
                        termsAccepted: data.termsAccepted || existingVisitor.termsAccepted,
                        dataConsent: data.dataConsent || existingVisitor.dataConsent,
                        ndaSigned: data.ndaSigned || existingVisitor.ndaSigned,
                    },
                    include: {
                        host: true,
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: data.visitorId,
                        action: client_1.VisitorAction.CHECKED_IN,
                        location: data.checkInLocation,
                        details: `Checked in at ${data.checkInLocation || 'main entrance'}`,
                    },
                });
                if (data.badgeNumber) {
                    await tx.visitorBadge.create({
                        data: {
                            tenantId,
                            visitorId: data.visitorId,
                            badgeNumber: data.badgeNumber,
                            printedBy: existingVisitor.hostUserId,
                        },
                    });
                    await tx.visitorLog.create({
                        data: {
                            tenantId,
                            visitorId: data.visitorId,
                            action: client_1.VisitorAction.BADGE_PRINTED,
                            details: `Badge ${data.badgeNumber} issued`,
                        },
                    });
                }
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: data.visitorId,
                        action: client_1.VisitorAction.HOST_NOTIFIED,
                        details: `Host notified of visitor arrival`,
                    },
                });
                return updatedVisitor;
            });
            logger_1.logger.info('Visitor checked in successfully', { tenantId, visitorId: data.visitorId });
            return this.mapVisitorToData(visitor);
        }
        catch (error) {
            logger_1.logger.error('Failed to check in visitor', { tenantId, data }, error);
            throw error;
        }
    }
    async checkOutVisitor(tenantId, data) {
        try {
            const now = new Date();
            const visitor = await prisma_1.prisma.$transaction(async (tx) => {
                const existingVisitor = await tx.visitor.findFirst({
                    where: {
                        id: data.visitorId,
                        tenantId,
                        status: client_1.VisitorStatus.CHECKED_IN,
                    },
                    include: {
                        host: true,
                    },
                });
                if (!existingVisitor) {
                    throw new Error('Visitor not found or not checked in');
                }
                const actualDuration = existingVisitor.checkedInAt
                    ? Math.floor((now.getTime() - existingVisitor.checkedInAt.getTime()) / (1000 * 60))
                    : 0;
                const updatedVisitor = await tx.visitor.update({
                    where: { id: data.visitorId },
                    data: {
                        status: client_1.VisitorStatus.CHECKED_OUT,
                        checkedOutAt: now,
                        actualDuration,
                    },
                    include: {
                        host: true,
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId: data.visitorId,
                        action: client_1.VisitorAction.CHECKED_OUT,
                        location: data.checkOutLocation,
                        details: `Checked out at ${data.checkOutLocation || 'main entrance'}`,
                        metadata: { actualDuration, notes: data.notes },
                    },
                });
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
                                returnedTo: existingVisitor.hostUserId,
                            },
                        });
                        await tx.visitorLog.create({
                            data: {
                                tenantId,
                                visitorId: data.visitorId,
                                action: client_1.VisitorAction.BADGE_RETURNED,
                                details: `Badge ${existingVisitor.badgeNumber} returned`,
                            },
                        });
                    }
                }
                return updatedVisitor;
            });
            logger_1.logger.info('Visitor checked out successfully', { tenantId, visitorId: data.visitorId });
            return this.mapVisitorToData(visitor);
        }
        catch (error) {
            logger_1.logger.error('Failed to check out visitor', { tenantId, data }, error);
            throw error;
        }
    }
    async extendVisitorStay(tenantId, visitorId, newValidUntil, reason) {
        try {
            const visitor = await prisma_1.prisma.$transaction(async (tx) => {
                const updatedVisitor = await tx.visitor.update({
                    where: {
                        id: visitorId,
                        tenantId,
                        status: { in: [client_1.VisitorStatus.APPROVED, client_1.VisitorStatus.CHECKED_IN] },
                    },
                    data: {
                        validUntil: newValidUntil,
                    },
                    include: {
                        host: true,
                    },
                });
                await tx.visitorLog.create({
                    data: {
                        tenantId,
                        visitorId,
                        action: client_1.VisitorAction.EXTENDED_STAY,
                        details: reason || 'Visit extended',
                        metadata: { newValidUntil: newValidUntil.toISOString() },
                    },
                });
                return updatedVisitor;
            });
            logger_1.logger.info('Visitor stay extended', { tenantId, visitorId, newValidUntil });
            return this.mapVisitorToData(visitor);
        }
        catch (error) {
            logger_1.logger.error('Failed to extend visitor stay', { tenantId, visitorId }, error);
            throw error;
        }
    }
    async getVisitorStatistics(tenantId, startDate, endDate) {
        try {
            const visitors = await prisma_1.prisma.visitor.findMany({
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
            const activeVisitors = visitors.filter(v => v.status === client_1.VisitorStatus.CHECKED_IN).length;
            const todaysVisitors = visitors.filter(v => v.createdAt >= today).length;
            const completedVisits = visitors.filter(v => v.actualDuration);
            const averageVisitDuration = completedVisits.length > 0
                ? completedVisits.reduce((sum, v) => sum + (v.actualDuration || 0), 0) / completedVisits.length
                : 0;
            const purposeCounts = new Map();
            visitors.forEach(v => {
                const count = purposeCounts.get(v.purpose) || 0;
                purposeCounts.set(v.purpose, count + 1);
            });
            const byPurpose = Array.from(purposeCounts.entries()).map(([purpose, count]) => ({
                purpose,
                count,
                percentage: totalVisitors > 0 ? (count / totalVisitors) * 100 : 0,
            }));
            const statusCounts = new Map();
            visitors.forEach(v => {
                const count = statusCounts.get(v.status) || 0;
                statusCounts.set(v.status, count + 1);
            });
            const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
                status,
                count,
            }));
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
            const hostCounts = new Map();
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get visitor statistics', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
    async getVisitorHistory(tenantId, visitorId) {
        try {
            const logs = await prisma_1.prisma.visitorLog.findMany({
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
                location: log.location,
                details: log.details,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get visitor history', { tenantId, visitorId }, error);
            throw error;
        }
    }
    buildVisitorWhereClause(tenantId, filters) {
        const whereClause = { tenantId };
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
                notIn: [client_1.VisitorStatus.EXPIRED, client_1.VisitorStatus.CANCELLED],
            };
        }
        return whereClause;
    }
    mapVisitorToData(visitor) {
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
    async updateExpiredVisitors(tenantId) {
        try {
            const now = new Date();
            const result = await prisma_1.prisma.visitor.updateMany({
                where: {
                    tenantId,
                    validUntil: { lt: now },
                    status: { notIn: [client_1.VisitorStatus.CHECKED_OUT, client_1.VisitorStatus.CANCELLED, client_1.VisitorStatus.EXPIRED] },
                },
                data: {
                    status: client_1.VisitorStatus.EXPIRED,
                },
            });
            logger_1.logger.info('Updated expired visitors', { tenantId, count: result.count });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to update expired visitors', { tenantId }, error);
            throw error;
        }
    }
    async createPreRegistration(tenantId, userId, request) {
        try {
            const expiresAt = new Date(request.expectedArrival);
            expiresAt.setDate(expiresAt.getDate() + 7);
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.create({
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
                    status: client_1.PreRegistrationStatus.PENDING,
                    expiresAt
                }
            });
            await this.sendNotification(tenantId, {
                type: client_1.NotificationType.PRE_REGISTRATION_REQUEST,
                recipientId: request.hostUserId,
                preRegistrationId: preRegistration.id,
                title: 'New Visitor Pre-Registration',
                message: `${request.firstName} ${request.lastName} has requested to visit on ${request.expectedArrival.toLocaleDateString()}`,
                urgency: client_1.NotificationUrgency.NORMAL
            });
            logger_1.logger.info('Pre-registration created', {
                tenantId,
                preRegistrationId: preRegistration.id,
                hostUserId: request.hostUserId
            });
            return this.mapPreRegistrationToData(preRegistration);
        }
        catch (error) {
            logger_1.logger.error('Failed to create pre-registration', { tenantId }, error);
            throw error;
        }
    }
    async approvePreRegistration(tenantId, preRegistrationId, userId, approvalNotes) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.update({
                where: { id: preRegistrationId, tenantId },
                data: {
                    isApproved: true,
                    approvedBy: userId,
                    approvedAt: new Date(),
                    approvalNotes,
                    status: client_1.PreRegistrationStatus.APPROVED
                }
            });
            await this.sendNotification(tenantId, {
                type: client_1.NotificationType.PRE_REGISTRATION_APPROVED,
                recipientId: preRegistration.hostUserId,
                preRegistrationId: preRegistration.id,
                title: 'Visitor Pre-Registration Approved',
                message: `${preRegistration.firstName} ${preRegistration.lastName} has been approved for visit`,
                urgency: client_1.NotificationUrgency.NORMAL
            });
            if (preRegistration.email) {
                await this.sendVisitorInvitation(tenantId, preRegistration.id);
            }
            logger_1.logger.info('Pre-registration approved', {
                tenantId,
                preRegistrationId,
                approvedBy: userId
            });
            return this.mapPreRegistrationToData(preRegistration);
        }
        catch (error) {
            logger_1.logger.error('Failed to approve pre-registration', {
                tenantId,
                preRegistrationId
            }, error);
            throw error;
        }
    }
    async convertPreRegistrationToVisitor(tenantId, preRegistrationId, userId) {
        try {
            const preRegistration = await prisma_1.prisma.visitorPreRegistration.findFirst({
                where: { id: preRegistrationId, tenantId, isApproved: true }
            });
            if (!preRegistration) {
                throw new Error('Pre-registration not found or not approved');
            }
            const validFrom = new Date();
            const validUntil = new Date(preRegistration.expectedArrival);
            if (preRegistration.expectedDuration) {
                validUntil.setMinutes(validUntil.getMinutes() + preRegistration.expectedDuration);
            }
            else {
                validUntil.setHours(validUntil.getHours() + 8);
            }
            const visitor = await this.createVisitor(tenantId, {
                firstName: preRegistration.firstName,
                lastName: preRegistration.lastName,
                email: preRegistration.email,
                phone: preRegistration.phone,
                company: preRegistration.company,
                jobTitle: preRegistration.jobTitle,
                purpose: preRegistration.purpose,
                purposeDetails: preRegistration.purposeDetails,
                hostUserId: preRegistration.hostUserId,
                expectedDuration: preRegistration.expectedDuration,
                validFrom,
                validUntil,
                accessZones: preRegistration.accessZones,
                meetingRoom: preRegistration.meetingRoom,
                preRegistrationId: preRegistration.id
            });
            await prisma_1.prisma.visitorPreRegistration.update({
                where: { id: preRegistrationId },
                data: {
                    status: client_1.PreRegistrationStatus.CONVERTED,
                    visitDate: new Date(),
                    visitorId: visitor.id
                }
            });
            logger_1.logger.info('Pre-registration converted to visitor', {
                tenantId,
                preRegistrationId,
                visitorId: visitor.id
            });
            return visitor;
        }
        catch (error) {
            logger_1.logger.error('Failed to convert pre-registration', {
                tenantId,
                preRegistrationId
            }, error);
            throw error;
        }
    }
    async generateAccessCode(tenantId, userId, request) {
        try {
            const code = this.generateAlphanumericCode();
            const accessCode = await prisma_1.prisma.visitorAccessCode.create({
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
                    status: client_1.CodeStatus.ACTIVE
                }
            });
            if (request.visitorId) {
                const visitor = await prisma_1.prisma.visitor.findUnique({
                    where: { id: request.visitorId }
                });
                if (visitor) {
                    await this.sendNotification(tenantId, {
                        type: client_1.NotificationType.ACCESS_CODE_GENERATED,
                        recipientId: visitor.hostUserId,
                        visitorId: visitor.id,
                        title: 'Access Code Generated',
                        message: `Access code ${code} generated for ${visitor.firstName} ${visitor.lastName}`,
                        urgency: client_1.NotificationUrgency.NORMAL
                    });
                }
            }
            logger_1.logger.info('Access code generated', {
                tenantId,
                accessCodeId: accessCode.id,
                visitorId: request.visitorId
            });
            return this.mapAccessCodeToData(accessCode);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate access code', { tenantId }, error);
            throw error;
        }
    }
    async validateAccessCode(tenantId, code, location, ipAddress) {
        try {
            const accessCode = await prisma_1.prisma.visitorAccessCode.findFirst({
                where: { tenantId, code, isActive: true }
            });
            if (!accessCode) {
                return { valid: false, reason: 'Access code not found' };
            }
            if (accessCode.expiresAt < new Date()) {
                await this.deactivateAccessCode(tenantId, accessCode.id, 'EXPIRED');
                return { valid: false, reason: 'Access code expired' };
            }
            if (accessCode.maxUses && accessCode.currentUses >= accessCode.maxUses) {
                await this.deactivateAccessCode(tenantId, accessCode.id, 'USED_UP');
                return { valid: false, reason: 'Access code usage limit reached' };
            }
            if (ipAddress && accessCode.ipRestrictions) {
                const allowedIPs = accessCode.ipRestrictions;
                if (allowedIPs.length > 0 && !allowedIPs.includes(ipAddress)) {
                    return { valid: false, reason: 'IP address not allowed' };
                }
            }
            if (accessCode.timeRestrictions) {
                const restrictions = accessCode.timeRestrictions;
                if (!this.checkTimeRestrictions(restrictions)) {
                    return { valid: false, reason: 'Access not allowed at this time' };
                }
            }
            return { valid: true, accessCode: this.mapAccessCodeToData(accessCode) };
        }
        catch (error) {
            logger_1.logger.error('Failed to validate access code', { tenantId, code }, error);
            return { valid: false, reason: 'Validation error' };
        }
    }
    async useAccessCode(tenantId, code, usedBy, visitorId, location, ipAddress, deviceInfo) {
        try {
            const validation = await this.validateAccessCode(tenantId, code, location, ipAddress);
            if (!validation.valid) {
                const accessCode = await prisma_1.prisma.visitorAccessCode.findFirst({
                    where: { tenantId, code }
                });
                if (accessCode) {
                    await prisma_1.prisma.accessCodeUsage.create({
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
            const accessCode = validation.accessCode;
            await prisma_1.prisma.accessCodeUsage.create({
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
            await prisma_1.prisma.visitorAccessCode.update({
                where: { id: accessCode.id },
                data: {
                    currentUses: { increment: 1 },
                    lastUsedAt: new Date(),
                    lastUsedBy: usedBy || visitorId,
                    lastUsedLocation: location
                }
            });
            logger_1.logger.info('Access code used successfully', {
                tenantId,
                accessCodeId: accessCode.id,
                location
            });
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Failed to use access code', { tenantId, code }, error);
            return { success: false, reason: 'Usage error' };
        }
    }
    async sendNotification(tenantId, notification) {
        try {
            await prisma_1.prisma.visitorNotification.create({
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
                    deliveryMethod: client_1.DeliveryMethod.IN_APP,
                    channels: ['in_app'],
                    status: client_1.NotificationStatus.PENDING
                }
            });
            logger_1.logger.info('Notification sent', {
                tenantId,
                type: notification.type,
                recipientId: notification.recipientId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send notification', { tenantId }, error);
        }
    }
    async sendVisitorInvitation(tenantId, preRegistrationId) {
        try {
            await prisma_1.prisma.visitorPreRegistration.update({
                where: { id: preRegistrationId },
                data: {
                    invitationSent: true,
                    invitationSentAt: new Date()
                }
            });
            logger_1.logger.info('Visitor invitation sent', { tenantId, preRegistrationId });
        }
        catch (error) {
            logger_1.logger.error('Failed to send visitor invitation', {
                tenantId,
                preRegistrationId
            }, error);
        }
    }
    generateQRCode() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    generateAlphanumericCode(length = 6) {
        const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    checkTimeRestrictions(restrictions) {
        if (!restrictions || Object.keys(restrictions).length === 0) {
            return true;
        }
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay();
        if (restrictions.allowedDays && restrictions.allowedDays.length > 0) {
            if (!restrictions.allowedDays.includes(currentDay)) {
                return false;
            }
        }
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
    async deactivateAccessCode(tenantId, accessCodeId, reason) {
        try {
            await prisma_1.prisma.visitorAccessCode.update({
                where: { id: accessCodeId },
                data: {
                    isActive: false,
                    status: reason,
                    deactivatedAt: new Date(),
                    deactivationReason: reason
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to deactivate access code', {
                tenantId,
                accessCodeId
            }, error);
        }
    }
    mapPreRegistrationToData(preRegistration) {
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
    mapAccessCodeToData(accessCode) {
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
exports.VisitorService = VisitorService;
exports.visitorService = new VisitorService();
//# sourceMappingURL=visitorService.js.map
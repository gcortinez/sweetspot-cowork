"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrCodeService = exports.QRCodeService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const bookingManagementService_1 = require("./bookingManagementService");
class QRCodeService {
    async generateBookingQRCode(tenantId, bookingId, options = {}) {
        try {
            const booking = await prisma_1.prisma.booking.findFirst({
                where: {
                    id: bookingId,
                    tenantId,
                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.CHECKED_IN] },
                },
                include: {
                    space: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            if (!booking) {
                throw new Error('Booking not found or not confirmed');
            }
            const now = new Date();
            const validFrom = new Date(Math.max(now.getTime(), booking.startTime.getTime() - 15 * 60 * 1000));
            const validUntil = options.validityMinutes
                ? new Date(now.getTime() + options.validityMinutes * 60 * 1000)
                : new Date(booking.endTime.getTime() + 30 * 60 * 1000);
            const qrCodeData = {
                type: 'BOOKING_ACCESS',
                bookingId: booking.id,
                spaceId: booking.spaceId,
                userId: booking.userId,
                tenantId,
                timestamp: now.toISOString(),
                ...(options.includeMachineName && { machineName: process.env.HOSTNAME || 'unknown' }),
            };
            const qrCodeString = `sweetspot://booking/${booking.id}?data=${Buffer.from(JSON.stringify(qrCodeData)).toString('base64')}`;
            const qrCode = await prisma_1.prisma.qRCode.create({
                data: {
                    tenantId,
                    userId: booking.userId,
                    spaceId: booking.spaceId,
                    type: client_1.QRCodeType.ROOM_ACCESS,
                    code: qrCodeString,
                    data: JSON.stringify(qrCodeData),
                    expiresAt: validUntil,
                    maxUsage: options.maxUsage || 10,
                    isActive: true,
                },
            });
            const existingCheckIn = await prisma_1.prisma.roomCheckIn.findFirst({
                where: {
                    bookingId: booking.id,
                    checkedOutAt: null,
                },
            });
            const canCheckIn = !existingCheckIn && now >= validFrom && now <= booking.endTime;
            const canCheckOut = !!existingCheckIn && now <= validUntil;
            const isExpired = now > validUntil;
            return {
                bookingId: booking.id,
                spaceId: booking.spaceId,
                spaceName: booking.space.name,
                userId: booking.userId,
                startTime: booking.startTime,
                endTime: booking.endTime,
                qrCode: qrCodeString,
                qrCodeUrl: `data:text/plain;base64,${Buffer.from(qrCodeString).toString('base64')}`,
                validFrom,
                validUntil,
                canCheckIn,
                canCheckOut,
                isExpired,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate booking QR code', { tenantId, bookingId, options }, error);
            throw error;
        }
    }
    async generateSpaceAccessQRCode(tenantId, spaceId, userId, validityHours = 24) {
        try {
            const space = await prisma_1.prisma.space.findFirst({
                where: { id: spaceId, tenantId, isActive: true },
            });
            if (!space) {
                throw new Error('Space not found or not active');
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId, tenantId },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const now = new Date();
            const expiresAt = new Date(now.getTime() + validityHours * 60 * 60 * 1000);
            const qrCodeData = {
                type: 'SPACE_ACCESS',
                spaceId: space.id,
                userId: user.id,
                tenantId,
                timestamp: now.toISOString(),
            };
            const qrCodeString = `sweetspot://space/${space.id}?data=${Buffer.from(JSON.stringify(qrCodeData)).toString('base64')}`;
            await prisma_1.prisma.qRCode.create({
                data: {
                    tenantId,
                    userId: user.id,
                    spaceId: space.id,
                    type: client_1.QRCodeType.ROOM_ACCESS,
                    code: qrCodeString,
                    data: JSON.stringify(qrCodeData),
                    expiresAt,
                    maxUsage: 50,
                    isActive: true,
                },
            });
            return qrCodeString;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate space access QR code', { tenantId, spaceId, userId }, error);
            throw error;
        }
    }
    async validateQRCode(qrCodeString) {
        try {
            const validation = {
                isValid: false,
                errors: [],
                warnings: [],
                context: {
                    canCheckIn: false,
                    canCheckOut: false,
                    isExpired: false,
                },
            };
            let qrCodeData;
            try {
                if (qrCodeString.startsWith('sweetspot://booking/')) {
                    const match = qrCodeString.match(/sweetspot:\/\/booking\/([^?]+)\?data=(.+)/);
                    if (!match)
                        throw new Error('Invalid QR code format');
                    const bookingId = match[1];
                    const encodedData = match[2];
                    qrCodeData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
                    qrCodeData.bookingId = bookingId;
                }
                else if (qrCodeString.startsWith('sweetspot://space/')) {
                    const match = qrCodeString.match(/sweetspot:\/\/space\/([^?]+)\?data=(.+)/);
                    if (!match)
                        throw new Error('Invalid QR code format');
                    const spaceId = match[1];
                    const encodedData = match[2];
                    qrCodeData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
                    qrCodeData.spaceId = spaceId;
                }
                else {
                    throw new Error('Unrecognized QR code format');
                }
            }
            catch (error) {
                validation.errors.push('Invalid QR code format or corrupted data');
                return validation;
            }
            const dbQRCode = await prisma_1.prisma.qRCode.findFirst({
                where: {
                    code: qrCodeString,
                    isActive: true,
                },
            });
            if (!dbQRCode) {
                validation.errors.push('QR code not found or deactivated');
                return validation;
            }
            validation.qrCodeData = {
                id: dbQRCode.id,
                type: dbQRCode.type,
                data: dbQRCode.data,
                metadata: qrCodeData,
                expiresAt: dbQRCode.expiresAt || undefined,
                isActive: dbQRCode.isActive,
                usageCount: dbQRCode.usageCount,
                maxUsage: dbQRCode.maxUsage || undefined,
            };
            const now = new Date();
            if (dbQRCode.expiresAt && now > dbQRCode.expiresAt) {
                validation.context.isExpired = true;
                validation.errors.push('QR code has expired');
                return validation;
            }
            if (dbQRCode.maxUsage && dbQRCode.usageCount >= dbQRCode.maxUsage) {
                validation.errors.push('QR code usage limit exceeded');
                return validation;
            }
            if (qrCodeData.type === 'BOOKING_ACCESS' && qrCodeData.bookingId) {
                const booking = await prisma_1.prisma.booking.findFirst({
                    where: {
                        id: qrCodeData.bookingId,
                        tenantId: qrCodeData.tenantId,
                    },
                    include: {
                        space: true,
                        user: true,
                        checkIns: {
                            where: { checkedOutAt: null },
                            take: 1,
                        },
                    },
                });
                if (!booking) {
                    validation.errors.push('Associated booking not found');
                    return validation;
                }
                if (booking.status === client_1.BookingStatus.CANCELLED) {
                    validation.errors.push('Booking has been cancelled');
                    return validation;
                }
                validation.booking = booking;
                validation.space = booking.space;
                validation.user = booking.user;
                const gracePeriod = 15;
                const checkInWindow = new Date(booking.startTime.getTime() - gracePeriod * 60 * 1000);
                const checkOutWindow = new Date(booking.endTime.getTime() + 30 * 60 * 1000);
                const isWithinCheckInWindow = now >= checkInWindow && now <= booking.endTime;
                const isWithinCheckOutWindow = now <= checkOutWindow;
                const hasActiveCheckIn = booking.checkIns.length > 0;
                validation.context.canCheckIn = isWithinCheckInWindow && !hasActiveCheckIn;
                validation.context.canCheckOut = isWithinCheckOutWindow && hasActiveCheckIn;
                validation.context.gracePeriod = gracePeriod;
                validation.context.remainingTime = Math.max(0, Math.floor((booking.endTime.getTime() - now.getTime()) / (60 * 1000)));
                if (now < checkInWindow) {
                    validation.warnings.push(`Check-in available from ${checkInWindow.toLocaleTimeString()}`);
                }
                else if (now > checkOutWindow) {
                    validation.errors.push('Check-in/out window has expired');
                    return validation;
                }
                if (!validation.context.canCheckIn && !validation.context.canCheckOut) {
                    if (hasActiveCheckIn) {
                        validation.warnings.push('Already checked in. Scan again to check out.');
                    }
                    else {
                        validation.errors.push('Not within valid check-in/out time window');
                        return validation;
                    }
                }
            }
            validation.isValid = true;
            return validation;
        }
        catch (error) {
            logger_1.logger.error('Failed to validate QR code', { qrCodeString }, error);
            return {
                isValid: false,
                errors: ['QR code validation failed due to system error'],
                warnings: [],
                context: {
                    canCheckIn: false,
                    canCheckOut: false,
                    isExpired: false,
                },
            };
        }
    }
    async processQRCheckIn(tenantId, qrCodeString, userId, additionalData) {
        try {
            const validation = await this.validateQRCode(qrCodeString);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Invalid QR code',
                    validationErrors: validation.errors,
                };
            }
            if (!validation.context.canCheckIn) {
                return {
                    success: false,
                    error: 'Check-in not allowed at this time',
                    validationErrors: validation.errors.concat(validation.warnings),
                };
            }
            if (!validation.booking) {
                return {
                    success: false,
                    error: 'No booking associated with QR code',
                };
            }
            if (validation.booking.userId !== userId) {
                return {
                    success: false,
                    error: 'QR code belongs to a different user',
                };
            }
            const checkIn = await bookingManagementService_1.bookingManagementService.checkIn(tenantId, {
                bookingId: validation.booking.id,
                userId,
                qrCodeUsed: qrCodeString,
                notes: additionalData?.notes,
            });
            await prisma_1.prisma.qRCode.update({
                where: { id: validation.qrCodeData.id },
                data: { usageCount: { increment: 1 } },
            });
            await prisma_1.prisma.qRCodeScan.create({
                data: {
                    tenantId,
                    qrCodeId: validation.qrCodeData.id,
                    userId,
                    spaceId: validation.booking.spaceId,
                    scanType: 'CHECK_IN',
                    success: true,
                    metadata: additionalData || {},
                },
            });
            return {
                success: true,
                checkIn: {
                    id: checkIn.id,
                    bookingId: checkIn.bookingId,
                    userId: checkIn.userId,
                    spaceId: checkIn.spaceId,
                    spaceName: checkIn.space.name,
                    checkedInAt: checkIn.checkedInAt,
                    validUntil: new Date(validation.booking.endTime.getTime() + 30 * 60 * 1000),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process QR check-in', { tenantId, userId }, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Check-in failed',
            };
        }
    }
    async processQRCheckOut(tenantId, qrCodeString, userId, additionalData) {
        try {
            const validation = await this.validateQRCode(qrCodeString);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'Invalid QR code',
                };
            }
            if (!validation.context.canCheckOut) {
                return {
                    success: false,
                    error: 'Check-out not allowed at this time',
                };
            }
            if (!validation.booking) {
                return {
                    success: false,
                    error: 'No booking associated with QR code',
                };
            }
            const activeCheckIn = await prisma_1.prisma.roomCheckIn.findFirst({
                where: {
                    bookingId: validation.booking.id,
                    userId,
                    checkedOutAt: null,
                },
            });
            if (!activeCheckIn) {
                return {
                    success: false,
                    error: 'No active check-in found',
                };
            }
            const checkOut = await bookingManagementService_1.bookingManagementService.checkOut(tenantId, {
                checkInId: activeCheckIn.id,
                actualEndTime: additionalData?.actualEndTime,
                notes: additionalData?.notes,
            });
            const actualDuration = Math.floor((checkOut.checkedOutAt.getTime() - checkOut.checkedInAt.getTime()) / (60 * 1000));
            const scheduledDuration = Math.floor((validation.booking.endTime.getTime() - validation.booking.startTime.getTime()) / (60 * 1000));
            const overtime = actualDuration - scheduledDuration;
            await prisma_1.prisma.qRCode.update({
                where: { id: validation.qrCodeData.id },
                data: { usageCount: { increment: 1 } },
            });
            await prisma_1.prisma.qRCodeScan.create({
                data: {
                    tenantId,
                    qrCodeId: validation.qrCodeData.id,
                    userId,
                    spaceId: validation.booking.spaceId,
                    scanType: 'CHECK_OUT',
                    success: true,
                    metadata: {
                        ...additionalData,
                        actualDuration,
                        scheduledDuration,
                        overtime,
                    },
                },
            });
            return {
                success: true,
                checkOut: {
                    id: checkOut.id,
                    checkInId: activeCheckIn.id,
                    checkedOutAt: checkOut.checkedOutAt,
                    actualDuration,
                    scheduledDuration,
                    overtime,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process QR check-out', { tenantId, userId }, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Check-out failed',
            };
        }
    }
    async deactivateQRCode(tenantId, qrCodeId) {
        try {
            return await prisma_1.prisma.qRCode.update({
                where: {
                    id: qrCodeId,
                    tenantId,
                },
                data: {
                    isActive: false,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to deactivate QR code', { tenantId, qrCodeId }, error);
            throw error;
        }
    }
    async getQRCodeUsageHistory(tenantId, qrCodeId) {
        try {
            return await prisma_1.prisma.qRCodeScan.findMany({
                where: {
                    tenantId,
                    qrCodeId,
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    space: {
                        select: {
                            name: true,
                            type: true,
                        },
                    },
                },
                orderBy: { timestamp: 'desc' },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get QR code usage history', { tenantId, qrCodeId }, error);
            throw error;
        }
    }
    async generateQRCodeAnalytics(tenantId, startDate, endDate) {
        try {
            const scans = await prisma_1.prisma.qRCodeScan.findMany({
                where: {
                    tenantId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    space: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            const totalScans = scans.length;
            const successfulScans = scans.filter(scan => scan.success).length;
            const failedScans = totalScans - successfulScans;
            const successRate = totalScans > 0 ? successfulScans / totalScans : 0;
            const scansByType = {};
            scans.forEach(scan => {
                scansByType[scan.scanType] = (scansByType[scan.scanType] || 0) + 1;
            });
            const spaceScans = new Map();
            scans.forEach(scan => {
                if (scan.spaceId) {
                    const key = scan.spaceId;
                    if (!spaceScans.has(key)) {
                        spaceScans.set(key, { name: scan.space?.name || 'Unknown', count: 0 });
                    }
                    spaceScans.get(key).count++;
                }
            });
            const scansBySpace = Array.from(spaceScans.entries()).map(([spaceId, data]) => ({
                spaceId,
                spaceName: data.name,
                scans: data.count,
            }));
            const hourlyScans = new Array(24).fill(0);
            scans.forEach(scan => {
                const hour = scan.timestamp.getHours();
                hourlyScans[hour]++;
            });
            const scansByHour = hourlyScans.map((count, hour) => ({ hour, scans: count }));
            const userScans = new Map();
            scans.forEach(scan => {
                if (scan.userId) {
                    const key = scan.userId;
                    if (!userScans.has(key)) {
                        const name = scan.user ? `${scan.user.firstName} ${scan.user.lastName}` : 'Unknown';
                        userScans.set(key, { name, count: 0 });
                    }
                    userScans.get(key).count++;
                }
            });
            const topUsers = Array.from(userScans.entries())
                .map(([userId, data]) => ({
                userId,
                userName: data.name,
                scans: data.count,
            }))
                .sort((a, b) => b.scans - a.scans)
                .slice(0, 10);
            return {
                totalScans,
                successfulScans,
                failedScans,
                successRate,
                scansByType,
                scansBySpace,
                scansByHour,
                topUsers,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate QR code analytics', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
}
exports.QRCodeService = QRCodeService;
exports.qrCodeService = new QRCodeService();
//# sourceMappingURL=qrCodeService.js.map
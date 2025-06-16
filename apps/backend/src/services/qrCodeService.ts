import { prisma } from '../lib/prisma';
import { QRCodeType, BookingStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { bookingManagementService } from './bookingManagementService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface QRCodeData {
  id: string;
  type: QRCodeType;
  data: string;
  metadata: Record<string, any>;
  expiresAt?: Date;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}

export interface BookingQRCode {
  bookingId: string;
  spaceId: string;
  spaceName: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  qrCode: string;
  qrCodeUrl: string;
  validFrom: Date;
  validUntil: Date;
  canCheckIn: boolean;
  canCheckOut: boolean;
  isExpired: boolean;
}

export interface QRCheckInResult {
  success: boolean;
  checkIn?: {
    id: string;
    bookingId: string;
    userId: string;
    spaceId: string;
    spaceName: string;
    checkedInAt: Date;
    validUntil: Date;
  };
  error?: string;
  validationErrors?: string[];
}

export interface QRCheckOutResult {
  success: boolean;
  checkOut?: {
    id: string;
    checkInId: string;
    checkedOutAt: Date;
    actualDuration: number; // in minutes
    scheduledDuration: number; // in minutes
    overtime: number; // in minutes if negative, early checkout if positive
  };
  error?: string;
}

export interface QRCodeValidation {
  isValid: boolean;
  qrCodeData?: QRCodeData;
  booking?: any;
  space?: any;
  user?: any;
  errors: string[];
  warnings: string[];
  context: {
    canCheckIn: boolean;
    canCheckOut: boolean;
    isExpired: boolean;
    remainingTime?: number; // minutes until booking ends
    gracePeriod?: number; // minutes of grace period for check-in
  };
}

// ============================================================================
// QR CODE SERVICE
// ============================================================================

export class QRCodeService {

  // ============================================================================
  // QR CODE GENERATION
  // ============================================================================

  async generateBookingQRCode(
    tenantId: string,
    bookingId: string,
    options: {
      validityMinutes?: number;
      maxUsage?: number;
      includeMachineName?: boolean;
    } = {}
  ): Promise<BookingQRCode> {
    try {
      // Get booking details
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          tenantId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
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

      // Calculate validity period
      const now = new Date();
      const validFrom = new Date(Math.max(now.getTime(), booking.startTime.getTime() - 15 * 60 * 1000)); // 15 minutes before start
      const validUntil = options.validityMinutes 
        ? new Date(now.getTime() + options.validityMinutes * 60 * 1000)
        : new Date(booking.endTime.getTime() + 30 * 60 * 1000); // 30 minutes after booking end

      // Create QR code data
      const qrCodeData = {
        type: 'BOOKING_ACCESS',
        bookingId: booking.id,
        spaceId: booking.spaceId,
        userId: booking.userId,
        tenantId,
        timestamp: now.toISOString(),
        ...(options.includeMachineName && { machineName: process.env.HOSTNAME || 'unknown' }),
      };

      // Generate QR code string
      const qrCodeString = `sweetspot://booking/${booking.id}?data=${Buffer.from(JSON.stringify(qrCodeData)).toString('base64')}`;

      // Store QR code in database
      const qrCode = await prisma.qRCode.create({
        data: {
          tenantId,
          userId: booking.userId,
          spaceId: booking.spaceId,
          type: QRCodeType.ROOM_ACCESS,
          code: qrCodeString,
          data: JSON.stringify(qrCodeData),
          expiresAt: validUntil,
          maxUsage: options.maxUsage || 10, // Allow multiple scans for check-in/out
          isActive: true,
        },
      });

      // Check current status
      const existingCheckIn = await prisma.roomCheckIn.findFirst({
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
    } catch (error) {
      logger.error('Failed to generate booking QR code', { tenantId, bookingId, options }, error as Error);
      throw error;
    }
  }

  async generateSpaceAccessQRCode(
    tenantId: string,
    spaceId: string,
    userId: string,
    validityHours: number = 24
  ): Promise<string> {
    try {
      // Verify space exists
      const space = await prisma.space.findFirst({
        where: { id: spaceId, tenantId, isActive: true },
      });

      if (!space) {
        throw new Error('Space not found or not active');
      }

      // Verify user has access (simplified check)
      const user = await prisma.user.findFirst({
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

      // Store QR code
      await prisma.qRCode.create({
        data: {
          tenantId,
          userId: user.id,
          spaceId: space.id,
          type: QRCodeType.ROOM_ACCESS,
          code: qrCodeString,
          data: JSON.stringify(qrCodeData),
          expiresAt,
          maxUsage: 50, // Allow multiple uses for space access
          isActive: true,
        },
      });

      return qrCodeString;
    } catch (error) {
      logger.error('Failed to generate space access QR code', { tenantId, spaceId, userId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // QR CODE VALIDATION
  // ============================================================================

  async validateQRCode(qrCodeString: string): Promise<QRCodeValidation> {
    try {
      const validation: QRCodeValidation = {
        isValid: false,
        errors: [],
        warnings: [],
        context: {
          canCheckIn: false,
          canCheckOut: false,
          isExpired: false,
        },
      };

      // Parse QR code
      let qrCodeData: any;
      try {
        if (qrCodeString.startsWith('sweetspot://booking/')) {
          const match = qrCodeString.match(/sweetspot:\/\/booking\/([^?]+)\?data=(.+)/);
          if (!match) throw new Error('Invalid QR code format');
          
          const bookingId = match[1];
          const encodedData = match[2];
          qrCodeData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
          qrCodeData.bookingId = bookingId;
        } else if (qrCodeString.startsWith('sweetspot://space/')) {
          const match = qrCodeString.match(/sweetspot:\/\/space\/([^?]+)\?data=(.+)/);
          if (!match) throw new Error('Invalid QR code format');
          
          const spaceId = match[1];
          const encodedData = match[2];
          qrCodeData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
          qrCodeData.spaceId = spaceId;
        } else {
          throw new Error('Unrecognized QR code format');
        }
      } catch (error) {
        validation.errors.push('Invalid QR code format or corrupted data');
        return validation;
      }

      // Find QR code in database
      const dbQRCode = await prisma.qRCode.findFirst({
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

      // Check expiration
      const now = new Date();
      if (dbQRCode.expiresAt && now > dbQRCode.expiresAt) {
        validation.context.isExpired = true;
        validation.errors.push('QR code has expired');
        return validation;
      }

      // Check usage limits
      if (dbQRCode.maxUsage && dbQRCode.usageCount >= dbQRCode.maxUsage) {
        validation.errors.push('QR code usage limit exceeded');
        return validation;
      }

      // Validate booking-specific data
      if (qrCodeData.type === 'BOOKING_ACCESS' && qrCodeData.bookingId) {
        const booking = await prisma.booking.findFirst({
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

        if (booking.status === BookingStatus.CANCELLED) {
          validation.errors.push('Booking has been cancelled');
          return validation;
        }

        validation.booking = booking;
        validation.space = booking.space;
        validation.user = booking.user;

        // Check timing
        const gracePeriod = 15; // 15 minutes
        const checkInWindow = new Date(booking.startTime.getTime() - gracePeriod * 60 * 1000);
        const checkOutWindow = new Date(booking.endTime.getTime() + 30 * 60 * 1000); // 30 minutes after

        const isWithinCheckInWindow = now >= checkInWindow && now <= booking.endTime;
        const isWithinCheckOutWindow = now <= checkOutWindow;
        const hasActiveCheckIn = booking.checkIns.length > 0;

        validation.context.canCheckIn = isWithinCheckInWindow && !hasActiveCheckIn;
        validation.context.canCheckOut = isWithinCheckOutWindow && hasActiveCheckIn;
        validation.context.gracePeriod = gracePeriod;
        validation.context.remainingTime = Math.max(0, 
          Math.floor((booking.endTime.getTime() - now.getTime()) / (60 * 1000))
        );

        if (now < checkInWindow) {
          validation.warnings.push(`Check-in available from ${checkInWindow.toLocaleTimeString()}`);
        } else if (now > checkOutWindow) {
          validation.errors.push('Check-in/out window has expired');
          return validation;
        }

        if (!validation.context.canCheckIn && !validation.context.canCheckOut) {
          if (hasActiveCheckIn) {
            validation.warnings.push('Already checked in. Scan again to check out.');
          } else {
            validation.errors.push('Not within valid check-in/out time window');
            return validation;
          }
        }
      }

      // If we get here, the QR code is valid
      validation.isValid = true;
      return validation;
    } catch (error) {
      logger.error('Failed to validate QR code', { qrCodeString }, error as Error);
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

  // ============================================================================
  // QR-BASED CHECK-IN/OUT
  // ============================================================================

  async processQRCheckIn(
    tenantId: string,
    qrCodeString: string,
    userId: string,
    additionalData?: Record<string, any>
  ): Promise<QRCheckInResult> {
    try {
      // Validate QR code
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

      // Verify user owns the booking
      if (validation.booking.userId !== userId) {
        return {
          success: false,
          error: 'QR code belongs to a different user',
        };
      }

      // Perform check-in
      const checkIn = await bookingManagementService.checkIn(tenantId, {
        bookingId: validation.booking.id,
        userId,
        qrCodeUsed: qrCodeString,
        notes: additionalData?.notes,
      });

      // Update QR code usage
      await prisma.qRCode.update({
        where: { id: validation.qrCodeData!.id },
        data: { usageCount: { increment: 1 } },
      });

      // Log QR code scan
      await prisma.qRCodeScan.create({
        data: {
          tenantId,
          qrCodeId: validation.qrCodeData!.id,
          userId,
          result: 'SUCCESS',
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
    } catch (error) {
      logger.error('Failed to process QR check-in', { tenantId, userId }, error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-in failed',
      };
    }
  }

  async processQRCheckOut(
    tenantId: string,
    qrCodeString: string,
    userId: string,
    additionalData?: Record<string, any>
  ): Promise<QRCheckOutResult> {
    try {
      // Validate QR code
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

      // Find active check-in
      const activeCheckIn = await prisma.roomCheckIn.findFirst({
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

      // Perform check-out
      const checkOut = await bookingManagementService.checkOut(tenantId, {
        checkInId: activeCheckIn.id,
        actualEndTime: additionalData?.actualEndTime,
        notes: additionalData?.notes,
      });

      // Calculate durations
      const actualDuration = Math.floor(
        (checkOut.checkedOutAt!.getTime() - checkOut.checkedInAt.getTime()) / (60 * 1000)
      );
      const scheduledDuration = Math.floor(
        (validation.booking.endTime.getTime() - validation.booking.startTime.getTime()) / (60 * 1000)
      );
      const overtime = actualDuration - scheduledDuration;

      // Update QR code usage
      await prisma.qRCode.update({
        where: { id: validation.qrCodeData!.id },
        data: { usageCount: { increment: 1 } },
      });

      // Log QR code scan
      await prisma.qRCodeScan.create({
        data: {
          tenantId,
          qrCodeId: validation.qrCodeData!.id,
          userId,
          result: 'SUCCESS',
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
          checkedOutAt: checkOut.checkedOutAt!,
          actualDuration,
          scheduledDuration,
          overtime,
        },
      };
    } catch (error) {
      logger.error('Failed to process QR check-out', { tenantId, userId }, error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-out failed',
      };
    }
  }

  // ============================================================================
  // QR CODE MANAGEMENT
  // ============================================================================

  async deactivateQRCode(tenantId: string, qrCodeId: string) {
    try {
      return await prisma.qRCode.update({
        where: {
          id: qrCodeId,
          tenantId,
        },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      logger.error('Failed to deactivate QR code', { tenantId, qrCodeId }, error as Error);
      throw error;
    }
  }

  async getQRCodeUsageHistory(tenantId: string, qrCodeId: string) {
    try {
      return await prisma.qRCodeScan.findMany({
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
          visitor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { scannedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get QR code usage history', { tenantId, qrCodeId }, error as Error);
      throw error;
    }
  }

  async generateQRCodeAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    successRate: number;
    scansByResult: Record<string, number>;
    scansByLocation: Array<{ location: string; scans: number }>;
    scansByHour: Array<{ hour: number; scans: number }>;
    topUsers: Array<{ userId: string; userName: string; scans: number }>;
  }> {
    try {
      const scans = await prisma.qRCodeScan.findMany({
        where: {
          tenantId,
          scannedAt: {
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
          visitor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const totalScans = scans.length;
      const successfulScans = scans.filter(scan => scan.result === 'SUCCESS').length;
      const failedScans = totalScans - successfulScans;
      const successRate = totalScans > 0 ? successfulScans / totalScans : 0;

      // Group by scan result
      const scansByResult: Record<string, number> = {};
      scans.forEach(scan => {
        scansByResult[scan.result] = (scansByResult[scan.result] || 0) + 1;
      });

      // Group by location
      const locationScans = new Map<string, number>();
      scans.forEach(scan => {
        if (scan.location) {
          const key = scan.location;
          locationScans.set(key, (locationScans.get(key) || 0) + 1);
        }
      });

      const scansByLocation = Array.from(locationScans.entries()).map(([location, count]) => ({
        location,
        scans: count,
      }));

      // Group by hour
      const hourlyScans = new Array(24).fill(0);
      scans.forEach(scan => {
        const hour = scan.scannedAt.getHours();
        hourlyScans[hour]++;
      });

      const scansByHour = hourlyScans.map((count, hour) => ({ hour, scans: count }));

      // Top users
      const userScans = new Map<string, { name: string; count: number }>();
      scans.forEach(scan => {
        if (scan.userId) {
          const key = scan.userId;
          if (!userScans.has(key)) {
            const name = scan.user ? `${scan.user.firstName} ${scan.user.lastName}` : 'Unknown';
            userScans.set(key, { name, count: 0 });
          }
          userScans.get(key)!.count++;
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
        scansByResult,
        scansByLocation,
        scansByHour,
        topUsers,
      };
    } catch (error) {
      logger.error('Failed to generate QR code analytics', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }
}

export const qrCodeService = new QRCodeService();
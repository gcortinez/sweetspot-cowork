import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";
import { encryptionService } from "./encryptionService";
import { auditLogService } from "./auditLogService";
import { securityEventService } from "./securityEventService";

export interface SessionData {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  clientId?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionConfig {
  accessTokenExpiry?: string | number;
  refreshTokenExpiry?: string | number;
  maxConcurrentSessions?: number;
  requireTwoFactor?: boolean;
  trackLocation?: boolean;
}

export interface ActiveSession {
  id: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastActivity: Date;
  createdAt: Date;
  isActive: boolean;
}

export class SessionService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly defaultConfig: SessionConfig = {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    maxConcurrentSessions: 5,
    requireTwoFactor: false,
    trackLocation: true,
  };

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET || "fallback-secret";
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret";

    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.warn(
        "JWT secrets not configured properly in environment variables"
      );
    }
  }

  /**
   * Create a new secure session
   */
  async createSession(
    sessionData: SessionData,
    config: SessionConfig = {}
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    expiresAt: Date;
  }> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const sessionId = this.generateSecureSessionId();

    try {
      // Check for maximum concurrent sessions
      if (mergedConfig.maxConcurrentSessions) {
        await this.enforceSessionLimit(
          sessionData.userId,
          mergedConfig.maxConcurrentSessions
        );
      }

      // Create session record in database
      const expiresAt = new Date(
        Date.now() + this.parseExpiryTime(mergedConfig.refreshTokenExpiry)
      );

      await prisma.userSession.create({
        data: {
          id: sessionId,
          userId: sessionData.userId,
          tenantId: sessionData.tenantId,
          refreshToken: encryptionService.hash(sessionId), // Hash session ID for security
          deviceInfo: sessionData.deviceInfo,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          expiresAt,
          lastActivity: new Date(),
          isActive: true,
        },
      });

      // Generate JWT tokens
      const accessToken = this.generateAccessToken(
        sessionData,
        sessionId,
        mergedConfig
      );
      const refreshToken = this.generateRefreshToken(sessionId, mergedConfig);

      // Log session creation
      await auditLogService.log({
        tenantId: sessionData.tenantId,
        userId: sessionData.userId,
        action: "CREATE",
        entityType: "Session",
        entityId: sessionId,
        details: {
          action: "Session created",
          deviceInfo: sessionData.deviceInfo,
          ipAddress: sessionData.ipAddress,
        },
      });

      logger.info("Session created successfully", {
        sessionId,
        userId: sessionData.userId,
        tenantId: sessionData.tenantId,
        ipAddress: sessionData.ipAddress,
      });

      return {
        accessToken,
        refreshToken,
        sessionId,
        expiresAt,
      };
    } catch (error) {
      logger.error("Session creation failed", {
        userId: sessionData.userId,
        error: (error as Error).message,
      });
      throw new Error("Failed to create session");
    }
  }

  /**
   * Validate and refresh an access token
   */
  async validateSession(token: string): Promise<{
    isValid: boolean;
    sessionData?: SessionData;
    sessionId?: string;
    needsRefresh?: boolean;
  }> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as any;

      if (!decoded.sessionId || !decoded.userId) {
        return { isValid: false };
      }

      // Check if session still exists and is active
      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              tenantId: true,
              clientId: true,
            },
          },
        },
      });

      if (!session) {
        return { isValid: false };
      }

      // Update last activity
      await this.updateSessionActivity(decoded.sessionId);

      const sessionData: SessionData = {
        id: session.id,
        userId: session.userId,
        tenantId: session.tenantId,
        role: session.user.role,
        clientId: session.user.clientId ?? undefined,
        deviceInfo: session.deviceInfo ?? undefined,
        ipAddress: session.ipAddress ?? undefined,
        userAgent: session.userAgent ?? undefined,
      };

      // Check if token is close to expiry (within 5 minutes)
      const needsRefresh = decoded.exp && decoded.exp - Date.now() / 1000 < 300;

      return {
        isValid: true,
        sessionData,
        sessionId: decoded.sessionId,
        needsRefresh,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        return { isValid: false, needsRefresh: true };
      }

      logger.error("Session validation failed", {
        error: (error as Error).message,
      });
      return { isValid: false };
    }
  }

  /**
   * Refresh an access token using refresh token
   */
  async refreshSession(refreshToken: string): Promise<{
    accessToken: string;
    newRefreshToken: string;
    sessionId: string;
  } | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as any;

      if (!decoded.sessionId) {
        return null;
      }

      const session = await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              tenantId: true,
              clientId: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      // Generate new tokens
      const sessionData: SessionData = {
        id: session.id,
        userId: session.userId,
        tenantId: session.tenantId,
        role: session.user.role,
        clientId: session.user.clientId ?? undefined,
        deviceInfo: session.deviceInfo ?? undefined,
        ipAddress: session.ipAddress ?? undefined,
        userAgent: session.userAgent ?? undefined,
      };

      const newAccessToken = this.generateAccessToken(
        sessionData,
        decoded.sessionId
      );
      const newRefreshToken = this.generateRefreshToken(decoded.sessionId);

      // Update session activity
      await this.updateSessionActivity(decoded.sessionId);

      // Log token refresh
      await auditLogService.log({
        tenantId: session.tenantId,
        userId: session.userId,
        action: "UPDATE",
        entityType: "Session",
        entityId: session.id,
        details: {
          action: "Session refreshed",
        },
      });

      return {
        accessToken: newAccessToken,
        newRefreshToken,
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      logger.error("Session refresh failed", {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string, userId?: string): Promise<void> {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          id: sessionId,
          ...(userId && { userId }),
        },
      });

      if (!session) {
        return;
      }

      // Mark session as inactive
      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      // Log session invalidation
      await auditLogService.log({
        tenantId: session.tenantId,
        userId: session.userId,
        action: "DELETE",
        entityType: "Session",
        entityId: sessionId,
        details: {
          action: "Session invalidated",
        },
      });

      logger.info("Session invalidated", { sessionId, userId });
    } catch (error) {
      logger.error("Session invalidation failed", {
        sessionId,
        userId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<void> {
    try {
      const whereClause: any = {
        userId,
        isActive: true,
      };

      if (exceptSessionId) {
        whereClause.id = { not: exceptSessionId };
      }

      const sessions = await prisma.userSession.findMany({
        where: whereClause,
        select: { id: true, tenantId: true },
      });

      // Mark all sessions as inactive
      await prisma.userSession.updateMany({
        where: whereClause,
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      // Log session invalidations
      for (const session of sessions) {
        await auditLogService.log({
          tenantId: session.tenantId,
          userId,
          action: "DELETE",
          entityType: "Session",
          entityId: session.id,
          details: {
            action: "Session invalidated (bulk)",
          },
        });
      }

      logger.info("All user sessions invalidated", {
        userId,
        exceptSessionId,
        invalidatedCount: sessions.length,
      });
    } catch (error) {
      logger.error("Bulk session invalidation failed", {
        userId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<ActiveSession[]> {
    try {
      const sessions = await prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          userId: true,
          deviceInfo: true,
          ipAddress: true,
          lastActivity: true,
          createdAt: true,
          isActive: true,
        },
        orderBy: {
          lastActivity: "desc",
        },
      });

      return sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        deviceInfo: session.deviceInfo ?? undefined,
        ipAddress: session.ipAddress ?? undefined,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isActive: session.isActive,
      }));
    } catch (error) {
      logger.error("Failed to get user active sessions", {
        userId,
        error: (error as Error).message,
      });
      return [];
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredCount = await prisma.userSession.updateMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              lastActivity: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            }, // 30 days inactive
          ],
          isActive: true,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      if (expiredCount.count > 0) {
        logger.info("Expired sessions cleaned up", {
          count: expiredCount.count,
        });
      }
    } catch (error) {
      logger.error("Session cleanup failed", {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Detect suspicious session activity
   */
  async detectSuspiciousActivity(
    sessionId: string,
    currentIp: string
  ): Promise<boolean> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) return false;

      // Check for IP address changes
      if (session.ipAddress && session.ipAddress !== currentIp) {
        await securityEventService.logEvent({
          tenantId: session.tenantId,
          eventType: "SUSPICIOUS_LOGIN",
          severity: "MEDIUM",
          performedById: session.userId,
          ipAddress: currentIp,
          userAgent: session.userAgent ?? undefined,
          description: "IP address change detected",
          metadata: {
            originalIp: session.ipAddress,
            newIp: currentIp,
            sessionId,
          },
        });

        logger.warn("Suspicious session activity detected - IP change", {
          sessionId,
          userId: session.userId,
          originalIp: session.ipAddress,
          newIp: currentIp,
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error("Suspicious activity detection failed", {
        sessionId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private generateSecureSessionId(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private generateAccessToken(
    sessionData: SessionData,
    sessionId: string,
    config: SessionConfig = {}
  ): string {
    const payload = {
      userId: sessionData.userId,
      tenantId: sessionData.tenantId,
      role: sessionData.role,
      clientId: sessionData.clientId,
      sessionId,
      type: "access",
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn:
        config.accessTokenExpiry || this.defaultConfig.accessTokenExpiry,
      issuer: "sweetspot-api",
      audience: "sweetspot-app",
    } as jwt.SignOptions);
  }

  private generateRefreshToken(
    sessionId: string,
    config: SessionConfig = {}
  ): string {
    const payload = {
      sessionId,
      type: "refresh",
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn:
        config.refreshTokenExpiry || this.defaultConfig.refreshTokenExpiry,
      issuer: "sweetspot-api",
      audience: "sweetspot-app",
    } as jwt.SignOptions);
  }

  private parseExpiryTime(expiry: string | number | undefined): number {
    if (typeof expiry === "number") return expiry;
    if (!expiry) return 7 * 24 * 60 * 60 * 1000; // 7 days default

    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const [, number, unit] = match;
    return parseInt(number) * units[unit];
  }

  private async enforceSessionLimit(
    userId: string,
    maxSessions: number
  ): Promise<void> {
    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivity: "asc" },
    });

    if (activeSessions.length >= maxSessions) {
      // Remove oldest sessions
      const sessionsToRemove = activeSessions.slice(
        0,
        activeSessions.length - maxSessions + 1
      );

      for (const session of sessionsToRemove) {
        await this.invalidateSession(session.id);
      }
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { lastActivity: new Date() },
      });
    } catch (error) {
      // Don't fail the request if activity update fails
      logger.error("Failed to update session activity", {
        sessionId,
        error: (error as Error).message,
      });
    }
  }
}

export const sessionService = new SessionService();

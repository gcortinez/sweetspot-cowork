import { prisma } from '../lib/prisma';
import {
  NotificationType,
  NotificationUrgency,
  DeliveryMethod,
  NotificationStatus,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  urgency: NotificationUrgency;
  recipientId: string;
  visitorId?: string;
  preRegistrationId?: string;
  actionUrl?: string;
  actionText?: string;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  urgency?: NotificationUrgency;
  recipientId: string;
  visitorId?: string;
  preRegistrationId?: string;
  actionUrl?: string;
  actionText?: string;
  deliveryMethod?: DeliveryMethod;
  channels?: string[];
  scheduledFor?: Date;
  expiresAt?: Date;
  templateData?: any;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  messageTemplate: string;
  urgency: NotificationUrgency;
  actionText?: string;
  actionUrl?: string;
  channels: string[];
}

export interface NotificationFilter {
  recipientId?: string;
  type?: NotificationType[];
  status?: NotificationStatus[];
  urgency?: NotificationUrgency[];
  fromDate?: Date;
  toDate?: Date;
  unreadOnly?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Array<{
    type: NotificationType;
    count: number;
  }>;
  byUrgency: Array<{
    urgency: NotificationUrgency;
    count: number;
  }>;
  deliveryRate: number;
  responseRate: number;
}

// ============================================================================
// VISITOR NOTIFICATION SERVICE
// ============================================================================

class VisitorNotificationService {

  // ============================================================================
  // NOTIFICATION CRUD OPERATIONS
  // ============================================================================

  async createNotification(
    tenantId: string,
    request: CreateNotificationRequest
  ): Promise<NotificationData> {
    try {
      const notification = await prisma.visitorNotification.create({
        data: {
          tenantId,
          type: request.type,
          title: request.title,
          message: request.message,
          urgency: request.urgency || NotificationUrgency.NORMAL,
          recipientId: request.recipientId,
          visitorId: request.visitorId,
          preRegistrationId: request.preRegistrationId,
          actionUrl: request.actionUrl,
          actionText: request.actionText,
          deliveryMethod: request.deliveryMethod || DeliveryMethod.IN_APP,
          channels: request.channels || ['in_app'],
          scheduledFor: request.scheduledFor,
          expiresAt: request.expiresAt,
          templateData: request.templateData || {},
          status: request.scheduledFor ? NotificationStatus.PENDING : NotificationStatus.SENT,
          sentAt: request.scheduledFor ? undefined : new Date()
        }
      });

      // If not scheduled, mark as delivered for in-app notifications
      if (!request.scheduledFor && request.deliveryMethod === DeliveryMethod.IN_APP) {
        await this.markAsDelivered(tenantId, notification.id);
      }

      logger.info('Notification created', { 
        tenantId, 
        notificationId: notification.id, 
        type: request.type 
      });

      return this.mapNotificationToData(notification);
    } catch (error) {
      logger.error('Failed to create notification', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async getNotifications(
    tenantId: string,
    filters: NotificationFilter = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{ notifications: NotificationData[]; total: number; hasMore: boolean }> {
    try {
      const whereClause = this.buildNotificationWhereClause(tenantId, filters);

      const [notifications, total] = await Promise.all([
        prisma.visitorNotification.findMany({
          where: whereClause,
          orderBy: [
            { urgency: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: pagination.skip || 0,
          take: pagination.take || 50,
          include: {
            visitor: {
              select: {
                firstName: true,
                lastName: true,
                company: true
              }
            },
            preRegistration: {
              select: {
                firstName: true,
                lastName: true,
                company: true
              }
            }
          }
        }),
        prisma.visitorNotification.count({ where: whereClause })
      ]);

      const notificationData = notifications.map(notification => 
        this.mapNotificationToData(notification)
      );
      const hasMore = (pagination.skip || 0) + notificationData.length < total;

      return {
        notifications: notificationData,
        total,
        hasMore
      };
    } catch (error) {
      logger.error('Failed to get notifications', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getNotificationById(
    tenantId: string,
    notificationId: string
  ): Promise<NotificationData | null> {
    try {
      const notification = await prisma.visitorNotification.findFirst({
        where: { id: notificationId, tenantId },
        include: {
          visitor: {
            select: {
              firstName: true,
              lastName: true,
              company: true
            }
          },
          preRegistration: {
            select: {
              firstName: true,
              lastName: true,
              company: true
            }
          }
        }
      });

      return notification ? this.mapNotificationToData(notification) : null;
    } catch (error) {
      logger.error('Failed to get notification by ID', { 
        tenantId, 
        notificationId 
      }, error as Error);
      throw error;
    }
  }

  async markAsRead(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<NotificationData> {
    try {
      const notification = await prisma.visitorNotification.update({
        where: { 
          id: notificationId, 
          tenantId,
          recipientId: userId
        },
        data: {
          readAt: new Date(),
          status: NotificationStatus.READ
        }
      });

      logger.info('Notification marked as read', { 
        tenantId, 
        notificationId, 
        userId 
      });

      return this.mapNotificationToData(notification);
    } catch (error) {
      logger.error('Failed to mark notification as read', { 
        tenantId, 
        notificationId 
      }, error as Error);
      throw error;
    }
  }

  async markAsAcknowledged(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<NotificationData> {
    try {
      const notification = await prisma.visitorNotification.update({
        where: { 
          id: notificationId, 
          tenantId,
          recipientId: userId
        },
        data: {
          acknowledgedAt: new Date(),
          status: NotificationStatus.ACKNOWLEDGED
        }
      });

      logger.info('Notification acknowledged', { 
        tenantId, 
        notificationId, 
        userId 
      });

      return this.mapNotificationToData(notification);
    } catch (error) {
      logger.error('Failed to acknowledge notification', { 
        tenantId, 
        notificationId 
      }, error as Error);
      throw error;
    }
  }

  async markAllAsRead(
    tenantId: string,
    userId: string
  ): Promise<number> {
    try {
      const result = await prisma.visitorNotification.updateMany({
        where: {
          tenantId,
          recipientId: userId,
          readAt: null,
          status: { in: [NotificationStatus.SENT, NotificationStatus.DELIVERED] }
        },
        data: {
          readAt: new Date(),
          status: NotificationStatus.READ
        }
      });

      logger.info('All notifications marked as read', { 
        tenantId, 
        userId, 
        count: result.count 
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { 
        tenantId, 
        userId 
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATION DELIVERY METHODS
  // ============================================================================

  private async markAsDelivered(
    tenantId: string,
    notificationId: string
  ): Promise<void> {
    try {
      await prisma.visitorNotification.update({
        where: { id: notificationId },
        data: {
          deliveredAt: new Date(),
          status: NotificationStatus.DELIVERED
        }
      });
    } catch (error) {
      logger.error('Failed to mark notification as delivered', { 
        tenantId, 
        notificationId 
      }, error as Error);
    }
  }

  async sendScheduledNotifications(tenantId?: string): Promise<number> {
    try {
      const now = new Date();
      
      const whereClause: any = {
        status: NotificationStatus.PENDING,
        scheduledFor: { lte: now }
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const scheduledNotifications = await prisma.visitorNotification.findMany({
        where: whereClause,
        take: 100 // Process in batches
      });

      let sentCount = 0;

      for (const notification of scheduledNotifications) {
        try {
          // Simulate sending notification
          await this.deliverNotification(notification);
          
          await prisma.visitorNotification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: now,
              deliveryAttempts: { increment: 1 }
            }
          });

          sentCount++;
        } catch (error) {
          await prisma.visitorNotification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.FAILED,
              deliveryAttempts: { increment: 1 },
              errorMessage: (error as Error).message
            }
          });

          logger.error('Failed to send scheduled notification', { 
            notificationId: notification.id 
          }, error as Error);
        }
      }

      if (sentCount > 0) {
        logger.info('Sent scheduled notifications', { sentCount });
      }

      return sentCount;
    } catch (error) {
      logger.error('Failed to send scheduled notifications', { tenantId }, error as Error);
      throw error;
    }
  }

  private async deliverNotification(notification: any): Promise<void> {
    // This is where you would integrate with actual delivery services
    // For now, we'll just simulate delivery based on the delivery method
    
    switch (notification.deliveryMethod) {
      case DeliveryMethod.EMAIL:
        await this.sendEmailNotification(notification);
        break;
      case DeliveryMethod.SMS:
        await this.sendSMSNotification(notification);
        break;
      case DeliveryMethod.PUSH:
        await this.sendPushNotification(notification);
        break;
      case DeliveryMethod.IN_APP:
        // In-app notifications are delivered immediately
        await this.markAsDelivered(notification.tenantId, notification.id);
        break;
      case DeliveryMethod.SLACK:
        await this.sendSlackNotification(notification);
        break;
      case DeliveryMethod.TEAMS:
        await this.sendTeamsNotification(notification);
        break;
      case DeliveryMethod.WEBHOOK:
        await this.sendWebhookNotification(notification);
        break;
      default:
        logger.warn('Unknown delivery method', { 
          deliveryMethod: notification.deliveryMethod 
        });
    }
  }

  private async sendEmailNotification(notification: any): Promise<void> {
    // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
    logger.info('Email notification sent (simulated)', { 
      notificationId: notification.id 
    });
    await this.markAsDelivered(notification.tenantId, notification.id);
  }

  private async sendSMSNotification(notification: any): Promise<void> {
    // TODO: Integrate with SMS service (e.g., Twilio, AWS SNS)
    logger.info('SMS notification sent (simulated)', { 
      notificationId: notification.id 
    });
    await this.markAsDelivered(notification.tenantId, notification.id);
  }

  private async sendPushNotification(notification: any): Promise<void> {
    // TODO: Integrate with push notification service (e.g., Firebase FCM)
    logger.info('Push notification sent (simulated)', { 
      notificationId: notification.id 
    });
    await this.markAsDelivered(notification.tenantId, notification.id);
  }

  private async sendSlackNotification(notification: any): Promise<void> {
    // TODO: Integrate with Slack API
    logger.info('Slack notification sent (simulated)', { 
      notificationId: notification.id 
    });
    await this.markAsDelivered(notification.tenantId, notification.id);
  }

  private async sendTeamsNotification(notification: any): Promise<void> {
    // TODO: Integrate with Microsoft Teams API
    logger.info('Teams notification sent (simulated)', { 
      notificationId: notification.id 
    });
    await this.markAsDelivered(notification.tenantId, notification.id);
  }

  private async sendWebhookNotification(notification: any): Promise<void> {
    // TODO: Send webhook notification
    logger.info('Webhook notification sent (simulated)', { 
      notificationId: notification.id 
    });
    await this.markAsDelivered(notification.tenantId, notification.id);
  }

  // ============================================================================
  // NOTIFICATION ANALYTICS
  // ============================================================================

  async getNotificationStats(
    tenantId: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<NotificationStats> {
    try {
      const whereClause: any = { tenantId };
      
      if (userId) {
        whereClause.recipientId = userId;
      }
      
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const notifications = await prisma.visitorNotification.findMany({
        where: whereClause,
        select: {
          type: true,
          urgency: true,
          status: true,
          readAt: true,
          acknowledgedAt: true,
          deliveredAt: true
        }
      });

      const total = notifications.length;
      const unread = notifications.filter(n => !n.readAt).length;

      // Group by type
      const typeGroups = new Map<NotificationType, number>();
      notifications.forEach(n => {
        const count = typeGroups.get(n.type) || 0;
        typeGroups.set(n.type, count + 1);
      });

      const byType = Array.from(typeGroups.entries()).map(([type, count]) => ({
        type,
        count
      }));

      // Group by urgency
      const urgencyGroups = new Map<NotificationUrgency, number>();
      notifications.forEach(n => {
        const count = urgencyGroups.get(n.urgency) || 0;
        urgencyGroups.set(n.urgency, count + 1);
      });

      const byUrgency = Array.from(urgencyGroups.entries()).map(([urgency, count]) => ({
        urgency,
        count
      }));

      // Calculate delivery rate
      const delivered = notifications.filter(n => n.deliveredAt).length;
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

      // Calculate response rate (acknowledged notifications)
      const acknowledged = notifications.filter(n => n.acknowledgedAt).length;
      const responseRate = delivered > 0 ? (acknowledged / delivered) * 100 : 0;

      return {
        total,
        unread,
        byType,
        byUrgency,
        deliveryRate,
        responseRate
      };
    } catch (error) {
      logger.error('Failed to get notification stats', { 
        tenantId, 
        userId 
      }, error as Error);
      throw error;
    }
  }

  async cleanupExpiredNotifications(tenantId?: string): Promise<number> {
    try {
      const now = new Date();
      
      const whereClause: any = {
        expiresAt: { lt: now },
        status: { notIn: [NotificationStatus.EXPIRED] }
      };

      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const result = await prisma.visitorNotification.updateMany({
        where: whereClause,
        data: {
          status: NotificationStatus.EXPIRED
        }
      });

      logger.info('Expired notifications cleaned up', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired notifications', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATION TEMPLATES
  // ============================================================================

  getNotificationTemplate(type: NotificationType): NotificationTemplate {
    const templates: Record<NotificationType, NotificationTemplate> = {
      [NotificationType.VISITOR_ARRIVAL]: {
        type: NotificationType.VISITOR_ARRIVAL,
        title: 'Visitor Arrived',
        messageTemplate: '{{visitorName}} has arrived and checked in{{location}}.',
        urgency: NotificationUrgency.NORMAL,
        actionText: 'View Details',
        channels: ['in_app', 'push']
      },
      [NotificationType.VISITOR_DEPARTURE]: {
        type: NotificationType.VISITOR_DEPARTURE,
        title: 'Visitor Departed',
        messageTemplate: '{{visitorName}} has checked out{{location}}.',
        urgency: NotificationUrgency.LOW,
        channels: ['in_app']
      },
      [NotificationType.VISITOR_LATE]: {
        type: NotificationType.VISITOR_LATE,
        title: 'Visitor Running Late',
        messageTemplate: '{{visitorName}} is {{minutes}} minutes late for their scheduled visit.',
        urgency: NotificationUrgency.NORMAL,
        channels: ['in_app', 'push']
      },
      [NotificationType.VISITOR_NO_SHOW]: {
        type: NotificationType.VISITOR_NO_SHOW,
        title: 'Visitor No-Show',
        messageTemplate: '{{visitorName}} did not show up for their scheduled visit at {{expectedTime}}.',
        urgency: NotificationUrgency.NORMAL,
        channels: ['in_app', 'email']
      },
      [NotificationType.PRE_REGISTRATION_REQUEST]: {
        type: NotificationType.PRE_REGISTRATION_REQUEST,
        title: 'New Visitor Pre-Registration',
        messageTemplate: '{{visitorName}} from {{company}} has requested to visit on {{expectedDate}}.',
        urgency: NotificationUrgency.NORMAL,
        actionText: 'Review Request',
        channels: ['in_app', 'email']
      },
      [NotificationType.PRE_REGISTRATION_APPROVED]: {
        type: NotificationType.PRE_REGISTRATION_APPROVED,
        title: 'Visitor Pre-Registration Approved',
        messageTemplate: '{{visitorName}} has been approved for their visit on {{expectedDate}}.',
        urgency: NotificationUrgency.LOW,
        channels: ['in_app']
      },
      [NotificationType.PRE_REGISTRATION_DENIED]: {
        type: NotificationType.PRE_REGISTRATION_DENIED,
        title: 'Visitor Pre-Registration Denied',
        messageTemplate: '{{visitorName}}\'s visit request for {{expectedDate}} has been denied.',
        urgency: NotificationUrgency.LOW,
        channels: ['in_app']
      },
      [NotificationType.ACCESS_CODE_GENERATED]: {
        type: NotificationType.ACCESS_CODE_GENERATED,
        title: 'Access Code Generated',
        messageTemplate: 'Access code {{accessCode}} has been generated for {{visitorName}}.',
        urgency: NotificationUrgency.NORMAL,
        channels: ['in_app', 'sms']
      },
      [NotificationType.SECURITY_ALERT]: {
        type: NotificationType.SECURITY_ALERT,
        title: 'Security Alert',
        messageTemplate: 'Security alert: {{alertDetails}}',
        urgency: NotificationUrgency.CRITICAL,
        channels: ['in_app', 'push', 'email']
      },
      [NotificationType.HOST_ASSIGNMENT]: {
        type: NotificationType.HOST_ASSIGNMENT,
        title: 'New Host Assignment',
        messageTemplate: 'You have been assigned as host for {{visitorName}}\'s visit.',
        urgency: NotificationUrgency.NORMAL,
        actionText: 'View Details',
        channels: ['in_app', 'email']
      },
      [NotificationType.VISIT_REMINDER]: {
        type: NotificationType.VISIT_REMINDER,
        title: 'Upcoming Visitor',
        messageTemplate: 'Reminder: {{visitorName}} is scheduled to visit in {{timeUntil}}.',
        urgency: NotificationUrgency.LOW,
        channels: ['in_app', 'push']
      },
      [NotificationType.POLICY_VIOLATION]: {
        type: NotificationType.POLICY_VIOLATION,
        title: 'Policy Violation',
        messageTemplate: 'Policy violation detected: {{violationDetails}}',
        urgency: NotificationUrgency.HIGH,
        channels: ['in_app', 'email']
      },
      [NotificationType.BADGE_ISSUE]: {
        type: NotificationType.BADGE_ISSUE,
        title: 'Badge Issue',
        messageTemplate: 'Badge {{badgeNumber}} issue: {{issueDetails}}',
        urgency: NotificationUrgency.NORMAL,
        channels: ['in_app']
      },
      [NotificationType.EXTENDED_STAY]: {
        type: NotificationType.EXTENDED_STAY,
        title: 'Extended Stay Request',
        messageTemplate: '{{visitorName}} has requested to extend their stay until {{newEndTime}}.',
        urgency: NotificationUrgency.NORMAL,
        actionText: 'Approve/Deny',
        channels: ['in_app', 'push']
      },
      [NotificationType.EMERGENCY_NOTIFICATION]: {
        type: NotificationType.EMERGENCY_NOTIFICATION,
        title: 'Emergency Notification',
        messageTemplate: 'EMERGENCY: {{emergencyDetails}}',
        urgency: NotificationUrgency.CRITICAL,
        channels: ['in_app', 'push', 'sms', 'email']
      }
    };

    return templates[type] || {
      type,
      title: 'Notification',
      messageTemplate: '{{message}}',
      urgency: NotificationUrgency.NORMAL,
      channels: ['in_app']
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private buildNotificationWhereClause(
    tenantId: string,
    filters: NotificationFilter
  ): Prisma.VisitorNotificationWhereInput {
    const whereClause: Prisma.VisitorNotificationWhereInput = { tenantId };

    if (filters.recipientId) {
      whereClause.recipientId = filters.recipientId;
    }

    if (filters.type && filters.type.length > 0) {
      whereClause.type = { in: filters.type };
    }

    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    if (filters.urgency && filters.urgency.length > 0) {
      whereClause.urgency = { in: filters.urgency };
    }

    if (filters.fromDate && filters.toDate) {
      whereClause.createdAt = {
        gte: filters.fromDate,
        lte: filters.toDate
      };
    }

    if (filters.unreadOnly) {
      whereClause.readAt = null;
    }

    return whereClause;
  }

  private mapNotificationToData(notification: any): NotificationData {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      urgency: notification.urgency,
      recipientId: notification.recipientId,
      visitorId: notification.visitorId,
      preRegistrationId: notification.preRegistrationId,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      status: notification.status,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
      acknowledgedAt: notification.acknowledgedAt,
      expiresAt: notification.expiresAt,
      createdAt: notification.createdAt
    };
  }
}

export const visitorNotificationService = new VisitorNotificationService();
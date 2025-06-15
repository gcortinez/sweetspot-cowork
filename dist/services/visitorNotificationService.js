"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitorNotificationService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class VisitorNotificationService {
    async createNotification(tenantId, request) {
        try {
            const notification = await prisma_1.prisma.visitorNotification.create({
                data: {
                    tenantId,
                    type: request.type,
                    title: request.title,
                    message: request.message,
                    urgency: request.urgency || client_1.NotificationUrgency.NORMAL,
                    recipientId: request.recipientId,
                    visitorId: request.visitorId,
                    preRegistrationId: request.preRegistrationId,
                    actionUrl: request.actionUrl,
                    actionText: request.actionText,
                    deliveryMethod: request.deliveryMethod || client_1.DeliveryMethod.IN_APP,
                    channels: request.channels || ['in_app'],
                    scheduledFor: request.scheduledFor,
                    expiresAt: request.expiresAt,
                    templateData: request.templateData || {},
                    status: request.scheduledFor ? client_1.NotificationStatus.PENDING : client_1.NotificationStatus.SENT,
                    sentAt: request.scheduledFor ? undefined : new Date()
                }
            });
            if (!request.scheduledFor && request.deliveryMethod === client_1.DeliveryMethod.IN_APP) {
                await this.markAsDelivered(tenantId, notification.id);
            }
            logger_1.logger.info('Notification created', {
                tenantId,
                notificationId: notification.id,
                type: request.type
            });
            return this.mapNotificationToData(notification);
        }
        catch (error) {
            logger_1.logger.error('Failed to create notification', { tenantId, request }, error);
            throw error;
        }
    }
    async getNotifications(tenantId, filters = {}, pagination = {}) {
        try {
            const whereClause = this.buildNotificationWhereClause(tenantId, filters);
            const [notifications, total] = await Promise.all([
                prisma_1.prisma.visitorNotification.findMany({
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
                prisma_1.prisma.visitorNotification.count({ where: whereClause })
            ]);
            const notificationData = notifications.map(notification => this.mapNotificationToData(notification));
            const hasMore = (pagination.skip || 0) + notificationData.length < total;
            return {
                notifications: notificationData,
                total,
                hasMore
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get notifications', { tenantId, filters }, error);
            throw error;
        }
    }
    async getNotificationById(tenantId, notificationId) {
        try {
            const notification = await prisma_1.prisma.visitorNotification.findFirst({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get notification by ID', {
                tenantId,
                notificationId
            }, error);
            throw error;
        }
    }
    async markAsRead(tenantId, notificationId, userId) {
        try {
            const notification = await prisma_1.prisma.visitorNotification.update({
                where: {
                    id: notificationId,
                    tenantId,
                    recipientId: userId
                },
                data: {
                    readAt: new Date(),
                    status: client_1.NotificationStatus.READ
                }
            });
            logger_1.logger.info('Notification marked as read', {
                tenantId,
                notificationId,
                userId
            });
            return this.mapNotificationToData(notification);
        }
        catch (error) {
            logger_1.logger.error('Failed to mark notification as read', {
                tenantId,
                notificationId
            }, error);
            throw error;
        }
    }
    async markAsAcknowledged(tenantId, notificationId, userId) {
        try {
            const notification = await prisma_1.prisma.visitorNotification.update({
                where: {
                    id: notificationId,
                    tenantId,
                    recipientId: userId
                },
                data: {
                    acknowledgedAt: new Date(),
                    status: client_1.NotificationStatus.ACKNOWLEDGED
                }
            });
            logger_1.logger.info('Notification acknowledged', {
                tenantId,
                notificationId,
                userId
            });
            return this.mapNotificationToData(notification);
        }
        catch (error) {
            logger_1.logger.error('Failed to acknowledge notification', {
                tenantId,
                notificationId
            }, error);
            throw error;
        }
    }
    async markAllAsRead(tenantId, userId) {
        try {
            const result = await prisma_1.prisma.visitorNotification.updateMany({
                where: {
                    tenantId,
                    recipientId: userId,
                    readAt: null,
                    status: { in: [client_1.NotificationStatus.SENT, client_1.NotificationStatus.DELIVERED] }
                },
                data: {
                    readAt: new Date(),
                    status: client_1.NotificationStatus.READ
                }
            });
            logger_1.logger.info('All notifications marked as read', {
                tenantId,
                userId,
                count: result.count
            });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to mark all notifications as read', {
                tenantId,
                userId
            }, error);
            throw error;
        }
    }
    async markAsDelivered(tenantId, notificationId) {
        try {
            await prisma_1.prisma.visitorNotification.update({
                where: { id: notificationId },
                data: {
                    deliveredAt: new Date(),
                    status: client_1.NotificationStatus.DELIVERED
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark notification as delivered', {
                tenantId,
                notificationId
            }, error);
        }
    }
    async sendScheduledNotifications(tenantId) {
        try {
            const now = new Date();
            const whereClause = {
                status: client_1.NotificationStatus.PENDING,
                scheduledFor: { lte: now }
            };
            if (tenantId) {
                whereClause.tenantId = tenantId;
            }
            const scheduledNotifications = await prisma_1.prisma.visitorNotification.findMany({
                where: whereClause,
                take: 100
            });
            let sentCount = 0;
            for (const notification of scheduledNotifications) {
                try {
                    await this.deliverNotification(notification);
                    await prisma_1.prisma.visitorNotification.update({
                        where: { id: notification.id },
                        data: {
                            status: client_1.NotificationStatus.SENT,
                            sentAt: now,
                            deliveryAttempts: { increment: 1 }
                        }
                    });
                    sentCount++;
                }
                catch (error) {
                    await prisma_1.prisma.visitorNotification.update({
                        where: { id: notification.id },
                        data: {
                            status: client_1.NotificationStatus.FAILED,
                            deliveryAttempts: { increment: 1 },
                            errorMessage: error.message
                        }
                    });
                    logger_1.logger.error('Failed to send scheduled notification', {
                        notificationId: notification.id
                    }, error);
                }
            }
            if (sentCount > 0) {
                logger_1.logger.info('Sent scheduled notifications', { sentCount });
            }
            return sentCount;
        }
        catch (error) {
            logger_1.logger.error('Failed to send scheduled notifications', { tenantId }, error);
            throw error;
        }
    }
    async deliverNotification(notification) {
        switch (notification.deliveryMethod) {
            case client_1.DeliveryMethod.EMAIL:
                await this.sendEmailNotification(notification);
                break;
            case client_1.DeliveryMethod.SMS:
                await this.sendSMSNotification(notification);
                break;
            case client_1.DeliveryMethod.PUSH:
                await this.sendPushNotification(notification);
                break;
            case client_1.DeliveryMethod.IN_APP:
                await this.markAsDelivered(notification.tenantId, notification.id);
                break;
            case client_1.DeliveryMethod.SLACK:
                await this.sendSlackNotification(notification);
                break;
            case client_1.DeliveryMethod.TEAMS:
                await this.sendTeamsNotification(notification);
                break;
            case client_1.DeliveryMethod.WEBHOOK:
                await this.sendWebhookNotification(notification);
                break;
            default:
                logger_1.logger.warn('Unknown delivery method', {
                    deliveryMethod: notification.deliveryMethod
                });
        }
    }
    async sendEmailNotification(notification) {
        logger_1.logger.info('Email notification sent (simulated)', {
            notificationId: notification.id
        });
        await this.markAsDelivered(notification.tenantId, notification.id);
    }
    async sendSMSNotification(notification) {
        logger_1.logger.info('SMS notification sent (simulated)', {
            notificationId: notification.id
        });
        await this.markAsDelivered(notification.tenantId, notification.id);
    }
    async sendPushNotification(notification) {
        logger_1.logger.info('Push notification sent (simulated)', {
            notificationId: notification.id
        });
        await this.markAsDelivered(notification.tenantId, notification.id);
    }
    async sendSlackNotification(notification) {
        logger_1.logger.info('Slack notification sent (simulated)', {
            notificationId: notification.id
        });
        await this.markAsDelivered(notification.tenantId, notification.id);
    }
    async sendTeamsNotification(notification) {
        logger_1.logger.info('Teams notification sent (simulated)', {
            notificationId: notification.id
        });
        await this.markAsDelivered(notification.tenantId, notification.id);
    }
    async sendWebhookNotification(notification) {
        logger_1.logger.info('Webhook notification sent (simulated)', {
            notificationId: notification.id
        });
        await this.markAsDelivered(notification.tenantId, notification.id);
    }
    async getNotificationStats(tenantId, userId, startDate, endDate) {
        try {
            const whereClause = { tenantId };
            if (userId) {
                whereClause.recipientId = userId;
            }
            if (startDate && endDate) {
                whereClause.createdAt = {
                    gte: startDate,
                    lte: endDate
                };
            }
            const notifications = await prisma_1.prisma.visitorNotification.findMany({
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
            const typeGroups = new Map();
            notifications.forEach(n => {
                const count = typeGroups.get(n.type) || 0;
                typeGroups.set(n.type, count + 1);
            });
            const byType = Array.from(typeGroups.entries()).map(([type, count]) => ({
                type,
                count
            }));
            const urgencyGroups = new Map();
            notifications.forEach(n => {
                const count = urgencyGroups.get(n.urgency) || 0;
                urgencyGroups.set(n.urgency, count + 1);
            });
            const byUrgency = Array.from(urgencyGroups.entries()).map(([urgency, count]) => ({
                urgency,
                count
            }));
            const delivered = notifications.filter(n => n.deliveredAt).length;
            const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get notification stats', {
                tenantId,
                userId
            }, error);
            throw error;
        }
    }
    async cleanupExpiredNotifications(tenantId) {
        try {
            const now = new Date();
            const whereClause = {
                expiresAt: { lt: now },
                status: { notIn: [client_1.NotificationStatus.EXPIRED] }
            };
            if (tenantId) {
                whereClause.tenantId = tenantId;
            }
            const result = await prisma_1.prisma.visitorNotification.updateMany({
                where: whereClause,
                data: {
                    status: client_1.NotificationStatus.EXPIRED
                }
            });
            logger_1.logger.info('Expired notifications cleaned up', { count: result.count });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup expired notifications', { tenantId }, error);
            throw error;
        }
    }
    getNotificationTemplate(type) {
        const templates = {
            [client_1.NotificationType.VISITOR_ARRIVAL]: {
                type: client_1.NotificationType.VISITOR_ARRIVAL,
                title: 'Visitor Arrived',
                messageTemplate: '{{visitorName}} has arrived and checked in{{location}}.',
                urgency: client_1.NotificationUrgency.NORMAL,
                actionText: 'View Details',
                channels: ['in_app', 'push']
            },
            [client_1.NotificationType.VISITOR_DEPARTURE]: {
                type: client_1.NotificationType.VISITOR_DEPARTURE,
                title: 'Visitor Departed',
                messageTemplate: '{{visitorName}} has checked out{{location}}.',
                urgency: client_1.NotificationUrgency.LOW,
                channels: ['in_app']
            },
            [client_1.NotificationType.VISITOR_LATE]: {
                type: client_1.NotificationType.VISITOR_LATE,
                title: 'Visitor Running Late',
                messageTemplate: '{{visitorName}} is {{minutes}} minutes late for their scheduled visit.',
                urgency: client_1.NotificationUrgency.NORMAL,
                channels: ['in_app', 'push']
            },
            [client_1.NotificationType.VISITOR_NO_SHOW]: {
                type: client_1.NotificationType.VISITOR_NO_SHOW,
                title: 'Visitor No-Show',
                messageTemplate: '{{visitorName}} did not show up for their scheduled visit at {{expectedTime}}.',
                urgency: client_1.NotificationUrgency.NORMAL,
                channels: ['in_app', 'email']
            },
            [client_1.NotificationType.PRE_REGISTRATION_REQUEST]: {
                type: client_1.NotificationType.PRE_REGISTRATION_REQUEST,
                title: 'New Visitor Pre-Registration',
                messageTemplate: '{{visitorName}} from {{company}} has requested to visit on {{expectedDate}}.',
                urgency: client_1.NotificationUrgency.NORMAL,
                actionText: 'Review Request',
                channels: ['in_app', 'email']
            },
            [client_1.NotificationType.PRE_REGISTRATION_APPROVED]: {
                type: client_1.NotificationType.PRE_REGISTRATION_APPROVED,
                title: 'Visitor Pre-Registration Approved',
                messageTemplate: '{{visitorName}} has been approved for their visit on {{expectedDate}}.',
                urgency: client_1.NotificationUrgency.LOW,
                channels: ['in_app']
            },
            [client_1.NotificationType.PRE_REGISTRATION_DENIED]: {
                type: client_1.NotificationType.PRE_REGISTRATION_DENIED,
                title: 'Visitor Pre-Registration Denied',
                messageTemplate: '{{visitorName}}\'s visit request for {{expectedDate}} has been denied.',
                urgency: client_1.NotificationUrgency.LOW,
                channels: ['in_app']
            },
            [client_1.NotificationType.ACCESS_CODE_GENERATED]: {
                type: client_1.NotificationType.ACCESS_CODE_GENERATED,
                title: 'Access Code Generated',
                messageTemplate: 'Access code {{accessCode}} has been generated for {{visitorName}}.',
                urgency: client_1.NotificationUrgency.NORMAL,
                channels: ['in_app', 'sms']
            },
            [client_1.NotificationType.SECURITY_ALERT]: {
                type: client_1.NotificationType.SECURITY_ALERT,
                title: 'Security Alert',
                messageTemplate: 'Security alert: {{alertDetails}}',
                urgency: client_1.NotificationUrgency.CRITICAL,
                channels: ['in_app', 'push', 'email']
            },
            [client_1.NotificationType.HOST_ASSIGNMENT]: {
                type: client_1.NotificationType.HOST_ASSIGNMENT,
                title: 'New Host Assignment',
                messageTemplate: 'You have been assigned as host for {{visitorName}}\'s visit.',
                urgency: client_1.NotificationUrgency.NORMAL,
                actionText: 'View Details',
                channels: ['in_app', 'email']
            },
            [client_1.NotificationType.VISIT_REMINDER]: {
                type: client_1.NotificationType.VISIT_REMINDER,
                title: 'Upcoming Visitor',
                messageTemplate: 'Reminder: {{visitorName}} is scheduled to visit in {{timeUntil}}.',
                urgency: client_1.NotificationUrgency.LOW,
                channels: ['in_app', 'push']
            },
            [client_1.NotificationType.POLICY_VIOLATION]: {
                type: client_1.NotificationType.POLICY_VIOLATION,
                title: 'Policy Violation',
                messageTemplate: 'Policy violation detected: {{violationDetails}}',
                urgency: client_1.NotificationUrgency.HIGH,
                channels: ['in_app', 'email']
            },
            [client_1.NotificationType.BADGE_ISSUE]: {
                type: client_1.NotificationType.BADGE_ISSUE,
                title: 'Badge Issue',
                messageTemplate: 'Badge {{badgeNumber}} issue: {{issueDetails}}',
                urgency: client_1.NotificationUrgency.NORMAL,
                channels: ['in_app']
            },
            [client_1.NotificationType.EXTENDED_STAY]: {
                type: client_1.NotificationType.EXTENDED_STAY,
                title: 'Extended Stay Request',
                messageTemplate: '{{visitorName}} has requested to extend their stay until {{newEndTime}}.',
                urgency: client_1.NotificationUrgency.NORMAL,
                actionText: 'Approve/Deny',
                channels: ['in_app', 'push']
            },
            [client_1.NotificationType.EMERGENCY_NOTIFICATION]: {
                type: client_1.NotificationType.EMERGENCY_NOTIFICATION,
                title: 'Emergency Notification',
                messageTemplate: 'EMERGENCY: {{emergencyDetails}}',
                urgency: client_1.NotificationUrgency.CRITICAL,
                channels: ['in_app', 'push', 'sms', 'email']
            }
        };
        return templates[type] || {
            type,
            title: 'Notification',
            messageTemplate: '{{message}}',
            urgency: client_1.NotificationUrgency.NORMAL,
            channels: ['in_app']
        };
    }
    buildNotificationWhereClause(tenantId, filters) {
        const whereClause = { tenantId };
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
    mapNotificationToData(notification) {
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
exports.visitorNotificationService = new VisitorNotificationService();
//# sourceMappingURL=visitorNotificationService.js.map
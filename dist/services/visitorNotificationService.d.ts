import { NotificationType, NotificationUrgency, DeliveryMethod, NotificationStatus } from '@prisma/client';
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
declare class VisitorNotificationService {
    createNotification(tenantId: string, request: CreateNotificationRequest): Promise<NotificationData>;
    getNotifications(tenantId: string, filters?: NotificationFilter, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        notifications: NotificationData[];
        total: number;
        hasMore: boolean;
    }>;
    getNotificationById(tenantId: string, notificationId: string): Promise<NotificationData | null>;
    markAsRead(tenantId: string, notificationId: string, userId: string): Promise<NotificationData>;
    markAsAcknowledged(tenantId: string, notificationId: string, userId: string): Promise<NotificationData>;
    markAllAsRead(tenantId: string, userId: string): Promise<number>;
    private markAsDelivered;
    sendScheduledNotifications(tenantId?: string): Promise<number>;
    private deliverNotification;
    private sendEmailNotification;
    private sendSMSNotification;
    private sendPushNotification;
    private sendSlackNotification;
    private sendTeamsNotification;
    private sendWebhookNotification;
    getNotificationStats(tenantId: string, userId?: string, startDate?: Date, endDate?: Date): Promise<NotificationStats>;
    cleanupExpiredNotifications(tenantId?: string): Promise<number>;
    getNotificationTemplate(type: NotificationType): NotificationTemplate;
    private buildNotificationWhereClause;
    private mapNotificationToData;
}
export declare const visitorNotificationService: VisitorNotificationService;
export {};
//# sourceMappingURL=visitorNotificationService.d.ts.map
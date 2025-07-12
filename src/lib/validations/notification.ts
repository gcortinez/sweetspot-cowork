import { z } from 'zod'

// Enums for notification-related fields
export const NotificationTypeSchema = z.enum([
  'EMAIL',
  'SMS',
  'PUSH',
  'IN_APP',
  'WEBHOOK',
  'SLACK',
  'TEAMS'
])

export const NotificationStatusSchema = z.enum([
  'PENDING',
  'QUEUED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'REJECTED',
  'CANCELLED'
])

export const NotificationPrioritySchema = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
])

export const NotificationCategorySchema = z.enum([
  'SYSTEM',
  'SECURITY',
  'BILLING',
  'BOOKING',
  'MEMBERSHIP',
  'CONTRACT',
  'VISITOR',
  'ACCESS_CONTROL',
  'MAINTENANCE',
  'MARKETING',
  'REMINDERS',
  'ALERTS'
])

export const TemplateTypeSchema = z.enum([
  'WELCOME',
  'PASSWORD_RESET',
  'EMAIL_VERIFICATION',
  'BOOKING_CONFIRMATION',
  'BOOKING_REMINDER',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'INVOICE_GENERATED',
  'MEMBERSHIP_RENEWAL',
  'CONTRACT_EXPIRING',
  'VISITOR_INVITATION',
  'ACCESS_GRANTED',
  'MAINTENANCE_SCHEDULED',
  'SECURITY_ALERT',
  'CUSTOM'
])

export const DeliveryMethodSchema = z.enum([
  'IMMEDIATE',
  'SCHEDULED',
  'BATCH',
  'TRIGGER_BASED'
])

// Recipient schema
export const NotificationRecipientSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  name: z.string().max(200).optional(),
  pushToken: z.string().max(500).optional(),
  webhookUrl: z.string().url().optional(),
  slackChannel: z.string().max(100).optional(),
  teamsChannel: z.string().max(100).optional(),
}).refine(
  (data) => data.userId || data.email || data.phone || data.pushToken || data.webhookUrl || data.slackChannel || data.teamsChannel,
  {
    message: 'At least one recipient identifier is required',
  }
)

// Template variable schema
export const TemplateVariableSchema = z.object({
  key: z.string().min(1, 'Variable key is required').max(100),
  value: z.any(),
  type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'OBJECT', 'ARRAY']).default('STRING'),
  description: z.string().max(300).optional(),
})

// Email configuration schema
export const EmailConfigSchema = z.object({
  subject: z.string().min(1, 'Email subject is required').max(300),
  fromName: z.string().max(100).optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  cc: z.array(z.string().email()).default([]),
  bcc: z.array(z.string().email()).default([]),
  attachments: z.array(z.object({
    filename: z.string().max(200),
    content: z.string().optional(), // Base64 encoded content
    contentType: z.string().max(100),
    url: z.string().url().optional(), // Alternative to content
    size: z.number().int().min(0).optional(),
  })).default([]),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
})

// SMS configuration schema
export const SMSConfigSchema = z.object({
  message: z.string().min(1, 'SMS message is required').max(1600),
  shortCode: z.string().max(10).optional(),
  campaignId: z.string().max(100).optional(),
})

// Push notification configuration schema
export const PushConfigSchema = z.object({
  title: z.string().min(1, 'Push title is required').max(100),
  body: z.string().min(1, 'Push body is required').max(500),
  icon: z.string().url().optional(),
  image: z.string().url().optional(),
  sound: z.string().max(50).optional(),
  badge: z.number().int().min(0).optional(),
  clickAction: z.string().url().optional(),
  data: z.record(z.string()).default({}),
  ttl: z.number().int().min(0).optional(), // Time to live in seconds
})

// Webhook configuration schema
export const WebhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.record(z.string()).default({}),
  payload: z.record(z.any()).default({}),
  timeout: z.number().int().min(1).max(300).default(30), // seconds
  retryAttempts: z.number().int().min(0).max(10).default(3),
  authentication: z.object({
    type: z.enum(['NONE', 'BASIC', 'BEARER', 'API_KEY']).default('NONE'),
    username: z.string().max(100).optional(),
    password: z.string().max(100).optional(),
    token: z.string().max(500).optional(),
    apiKey: z.string().max(500).optional(),
    apiKeyHeader: z.string().max(100).optional(),
  }).default({ type: 'NONE' }),
})

// Schedule configuration schema
export const ScheduleConfigSchema = z.object({
  sendAt: z.date().optional(), // Specific date/time
  timezone: z.string().max(50).default('UTC'),
  recurring: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    endDate: z.date().optional(),
    maxOccurrences: z.number().int().min(1).optional(),
  }).optional(),
  triggers: z.array(z.object({
    event: z.string().max(100),
    condition: z.string().max(500).optional(),
    delay: z.number().int().min(0).default(0), // minutes
  })).default([]),
})

// Base notification template schema
export const baseNotificationTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional(),
  type: TemplateTypeSchema,
  category: NotificationCategorySchema,
  
  // Template content
  subject: z.string().max(300).optional(), // For email/push
  content: z.string().min(1, 'Template content is required'),
  htmlContent: z.string().optional(), // For rich HTML emails
  
  // Supported delivery methods
  supportedTypes: z.array(NotificationTypeSchema).min(1, 'At least one notification type is required'),
  
  // Template variables
  variables: z.array(TemplateVariableSchema).default([]),
  
  // Localization
  language: z.string().length(2).default('en'), // ISO language code
  localized: z.record(z.object({
    subject: z.string().max(300).optional(),
    content: z.string().min(1),
    htmlContent: z.string().optional(),
  })).default({}),
  
  // Configuration for different types
  emailConfig: EmailConfigSchema.optional(),
  smsConfig: SMSConfigSchema.optional(),
  pushConfig: PushConfigSchema.optional(),
  
  // Template settings
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false), // System templates can't be deleted
  version: z.string().max(20).default('1.0'),
  
  // Approval workflow
  requiresApproval: z.boolean().default(false),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
  
  metadata: z.record(z.any()).optional(),
})

// Base notification schema
export const baseNotificationSchema = z.object({
  templateId: z.string().uuid().optional(),
  type: NotificationTypeSchema,
  category: NotificationCategorySchema,
  priority: NotificationPrioritySchema.default('NORMAL'),
  status: NotificationStatusSchema.default('PENDING'),
  
  // Recipients
  recipients: z.array(NotificationRecipientSchema).min(1, 'At least one recipient is required'),
  
  // Content
  subject: z.string().max(300).optional(),
  content: z.string().min(1, 'Notification content is required'),
  htmlContent: z.string().optional(),
  
  // Template variables
  variables: z.record(z.any()).default({}),
  
  // Configuration based on type
  emailConfig: EmailConfigSchema.optional(),
  smsConfig: SMSConfigSchema.optional(),
  pushConfig: PushConfigSchema.optional(),
  webhookConfig: WebhookConfigSchema.optional(),
  
  // Scheduling
  deliveryMethod: DeliveryMethodSchema.default('IMMEDIATE'),
  scheduleConfig: ScheduleConfigSchema.optional(),
  
  // Tracking and analytics
  trackingId: z.string().max(100).optional(),
  campaignId: z.string().max(100).optional(),
  
  // Delivery attempts
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().int().min(0).default(300), // seconds
  
  // Related entities
  userId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  membershipId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  
  // Delivery tracking
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  openedAt: z.date().optional(),
  clickedAt: z.date().optional(),
  errorMessage: z.string().max(1000).optional(),
  
  // Expiration
  expiresAt: z.date().optional(),
  
  metadata: z.record(z.any()).optional(),
})

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  
  // Global preferences
  globalSettings: z.object({
    enabled: z.boolean().default(true),
    quietHours: z.object({
      enabled: z.boolean().default(false),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
      timezone: z.string().max(50).default('UTC'),
    }).default({}),
    frequency: z.enum(['INSTANT', 'HOURLY', 'DAILY', 'WEEKLY']).default('INSTANT'),
  }).default({}),
  
  // Channel preferences
  channels: z.object({
    email: z.object({
      enabled: z.boolean().default(true),
      verified: z.boolean().default(false),
      address: z.string().email().optional(),
      frequency: z.enum(['INSTANT', 'HOURLY', 'DAILY', 'WEEKLY']).default('INSTANT'),
    }).default({ enabled: true }),
    
    sms: z.object({
      enabled: z.boolean().default(false),
      verified: z.boolean().default(false),
      phone: z.string().max(20).optional(),
      frequency: z.enum(['INSTANT', 'HOURLY', 'DAILY', 'WEEKLY']).default('INSTANT'),
    }).default({ enabled: false }),
    
    push: z.object({
      enabled: z.boolean().default(true),
      tokens: z.array(z.string()).default([]),
      frequency: z.enum(['INSTANT', 'HOURLY', 'DAILY', 'WEEKLY']).default('INSTANT'),
    }).default({ enabled: true }),
    
    inApp: z.object({
      enabled: z.boolean().default(true),
      showDesktop: z.boolean().default(true),
      frequency: z.enum(['INSTANT', 'HOURLY', 'DAILY', 'WEEKLY']).default('INSTANT'),
    }).default({ enabled: true }),
  }).default({}),
  
  // Category preferences
  categories: z.record(z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
    inApp: z.boolean().default(true),
    priority: NotificationPrioritySchema.default('NORMAL'),
  })).default({}),
  
  // Subscription preferences
  subscriptions: z.array(z.object({
    type: z.string().max(100),
    enabled: z.boolean(),
    channels: z.array(NotificationTypeSchema),
  })).default([]),
  
  metadata: z.record(z.any()).optional(),
})

// Create schemas
export const createNotificationTemplateSchema = baseNotificationTemplateSchema

export const createNotificationSchema = baseNotificationSchema.extend({
  sendImmediately: z.boolean().default(true),
  validateTemplate: z.boolean().default(true),
})

export const createNotificationPreferencesSchema = notificationPreferencesSchema

// Update schemas
export const updateNotificationTemplateSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
}).merge(baseNotificationTemplateSchema.partial())

export const updateNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
  status: NotificationStatusSchema.optional(),
  errorMessage: z.string().max(1000).optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  openedAt: z.date().optional(),
  clickedAt: z.date().optional(),
}).strict()

export const updateNotificationPreferencesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
}).merge(notificationPreferencesSchema.omit({ userId: true }).partial())

// Delete schemas
export const deleteNotificationTemplateSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
})

export const deleteNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
})

// Get schemas
export const getNotificationTemplateSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
})

export const getNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
})

export const getNotificationPreferencesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

// List schemas
export const listNotificationTemplatesSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: TemplateTypeSchema.optional(),
  category: NotificationCategorySchema.optional(),
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  language: z.string().length(2).optional(),
  sortBy: z.enum(['name', 'type', 'category', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listNotificationsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(50),
  type: NotificationTypeSchema.optional(),
  category: NotificationCategorySchema.optional(),
  status: NotificationStatusSchema.optional(),
  priority: NotificationPrioritySchema.optional(),
  userId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sortBy: z.enum(['createdAt', 'sentAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Notification operations
export const sendNotificationSchema = z.object({
  templateId: z.string().uuid().optional(),
  recipients: z.array(NotificationRecipientSchema).min(1),
  variables: z.record(z.any()).default({}),
  priority: NotificationPrioritySchema.default('NORMAL'),
  scheduleAt: z.date().optional(),
  customContent: z.object({
    subject: z.string().max(300).optional(),
    content: z.string().min(1).optional(),
    htmlContent: z.string().optional(),
  }).optional(),
})

export const resendNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
  resetRetryCount: z.boolean().default(false),
})

export const cancelNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
  reason: z.string().max(500).optional(),
})

export const markNotificationReadSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
  userId: z.string().uuid('Invalid user ID'),
})

export const bulkNotificationSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  recipientQuery: z.object({
    userIds: z.array(z.string().uuid()).optional(),
    clientIds: z.array(z.string().uuid()).optional(),
    roles: z.array(z.string()).optional(),
    membershipStatus: z.array(z.string()).optional(),
    customFilters: z.record(z.any()).default({}),
  }),
  variables: z.record(z.any()).default({}),
  priority: NotificationPrioritySchema.default('NORMAL'),
  scheduleAt: z.date().optional(),
  batchSize: z.number().int().min(1).max(1000).default(100),
})

// Analytics schemas
export const getNotificationAnalyticsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'type', 'category', 'status']).default('day'),
  includeDeliveryRates: z.boolean().default(true),
  includeEngagementRates: z.boolean().default(true),
})

export const getNotificationMetricsSchema = z.object({
  period: z.enum(['last_24_hours', 'last_7_days', 'last_30_days', 'custom']).default('last_7_days'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  types: z.array(NotificationTypeSchema).optional(),
  categories: z.array(NotificationCategorySchema).optional(),
})

// Type exports
export type NotificationType = z.infer<typeof NotificationTypeSchema>
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>
export type TemplateType = z.infer<typeof TemplateTypeSchema>
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>
export type NotificationRecipient = z.infer<typeof NotificationRecipientSchema>
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>
export type EmailConfig = z.infer<typeof EmailConfigSchema>
export type SMSConfig = z.infer<typeof SMSConfigSchema>
export type PushConfig = z.infer<typeof PushConfigSchema>
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>

export type CreateNotificationTemplateRequest = z.infer<typeof createNotificationTemplateSchema>
export type CreateNotificationRequest = z.infer<typeof createNotificationSchema>
export type CreateNotificationPreferencesRequest = z.infer<typeof createNotificationPreferencesSchema>
export type UpdateNotificationTemplateRequest = z.infer<typeof updateNotificationTemplateSchema>
export type UpdateNotificationRequest = z.infer<typeof updateNotificationSchema>
export type UpdateNotificationPreferencesRequest = z.infer<typeof updateNotificationPreferencesSchema>
export type DeleteNotificationTemplateRequest = z.infer<typeof deleteNotificationTemplateSchema>
export type DeleteNotificationRequest = z.infer<typeof deleteNotificationSchema>
export type GetNotificationTemplateRequest = z.infer<typeof getNotificationTemplateSchema>
export type GetNotificationRequest = z.infer<typeof getNotificationSchema>
export type GetNotificationPreferencesRequest = z.infer<typeof getNotificationPreferencesSchema>
export type ListNotificationTemplatesRequest = z.infer<typeof listNotificationTemplatesSchema>
export type ListNotificationsRequest = z.infer<typeof listNotificationsSchema>
export type SendNotificationRequest = z.infer<typeof sendNotificationSchema>
export type ResendNotificationRequest = z.infer<typeof resendNotificationSchema>
export type CancelNotificationRequest = z.infer<typeof cancelNotificationSchema>
export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadSchema>
export type BulkNotificationRequest = z.infer<typeof bulkNotificationSchema>
export type GetNotificationAnalyticsRequest = z.infer<typeof getNotificationAnalyticsSchema>
export type GetNotificationMetricsRequest = z.infer<typeof getNotificationMetricsSchema>
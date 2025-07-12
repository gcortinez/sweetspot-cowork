import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
  createNotificationTemplateSchema,
  createNotificationSchema,
  createNotificationPreferencesSchema,
  updateNotificationTemplateSchema,
  updateNotificationSchema,
  updateNotificationPreferencesSchema,
  deleteNotificationTemplateSchema,
  deleteNotificationSchema,
  getNotificationTemplateSchema,
  getNotificationSchema,
  getNotificationPreferencesSchema,
  listNotificationTemplatesSchema,
  listNotificationsSchema,
  sendNotificationSchema,
  resendNotificationSchema,
  cancelNotificationSchema,
  markNotificationReadSchema,
  bulkNotificationSchema,
  getNotificationAnalyticsSchema,
  getNotificationMetricsSchema,
  type CreateNotificationTemplateRequest,
  type CreateNotificationRequest,
  type CreateNotificationPreferencesRequest,
  type UpdateNotificationTemplateRequest,
  type UpdateNotificationRequest,
  type UpdateNotificationPreferencesRequest,
  type DeleteNotificationTemplateRequest,
  type DeleteNotificationRequest,
  type GetNotificationTemplateRequest,
  type GetNotificationRequest,
  type GetNotificationPreferencesRequest,
  type ListNotificationTemplatesRequest,
  type ListNotificationsRequest,
  type SendNotificationRequest,
  type ResendNotificationRequest,
  type CancelNotificationRequest,
  type MarkNotificationReadRequest,
  type BulkNotificationRequest,
  type GetNotificationAnalyticsRequest,
  type GetNotificationMetricsRequest,
} from '@/lib/validations/notification'

/**
 * Create a notification template
 */
export async function createNotificationTemplateAction(data: CreateNotificationTemplateRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createNotificationTemplateSchema.parse(data)

    // Check for duplicate template name
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        tenantId,
        name: validatedData.name,
        type: validatedData.type,
      },
    })

    if (existingTemplate) {
      return { success: false, error: 'Template with this name and type already exists' }
    }

    // Create notification template
    const template = await prisma.notificationTemplate.create({
      data: {
        ...validatedData,
        tenantId,
        supportedTypes: JSON.stringify(validatedData.supportedTypes),
        variables: JSON.stringify(validatedData.variables || []),
        localized: JSON.stringify(validatedData.localized || {}),
        emailConfig: validatedData.emailConfig ? JSON.stringify(validatedData.emailConfig) : null,
        smsConfig: validatedData.smsConfig ? JSON.stringify(validatedData.smsConfig) : null,
        pushConfig: validatedData.pushConfig ? JSON.stringify(validatedData.pushConfig) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/notifications/templates')
    
    return { 
      success: true, 
      data: {
        ...template,
        supportedTypes: JSON.parse(template.supportedTypes),
        variables: JSON.parse(template.variables),
        localized: JSON.parse(template.localized),
        emailConfig: template.emailConfig ? JSON.parse(template.emailConfig) : null,
        smsConfig: template.smsConfig ? JSON.parse(template.smsConfig) : null,
        pushConfig: template.pushConfig ? JSON.parse(template.pushConfig) : null,
        metadata: template.metadata ? JSON.parse(template.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create notification template error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create notification template' }
  }
}

/**
 * Create and send a notification
 */
export async function createNotificationAction(data: CreateNotificationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createNotificationSchema.parse(data)

    // Validate template if specified
    let template = null
    if (validatedData.templateId) {
      template = await prisma.notificationTemplate.findFirst({
        where: {
          id: validatedData.templateId,
          tenantId,
          isActive: true,
        },
      })

      if (!template) {
        return { success: false, error: 'Notification template not found or inactive' }
      }

      // Validate template supports the notification type
      const supportedTypes = JSON.parse(template.supportedTypes)
      if (!supportedTypes.includes(validatedData.type)) {
        return { success: false, error: 'Template does not support this notification type' }
      }
    }

    // Process template variables if using a template
    let processedContent = validatedData.content
    let processedSubject = validatedData.subject
    let processedHtmlContent = validatedData.htmlContent

    if (template) {
      processedContent = processTemplateContent(template.content, validatedData.variables)
      processedSubject = template.subject ? processTemplateContent(template.subject, validatedData.variables) : validatedData.subject
      processedHtmlContent = template.htmlContent ? processTemplateContent(template.htmlContent, validatedData.variables) : validatedData.htmlContent
    }

    // Create notification records for each recipient
    const notifications = []
    for (const recipient of validatedData.recipients) {
      const notification = await prisma.notification.create({
        data: {
          ...validatedData,
          tenantId,
          content: processedContent,
          subject: processedSubject,
          htmlContent: processedHtmlContent,
          recipient: JSON.stringify(recipient),
          variables: JSON.stringify(validatedData.variables || {}),
          emailConfig: validatedData.emailConfig ? JSON.stringify(validatedData.emailConfig) : null,
          smsConfig: validatedData.smsConfig ? JSON.stringify(validatedData.smsConfig) : null,
          pushConfig: validatedData.pushConfig ? JSON.stringify(validatedData.pushConfig) : null,
          webhookConfig: validatedData.webhookConfig ? JSON.stringify(validatedData.webhookConfig) : null,
          scheduleConfig: validatedData.scheduleConfig ? JSON.stringify(validatedData.scheduleConfig) : null,
          metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
          createdBy: user.id,
        },
      })

      notifications.push(notification)
    }

    // Send notifications immediately if requested
    if (validatedData.sendImmediately && validatedData.deliveryMethod === 'IMMEDIATE') {
      for (const notification of notifications) {
        await sendNotificationInternal(notification)
      }
    }

    revalidatePath('/notifications')
    
    return { 
      success: true, 
      data: {
        notifications: notifications.map(n => ({
          ...n,
          recipient: JSON.parse(n.recipient),
          variables: JSON.parse(n.variables),
          emailConfig: n.emailConfig ? JSON.parse(n.emailConfig) : null,
          smsConfig: n.smsConfig ? JSON.parse(n.smsConfig) : null,
          pushConfig: n.pushConfig ? JSON.parse(n.pushConfig) : null,
          webhookConfig: n.webhookConfig ? JSON.parse(n.webhookConfig) : null,
          scheduleConfig: n.scheduleConfig ? JSON.parse(n.scheduleConfig) : null,
          metadata: n.metadata ? JSON.parse(n.metadata) : null,
        })),
        count: notifications.length,
      }
    }
  } catch (error: any) {
    console.error('Create notification error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create notification' }
  }
}

/**
 * Create or update notification preferences for a user
 */
export async function createNotificationPreferencesAction(data: CreateNotificationPreferencesRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createNotificationPreferencesSchema.parse(data)

    // Verify user exists
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        tenantId,
      },
    })

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Check if preferences already exist
    const existingPreferences = await prisma.notificationPreferences.findFirst({
      where: {
        userId: validatedData.userId,
        tenantId,
      },
    })

    let preferences
    if (existingPreferences) {
      // Update existing preferences
      preferences = await prisma.notificationPreferences.update({
        where: { id: existingPreferences.id },
        data: {
          globalSettings: JSON.stringify(validatedData.globalSettings || {}),
          channels: JSON.stringify(validatedData.channels || {}),
          categories: JSON.stringify(validatedData.categories || {}),
          subscriptions: JSON.stringify(validatedData.subscriptions || []),
          metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        },
      })
    } else {
      // Create new preferences
      preferences = await prisma.notificationPreferences.create({
        data: {
          ...validatedData,
          tenantId,
          globalSettings: JSON.stringify(validatedData.globalSettings || {}),
          channels: JSON.stringify(validatedData.channels || {}),
          categories: JSON.stringify(validatedData.categories || {}),
          subscriptions: JSON.stringify(validatedData.subscriptions || []),
          metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        },
      })
    }

    revalidatePath(`/users/${validatedData.userId}/preferences`)
    
    return { 
      success: true, 
      data: {
        ...preferences,
        globalSettings: JSON.parse(preferences.globalSettings),
        channels: JSON.parse(preferences.channels),
        categories: JSON.parse(preferences.categories),
        subscriptions: JSON.parse(preferences.subscriptions),
        metadata: preferences.metadata ? JSON.parse(preferences.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create notification preferences error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create notification preferences' }
  }
}

/**
 * List notification templates with filtering and pagination
 */
export async function listNotificationTemplatesAction(data: ListNotificationTemplatesRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listNotificationTemplatesSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.category) {
      where.category = validatedData.category
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    if (validatedData.isSystem !== undefined) {
      where.isSystem = validatedData.isSystem
    }

    if (validatedData.language) {
      where.language = validatedData.language
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.notificationTemplate.count({ where })

    // Get templates
    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            notifications: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedTemplates = templates.map(template => ({
      ...template,
      supportedTypes: JSON.parse(template.supportedTypes),
      variables: JSON.parse(template.variables),
      localized: JSON.parse(template.localized),
      emailConfig: template.emailConfig ? JSON.parse(template.emailConfig) : null,
      smsConfig: template.smsConfig ? JSON.parse(template.smsConfig) : null,
      pushConfig: template.pushConfig ? JSON.parse(template.pushConfig) : null,
      metadata: template.metadata ? JSON.parse(template.metadata) : null,
      usageCount: template._count.notifications,
    }))
    
    return { 
      success: true, 
      data: {
        templates: processedTemplates,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List notification templates error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list notification templates' }
  }
}

/**
 * List notifications with filtering and pagination
 */
export async function listNotificationsAction(data: ListNotificationsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listNotificationsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.category) {
      where.category = validatedData.category
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.priority) {
      where.priority = validatedData.priority
    }

    if (validatedData.userId) {
      where.userId = validatedData.userId
    }

    if (validatedData.clientId) {
      where.clientId = validatedData.clientId
    }

    if (validatedData.dateFrom || validatedData.dateTo) {
      where.createdAt = {}
      if (validatedData.dateFrom) {
        where.createdAt.gte = validatedData.dateFrom
      }
      if (validatedData.dateTo) {
        where.createdAt.lte = validatedData.dateTo
      }
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.notification.count({ where })

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedNotifications = notifications.map(notification => ({
      ...notification,
      recipient: JSON.parse(notification.recipient),
      variables: JSON.parse(notification.variables),
      emailConfig: notification.emailConfig ? JSON.parse(notification.emailConfig) : null,
      smsConfig: notification.smsConfig ? JSON.parse(notification.smsConfig) : null,
      pushConfig: notification.pushConfig ? JSON.parse(notification.pushConfig) : null,
      webhookConfig: notification.webhookConfig ? JSON.parse(notification.webhookConfig) : null,
      scheduleConfig: notification.scheduleConfig ? JSON.parse(notification.scheduleConfig) : null,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        notifications: processedNotifications,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List notifications error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list notifications' }
  }
}

/**
 * Send a notification using a template
 */
export async function sendNotificationAction(data: SendNotificationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = sendNotificationSchema.parse(data)

    // Get template if specified
    let template = null
    if (validatedData.templateId) {
      template = await prisma.notificationTemplate.findFirst({
        where: {
          id: validatedData.templateId,
          tenantId,
          isActive: true,
        },
      })

      if (!template) {
        return { success: false, error: 'Notification template not found or inactive' }
      }
    }

    // Create notifications for each recipient
    const notifications = []
    for (const recipient of validatedData.recipients) {
      // Determine notification type based on recipient
      let notificationType = 'EMAIL'
      if (recipient.phone && !recipient.email) {
        notificationType = 'SMS'
      } else if (recipient.pushToken) {
        notificationType = 'PUSH'
      } else if (recipient.webhookUrl) {
        notificationType = 'WEBHOOK'
      }

      // Process content
      let content = validatedData.customContent?.content || template?.content || ''
      let subject = validatedData.customContent?.subject || template?.subject || ''
      let htmlContent = validatedData.customContent?.htmlContent || template?.htmlContent

      if (template) {
        content = processTemplateContent(content, validatedData.variables)
        subject = processTemplateContent(subject, validatedData.variables)
        if (htmlContent) {
          htmlContent = processTemplateContent(htmlContent, validatedData.variables)
        }
      }

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          tenantId,
          templateId: validatedData.templateId,
          type: notificationType,
          category: template?.category || 'SYSTEM',
          priority: validatedData.priority,
          status: validatedData.scheduleAt ? 'QUEUED' : 'PENDING',
          recipient: JSON.stringify(recipient),
          subject,
          content,
          htmlContent,
          variables: JSON.stringify(validatedData.variables || {}),
          deliveryMethod: validatedData.scheduleAt ? 'SCHEDULED' : 'IMMEDIATE',
          scheduleConfig: validatedData.scheduleAt ? JSON.stringify({ sendAt: validatedData.scheduleAt }) : null,
          createdBy: user.id,
        },
      })

      notifications.push(notification)

      // Send immediately if not scheduled
      if (!validatedData.scheduleAt) {
        await sendNotificationInternal(notification)
      }
    }

    revalidatePath('/notifications')
    
    return { 
      success: true, 
      data: {
        notifications: notifications.map(n => ({
          ...n,
          recipient: JSON.parse(n.recipient),
          variables: JSON.parse(n.variables),
          scheduleConfig: n.scheduleConfig ? JSON.parse(n.scheduleConfig) : null,
        })),
        count: notifications.length,
      }
    }
  } catch (error: any) {
    console.error('Send notification error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to send notification' }
  }
}

/**
 * Get a notification template by ID
 */
export async function getNotificationTemplateAction(data: GetNotificationTemplateRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getNotificationTemplateSchema.parse(data)

    // Get template
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            notifications: true,
          },
        },
      },
    })

    if (!template) {
      return { success: false, error: 'Notification template not found' }
    }

    return { 
      success: true, 
      data: {
        ...template,
        supportedTypes: JSON.parse(template.supportedTypes),
        variables: JSON.parse(template.variables),
        localized: JSON.parse(template.localized),
        emailConfig: template.emailConfig ? JSON.parse(template.emailConfig) : null,
        smsConfig: template.smsConfig ? JSON.parse(template.smsConfig) : null,
        pushConfig: template.pushConfig ? JSON.parse(template.pushConfig) : null,
        metadata: template.metadata ? JSON.parse(template.metadata) : null,
        usageCount: template._count.notifications,
      }
    }
  } catch (error: any) {
    console.error('Get notification template error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get notification template' }
  }
}

/**
 * Get a notification by ID
 */
export async function getNotificationAction(data: GetNotificationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getNotificationSchema.parse(data)

    // Get notification
    const notification = await prisma.notification.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    return { 
      success: true, 
      data: {
        ...notification,
        recipient: JSON.parse(notification.recipient),
        variables: JSON.parse(notification.variables),
        emailConfig: notification.emailConfig ? JSON.parse(notification.emailConfig) : null,
        smsConfig: notification.smsConfig ? JSON.parse(notification.smsConfig) : null,
        pushConfig: notification.pushConfig ? JSON.parse(notification.pushConfig) : null,
        webhookConfig: notification.webhookConfig ? JSON.parse(notification.webhookConfig) : null,
        scheduleConfig: notification.scheduleConfig ? JSON.parse(notification.scheduleConfig) : null,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Get notification error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get notification' }
  }
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferencesAction(data: GetNotificationPreferencesRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getNotificationPreferencesSchema.parse(data)

    // Get preferences
    const preferences = await prisma.notificationPreferences.findFirst({
      where: {
        userId: validatedData.userId,
        tenantId,
      },
    })

    if (!preferences) {
      return { success: false, error: 'Notification preferences not found' }
    }

    return { 
      success: true, 
      data: {
        ...preferences,
        globalSettings: JSON.parse(preferences.globalSettings),
        channels: JSON.parse(preferences.channels),
        categories: JSON.parse(preferences.categories),
        subscriptions: JSON.parse(preferences.subscriptions),
        metadata: preferences.metadata ? JSON.parse(preferences.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Get notification preferences error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get notification preferences' }
  }
}

/**
 * Update a notification template
 */
export async function updateNotificationTemplateAction(data: UpdateNotificationTemplateRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateNotificationTemplateSchema.parse(data)

    // Check if template exists
    const existingTemplate = await prisma.notificationTemplate.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingTemplate) {
      return { success: false, error: 'Notification template not found' }
    }

    // Update template
    const template = await prisma.notificationTemplate.update({
      where: { id: validatedData.id },
      data: {
        ...validatedData,
        supportedTypes: validatedData.supportedTypes ? JSON.stringify(validatedData.supportedTypes) : undefined,
        variables: validatedData.variables ? JSON.stringify(validatedData.variables) : undefined,
        localized: validatedData.localized ? JSON.stringify(validatedData.localized) : undefined,
        emailConfig: validatedData.emailConfig ? JSON.stringify(validatedData.emailConfig) : undefined,
        smsConfig: validatedData.smsConfig ? JSON.stringify(validatedData.smsConfig) : undefined,
        pushConfig: validatedData.pushConfig ? JSON.stringify(validatedData.pushConfig) : undefined,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : undefined,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/notifications/templates')
    revalidatePath(`/notifications/templates/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...template,
        supportedTypes: JSON.parse(template.supportedTypes),
        variables: JSON.parse(template.variables),
        localized: JSON.parse(template.localized),
        emailConfig: template.emailConfig ? JSON.parse(template.emailConfig) : null,
        smsConfig: template.smsConfig ? JSON.parse(template.smsConfig) : null,
        pushConfig: template.pushConfig ? JSON.parse(template.pushConfig) : null,
        metadata: template.metadata ? JSON.parse(template.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update notification template error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update notification template' }
  }
}

/**
 * Update a notification
 */
export async function updateNotificationAction(data: UpdateNotificationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateNotificationSchema.parse(data)

    // Check if notification exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingNotification) {
      return { success: false, error: 'Notification not found' }
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        errorMessage: validatedData.errorMessage,
        sentAt: validatedData.sentAt,
        deliveredAt: validatedData.deliveredAt,
        openedAt: validatedData.openedAt,
        clickedAt: validatedData.clickedAt,
      },
    })

    revalidatePath('/notifications')
    revalidatePath(`/notifications/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...notification,
        recipient: JSON.parse(notification.recipient),
        variables: JSON.parse(notification.variables),
        metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update notification error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update notification' }
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferencesAction(data: UpdateNotificationPreferencesRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateNotificationPreferencesSchema.parse(data)

    // Verify user exists
    const targetUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        tenantId,
      },
    })

    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }

    // Update preferences
    const preferences = await prisma.notificationPreferences.updateMany({
      where: {
        userId: validatedData.userId,
        tenantId,
      },
      data: {
        globalSettings: validatedData.globalSettings ? JSON.stringify(validatedData.globalSettings) : undefined,
        channels: validatedData.channels ? JSON.stringify(validatedData.channels) : undefined,
        categories: validatedData.categories ? JSON.stringify(validatedData.categories) : undefined,
        subscriptions: validatedData.subscriptions ? JSON.stringify(validatedData.subscriptions) : undefined,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : undefined,
      },
    })

    // Get updated preferences
    const updatedPreferences = await prisma.notificationPreferences.findFirst({
      where: {
        userId: validatedData.userId,
        tenantId,
      },
    })

    revalidatePath(`/users/${validatedData.userId}/preferences`)
    
    return { 
      success: true, 
      data: updatedPreferences ? {
        ...updatedPreferences,
        globalSettings: JSON.parse(updatedPreferences.globalSettings),
        channels: JSON.parse(updatedPreferences.channels),
        categories: JSON.parse(updatedPreferences.categories),
        subscriptions: JSON.parse(updatedPreferences.subscriptions),
        metadata: updatedPreferences.metadata ? JSON.parse(updatedPreferences.metadata) : null,
      } : null
    }
  } catch (error: any) {
    console.error('Update notification preferences error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update notification preferences' }
  }
}

/**
 * Delete a notification template
 */
export async function deleteNotificationTemplateAction(data: DeleteNotificationTemplateRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteNotificationTemplateSchema.parse(data)

    // Check if template exists and is not a system template
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!template) {
      return { success: false, error: 'Notification template not found' }
    }

    if (template.isSystem) {
      return { success: false, error: 'Cannot delete system templates' }
    }

    // Soft delete template
    await prisma.notificationTemplate.update({
      where: { id: validatedData.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    revalidatePath('/notifications/templates')
    
    return { success: true, data: { message: 'Notification template deleted successfully' } }
  } catch (error: any) {
    console.error('Delete notification template error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to delete notification template' }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(data: DeleteNotificationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteNotificationSchema.parse(data)

    // Check if notification exists
    const notification = await prisma.notification.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    // Soft delete notification
    await prisma.notification.update({
      where: { id: validatedData.id },
      data: {
        deletedAt: new Date(),
      },
    })

    revalidatePath('/notifications')
    
    return { success: true, data: { message: 'Notification deleted successfully' } }
  } catch (error: any) {
    console.error('Delete notification error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to delete notification' }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationReadAction(data: MarkNotificationReadRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = markNotificationReadSchema.parse(data)

    // Get notification
    const notification = await prisma.notification.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: validatedData.id },
      data: {
        openedAt: new Date(),
        status: 'DELIVERED',
      },
    })

    revalidatePath('/notifications')
    
    return { 
      success: true, 
      data: {
        ...updatedNotification,
        recipient: JSON.parse(updatedNotification.recipient),
        variables: JSON.parse(updatedNotification.variables),
        metadata: updatedNotification.metadata ? JSON.parse(updatedNotification.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Mark notification read error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to mark notification as read' }
  }
}

/**
 * Get notification analytics
 */
export async function getNotificationAnalyticsAction(data: GetNotificationAnalyticsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getNotificationAnalyticsSchema.parse(data)

    // Set default date range if not provided
    const endDate = validatedData.endDate || new Date()
    const startDate = validatedData.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    // Build where clause
    const where: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Get analytics based on groupBy parameter
    let analytics: any = {}

    switch (validatedData.groupBy) {
      case 'day':
      case 'week':
      case 'month':
        analytics = await getTimeBasedNotificationAnalytics(where, validatedData.groupBy)
        break
      case 'type':
        analytics = await getTypeBasedAnalytics(where)
        break
      case 'category':
        analytics = await getCategoryBasedAnalytics(where)
        break
      case 'status':
        analytics = await getStatusBasedAnalytics(where)
        break
    }

    // Get summary metrics
    const summary = await getNotificationSummaryMetrics(where, validatedData)

    return { 
      success: true, 
      data: {
        analytics,
        summary,
        period: {
          startDate,
          endDate,
          groupBy: validatedData.groupBy,
        },
      }
    }
  } catch (error: any) {
    console.error('Get notification analytics error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get notification analytics' }
  }
}

/**
 * Helper functions
 */
function processTemplateContent(content: string, variables: Record<string, any>): string {
  // Simple template variable replacement
  let processedContent = content
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    processedContent = processedContent.replace(regex, String(value))
  })
  
  return processedContent
}

async function sendNotificationInternal(notification: any): Promise<void> {
  try {
    // Update status to sending
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'SENDING' },
    })

    // Here you would integrate with actual notification services
    // For now, simulate sending
    const recipient = JSON.parse(notification.recipient)
    
    switch (notification.type) {
      case 'EMAIL':
        await sendEmailNotification(notification, recipient)
        break
      case 'SMS':
        await sendSMSNotification(notification, recipient)
        break
      case 'PUSH':
        await sendPushNotification(notification, recipient)
        break
      case 'WEBHOOK':
        await sendWebhookNotification(notification, recipient)
        break
    }

    // Update status to sent
    await prisma.notification.update({
      where: { id: notification.id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  } catch (error) {
    // Update status to failed
    await prisma.notification.update({
      where: { id: notification.id },
      data: { 
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
}

async function sendEmailNotification(notification: any, recipient: any): Promise<void> {
  // TODO: Integrate with email service (SendGrid, SES, etc.)
  console.log('Sending email notification:', {
    to: recipient.email,
    subject: notification.subject,
    content: notification.content,
  })
}

async function sendSMSNotification(notification: any, recipient: any): Promise<void> {
  // TODO: Integrate with SMS service (Twilio, etc.)
  console.log('Sending SMS notification:', {
    to: recipient.phone,
    message: notification.content,
  })
}

async function sendPushNotification(notification: any, recipient: any): Promise<void> {
  // TODO: Integrate with push notification service (FCM, etc.)
  console.log('Sending push notification:', {
    token: recipient.pushToken,
    title: notification.subject,
    body: notification.content,
  })
}

async function sendWebhookNotification(notification: any, recipient: any): Promise<void> {
  // TODO: Integrate with webhook service
  console.log('Sending webhook notification:', {
    url: recipient.webhookUrl,
    payload: {
      subject: notification.subject,
      content: notification.content,
    },
  })
}

async function getTimeBasedNotificationAnalytics(where: any, groupBy: string) {
  const result = await prisma.notification.groupBy({
    by: ['createdAt'],
    where,
    _count: true,
  })

  return result.map(item => ({
    period: item.createdAt,
    count: item._count,
  }))
}

async function getTypeBasedAnalytics(where: any) {
  return await prisma.notification.groupBy({
    by: ['type'],
    where,
    _count: true,
  })
}

async function getCategoryBasedAnalytics(where: any) {
  return await prisma.notification.groupBy({
    by: ['category'],
    where,
    _count: true,
  })
}

async function getStatusBasedAnalytics(where: any) {
  return await prisma.notification.groupBy({
    by: ['status'],
    where,
    _count: true,
  })
}

async function getNotificationSummaryMetrics(where: any, options: any) {
  const [total, sent, delivered, failed] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, status: 'SENT' } }),
    prisma.notification.count({ where: { ...where, status: 'DELIVERED' } }),
    prisma.notification.count({ where: { ...where, status: 'FAILED' } }),
  ])

  // Calculate delivery and engagement rates
  const deliveryRate = total > 0 ? (sent / total) * 100 : 0
  const engagementRate = sent > 0 ? (delivered / sent) * 100 : 0

  return {
    total,
    sent,
    delivered,
    failed,
    deliveryRate,
    engagementRate,
  }
}
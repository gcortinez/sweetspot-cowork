import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
  createAccessLogSchema,
  createAccessPointSchema,
  createAccessCredentialSchema,
  updateAccessPointSchema,
  updateAccessCredentialSchema,
  deleteAccessPointSchema,
  deleteAccessCredentialSchema,
  getAccessPointSchema,
  getAccessCredentialSchema,
  listAccessLogsSchema,
  listAccessPointsSchema,
  listAccessCredentialsSchema,
  controlAccessPointSchema,
  grantAccessSchema,
  createAccessAlertSchema,
  getAccessAnalyticsSchema,
  getOccupancySchema,
  type CreateAccessLogRequest,
  type CreateAccessPointRequest,
  type CreateAccessCredentialRequest,
  type UpdateAccessPointRequest,
  type UpdateAccessCredentialRequest,
  type DeleteAccessPointRequest,
  type DeleteAccessCredentialRequest,
  type GetAccessPointRequest,
  type GetAccessCredentialRequest,
  type ListAccessLogsRequest,
  type ListAccessPointsRequest,
  type ListAccessCredentialsRequest,
  type ControlAccessPointRequest,
  type GrantAccessRequest,
  type CreateAccessAlertRequest,
  type GetAccessAnalyticsRequest,
  type GetOccupancyRequest,
} from '@/lib/validations/access-control'

/**
 * Create an access log entry
 */
export async function createAccessLogAction(data: CreateAccessLogRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createAccessLogSchema.parse(data)

    // Verify access point exists
    const accessPoint = await prisma.accessPoint.findFirst({
      where: {
        id: validatedData.accessPointId,
        tenantId,
      },
    })

    if (!accessPoint) {
      return { success: false, error: 'Access point not found' }
    }

    // Create access log
    const accessLog = await prisma.accessLog.create({
      data: {
        ...validatedData,
        tenantId,
        location: validatedData.location ? JSON.stringify(validatedData.location) : null,
        deviceInfo: validatedData.deviceInfo ? JSON.stringify(validatedData.deviceInfo) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        accessPoint: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        visitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    })

    // Update occupancy counts
    if (validatedData.granted) {
      await updateOccupancyCount(accessPoint.id, validatedData.type)
    }

    // Check for alerts
    await checkAccessAlerts(accessLog, tenantId)

    revalidatePath('/access-control/logs')
    
    return { 
      success: true, 
      data: {
        ...accessLog,
        location: accessLog.location ? JSON.parse(accessLog.location) : null,
        deviceInfo: accessLog.deviceInfo ? JSON.parse(accessLog.deviceInfo) : null,
        metadata: accessLog.metadata ? JSON.parse(accessLog.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create access log error:', error)
    
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

    return { success: false, error: 'Failed to create access log' }
  }
}

/**
 * Create an access point
 */
export async function createAccessPointAction(data: CreateAccessPointRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createAccessPointSchema.parse(data)

    // Create access point
    const accessPoint = await prisma.accessPoint.create({
      data: {
        ...validatedData,
        tenantId,
        location: JSON.stringify(validatedData.location),
        hardware: validatedData.hardware ? JSON.stringify(validatedData.hardware) : null,
        config: JSON.stringify(validatedData.config || {}),
        currentState: validatedData.currentState ? JSON.stringify(validatedData.currentState) : null,
        maintenanceSchedule: validatedData.maintenanceSchedule ? JSON.stringify(validatedData.maintenanceSchedule) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        tenant: true,
      },
    })

    revalidatePath('/access-control/points')
    
    return { 
      success: true, 
      data: {
        ...accessPoint,
        location: JSON.parse(accessPoint.location),
        hardware: accessPoint.hardware ? JSON.parse(accessPoint.hardware) : null,
        config: JSON.parse(accessPoint.config),
        currentState: accessPoint.currentState ? JSON.parse(accessPoint.currentState) : null,
        maintenanceSchedule: accessPoint.maintenanceSchedule ? JSON.parse(accessPoint.maintenanceSchedule) : null,
        metadata: accessPoint.metadata ? JSON.parse(accessPoint.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create access point error:', error)
    
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

    return { success: false, error: 'Failed to create access point' }
  }
}

/**
 * Create an access credential
 */
export async function createAccessCredentialAction(data: CreateAccessCredentialRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createAccessCredentialSchema.parse(data)

    // Verify user or visitor exists
    if (validatedData.userId) {
      const userExists = await prisma.user.findFirst({
        where: {
          id: validatedData.userId,
          tenantId,
        },
      })

      if (!userExists) {
        return { success: false, error: 'User not found' }
      }
    }

    if (validatedData.visitorId) {
      const visitorExists = await prisma.visitor.findFirst({
        where: {
          id: validatedData.visitorId,
          tenantId,
        },
      })

      if (!visitorExists) {
        return { success: false, error: 'Visitor not found' }
      }
    }

    // Check for duplicate credential
    const existingCredential = await prisma.accessCredential.findFirst({
      where: {
        tenantId,
        credentialType: validatedData.credentialType,
        credentialValue: validatedData.credentialValue,
        isActive: true,
      },
    })

    if (existingCredential) {
      return { success: false, error: 'Credential already exists' }
    }

    // Create access credential
    const accessCredential = await prisma.accessCredential.create({
      data: {
        ...validatedData,
        tenantId,
        accessSchedule: validatedData.accessSchedule ? JSON.stringify(validatedData.accessSchedule) : null,
        issuedBy: user.id,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        visitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        issuedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/access-control/credentials')
    
    return { 
      success: true, 
      data: {
        ...accessCredential,
        accessSchedule: accessCredential.accessSchedule ? JSON.parse(accessCredential.accessSchedule) : null,
        metadata: accessCredential.metadata ? JSON.parse(accessCredential.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create access credential error:', error)
    
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

    return { success: false, error: 'Failed to create access credential' }
  }
}

/**
 * List access logs with filtering and pagination
 */
export async function listAccessLogsAction(data: ListAccessLogsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listAccessLogsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.method) {
      where.method = validatedData.method
    }

    if (validatedData.accessPointId) {
      where.accessPointId = validatedData.accessPointId
    }

    if (validatedData.userId) {
      where.userId = validatedData.userId
    }

    if (validatedData.visitorId) {
      where.visitorId = validatedData.visitorId
    }

    if (validatedData.granted !== undefined) {
      where.granted = validatedData.granted
    }

    if (validatedData.dateFrom || validatedData.dateTo) {
      where.timestamp = {}
      if (validatedData.dateFrom) {
        where.timestamp.gte = validatedData.dateFrom
      }
      if (validatedData.dateTo) {
        where.timestamp.lte = validatedData.dateTo
      }
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.accessLog.count({ where })

    // Get access logs
    const accessLogs = await prisma.accessLog.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        accessPoint: {
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
        visitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedAccessLogs = accessLogs.map(log => ({
      ...log,
      location: log.location ? JSON.parse(log.location) : null,
      deviceInfo: log.deviceInfo ? JSON.parse(log.deviceInfo) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        accessLogs: processedAccessLogs,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List access logs error:', error)
    
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

    return { success: false, error: 'Failed to list access logs' }
  }
}

/**
 * List access points with filtering and pagination
 */
export async function listAccessPointsAction(data: ListAccessPointsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listAccessPointsSchema.parse(data)

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

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.building) {
      where.location = {
        path: '$.building',
        equals: validatedData.building,
      }
    }

    if (validatedData.floor) {
      where.location = {
        ...where.location,
        path: '$.floor',
        equals: validatedData.floor,
      }
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.accessPoint.count({ where })

    // Get access points
    const accessPoints = await prisma.accessPoint.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
      },
    })

    // Process JSON fields
    const processedAccessPoints = accessPoints.map(point => ({
      ...point,
      location: JSON.parse(point.location),
      hardware: point.hardware ? JSON.parse(point.hardware) : null,
      config: JSON.parse(point.config),
      currentState: point.currentState ? JSON.parse(point.currentState) : null,
      maintenanceSchedule: point.maintenanceSchedule ? JSON.parse(point.maintenanceSchedule) : null,
      metadata: point.metadata ? JSON.parse(point.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        accessPoints: processedAccessPoints,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List access points error:', error)
    
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

    return { success: false, error: 'Failed to list access points' }
  }
}

/**
 * Control an access point (lock, unlock, etc.)
 */
export async function controlAccessPointAction(data: ControlAccessPointRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = controlAccessPointSchema.parse(data)

    // Get access point
    const accessPoint = await prisma.accessPoint.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!accessPoint) {
      return { success: false, error: 'Access point not found' }
    }

    // Update access point state based on action
    let newStatus = accessPoint.status
    let newDoorStatus = 'CLOSED'

    switch (validatedData.action) {
      case 'LOCK':
        newStatus = 'ACTIVE'
        newDoorStatus = 'LOCKED'
        break
      case 'UNLOCK':
        newStatus = 'ACTIVE'
        newDoorStatus = 'UNLOCKED'
        break
      case 'EMERGENCY_OPEN':
        newStatus = 'EMERGENCY_OPEN'
        newDoorStatus = 'OPEN'
        break
      case 'RESET':
        newStatus = 'ACTIVE'
        newDoorStatus = 'CLOSED'
        break
      case 'RESTART':
        // Simulate restart - temporarily offline then back online
        newStatus = 'MAINTENANCE'
        setTimeout(async () => {
          await prisma.accessPoint.update({
            where: { id: validatedData.id },
            data: {
              status: 'ACTIVE',
              currentState: JSON.stringify({
                doorStatus: 'CLOSED',
                lastStatusChange: new Date(),
                online: true,
              }),
            },
          })
        }, 5000)
        break
    }

    // Update access point
    const updatedAccessPoint = await prisma.accessPoint.update({
      where: { id: validatedData.id },
      data: {
        status: newStatus,
        currentState: JSON.stringify({
          doorStatus: newDoorStatus,
          lastStatusChange: new Date(),
          online: validatedData.action !== 'RESTART',
        }),
      },
    })

    // Log the control action
    await prisma.accessLog.create({
      data: {
        tenantId,
        type: 'FORCED',
        method: 'MANUAL',
        accessPointId: validatedData.id,
        userId: user.id,
        granted: true,
        timestamp: new Date(),
        notes: `Manual control: ${validatedData.action}${validatedData.reason ? ` - ${validatedData.reason}` : ''}`,
        metadata: JSON.stringify({
          controlAction: validatedData.action,
          duration: validatedData.duration,
          reason: validatedData.reason,
          controlledBy: user.id,
        }),
      },
    })

    revalidatePath('/access-control/points')
    
    return { 
      success: true, 
      data: {
        ...updatedAccessPoint,
        location: JSON.parse(updatedAccessPoint.location),
        hardware: updatedAccessPoint.hardware ? JSON.parse(updatedAccessPoint.hardware) : null,
        config: JSON.parse(updatedAccessPoint.config),
        currentState: JSON.parse(updatedAccessPoint.currentState),
        maintenanceSchedule: updatedAccessPoint.maintenanceSchedule ? JSON.parse(updatedAccessPoint.maintenanceSchedule) : null,
        metadata: updatedAccessPoint.metadata ? JSON.parse(updatedAccessPoint.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Control access point error:', error)
    
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

    return { success: false, error: 'Failed to control access point' }
  }
}

/**
 * Grant temporary access
 */
export async function grantAccessAction(data: GrantAccessRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = grantAccessSchema.parse(data)

    // Get access point
    const accessPoint = await prisma.accessPoint.findFirst({
      where: {
        id: validatedData.accessPointId,
        tenantId,
      },
    })

    if (!accessPoint) {
      return { success: false, error: 'Access point not found' }
    }

    // Verify user or visitor if specified
    if (validatedData.userId) {
      const userExists = await prisma.user.findFirst({
        where: {
          id: validatedData.userId,
          tenantId,
        },
      })

      if (!userExists) {
        return { success: false, error: 'User not found' }
      }
    }

    if (validatedData.visitorId) {
      const visitorExists = await prisma.visitor.findFirst({
        where: {
          id: validatedData.visitorId,
          tenantId,
        },
      })

      if (!visitorExists) {
        return { success: false, error: 'Visitor not found' }
      }
    }

    // Create access log entry
    const accessLog = await prisma.accessLog.create({
      data: {
        tenantId,
        type: 'ENTRY',
        method: 'MANUAL',
        accessPointId: validatedData.accessPointId,
        userId: validatedData.userId,
        visitorId: validatedData.visitorId,
        granted: true,
        timestamp: new Date(),
        notes: `Manual access granted${validatedData.reason ? ` - ${validatedData.reason}` : ''}`,
        emergencyOverride: validatedData.override,
        metadata: JSON.stringify({
          duration: validatedData.duration,
          reason: validatedData.reason,
          override: validatedData.override,
          grantedBy: user.id,
        }),
      },
      include: {
        accessPoint: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        visitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    })

    // Temporarily unlock the access point
    await prisma.accessPoint.update({
      where: { id: validatedData.accessPointId },
      data: {
        currentState: JSON.stringify({
          doorStatus: 'UNLOCKED',
          lastStatusChange: new Date(),
          online: true,
        }),
      },
    })

    // Lock it back after the specified duration
    setTimeout(async () => {
      await prisma.accessPoint.update({
        where: { id: validatedData.accessPointId },
        data: {
          currentState: JSON.stringify({
            doorStatus: 'LOCKED',
            lastStatusChange: new Date(),
            online: true,
          }),
        },
      })
    }, validatedData.duration * 1000)

    revalidatePath('/access-control/logs')
    
    return { 
      success: true, 
      data: {
        ...accessLog,
        location: accessLog.location ? JSON.parse(accessLog.location) : null,
        deviceInfo: accessLog.deviceInfo ? JSON.parse(accessLog.deviceInfo) : null,
        metadata: accessLog.metadata ? JSON.parse(accessLog.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Grant access error:', error)
    
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

    return { success: false, error: 'Failed to grant access' }
  }
}

/**
 * Get access analytics
 */
export async function getAccessAnalyticsAction(data: GetAccessAnalyticsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getAccessAnalyticsSchema.parse(data)

    // Set default date range if not provided
    const endDate = validatedData.endDate || new Date()
    const startDate = validatedData.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    // Build where clause for access logs
    const where: any = {
      tenantId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (validatedData.accessPointIds && validatedData.accessPointIds.length > 0) {
      where.accessPointId = { in: validatedData.accessPointIds }
    }

    if (!validatedData.includeVisitors) {
      where.visitorId = null
    }

    // Get analytics based on groupBy parameter
    let analytics: any = {}

    switch (validatedData.groupBy) {
      case 'hour':
      case 'day':
      case 'week':
      case 'month':
        analytics = await getTimeBasedAnalytics(where, validatedData.groupBy)
        break
      case 'accessPoint':
        analytics = await getAccessPointAnalytics(where)
        break
      case 'user':
        analytics = await getUserAnalytics(where)
        break
      case 'method':
        analytics = await getMethodAnalytics(where)
        break
      case 'type':
        analytics = await getTypeAnalytics(where)
        break
    }

    // Get summary statistics
    const summary = await getSummaryStatistics(where)

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
    console.error('Get access analytics error:', error)
    
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

    return { success: false, error: 'Failed to get access analytics' }
  }
}

/**
 * Helper functions for analytics
 */
async function updateOccupancyCount(accessPointId: string, accessType: string) {
  // Update occupancy counts based on entry/exit
  // This is a simplified implementation
  const accessPoint = await prisma.accessPoint.findUnique({
    where: { id: accessPointId },
  })

  if (accessPoint) {
    const config = JSON.parse(accessPoint.config)
    if (config.occupancyLimit?.enabled) {
      const change = accessType === 'ENTRY' ? 1 : accessType === 'EXIT' ? -1 : 0
      const newOccupancy = Math.max(0, (config.occupancyLimit.currentOccupancy || 0) + change)
      
      config.occupancyLimit.currentOccupancy = newOccupancy
      
      await prisma.accessPoint.update({
        where: { id: accessPointId },
        data: { config: JSON.stringify(config) },
      })
    }
  }
}

async function checkAccessAlerts(accessLog: any, tenantId: string) {
  // Check for various alert conditions
  const alerts = []

  // Denied access alert
  if (!accessLog.granted) {
    alerts.push({
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      message: `Access denied at ${accessLog.accessPoint.name}`,
    })
  }

  // Forced entry alert
  if (accessLog.forcedEntry) {
    alerts.push({
      type: 'FORCED_ENTRY',
      severity: 'HIGH',
      message: `Forced entry detected at ${accessLog.accessPoint.name}`,
    })
  }

  // Tailgating alert
  if (accessLog.tailgateDetected) {
    alerts.push({
      type: 'TAILGATING',
      severity: 'MEDIUM',
      message: `Tailgating detected at ${accessLog.accessPoint.name}`,
    })
  }

  // Create alert records
  for (const alert of alerts) {
    await prisma.accessAlert.create({
      data: {
        ...alert,
        tenantId,
        accessPointId: accessLog.accessPointId,
        accessLogId: accessLog.id,
        userId: accessLog.userId,
        visitorId: accessLog.visitorId,
      },
    })
  }
}

async function getTimeBasedAnalytics(where: any, groupBy: string) {
  // This would implement time-based grouping analytics
  // For now, return a simple count by day
  const result = await prisma.accessLog.groupBy({
    by: ['timestamp'],
    where,
    _count: true,
  })

  return result.map(item => ({
    period: item.timestamp,
    count: item._count,
  }))
}

async function getAccessPointAnalytics(where: any) {
  return await prisma.accessLog.groupBy({
    by: ['accessPointId'],
    where,
    _count: true,
  })
}

async function getUserAnalytics(where: any) {
  return await prisma.accessLog.groupBy({
    by: ['userId'],
    where,
    _count: true,
  })
}

async function getMethodAnalytics(where: any) {
  return await prisma.accessLog.groupBy({
    by: ['method'],
    where,
    _count: true,
  })
}

async function getTypeAnalytics(where: any) {
  return await prisma.accessLog.groupBy({
    by: ['type'],
    where,
    _count: true,
  })
}

async function getSummaryStatistics(where: any) {
  const [total, granted, denied] = await Promise.all([
    prisma.accessLog.count({ where }),
    prisma.accessLog.count({ where: { ...where, granted: true } }),
    prisma.accessLog.count({ where: { ...where, granted: false } }),
  ])

  return {
    total,
    granted,
    denied,
    denialRate: total > 0 ? (denied / total) * 100 : 0,
  }
}
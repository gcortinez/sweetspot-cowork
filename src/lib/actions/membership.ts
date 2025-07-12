import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
  createMembershipPlanSchema,
  createMembershipSchema,
  updateMembershipPlanSchema,
  updateMembershipSchema,
  deleteMembershipPlanSchema,
  deleteMembershipSchema,
  getMembershipPlanSchema,
  getMembershipSchema,
  listMembershipPlansSchema,
  listMembershipsSchema,
  suspendMembershipSchema,
  reactivateMembershipSchema,
  renewMembershipSchema,
  upgradeMembershipSchema,
  addMembershipAddOnSchema,
  removeMembershipAddOnSchema,
  trackMembershipUsageSchema,
  getMembershipUsageSchema,
  getMembershipAnalyticsSchema,
  getMembershipMetricsSchema,
  processMembershipBillingSchema,
  updateMembershipPaymentMethodSchema,
  type CreateMembershipPlanRequest,
  type CreateMembershipRequest,
  type UpdateMembershipPlanRequest,
  type UpdateMembershipRequest,
  type DeleteMembershipPlanRequest,
  type DeleteMembershipRequest,
  type GetMembershipPlanRequest,
  type GetMembershipRequest,
  type ListMembershipPlansRequest,
  type ListMembershipsRequest,
  type SuspendMembershipRequest,
  type ReactivateMembershipRequest,
  type RenewMembershipRequest,
  type UpgradeMembershipRequest,
  type AddMembershipAddOnRequest,
  type RemoveMembershipAddOnRequest,
  type TrackMembershipUsageRequest,
  type GetMembershipUsageRequest,
  type GetMembershipAnalyticsRequest,
  type GetMembershipMetricsRequest,
  type ProcessMembershipBillingRequest,
  type UpdateMembershipPaymentMethodRequest,
} from '@/lib/validations/membership'

/**
 * Create a new membership plan
 */
export async function createMembershipPlanAction(data: CreateMembershipPlanRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createMembershipPlanSchema.parse(data)

    // Create membership plan
    const membershipPlan = await prisma.membershipPlan.create({
      data: {
        ...validatedData,
        tenantId,
        features: JSON.stringify(validatedData.features || []),
        allowedSpaceTypes: JSON.stringify(validatedData.allowedSpaceTypes || []),
        allowedTimeSlots: JSON.stringify(validatedData.allowedTimeSlots || []),
        availableAddOns: JSON.stringify(validatedData.availableAddOns || []),
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

    revalidatePath('/membership-plans')
    
    return { 
      success: true, 
      data: {
        ...membershipPlan,
        features: JSON.parse(membershipPlan.features),
        allowedSpaceTypes: JSON.parse(membershipPlan.allowedSpaceTypes),
        allowedTimeSlots: JSON.parse(membershipPlan.allowedTimeSlots),
        availableAddOns: JSON.parse(membershipPlan.availableAddOns),
        metadata: membershipPlan.metadata ? JSON.parse(membershipPlan.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create membership plan error:', error)
    
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

    return { success: false, error: 'Failed to create membership plan' }
  }
}

/**
 * Create a new membership
 */
export async function createMembershipAction(data: CreateMembershipRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createMembershipSchema.parse(data)

    // Verify plan exists
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: validatedData.planId,
        tenantId,
        isActive: true,
      },
    })

    if (!plan) {
      return { success: false, error: 'Membership plan not found or inactive' }
    }

    // Verify client exists
    const client = await prisma.client.findFirst({
      where: {
        id: validatedData.clientId,
        tenantId,
      },
    })

    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    // Check for existing active membership
    const existingMembership = await prisma.membership.findFirst({
      where: {
        clientId: validatedData.clientId,
        status: {
          in: ['ACTIVE', 'PENDING_ACTIVATION', 'GRACE_PERIOD'],
        },
      },
    })

    if (existingMembership) {
      return { 
        success: false, 
        error: 'Client already has an active membership',
        details: { membershipId: existingMembership.id }
      }
    }

    // Calculate pricing
    const basePrice = validatedData.customPrice ?? plan.basePrice
    const discountAmount = validatedData.discountPercentage ? 
      (basePrice * validatedData.discountPercentage / 100) : 0
    const finalPrice = basePrice - discountAmount

    // Set billing dates
    let nextBillingDate = validatedData.nextBillingDate
    if (!nextBillingDate) {
      nextBillingDate = new Date(validatedData.startDate)
      // Add billing cycle period
      switch (plan.billingCycle) {
        case 'MONTHLY':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
          break
        case 'YEARLY':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
          break
      }
    }

    // Set trial end date if applicable
    let trialEndsAt = validatedData.trialEndsAt
    if (!trialEndsAt && plan.trialPeriodDays > 0) {
      trialEndsAt = new Date(validatedData.startDate)
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialPeriodDays)
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        ...validatedData,
        tenantId,
        finalPrice,
        trialEndsAt,
        nextBillingDate,
        usageThisMonth: JSON.stringify(validatedData.usageThisMonth || {}),
        activeAddOns: JSON.stringify(validatedData.activeAddOns || []),
        billingAddress: validatedData.billingAddress ? JSON.stringify(validatedData.billingAddress) : null,
        accessOverrides: JSON.stringify(validatedData.accessOverrides || {}),
        notificationPreferences: JSON.stringify(validatedData.notificationPreferences || {}),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        plan: true,
        client: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Send welcome email if requested
    if (validatedData.sendWelcomeEmail) {
      // TODO: Implement email sending
      console.log('Send welcome email to:', client.email)
    }

    // Create initial invoice if not in trial
    if (!trialEndsAt || trialEndsAt <= new Date()) {
      // TODO: Create invoice for setup fee and first period
      console.log('Create initial invoice for membership:', membership.id)
    }

    revalidatePath('/memberships')
    
    return { 
      success: true, 
      data: {
        ...membership,
        usageThisMonth: JSON.parse(membership.usageThisMonth),
        activeAddOns: JSON.parse(membership.activeAddOns),
        billingAddress: membership.billingAddress ? JSON.parse(membership.billingAddress) : null,
        accessOverrides: JSON.parse(membership.accessOverrides),
        notificationPreferences: JSON.parse(membership.notificationPreferences),
        metadata: membership.metadata ? JSON.parse(membership.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create membership error:', error)
    
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

    return { success: false, error: 'Failed to create membership' }
  }
}

/**
 * List membership plans with filtering and pagination
 */
export async function listMembershipPlansAction(data: ListMembershipPlansRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listMembershipPlansSchema.parse(data)

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

    if (validatedData.billingCycle) {
      where.billingCycle = validatedData.billingCycle
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    if (validatedData.isPublic !== undefined) {
      where.isPublic = validatedData.isPublic
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.membershipPlan.count({ where })

    // Get membership plans
    const membershipPlans = await prisma.membershipPlan.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        _count: {
          select: {
            memberships: {
              where: {
                status: {
                  in: ['ACTIVE', 'PENDING_ACTIVATION', 'GRACE_PERIOD'],
                },
              },
            },
          },
        },
      },
    })

    // Process JSON fields
    const processedPlans = membershipPlans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features),
      allowedSpaceTypes: JSON.parse(plan.allowedSpaceTypes),
      allowedTimeSlots: JSON.parse(plan.allowedTimeSlots),
      availableAddOns: JSON.parse(plan.availableAddOns),
      metadata: plan.metadata ? JSON.parse(plan.metadata) : null,
      activeSubscriptions: plan._count.memberships,
    }))
    
    return { 
      success: true, 
      data: {
        membershipPlans: processedPlans,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List membership plans error:', error)
    
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

    return { success: false, error: 'Failed to list membership plans' }
  }
}

/**
 * List memberships with filtering and pagination
 */
export async function listMembershipsAction(data: ListMembershipsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listMembershipsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        {
          client: {
            name: { contains: validatedData.search, mode: 'insensitive' },
          },
        },
        {
          plan: {
            name: { contains: validatedData.search, mode: 'insensitive' },
          },
        },
      ]
    }

    if (validatedData.planId) {
      where.planId = validatedData.planId
    }

    if (validatedData.clientId) {
      where.clientId = validatedData.clientId
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.dueSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.nextBillingDate = {
        lte: thirtyDaysFromNow,
      }
    }

    if (validatedData.overdue) {
      where.nextBillingDate = {
        lt: new Date(),
      }
      where.status = {
        in: ['ACTIVE', 'GRACE_PERIOD'],
      }
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.membership.count({ where })

    // Get memberships
    const memberships = await prisma.membership.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        plan: true,
        client: true,
      },
    })

    // Process JSON fields
    const processedMemberships = memberships.map(membership => ({
      ...membership,
      usageThisMonth: JSON.parse(membership.usageThisMonth),
      activeAddOns: JSON.parse(membership.activeAddOns),
      billingAddress: membership.billingAddress ? JSON.parse(membership.billingAddress) : null,
      accessOverrides: JSON.parse(membership.accessOverrides),
      notificationPreferences: JSON.parse(membership.notificationPreferences),
      metadata: membership.metadata ? JSON.parse(membership.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        memberships: processedMemberships,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List memberships error:', error)
    
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

    return { success: false, error: 'Failed to list memberships' }
  }
}

/**
 * Suspend a membership
 */
export async function suspendMembershipAction(data: SuspendMembershipRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = suspendMembershipSchema.parse(data)

    // Get membership
    const membership = await prisma.membership.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        client: true,
      },
    })

    if (!membership) {
      return { success: false, error: 'Membership not found' }
    }

    if (membership.status === 'SUSPENDED') {
      return { success: false, error: 'Membership is already suspended' }
    }

    // Update membership
    const updatedMembership = await prisma.membership.update({
      where: { id: validatedData.id },
      data: {
        status: 'SUSPENDED',
        metadata: JSON.stringify({
          ...(membership.metadata ? JSON.parse(membership.metadata) : {}),
          suspension: {
            reason: validatedData.reason,
            suspendedAt: new Date(),
            suspendedBy: user.id,
            suspendUntil: validatedData.suspendUntil,
            previousStatus: membership.status,
          },
        }),
      },
      include: {
        tenant: true,
        plan: true,
        client: true,
      },
    })

    // Create audit log
    await prisma.membershipAuditLog.create({
      data: {
        membershipId: validatedData.id,
        action: 'SUSPENDED',
        performedBy: user.id,
        reason: validatedData.reason,
        details: JSON.stringify({
          suspendUntil: validatedData.suspendUntil,
          previousStatus: membership.status,
        }),
      },
    })

    // Notify client if requested
    if (validatedData.notifyClient) {
      // TODO: Send suspension notification
      console.log('Notify client about suspension:', membership.client.email)
    }

    revalidatePath('/memberships')
    revalidatePath(`/memberships/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedMembership,
        usageThisMonth: JSON.parse(updatedMembership.usageThisMonth),
        activeAddOns: JSON.parse(updatedMembership.activeAddOns),
        billingAddress: updatedMembership.billingAddress ? JSON.parse(updatedMembership.billingAddress) : null,
        accessOverrides: JSON.parse(updatedMembership.accessOverrides),
        notificationPreferences: JSON.parse(updatedMembership.notificationPreferences),
        metadata: updatedMembership.metadata ? JSON.parse(updatedMembership.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Suspend membership error:', error)
    
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

    return { success: false, error: 'Failed to suspend membership' }
  }
}

/**
 * Renew a membership
 */
export async function renewMembershipAction(data: RenewMembershipRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = renewMembershipSchema.parse(data)

    // Get membership with plan
    const membership = await prisma.membership.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        plan: true,
        client: true,
      },
    })

    if (!membership) {
      return { success: false, error: 'Membership not found' }
    }

    // Calculate new dates
    const currentEndDate = membership.endDate || membership.nextBillingDate
    const newEndDate = new Date(currentEndDate)
    
    switch (membership.plan.billingCycle) {
      case 'MONTHLY':
        newEndDate.setMonth(newEndDate.getMonth() + validatedData.renewalPeriod)
        break
      case 'QUARTERLY':
        newEndDate.setMonth(newEndDate.getMonth() + (validatedData.renewalPeriod * 3))
        break
      case 'YEARLY':
        newEndDate.setFullYear(newEndDate.getFullYear() + validatedData.renewalPeriod)
        break
    }

    const newBillingDate = new Date(newEndDate)

    // Calculate renewal price
    const renewalPrice = validatedData.customPrice ?? membership.finalPrice

    // Update membership
    const updatedMembership = await prisma.membership.update({
      where: { id: validatedData.id },
      data: {
        endDate: newEndDate,
        nextBillingDate: newBillingDate,
        lastBillingDate: new Date(),
        finalPrice: renewalPrice,
        status: 'ACTIVE',
        metadata: JSON.stringify({
          ...(membership.metadata ? JSON.parse(membership.metadata) : {}),
          lastRenewal: {
            renewedAt: new Date(),
            renewedBy: user.id,
            previousEndDate: currentEndDate,
            renewalPeriod: validatedData.renewalPeriod,
            price: renewalPrice,
          },
        }),
      },
      include: {
        tenant: true,
        plan: true,
        client: true,
      },
    })

    // Create renewal invoice if auto-processing
    if (validatedData.autoProcess) {
      // TODO: Create and process renewal invoice
      console.log('Create renewal invoice for membership:', membership.id)
    }

    // Create audit log
    await prisma.membershipAuditLog.create({
      data: {
        membershipId: validatedData.id,
        action: 'RENEWED',
        performedBy: user.id,
        details: JSON.stringify({
          renewalPeriod: validatedData.renewalPeriod,
          customPrice: validatedData.customPrice,
          newEndDate,
          autoProcess: validatedData.autoProcess,
        }),
      },
    })

    revalidatePath('/memberships')
    revalidatePath(`/memberships/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedMembership,
        usageThisMonth: JSON.parse(updatedMembership.usageThisMonth),
        activeAddOns: JSON.parse(updatedMembership.activeAddOns),
        billingAddress: updatedMembership.billingAddress ? JSON.parse(updatedMembership.billingAddress) : null,
        accessOverrides: JSON.parse(updatedMembership.accessOverrides),
        notificationPreferences: JSON.parse(updatedMembership.notificationPreferences),
        metadata: updatedMembership.metadata ? JSON.parse(updatedMembership.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Renew membership error:', error)
    
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

    return { success: false, error: 'Failed to renew membership' }
  }
}

/**
 * Track membership usage
 */
export async function trackMembershipUsageAction(data: TrackMembershipUsageRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = trackMembershipUsageSchema.parse(data)

    // Get membership
    const membership = await prisma.membership.findFirst({
      where: {
        id: validatedData.membershipId,
        tenantId,
      },
    })

    if (!membership) {
      return { success: false, error: 'Membership not found' }
    }

    // Update usage tracking
    const currentUsage = JSON.parse(membership.usageThisMonth)
    
    switch (validatedData.usageType) {
      case 'HOURS':
        currentUsage.hoursUsed = (currentUsage.hoursUsed || 0) + validatedData.amount
        break
      case 'BOOKING':
        currentUsage.bookingsMade = (currentUsage.bookingsMade || 0) + validatedData.amount
        break
      case 'GUEST_VISIT':
        currentUsage.guestVisits = (currentUsage.guestVisits || 0) + validatedData.amount
        break
      case 'SERVICE':
        currentUsage.servicesUsed = (currentUsage.servicesUsed || 0) + validatedData.amount
        break
    }

    // Update membership
    await prisma.membership.update({
      where: { id: validatedData.membershipId },
      data: {
        usageThisMonth: JSON.stringify(currentUsage),
      },
    })

    // Create usage log
    const usageLog = await prisma.membershipUsageLog.create({
      data: {
        membershipId: validatedData.membershipId,
        usageType: validatedData.usageType,
        amount: validatedData.amount,
        description: validatedData.description,
        timestamp: validatedData.timestamp,
        recordedBy: user.id,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
    })

    revalidatePath(`/memberships/${validatedData.membershipId}`)
    
    return { 
      success: true, 
      data: {
        ...usageLog,
        currentUsage,
        metadata: usageLog.metadata ? JSON.parse(usageLog.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Track membership usage error:', error)
    
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

    return { success: false, error: 'Failed to track membership usage' }
  }
}

/**
 * Get membership analytics
 */
export async function getMembershipAnalyticsAction(data: GetMembershipAnalyticsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getMembershipAnalyticsSchema.parse(data)

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

    if (validatedData.planIds && validatedData.planIds.length > 0) {
      where.planId = { in: validatedData.planIds }
    }

    // Get analytics based on groupBy parameter
    let analytics: any = {}

    switch (validatedData.groupBy) {
      case 'day':
      case 'week':
      case 'month':
        analytics = await getTimeBasedMembershipAnalytics(where, validatedData.groupBy)
        break
      case 'plan':
        analytics = await getPlanBasedAnalytics(where)
        break
      case 'status':
        analytics = await getStatusBasedAnalytics(where)
        break
    }

    // Get summary metrics
    const summary = await getMembershipSummaryMetrics(where, validatedData)

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
    console.error('Get membership analytics error:', error)
    
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

    return { success: false, error: 'Failed to get membership analytics' }
  }
}

/**
 * Helper functions for analytics
 */
async function getTimeBasedMembershipAnalytics(where: any, groupBy: string) {
  // This would implement time-based grouping analytics
  // For now, return a simple count by day
  const result = await prisma.membership.groupBy({
    by: ['createdAt'],
    where,
    _count: true,
    _sum: {
      finalPrice: true,
    },
  })

  return result.map(item => ({
    period: item.createdAt,
    count: item._count,
    revenue: item._sum.finalPrice || 0,
  }))
}

async function getPlanBasedAnalytics(where: any) {
  return await prisma.membership.groupBy({
    by: ['planId'],
    where,
    _count: true,
    _sum: {
      finalPrice: true,
    },
  })
}

async function getStatusBasedAnalytics(where: any) {
  return await prisma.membership.groupBy({
    by: ['status'],
    where,
    _count: true,
  })
}

async function getMembershipSummaryMetrics(where: any, options: any) {
  const [total, active, mrr] = await Promise.all([
    prisma.membership.count({ where }),
    prisma.membership.count({ 
      where: { 
        ...where, 
        status: 'ACTIVE' 
      } 
    }),
    // Calculate Monthly Recurring Revenue
    options.includeMRR ? calculateMRR(where) : Promise.resolve(0),
  ])

  // Calculate churn rate if requested
  let churnRate = 0
  if (options.includeChurn) {
    churnRate = await calculateChurnRate(where)
  }

  return {
    total,
    active,
    mrr,
    churnRate,
  }
}

async function calculateMRR(where: any) {
  // Simplified MRR calculation
  const activeMemberships = await prisma.membership.findMany({
    where: {
      ...where,
      status: 'ACTIVE',
    },
    include: {
      plan: true,
    },
  })

  return activeMemberships.reduce((mrr, membership) => {
    const monthlyAmount = membership.finalPrice || 0
    // Convert to monthly based on billing cycle
    switch (membership.plan.billingCycle) {
      case 'MONTHLY':
        return mrr + monthlyAmount
      case 'QUARTERLY':
        return mrr + (monthlyAmount / 3)
      case 'YEARLY':
        return mrr + (monthlyAmount / 12)
      default:
        return mrr
    }
  }, 0)
}

async function calculateChurnRate(where: any) {
  // Simplified churn rate calculation
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalAtStart, churned] = await Promise.all([
    prisma.membership.count({
      where: {
        ...where,
        createdAt: { lte: thirtyDaysAgo },
      },
    }),
    prisma.membership.count({
      where: {
        ...where,
        status: {
          in: ['CANCELLED', 'EXPIRED'],
        },
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
  ])

  return totalAtStart > 0 ? (churned / totalAtStart) * 100 : 0
}
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
  createResourceSchema,
  updateResourceSchema,
  deleteResourceSchema,
  getResourceSchema,
  listResourcesSchema,
  checkoutResourceSchema,
  checkinResourceSchema,
  scheduleMaintenanceSchema,
  updateMaintenanceSchema,
  checkResourceAvailabilitySchema,
  getResourceUsageStatsSchema,
  bulkUpdateResourcesSchema,
  transferResourceSchema,
  type CreateResourceRequest,
  type UpdateResourceRequest,
  type DeleteResourceRequest,
  type GetResourceRequest,
  type ListResourcesRequest,
  type CheckoutResourceRequest,
  type CheckinResourceRequest,
  type ScheduleMaintenanceRequest,
  type UpdateMaintenanceRequest,
  type CheckResourceAvailabilityRequest,
  type GetResourceUsageStatsRequest,
  type BulkUpdateResourcesRequest,
  type TransferResourceRequest,
} from '@/lib/validations/resource'

/**
 * Create a new resource
 */
export async function createResourceAction(data: CreateResourceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createResourceSchema.parse(data)

    // Verify space exists if specified in location
    if (validatedData.location?.spaceId) {
      const space = await prisma.space.findFirst({
        where: {
          id: validatedData.location.spaceId,
          tenantId,
          isActive: true,
        },
      })

      if (!space) {
        return { success: false, error: 'Specified space not found' }
      }
    }

    // Generate asset tag if not provided
    let assetTag = validatedData.assetTag
    if (!assetTag) {
      const lastResource = await prisma.resource.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { assetTag: true },
      })
      
      const lastNumber = lastResource?.assetTag 
        ? parseInt(lastResource.assetTag.replace(/[^\d]/g, '')) || 0
        : 0
      
      assetTag = `RSC-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Create resource
    const resource = await prisma.resource.create({
      data: {
        ...validatedData,
        tenantId,
        assetTag,
        location: validatedData.location ? JSON.stringify(validatedData.location) : null,
        specifications: validatedData.specifications ? JSON.stringify(validatedData.specifications) : null,
        purchaseInfo: validatedData.purchaseInfo ? JSON.stringify(validatedData.purchaseInfo) : null,
        financialInfo: validatedData.financialInfo ? JSON.stringify(validatedData.financialInfo) : null,
        maintenanceSchedule: validatedData.maintenanceSchedule ? JSON.stringify(validatedData.maintenanceSchedule) : null,
        usage: validatedData.usage ? JSON.stringify(validatedData.usage) : null,
        availability: validatedData.availability ? JSON.stringify(validatedData.availability) : null,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        documents: validatedData.documents ? JSON.stringify(validatedData.documents) : null,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        tenant: true,
      },
    })

    revalidatePath('/resources')
    
    return { 
      success: true, 
      data: {
        ...resource,
        location: resource.location ? JSON.parse(resource.location) : null,
        specifications: resource.specifications ? JSON.parse(resource.specifications) : null,
        purchaseInfo: resource.purchaseInfo ? JSON.parse(resource.purchaseInfo) : null,
        financialInfo: resource.financialInfo ? JSON.parse(resource.financialInfo) : null,
        maintenanceSchedule: resource.maintenanceSchedule ? JSON.parse(resource.maintenanceSchedule) : null,
        usage: resource.usage ? JSON.parse(resource.usage) : null,
        availability: resource.availability ? JSON.parse(resource.availability) : null,
        images: resource.images ? JSON.parse(resource.images) : [],
        documents: resource.documents ? JSON.parse(resource.documents) : [],
        tags: resource.tags ? JSON.parse(resource.tags) : [],
        metadata: resource.metadata ? JSON.parse(resource.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create resource error:', error)
    
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

    return { success: false, error: 'Failed to create resource' }
  }
}

/**
 * Update an existing resource
 */
export async function updateResourceAction(data: UpdateResourceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateResourceSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if resource exists and belongs to tenant
    const existingResource = await prisma.resource.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!existingResource) {
      return { success: false, error: 'Resource not found' }
    }

    // Verify space exists if being updated
    if (updateData.location?.spaceId) {
      const space = await prisma.space.findFirst({
        where: {
          id: updateData.location.spaceId,
          tenantId,
          isActive: true,
        },
      })

      if (!space) {
        return { success: false, error: 'Specified space not found' }
      }
    }

    // Prepare update data with JSON stringification
    const processedUpdateData: any = { ...updateData }
    if (updateData.location) {
      processedUpdateData.location = JSON.stringify(updateData.location)
    }
    if (updateData.specifications) {
      processedUpdateData.specifications = JSON.stringify(updateData.specifications)
    }
    if (updateData.purchaseInfo) {
      processedUpdateData.purchaseInfo = JSON.stringify(updateData.purchaseInfo)
    }
    if (updateData.financialInfo) {
      processedUpdateData.financialInfo = JSON.stringify(updateData.financialInfo)
    }
    if (updateData.maintenanceSchedule) {
      processedUpdateData.maintenanceSchedule = JSON.stringify(updateData.maintenanceSchedule)
    }
    if (updateData.usage) {
      processedUpdateData.usage = JSON.stringify(updateData.usage)
    }
    if (updateData.availability) {
      processedUpdateData.availability = JSON.stringify(updateData.availability)
    }
    if (updateData.images) {
      processedUpdateData.images = JSON.stringify(updateData.images)
    }
    if (updateData.documents) {
      processedUpdateData.documents = JSON.stringify(updateData.documents)
    }
    if (updateData.tags) {
      processedUpdateData.tags = JSON.stringify(updateData.tags)
    }
    if (updateData.metadata) {
      processedUpdateData.metadata = JSON.stringify(updateData.metadata)
    }

    // Update resource
    const resource = await prisma.resource.update({
      where: { id },
      data: processedUpdateData,
      include: {
        tenant: true,
      },
    })

    revalidatePath('/resources')
    revalidatePath(`/resources/${id}`)
    
    return { 
      success: true, 
      data: {
        ...resource,
        location: resource.location ? JSON.parse(resource.location) : null,
        specifications: resource.specifications ? JSON.parse(resource.specifications) : null,
        purchaseInfo: resource.purchaseInfo ? JSON.parse(resource.purchaseInfo) : null,
        financialInfo: resource.financialInfo ? JSON.parse(resource.financialInfo) : null,
        maintenanceSchedule: resource.maintenanceSchedule ? JSON.parse(resource.maintenanceSchedule) : null,
        usage: resource.usage ? JSON.parse(resource.usage) : null,
        availability: resource.availability ? JSON.parse(resource.availability) : null,
        images: resource.images ? JSON.parse(resource.images) : [],
        documents: resource.documents ? JSON.parse(resource.documents) : [],
        tags: resource.tags ? JSON.parse(resource.tags) : [],
        metadata: resource.metadata ? JSON.parse(resource.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update resource error:', error)
    
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

    return { success: false, error: 'Failed to update resource' }
  }
}

/**
 * Delete a resource
 */
export async function deleteResourceAction(data: DeleteResourceRequest): Promise<ActionResult<void>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteResourceSchema.parse(data)

    // Check if resource exists and belongs to tenant
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingResource) {
      return { success: false, error: 'Resource not found' }
    }

    // Check if resource is currently in use
    if (existingResource.status === 'IN_USE' || existingResource.status === 'RESERVED') {
      return { 
        success: false, 
        error: 'Cannot delete resource that is currently in use or reserved' 
      }
    }

    // Check for active allocations
    const activeAllocations = await prisma.resourceAllocation.count({
      where: {
        resourceId: validatedData.id,
        actualReturnAt: null, // Not yet returned
      },
    })

    if (activeAllocations > 0) {
      return { 
        success: false, 
        error: 'Cannot delete resource with active allocations. Please return all allocations first.' 
      }
    }

    // Soft delete by setting isActive to false
    await prisma.resource.update({
      where: { id: validatedData.id },
      data: { 
        isActive: false,
        status: 'DISCONTINUED',
      },
    })

    revalidatePath('/resources')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete resource error:', error)
    
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

    return { success: false, error: 'Failed to delete resource' }
  }
}

/**
 * Get a resource by ID
 */
export async function getResourceAction(data: GetResourceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getResourceSchema.parse(data)

    // Get resource
    const resource = await prisma.resource.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
      },
    })

    if (!resource) {
      return { success: false, error: 'Resource not found' }
    }

    // Get current allocation if any
    const currentAllocation = await prisma.resourceAllocation.findFirst({
      where: {
        resourceId: resource.id,
        actualReturnAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    // Get recent maintenance records
    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: { resourceId: resource.id },
      orderBy: { scheduledDate: 'desc' },
      take: 5,
    })
    
    return { 
      success: true, 
      data: {
        ...resource,
        location: resource.location ? JSON.parse(resource.location) : null,
        specifications: resource.specifications ? JSON.parse(resource.specifications) : null,
        purchaseInfo: resource.purchaseInfo ? JSON.parse(resource.purchaseInfo) : null,
        financialInfo: resource.financialInfo ? JSON.parse(resource.financialInfo) : null,
        maintenanceSchedule: resource.maintenanceSchedule ? JSON.parse(resource.maintenanceSchedule) : null,
        usage: resource.usage ? JSON.parse(resource.usage) : null,
        availability: resource.availability ? JSON.parse(resource.availability) : null,
        images: resource.images ? JSON.parse(resource.images) : [],
        documents: resource.documents ? JSON.parse(resource.documents) : [],
        tags: resource.tags ? JSON.parse(resource.tags) : [],
        metadata: resource.metadata ? JSON.parse(resource.metadata) : null,
        currentAllocation,
        maintenanceRecords,
      }
    }
  } catch (error: any) {
    console.error('Get resource error:', error)
    
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

    return { success: false, error: 'Failed to get resource' }
  }
}

/**
 * List resources with filtering and pagination
 */
export async function listResourcesAction(data: ListResourcesRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listResourcesSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
        { assetTag: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.condition) {
      where.condition = validatedData.condition
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    if (validatedData.isBookable !== undefined) {
      // This requires checking the availability JSON field
      // In a production app, you might want to extract this to a separate column
      where.availability = { not: null }
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.resource.count({ where })

    // Get resources
    const resources = await prisma.resource.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
      },
    })

    // Process JSON fields
    const processedResources = resources.map(resource => ({
      ...resource,
      location: resource.location ? JSON.parse(resource.location) : null,
      specifications: resource.specifications ? JSON.parse(resource.specifications) : null,
      purchaseInfo: resource.purchaseInfo ? JSON.parse(resource.purchaseInfo) : null,
      financialInfo: resource.financialInfo ? JSON.parse(resource.financialInfo) : null,
      maintenanceSchedule: resource.maintenanceSchedule ? JSON.parse(resource.maintenanceSchedule) : null,
      usage: resource.usage ? JSON.parse(resource.usage) : null,
      availability: resource.availability ? JSON.parse(resource.availability) : null,
      images: resource.images ? JSON.parse(resource.images) : [],
      documents: resource.documents ? JSON.parse(resource.documents) : [],
      tags: resource.tags ? JSON.parse(resource.tags) : [],
      metadata: resource.metadata ? JSON.parse(resource.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        resources: processedResources,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List resources error:', error)
    
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

    return { success: false, error: 'Failed to list resources' }
  }
}

/**
 * Check out a resource
 */
export async function checkoutResourceAction(data: CheckoutResourceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkoutResourceSchema.parse(data)

    // Check if resource exists and is available
    const resource = await prisma.resource.findFirst({
      where: {
        id: validatedData.resourceId,
        tenantId,
        isActive: true,
      },
    })

    if (!resource) {
      return { success: false, error: 'Resource not found' }
    }

    if (resource.status !== 'AVAILABLE') {
      return { success: false, error: 'Resource is not available for checkout' }
    }

    if (!resource.requiresCheckout) {
      return { success: false, error: 'Resource does not require checkout' }
    }

    // Check if there's already an active allocation
    const activeAllocation = await prisma.resourceAllocation.findFirst({
      where: {
        resourceId: validatedData.resourceId,
        actualReturnAt: null,
      },
    })

    if (activeAllocation) {
      return { success: false, error: 'Resource is already checked out' }
    }

    // Create allocation record
    const allocation = await prisma.resourceAllocation.create({
      data: {
        resourceId: validatedData.resourceId,
        userId: validatedData.userId,
        bookingId: validatedData.bookingId,
        allocatedBy: user.id,
        allocatedAt: new Date(),
        expectedReturnAt: validatedData.expectedReturnAt,
        notes: validatedData.notes,
        checkedOutCondition: validatedData.checkedOutCondition,
      },
      include: {
        resource: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    // Update resource status
    await prisma.resource.update({
      where: { id: validatedData.resourceId },
      data: { status: 'IN_USE' },
    })

    revalidatePath('/resources')
    revalidatePath(`/resources/${validatedData.resourceId}`)
    
    return { 
      success: true, 
      data: allocation
    }
  } catch (error: any) {
    console.error('Checkout resource error:', error)
    
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

    return { success: false, error: 'Failed to checkout resource' }
  }
}

/**
 * Check in a resource
 */
export async function checkinResourceAction(data: CheckinResourceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkinResourceSchema.parse(data)

    // Find active allocation
    const allocation = await prisma.resourceAllocation.findFirst({
      where: {
        resourceId: validatedData.resourceId,
        actualReturnAt: null,
      },
      include: {
        resource: true,
      },
    })

    if (!allocation) {
      return { success: false, error: 'No active checkout found for this resource' }
    }

    if (allocation.resource.tenantId !== tenantId) {
      return { success: false, error: 'Resource not found' }
    }

    // Update allocation record
    const updatedAllocation = await prisma.resourceAllocation.update({
      where: { id: allocation.id },
      data: {
        actualReturnAt: new Date(),
        checkedInCondition: validatedData.checkedInCondition,
        notes: validatedData.notes ? 
          `${allocation.notes || ''}\n--- Check-in ---\n${validatedData.notes}`.trim() : 
          allocation.notes,
      },
    })

    // Update resource status and condition
    const newStatus = validatedData.checkedInCondition === 'NEEDS_REPAIR' || 
                     validatedData.checkedInCondition === 'DAMAGED' ? 
                     'MAINTENANCE' : 'AVAILABLE'

    await prisma.resource.update({
      where: { id: validatedData.resourceId },
      data: { 
        status: newStatus,
        condition: validatedData.checkedInCondition,
      },
    })

    // Create maintenance record if damage reported
    if (validatedData.damageReport) {
      await prisma.maintenanceRecord.create({
        data: {
          resourceId: validatedData.resourceId,
          type: 'CORRECTIVE',
          description: `Damage reported during check-in: ${validatedData.damageReport}`,
          scheduledDate: new Date(),
          status: 'SCHEDULED',
          beforeCondition: allocation.checkedOutCondition,
          notes: validatedData.notes,
        },
      })
    }

    revalidatePath('/resources')
    revalidatePath(`/resources/${validatedData.resourceId}`)
    
    return { 
      success: true, 
      data: updatedAllocation
    }
  } catch (error: any) {
    console.error('Checkin resource error:', error)
    
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

    return { success: false, error: 'Failed to checkin resource' }
  }
}

/**
 * Schedule maintenance for a resource
 */
export async function scheduleMaintenanceAction(data: ScheduleMaintenanceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = scheduleMaintenanceSchema.parse(data)

    // Check if resource exists and belongs to tenant
    const resource = await prisma.resource.findFirst({
      where: {
        id: validatedData.resourceId,
        tenantId,
      },
    })

    if (!resource) {
      return { success: false, error: 'Resource not found' }
    }

    // Create maintenance record
    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        resourceId: validatedData.resourceId,
        type: validatedData.type,
        description: validatedData.description,
        scheduledDate: validatedData.scheduledDate,
        status: 'SCHEDULED',
        performedBy: validatedData.performedBy,
        cost: validatedData.estimatedCost,
        notes: validatedData.notes,
      },
      include: {
        resource: true,
      },
    })

    // Update resource status if urgent maintenance
    if (validatedData.priority === 'URGENT' && resource.status === 'AVAILABLE') {
      await prisma.resource.update({
        where: { id: validatedData.resourceId },
        data: { status: 'MAINTENANCE' },
      })
    }

    revalidatePath('/resources')
    revalidatePath(`/resources/${validatedData.resourceId}`)
    revalidatePath('/maintenance')
    
    return { 
      success: true, 
      data: maintenance
    }
  } catch (error: any) {
    console.error('Schedule maintenance error:', error)
    
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

    return { success: false, error: 'Failed to schedule maintenance' }
  }
}

/**
 * Transfer a resource to a different location
 */
export async function transferResourceAction(data: TransferResourceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = transferResourceSchema.parse(data)

    // Check if resource exists and belongs to tenant
    const resource = await prisma.resource.findFirst({
      where: {
        id: validatedData.resourceId,
        tenantId,
      },
    })

    if (!resource) {
      return { success: false, error: 'Resource not found' }
    }

    // Verify destination space exists
    const toSpace = await prisma.space.findFirst({
      where: {
        id: validatedData.toSpaceId,
        tenantId,
        isActive: true,
      },
    })

    if (!toSpace) {
      return { success: false, error: 'Destination space not found' }
    }

    // Check if resource is available for transfer
    if (resource.status === 'IN_USE' || resource.status === 'RESERVED') {
      return { success: false, error: 'Cannot transfer resource that is currently in use or reserved' }
    }

    // Update resource location
    const currentLocation = resource.location ? JSON.parse(resource.location) : {}
    const newLocation = {
      ...currentLocation,
      spaceId: validatedData.toSpaceId,
    }

    await prisma.resource.update({
      where: { id: validatedData.resourceId },
      data: {
        location: JSON.stringify(newLocation),
      },
    })

    // Create transfer log (using metadata for now, could be a separate table)
    const transferLog = {
      date: validatedData.transferDate,
      fromSpaceId: validatedData.fromSpaceId,
      toSpaceId: validatedData.toSpaceId,
      transferredBy: validatedData.transferredBy,
      reason: validatedData.reason,
      notes: validatedData.notes,
    }

    revalidatePath('/resources')
    revalidatePath(`/resources/${validatedData.resourceId}`)
    
    return { 
      success: true, 
      data: {
        resourceId: validatedData.resourceId,
        transfer: transferLog,
        newLocation,
      }
    }
  } catch (error: any) {
    console.error('Transfer resource error:', error)
    
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

    return { success: false, error: 'Failed to transfer resource' }
  }
}
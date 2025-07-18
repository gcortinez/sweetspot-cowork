'use server'

import { 
  createClientSchema, 
  updateClientSchema, 
  clientFiltersSchema,
  paginatedClientsSchema,
  clientMembershipSchema,
  clientInvitationSchema,
  updateClientSettingsSchema,
  bulkClientOperationSchema,
  validateData,
  type CreateClientRequest,
  type UpdateClientRequest,
  type ClientFilters,
  type PaginatedClientsQuery,
  type ClientMembershipRequest,
  type ClientInvitationRequest,
  type UpdateClientSettingsRequest,
  type BulkClientOperationRequest,
} from '../validations'
import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Client (Company/Team) Management Server Actions
 */

// Create new client (Admin only)
export async function createClientAction(data: CreateClientRequest) {
  try {
    // Validate input data
    const validation = validateData(createClientSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Require admin permissions
    const context = await requireAuth()
    
    if (!canManageClients(context.role)) {
      return {
        success: false,
        error: 'Insufficient permissions to create clients',
      }
    }
    
    const prisma = await getTenantPrisma()
    const validData = validation.data

    // Get current tenant ID
    const tenantId = context.tenantId || await getCurrentTenantId()
    if (!tenantId) {
      return {
        success: false,
        error: 'Tenant context is required',
      }
    }

    // Check if client name already exists in this tenant
    const existingClient = await prisma.client.findFirst({
      where: {
        name: validData.name,
        tenantId: tenantId,
      }
    })

    if (existingClient) {
      return {
        success: false,
        error: 'Client with this name already exists',
        fieldErrors: {
          name: 'A client with this name already exists in your workspace'
        }
      }
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name: validData.name,
        description: validData.description,
        logo: validData.logo,
        website: validData.website,
        industry: validData.industry,
        size: validData.size,
        tenantId: tenantId,
        status: 'ACTIVE',
        settings: {
          ...validData.settings,
          address: validData.address,
          contactInfo: validData.contactInfo,
          billingInfo: validData.billingInfo,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
        industry: true,
        size: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        _count: {
          select: {
            users: true,
            bookings: true,
          }
        }
      }
    })

    return {
      success: true,
      client,
      message: 'Client created successfully',
    }

  } catch (error) {
    console.error('Create client action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while creating client',
    }
  }
}

// Get client by ID
export async function getClientAction(clientId: string) {
  try {
    // Require authentication
    const context = await requireAuth()
    
    const prisma = await getTenantPrisma()

    // Build query conditions based on user role
    const whereClause: any = { id: clientId }

    // Non-super admins can only see clients in their tenant
    if (context.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = context.tenantId
    }

    // Client admins can only see their own client
    if (context.role === 'CLIENT_ADMIN' && context.clientId) {
      whereClause.id = context.clientId
    }

    // End users can only see their own client
    if (context.role === 'END_USER' && context.clientId) {
      whereClause.id = context.clientId
    }

    const client = await prisma.client.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
        industry: true,
        size: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            users: true,
            bookings: true,
            memberships: true,
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
          take: 10, // Limit to first 10 users
        }
      }
    })

    if (!client) {
      return {
        success: false,
        error: 'Client not found or access denied',
      }
    }

    return {
      success: true,
      client,
    }

  } catch (error) {
    console.error('Get client action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching client',
    }
  }
}

// Update client
export async function updateClientAction(clientId: string, data: UpdateClientRequest) {
  try {
    // Validate input data
    const validation = validateData(updateClientSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Require authentication
    const context = await requireAuth()
    
    const prisma = await getTenantPrisma()
    const validData = validation.data

    // Check if client exists and determine access permissions
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
      }
    })

    if (!existingClient) {
      return {
        success: false,
        error: 'Client not found',
      }
    }

    // Permission checks
    const canEdit = 
      context.role === 'SUPER_ADMIN' || // Super admin can edit any client
      (canManageClients(context.role) && existingClient.tenantId === context.tenantId) || // Cowork admin can edit clients in their tenant
      (context.role === 'CLIENT_ADMIN' && context.clientId === clientId) // Client admin can edit their own client

    if (!canEdit) {
      return {
        success: false,
        error: 'Access denied to update this client',
      }
    }

    // Check if name already exists (if changing name)
    if (validData.name && validData.name !== existingClient.name) {
      const nameExists = await prisma.client.findFirst({
        where: {
          name: validData.name,
          tenantId: existingClient.tenantId,
          id: { not: clientId }
        }
      })

      if (nameExists) {
        return {
          success: false,
          error: 'Client name already exists',
          fieldErrors: {
            name: 'A client with this name already exists in your workspace'
          }
        }
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: validData.name,
        description: validData.description,
        logo: validData.logo,
        website: validData.website,
        industry: validData.industry,
        size: validData.size,
        settings: validData.settings ? {
          ...validData.settings,
          address: validData.address,
          contactInfo: validData.contactInfo,
          billingInfo: validData.billingInfo,
        } : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        website: true,
        industry: true,
        size: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        _count: {
          select: {
            users: true,
            bookings: true,
            memberships: true,
          }
        }
      }
    })

    return {
      success: true,
      client: updatedClient,
      message: 'Client updated successfully',
    }

  } catch (error) {
    console.error('Update client action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating client',
    }
  }
}

// List clients with filtering and pagination
export async function listClientsAction(query: PaginatedClientsQuery) {
  try {
    // Validate query parameters
    const validation = validateData(paginatedClientsSchema, query)
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid query parameters',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Get tenant context
    const context = await getTenantContext()
    const { 
      page, 
      limit, 
      sortBy, 
      sortOrder, 
      search, 
      status, 
      industry, 
      size, 
      hasActiveUsers, 
      createdAfter, 
      createdBefore 
    } = validation.data

    // Build where clause based on user permissions
    const whereClause: any = {}

    // Non-super admins can only see clients in their tenant
    if (!context.isSuper && context.tenantId) {
      whereClause.tenantId = context.tenantId
    }

    // Client admins and end users can only see their own client
    if ((context.role === 'CLIENT_ADMIN' || context.role === 'END_USER') && context.clientId) {
      whereClause.id = context.clientId
    }

    // Apply filters
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (industry) {
      whereClause.industry = industry
    }

    if (size) {
      whereClause.size = size
    }

    if (createdAfter || createdBefore) {
      whereClause.createdAt = {}
      if (createdAfter) {
        whereClause.createdAt.gte = new Date(createdAfter)
      }
      if (createdBefore) {
        whereClause.createdAt.lte = new Date(createdBefore)
      }
    }

    // Handle hasActiveUsers filter
    if (hasActiveUsers !== undefined) {
      if (hasActiveUsers) {
        whereClause.users = {
          some: {
            status: 'ACTIVE'
          }
        }
      } else {
        whereClause.users = {
          none: {
            status: 'ACTIVE'
          }
        }
      }
    }

    // Execute queries
    const [clients, totalCount] = await Promise.all([
      db.client.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          website: true,
          industry: true,
          size: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
          _count: {
            select: {
              users: true,
              bookings: true,
              memberships: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.client.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      success: true,
      clients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

  } catch (error) {
    console.error('List clients action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching clients',
    }
  }
}

// Delete/deactivate client
export async function deleteClientAction(clientId: string) {
  try {
    // Require admin permissions
    const context = await requireAuth()
    
    if (!canManageClients(context.role)) {
      return {
        success: false,
        error: 'Insufficient permissions to delete clients',
      }
    }
    
    const prisma = await getTenantPrisma()

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        tenantId: true,
        status: true,
        _count: {
          select: {
            users: true,
            bookings: true,
            memberships: true,
          }
        }
      }
    })

    if (!client) {
      return {
        success: false,
        error: 'Client not found',
      }
    }

    // Permission check
    if (context.role !== 'SUPER_ADMIN' && client.tenantId !== context.tenantId) {
      return {
        success: false,
        error: 'Access denied to delete this client',
      }
    }

    // Check for active dependencies
    if (client._count.users > 0 || client._count.bookings > 0 || client._count.memberships > 0) {
      return {
        success: false,
        error: 'Cannot delete client with active users, bookings, or memberships',
        details: {
          users: client._count.users,
          bookings: client._count.bookings,
          memberships: client._count.memberships,
        }
      }
    }

    // Soft delete by changing status
    await prisma.client.update({
      where: { id: clientId },
      data: { 
        status: 'INACTIVE',
        updatedAt: new Date(),
      }
    })

    return {
      success: true,
      message: `Client "${client.name}" has been deactivated`,
    }

  } catch (error) {
    console.error('Delete client action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while deleting client',
    }
  }
}

// Update client settings
export async function updateClientSettingsAction(clientId: string, data: UpdateClientSettingsRequest) {
  try {
    // Validate input data
    const validation = validateData(updateClientSettingsSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Require authentication
    const context = await requireAuth()
    
    const prisma = await getTenantPrisma()
    const validData = validation.data

    // Check if client exists and access permissions
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        tenantId: true,
        settings: true,
      }
    })

    if (!client) {
      return {
        success: false,
        error: 'Client not found',
      }
    }

    // Permission checks
    const canEdit = 
      context.role === 'SUPER_ADMIN' || // Super admin can edit any client
      (canManageClients(context.role) && client.tenantId === context.tenantId) || // Cowork admin can edit clients in their tenant
      (context.role === 'CLIENT_ADMIN' && context.clientId === clientId) // Client admin can edit their own client

    if (!canEdit) {
      return {
        success: false,
        error: 'Access denied to update this client settings',
      }
    }

    // Merge with existing settings
    const currentSettings = (client.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      ...validData,
    }

    // Update client settings
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        settings: updatedSettings,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        settings: true,
        updatedAt: true,
      }
    })

    return {
      success: true,
      client: updatedClient,
      message: 'Client settings updated successfully',
    }

  } catch (error) {
    console.error('Update client settings action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating client settings',
    }
  }
}

// Bulk client operations
export async function bulkClientOperationAction(data: BulkClientOperationRequest) {
  try {
    // Validate input data
    const validation = validateData(bulkClientOperationSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Require admin permissions
    const context = await requireAuth()
    
    if (!canManageClients(context.role)) {
      return {
        success: false,
        error: 'Insufficient permissions for bulk client operations',
      }
    }
    
    const prisma = await getTenantPrisma()
    const { clientIds, operation, reason } = validation.data

    // Check all clients exist and are accessible
    const clients = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
        ...(context.role !== 'SUPER_ADMIN' && { tenantId: context.tenantId }),
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        status: true,
      }
    })

    if (clients.length !== clientIds.length) {
      return {
        success: false,
        error: 'One or more clients not found or access denied',
      }
    }

    // Determine status based on operation
    let newStatus: string
    switch (operation) {
      case 'activate':
        newStatus = 'ACTIVE'
        break
      case 'deactivate':
        newStatus = 'INACTIVE'
        break
      case 'suspend':
        newStatus = 'SUSPENDED'
        break
      case 'archive':
        newStatus = 'ARCHIVED'
        break
      default:
        return {
          success: false,
          error: 'Invalid operation',
        }
    }

    // Perform bulk update
    const result = await prisma.client.updateMany({
      where: { id: { in: clientIds } },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      }
    })

    return {
      success: true,
      affectedCount: result.count,
      message: `Successfully ${operation}d ${result.count} client(s)`,
    }

  } catch (error) {
    console.error('Bulk client operation action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during bulk operation',
    }
  }
}

// Get client statistics
export async function getClientStatsAction() {
  try {
    // Require authentication
    const context = await requireAuth()
    
    const prisma = await getTenantPrisma()

    // Build query conditions based on user role
    const whereClause: any = {}
    if (context.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = context.tenantId
    }

    // Get client statistics
    const [
      statusStats,
      sizeStats,
      industryStats,
      recentClients,
      totalClients
    ] = await Promise.all([
      // Client status statistics
      prisma.client.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      
      // Client size statistics
      prisma.client.groupBy({
        by: ['size'],
        where: whereClause,
        _count: true,
      }),
      
      // Industry statistics
      prisma.client.groupBy({
        by: ['industry'],
        where: whereClause,
        _count: true,
        take: 10, // Top 10 industries
      }),
      
      // Recent clients (last 30 days)
      prisma.client.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total clients
      prisma.client.count({ where: whereClause })
    ])

    return {
      success: true,
      stats: {
        total: totalClients,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
        bySize: sizeStats.reduce((acc, stat) => {
          if (stat.size) {
            acc[stat.size.toLowerCase()] = stat._count
          }
          return acc
        }, {} as Record<string, number>),
        byIndustry: industryStats.reduce((acc, stat) => {
          if (stat.industry) {
            acc[stat.industry] = stat._count
          }
          return acc
        }, {} as Record<string, number>),
        recent: {
          last30Days: recentClients,
        }
      }
    }

  } catch (error) {
    console.error('Get client stats action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching client statistics',
    }
  }
}
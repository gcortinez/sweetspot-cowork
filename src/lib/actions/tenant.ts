'use server'

import { redirect } from 'next/navigation'
import { 
  createTenantSchema, 
  updateTenantSchema, 
  tenantFiltersSchema,
  paginatedTenantsSchema,
  updateTenantSettingsSchema,
  validateData,
  type CreateTenantRequest,
  type UpdateTenantRequest,
  type TenantFilters,
  type PaginatedTenantsQuery,
  type UpdateTenantSettingsRequest,
} from '../validations'
import { 
  requireAuth, 
  requireSuperAdmin, 
  requireAdmin,
  withTenantContext,
  withRole,
  getTenantPrisma,
} from '../server/tenant-context'

/**
 * Tenant Management Server Actions
 */

// Create new tenant (Super Admin only)
export async function createTenantAction(data: CreateTenantRequest) {
  try {
    // Validate input data
    const validation = validateData(createTenantSchema, data)
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

    // Require super admin permissions
    await requireSuperAdmin()
    
    const validData = validation.data
    const prisma = await getTenantPrisma()

    // Check if slug is already taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validData.slug }
    })

    if (existingTenant) {
      return {
        success: false,
        error: 'Tenant slug is already taken',
        fieldErrors: {
          slug: 'This workspace URL is already in use'
        }
      }
    }

    // Check if domain is already taken (if provided)
    if (validData.domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain: validData.domain }
      })

      if (existingDomain) {
        return {
          success: false,
          error: 'Domain is already taken',
          fieldErrors: {
            domain: 'This domain is already in use'
          }
        }
      }
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: validData.name,
        slug: validData.slug,
        domain: validData.domain,
        description: validData.description,
        logo: validData.logo,
        settings: {
          ...validData.settings,
          address: validData.address,
          coordinates: validData.coordinates,
          contactInfo: validData.contactInfo,
          businessHours: validData.businessHours,
          policies: validData.policies,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        logo: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return {
      success: true,
      tenant,
      message: 'Tenant created successfully',
    }

  } catch (error) {
    console.error('Create tenant action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while creating tenant',
    }
  }
}

// Get tenant by ID
export async function getTenantAction(tenantId: string) {
  try {
    // Require authentication and admin access
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Super admins can access any tenant, others only their own
    if (context.role !== 'SUPER_ADMIN' && context.tenantId !== tenantId) {
      return {
        success: false,
        error: 'Access denied to this tenant',
      }
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        logo: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            clients: true,
            spaces: true,
            bookings: true,
          }
        }
      }
    })

    if (!tenant) {
      return {
        success: false,
        error: 'Tenant not found',
      }
    }

    return {
      success: true,
      tenant,
    }

  } catch (error) {
    console.error('Get tenant action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching tenant',
    }
  }
}

// Update tenant
export async function updateTenantAction(tenantId: string, data: UpdateTenantRequest) {
  try {
    // Validate input data
    const validation = validateData(updateTenantSchema, data)
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

    // Require authentication and admin access
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Super admins can update any tenant, others only their own
    if (context.role !== 'SUPER_ADMIN' && context.tenantId !== tenantId) {
      return {
        success: false,
        error: 'Access denied to update this tenant',
      }
    }

    const validData = validation.data

    // Check if domain is already taken by another tenant (if provided)
    if (validData.domain) {
      const existingDomain = await prisma.tenant.findFirst({
        where: { 
          domain: validData.domain,
          id: { not: tenantId }
        }
      })

      if (existingDomain) {
        return {
          success: false,
          error: 'Domain is already taken',
          fieldErrors: {
            domain: 'This domain is already in use by another tenant'
          }
        }
      }
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: validData.name,
        domain: validData.domain,
        description: validData.description,
        logo: validData.logo,
        status: validData.status, // Add status update
        settings: validData.settings ? {
          ...validData.settings,
          address: validData.address,
          coordinates: validData.coordinates,
          contactInfo: validData.contactInfo,
          businessHours: validData.businessHours,
          policies: validData.policies,
        } : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        description: true,
        logo: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return {
      success: true,
      tenant: updatedTenant,
      message: 'Tenant updated successfully',
    }

  } catch (error) {
    console.error('Update tenant action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating tenant',
    }
  }
}

// List tenants with filtering and pagination
export async function listTenantsAction(query: PaginatedTenantsQuery) {
  try {
    // Validate query parameters
    const validation = validateData(paginatedTenantsSchema, query)
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

    // Require super admin for listing all tenants
    const context = await requireSuperAdmin()
    
    const prisma = await getTenantPrisma()
    const { page, limit, sortBy, sortOrder, search, status, hasCustomDomain, createdAfter, createdBefore } = validation.data

    // Build where clause
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (hasCustomDomain !== undefined) {
      if (hasCustomDomain) {
        whereClause.domain = { not: null }
      } else {
        whereClause.domain = null
      }
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

    // Execute queries
    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          description: true,
          logo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              clients: true,
              spaces: true,
              bookings: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tenant.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      success: true,
      tenants,
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
    console.error('List tenants action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching tenants',
    }
  }
}

// Delete tenant (Super Admin only)
export async function deleteTenantAction(tenantId: string) {
  try {
    // Require super admin permissions
    await requireSuperAdmin()
    
    const prisma = await getTenantPrisma()

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            clients: true,
            spaces: true,
            bookings: true,
          }
        }
      }
    })

    if (!tenant) {
      return {
        success: false,
        error: 'Tenant not found',
      }
    }

    // Check if tenant has active dependencies
    const hasActiveDependencies = tenant._count.users > 0 || 
                                   tenant._count.clients > 0 || 
                                   tenant._count.spaces > 0 || 
                                   tenant._count.bookings > 0

    if (hasActiveDependencies) {
      return {
        success: false,
        error: 'Cannot delete tenant with active users, clients, spaces, or bookings',
        details: {
          users: tenant._count.users,
          clients: tenant._count.clients,
          spaces: tenant._count.spaces,
          bookings: tenant._count.bookings,
        }
      }
    }

    // Soft delete by changing status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        status: 'INACTIVE',
        updatedAt: new Date(),
      }
    })

    return {
      success: true,
      message: `Tenant "${tenant.name}" has been deactivated`,
    }

  } catch (error) {
    console.error('Delete tenant action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while deleting tenant',
    }
  }
}

// Update tenant settings
export async function updateTenantSettingsAction(tenantId: string, data: UpdateTenantSettingsRequest) {
  try {
    // Validate input data
    const validation = validateData(updateTenantSettingsSchema, data)
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

    // Require authentication and admin access
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Super admins can update any tenant settings, others only their own
    if (context.role !== 'SUPER_ADMIN' && context.tenantId !== tenantId) {
      return {
        success: false,
        error: 'Access denied to update this tenant settings',
      }
    }

    const validData = validation.data

    // Get current settings
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })

    if (!currentTenant) {
      return {
        success: false,
        error: 'Tenant not found',
      }
    }

    // Merge with existing settings
    const currentSettings = (currentTenant.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      ...validData,
    }

    // Update tenant settings
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
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
      tenant: updatedTenant,
      message: 'Tenant settings updated successfully',
    }

  } catch (error) {
    console.error('Update tenant settings action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating tenant settings',
    }
  }
}

// Get tenant statistics
export async function getTenantStatsAction(tenantId: string) {
  try {
    // Require authentication and admin access
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Super admins can access any tenant stats, others only their own
    if (context.role !== 'SUPER_ADMIN' && context.tenantId !== tenantId) {
      return {
        success: false,
        error: 'Access denied to this tenant statistics',
      }
    }

    // Get comprehensive tenant statistics
    const [
      userStats,
      clientStats,
      spaceStats,
      bookingStats,
      revenueStats
    ] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      
      // Client statistics
      prisma.client.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      
      // Space statistics
      prisma.space.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      
      // Recent booking statistics
      prisma.booking.groupBy({
        by: ['status'],
        where: { 
          tenantId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _count: true,
      }),
      
      // Revenue statistics (if available)
      prisma.invoice.aggregate({
        where: { 
          tenantId,
          status: 'PAID',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _sum: { amount: true },
        _count: true,
      })
    ])

    return {
      success: true,
      stats: {
        users: userStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
        clients: clientStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
        spaces: spaceStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
        bookings: {
          last30Days: bookingStats.reduce((acc, stat) => {
            acc[stat.status.toLowerCase()] = stat._count
            return acc
          }, {} as Record<string, number>)
        },
        revenue: {
          last30Days: {
            amount: revenueStats._sum.amount || 0,
            invoiceCount: revenueStats._count,
          }
        }
      }
    }

  } catch (error) {
    console.error('Get tenant stats action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching tenant statistics',
    }
  }
}
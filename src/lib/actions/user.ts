'use server'

import { UserRole, UserStatus } from '@/types/database'
import { 
  createUserSchema, 
  updateUserSchema, 
  userFiltersSchema,
  paginationSchema,
  bulkUserOperationSchema,
  validateData,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserFilters,
  type BulkUserOperationRequest,
} from '../validations'
import { 
  requireAuth, 
  requireAdmin,
  requireRole,
  withTenantContext,
  getCurrentTenantId,
  getCurrentUserId,
  getTenantPrisma,
} from '../server/tenant-context'
import { AuthService } from '../server/auth'

/**
 * User Management Server Actions
 */

// Create new user (Admin only)
export async function createUserAction(data: CreateUserRequest) {
  try {
    // Validate input data
    const validation = validateData(createUserSchema, data)
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
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()
    const validData = validation.data

    // For non-super admins, ensure they can only create users in their tenant
    const targetTenantId = context.role === 'SUPER_ADMIN' ? validData.tenantId : context.tenantId

    if (!targetTenantId) {
      return {
        success: false,
        error: 'Tenant ID is required',
      }
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validData.email,
        tenantId: targetTenantId,
      }
    })

    if (existingUser) {
      return {
        success: false,
        error: 'User already exists in this tenant',
        fieldErrors: {
          email: 'A user with this email already exists in the tenant'
        }
      }
    }

    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: { id: true, name: true, slug: true }
    })

    if (!tenant) {
      return {
        success: false,
        error: 'Tenant not found',
      }
    }

    // Validate client exists if clientId is provided
    if (validData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validData.clientId,
          tenantId: targetTenantId,
        }
      })

      if (!client) {
        return {
          success: false,
          error: 'Client not found in this tenant',
          fieldErrors: {
            clientId: 'The specified client does not exist in this tenant'
          }
        }
      }
    }

    // Generate temporary password if needed
    const tempPassword = validData.temporaryPassword 
      ? Math.random().toString(36).slice(-12) + 'A1!'
      : undefined

    // Create user record in database first
    const user = await prisma.user.create({
      data: {
        email: validData.email,
        firstName: validData.firstName,
        lastName: validData.lastName,
        role: validData.role,
        status: UserStatus.ACTIVE,
        tenantId: targetTenantId,
        clientId: validData.clientId,
        phone: validData.phone,
        emailVerified: !validData.sendInvitation, // If sending invitation, email needs verification
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        clientId: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Send invitation email or create auth user
    if (validData.sendInvitation) {
      // TODO: Implement invitation email sending
      // For now, we'll just create a placeholder for this functionality
      console.log(`Invitation email would be sent to ${validData.email}`)
    }

    return {
      success: true,
      user,
      ...(tempPassword && { temporaryPassword: tempPassword }),
      message: 'User created successfully',
    }

  } catch (error) {
    console.error('Create user action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while creating user',
    }
  }
}

// Get user by ID
export async function getUserAction(userId: string) {
  try {
    // Require authentication
    const context = await requireAuth()
    
    const prisma = await getTenantPrisma()

    // Build query conditions based on user role
    const whereClause: any = { id: userId }

    // Non-super admins can only see users in their tenant
    if (context.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = context.tenantId
    }

    // Regular users can only see their own profile or users in their client
    if (context.role === 'END_USER') {
      if (context.clientId) {
        whereClause.OR = [
          { id: context.userId },
          { clientId: context.clientId }
        ]
      } else {
        whereClause.id = context.userId
      }
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        clientId: true,
        phone: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found or access denied',
      }
    }

    return {
      success: true,
      user,
    }

  } catch (error) {
    console.error('Get user action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching user',
    }
  }
}

// Update user
export async function updateUserAction(userId: string, data: UpdateUserRequest) {
  try {
    // Validate input data
    const validation = validateData(updateUserSchema, data)
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

    // Check if user exists and determine access permissions
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        role: true,
        status: true,
      }
    })

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    // Permission checks
    const canEdit = 
      context.role === 'SUPER_ADMIN' || // Super admin can edit anyone
      (context.role === 'COWORK_ADMIN' && existingUser.tenantId === context.tenantId) || // Cowork admin can edit users in their tenant
      (context.role === 'CLIENT_ADMIN' && existingUser.clientId === context.clientId) || // Client admin can edit users in their client
      (context.userId === userId) // Users can edit themselves

    if (!canEdit) {
      return {
        success: false,
        error: 'Access denied to update this user',
      }
    }

    // Additional validation for role changes
    if (validData.role && validData.role !== existingUser.role) {
      // Only admins can change roles
      if (!['SUPER_ADMIN', 'COWORK_ADMIN'].includes(context.role)) {
        return {
          success: false,
          error: 'Insufficient permissions to change user role',
        }
      }

      // Cowork admins cannot assign SUPER_ADMIN or COWORK_ADMIN roles
      if (context.role === 'COWORK_ADMIN' && ['SUPER_ADMIN', 'COWORK_ADMIN'].includes(validData.role)) {
        return {
          success: false,
          error: 'Cannot assign admin roles',
        }
      }
    }

    // Validate client exists if clientId is being changed
    if (validData.clientId && validData.clientId !== existingUser.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validData.clientId,
          tenantId: existingUser.tenantId,
        }
      })

      if (!client) {
        return {
          success: false,
          error: 'Client not found in this tenant',
          fieldErrors: {
            clientId: 'The specified client does not exist in this tenant'
          }
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validData.firstName,
        lastName: validData.lastName,
        role: validData.role,
        clientId: validData.clientId,
        phone: validData.phone,
        status: validData.status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        clientId: true,
        phone: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    }

  } catch (error) {
    console.error('Update user action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating user',
    }
  }
}

// List users with filtering and pagination
export async function listUsersAction(query: UserFilters & { page?: number; limit?: number }) {
  try {
    // Validate query parameters
    const paginatedQuery = paginationSchema.merge(userFiltersSchema)
    const validation = validateData(paginatedQuery, query)
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

    // Require authentication
    const context = await requireAuth()
    
    const prisma = await getTenantPrisma()
    const { 
      page, 
      limit, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search, 
      role, 
      status, 
      clientId, 
      createdAfter, 
      createdBefore,
      lastLoginAfter,
      lastLoginBefore
    } = validation.data

    // Build where clause based on user permissions
    const whereClause: any = {}

    // Non-super admins can only see users in their tenant
    if (context.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = context.tenantId
    }

    // Client admins can only see users in their client
    if (context.role === 'CLIENT_ADMIN' && context.clientId) {
      whereClause.clientId = context.clientId
    }

    // End users can only see themselves and other users in their client
    if (context.role === 'END_USER') {
      if (context.clientId) {
        whereClause.OR = [
          { id: context.userId },
          { clientId: context.clientId }
        ]
      } else {
        whereClause.id = context.userId
      }
    }

    // Apply filters
    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) {
      whereClause.role = role
    }

    if (status) {
      whereClause.status = status
    }

    if (clientId) {
      whereClause.clientId = clientId
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

    if (lastLoginAfter || lastLoginBefore) {
      whereClause.lastLoginAt = {}
      if (lastLoginAfter) {
        whereClause.lastLoginAt.gte = new Date(lastLoginAfter)
      }
      if (lastLoginBefore) {
        whereClause.lastLoginAt.lte = new Date(lastLoginBefore)
      }
    }

    // Execute queries
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          tenantId: true,
          clientId: true,
          phone: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          client: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      success: true,
      users,
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
    console.error('List users action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching users',
    }
  }
}

// Delete/deactivate user
export async function deleteUserAction(userId: string) {
  try {
    // Require admin permissions
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        role: true,
        status: true,
      }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    // Permission check
    if (context.role !== 'SUPER_ADMIN' && user.tenantId !== context.tenantId) {
      return {
        success: false,
        error: 'Access denied to delete this user',
      }
    }

    // Cannot delete yourself
    if (userId === context.userId) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      }
    }

    // Soft delete by changing status to INACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { 
        status: UserStatus.INACTIVE,
        updatedAt: new Date(),
      }
    })

    return {
      success: true,
      message: `User "${user.firstName} ${user.lastName}" has been deactivated`,
    }

  } catch (error) {
    console.error('Delete user action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while deleting user',
    }
  }
}

// Bulk user operations
export async function bulkUserOperationAction(data: BulkUserOperationRequest) {
  try {
    // Validate input data
    const validation = validateData(bulkUserOperationSchema, data)
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
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()
    const { userIds, operation, reason } = validation.data

    // Check all users exist and are accessible
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        ...(context.role !== 'SUPER_ADMIN' && { tenantId: context.tenantId }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        role: true,
        status: true,
      }
    })

    if (users.length !== userIds.length) {
      return {
        success: false,
        error: 'One or more users not found or access denied',
      }
    }

    // Cannot perform operations on yourself
    if (userIds.includes(context.userId)) {
      return {
        success: false,
        error: 'Cannot perform bulk operations on your own account',
      }
    }

    // Determine status based on operation
    let newStatus: UserStatus
    switch (operation) {
      case 'activate':
        newStatus = UserStatus.ACTIVE
        break
      case 'deactivate':
        newStatus = UserStatus.INACTIVE
        break
      case 'suspend':
        newStatus = UserStatus.SUSPENDED
        break
      case 'delete':
        newStatus = UserStatus.INACTIVE // Soft delete
        break
      default:
        return {
          success: false,
          error: 'Invalid operation',
        }
    }

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      }
    })

    return {
      success: true,
      affectedCount: result.count,
      message: `Successfully ${operation}d ${result.count} user(s)`,
    }

  } catch (error) {
    console.error('Bulk user operation action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during bulk operation',
    }
  }
}

// Get user statistics
export async function getUserStatsAction() {
  try {
    // Require admin permissions
    const context = await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Build query conditions based on user role
    const whereClause: any = {}
    if (context.role !== 'SUPER_ADMIN') {
      whereClause.tenantId = context.tenantId
    }

    // Get user statistics
    const [
      statusStats,
      roleStats,
      recentUsers,
      totalUsers
    ] = await Promise.all([
      // User status statistics
      prisma.user.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),
      
      // User role statistics
      prisma.user.groupBy({
        by: ['role'],
        where: whereClause,
        _count: true,
      }),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total users
      prisma.user.count({ where: whereClause })
    ])

    return {
      success: true,
      stats: {
        total: totalUsers,
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
        byRole: roleStats.reduce((acc, stat) => {
          acc[stat.role.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
        recent: {
          last7Days: recentUsers,
        }
      }
    }

  } catch (error) {
    console.error('Get user stats action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while fetching user statistics',
    }
  }
}
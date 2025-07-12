'use server'

import { z } from 'zod'
import { 
  requireAuth,
  getCurrentTenantId,
  getTenantPrisma,
} from '../server/tenant-context'
import { 
  performGlobalSearch,
  QueryBuilder,
  buildPagination,
  calculatePaginationMeta,
} from '../utils/search'
import { validateData } from '../validations'

/**
 * Advanced Search Server Actions
 */

// Global search schema
const globalSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(255, 'Search query is too long'),
  types: z.array(z.enum(['users', 'clients', 'tenants', 'spaces', 'bookings'])).optional(),
  limit: z.number().min(1).max(50).default(10),
})

type GlobalSearchRequest = z.infer<typeof globalSearchSchema>

// Advanced search schema
const advancedSearchSchema = z.object({
  model: z.enum(['user', 'client', 'tenant', 'space', 'booking']),
  query: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc'),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

type AdvancedSearchRequest = z.infer<typeof advancedSearchSchema>

/**
 * Global search across multiple models
 */
export async function globalSearchAction(data: GlobalSearchRequest) {
  try {
    // Validate input data
    const validation = validateData(globalSearchSchema, data)
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
    const { query, types, limit } = validation.data

    // Build search configurations based on user permissions
    const searchConfigs = []

    // Base where clause for tenant isolation
    const baseWhere = context.role === 'SUPER_ADMIN' ? {} : { tenantId: context.tenantId }

    // Users search
    if (!types || types.includes('users')) {
      const userWhere = { ...baseWhere }
      
      // Additional permissions for users
      if (context.role === 'CLIENT_ADMIN' && context.clientId) {
        userWhere.clientId = context.clientId
      } else if (context.role === 'END_USER') {
        userWhere.OR = [
          { id: context.userId },
          ...(context.clientId ? [{ clientId: context.clientId }] : [])
        ]
      }

      searchConfigs.push({
        model: 'user',
        fields: ['firstName', 'lastName', 'email'],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          tenant: { select: { name: true, slug: true } },
          client: { select: { name: true } },
        },
        where: userWhere,
        limit,
      })
    }

    // Clients search
    if (!types || types.includes('clients')) {
      let clientWhere = { ...baseWhere }
      
      // Client admins and end users can only see their own client
      if ((context.role === 'CLIENT_ADMIN' || context.role === 'END_USER') && context.clientId) {
        clientWhere.id = context.clientId
      }

      searchConfigs.push({
        model: 'client',
        fields: ['name', 'description', 'industry'],
        select: {
          id: true,
          name: true,
          description: true,
          industry: true,
          size: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              bookings: true,
            }
          }
        },
        where: clientWhere,
        limit,
      })
    }

    // Tenants search (admin only)
    if (context.role === 'SUPER_ADMIN' && (!types || types.includes('tenants'))) {
      searchConfigs.push({
        model: 'tenant',
        fields: ['name', 'slug', 'description'],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              clients: true,
              spaces: true,
            }
          }
        },
        where: {},
        limit,
      })
    }

    // Spaces search
    if (!types || types.includes('spaces')) {
      searchConfigs.push({
        model: 'space',
        fields: ['name', 'description', 'location'],
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          capacity: true,
          status: true,
          createdAt: true,
        },
        where: baseWhere,
        limit,
      })
    }

    // Bookings search
    if (!types || types.includes('bookings')) {
      let bookingWhere = { ...baseWhere }
      
      // Users can only see their own bookings or their client's bookings
      if (context.role === 'END_USER') {
        bookingWhere.OR = [
          { userId: context.userId },
          ...(context.clientId ? [{ user: { clientId: context.clientId } }] : [])
        ]
      } else if (context.role === 'CLIENT_ADMIN' && context.clientId) {
        bookingWhere.user = { clientId: context.clientId }
      }

      searchConfigs.push({
        model: 'booking',
        fields: ['title', 'description'],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          space: {
            select: {
              name: true,
              type: true,
            }
          }
        },
        where: bookingWhere,
        limit,
      })
    }

    // Perform global search
    const searchResults = await performGlobalSearch(prisma, query, searchConfigs)

    return {
      success: true,
      results: searchResults.results,
      totalResults: searchResults.totalResults,
      query,
    }

  } catch (error) {
    console.error('Global search action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during search',
    }
  }
}

/**
 * Advanced search with filters and sorting
 */
export async function advancedSearchAction(data: AdvancedSearchRequest) {
  try {
    // Validate input data
    const validation = validateData(advancedSearchSchema, data)
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
    const { model, query, filters, sort, page, limit } = validation.data

    // Base permissions check
    const baseWhere = context.role === 'SUPER_ADMIN' ? {} : { tenantId: context.tenantId }

    // Build query using QueryBuilder
    const queryBuilder = new QueryBuilder(baseWhere)

    // Add search if provided
    if (query) {
      switch (model) {
        case 'user':
          queryBuilder.addSearch(query, {
            fields: ['firstName', 'lastName', 'email'],
            caseSensitive: false,
          })
          break
        case 'client':
          queryBuilder.addSearch(query, {
            fields: ['name', 'description', 'industry'],
            caseSensitive: false,
          })
          break
        case 'tenant':
          queryBuilder.addSearch(query, {
            fields: ['name', 'slug', 'description'],
            caseSensitive: false,
          })
          break
        case 'space':
          queryBuilder.addSearch(query, {
            fields: ['name', 'description', 'location'],
            caseSensitive: false,
          })
          break
        case 'booking':
          queryBuilder.addSearch(query, {
            fields: ['title', 'description'],
            caseSensitive: false,
          })
          break
      }
    }

    // Add filters if provided
    if (filters) {
      const filterConfigs = {
        user: {
          role: { type: 'enum' as const },
          status: { type: 'enum' as const },
          clientId: { type: 'string' as const },
          createdAfter: { type: 'date' as const, operator: 'gte' as const },
          createdBefore: { type: 'date' as const, operator: 'lte' as const },
        },
        client: {
          status: { type: 'enum' as const },
          industry: { type: 'string' as const },
          size: { type: 'enum' as const },
          createdAfter: { type: 'date' as const, operator: 'gte' as const },
          createdBefore: { type: 'date' as const, operator: 'lte' as const },
        },
        tenant: {
          status: { type: 'enum' as const },
          createdAfter: { type: 'date' as const, operator: 'gte' as const },
          createdBefore: { type: 'date' as const, operator: 'lte' as const },
        },
        space: {
          type: { type: 'enum' as const },
          status: { type: 'enum' as const },
          minCapacity: { type: 'number' as const, operator: 'gte' as const },
          maxCapacity: { type: 'number' as const, operator: 'lte' as const },
        },
        booking: {
          status: { type: 'enum' as const },
          userId: { type: 'string' as const },
          spaceId: { type: 'string' as const },
          startAfter: { type: 'date' as const, operator: 'gte' as const },
          startBefore: { type: 'date' as const, operator: 'lte' as const },
        },
      }

      queryBuilder.addFilters(filters, filterConfigs[model] || {})
    }

    // Add sorting
    if (sort) {
      queryBuilder.addSort([{
        field: sort.field,
        direction: sort.direction,
      }])
    }

    // Build pagination
    const pagination = buildPagination({ page, limit })

    // Get the final query
    const { where, orderBy } = queryBuilder.build()

    // Additional permission checks per model
    switch (model) {
      case 'user':
        if (context.role === 'CLIENT_ADMIN' && context.clientId) {
          where.clientId = context.clientId
        } else if (context.role === 'END_USER') {
          where.OR = [
            { id: context.userId },
            ...(context.clientId ? [{ clientId: context.clientId }] : [])
          ]
        }
        break
      case 'client':
        if ((context.role === 'CLIENT_ADMIN' || context.role === 'END_USER') && context.clientId) {
          where.id = context.clientId
        }
        break
      case 'tenant':
        // Only super admin can search tenants
        if (context.role !== 'SUPER_ADMIN') {
          return {
            success: false,
            error: 'Insufficient permissions to search tenants',
          }
        }
        break
    }

    // Define select fields per model
    const selectFields = {
      user: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { name: true, slug: true } },
        client: { select: { name: true } },
      },
      client: {
        id: true,
        name: true,
        description: true,
        industry: true,
        size: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            bookings: true,
          }
        }
      },
      tenant: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            clients: true,
            spaces: true,
          }
        }
      },
      space: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      booking: {
        id: true,
        title: true,
        description: true,
        status: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        space: {
          select: {
            name: true,
            type: true,
          }
        }
      },
    }

    // Execute query
    const [results, totalCount] = await Promise.all([
      prisma[model].findMany({
        where,
        select: selectFields[model],
        orderBy,
        ...pagination,
      }),
      prisma[model].count({ where })
    ])

    // Calculate pagination metadata
    const paginationMeta = calculatePaginationMeta(totalCount, page, limit)

    return {
      success: true,
      results,
      pagination: paginationMeta,
      model,
      query,
      filters,
    }

  } catch (error) {
    console.error('Advanced search action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during advanced search',
    }
  }
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestionsAction(query: string, type?: string) {
  try {
    if (!query || query.length < 2) {
      return {
        success: true,
        suggestions: [],
      }
    }

    // Require authentication
    const context = await requireAuth()
    const prisma = await getTenantPrisma()

    const baseWhere = context.role === 'SUPER_ADMIN' ? {} : { tenantId: context.tenantId }
    const suggestions: Array<{ type: string; value: string; label: string; id: string }> = []

    // Get suggestions based on type or all types
    const types = type ? [type] : ['users', 'clients', 'spaces']

    if (types.includes('users')) {
      const users = await prisma.user.findMany({
        where: {
          ...baseWhere,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        take: 5,
      })

      users.forEach(user => {
        suggestions.push({
          type: 'user',
          value: `${user.firstName} ${user.lastName}`,
          label: `${user.firstName} ${user.lastName} (${user.email})`,
          id: user.id,
        })
      })
    }

    if (types.includes('clients')) {
      const clients = await prisma.client.findMany({
        where: {
          ...baseWhere,
          name: { contains: query, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          industry: true,
        },
        take: 5,
      })

      clients.forEach(client => {
        suggestions.push({
          type: 'client',
          value: client.name,
          label: `${client.name}${client.industry ? ` (${client.industry})` : ''}`,
          id: client.id,
        })
      })
    }

    if (types.includes('spaces')) {
      const spaces = await prisma.space.findMany({
        where: {
          ...baseWhere,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
        take: 5,
      })

      spaces.forEach(space => {
        suggestions.push({
          type: 'space',
          value: space.name,
          label: `${space.name} (${space.type})`,
          id: space.id,
        })
      })
    }

    return {
      success: true,
      suggestions: suggestions.slice(0, 15), // Limit total suggestions
    }

  } catch (error) {
    console.error('Get search suggestions action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while getting suggestions',
    }
  }
}
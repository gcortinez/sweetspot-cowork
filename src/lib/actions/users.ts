'use server'

import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'

export interface UserSearchResult {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
}

export async function searchUsers(query: { 
  search?: string; 
  limit?: number; 
  page?: number 
}): Promise<{ 
  success: boolean; 
  data?: UserSearchResult[]; 
  error?: string 
}> {
  try {
    const context = await getTenantContext()
    
    const { search = '', limit = 20, page = 1 } = query
    
    // Build where clause based on user permissions
    const whereClause: any = {}
    
    // Non-super admins can only see users in their tenant
    if (!context.isSuper) {
      whereClause.tenantId = context.tenantId
    }
    
    // Add search functionality
    if (search && search.trim() !== '') {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Only show active users
    whereClause.status = 'ACTIVE'
    
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
      take: limit,
      skip: (page - 1) * limit,
    })
    
    return {
      success: true,
      data: users,
    }
    
  } catch (error) {
    console.error('Error searching users:', error)
    return {
      success: false,
      error: 'Error al buscar usuarios',
    }
  }
}
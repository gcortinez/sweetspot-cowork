'use server'

import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/database'

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

/**
 * Get user profile by ID
 */
export async function getUserProfileAction(userId: string): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    // Users can only access their own profile unless they're admin
    if (!context.isSuper && context.user.id !== userId) {
      return { success: false, error: 'No tienes permisos para acceder a este perfil' }
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          }
        }
      }
    })
    
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' }
    }
    
    // Remove sensitive data
    const { clerkId, ...safeUser } = user
    
    return {
      success: true,
      data: safeUser
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return {
      success: false,
      error: 'Error al obtener el perfil del usuario'
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfileAction(data: {
  userId: string
  firstName: string
  lastName: string
  phone?: string
}): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    // Users can only update their own profile unless they're admin
    if (!context.isSuper && context.user.id !== data.userId) {
      return { success: false, error: 'No tienes permisos para editar este perfil' }
    }
    
    // Validate input
    if (!data.firstName?.trim() || !data.lastName?.trim()) {
      return { success: false, error: 'Nombre y apellido son requeridos' }
    }
    
    const user = await db.user.update({
      where: { id: data.userId },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          }
        }
      }
    })
    
    revalidatePath('/profile')
    
    // Remove sensitive data
    const { clerkId, ...safeUser } = user
    
    return {
      success: true,
      data: safeUser,
      message: 'Perfil actualizado exitosamente'
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return {
      success: false,
      error: 'Error al actualizar el perfil'
    }
  }
}

/**
 * List users in tenant (for admin use)
 */
export async function listTenantUsersAction(data: {
  page?: number
  limit?: number
  search?: string
  role?: string
}): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    // Only admins can list users
    if (!context.isAdmin && !context.isSuper) {
      return { success: false, error: 'No tienes permisos para ver la lista de usuarios' }
    }
    
    const { page = 1, limit = 10, search, role } = data
    
    const whereClause: any = {}
    
    // For non-super admins, limit to their tenant
    if (!context.isSuper) {
      whereClause.tenantId = context.tenantId
    }
    
    // Add search filter
    if (search && search.trim()) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Add role filter
    if (role) {
      whereClause.role = role
    }
    
    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ],
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.user.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    }
  } catch (error) {
    console.error('Error listing tenant users:', error)
    return {
      success: false,
      error: 'Error al listar los usuarios'
    }
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRoleAction(data: {
  userId: string
  newRole: string
}): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    // Only admins can change user roles
    if (!context.isAdmin && !context.isSuper) {
      return { success: false, error: 'No tienes permisos para cambiar roles de usuario' }
    }
    
    // Validate role
    const validRoles = ['COWORK_ADMIN', 'CLIENT_ADMIN', 'END_USER']
    if (!context.isSuper) {
      // Non-super admins can't assign SUPER_ADMIN role
      if (data.newRole === 'SUPER_ADMIN') {
        return { success: false, error: 'No puedes asignar el rol de Super Admin' }
      }
    } else {
      validRoles.push('SUPER_ADMIN')
    }
    
    if (!validRoles.includes(data.newRole)) {
      return { success: false, error: 'Rol inválido' }
    }
    
    const user = await db.user.update({
      where: { id: data.userId },
      data: { role: data.newRole },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    })
    
    revalidatePath('/cowork-settings')
    
    return {
      success: true,
      data: user,
      message: 'Rol de usuario actualizado exitosamente'
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    return {
      success: false,
      error: 'Error al actualizar el rol del usuario'
    }
  }
}
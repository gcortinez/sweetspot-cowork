'use server'

import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { 
  createActivitySchema, 
  updateActivitySchema, 
  listActivitiesSchema,
  type CreateActivityInput,
  type UpdateActivityInput,
  type ListActivitiesInput
} from '@/lib/validations/activities'

// Helper function to get user with tenant info
async function getUserWithTenant() {
  const user = await currentUser()
  
  if (!user) {
    throw new Error('No autorizado - no hay usuario de Clerk')
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { 
      id: true, 
      tenantId: true, 
      role: true,
      firstName: true,
      lastName: true,
      email: true
    }
  })

  if (!dbUser) {
    throw new Error('Usuario no encontrado en la base de datos')
  }

  return dbUser
}

// Create a new activity
export async function createActivity(input: CreateActivityInput) {
  try {
    const validatedInput = createActivitySchema.parse(input)
    const user = await getUserWithTenant()

    if (!user.tenantId) {
      throw new Error('Usuario no tiene un tenant asignado')
    }

    const activity = await db.activity.create({
      data: {
        ...validatedInput,
        dueDate: validatedInput.dueDate ? new Date(validatedInput.dueDate) : undefined,
        completedAt: validatedInput.completedAt ? new Date(validatedInput.completedAt) : null,
        tenantId: user.tenantId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/leads')
    revalidatePath('/activities')
    if (validatedInput.leadId) {
      revalidatePath(`/leads/${validatedInput.leadId}`)
    }
    if (validatedInput.clientId) {
      revalidatePath(`/clients/${validatedInput.clientId}`)
    }

    return {
      success: true,
      data: activity,
    }
  } catch (error) {
    console.error('Error creating activity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al crear la actividad',
    }
  }
}

// Update an existing activity
export async function updateActivity(id: string, input: UpdateActivityInput) {
  try {
    const validatedInput = updateActivitySchema.parse(input)
    const user = await getUserWithTenant()

    // First check if activity exists and belongs to user's tenant
    const existingActivity = await db.activity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id, // Only allow users to update their own activities
      },
    })

    if (!existingActivity) {
      return {
        success: false,
        error: 'Actividad no encontrada o no tienes permisos para editarla',
      }
    }

    const activity = await db.activity.update({
      where: { id },
      data: {
        ...validatedInput,
        dueDate: validatedInput.dueDate ? new Date(validatedInput.dueDate) : undefined,
        completedAt: validatedInput.completedAt === null ? null : 
                    validatedInput.completedAt ? new Date(validatedInput.completedAt) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/leads')
    revalidatePath('/activities')
    if (activity.leadId) {
      revalidatePath(`/leads/${activity.leadId}`)
    }
    if (activity.clientId) {
      revalidatePath(`/clients/${activity.clientId}`)
    }

    return {
      success: true,
      data: activity,
    }
  } catch (error) {
    console.error('Error updating activity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al actualizar la actividad',
    }
  }
}

// Delete an activity
export async function deleteActivity(id: string) {
  try {
    const user = await getUserWithTenant()

    // First check if activity exists and belongs to user's tenant
    const existingActivity = await db.activity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id, // Only allow users to delete their own activities
      },
    })

    if (!existingActivity) {
      return {
        success: false,
        error: 'Actividad no encontrada o no tienes permisos para eliminarla',
      }
    }

    await db.activity.delete({
      where: { id },
    })

    // Revalidate relevant paths
    revalidatePath('/leads')
    revalidatePath('/activities')
    if (existingActivity.leadId) {
      revalidatePath(`/leads/${existingActivity.leadId}`)
    }
    if (existingActivity.clientId) {
      revalidatePath(`/clients/${existingActivity.clientId}`)
    }

    return {
      success: true,
      message: 'Actividad eliminada exitosamente',
    }
  } catch (error) {
    console.error('Error deleting activity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al eliminar la actividad',
    }
  }
}

// Get a single activity
export async function getActivity(id: string) {
  try {
    const user = await getUserWithTenant()

    const activity = await db.activity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    })

    if (!activity) {
      return {
        success: false,
        error: 'Actividad no encontrada',
      }
    }

    return {
      success: true,
      data: activity,
    }
  } catch (error) {
    console.error('Error getting activity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener la actividad',
    }
  }
}

// List activities with filters and pagination
export async function listActivities(input: ListActivitiesInput = {}) {
  try {
    const validatedInput = listActivitiesSchema.parse(input)
    const user = await getUserWithTenant()

    const {
      leadId,
      clientId,
      opportunityId,
      type,
      completed,
      sortBy,
      sortOrder,
      page,
      limit,
    } = validatedInput

    // Build where clause
    const where: any = {
      tenantId: user.tenantId,
    }

    if (leadId) where.leadId = leadId
    if (clientId) where.clientId = clientId
    if (opportunityId) where.opportunityId = opportunityId
    if (type) where.type = type
    if (completed !== undefined) {
      if (completed) {
        where.completedAt = { not: null }
      } else {
        where.completedAt = null
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get activities and total count
    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
          opportunity: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
            },
          },
        },
      }),
      db.activity.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    }
  } catch (error) {
    console.error('Error listing activities:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener las actividades',
    }
  }
}
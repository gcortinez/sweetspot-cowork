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

// Helper function to serialize activity data
function serializeActivity(activity: any) {
  // Helper function to safely convert Decimal to number
  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') return parseFloat(value) || 0
    // Handle Prisma Decimal objects
    if (value && typeof value.toNumber === 'function') return value.toNumber()
    if (value && typeof value.toString === 'function') return parseFloat(value.toString()) || 0
    return Number(value) || 0
  }

  return {
    ...activity,
    title: activity.subject || activity.title, // Map subject to title for compatibility
    createdAt: activity.createdAt ? activity.createdAt.toISOString() : null,
    updatedAt: activity.updatedAt ? activity.updatedAt.toISOString() : null,
    dueDate: activity.dueDate ? activity.dueDate.toISOString() : null,
    completedAt: activity.completedAt ? activity.completedAt.toISOString() : null,
    // Handle nested objects with potential Decimal values
    opportunity: activity.opportunity ? {
      ...activity.opportunity,
      value: toNumber(activity.opportunity.value),
    } : null,
  }
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
    revalidatePath('/opportunities')
    if (validatedInput.leadId) {
      revalidatePath(`/leads/${validatedInput.leadId}`)
    }
    if (validatedInput.clientId) {
      revalidatePath(`/clients/${validatedInput.clientId}`)
    }
    if (validatedInput.opportunityId) {
      revalidatePath(`/opportunities/${validatedInput.opportunityId}`)
    }

    return {
      success: true,
      data: serializeActivity(activity),
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
    revalidatePath('/opportunities')
    if (activity.leadId) {
      revalidatePath(`/leads/${activity.leadId}`)
    }
    if (activity.clientId) {
      revalidatePath(`/clients/${activity.clientId}`)
    }
    if (activity.opportunityId) {
      revalidatePath(`/opportunities/${activity.opportunityId}`)
    }

    return {
      success: true,
      data: serializeActivity(activity),
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
    revalidatePath('/opportunities')
    if (existingActivity.leadId) {
      revalidatePath(`/leads/${existingActivity.leadId}`)
    }
    if (existingActivity.clientId) {
      revalidatePath(`/clients/${existingActivity.clientId}`)
    }
    if (existingActivity.opportunityId) {
      revalidatePath(`/opportunities/${existingActivity.opportunityId}`)
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
      data: serializeActivity(activity),
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
    const orderBy: any = [
      { sortOrder: 'asc' }, // Primary sort by manual order
      { [sortBy]: sortOrder }, // Secondary sort by the requested field
    ]

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
      data: activities.map(activity => serializeActivity(activity)),
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

// Update activity order for drag & drop
export async function updateActivityOrder(
  activities: Array<{ id: string; sortOrder: number }>
) {
  try {
    const user = await getUserWithTenant()

    if (!user.tenantId && user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'No autorizado - no hay tenant asociado',
      }
    }

    // Update each activity's sort order
    await db.$transaction(
      activities.map(({ id, sortOrder }) =>
        db.activity.update({
          where: { 
            id,
            ...(user.tenantId ? { tenantId: user.tenantId } : {}),
          },
          data: { sortOrder },
        })
      )
    )

    revalidatePath('/opportunities')
    revalidatePath('/activities')

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Error updating activity order:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al actualizar el orden de las actividades',
    }
  }
}


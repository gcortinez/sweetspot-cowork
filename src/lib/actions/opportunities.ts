'use server'

import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { 
  createOpportunitySchema, 
  updateOpportunitySchema,
  changeStageSchema,
  convertLeadToOpportunitySchema,
  listOpportunitiesSchema,
  opportunityStatsSchema,
  STAGE_METADATA,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
  type ChangeStageInput,
  type ConvertLeadToOpportunityInput,
  type ListOpportunitiesInput,
  type OpportunityStatsInput
} from '@/lib/validations/opportunities'

// Helper function to serialize opportunity data
function serializeOpportunity(opportunity: any) {
  return {
    ...opportunity,
    value: opportunity.value ? Number(opportunity.value) : 0,
    expectedRevenue: opportunity.expectedRevenue ? Number(opportunity.expectedRevenue) : 0,
  }
}

// Helper function to serialize stats data
function serializeStats(stats: any) {
  if (stats.totalValue) {
    stats.totalValue = Number(stats.totalValue)
  }
  if (stats.totalExpectedRevenue) {
    stats.totalExpectedRevenue = Number(stats.totalExpectedRevenue)
  }
  return stats
}

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

// Create a new opportunity
export async function createOpportunity(input: CreateOpportunityInput) {
  try {
    const validatedInput = createOpportunitySchema.parse(input)
    const user = await getUserWithTenant()

    if (!user.tenantId) {
      throw new Error('Usuario no tiene un tenant asignado')
    }

    // Calculate expected revenue if not provided
    const expectedRevenue = validatedInput.expectedRevenue ?? 
      (validatedInput.value * validatedInput.probability) / 100

    const opportunity = await db.opportunity.create({
      data: {
        ...validatedInput,
        expectedRevenue,
        tenantId: user.tenantId,
        assignedToId: validatedInput.assignedToId || user.id, // Default to current user
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')
    if (validatedInput.leadId) {
      revalidatePath(`/leads/${validatedInput.leadId}`)
    }

    return {
      success: true,
      data: serializeOpportunity(opportunity),
    }
  } catch (error) {
    console.error('Error creating opportunity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al crear la oportunidad',
    }
  }
}

// Update an existing opportunity
export async function updateOpportunity(id: string, input: UpdateOpportunityInput) {
  try {
    const validatedInput = updateOpportunitySchema.parse(input)
    const user = await getUserWithTenant()

    // Check if opportunity exists and belongs to user's tenant
    const existingOpportunity = await db.opportunity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!existingOpportunity) {
      return {
        success: false,
        error: 'Oportunidad no encontrada o no tienes permisos para editarla',
      }
    }

    // Calculate expected revenue if value or probability changed
    let expectedRevenue = validatedInput.expectedRevenue
    if ((validatedInput.value !== undefined || validatedInput.probability !== undefined) && !expectedRevenue) {
      const value = validatedInput.value ?? existingOpportunity.value
      const probability = validatedInput.probability ?? existingOpportunity.probability
      expectedRevenue = (Number(value) * probability) / 100
    }

    const opportunity = await db.opportunity.update({
      where: { id },
      data: {
        ...validatedInput,
        expectedRevenue,
        expectedCloseDate: validatedInput.expectedCloseDate ? new Date(validatedInput.expectedCloseDate) : undefined,
        actualCloseDate: validatedInput.actualCloseDate ? new Date(validatedInput.actualCloseDate) : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')
    if (opportunity.leadId) {
      revalidatePath(`/leads/${opportunity.leadId}`)
    }

    return {
      success: true,
      data: serializeOpportunity(opportunity),
    }
  } catch (error) {
    console.error('Error updating opportunity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al actualizar la oportunidad',
    }
  }
}

// Change opportunity stage
export async function changeOpportunityStage(id: string, input: ChangeStageInput) {
  try {
    const validatedInput = changeStageSchema.parse(input)
    const user = await getUserWithTenant()

    // Check if opportunity exists and belongs to user's tenant
    const existingOpportunity = await db.opportunity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!existingOpportunity) {
      return {
        success: false,
        error: 'Oportunidad no encontrada',
      }
    }

    // Auto-set probability based on stage if not provided
    const stageMetadata = STAGE_METADATA[validatedInput.stage]
    const probability = validatedInput.probability ?? stageMetadata.probability ?? existingOpportunity.probability

    // Prepare update data
    const updateData: any = {
      stage: validatedInput.stage,
      probability,
    }

    // Handle close date for closed stages
    if (validatedInput.stage === 'CLOSED_WON' || validatedInput.stage === 'CLOSED_LOST') {
      updateData.actualCloseDate = validatedInput.actualCloseDate ? new Date(validatedInput.actualCloseDate) : new Date()
    }

    // Handle lost reason for CLOSED_LOST
    if (validatedInput.stage === 'CLOSED_LOST' && validatedInput.lostReason) {
      updateData.lostReason = validatedInput.lostReason
    }

    // Recalculate expected revenue
    updateData.expectedRevenue = (Number(existingOpportunity.value) * probability) / 100

    const opportunity = await db.opportunity.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: serializeOpportunity(opportunity),
    }
  } catch (error) {
    console.error('Error changing opportunity stage:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al cambiar la etapa',
    }
  }
}

// Convert lead to opportunity
export async function convertLeadToOpportunity(input: ConvertLeadToOpportunityInput) {
  try {
    console.log('convertLeadToOpportunity called with input:', input)
    const validatedInput = convertLeadToOpportunitySchema.parse(input)
    const user = await getUserWithTenant()

    if (!user.tenantId) {
      throw new Error('Usuario no tiene un tenant asignado')
    }

    // Check if lead exists and belongs to user's tenant
    const lead = await db.lead.findFirst({
      where: {
        id: validatedInput.leadId,
        tenantId: user.tenantId,
      },
    })

    if (!lead) {
      return {
        success: false,
        error: 'Prospecto no encontrado',
      }
    }

    // Check if lead is already converted
    if (lead.status === 'CONVERTED') {
      return {
        success: false,
        error: 'Este prospecto ya ha sido convertido',
      }
    }

    // Calculate expected revenue
    const expectedRevenue = (validatedInput.value * validatedInput.probability) / 100

    // Create opportunity and update lead status in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create opportunity
      const opportunity = await tx.opportunity.create({
        data: {
          ...validatedInput,
          expectedRevenue,
          tenantId: user.tenantId,
          assignedToId: validatedInput.assignedToId || user.id,
          expectedCloseDate: validatedInput.expectedCloseDate ? new Date(validatedInput.expectedCloseDate) : undefined,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
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
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Update lead status
      await tx.lead.update({
        where: { id: validatedInput.leadId },
        data: { status: 'CONVERTED' },
      })

      return opportunity
    })

    // Revalidate relevant paths
    revalidatePath('/opportunities')
    revalidatePath('/leads')
    revalidatePath('/dashboard')
    revalidatePath(`/leads/${validatedInput.leadId}`)

    return {
      success: true,
      data: serializeOpportunity(result),
    }
  } catch (error) {
    console.error('Error converting lead to opportunity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al convertir el prospecto',
    }
  }
}

// Delete an opportunity
export async function deleteOpportunity(id: string) {
  try {
    const user = await getUserWithTenant()

    // Check if opportunity exists and belongs to user's tenant
    const existingOpportunity = await db.opportunity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!existingOpportunity) {
      return {
        success: false,
        error: 'Oportunidad no encontrada',
      }
    }

    await db.opportunity.delete({
      where: { id },
    })

    // Revalidate relevant paths
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Oportunidad eliminada exitosamente',
    }
  } catch (error) {
    console.error('Error deleting opportunity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al eliminar la oportunidad',
    }
  }
}

// Get a single opportunity
export async function getOpportunity(id: string) {
  try {
    const user = await getUserWithTenant()

    const opportunity = await db.opportunity.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!opportunity) {
      return {
        success: false,
        error: 'Oportunidad no encontrada',
      }
    }

    return {
      success: true,
      data: serializeOpportunity(opportunity),
    }
  } catch (error) {
    console.error('Error getting opportunity:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener la oportunidad',
    }
  }
}

// List opportunities with filters and pagination
export async function listOpportunities(input: ListOpportunitiesInput = {}) {
  try {
    const validatedInput = listOpportunitiesSchema.parse(input)
    const user = await getUserWithTenant()

    const {
      stage,
      clientId,
      assignedToId,
      minValue,
      maxValue,
      expectedCloseBefore,
      expectedCloseAfter,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    } = validatedInput

    // Build where clause
    const where: any = {
      tenantId: user.tenantId,
    }

    if (stage) where.stage = stage
    if (clientId) where.clientId = clientId
    if (assignedToId) where.assignedToId = assignedToId
    
    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {}
      if (minValue !== undefined) where.value.gte = minValue
      if (maxValue !== undefined) where.value.lte = maxValue
    }

    if (expectedCloseBefore || expectedCloseAfter) {
      where.expectedCloseDate = {}
      if (expectedCloseBefore) where.expectedCloseDate.lte = new Date(expectedCloseBefore)
      if (expectedCloseAfter) where.expectedCloseDate.gte = new Date(expectedCloseAfter)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get opportunities and total count
    const [opportunities, total] = await Promise.all([
      db.opportunity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
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
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      db.opportunity.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      success: true,
      data: opportunities.map(serializeOpportunity),
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
    console.error('Error listing opportunities:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener las oportunidades',
    }
  }
}

// Get opportunity statistics
export async function getOpportunityStats(input: OpportunityStatsInput = {}) {
  try {
    const validatedInput = opportunityStatsSchema.parse(input)
    const user = await getUserWithTenant()

    const where: any = {
      tenantId: user.tenantId,
    }

    // Add date filters if provided
    if (validatedInput.dateRange?.start || validatedInput.dateRange?.end) {
      where.createdAt = {}
      if (validatedInput.dateRange.start) {
        where.createdAt.gte = new Date(validatedInput.dateRange.start)
      }
      if (validatedInput.dateRange.end) {
        where.createdAt.lte = new Date(validatedInput.dateRange.end)
      }
    }

    // Get basic counts by stage
    const stageStats = await db.opportunity.groupBy({
      by: ['stage'],
      where,
      _count: true,
      _sum: {
        value: true,
        expectedRevenue: true,
      },
    })

    // Get overall stats
    const overallStats = await db.opportunity.aggregate({
      where,
      _count: true,
      _sum: {
        value: true,
        expectedRevenue: true,
      },
      _avg: {
        probability: true,
      },
    })

    // Calculate win rate
    const closedOpportunities = await db.opportunity.count({
      where: {
        ...where,
        stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
    })

    const wonOpportunities = await db.opportunity.count({
      where: {
        ...where,
        stage: 'CLOSED_WON',
      },
    })

    const winRate = closedOpportunities > 0 ? (wonOpportunities / closedOpportunities) * 100 : 0

    return {
      success: true,
      data: {
        byStage: stageStats.reduce((acc, stat) => {
          acc[stat.stage] = serializeStats({
            count: stat._count,
            totalValue: stat._sum.value || 0,
            totalExpectedRevenue: stat._sum.expectedRevenue || 0,
          })
          return acc
        }, {} as Record<string, any>),
        overall: serializeStats({
          totalOpportunities: overallStats._count,
          totalValue: overallStats._sum.value || 0,
          totalExpectedRevenue: overallStats._sum.expectedRevenue || 0,
          averageProbability: overallStats._avg.probability || 0,
          winRate,
        }),
      },
    }
  } catch (error) {
    console.error('Error getting opportunity stats:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener las estadísticas',
    }
  }
}
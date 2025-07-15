'use server'

import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { 
  createClientSchema, 
  updateClientSchema,
  listClientsSchema,
  clientStatsSchema,
  convertLeadToClientSchema,
  clientSearchSchema,
  CLIENT_STATUS,
  type CreateClientInput,
  type UpdateClientInput,
  type ListClientsInput,
  type ClientStatsInput,
  type ConvertLeadToClientInput,
  type ClientSearchInput,
  type ClientWithRelations
} from '@/lib/validations/clients'

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

// Create a new client
export async function createClient(input: CreateClientInput) {
  try {
    const validatedInput = createClientSchema.parse(input)
    const user = await getUserWithTenant()

    if (!user.tenantId) {
      throw new Error('Usuario no tiene un tenant asignado')
    }

    // Check if client with same email already exists in this tenant
    const existingClient = await db.client.findFirst({
      where: {
        email: validatedInput.email,
        tenantId: user.tenantId,
      },
    })

    if (existingClient) {
      return {
        success: false,
        error: 'Ya existe un cliente con este email en tu organización',
      }
    }

    const client = await db.client.create({
      data: {
        ...validatedInput,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            opportunities: true,
            leads: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/clients')
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: client,
    }
  } catch (error) {
    console.error('Error creating client:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al crear el cliente',
    }
  }
}

// Update an existing client
export async function updateClient(id: string, input: UpdateClientInput) {
  try {
    const validatedInput = updateClientSchema.parse(input)
    const user = await getUserWithTenant()

    // Check if client exists and belongs to user's tenant
    const existingClient = await db.client.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!existingClient) {
      return {
        success: false,
        error: 'Cliente no encontrado o no tienes permisos para editarlo',
      }
    }

    // Check email uniqueness if email is being updated
    if (validatedInput.email && validatedInput.email !== existingClient.email) {
      const emailExists = await db.client.findFirst({
        where: {
          email: validatedInput.email,
          tenantId: user.tenantId,
          id: { not: id },
        },
      })

      if (emailExists) {
        return {
          success: false,
          error: 'Ya existe otro cliente con este email',
        }
      }
    }

    const client = await db.client.update({
      where: { id },
      data: validatedInput,
      include: {
        _count: {
          select: {
            opportunities: true,
            leads: true,
          },
        },
      },
    })

    // Revalidate relevant paths
    revalidatePath('/clients')
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: client,
    }
  } catch (error) {
    console.error('Error updating client:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al actualizar el cliente',
    }
  }
}

// Delete a client (soft delete by changing status to INACTIVE)
export async function deleteClient(id: string) {
  try {
    const user = await getUserWithTenant()

    // Check if client exists and belongs to user's tenant
    const existingClient = await db.client.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!existingClient) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    // Check if client has active opportunities
    const activeOpportunities = await db.opportunity.count({
      where: {
        clientId: id,
        stage: {
          not: { in: ['CLOSED_WON', 'CLOSED_LOST'] }
        }
      }
    })

    if (activeOpportunities > 0) {
      return {
        success: false,
        error: 'No se puede eliminar un cliente con oportunidades activas',
      }
    }

    // Soft delete by updating status to INACTIVE
    await db.client.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })

    // Revalidate relevant paths
    revalidatePath('/clients')
    revalidatePath('/opportunities')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Cliente marcado como inactivo exitosamente',
    }
  } catch (error) {
    console.error('Error deleting client:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al eliminar el cliente',
    }
  }
}

// Get a single client
export async function getClient(id: string) {
  try {
    const user = await getUserWithTenant()

    const client = await db.client.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            opportunities: true,
            leads: true,
          },
        },
        opportunities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            createdAt: true,
          },
        },
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Cliente no encontrado',
      }
    }

    return {
      success: true,
      data: client,
    }
  } catch (error) {
    console.error('Error getting client:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener el cliente',
    }
  }
}

// List clients with filters and pagination
export async function listClients(input: ListClientsInput = {}) {
  try {
    const validatedInput = listClientsSchema.parse(input)
    const user = await getUserWithTenant()

    const {
      status,
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

    if (status) where.status = status

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get clients and total count
    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              opportunities: true,
              leads: true,
            },
          },
        },
      }),
      db.client.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return {
      success: true,
      data: clients,
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
    console.error('Error listing clients:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al obtener los clientes',
    }
  }
}

// Get client statistics
export async function getClientStats(input: ClientStatsInput = {}) {
  try {
    const validatedInput = clientStatsSchema.parse(input)
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

    // Get counts by status
    const statusStats = await db.client.groupBy({
      by: ['status'],
      where,
      _count: true,
    })

    // Get total counts
    const totalClients = await db.client.count({ where })
    const activeClients = await db.client.count({
      where: { ...where, status: 'ACTIVE' }
    })
    const prospects = await db.client.count({
      where: { ...where, status: { in: ['LEAD', 'PROSPECT'] } }
    })

    // Get conversion rate (prospects to active clients)
    const convertedClients = await db.client.count({
      where: { 
        ...where, 
        status: 'ACTIVE',
        // Clients that were created as prospects and later became active
        updatedAt: { gt: db.client.fields.createdAt }
      }
    })

    const conversionRate = prospects > 0 ? (convertedClients / prospects) * 100 : 0

    return {
      success: true,
      data: {
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count
          return acc
        }, {} as Record<string, number>),
        overall: {
          totalClients,
          activeClients,
          prospects,
          conversionRate,
        },
      },
    }
  } catch (error) {
    console.error('Error getting client stats:', error)
    
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

// Convert lead to client
export async function convertLeadToClient(input: ConvertLeadToClientInput) {
  try {
    const validatedInput = convertLeadToClientSchema.parse(input)
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

    // Check if client with same email already exists
    const existingClient = await db.client.findFirst({
      where: {
        email: validatedInput.clientData.email,
        tenantId: user.tenantId,
      },
    })

    if (existingClient) {
      return {
        success: false,
        error: 'Ya existe un cliente con este email',
      }
    }

    // Create client and update lead status in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create client
      const client = await tx.client.create({
        data: {
          ...validatedInput.clientData,
          tenantId: user.tenantId,
          status: 'PROSPECT', // Start as prospect
        },
        include: {
          _count: {
            select: {
              opportunities: true,
              leads: true,
            },
          },
        },
      })

      // Update lead status and link to client
      await tx.lead.update({
        where: { id: validatedInput.leadId },
        data: { 
          status: 'CONVERTED',
          clientId: client.id,
        },
      })

      return client
    })

    // Revalidate relevant paths
    revalidatePath('/clients')
    revalidatePath('/leads')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Error converting lead to client:', error)
    
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

// Search clients (for selectors)
export async function searchClients(input: ClientSearchInput) {
  try {
    const validatedInput = clientSearchSchema.parse(input)
    const user = await getUserWithTenant()

    const clients = await db.client.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { name: { contains: validatedInput.query, mode: 'insensitive' } },
          { email: { contains: validatedInput.query, mode: 'insensitive' } },
          { contactPerson: { contains: validatedInput.query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        contactPerson: true,
      },
      take: validatedInput.limit,
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: clients,
    }
  } catch (error) {
    console.error('Error searching clients:', error)
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return {
      success: false,
      error: 'Error desconocido al buscar clientes',
    }
  }
}
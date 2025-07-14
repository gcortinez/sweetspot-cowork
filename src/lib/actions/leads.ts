'use server'

import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Validation schemas
export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  qualificationNotes: z.string().optional(),
  assignedToId: z.string().optional(),
})

export const updateLeadSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  qualificationNotes: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'DORMANT']).optional(),
  score: z.number().min(0).max(100).optional(),
  assignedToId: z.string().optional(),
})

export const leadsListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'DORMANT']).optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
})

// Types
export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadsListInput = z.infer<typeof leadsListSchema>

// Helper function to get user with tenant info
async function getUserWithTenant() {
  const user = await currentUser()
  console.log('🔍 Clerk user:', user?.id, user?.emailAddresses?.[0]?.emailAddress)
  
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

  console.log('🗃️ Database user:', {
    found: !!dbUser,
    id: dbUser?.id,
    email: dbUser?.email,
    tenantId: dbUser?.tenantId,
    role: dbUser?.role
  })

  if (!dbUser) {
    // Try to find by email as fallback
    const userByEmail = await db.user.findFirst({
      where: { 
        email: user.emailAddresses[0]?.emailAddress 
      },
      select: { 
        id: true, 
        tenantId: true, 
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        clerkId: true
      }
    })
    
    console.log('📧 User by email fallback:', userByEmail)
    
    if (userByEmail && !userByEmail.clerkId) {
      // Update the user with clerkId
      console.log('🔗 Updating user with Clerk ID...')
      const updatedUser = await db.user.update({
        where: { id: userByEmail.id },
        data: { clerkId: user.id },
        select: { 
          id: true, 
          tenantId: true, 
          role: true,
          firstName: true,
          lastName: true,
          email: true
        }
      })
      console.log('✅ User updated with Clerk ID:', updatedUser)
      return updatedUser
    }
    
    throw new Error(`Usuario no encontrado en la base de datos. Clerk ID: ${user.id}, Email: ${user.emailAddresses[0]?.emailAddress}`)
  }

  if (!dbUser.tenantId) {
    throw new Error(`Usuario no tiene un tenant asignado. User ID: ${dbUser.id}, Email: ${dbUser.email}`)
  }

  return dbUser
}

/**
 * Create a new lead
 */
export async function createLead(input: CreateLeadInput) {
  try {
    console.log('💾 Creating lead:', input)
    
    const validatedInput = createLeadSchema.parse(input)
    const user = await getUserWithTenant()

    console.log('👤 Creating lead for user:', {
      userId: user.id,
      tenantId: user.tenantId,
      userEmail: user.email
    })

    const lead = await db.lead.create({
      data: {
        ...validatedInput,
        tenantId: user.tenantId!,
        interests: validatedInput.interests || [],
        budget: validatedInput.budget ? validatedInput.budget : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    console.log('✅ Lead created successfully:', {
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      tenantId: lead.tenantId
    })
    
    revalidatePath('/leads')

    return {
      success: true,
      data: lead
    }
  } catch (error) {
    console.error('❌ Error creating lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear el prospecto'
    }
  }
}

/**
 * List leads with filtering and pagination
 */
export async function listLeads(input: LeadsListInput = {}) {
  try {
    console.log('📋 Listing leads with params:', input)
    
    const validatedInput = leadsListSchema.parse(input)
    const user = await getUserWithTenant()

    // Build where clause
    const whereClause: any = {
      tenantId: user.tenantId!,
    }

    if (validatedInput.status) {
      whereClause.status = validatedInput.status
    }

    if (validatedInput.source) {
      whereClause.source = validatedInput.source
    }

    if (validatedInput.search) {
      whereClause.OR = [
        { firstName: { contains: validatedInput.search, mode: 'insensitive' } },
        { lastName: { contains: validatedInput.search, mode: 'insensitive' } },
        { email: { contains: validatedInput.search, mode: 'insensitive' } },
        { company: { contains: validatedInput.search, mode: 'insensitive' } },
      ]
    }

    console.log('🔍 Query where clause:', JSON.stringify(whereClause, null, 2))

    // Get total count
    const total = await db.lead.count({ where: whereClause })
    console.log('📊 Total leads count:', total)
    
    // Get leads with pagination
    const leads = await db.lead.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (validatedInput.page - 1) * validatedInput.limit,
      take: validatedInput.limit,
    })

    console.log(`✅ Found ${leads.length} leads out of ${total} total for tenant ${user.tenantId}`)
    console.log('📄 Leads preview:', leads.map(l => ({ id: l.id, name: `${l.firstName} ${l.lastName}`, email: l.email, company: l.company })))

    return {
      success: true,
      data: {
        leads,
        pagination: {
          page: validatedInput.page,
          limit: validatedInput.limit,
          total,
          totalPages: Math.ceil(total / validatedInput.limit)
        }
      }
    }
  } catch (error) {
    console.error('❌ Error listing leads:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cargar los prospectos'
    }
  }
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: string) {
  try {
    console.log('Getting lead:', id)
    
    const user = await getUserWithTenant()

    const lead = await db.lead.findUnique({
      where: { 
        id,
        tenantId: user.tenantId!,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Limit to recent activities
        }
      }
    })

    if (!lead) {
      return {
        success: false,
        error: 'Prospecto no encontrado'
      }
    }

    console.log('Lead found:', lead.id)

    return {
      success: true,
      data: lead
    }
  } catch (error) {
    console.error('Error getting lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener el prospecto'
    }
  }
}

/**
 * Update a lead
 */
export async function updateLead(id: string, input: UpdateLeadInput) {
  try {
    console.log('Updating lead:', id, input)
    
    const validatedInput = updateLeadSchema.parse(input)
    const user = await getUserWithTenant()

    // Check if lead exists and belongs to user's tenant
    const existingLead = await db.lead.findUnique({
      where: { 
        id,
        tenantId: user.tenantId!,
      }
    })

    if (!existingLead) {
      return {
        success: false,
        error: 'Prospecto no encontrado'
      }
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        ...validatedInput,
        budget: validatedInput.budget ? validatedInput.budget : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    console.log('Lead updated successfully:', updatedLead.id)
    revalidatePath('/leads')

    return {
      success: true,
      data: updatedLead
    }
  } catch (error) {
    console.error('Error updating lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el prospecto'
    }
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string) {
  try {
    console.log('Deleting lead:', id)
    
    const user = await getUserWithTenant()

    // Check if lead exists and belongs to user's tenant
    const existingLead = await db.lead.findUnique({
      where: { 
        id,
        tenantId: user.tenantId!,
      }
    })

    if (!existingLead) {
      return {
        success: false,
        error: 'Prospecto no encontrado'
      }
    }

    await db.lead.delete({
      where: { id }
    })

    console.log('Lead deleted successfully:', id)
    revalidatePath('/leads')

    return {
      success: true,
      message: 'Prospecto eliminado exitosamente'
    }
  } catch (error) {
    console.error('Error deleting lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar el prospecto'
    }
  }
}
'use server'

import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { 
  createLeadSchema, 
  updateLeadSchema, 
  leadsListSchema,
  type CreateLeadInput,
  type UpdateLeadInput,
  type LeadsListInput
} from '@/lib/validations/leads'

// Helper function to get user with tenant info  
// For Super Admins, they can optionally pass a tenantId to operate on a specific cowork
async function getUserWithTenant(targetTenantId?: string) {
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

  // Super Admins don't have a tenantId, which is expected
  if (!dbUser.tenantId && dbUser.role !== 'SUPER_ADMIN') {
    throw new Error(`Usuario no tiene un tenant asignado. User ID: ${dbUser.id}, Email: ${dbUser.email}`)
  }

  // For Super Admins, use the targetTenantId if provided, otherwise return empty results
  if (dbUser.role === 'SUPER_ADMIN') {
    if (targetTenantId) {
      return { ...dbUser, tenantId: targetTenantId, effectiveTenantId: targetTenantId }
    } else {
      // Return a special flag to indicate Super Admin with no cowork selected
      return { ...dbUser, effectiveTenantId: null, noCoworkSelected: true }
    }
  }

  return { ...dbUser, effectiveTenantId: dbUser.tenantId }
}

/**
 * Create a new lead
 */
export async function createLead(input: CreateLeadInput, targetTenantId?: string) {
  try {
    console.log('💾 Creating lead:', input)
    
    const validatedInput = createLeadSchema.parse(input)
    const user = await getUserWithTenant(targetTenantId)

    // If Super Admin hasn't selected a cowork, they can't create leads
    if ((user as any).noCoworkSelected) {
      return {
        success: false,
        error: 'Debe seleccionar un cowork para crear prospectos'
      }
    }

    console.log('👤 Creating lead for user:', {
      userId: user.id,
      tenantId: user.effectiveTenantId,
      userEmail: user.email
    })

    const lead = await db.lead.create({
      data: {
        ...validatedInput,
        tenantId: user.effectiveTenantId!,
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
export async function listLeads(input: LeadsListInput = {}, targetTenantId?: string) {
  try {
    console.log('📋 Listing leads with params:', input)
    
    const validatedInput = leadsListSchema.parse(input)
    const user = await getUserWithTenant(targetTenantId)

    // If Super Admin hasn't selected a cowork, return empty results
    if ((user as any).noCoworkSelected) {
      return {
        success: true,
        data: {
          leads: [],
          pagination: {
            page: validatedInput.page,
            limit: validatedInput.limit,
            total: 0,
            totalPages: 0
          }
        }
      }
    }

    // Build where clause
    const whereClause: any = {
      tenantId: user.effectiveTenantId!,
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

    console.log(`✅ Found ${leads.length} leads out of ${total} total for tenant ${user.effectiveTenantId}`)
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
export async function getLead(id: string, targetTenantId?: string) {
  try {
    console.log('Getting lead:', id)
    
    const user = await getUserWithTenant(targetTenantId)

    const lead = await db.lead.findUnique({
      where: { 
        id,
        tenantId: user.effectiveTenantId!,
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
export async function updateLead(id: string, input: UpdateLeadInput, targetTenantId?: string) {
  try {
    console.log('Updating lead:', id, input)
    
    const validatedInput = updateLeadSchema.parse(input)
    const user = await getUserWithTenant(targetTenantId)

    // Check if lead exists and belongs to user's tenant
    const existingLead = await db.lead.findUnique({
      where: { 
        id,
        tenantId: user.effectiveTenantId!,
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
export async function deleteLead(id: string, targetTenantId?: string) {
  try {
    console.log('Deleting lead:', id)
    
    const user = await getUserWithTenant(targetTenantId)

    // Check if lead exists and belongs to user's tenant
    const existingLead = await db.lead.findUnique({
      where: { 
        id,
        tenantId: user.effectiveTenantId!,
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
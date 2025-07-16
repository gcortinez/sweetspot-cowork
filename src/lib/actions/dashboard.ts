'use server'

import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

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

// Get dashboard stats for cowork dashboard
export async function getDashboardStats() {
  try {
    const user = await getUserWithTenant()
    
    if (!user.tenantId) {
      return {
        success: false,
        error: 'Usuario sin tenant asignado'
      }
    }

    // Get current date for filtering
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Initialize all stats with default values
    let opportunitiesStats = { _count: { id: 0 }, _sum: { value: null, expectedRevenue: null } }
    let activeOpportunities = 0
    let monthlyOpportunities = 0
    let clientsStats = { _count: { id: 0 } }
    let activeClients = 0
    let prospectClients = 0
    let leadsStats = { _count: { id: 0 } }
    let newLeads = 0
    let qualifiedLeads = 0
    let convertedLeads = 0
    let recentOpportunities: any[] = []
    let recentClients: any[] = []
    let recentLeads: any[] = []

    // Try to get opportunities data
    try {
      opportunitiesStats = await db.opportunity.aggregate({
        where: { tenantId: user.tenantId },
        _count: { id: true },
        _sum: { 
          value: true,
          expectedRevenue: true 
        }
      })

      activeOpportunities = await db.opportunity.count({
        where: { 
          tenantId: user.tenantId,
          stage: {
            notIn: ['CLOSED_WON', 'CLOSED_LOST']
          }
        }
      })

      monthlyOpportunities = await db.opportunity.count({
        where: { 
          tenantId: user.tenantId,
          createdAt: {
            gte: startOfMonth
          }
        }
      })

      recentOpportunities = await db.opportunity.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          client: { select: { name: true } }
        }
      })
    } catch (error) {
      console.error('Error loading opportunities:', error)
    }

    // Try to get clients data
    try {
      clientsStats = await db.client.aggregate({
        where: { tenantId: user.tenantId },
        _count: { id: true }
      })

      activeClients = await db.client.count({
        where: { 
          tenantId: user.tenantId,
          status: 'ACTIVE'
        }
      })

      prospectClients = await db.client.count({
        where: { 
          tenantId: user.tenantId,
          status: 'PROSPECT'
        }
      })

      recentClients = await db.client.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          _count: { select: { opportunities: true } }
        }
      })
    } catch (error) {
      console.error('Error loading clients:', error)
    }

    // Try to get leads data
    try {
      leadsStats = await db.lead.aggregate({
        where: { tenantId: user.tenantId },
        _count: { id: true }
      })

      newLeads = await db.lead.count({
        where: { 
          tenantId: user.tenantId,
          status: 'NEW'
        }
      })

      qualifiedLeads = await db.lead.count({
        where: { 
          tenantId: user.tenantId,
          status: 'QUALIFIED'
        }
      })

      convertedLeads = await db.lead.count({
        where: { 
          tenantId: user.tenantId,
          status: 'CONVERTED'
        }
      })

      recentLeads = await db.lead.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
    } catch (error) {
      console.error('Error loading leads:', error)
    }

    return {
      success: true,
      data: {
        opportunities: {
          stats: {
            total: opportunitiesStats._count.id || 0,
            active: activeOpportunities,
            thisMonth: monthlyOpportunities,
            pipelineValue: Number(opportunitiesStats._sum.value || 0)
          },
          recent: recentOpportunities.map(opp => ({
            id: opp.id,
            title: opp.title,
            value: Number(opp.value),
            probability: opp.probability,
            stage: opp.stage,
            client: opp.client?.name || 'Sin cliente',
            expectedCloseDate: opp.expectedCloseDate?.toISOString() || null
          }))
        },
        clients: {
          stats: {
            total: clientsStats._count.id || 0,
            active: activeClients,
            prospects: prospectClients,
            inactive: Math.max(0, (clientsStats._count.id || 0) - activeClients - prospectClients),
            conversionRate: activeClients > 0 ? Math.round((activeClients / (clientsStats._count.id || 1)) * 100) : 0
          },
          recent: recentClients.map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            contactPerson: client.contactPerson,
            status: client.status,
            createdAt: client.createdAt.toISOString(),
            opportunitiesCount: client._count?.opportunities || 0
          }))
        },
        leads: {
          stats: {
            total: leadsStats._count.id || 0,
            new: newLeads,
            qualified: qualifiedLeads,
            converted: convertedLeads
          },
          recent: recentLeads.map(lead => ({
            id: lead.id,
            name: `${lead.firstName} ${lead.lastName}`,
            email: lead.email,
            company: lead.company,
            status: lead.status,
            score: lead.score || 0,
            source: lead.source,
            createdAt: lead.createdAt.toISOString()
          }))
        },
        recentBookings: [],
        activities: []
      }
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      success: false,
      error: 'Error al obtener estadísticas del dashboard'
    }
  }
}

// Get recent activities for dashboard
export async function getRecentActivities() {
  try {
    const user = await getUserWithTenant()
    
    if (!user.tenantId) {
      return {
        success: false,
        error: 'Usuario sin tenant asignado'
      }
    }

    // For now, return some sample activities
    // In the future, this could be from an activities/audit log table
    const activities = [
      {
        id: 1,
        type: 'opportunity',
        text: 'Nueva oportunidad creada',
        time: 'Hace 5 min'
      },
      {
        id: 2,
        type: 'client',
        text: 'Cliente actualizado',
        time: 'Hace 1 hora'
      },
      {
        id: 3,
        type: 'lead',
        text: 'Nuevo prospecto registrado',
        time: 'Hace 2 horas'
      }
    ]

    return {
      success: true,
      data: activities
    }
  } catch (error) {
    console.error('Error getting recent activities:', error)
    return {
      success: false,
      error: 'Error al obtener actividades recientes'
    }
  }
}
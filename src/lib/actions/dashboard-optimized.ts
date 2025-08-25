'use server'

import { currentUser } from '@clerk/nextjs/server'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

// Cache the user lookup per request (deduplicates within same render)
const getUserWithTenant = cache(async () => {
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
})

// Internal function to get dashboard data (cached)
const getCachedDashboardData = unstable_cache(
  async (tenantId: string) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Parallelize all database queries for better performance
    const [
      opportunitiesStats,
      activeOpportunities,
      monthlyOpportunities,
      recentOpportunities,
      clientsStats,
      activeClients,
      prospectClients,
      recentClients,
      leadsStats,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      recentLeads
    ] = await Promise.all([
      // Opportunities queries
      db.opportunity.aggregate({
        where: { tenantId },
        _count: { id: true },
        _sum: { value: true, expectedRevenue: true }
      }),
      db.opportunity.count({
        where: { 
          tenantId,
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }
        }
      }),
      db.opportunity.count({
        where: { 
          tenantId,
          createdAt: { gte: startOfMonth }
        }
      }),
      db.opportunity.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          value: true,
          probability: true,
          stage: true,
          expectedCloseDate: true,
          createdAt: true,
          client: { 
            select: { 
              id: true,
              name: true, 
              email: true
            } 
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      
      // Clients queries
      db.client.aggregate({
        where: { tenantId },
        _count: { id: true }
      }),
      db.client.count({
        where: { tenantId, status: 'ACTIVE' }
      }),
      db.client.count({
        where: { tenantId, status: 'PROSPECT' }
      }),
      db.client.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          contactPerson: true,
          status: true,
          createdAt: true,
          _count: { select: { opportunities: true } }
        }
      }),
      
      // Leads queries
      db.lead.aggregate({
        where: { tenantId },
        _count: { id: true }
      }),
      db.lead.count({
        where: { tenantId, status: 'NEW' }
      }),
      db.lead.count({
        where: { tenantId, status: 'QUALIFIED' }
      }),
      db.lead.count({
        where: { tenantId, status: 'CONVERTED' }
      }),
      db.lead.findMany({
        where: { 
          tenantId,
          status: { not: 'CONVERTED' }
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          score: true,
          createdAt: true
        }
      })
    ])

    return {
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
          client: opp.client,
          lead: opp.lead,
          expectedCloseDate: opp.expectedCloseDate?.toISOString() || null,
          createdAt: opp.createdAt?.toISOString() || null
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
          phone: client.phone,
          contactPerson: client.contactPerson,
          status: client.status,
          opportunitiesCount: client._count.opportunities,
          createdAt: client.createdAt?.toISOString() || null
        }))
      },
      leads: {
        stats: {
          total: leadsStats._count.id || 0,
          new: newLeads,
          qualified: qualifiedLeads,
          converted: convertedLeads,
          contacted: Math.max(0, (leadsStats._count.id || 0) - newLeads - qualifiedLeads - convertedLeads)
        },
        recent: recentLeads.map(lead => ({
          id: lead.id,
          name: `${lead.firstName} ${lead.lastName}`.trim() || 'Sin nombre',
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: lead.status,
          score: lead.score || 0,
          createdAt: lead.createdAt?.toISOString() || null
        }))
      }
    }
  },
  ['dashboard-stats'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['dashboard', 'stats']
  }
)

// Optimized dashboard stats function
export async function getDashboardStats() {
  try {
    const user = await getUserWithTenant()
    
    if (!user.tenantId) {
      return {
        success: false,
        error: 'Usuario sin tenant asignado'
      }
    }

    const data = await getCachedDashboardData(user.tenantId)
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cargar estadísticas'
    }
  }
}

// Get recent activities (cached separately for faster updates)
const getCachedRecentActivities = unstable_cache(
  async (tenantId: string) => {
    const activities = await db.activity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        createdAt: true,
        leadId: true,
        opportunityId: true,
        userId: true,
        lead: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        opportunity: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.subject,
      description: activity.description,
      createdAt: activity.createdAt?.toISOString() || null,
      leadName: activity.lead ? `${activity.lead.firstName} ${activity.lead.lastName}`.trim() : null,
      opportunityTitle: activity.opportunity?.title || null,
      userName: activity.user ? `${activity.user.firstName} ${activity.user.lastName}`.trim() : null
    }))
  },
  ['recent-activities'],
  {
    revalidate: 30, // Cache for 30 seconds (more frequent updates)
    tags: ['activities']
  }
)

export async function getRecentActivities() {
  try {
    const user = await getUserWithTenant()
    
    if (!user.tenantId) {
      return {
        success: false,
        error: 'Usuario sin tenant asignado'
      }
    }

    const activities = await getCachedRecentActivities(user.tenantId)
    
    return {
      success: true,
      data: activities
    }
  } catch (error) {
    console.error('Error loading recent activities:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cargar actividades recientes'
    }
  }
}

// Function to invalidate dashboard cache (call after mutations)
export async function invalidateDashboardCache() {
  const { revalidateTag } = await import('next/cache')
  revalidateTag('dashboard')
  revalidateTag('stats')
  revalidateTag('activities')
}
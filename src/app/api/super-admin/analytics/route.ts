import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireRole } from '@/lib/server/auth'
import { UserRole } from '@/types/enums'
import prisma from '@/lib/server/prisma'

/**
 * Super Admin Analytics API
 * Provides global SaaS metrics for SUPER_ADMIN users
 */

export async function GET(request: NextRequest) {
  try {
    // Get current user and verify super admin role
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    await requireRole(user, UserRole.SUPER_ADMIN)

    // Fetch global SaaS metrics
    const [
      totalCoworks,
      totalUsers, 
      totalSpaces,
      totalClients,
      recentBookings,
      coworkPerformance,
      recentActivities
    ] = await Promise.all([
      // Total active coworks
      prisma.tenant.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total active users across all coworks
      prisma.user.count({
        where: { 
          status: 'ACTIVE',
          role: { not: 'SUPER_ADMIN' } // Exclude super admins from count
        }
      }),
      
      // Total spaces across all coworks
      prisma.space.count(),
      
      // Total clients across all coworks
      prisma.client.count(),
      
      // Recent bookings across all coworks (last 10)
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          space: { select: { name: true } },
          client: { select: { name: true } },
          tenant: { select: { name: true, slug: true } }
        }
      }),
      
      // Cowork performance metrics
      prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              users: { where: { status: 'ACTIVE' } },
              spaces: true,
              clients: true,
              bookings: {
                where: {
                  createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              }
            }
          }
        }
      }),
      
      // Recent activities across all coworks (simplified)
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          tenant: { select: { name: true } }
        }
      })
    ])

    // Calculate platform revenue (this would typically come from your billing system)
    // For now, we'll use a placeholder calculation based on bookings
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const monthlyBookingsCount = await prisma.booking.count({
      where: {
        createdAt: { gte: currentMonth },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    })
    
    // Placeholder revenue calculation (you'd replace this with actual billing data)
    const platformRevenue = monthlyBookingsCount * 50 // Assuming $50 average per booking

    // Format the response
    const metrics = {
      // Global metrics
      totalCoworks,
      totalUsers,
      totalSpaces: totalSpaces,
      platformRevenue,
      
      // Dashboard metrics (standard format)
      todayBookings: {
        count: monthlyBookingsCount,
        trend: 5.2 // Placeholder trend
      },
      activeMembers: {
        count: totalUsers,
        trend: 12.5 // Placeholder trend
      },
      spaceOccupancy: {
        occupied: Math.floor(totalSpaces * 0.75), // 75% occupancy placeholder
        total: totalSpaces,
        percentage: 75
      },
      monthlyRevenue: {
        amount: platformRevenue,
        trend: 8.3 // Placeholder trend
      },
      
      // Recent bookings
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        spaceName: booking.space?.name || 'Unknown Space',
        clientName: booking.client?.name || 'Unknown Client',
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        coworkName: booking.tenant?.name || 'Unknown Cowork'
      })),
      
      // Cowork performance
      coworkPerformance: coworkPerformance.map(cowork => ({
        id: cowork.id,
        name: cowork.name,
        slug: cowork.slug,
        activeMembers: cowork._count.users,
        totalSpaces: cowork._count.spaces,
        totalClients: cowork._count.clients,
        monthlyBookings: cowork._count.bookings,
        revenue: cowork._count.bookings * 50, // Placeholder calculation
        occupancy: cowork._count.spaces > 0 ? Math.floor((cowork._count.bookings / cowork._count.spaces) * 100) : 0
      })),
      
      // Recent activities
      recentActivities: recentActivities.map(booking => ({
        id: booking.id,
        type: 'booking' as const,
        title: `Nueva reserva en ${booking.tenant?.name}`,
        description: `${booking.client?.name} reservó un espacio`,
        timestamp: booking.createdAt.toISOString()
      })),
      
      // System alerts (placeholder)
      alerts: [
        {
          id: 'system-1',
          type: 'info' as const,
          title: 'Sistema funcionando correctamente',
          message: 'Todos los coworks están operando normalmente',
          timestamp: new Date().toISOString()
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('Super Admin Analytics error:', error)
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
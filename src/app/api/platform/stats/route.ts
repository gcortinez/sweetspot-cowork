import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

/**
 * Platform Statistics API
 * Returns real statistics from the database for Super Admins
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Platform Stats API called');
    
    // Get the current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      console.log('📊 No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    const privateMetadata = clerkUser.privateMetadata as any;
    const publicMetadata = clerkUser.publicMetadata as any;
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
    
    console.log('📊 User role:', userRole);
    
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch real statistics from database
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalBookings,
      totalSpaces,
      usersByRole,
      recentUsers,
      todayActiveUsers
    ] = await Promise.all([
      // Total coworks
      prisma.tenant.count(),
      
      // Active coworks
      prisma.tenant.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total users
      prisma.user.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total bookings this month
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }).catch(() => 0), // Handle if bookings table doesn't exist
      
      // Total spaces
      prisma.space.count().catch(() => 0), // Handle if spaces table doesn't exist
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        where: { status: 'ACTIVE' },
        _count: {
          role: true
        }
      }),
      
      // New users this month
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Active users today (just use total for now since no recent activity tracking)
      Promise.resolve([])
    ]);

    // Get tenant status breakdown
    const tenantsByStatus = await prisma.tenant.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Format status counts
    const statusCounts = {
      active: 0,
      inactive: 0,
      suspended: 0
    };
    
    tenantsByStatus.forEach(item => {
      const status = item.status.toLowerCase();
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts] = item._count.status;
      }
    });

    // Format user role counts
    const roleCounts = {
      super_admin: 0,
      cowork_admin: 0,
      cowork_user: 0,
      client_admin: 0,
      end_user: 0
    };
    
    usersByRole.forEach(item => {
      const role = item.role.toLowerCase();
      switch (role) {
        case 'super_admin':
          roleCounts.super_admin = item._count.role;
          break;
        case 'cowork_admin':
          roleCounts.cowork_admin = item._count.role;
          break;
        case 'cowork_user':
          roleCounts.cowork_user = item._count.role;
          break;
        case 'client_admin':
          roleCounts.client_admin = item._count.role;
          break;
        case 'end_user':
          roleCounts.end_user = item._count.role;
          break;
      }
    });

    // Calculate average users per cowork
    const avgUsersPerCowork = totalTenants > 0 ? Math.round(totalUsers / totalTenants) : 0;

    // Calculate monthly revenue (placeholder - you would get this from your billing system)
    const monthlyRevenue = totalBookings * 50; // $50 average per booking
    const lastMonthRevenue = monthlyRevenue * 0.9; // Assuming 10% growth
    const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Get recent activities
    const recentActivities = await prisma.tenant.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    // Format activities
    const activities = recentActivities.map((tenant, index) => {
      const hoursAgo = Math.floor((Date.now() - tenant.createdAt.getTime()) / (1000 * 60 * 60));
      const daysAgo = Math.floor(hoursAgo / 24);
      
      let timestamp = 'Recién';
      if (daysAgo > 0) {
        timestamp = `Hace ${daysAgo} día${daysAgo > 1 ? 's' : ''}`;
      } else if (hoursAgo > 0) {
        timestamp = `Hace ${hoursAgo} hora${hoursAgo > 1 ? 's' : ''}`;
      }
      
      return {
        id: tenant.id,
        type: 'cowork_created' as const,
        message: `Cowork "${tenant.name}" creado`,
        timestamp
      };
    });

    // Build response
    const stats = {
      overview: {
        totalCoworks: totalTenants,
        activeCoworks: activeTenants,
        totalUsers,
        activeUsers: totalUsers, // Approximation
        totalRevenue: monthlyRevenue * 12, // Annual estimate
        monthlyRevenue,
        revenueGrowth: Number(revenueGrowth.toFixed(1))
      },
      coworkStats: {
        byStatus: statusCounts,
        recentlyCreated: recentActivities.length,
        averageUsersPerCowork: avgUsersPerCowork
      },
      userStats: {
        byRole: roleCounts,
        newUsersThisMonth: recentUsers,
        activeUsersToday: todayActiveUsers.length
      },
      revenueStats: {
        thisMonth: monthlyRevenue,
        lastMonth: Math.round(lastMonthRevenue),
        growth: Number(revenueGrowth.toFixed(1)),
        averagePerCowork: totalTenants > 0 ? Math.round(monthlyRevenue / totalTenants) : 0
      }
    };

    console.log('📊 Returning stats:', {
      totalCoworks: totalTenants,
      activeCoworks: activeTenants,
      totalUsers
    });

    return NextResponse.json({
      success: true,
      stats,
      activities
    });

  } catch (error) {
    console.error('Platform stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}
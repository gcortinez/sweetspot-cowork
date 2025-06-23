import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

interface DashboardMetrics {
  todayBookings: {
    count: number;
    trend: number;
  };
  activeMembers: {
    count: number;
    trend: number;
  };
  spaceOccupancy: {
    occupied: number;
    total: number;
    percentage: number;
  };
  monthlyRevenue: {
    amount: number;
    trend: number;
  };
  recentBookings: Array<{
    id: string;
    spaceName: string;
    clientName: string;
    startTime: Date;
    endTime: Date;
    status: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: 'booking' | 'payment' | 'member' | 'space' | 'system';
    title: string;
    description: string;
    timestamp: Date;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: Date;
  }>;
}

interface SuperAdminMetrics extends DashboardMetrics {
  totalCoworks: number;
  totalUsers: number;
  totalSpaces: number;
  platformRevenue: number;
  coworkPerformance: Array<{
    id: string;
    name: string;
    activeMembers: number;
    revenue: number;
    occupancy: number;
  }>;
}

class DashboardService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getCoworkDashboard(req: Request & { tenantId?: string; activeCowork?: any }): Promise<DashboardMetrics> {
    const tenantId = req.tenantId;
    const coworkId = req.activeCowork?.id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Today's bookings
    const todayBookingsCount = await this.prisma.booking.count({
      where: {
        tenantId,
        ...(coworkId && { space: { tenantId: coworkId } }),
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const yesterdayBookingsCount = await this.prisma.booking.count({
      where: {
        tenantId,
        ...(coworkId && { space: { tenantId: coworkId } }),
        startTime: {
          gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000),
          lt: startOfDay,
        },
      },
    });

    const bookingTrend = yesterdayBookingsCount > 0 
      ? ((todayBookingsCount - yesterdayBookingsCount) / yesterdayBookingsCount) * 100 
      : 0;

    // Active members
    const activeMembersCount = await this.prisma.membership.count({
      where: {
        tenantId,
        ...(coworkId && { tenantId: coworkId }),
        status: 'ACTIVE',
      },
    });

    const lastMonthMembersCount = await this.prisma.membership.count({
      where: {
        tenantId,
        ...(coworkId && { tenantId: coworkId }),
        status: 'ACTIVE',
        createdAt: {
          gte: lastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const membersTrend = lastMonthMembersCount > 0 
      ? ((activeMembersCount - lastMonthMembersCount) / lastMonthMembersCount) * 100 
      : 0;

    // Space occupancy
    const totalSpaces = await this.prisma.space.count({
      where: {
        tenantId,
        ...(coworkId && { tenantId: coworkId }),
      },
    });

    const occupiedSpaces = await this.prisma.booking.count({
      where: {
        tenantId,
        ...(coworkId && { spaceId: coworkId }),
        startTime: { lte: new Date() },
        endTime: { gte: new Date() },
        status: 'CONFIRMED',
      },
    });

    const occupancyPercentage = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;

    // Monthly revenue
    const currentMonthRevenue = await this.prisma.payment.aggregate({
      where: {
        tenantId,
        ...(coworkId && { invoice: { tenantId: coworkId } }),
        createdAt: {
          gte: startOfMonth,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const lastMonthRevenue = await this.prisma.payment.aggregate({
      where: {
        tenantId,
        ...(coworkId && { invoice: { tenantId: coworkId } }),
        createdAt: {
          gte: lastMonth,
          lte: endOfLastMonth,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });

    const currentRevenue = currentMonthRevenue._sum.amount?.toNumber() || 0;
    const lastRevenue = lastMonthRevenue._sum.amount?.toNumber() || 0;
    const revenueTrend = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    // Recent bookings
    const recentBookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        ...(coworkId && { spaceId: coworkId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Recent activities (simplified for now)
    const recentActivities = [
      {
        id: '1',
        type: 'booking' as const,
        title: 'Nueva reserva creada',
        description: 'Sala de juntas reservada para esta tarde',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'payment' as const,
        title: 'Pago recibido',
        description: 'Membresía mensual procesada',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ];

    // Alerts (simplified for now)
    const alerts = [
      {
        id: '1',
        type: 'warning' as const,
        title: 'Mantenimiento programado',
        message: 'Mantenimiento del sistema el próximo domingo',
        timestamp: new Date(),
      },
    ];

    return {
      todayBookings: {
        count: todayBookingsCount,
        trend: Math.round(bookingTrend * 100) / 100,
      },
      activeMembers: {
        count: activeMembersCount,
        trend: Math.round(membersTrend * 100) / 100,
      },
      spaceOccupancy: {
        occupied: occupiedSpaces,
        total: totalSpaces,
        percentage: Math.round(occupancyPercentage * 100) / 100,
      },
      monthlyRevenue: {
        amount: currentRevenue,
        trend: Math.round(revenueTrend * 100) / 100,
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        spaceName: booking.title || `Espacio ${booking.spaceId}`,
        clientName: booking.user?.email || 'Usuario',
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      })),
      recentActivities,
      alerts,
    };
  }

  async getSuperAdminDashboard(): Promise<SuperAdminMetrics> {
    // Get platform-wide metrics
    const totalCoworks = await this.prisma.tenant.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const totalUsers = await this.prisma.user.count();

    const totalSpaces = await this.prisma.space.count();

    const platformRevenueResult = await this.prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const platformRevenue = platformRevenueResult._sum.amount?.toNumber() || 0;

    // Get cowork performance
    const coworks = await this.prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            Membership: {
              where: {
                status: 'ACTIVE',
              },
            },
            spaces: true,
          },
        },
      },
      take: 10,
    });

    const coworkPerformance = await Promise.all(
      coworks.map(async (cowork) => {
        const revenue = await this.prisma.payment.aggregate({
          where: {
            tenantId: cowork.id,
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          _sum: {
            amount: true,
          },
        });

        const occupiedSpaces = await this.prisma.booking.count({
          where: {
            tenantId: cowork.id,
            startTime: { lte: new Date() },
            endTime: { gte: new Date() },
            status: 'CONFIRMED',
          },
        });

        const occupancy = cowork._count.spaces > 0 
          ? (occupiedSpaces / cowork._count.spaces) * 100 
          : 0;

        return {
          id: cowork.id,
          name: cowork.name,
          activeMembers: cowork._count.Membership,
          revenue: revenue._sum.amount?.toNumber() || 0,
          occupancy: Math.round(occupancy * 100) / 100,
        };
      })
    );

    // Base metrics for super admin view (platform-wide)
    const baseMetrics = await this.getCoworkDashboard({} as any);

    return {
      ...baseMetrics,
      totalCoworks,
      totalUsers,
      totalSpaces,
      platformRevenue,
      coworkPerformance,
    };
  }
}

export default DashboardService;
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import DashboardService from '../services/dashboardService';

const prisma = new PrismaClient();
const dashboardService = new DashboardService(prisma);

interface AuthenticatedRequest extends Request {
  user?: any;
  tenantId?: string;
  activeCowork?: any;
  isSuperAdmin?: boolean;
}

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { user, isSuperAdmin } = req;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    let metrics;

    if (isSuperAdmin && user.role === 'SUPER_ADMIN') {
      // Super Admin gets platform-wide metrics
      metrics = await dashboardService.getSuperAdminDashboard();
    } else {
      // Regular users get cowork-specific metrics
      metrics = await dashboardService.getCoworkDashboard(req);
    }

    res.json({
      success: true,
      data: metrics
    });

  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard metrics'
    });
  }
};

export const getCoworkOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { coworkId } = req.params;
    const { user, isSuperAdmin } = req;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Only super admins can view any cowork overview
    if (!isSuperAdmin && user.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    const cowork = await prisma.tenant.findUnique({
      where: { id: coworkId },
      include: {
        _count: {
          select: {
            users: true,
            spaces: true,
            Membership: {
              where: { status: 'ACTIVE' }
            },
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
    });

    if (!cowork) {
      res.status(404).json({
        success: false,
        error: 'Cowork not found'
      });
      return;
    }

    // Get revenue for the cowork
    const revenue = await prisma.payment.aggregate({
      where: {
        tenantId: coworkId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get occupancy rate
    const occupiedSpaces = await prisma.booking.count({
      where: {
        tenantId: coworkId,
        startTime: { lte: new Date() },
        endTime: { gte: new Date() },
        status: 'CONFIRMED'
      }
    });

    const occupancyRate = cowork._count.spaces > 0 
      ? (occupiedSpaces / cowork._count.spaces) * 100 
      : 0;

    const overview = {
      id: cowork.id,
      name: cowork.name,
      status: cowork.status,
      totalUsers: cowork._count.users,
      totalSpaces: cowork._count.spaces,
      activeMembers: cowork._count.Membership,
      monthlyBookings: cowork._count.bookings,
      monthlyRevenue: revenue._sum.amount?.toNumber() || 0,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      createdAt: cowork.createdAt,
      updatedAt: cowork.updatedAt
    };

    res.json({
      success: true,
      data: overview
    });

  } catch (error: any) {
    console.error('Cowork overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cowork overview'
    });
  }
};
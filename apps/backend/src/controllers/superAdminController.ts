import { Response } from 'express';
import { z } from 'zod';
import { handleController } from '../utils/response';
import { AuthenticatedRequest } from '../types/api';
import { TenantService } from '../services/tenantService';
import { UserService } from '../services/userService';
// import { SuperAdminBillingService } from '../services/superAdminBillingService';
// import { SuperAdminAuditService, SUPER_ADMIN_ACTIONS } from '../services/superAdminAuditService';

/**
 * Super Admin Controller
 * Handles all super admin operations for cross-tenant management
 * Only accessible by users with SUPER_ADMIN role
 */

// Validation schemas for Super Admin operations
const createCoworkSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  logo: z.string().url().optional(), 
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
  adminUser: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    phone: z.string().optional(),
  }),
});

const updateCoworkSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
});

const queryCoworksSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const queryUsersSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('50'),
  role: z.enum(['SUPER_ADMIN', 'COWORK_ADMIN', 'CLIENT_ADMIN', 'END_USER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  search: z.string().optional(),
});

const coworkActionSchema = z.object({
  reason: z.string().min(10).max(500).optional(),
  notifyUsers: z.boolean().optional().default(false),
});

class SuperAdminController {
  /**
   * Middleware to verify Super Admin access
   * This should be called before any super admin operation
   */
  private verifySuperAdmin(req: AuthenticatedRequest): void {
    console.log('=== SUPER ADMIN ACCESS VERIFICATION ===');
    console.log('User attempting access:', {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      tenantId: req.user?.tenantId,
    });

    if (!req.user) {
      throw new Error('Authentication required');
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      console.log('❌ Access denied - User is not SUPER_ADMIN');
      throw new Error('Super Admin access required');
    }

    console.log('✅ Super Admin access verified');
  }

  /**
   * GET /api/super-admin/coworks
   * List all coworks in the system with filtering and pagination
   */
  getCoworks = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      // Log audit trail - temporarily disabled for testing
      console.log('Audit logging disabled for testing');

      const query = queryCoworksSchema.parse(req.query);
      console.log('Getting coworks with params:', query);

      // Import prisma here to avoid circular dependencies
      const { prisma } = await import('../lib/prisma');

      // Build where clause for filtering
      const where: any = {};
      
      if (query.status) {
        where.status = query.status;
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[query.sortBy] = query.sortOrder;

      // Calculate pagination
      const skip = (query.page - 1) * query.limit;

      // Get tenants with pagination
      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          orderBy,
          skip,
          take: query.limit,
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            logo: true,
            _count: {
              select: {
                users: true,
                clients: true
              }
            }
          }
        }),
        prisma.tenant.count({ where })
      ]);

      const result = {
        tenants: tenants.map(tenant => ({
          ...tenant,
          userCount: tenant._count.users,
          clientCount: tenant._count.clients
        })),
        total,
        page: query.page,
        limit: query.limit,
      };

      console.log(`Found ${result.tenants.length} coworks out of ${result.total} total`);

      return {
        coworks: result.tenants,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      };
    }, res);
  };

  /**
   * GET /api/super-admin/coworks/:id
   * Get detailed information about a specific cowork
   */
  getCoworkById = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      console.log(`Getting cowork details for ID: ${id}`);

      // Import prisma here to avoid circular dependencies
      const { prisma } = await import('../lib/prisma');

      // Get detailed cowork information
      const cowork = await prisma.tenant.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          description: true,
          logo: true,
          domain: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              clients: true,
              spaces: true,
              bookings: true,
              leads: true,
              opportunities: true,
              invoices: true
            }
          }
        }
      });

      if (!cowork) {
        throw new Error('Cowork not found');
      }

      // Get recent activity stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        recentUsers,
        recentClients,
        recentBookings,
        recentLeads,
        monthlyRevenue,
        topUsers,
        recentInvoices
      ] = await Promise.all([
        // Recent users (last 30 days)
        prisma.user.count({
          where: {
            tenantId: id,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        
        // Recent clients (last 30 days)
        prisma.client.count({
          where: {
            tenantId: id,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        
        // Recent bookings (last 30 days)
        prisma.booking.count({
          where: {
            tenantId: id,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        
        // Recent leads (last 30 days)
        prisma.lead.count({
          where: {
            tenantId: id,
            createdAt: { gte: thirtyDaysAgo }
          }
        }),
        
        // Monthly revenue from paid invoices
        prisma.invoice.aggregate({
          where: {
            tenantId: id,
            status: 'PAID',
            createdAt: { gte: thirtyDaysAgo }
          },
          _sum: {
            total: true
          }
        }),
        
        // Top 5 users by recent activity
        prisma.user.findMany({
          where: { tenantId: id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true
          },
          orderBy: {
            lastLoginAt: 'desc'
          },
          take: 5
        }),
        
        // Recent invoices
        prisma.invoice.findMany({
          where: { tenantId: id },
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            dueDate: true,
            createdAt: true,
            client: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        })
      ]);

      // Calculate growth metrics
      const stats = {
        totalUsers: cowork._count.users,
        totalClients: cowork._count.clients,
        totalSpaces: cowork._count.spaces,
        totalBookings: cowork._count.bookings,
        totalLeads: cowork._count.leads,
        totalOpportunities: cowork._count.opportunities,
        totalInvoices: cowork._count.invoices,
        
        // Recent activity (last 30 days)
        recentActivity: {
          newUsers: recentUsers,
          newClients: recentClients,
          newBookings: recentBookings,
          newLeads: recentLeads,
          monthlyRevenue: Number(monthlyRevenue._sum.total || 0)
        },
        
        // Additional insights
        topUsers,
        recentInvoices: recentInvoices.map(invoice => ({
          ...invoice,
          total: Number(invoice.total),
          clientName: invoice.client?.name || 'Sin cliente'
        }))
      };

      console.log(`Cowork details loaded for ${cowork.name}:`, stats);

      return {
        cowork: {
          ...cowork,
          settings: cowork.settings || {}
        },
        stats,
      };
    }, res);
  };

  /**
   * POST /api/super-admin/coworks
   * Create a new cowork with admin user
   */
  createCowork = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const data = createCoworkSchema.parse(req.body);
      console.log('Creating new cowork:', { name: data.name, slug: data.slug });

      // Create tenant with admin user
      const result = await TenantService.createTenant({
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        logo: data.logo,
        description: data.description,
        settings: data.settings,
        adminUser: data.adminUser,
      });

      // Log critical cowork creation action - temporarily disabled
      console.log('Audit logging for cowork creation disabled for testing');

      console.log(`✅ Cowork created successfully: ${result.name} (${result.id})`);

      return {
        cowork: result,
        message: `Cowork "${result.name}" created successfully`,
      };
    }, res);
  };

  /**
   * PUT /api/super-admin/coworks/:id
   * Update cowork information
   */
  updateCowork = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      const data = updateCoworkSchema.parse(req.body);
      console.log(`Updating cowork ${id}:`, data);

      const result = await TenantService.updateTenant(id, data);

      console.log(`✅ Cowork updated successfully: ${result.name}`);

      return {
        cowork: result,
        message: `Cowork "${result.name}" updated successfully`,
      };
    }, res);
  };

  /**
   * PUT /api/super-admin/coworks/:id/suspend
   * Suspend a cowork (prevents access but preserves data)
   */
  suspendCowork = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      const { reason, notifyUsers } = coworkActionSchema.parse(req.body);
      
      console.log(`🔒 Suspending cowork ${id}`, { reason, notifyUsers });

      const result = await TenantService.suspendTenant(id, {
        reason,
        suspendedBy: req.user!.id,
        notifyUsers,
      });

      // Log critical suspension action - temporarily disabled
      console.log('Audit logging for cowork suspension disabled for testing');

      // TODO: Implement user notification if requested
      if (notifyUsers) {
        console.log('📧 User notifications would be sent here');
        // Implement email notification system
      }

      console.log(`✅ Cowork suspended: ${result.name}`);

      return {
        cowork: result,
        message: `Cowork "${result.name}" has been suspended`,
      };
    }, res);
  };

  /**
   * PUT /api/super-admin/coworks/:id/activate
   * Activate a suspended cowork
   */
  activateCowork = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      const { reason, notifyUsers } = coworkActionSchema.parse(req.body);
      
      console.log(`✅ Activating cowork ${id}`, { reason, notifyUsers });

      const result = await TenantService.activateTenant(id, {
        reason,
        activatedBy: req.user!.id,
        notifyUsers,
      });

      // TODO: Implement user notification if requested
      if (notifyUsers) {
        console.log('📧 User notifications would be sent here');
        // Implement email notification system
      }

      console.log(`✅ Cowork activated: ${result.name}`);

      return {
        cowork: result,
        message: `Cowork "${result.name}" has been activated`,
      };
    }, res);
  };

  /**
   * DELETE /api/super-admin/coworks/:id
   * Delete a cowork (soft delete by default, hard delete with ?hard=true)
   */
  deleteCowork = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';
      
      console.log(`🗑️ Deleting cowork ${id} (hard: ${hardDelete})`);

      // Get cowork info before deletion
      const cowork = await TenantService.getTenantById(id);
      if (!cowork) {
        throw new Error('Cowork not found');
      }

      await TenantService.deleteTenant(id, hardDelete);

      console.log(`✅ Cowork deleted: ${cowork.name} (hard: ${hardDelete})`);

      return {
        message: `Cowork "${cowork.name}" has been ${hardDelete ? 'permanently deleted' : 'deactivated'}`,
      };
    }, res);
  };

  /**
   * GET /api/super-admin/coworks/:id/users
   * Get all users from a specific cowork
   */
  getCoworkUsers = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      const query = queryUsersSchema.parse(req.query);
      
      console.log(`Getting users for cowork ${id}:`, query);

      // Verify cowork exists
      const cowork = await TenantService.getTenantById(id);
      if (!cowork) {
        throw new Error('Cowork not found');
      }

      // Get users for this specific tenant
      const result = await UserService.getUsersByTenant(
        id,
        query.page,
        query.limit,
        query.role,
        query.status
      );

      console.log(`Found ${result.users.length} users in cowork ${cowork.name}`);

      return {
        cowork: {
          id: cowork.id,
          name: cowork.name,
          slug: cowork.slug,
        },
        users: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      };
    }, res);
  };

  /**
   * GET /api/super-admin/coworks/:id/clients
   * Get all clients from a specific cowork
   */
  getCoworkClients = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      const { id } = req.params;
      const query = queryUsersSchema.parse(req.query);
      
      console.log(`Getting clients for cowork ${id}:`, query);

      // Verify cowork exists
      const cowork = await TenantService.getTenantById(id);
      if (!cowork) {
        throw new Error('Cowork not found');
      }

      // TODO: Implement ClientService.getClientsByTenant method
      // For now, we'll return a placeholder
      console.log('⚠️ ClientService.getClientsByTenant not yet implemented');

      return {
        cowork: {
          id: cowork.id,
          name: cowork.name,
          slug: cowork.slug,
        },
        clients: [], // Placeholder - will implement in next phase
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        },
        message: 'Client listing will be implemented in the next phase',
      };
    }, res);
  };

  /**
   * GET /api/super-admin/analytics
   * Get system-wide analytics and metrics
   */
  getSystemAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    return handleController(async () => {
      this.verifySuperAdmin(req);

      console.log('Getting system analytics from database');

      // Import prisma here to avoid circular dependencies
      const { prisma } = await import('../lib/prisma');

      // Get real tenant statistics
      const [
        totalTenants,
        tenantsByStatus,
        totalUsers,
        totalClients,
        recentTenants,
        totalInvoices
      ] = await Promise.all([
        // Total tenants count
        prisma.tenant.count(),
        
        // Tenants grouped by status
        prisma.tenant.groupBy({
          by: ['status'],
          _count: {
            id: true
          }
        }),
        
        // Total users count
        prisma.user.count(),
        
        // Total clients count
        prisma.client.count(),
        
        // Recent tenants (last 5)
        prisma.tenant.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true
          }
        }),
        
        // Total revenue from invoices
        prisma.invoice.aggregate({
          _sum: {
            total: true
          },
          where: {
            status: 'PAID'
          }
        })
      ]);

      // Process status counts
      const statusCounts = tenantsByStatus.reduce((acc, item) => {
        acc[item.status.toLowerCase() + 'Tenants'] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      // Calculate monthly growth (simplified - comparing last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [recentTenantCount, previousTenantCount] = await Promise.all([
        prisma.tenant.count({
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }),
        prisma.tenant.count({
          where: {
            createdAt: {
              gte: sixtyDaysAgo,
              lt: thirtyDaysAgo
            }
          }
        })
      ]);

      const monthlyGrowth = previousTenantCount > 0 
        ? ((recentTenantCount - previousTenantCount) / previousTenantCount) * 100 
        : 0;

      const tenantStats = {
        totalTenants,
        activeTenants: statusCounts.activeTenants || 0,
        suspendedTenants: statusCounts.suspendedTenants || 0,
        inactiveTenants: statusCounts.inactiveTenants || 0,
        totalUsers,
        totalClients,
        totalRevenue: Number(totalInvoices._sum.total || 0),
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        recentTenants: recentTenants.map(tenant => ({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          createdAt: tenant.createdAt.toISOString(),
        })),
      };

      console.log('Real database stats:', tenantStats);

      // Return data structure that matches frontend expectations
      return {
        overview: tenantStats,
        userGrowth: [],
        revenueMetrics: {},
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
        },
      };
    }, res);
  };

  // Billing methods temporarily disabled for testing

  // Audit methods temporarily disabled for testing
}

export const superAdminController = new SuperAdminController();
import { PrismaClient, Activity, ActivityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateActivityData {
  type: ActivityType;
  subject: string;
  description?: string;
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
  dueDate?: string;
  duration?: number; // in minutes
  location?: string;
  metadata?: Record<string, any>;
  outcome?: string;
  completedAt?: string;
}

interface UpdateActivityData extends Partial<CreateActivityData> {}

interface ActivityQuery {
  page: number;
  limit: number;
  search?: string;
  type?: ActivityType;
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
  userId?: string;
  completed?: boolean;
  overdue?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface BulkActionData {
  activityIds: string[];
  action: 'complete' | 'delete' | 'assign';
  assignedToId?: string;
  completedAt?: string;
}

interface ActivityStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byType: Record<ActivityType, number>;
  byUser: Array<{
    userId: string;
    userName: string;
    total: number;
    completed: number;
    pending: number;
  }>;
  completionRate: number;
  averageDuration: number;
  upcomingThisWeek: number;
}

interface TimelineQuery {
  clientId?: string;
  leadId?: string;
  opportunityId?: string;
  days: number;
}

class ActivityService {
  async getActivities(tenantId: string, query: ActivityQuery) {
    const { page, limit, search, type, clientId, leadId, opportunityId, userId, completed, overdue, dateFrom, dateTo, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { outcome: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (type) where.type = type;
    if (clientId) where.clientId = clientId;
    if (leadId) where.leadId = leadId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (userId) where.userId = userId;
    
    if (completed !== undefined) {
      where.completedAt = completed ? { not: null } : null;
    }
    
    if (overdue === true) {
      where.AND = [
        { dueDate: { lt: new Date() } },
        { completedAt: null }
      ];
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Execute query with pagination
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityById(tenantId: string, activityId: string) {
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            score: true,
            status: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    return activity;
  }

  async createActivity(tenantId: string, userId: string, data: CreateActivityData) {
    // Validate related entities if provided
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });

      if (!client) {
        throw new ValidationError('Client not found');
      }
    }

    if (data.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, tenantId },
      });

      if (!lead) {
        throw new ValidationError('Lead not found');
      }
    }

    if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: data.opportunityId, tenantId },
      });

      if (!opportunity) {
        throw new ValidationError('Opportunity not found');
      }
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        tenantId,
        userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        metadata: data.metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    return activity;
  }

  async updateActivity(tenantId: string, activityId: string, data: UpdateActivityData) {
    // Check if activity exists
    const existingActivity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId },
    });

    if (!existingActivity) {
      throw new NotFoundError('Activity not found');
    }

    // Validate related entities if being updated
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });

      if (!client) {
        throw new ValidationError('Client not found');
      }
    }

    if (data.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, tenantId },
      });

      if (!lead) {
        throw new ValidationError('Lead not found');
      }
    }

    if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: data.opportunityId, tenantId },
      });

      if (!opportunity) {
        throw new ValidationError('Opportunity not found');
      }
    }

    const updateData: any = { ...data };
    
    // Convert date strings to Date objects
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }
    if (data.completedAt) {
      updateData.completedAt = new Date(data.completedAt);
    }

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    return activity;
  }

  async deleteActivity(tenantId: string, activityId: string) {
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId },
    });

    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    await prisma.activity.delete({
      where: { id: activityId },
    });
  }

  async completeActivity(tenantId: string, activityId: string, outcome?: string) {
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId },
    });

    if (!activity) {
      throw new NotFoundError('Activity not found');
    }

    if (activity.completedAt) {
      throw new ConflictError('Activity is already completed');
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        completedAt: new Date(),
        outcome: outcome || activity.outcome,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedActivity;
  }

  async bulkAction(tenantId: string, data: BulkActionData) {
    const { activityIds, action, assignedToId, completedAt } = data;

    // Verify all activities exist and belong to tenant
    const activities = await prisma.activity.findMany({
      where: {
        id: { in: activityIds },
        tenantId,
      },
    });

    if (activities.length !== activityIds.length) {
      throw new ValidationError('Some activities not found or access denied');
    }

    let result: any = {};

    switch (action) {
      case 'complete':
        result = await prisma.activity.updateMany({
          where: {
            id: { in: activityIds },
            tenantId,
          },
          data: {
            completedAt: completedAt ? new Date(completedAt) : new Date(),
          },
        });
        break;

      case 'delete':
        result = await prisma.activity.deleteMany({
          where: {
            id: { in: activityIds },
            tenantId,
          },
        });
        break;

      case 'assign':
        if (!assignedToId) {
          throw new ValidationError('Assigned user ID is required for assign action');
        }

        // Validate assigned user
        const assignedUser = await prisma.user.findFirst({
          where: { id: assignedToId, tenantId },
        });

        if (!assignedUser) {
          throw new ValidationError('Assigned user not found');
        }

        result = await prisma.activity.updateMany({
          where: {
            id: { in: activityIds },
            tenantId,
          },
          data: {
            userId: assignedToId,
          },
        });
        break;

      default:
        throw new ValidationError('Invalid bulk action');
    }

    return {
      action,
      affected: result.count || 0,
      activityIds,
    };
  }

  async getActivityStats(tenantId: string): Promise<ActivityStats> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const [
      totalCount,
      completedCount,
      overdueCount,
      typeStats,
      userStats,
      durationStats,
      upcomingCount,
    ] = await Promise.all([
      // Total activities
      prisma.activity.count({ where: { tenantId } }),
      
      // Completed activities
      prisma.activity.count({
        where: { tenantId, completedAt: { not: null } },
      }),
      
      // Overdue activities
      prisma.activity.count({
        where: {
          tenantId,
          dueDate: { lt: now },
          completedAt: null,
        },
      }),
      
      // Activities by type
      prisma.activity.groupBy({
        by: ['type'],
        where: { tenantId },
        _count: { type: true },
      }),
      
      // Activities by user
      prisma.activity.groupBy({
        by: ['userId'],
        where: { tenantId },
        _count: { userId: true },
      }),
      
      // Duration statistics
      prisma.activity.aggregate({
        where: {
          tenantId,
          duration: { not: null },
        },
        _avg: { duration: true },
      }),
      
      // Upcoming activities this week
      prisma.activity.count({
        where: {
          tenantId,
          dueDate: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
          completedAt: null,
        },
      }),
    ]);

    // Process type statistics
    const byType = {} as Record<ActivityType, number>;
    typeStats.forEach(({ type, _count }) => {
      byType[type] = _count.type;
    });

    // Process user statistics
    const userIds = userStats.map(stat => stat.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const byUser = await Promise.all(
      userStats.map(async ({ userId, _count }) => {
        const user = users.find(u => u.id === userId);
        const completed = await prisma.activity.count({
          where: {
            tenantId,
            userId,
            completedAt: { not: null },
          },
        });

        return {
          userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          total: _count.userId,
          completed,
          pending: _count.userId - completed,
        };
      })
    );

    const pendingCount = totalCount - completedCount;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return {
      total: totalCount,
      completed: completedCount,
      pending: pendingCount,
      overdue: overdueCount,
      byType,
      byUser,
      completionRate,
      averageDuration: Number(durationStats._avg.duration || 0),
      upcomingThisWeek: upcomingCount,
    };
  }

  async getActivityTimeline(tenantId: string, query: TimelineQuery) {
    const { clientId, leadId, opportunityId, days } = query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      tenantId,
      createdAt: { gte: startDate },
    };

    if (clientId) where.clientId = clientId;
    if (leadId) where.leadId = leadId;
    if (opportunityId) where.opportunityId = opportunityId;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        opportunity: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group activities by date
    const timeline = activities.reduce((acc, activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    return timeline;
  }

  async getUpcomingActivities(tenantId: string, userId: string, days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const activities = await prisma.activity.findMany({
      where: {
        tenantId,
        userId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        completedAt: null,
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        opportunity: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return activities;
  }

  async getOverdueActivities(tenantId: string, userId: string) {
    const now = new Date();

    const activities = await prisma.activity.findMany({
      where: {
        tenantId,
        userId,
        dueDate: { lt: now },
        completedAt: null,
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        opportunity: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return activities;
  }

  async getActivitiesByEntity(tenantId: string, entityType: 'lead' | 'client' | 'opportunity', entityId: string) {
    const where: any = { tenantId };
    
    switch (entityType) {
      case 'lead':
        where.leadId = entityId;
        break;
      case 'client':
        where.clientId = entityId;
        break;
      case 'opportunity':
        where.opportunityId = entityId;
        break;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return activities;
  }
}

export const activityService = new ActivityService();
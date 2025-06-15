import { PrismaClient, Task, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

interface CreateTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  reminderDate?: string;
  assignedToId?: string;
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
  activityId?: string;
  tags?: string[];
  estimatedHours?: number;
  metadata?: Record<string, any>;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  reminderDate?: string;
  assignedToId?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: string;
  metadata?: Record<string, any>;
}

interface TasksQuery {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  entityType?: 'LEAD' | 'CLIENT' | 'OPPORTUNITY' | 'ACTIVITY';
  entityId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
  searchTerm?: string;
  tags?: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface TaskStats {
  total: number;
  byStatus: Array<{
    status: TaskStatus;
    count: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: TaskPriority;
    count: number;
    percentage: number;
  }>;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completed: number;
  completionRate: number;
  averageCompletionTime: number; // in days
  byAssignee: Array<{
    userId: string;
    userName: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeName: string;
    createdAt: Date;
  }>;
}

interface TaskReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  dueDate: Date;
  reminderDate: Date;
  assigneeName: string;
  priority: TaskPriority;
  isOverdue: boolean;
  daysDue: number;
}

class TaskService {
  async createTask(tenantId: string, createdById: string, data: CreateTaskData) {
    // Validate assigned user exists in tenant
    if (data.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });
      if (!assignedUser) {
        throw new NotFoundError('Assigned user not found');
      }
    }

    // Validate entity associations
    if (data.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, tenantId },
      });
      if (!lead) {
        throw new NotFoundError('Lead not found');
      }
    }

    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });
      if (!client) {
        throw new NotFoundError('Client not found');
      }
    }

    if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: data.opportunityId, tenantId },
      });
      if (!opportunity) {
        throw new NotFoundError('Opportunity not found');
      }
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        tenantId,
        createdById,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : undefined,
        tags: data.tags || [],
        metadata: data.metadata || {},
        status: 'PENDING',
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        lead: {
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
        opportunity: {
          select: {
            title: true,
          },
        },
        activity: {
          select: {
            subject: true,
          },
        },
      },
    });

    return task;
  }

  async getTasks(tenantId: string, query: TasksQuery) {
    const {
      page,
      limit,
      status,
      priority,
      assignedToId,
      entityType,
      entityId,
      dueDateFrom,
      dueDateTo,
      overdue,
      searchTerm,
      tags,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = { tenantId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    if (entityType && entityId) {
      switch (entityType) {
        case 'LEAD':
          where.leadId = entityId;
          break;
        case 'CLIENT':
          where.clientId = entityId;
          break;
        case 'OPPORTUNITY':
          where.opportunityId = entityId;
          break;
        case 'ACTIVITY':
          where.activityId = entityId;
          break;
      }
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
      if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
    }

    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'COMPLETED' };
    }

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          lead: {
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
          opportunity: {
            select: {
              title: true,
            },
          },
          activity: {
            select: {
              subject: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTaskById(tenantId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
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
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
        activity: {
          select: {
            id: true,
            subject: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  }

  async updateTask(tenantId: string, taskId: string, data: UpdateTaskData) {
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    // Validate assigned user if changing assignment
    if (data.assignedToId && data.assignedToId !== existingTask.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });
      if (!assignedUser) {
        throw new NotFoundError('Assigned user not found');
      }
    }

    // Handle completion
    if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      data.completedAt = new Date().toISOString();
    } else if (data.status !== 'COMPLETED') {
      data.completedAt = undefined;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        tags: data.tags || existingTask.tags,
        metadata: data.metadata || existingTask.metadata,
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return task;
  }

  async deleteTask(tenantId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  }

  async completeTask(tenantId: string, taskId: string, completedById: string, actualHours?: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.status === 'COMPLETED') {
      throw new ValidationError('Task is already completed');
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualHours,
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedTask;
  }

  async getTaskStats(tenantId: string): Promise<TaskStats> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      totalTasks,
      statusStats,
      priorityStats,
      overdueTasks,
      dueTodayTasks,
      dueThisWeekTasks,
      completedTasks,
      userStats,
      recentTasks,
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({ where: { tenantId } }),
      
      // By status
      prisma.task.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      
      // By priority
      prisma.task.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: { priority: true },
      }),
      
      // Overdue tasks
      prisma.task.count({
        where: {
          tenantId,
          dueDate: { lt: now },
          status: { not: 'COMPLETED' },
        },
      }),
      
      // Due today
      prisma.task.count({
        where: {
          tenantId,
          dueDate: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
          status: { not: 'COMPLETED' },
        },
      }),
      
      // Due this week
      prisma.task.count({
        where: {
          tenantId,
          dueDate: {
            gte: startOfWeek,
            lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { not: 'COMPLETED' },
        },
      }),
      
      // Completed tasks
      prisma.task.count({
        where: { tenantId, status: 'COMPLETED' },
      }),
      
      // By user
      prisma.task.groupBy({
        by: ['assignedToId'],
        where: { tenantId, assignedToId: { not: null } },
        _count: { assignedToId: true },
      }),
      
      // Recent tasks
      prisma.task.findMany({
        where: { tenantId },
        include: {
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Process status statistics
    const byStatus = statusStats.map(({ status, _count }) => ({
      status,
      count: _count.status,
      percentage: totalTasks > 0 ? (_count.status / totalTasks) * 100 : 0,
    }));

    // Process priority statistics
    const byPriority = priorityStats.map(({ priority, _count }) => ({
      priority,
      count: _count.priority,
      percentage: totalTasks > 0 ? (_count.priority / totalTasks) * 100 : 0,
    }));

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average completion time
    const completedTasksWithDates = await prisma.task.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    const averageCompletionTime = completedTasksWithDates.length > 0
      ? completedTasksWithDates.reduce((sum, task) => {
          const timeDiff = task.completedAt!.getTime() - task.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / completedTasksWithDates.length
      : 0;

    // Process user statistics
    const userIds = userStats.map(stat => stat.assignedToId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const byAssignee = await Promise.all(
      userStats.map(async ({ assignedToId, _count }) => {
        if (!assignedToId) return null;
        
        const user = users.find(u => u.id === assignedToId);
        const userCompletedTasks = await prisma.task.count({
          where: { tenantId, assignedToId, status: 'COMPLETED' },
        });
        
        return {
          userId: assignedToId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          totalTasks: _count.assignedToId,
          completedTasks: userCompletedTasks,
          pendingTasks: _count.assignedToId - userCompletedTasks,
          completionRate: _count.assignedToId > 0 ? (userCompletedTasks / _count.assignedToId) * 100 : 0,
        };
      })
    );

    return {
      total: totalTasks,
      byStatus,
      byPriority,
      overdue: overdueTasks,
      dueToday: dueTodayTasks,
      dueThisWeek: dueThisWeekTasks,
      completed: completedTasks,
      completionRate,
      averageCompletionTime,
      byAssignee: byAssignee.filter(Boolean) as any[],
      recentTasks: recentTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assigneeName: task.assignedTo 
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
          : 'Unassigned',
        createdAt: task.createdAt,
      })),
    };
  }

  async getUpcomingReminders(tenantId: string, userId?: string): Promise<TaskReminder[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: any = {
      tenantId,
      status: { not: 'COMPLETED' },
      OR: [
        { reminderDate: { gte: now, lte: nextWeek } },
        { dueDate: { gte: now, lte: nextWeek } },
      ],
    };

    if (userId) {
      where.assignedToId = userId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { reminderDate: 'asc' },
      ],
    });

    return tasks.map(task => {
      const dueDate = task.dueDate || new Date();
      const isOverdue = dueDate < now;
      const daysDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: task.id,
        taskId: task.id,
        taskTitle: task.title,
        dueDate,
        reminderDate: task.reminderDate || dueDate,
        assigneeName: task.assignedTo 
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
          : 'Unassigned',
        priority: task.priority,
        isOverdue,
        daysDue,
      };
    });
  }

  async bulkUpdateTasks(tenantId: string, taskIds: string[], updates: Partial<UpdateTaskData>) {
    // Validate all tasks exist and belong to tenant
    const existingTasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        tenantId,
      },
      select: { id: true },
    });

    if (existingTasks.length !== taskIds.length) {
      throw new NotFoundError('One or more tasks not found');
    }

    const updatedTasks = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        tenantId,
      },
      data: {
        ...updates,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        reminderDate: updates.reminderDate ? new Date(updates.reminderDate) : undefined,
      },
    });

    return {
      updatedCount: updatedTasks.count,
      success: true,
    };
  }

  async getTasksByTag(tenantId: string, tag: string) {
    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        tags: { has: tag },
      },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks;
  }

  async getAllTags(tenantId: string) {
    const tasks = await prisma.task.findMany({
      where: { tenantId },
      select: { tags: true },
    });

    const allTags = tasks.flatMap(task => task.tags);
    const uniqueTags = [...new Set(allTags)];

    // Count usage of each tag
    const tagCounts = uniqueTags.map(tag => ({
      tag,
      count: allTags.filter(t => t === tag).length,
    }));

    return tagCounts.sort((a, b) => b.count - a.count);
  }
}

export const taskService = new TaskService();
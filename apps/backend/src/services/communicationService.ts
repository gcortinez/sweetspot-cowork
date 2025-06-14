import { PrismaClient, Communication, CommunicationType, CommunicationDirection } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

interface CreateCommunicationData {
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content?: string;
  fromEmail?: string;
  toEmail?: string;
  fromPhone?: string;
  toPhone?: string;
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
  activityId?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

interface UpdateCommunicationData {
  subject?: string;
  content?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

interface CommunicationsQuery {
  page: number;
  limit: number;
  type?: CommunicationType;
  direction?: CommunicationDirection;
  entityType?: 'LEAD' | 'CLIENT' | 'OPPORTUNITY';
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CommunicationStats {
  total: number;
  byType: Array<{
    type: CommunicationType;
    count: number;
    percentage: number;
  }>;
  byDirection: Array<{
    direction: CommunicationDirection;
    count: number;
    percentage: number;
  }>;
  thisWeek: number;
  thisMonth: number;
  averageResponseTime: number; // in hours
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    communicationCount: number;
  }>;
  recentCommunications: Array<{
    id: string;
    type: CommunicationType;
    direction: CommunicationDirection;
    subject: string;
    entityName: string;
    userName: string;
    createdAt: Date;
  }>;
}

interface CommunicationThread {
  entityType: 'LEAD' | 'CLIENT' | 'OPPORTUNITY';
  entityId: string;
  entityName: string;
  communications: Array<{
    id: string;
    type: CommunicationType;
    direction: CommunicationDirection;
    subject: string;
    content?: string;
    fromEmail?: string;
    toEmail?: string;
    user: {
      firstName: string;
      lastName: string;
    };
    createdAt: Date;
    attachments?: string[];
  }>;
  totalCount: number;
}

class CommunicationService {
  async createCommunication(tenantId: string, userId: string, data: CreateCommunicationData) {
    // Validate that at least one entity is specified
    if (!data.leadId && !data.clientId && !data.opportunityId) {
      throw new ValidationError('Communication must be associated with a lead, client, or opportunity');
    }

    // Validate entity exists
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

    const communication = await prisma.communication.create({
      data: {
        ...data,
        tenantId,
        userId,
        attachments: data.attachments || [],
        metadata: data.metadata || {},
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
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

    return communication;
  }

  async getCommunications(tenantId: string, query: CommunicationsQuery) {
    const { 
      page, 
      limit, 
      type, 
      direction, 
      entityType, 
      entityId, 
      dateFrom, 
      dateTo, 
      searchTerm, 
      sortBy, 
      sortOrder 
    } = query;
    const offset = (page - 1) * limit;

    const where: any = { tenantId };

    if (type) where.type = type;
    if (direction) where.direction = direction;
    
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
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (searchTerm) {
      where.OR = [
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { fromEmail: { contains: searchTerm, mode: 'insensitive' } },
        { toEmail: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lead: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          opportunity: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ]);

    return {
      communications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCommunicationById(tenantId: string, communicationId: string) {
    const communication = await prisma.communication.findFirst({
      where: { id: communicationId, tenantId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
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

    if (!communication) {
      throw new NotFoundError('Communication not found');
    }

    return communication;
  }

  async updateCommunication(tenantId: string, communicationId: string, data: UpdateCommunicationData) {
    const existingCommunication = await prisma.communication.findFirst({
      where: { id: communicationId, tenantId },
    });

    if (!existingCommunication) {
      throw new NotFoundError('Communication not found');
    }

    const communication = await prisma.communication.update({
      where: { id: communicationId },
      data: {
        ...data,
        attachments: data.attachments || existingCommunication.attachments,
        metadata: data.metadata || existingCommunication.metadata,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return communication;
  }

  async deleteCommunication(tenantId: string, communicationId: string) {
    const communication = await prisma.communication.findFirst({
      where: { id: communicationId, tenantId },
    });

    if (!communication) {
      throw new NotFoundError('Communication not found');
    }

    await prisma.communication.delete({
      where: { id: communicationId },
    });

    return { success: true };
  }

  async getCommunicationThread(tenantId: string, entityType: 'LEAD' | 'CLIENT' | 'OPPORTUNITY', entityId: string) {
    // Validate entity exists
    let entityName = '';
    switch (entityType) {
      case 'LEAD':
        const lead = await prisma.lead.findFirst({
          where: { id: entityId, tenantId },
        });
        if (!lead) throw new NotFoundError('Lead not found');
        entityName = `${lead.firstName} ${lead.lastName}`;
        break;
      case 'CLIENT':
        const client = await prisma.client.findFirst({
          where: { id: entityId, tenantId },
        });
        if (!client) throw new NotFoundError('Client not found');
        entityName = client.name;
        break;
      case 'OPPORTUNITY':
        const opportunity = await prisma.opportunity.findFirst({
          where: { id: entityId, tenantId },
        });
        if (!opportunity) throw new NotFoundError('Opportunity not found');
        entityName = opportunity.title;
        break;
    }

    const whereCondition: any = { tenantId };
    switch (entityType) {
      case 'LEAD':
        whereCondition.leadId = entityId;
        break;
      case 'CLIENT':
        whereCondition.clientId = entityId;
        break;
      case 'OPPORTUNITY':
        whereCondition.opportunityId = entityId;
        break;
    }

    const [communications, totalCount] = await Promise.all([
      prisma.communication.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.communication.count({ where: whereCondition }),
    ]);

    return {
      entityType,
      entityId,
      entityName,
      communications,
      totalCount,
    };
  }

  async getCommunicationStats(tenantId: string): Promise<CommunicationStats> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCommunications,
      weeklyCount,
      monthlyCount,
      typeStats,
      directionStats,
      userStats,
      recentCommunications,
    ] = await Promise.all([
      // Total communications
      prisma.communication.count({ where: { tenantId } }),
      
      // This week
      prisma.communication.count({
        where: { tenantId, createdAt: { gte: startOfWeek } },
      }),
      
      // This month
      prisma.communication.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      
      // By type
      prisma.communication.groupBy({
        by: ['type'],
        where: { tenantId },
        _count: { type: true },
      }),
      
      // By direction
      prisma.communication.groupBy({
        by: ['direction'],
        where: { tenantId },
        _count: { direction: true },
      }),
      
      // By user
      prisma.communication.groupBy({
        by: ['userId'],
        where: { tenantId },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
      
      // Recent communications
      prisma.communication.findMany({
        where: { tenantId },
        include: {
          user: {
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
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Process type statistics
    const byType = typeStats.map(({ type, _count }) => ({
      type,
      count: _count.type,
      percentage: totalCommunications > 0 ? (_count.type / totalCommunications) * 100 : 0,
    }));

    // Process direction statistics
    const byDirection = directionStats.map(({ direction, _count }) => ({
      direction,
      count: _count.direction,
      percentage: totalCommunications > 0 ? (_count.direction / totalCommunications) * 100 : 0,
    }));

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

    const mostActiveUsers = userStats.map(({ userId, _count }) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        communicationCount: _count.userId,
      };
    });

    // Calculate average response time (mock calculation)
    const averageResponseTime = 2.5; // Mock: 2.5 hours average

    return {
      total: totalCommunications,
      byType,
      byDirection,
      thisWeek: weeklyCount,
      thisMonth: monthlyCount,
      averageResponseTime,
      mostActiveUsers,
      recentCommunications: recentCommunications.map(comm => ({
        id: comm.id,
        type: comm.type,
        direction: comm.direction,
        subject: comm.subject,
        entityName: comm.lead 
          ? `${comm.lead.firstName} ${comm.lead.lastName}`
          : comm.client 
          ? comm.client.name
          : comm.opportunity
          ? comm.opportunity.title
          : 'Unknown',
        userName: `${comm.user.firstName} ${comm.user.lastName}`,
        createdAt: comm.createdAt,
      })),
    };
  }

  async markAsRead(tenantId: string, communicationId: string, userId: string) {
    const communication = await prisma.communication.findFirst({
      where: { id: communicationId, tenantId },
    });

    if (!communication) {
      throw new NotFoundError('Communication not found');
    }

    const metadata = communication.metadata as Record<string, any> || {};
    metadata.readBy = metadata.readBy || [];
    
    if (!metadata.readBy.includes(userId)) {
      metadata.readBy.push(userId);
      metadata.readAt = new Date().toISOString();
    }

    const updatedCommunication = await prisma.communication.update({
      where: { id: communicationId },
      data: { metadata },
    });

    return updatedCommunication;
  }

  async bulkDelete(tenantId: string, communicationIds: string[]) {
    // Validate all communications exist and belong to tenant
    const existingCommunications = await prisma.communication.findMany({
      where: {
        id: { in: communicationIds },
        tenantId,
      },
      select: { id: true },
    });

    if (existingCommunications.length !== communicationIds.length) {
      throw new NotFoundError('One or more communications not found');
    }

    const deletedCount = await prisma.communication.deleteMany({
      where: {
        id: { in: communicationIds },
        tenantId,
      },
    });

    return {
      deletedCount: deletedCount.count,
      success: true,
    };
  }
}

export const communicationService = new CommunicationService();
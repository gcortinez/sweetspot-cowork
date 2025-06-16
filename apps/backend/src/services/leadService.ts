import { PrismaClient, Lead, LeadSource, LeadStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source: LeadSource;
  channel?: string;
  budget?: number;
  interests?: string[];
  score?: number;
  qualificationNotes?: string;
  assignedToId?: string;
}

interface UpdateLeadData extends Partial<CreateLeadData> {
  status?: LeadStatus;
}

interface LeadQuery {
  page: number;
  limit: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedToId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  averageScore: number;
  conversionRate: number;
  recentLeads: number;
}

class LeadService {
  async getLeads(tenantId: string, query: LeadQuery) {
    const { page, limit, search, status, source, assignedToId, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    console.log('=== LEAD SERVICE DEBUG ===');
    console.log('tenantId received:', tenantId);
    console.log('query parameters:', query);

    // Build where clause
    const where: any = { tenantId };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedToId) where.assignedToId = assignedToId;

    console.log('Prisma where clause:', JSON.stringify(where, null, 2));

    // Execute query with pagination
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
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
          _count: {
            select: {
              opportunities: true,
              activities: true,
              tasks: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    console.log('Query results:');
    console.log('- Total leads found:', total);
    console.log('- Leads returned:', leads.length);
    console.log('- Lead details:', leads.map(l => ({ id: l.id, firstName: l.firstName, lastName: l.lastName, email: l.email, tenantId: l.tenantId })));
    console.log('========================');

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getLeadById(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      include: {
        assignedTo: {
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
        opportunities: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            expectedCloseDate: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            subject: true,
            dueDate: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tasks: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        communications: {
          select: {
            id: true,
            type: true,
            subject: true,
            direction: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    return lead;
  }

  async createLead(tenantId: string, data: CreateLeadData) {
    // Check if email already exists for this tenant
    const existingLead = await prisma.lead.findFirst({
      where: { tenantId, email: data.email },
    });

    if (existingLead) {
      throw new ConflictError('Lead with this email already exists');
    }

    // Validate assigned user if provided
    if (data.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });

      if (!assignedUser) {
        throw new ValidationError('Assigned user not found');
      }
    }

    const lead = await prisma.lead.create({
      data: {
        ...data,
        tenantId,
        interests: data.interests || [],
        score: data.score || 0,
        status: 'NEW',
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  async updateLead(tenantId: string, leadId: string, data: UpdateLeadData) {
    // Check if lead exists
    const existingLead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (!existingLead) {
      throw new NotFoundError('Lead not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingLead.email) {
      const emailExists = await prisma.lead.findFirst({
        where: { tenantId, email: data.email, id: { not: leadId } },
      });

      if (emailExists) {
        throw new ConflictError('Lead with this email already exists');
      }
    }

    // Validate assigned user if provided
    if (data.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });

      if (!assignedUser) {
        throw new ValidationError('Assigned user not found');
      }
    }

    const updateData: any = { ...data };
    
    // Update lastContactAt if status is being changed to CONTACTED
    if (data.status === 'CONTACTED' && existingLead.status !== 'CONTACTED') {
      updateData.lastContactAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  async deleteLead(tenantId: string, leadId: string) {
    // Check if lead exists and has no dependencies
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      include: {
        opportunities: true,
        conversions: true,
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (lead.opportunities.length > 0 || lead.conversions.length > 0) {
      throw new ValidationError('Cannot delete lead with associated opportunities or conversions');
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });
  }

  async assignLead(tenantId: string, leadId: string, assignedToId: string) {
    // Validate assigned user
    const assignedUser = await prisma.user.findFirst({
      where: { id: assignedToId, tenantId },
    });

    if (!assignedUser) {
      throw new AppError('Assigned user not found', 400);
    }

    const lead = await prisma.lead.update({
      where: { id: leadId, tenantId },
      data: { assignedToId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  async updateLeadScore(tenantId: string, leadId: string, score: number) {
    const lead = await prisma.lead.update({
      where: { id: leadId, tenantId },
      data: { score },
    });

    return lead;
  }

  async addLeadNote(tenantId: string, leadId: string, note: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    const currentNotes = lead.qualificationNotes || '';
    const timestamp = new Date().toISOString();
    const newNote = `${timestamp}: ${note}`;
    const updatedNotes = currentNotes 
      ? `${currentNotes}\n\n${newNote}`
      : newNote;

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { qualificationNotes: updatedNotes },
    });

    return updatedLead;
  }

  async getLeadStats(tenantId: string): Promise<LeadStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      total,
      statusCounts,
      sourceCounts,
      averageScore,
      conversionCount,
      recentLeads,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count({ where: { tenantId } }),
      
      // Leads by status
      prisma.lead.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      
      // Leads by source
      prisma.lead.groupBy({
        by: ['source'],
        where: { tenantId },
        _count: { source: true },
      }),
      
      // Average score
      prisma.lead.aggregate({
        where: { tenantId },
        _avg: { score: true },
      }),
      
      // Conversion count
      prisma.leadConversion.count({
        where: { tenantId },
      }),
      
      // Recent leads (last 30 days)
      prisma.lead.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Process status counts
    const byStatus = {} as Record<LeadStatus, number>;
    statusCounts.forEach(({ status, _count }) => {
      byStatus[status] = _count.status;
    });

    // Process source counts
    const bySource = {} as Record<LeadSource, number>;
    sourceCounts.forEach(({ source, _count }) => {
      bySource[source] = _count.source;
    });

    return {
      total,
      byStatus,
      bySource,
      averageScore: averageScore._avg.score || 0,
      conversionRate: total > 0 ? (conversionCount / total) * 100 : 0,
      recentLeads,
    };
  }
}

export const leadService = new LeadService();
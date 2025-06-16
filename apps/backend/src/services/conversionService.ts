import { PrismaClient, Lead, Client, LeadConversion, LeadStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface ConvertLeadData {
  leadId: string;
  clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxId?: string;
    contactPerson?: string;
    notes?: string;
  };
  createOpportunity: boolean;
  opportunityData?: {
    title: string;
    description?: string;
    value: number;
    probability: number;
    stage: 'INITIAL_CONTACT' | 'NEEDS_ANALYSIS' | 'PROPOSAL_SENT' | 'NEGOTIATION';
    expectedCloseDate?: string;
  };
  conversionNotes?: string;
}

interface BatchConvertData {
  leadIds: string[];
  defaultClientData?: {
    contactPerson?: string;
    notes?: string;
  };
  createOpportunities: boolean;
  conversionNotes?: string;
}

interface ConversionsQuery {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  convertedById?: string;
  hasOpportunity?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface QualifiedLeadsQuery {
  page: number;
  limit: number;
  minScore: number;
  assignedToId?: string;
}

interface ConversionStats {
  totalConversions: number;
  thisMonth: number;
  thisWeek: number;
  conversionRate: number;
  averageLeadScore: number;
  averageTimeToConversion: number; // in days
  byUser: Array<{
    userId: string;
    userName: string;
    conversions: number;
    conversionRate: number;
  }>;
  bySource: Array<{
    source: string;
    conversions: number;
    conversionRate: number;
  }>;
  recentConversions: Array<{
    id: string;
    leadName: string;
    clientName: string;
    convertedBy: string;
    createdAt: Date;
  }>;
}

interface ConversionFunnel {
  period: string;
  stages: Array<{
    stage: string;
    count: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
  totalLeads: number;
  totalConversions: number;
  overallConversionRate: number;
}

class ConversionService {
  async convertLeadToClient(tenantId: string, convertedById: string, data: ConvertLeadData) {
    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Validate lead exists and can be converted
      const lead = await tx.lead.findFirst({
        where: { id: data.leadId, tenantId },
        include: {
          conversions: true,
        },
      });

      if (!lead) {
        throw new NotFoundError('Lead not found');
      }

      if (lead.conversions.length > 0) {
        throw new ConflictError('Lead has already been converted');
      }

      if (lead.status === 'CONVERTED') {
        throw new ConflictError('Lead is already marked as converted');
      }

      // 2. Check if client with same email already exists
      const existingClient = await tx.client.findFirst({
        where: { tenantId, email: data.clientData.email },
      });

      if (existingClient) {
        throw new ConflictError('Client with this email already exists');
      }

      // 3. Create new client
      const client = await tx.client.create({
        data: {
          ...data.clientData,
          tenantId,
          status: 'ACTIVE',
        },
      });

      // 4. Create opportunity if requested
      let opportunity = null;
      if (data.createOpportunity && data.opportunityData) {
        const expectedRevenue = (data.opportunityData.value * data.opportunityData.probability) / 100;
        
        opportunity = await tx.opportunity.create({
          data: {
            title: data.opportunityData.title,
            description: data.opportunityData.description,
            value: data.opportunityData.value,
            probability: data.opportunityData.probability,
            expectedRevenue,
            stage: data.opportunityData.stage,
            expectedCloseDate: data.opportunityData.expectedCloseDate ? new Date(data.opportunityData.expectedCloseDate) : undefined,
            tenantId,
            leadId: lead.id,
            clientId: client.id,
            assignedToId: lead.assignedToId,
          },
        });
      }

      // 5. Create lead conversion record
      const conversion = await tx.leadConversion.create({
        data: {
          tenantId,
          leadId: lead.id,
          clientId: client.id,
          opportunityId: opportunity?.id,
          convertedById,
          conversionNotes: data.conversionNotes,
        },
      });

      // 6. Update lead status
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          clientId: client.id,
        },
      });

      // 7. Create activity record for conversion
      await tx.activity.create({
        data: {
          tenantId,
          type: 'NOTE',
          subject: 'Lead converted to client',
          description: `Lead ${lead.firstName} ${lead.lastName} has been successfully converted to client: ${client.name}${opportunity ? ` with opportunity: ${opportunity.title}` : ''}`,
          leadId: lead.id,
          clientId: client.id,
          opportunityId: opportunity?.id,
          userId: convertedById,
          completedAt: new Date(),
        },
      });

      return {
        conversion,
        client,
        opportunity,
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
        },
      };
    });
  }

  async batchConvertLeads(tenantId: string, convertedById: string, data: BatchConvertData) {
    const results = [];
    const errors = [];

    for (const leadId of data.leadIds) {
      try {
        const lead = await prisma.lead.findFirst({
          where: { id: leadId, tenantId },
        });

        if (!lead) {
          errors.push({ leadId, error: 'Lead not found' });
          continue;
        }

        const conversionData: ConvertLeadData = {
          leadId,
          clientData: {
            name: `${lead.firstName} ${lead.lastName}`,
            email: lead.email,
            phone: lead.phone || undefined,
            contactPerson: data.defaultClientData?.contactPerson,
            notes: data.defaultClientData?.notes,
          },
          createOpportunity: data.createOpportunities,
          opportunityData: data.createOpportunities ? {
            title: `Opportunity for ${lead.firstName} ${lead.lastName}`,
            value: 0,
            probability: 50,
            stage: 'INITIAL_CONTACT' as const,
          } : undefined,
          conversionNotes: data.conversionNotes,
        };

        const result = await this.convertLeadToClient(tenantId, convertedById, conversionData);
        results.push(result);
      } catch (error) {
        errors.push({ 
          leadId, 
          error: (error as Error).message 
        });
      }
    }

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async getConversions(tenantId: string, query: ConversionsQuery) {
    const { page, limit, dateFrom, dateTo, convertedById, hasOpportunity, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (convertedById) where.convertedById = convertedById;

    if (hasOpportunity !== undefined) {
      where.opportunityId = hasOpportunity ? { not: null } : null;
    }

    const [conversions, total] = await Promise.all([
      prisma.leadConversion.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              source: true,
              score: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
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
          convertedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.leadConversion.count({ where }),
    ]);

    return {
      conversions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getConversionById(tenantId: string, conversionId: string) {
    const conversion = await prisma.leadConversion.findFirst({
      where: { id: conversionId, tenantId },
      include: {
        lead: {
          include: {
            activities: {
              select: {
                id: true,
                type: true,
                subject: true,
                createdAt: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        client: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        opportunity: {
          include: {
            activities: {
              select: {
                id: true,
                type: true,
                subject: true,
                createdAt: true,
              },
              take: 5,
            },
          },
        },
        convertedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!conversion) {
      throw new NotFoundError('Conversion not found');
    }

    return conversion;
  }

  async getConversionStats(tenantId: string): Promise<ConversionStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      totalConversions,
      monthlyConversions,
      weeklyConversions,
      totalLeads,
      conversionsByUser,
      conversionsBySourceRaw,
      recentConversions,
    ] = await Promise.all([
      // Total conversions
      prisma.leadConversion.count({ where: { tenantId } }),
      
      // This month conversions
      prisma.leadConversion.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      
      // This week conversions
      prisma.leadConversion.count({
        where: { tenantId, createdAt: { gte: startOfWeek } },
      }),
      
      // Total leads for conversion rate
      prisma.lead.count({ where: { tenantId } }),
      
      // Conversions by user
      prisma.leadConversion.groupBy({
        by: ['convertedById'],
        where: { tenantId },
        _count: { convertedById: true },
      }),
      
      // Conversions by source (from leads)
      prisma.$queryRaw`
        SELECT l.source, COUNT(lc.id) as conversions
        FROM leads l
        INNER JOIN lead_conversions lc ON l.id = lc.lead_id
        WHERE l.tenant_id = ${tenantId}
        GROUP BY l.source
      `,
      
      // Recent conversions
      prisma.leadConversion.findMany({
        where: { tenantId },
        include: {
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
          convertedBy: {
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

    // Type conversion for raw query result
    const conversionsBySource = conversionsBySourceRaw as Array<{ source: string; conversions: bigint }>;

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

    // Calculate average lead score for converted leads
    const convertedLeads = await prisma.lead.findMany({
      where: {
        tenantId,
        status: 'CONVERTED',
      },
      select: { score: true, createdAt: true },
    });

    const averageLeadScore = convertedLeads.length > 0
      ? convertedLeads.reduce((sum, lead) => sum + lead.score, 0) / convertedLeads.length
      : 0;

    // Calculate average time to conversion
    const conversionsWithTiming = await prisma.leadConversion.findMany({
      where: { tenantId },
      include: {
        lead: {
          select: { createdAt: true },
        },
      },
    });

    const averageTimeToConversion = conversionsWithTiming.length > 0
      ? conversionsWithTiming.reduce((sum, conversion) => {
          const timeDiff = conversion.createdAt.getTime() - conversion.lead.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / conversionsWithTiming.length
      : 0;

    // Process user statistics
    const userIds = conversionsByUser.map(stat => stat.convertedById);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const byUser = await Promise.all(
      conversionsByUser.map(async ({ convertedById, _count }) => {
        const user = users.find(u => u.id === convertedById);
        const userLeads = await prisma.lead.count({
          where: { tenantId, assignedToId: convertedById },
        });
        
        return {
          userId: convertedById,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          conversions: _count.convertedById,
          conversionRate: userLeads > 0 ? (_count.convertedById / userLeads) * 100 : 0,
        };
      })
    );

    // Process source statistics
    const bySource = conversionsBySource.map(({ source, conversions }) => ({
      source,
      conversions: Number(conversions),
      conversionRate: 0, // Would need additional query to calculate
    }));

    return {
      totalConversions,
      thisMonth: monthlyConversions,
      thisWeek: weeklyConversions,
      conversionRate,
      averageLeadScore,
      averageTimeToConversion,
      byUser,
      bySource,
      recentConversions: recentConversions.map(conversion => ({
        id: conversion.id,
        leadName: `${conversion.lead.firstName} ${conversion.lead.lastName}`,
        clientName: conversion.client.name,
        convertedBy: `${conversion.convertedBy.firstName} ${conversion.convertedBy.lastName}`,
        createdAt: conversion.createdAt,
      })),
    };
  }

  async getConversionFunnel(tenantId: string, period: string): Promise<ConversionFunnel> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalLeads, qualifiedLeads, conversions] = await Promise.all([
      prisma.lead.count({
        where: { tenantId, createdAt: { gte: startDate } },
      }),
      prisma.lead.count({
        where: { tenantId, createdAt: { gte: startDate }, status: 'QUALIFIED' },
      }),
      prisma.leadConversion.count({
        where: { tenantId, createdAt: { gte: startDate } },
      }),
    ]);

    const stages = [
      {
        stage: 'Total Leads',
        count: totalLeads,
        conversionRate: 100,
        dropOffRate: 0,
      },
      {
        stage: 'Qualified Leads',
        count: qualifiedLeads,
        conversionRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
        dropOffRate: totalLeads > 0 ? ((totalLeads - qualifiedLeads) / totalLeads) * 100 : 0,
      },
      {
        stage: 'Converted to Clients',
        count: conversions,
        conversionRate: totalLeads > 0 ? (conversions / totalLeads) * 100 : 0,
        dropOffRate: totalLeads > 0 ? ((totalLeads - conversions) / totalLeads) * 100 : 0,
      },
    ];

    return {
      period,
      stages,
      totalLeads,
      totalConversions: conversions,
      overallConversionRate: totalLeads > 0 ? (conversions / totalLeads) * 100 : 0,
    };
  }

  async getQualifiedLeads(tenantId: string, query: QualifiedLeadsQuery) {
    const { page, limit, minScore, assignedToId } = query;
    const offset = (page - 1) * limit;

    const where: any = {
      tenantId,
      status: { in: ['QUALIFIED', 'CONTACTED'] },
      score: { gte: minScore },
    };

    if (assignedToId) where.assignedToId = assignedToId;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          opportunities: {
            select: {
              id: true,
              title: true,
              stage: true,
            },
          },
          conversions: true,
        },
        orderBy: [
          { score: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    // Filter out already converted leads
    const availableLeads = leads.filter(lead => lead.conversions.length === 0);

    return {
      leads: availableLeads,
      pagination: {
        page,
        limit,
        total: availableLeads.length,
        pages: Math.ceil(availableLeads.length / limit),
      },
    };
  }

  async previewConversion(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        activities: {
          select: {
            type: true,
            subject: true,
            completedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        opportunities: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
        conversions: true,
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (lead.conversions.length > 0) {
      throw new ConflictError('Lead has already been converted');
    }

    // Generate suggested client data
    const suggestedClientData = {
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      contactPerson: lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : undefined,
    };

    // Check for potential conflicts
    const existingClient = await prisma.client.findFirst({
      where: { tenantId, email: lead.email },
    });

    return {
      lead: {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        score: lead.score,
        status: lead.status,
        source: lead.source,
      },
      suggestedClientData,
      existingOpportunities: lead.opportunities,
      recentActivities: lead.activities,
      conflicts: {
        emailExists: !!existingClient,
        existingClientId: existingClient?.id,
      },
      readyForConversion: lead.status === 'QUALIFIED' && lead.score >= 70,
    };
  }

  async getUserConversionPerformance(tenantId: string, userId: string, period: string) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [conversions, assignedLeads, totalLeads] = await Promise.all([
      prisma.leadConversion.count({
        where: {
          tenantId,
          convertedById: userId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.lead.count({
        where: {
          tenantId,
          assignedToId: userId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.lead.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const conversionRate = assignedLeads > 0 ? (conversions / assignedLeads) * 100 : 0;
    const marketShare = totalLeads > 0 ? (assignedLeads / totalLeads) * 100 : 0;

    return {
      period,
      conversions,
      assignedLeads,
      conversionRate,
      marketShare,
      performance: conversionRate >= 20 ? 'excellent' : conversionRate >= 10 ? 'good' : 'needs_improvement',
    };
  }
}

export const conversionService = new ConversionService();
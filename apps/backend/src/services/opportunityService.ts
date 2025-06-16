import { PrismaClient, Opportunity, PipelineStage } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';

interface CreateOpportunityData {
  title: string;
  description?: string;
  value: number;
  probability: number;
  expectedRevenue: number;
  stage: PipelineStage;
  expectedCloseDate?: string;
  leadId?: string;
  clientId?: string;
  assignedToId?: string;
  competitorInfo?: string;
}

interface UpdateOpportunityData extends Partial<CreateOpportunityData> {
  lostReason?: string;
  actualCloseDate?: string;
}

interface OpportunityQuery {
  page: number;
  limit: number;
  search?: string;
  stage?: PipelineStage;
  assignedToId?: string;
  leadId?: string;
  clientId?: string;
  minValue?: number;
  maxValue?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PipelineStats {
  totalOpportunities: number;
  totalValue: number;
  averageValue: number;
  averageProbability: number;
  expectedRevenue: number;
  byStage: Record<PipelineStage, { count: number; value: number; probability: number }>;
  conversionRates: Record<string, number>;
  averageSalescycle: number;
}

interface PipelineFunnel {
  stages: Array<{
    stage: PipelineStage;
    name: string;
    count: number;
    value: number;
    conversionRate: number;
    opportunities: Array<{
      id: string;
      title: string;
      value: number;
      probability: number;
      assignedTo?: { firstName: string; lastName: string };
      lead?: { firstName: string; lastName: string };
      client?: { name: string };
    }>;
  }>;
}

class OpportunityService {
  async getOpportunities(tenantId: string, query: OpportunityQuery) {
    const { page, limit, search, stage, assignedToId, leadId, clientId, minValue, maxValue, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { competitorInfo: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (stage) where.stage = stage;
    if (assignedToId) where.assignedToId = assignedToId;
    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    
    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {};
      if (minValue !== undefined) where.value.gte = minValue;
      if (maxValue !== undefined) where.value.lte = maxValue;
    }

    // Execute query with pagination
    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
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
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          quotations: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              activities: true,
              tasks: true,
              quotations: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.opportunity.count({ where }),
    ]);

    return {
      opportunities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOpportunityById(tenantId: string, opportunityId: string) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId },
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
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            subject: true,
            dueDate: true,
            completedAt: true,
            outcome: true,
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
        tasks: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,
            assignedTo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        quotations: {
          select: {
            id: true,
            number: true,
            title: true,
            total: true,
            status: true,
            validUntil: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    return opportunity;
  }

  async createOpportunity(tenantId: string, data: CreateOpportunityData) {
    // Validate related entities if provided
    if (data.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });

      if (!assignedUser) {
        throw new ValidationError('Assigned user not found');
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

    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });

      if (!client) {
        throw new ValidationError('Client not found');
      }
    }

    // Calculate expected revenue if not provided
    const expectedRevenue = data.expectedRevenue || (data.value * data.probability) / 100;

    const opportunity = await prisma.opportunity.create({
      data: {
        ...data,
        tenantId,
        expectedRevenue,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
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
      },
    });

    return opportunity;
  }

  async updateOpportunity(tenantId: string, opportunityId: string, data: UpdateOpportunityData) {
    // Check if opportunity exists
    const existingOpportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId },
    });

    if (!existingOpportunity) {
      throw new NotFoundError('Opportunity not found');
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
    
    // Recalculate expected revenue if value or probability changed
    if (data.value !== undefined || data.probability !== undefined) {
      const value = data.value !== undefined ? data.value : existingOpportunity.value;
      const probability = data.probability !== undefined ? data.probability : existingOpportunity.probability;
      updateData.expectedRevenue = (Number(value) * probability) / 100;
    }

    // Set actual close date for closed opportunities
    if (data.stage && (data.stage === 'CLOSED_WON' || data.stage === 'CLOSED_LOST') && !data.actualCloseDate) {
      updateData.actualCloseDate = new Date();
    }

    // Convert date strings to Date objects
    if (data.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(data.expectedCloseDate);
    }
    if (data.actualCloseDate) {
      updateData.actualCloseDate = new Date(data.actualCloseDate);
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
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
      },
    });

    return opportunity;
  }

  async deleteOpportunity(tenantId: string, opportunityId: string) {
    // Check if opportunity exists and has no dependencies
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId },
      include: {
        quotations: true,
        conversions: true,
      },
    });

    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    if (opportunity.quotations.length > 0 || opportunity.conversions.length > 0) {
      throw new ValidationError('Cannot delete opportunity with associated quotations or conversions');
    }

    await prisma.opportunity.delete({
      where: { id: opportunityId },
    });
  }

  async updateStage(tenantId: string, opportunityId: string, stage: PipelineStage, userId: string, reason?: string, notes?: string) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId },
    });

    if (!opportunity) {
      throw new NotFoundError('Opportunity not found');
    }

    const updateData: any = { stage };

    // Set actual close date for closed opportunities
    if (stage === 'CLOSED_WON' || stage === 'CLOSED_LOST') {
      updateData.actualCloseDate = new Date();
      if (stage === 'CLOSED_LOST' && reason) {
        updateData.lostReason = reason;
      }
    }

    // Update the opportunity
    const updatedOpportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
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

    // Log the stage change as an activity
    await prisma.activity.create({
      data: {
        tenantId,
        type: 'NOTE',
        subject: `Stage changed to ${stage}`,
        description: notes || `Opportunity stage changed from ${opportunity.stage} to ${stage}${reason ? `. Reason: ${reason}` : ''}`,
        opportunityId,
        userId,
        completedAt: new Date(),
      },
    });

    return updatedOpportunity;
  }

  async assignOpportunity(tenantId: string, opportunityId: string, assignedToId: string) {
    // Validate assigned user
    const assignedUser = await prisma.user.findFirst({
      where: { id: assignedToId, tenantId },
    });

    if (!assignedUser) {
      throw new ValidationError('Assigned user not found');
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: opportunityId, tenantId },
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

    return opportunity;
  }

  async getPipelineStats(tenantId: string): Promise<PipelineStats> {
    const [
      totalCount,
      stageStats,
      valueStats,
      closedOpportunities,
    ] = await Promise.all([
      // Total opportunities
      prisma.opportunity.count({ where: { tenantId } }),
      
      // Opportunities by stage
      prisma.opportunity.groupBy({
        by: ['stage'],
        where: { tenantId },
        _count: { stage: true },
        _sum: { value: true },
        _avg: { probability: true },
      }),
      
      // Value statistics
      prisma.opportunity.aggregate({
        where: { tenantId },
        _sum: { value: true, expectedRevenue: true },
        _avg: { value: true, probability: true },
      }),
      
      // Closed opportunities for conversion rates
      prisma.opportunity.findMany({
        where: {
          tenantId,
          stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
        select: {
          stage: true,
          createdAt: true,
          actualCloseDate: true,
        },
      }),
    ]);

    // Process stage statistics
    const byStage = {} as Record<PipelineStage, { count: number; value: number; probability: number }>;
    stageStats.forEach(({ stage, _count, _sum, _avg }) => {
      byStage[stage] = {
        count: _count.stage,
        value: Number(_sum.value || 0),
        probability: Number(_avg.probability || 0),
      };
    });

    // Calculate conversion rates
    const conversionRates: Record<string, number> = {};
    const wonCount = closedOpportunities.filter(op => op.stage === 'CLOSED_WON').length;
    const totalClosed = closedOpportunities.length;
    conversionRates.winRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

    // Calculate average sales cycle
    const salesCycles = closedOpportunities
      .filter(op => op.actualCloseDate)
      .map(op => {
        const created = new Date(op.createdAt);
        const closed = new Date(op.actualCloseDate!);
        return Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    const averageSalescycle = salesCycles.length > 0 
      ? salesCycles.reduce((sum, cycle) => sum + cycle, 0) / salesCycles.length 
      : 0;

    return {
      totalOpportunities: totalCount,
      totalValue: Number(valueStats._sum.value || 0),
      averageValue: Number(valueStats._avg.value || 0),
      averageProbability: Number(valueStats._avg.probability || 0),
      expectedRevenue: Number(valueStats._sum.expectedRevenue || 0),
      byStage,
      conversionRates,
      averageSalescycle,
    };
  }

  async getPipelineFunnel(tenantId: string): Promise<PipelineFunnel> {
    const stageOrder: PipelineStage[] = [
      'INITIAL_CONTACT',
      'NEEDS_ANALYSIS', 
      'PROPOSAL_SENT',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST'
    ];

    const stageNames = {
      INITIAL_CONTACT: 'Initial Contact',
      NEEDS_ANALYSIS: 'Needs Analysis',
      PROPOSAL_SENT: 'Proposal Sent',
      NEGOTIATION: 'Negotiation',
      CLOSED_WON: 'Closed Won',
      CLOSED_LOST: 'Closed Lost'
    };

    const opportunities = await prisma.opportunity.findMany({
      where: { tenantId },
      include: {
        assignedTo: {
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
      },
    });

    const totalOpportunities = opportunities.length;
    const stages = stageOrder.map((stage, index) => {
      const stageOpportunities = opportunities.filter(op => op.stage === stage);
      const count = stageOpportunities.length;
      const value = stageOpportunities.reduce((sum, op) => sum + Number(op.value), 0);
      
      // Calculate conversion rate (compared to previous stage)
      let conversionRate = 100;
      if (index > 0) {
        const previousStageCount = opportunities.filter(op => {
          const currentIndex = stageOrder.indexOf(op.stage);
          return currentIndex >= index - 1;
        }).length;
        conversionRate = previousStageCount > 0 ? (count / previousStageCount) * 100 : 0;
      }

      return {
        stage,
        name: stageNames[stage],
        count,
        value,
        conversionRate,
        opportunities: stageOpportunities.map(op => ({
          id: op.id,
          title: op.title,
          value: Number(op.value),
          probability: op.probability,
          assignedTo: op.assignedTo ? {
            firstName: op.assignedTo.firstName,
            lastName: op.assignedTo.lastName,
          } : undefined,
          lead: op.lead ? {
            firstName: op.lead.firstName,
            lastName: op.lead.lastName,
          } : undefined,
          client: op.client ? {
            name: op.client.name,
          } : undefined,
        })),
      };
    });

    return { stages };
  }

  async createOpportunityFromLead(tenantId: string, leadId: string, data: Omit<CreateOpportunityData, 'leadId'>) {
    // Validate lead exists
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    // Create opportunity with lead association
    const opportunity = await this.createOpportunity(tenantId, {
      ...data,
      leadId,
      clientId: lead.clientId || data.clientId,
    });

    // Update lead status to indicate it has an opportunity
    if (lead.status !== 'CONVERTED') {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'QUALIFIED' },
      });
    }

    return opportunity;
  }
}

export const opportunityService = new OpportunityService();
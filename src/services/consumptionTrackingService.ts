import { prisma } from '../lib/prisma';
import { UsageResourceType } from '@prisma/client';

export interface TrackConsumptionData {
  clientId: string;
  subscriptionId?: string;
  resourceType: UsageResourceType;
  resourceId: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  usageDate?: Date;
  metadata?: Record<string, any>;
}

export interface ConsumptionSummary {
  resourceType: UsageResourceType;
  resourceId: string;
  resourceName: string;
  totalQuantity: number;
  totalCost: number;
  unit: string;
  averageUnitPrice: number;
  usageCount: number;
  lastUsed: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UsageReport {
  period: string;
  clientId: string;
  clientName: string;
  totalCost: number;
  byResourceType: Record<UsageResourceType, {
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  topResources: Array<{
    resourceId: string;
    resourceName: string;
    resourceType: UsageResourceType;
    quantity: number;
    cost: number;
  }>;
  comparisonToPrevious: {
    costChange: number;
    quantityChange: number;
    percentageChange: number;
  };
}

export class ConsumptionTrackingService {

  // ============================================================================
  // CONSUMPTION TRACKING
  // ============================================================================

  async trackConsumption(tenantId: string, data: TrackConsumptionData) {
    // Get pricing information if not provided
    let unitPrice = data.unitPrice;
    
    if (!unitPrice) {
      unitPrice = await this.getResourcePrice(tenantId, data.resourceType, data.resourceId);
    }

    const totalCost = data.quantity * unitPrice;
    const usageDate = data.usageDate || new Date();
    const billingPeriod = this.getBillingPeriod(usageDate);

    const usageRecord = await prisma.usageRecord.create({
      data: {
        tenantId,
        clientId: data.clientId,
        subscriptionId: data.subscriptionId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice,
        totalCost,
        usageDate,
        billingPeriod,
        metadata: data.metadata || {},
      },
      include: {
        client: true,
        subscription: true,
      },
    });

    // Update real-time consumption metrics
    await this.updateConsumptionMetrics(tenantId, data);

    return usageRecord;
  }

  async trackSpaceUsage(tenantId: string, spaceId: string, userId: string, startTime: Date, endTime: Date) {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
    
    const space = await prisma.space.findFirst({
      where: { id: spaceId, tenantId },
    });

    if (!space) {
      throw new Error('Space not found');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { client: true },
    });

    if (!user || !user.client) {
      throw new Error('User or client not found');
    }

    const unitPrice = space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : 0;

    return await this.trackConsumption(tenantId, {
      clientId: user.clientId!,
      resourceType: UsageResourceType.SPACE_BOOKING,
      resourceId: spaceId,
      quantity: duration,
      unit: 'hours',
      unitPrice,
      usageDate: startTime,
      metadata: {
        spaceType: space.type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        userId,
      },
    });
  }

  async trackServiceUsage(tenantId: string, serviceId: string, userId: string, quantity: number) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { client: true },
    });

    if (!user || !user.client) {
      throw new Error('User or client not found');
    }

    const unitPrice = parseFloat(service.price.toString());

    return await this.trackConsumption(tenantId, {
      clientId: user.clientId!,
      resourceType: UsageResourceType.SERVICE_CONSUMPTION,
      resourceId: serviceId,
      quantity,
      unit: service.unit,
      unitPrice,
      metadata: {
        serviceCategory: service.category,
        serviceName: service.name,
        userId,
      },
    });
  }

  async trackMembershipUsage(tenantId: string, membershipId: string, billingPeriod: string) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
      include: {
        client: true,
        plan: true,
      },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    const unitPrice = parseFloat(membership.plan.price.toString());

    return await this.trackConsumption(tenantId, {
      clientId: membership.clientId,
      resourceType: UsageResourceType.MEMBERSHIP_PLAN,
      resourceId: membership.planId,
      quantity: 1,
      unit: 'month',
      unitPrice,
      metadata: {
        membershipId,
        planType: membership.plan.type,
        billingCycle: membership.plan.billingCycle,
        billingPeriod,
      },
    });
  }

  // ============================================================================
  // CONSUMPTION ANALYTICS
  // ============================================================================

  async getConsumptionSummary(
    tenantId: string, 
    clientId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ConsumptionSummary[]> {
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        tenantId,
        clientId,
        usageDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { usageDate: 'desc' },
    });

    // Group by resource
    const groupedUsage = usageRecords.reduce((acc, record) => {
      const key = `${record.resourceType}_${record.resourceId}`;
      
      if (!acc[key]) {
        acc[key] = {
          resourceType: record.resourceType,
          resourceId: record.resourceId,
          records: [],
          totalQuantity: 0,
          totalCost: 0,
          unit: record.unit,
        };
      }
      
      acc[key].records.push(record);
      acc[key].totalQuantity += parseFloat(record.quantity.toString());
      acc[key].totalCost += parseFloat(record.totalCost.toString());
      
      return acc;
    }, {} as Record<string, any>);

    const summaries: ConsumptionSummary[] = [];

    for (const [key, group] of Object.entries(groupedUsage)) {
      const resourceName = await this.getResourceName(tenantId, group.resourceType, group.resourceId);
      const trend = this.calculateUsageTrend(group.records);
      
      summaries.push({
        resourceType: group.resourceType,
        resourceId: group.resourceId,
        resourceName,
        totalQuantity: group.totalQuantity,
        totalCost: group.totalCost,
        unit: group.unit,
        averageUnitPrice: group.totalCost / group.totalQuantity,
        usageCount: group.records.length,
        lastUsed: new Date(Math.max(...group.records.map((r: any) => r.usageDate.getTime()))),
        trend,
      });
    }

    return summaries.sort((a, b) => b.totalCost - a.totalCost);
  }

  async getUsageReport(
    tenantId: string, 
    clientId: string, 
    period: string
  ): Promise<UsageReport> {
    const { startDate, endDate } = this.parsePeriod(period);
    const { startDate: prevStartDate, endDate: prevEndDate } = this.getPreviousPeriod(period);

    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { name: true },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const [currentUsage, previousUsage] = await Promise.all([
      prisma.usageRecord.findMany({
        where: {
          tenantId,
          clientId,
          usageDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.usageRecord.findMany({
        where: {
          tenantId,
          clientId,
          usageDate: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
    ]);

    const totalCost = currentUsage.reduce((sum, record) => 
      sum + parseFloat(record.totalCost.toString()), 0
    );

    const previousTotalCost = previousUsage.reduce((sum, record) => 
      sum + parseFloat(record.totalCost.toString()), 0
    );

    const byResourceType = this.groupByResourceType(currentUsage, totalCost);
    const topResources = await this.getTopResources(tenantId, currentUsage);

    const costChange = totalCost - previousTotalCost;
    const quantityChange = currentUsage.length - previousUsage.length;
    const percentageChange = previousTotalCost > 0 ? (costChange / previousTotalCost) * 100 : 0;

    return {
      period,
      clientId,
      clientName: client.name,
      totalCost,
      byResourceType,
      topResources,
      comparisonToPrevious: {
        costChange,
        quantityChange,
        percentageChange,
      },
    };
  }

  async getConsumptionTrends(
    tenantId: string, 
    clientId?: string, 
    resourceType?: UsageResourceType,
    months: number = 12
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const where: any = {
      tenantId,
      usageDate: { gte: startDate, lte: endDate },
    };

    if (clientId) where.clientId = clientId;
    if (resourceType) where.resourceType = resourceType;

    const usageRecords = await prisma.usageRecord.findMany({
      where,
      orderBy: { usageDate: 'asc' },
    });

    // Group by month
    const monthlyData = usageRecords.reduce((acc, record) => {
      const monthKey = record.usageDate.toISOString().substring(0, 7); // YYYY-MM
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalQuantity: 0,
          totalCost: 0,
          recordCount: 0,
        };
      }
      
      acc[monthKey].totalQuantity += parseFloat(record.quantity.toString());
      acc[monthKey].totalCost += parseFloat(record.totalCost.toString());
      acc[monthKey].recordCount += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).sort((a: any, b: any) => 
      a.month.localeCompare(b.month)
    );
  }

  // ============================================================================
  // BILLING INTEGRATION
  // ============================================================================

  async getUnbilledUsage(tenantId: string, clientId?: string, billingPeriod?: string) {
    const where: any = {
      tenantId,
      invoiced: false,
    };

    if (clientId) where.clientId = clientId;
    if (billingPeriod) where.billingPeriod = billingPeriod;

    return await prisma.usageRecord.findMany({
      where,
      include: {
        client: true,
        subscription: true,
      },
      orderBy: { usageDate: 'desc' },
    });
  }

  async markUsageAsBilled(tenantId: string, usageRecordIds: string[], invoiceId: string) {
    return await prisma.usageRecord.updateMany({
      where: {
        id: { in: usageRecordIds },
        tenantId,
      },
      data: {
        invoiced: true,
        invoiceId,
      },
    });
  }

  async getUsageForBilling(tenantId: string, subscriptionId: string, billingPeriod: string) {
    return await prisma.usageRecord.findMany({
      where: {
        tenantId,
        subscriptionId,
        billingPeriod,
        invoiced: false,
      },
      include: {
        client: true,
        subscription: true,
      },
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getResourcePrice(tenantId: string, resourceType: UsageResourceType, resourceId: string): Promise<number> {
    switch (resourceType) {
      case UsageResourceType.SPACE_BOOKING:
        const space = await prisma.space.findFirst({
          where: { id: resourceId, tenantId },
        });
        return space?.hourlyRate ? parseFloat(space.hourlyRate.toString()) : 0;

      case UsageResourceType.SERVICE_CONSUMPTION:
        const service = await prisma.service.findFirst({
          where: { id: resourceId, tenantId },
        });
        return service ? parseFloat(service.price.toString()) : 0;

      case UsageResourceType.MEMBERSHIP_PLAN:
        const plan = await prisma.plan.findFirst({
          where: { id: resourceId, tenantId },
        });
        return plan ? parseFloat(plan.price.toString()) : 0;

      default:
        return 0;
    }
  }

  private async getResourceName(tenantId: string, resourceType: UsageResourceType, resourceId: string): Promise<string> {
    switch (resourceType) {
      case UsageResourceType.SPACE_BOOKING:
        const space = await prisma.space.findFirst({
          where: { id: resourceId, tenantId },
          select: { name: true },
        });
        return space?.name || 'Unknown Space';

      case UsageResourceType.SERVICE_CONSUMPTION:
        const service = await prisma.service.findFirst({
          where: { id: resourceId, tenantId },
          select: { name: true },
        });
        return service?.name || 'Unknown Service';

      case UsageResourceType.MEMBERSHIP_PLAN:
        const plan = await prisma.plan.findFirst({
          where: { id: resourceId, tenantId },
          select: { name: true },
        });
        return plan?.name || 'Unknown Plan';

      default:
        return 'Unknown Resource';
    }
  }

  private getBillingPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return { startDate, endDate };
  }

  private getPreviousPeriod(period: string): { startDate: Date; endDate: Date } {
    const [year, month] = period.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);
    return { startDate, endDate };
  }

  private calculateUsageTrend(records: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (records.length < 2) return 'stable';
    
    const sortedRecords = records.sort((a, b) => a.usageDate.getTime() - b.usageDate.getTime());
    const midpoint = Math.floor(records.length / 2);
    
    const firstHalf = sortedRecords.slice(0, midpoint);
    const secondHalf = sortedRecords.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + parseFloat(r.quantity.toString()), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + parseFloat(r.quantity.toString()), 0) / secondHalf.length;
    
    const changeThreshold = 0.1; // 10% change threshold
    const percentageChange = Math.abs(secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    
    if (percentageChange < changeThreshold) return 'stable';
    return secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
  }

  private groupByResourceType(records: any[], totalCost: number): Record<UsageResourceType, any> {
    const grouped = records.reduce((acc, record) => {
      const type = record.resourceType;
      
      if (!acc[type]) {
        acc[type] = {
          quantity: 0,
          cost: 0,
          percentage: 0,
        };
      }
      
      acc[type].quantity += parseFloat(record.quantity.toString());
      acc[type].cost += parseFloat(record.totalCost.toString());
      
      return acc;
    }, {} as Record<UsageResourceType, any>);

    // Calculate percentages
    Object.keys(grouped).forEach(type => {
      grouped[type as UsageResourceType].percentage = totalCost > 0 
        ? (grouped[type as UsageResourceType].cost / totalCost) * 100 
        : 0;
    });

    return grouped;
  }

  private async getTopResources(tenantId: string, records: any[]): Promise<any[]> {
    const resourceTotals = records.reduce((acc, record) => {
      const key = record.resourceId;
      
      if (!acc[key]) {
        acc[key] = {
          resourceId: record.resourceId,
          resourceType: record.resourceType,
          quantity: 0,
          cost: 0,
        };
      }
      
      acc[key].quantity += parseFloat(record.quantity.toString());
      acc[key].cost += parseFloat(record.totalCost.toString());
      
      return acc;
    }, {} as Record<string, any>);

    const topResources = Object.values(resourceTotals)
      .sort((a: any, b: any) => b.cost - a.cost)
      .slice(0, 10);

    // Add resource names
    for (const resource of topResources) {
      resource.resourceName = await this.getResourceName(
        tenantId, 
        resource.resourceType, 
        resource.resourceId
      );
    }

    return topResources;
  }

  private async updateConsumptionMetrics(tenantId: string, data: TrackConsumptionData) {
    // This could update real-time metrics, quotas, alerts, etc.
    // For now, we'll keep it simple but this is where you'd add:
    // - Quota checks
    // - Usage alerts
    // - Real-time dashboards updates
    // - Notifications for unusual usage patterns
  }
}

export const consumptionTrackingService = new ConsumptionTrackingService();
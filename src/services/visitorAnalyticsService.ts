import { prisma } from '../lib/prisma';
import {
  VisitorStatus,
  VisitorPurpose,
  AnalyticsPeriod,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface VisitorAnalyticsData {
  id: string;
  date: Date;
  period: AnalyticsPeriod;
  totalVisitors: number;
  uniqueVisitors: number;
  returningVisitors: number;
  averageVisitDuration?: number;
  onTimeArrivals: number;
  lateArrivals: number;
  earlyDepartures: number;
  noShows: number;
  preRegistrations: number;
  walkIns: number;
  purposeBreakdown: Record<string, number>;
  peakHour?: string;
  peakDay?: string;
  busyHours: string[];
  hostUtilization: Record<string, number>;
  accessCodesGenerated: number;
  accessCodesUsed: number;
  companyBreakdown: Record<string, number>;
  visitorSources: Record<string, number>;
  averageProcessingTime?: number;
  automationRate?: number;
  weekOverWeekGrowth?: number;
  monthOverMonthGrowth?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  period?: AnalyticsPeriod;
  hostUserId?: string;
  purpose?: VisitorPurpose;
  includeWeekends?: boolean;
}

export interface VisitorTrends {
  period: string;
  totalVisitors: number;
  uniqueVisitors: number;
  averageDuration: number;
  conversionRate: number;
  satisfactionScore?: number;
  growthRate: number;
}

export interface PeakAnalysis {
  peakHours: Array<{
    hour: number;
    visitorCount: number;
    averageDuration: number;
  }>;
  peakDays: Array<{
    dayOfWeek: number;
    dayName: string;
    visitorCount: number;
    averageDuration: number;
  }>;
  seasonalPatterns: Array<{
    month: number;
    monthName: string;
    visitorCount: number;
    averageDuration: number;
  }>;
}

export interface HostPerformance {
  hostId: string;
  hostName: string;
  totalVisitors: number;
  averageVisitDuration: number;
  onTimeRate: number;
  preRegistrationRate: number;
  noShowRate: number;
  visitorSatisfaction?: number;
  responseTime: number;
}

export interface ConversionFunnel {
  preRegistrations: number;
  approved: number;
  checkedIn: number;
  completed: number;
  approvalRate: number;
  showUpRate: number;
  completionRate: number;
}

export interface SecurityMetrics {
  totalAccessAttempts: number;
  successfulAccess: number;
  failedAttempts: number;
  violations: number;
  averageAccessTime: number;
  suspiciousActivity: number;
  complianceRate: number;
}

// ============================================================================
// VISITOR ANALYTICS SERVICE
// ============================================================================

class VisitorAnalyticsService {

  // ============================================================================
  // ANALYTICS GENERATION
  // ============================================================================

  async generateDailyAnalytics(
    tenantId: string,
    date: Date = new Date()
  ): Promise<VisitorAnalyticsData> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all visitors for the day
      const visitors = await prisma.visitor.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          accessCodes: true,
          visitorLogs: true
        }
      });

      // Get access code usage for the day
      const accessCodeUsage = await prisma.accessCodeUsage.findMany({
        where: {
          usedAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          accessCode: {
            tenantId
          }
        }
      });

      // Calculate metrics
      const analytics = await this.calculateAnalytics(
        tenantId,
        visitors,
        accessCodeUsage,
        date,
        AnalyticsPeriod.DAILY
      );

      // Save to database
      const savedAnalytics = await prisma.visitorAnalytics.upsert({
        where: {
          tenantId_date_period: {
            tenantId,
            date: startOfDay,
            period: AnalyticsPeriod.DAILY
          }
        },
        update: analytics,
        create: {
          tenantId,
          date: startOfDay,
          period: AnalyticsPeriod.DAILY,
          ...analytics
        }
      });

      logger.info('Daily analytics generated', { 
        tenantId, 
        date: startOfDay, 
        totalVisitors: analytics.totalVisitors 
      });

      return this.mapAnalyticsToData(savedAnalytics);
    } catch (error) {
      logger.error('Failed to generate daily analytics', { tenantId, date }, error as Error);
      throw error;
    }
  }

  async generateWeeklyAnalytics(
    tenantId: string,
    weekStartDate: Date = new Date()
  ): Promise<VisitorAnalyticsData> {
    try {
      // Calculate week boundaries
      const startOfWeek = new Date(weekStartDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Get daily analytics for the week
      const dailyAnalytics = await prisma.visitorAnalytics.findMany({
        where: {
          tenantId,
          period: AnalyticsPeriod.DAILY,
          date: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        }
      });

      // Aggregate weekly metrics
      const weeklyMetrics = this.aggregateAnalytics(dailyAnalytics);

      // Calculate growth rates
      const previousWeekStart = new Date(startOfWeek);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(endOfWeek);
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

      const previousWeekAnalytics = await prisma.visitorAnalytics.findMany({
        where: {
          tenantId,
          period: AnalyticsPeriod.DAILY,
          date: {
            gte: previousWeekStart,
            lte: previousWeekEnd
          }
        }
      });

      const previousWeekMetrics = this.aggregateAnalytics(previousWeekAnalytics);
      const weekOverWeekGrowth = this.calculateGrowthRate(
        weeklyMetrics.totalVisitors,
        previousWeekMetrics.totalVisitors
      );

      const analytics = {
        ...weeklyMetrics,
        weekOverWeekGrowth
      };

      // Save weekly analytics
      const savedAnalytics = await prisma.visitorAnalytics.upsert({
        where: {
          tenantId_date_period: {
            tenantId,
            date: startOfWeek,
            period: AnalyticsPeriod.WEEKLY
          }
        },
        update: analytics,
        create: {
          tenantId,
          date: startOfWeek,
          period: AnalyticsPeriod.WEEKLY,
          ...analytics
        }
      });

      logger.info('Weekly analytics generated', { 
        tenantId, 
        weekStart: startOfWeek, 
        totalVisitors: analytics.totalVisitors 
      });

      return this.mapAnalyticsToData(savedAnalytics);
    } catch (error) {
      logger.error('Failed to generate weekly analytics', { 
        tenantId, 
        weekStartDate 
      }, error as Error);
      throw error;
    }
  }

  async generateMonthlyAnalytics(
    tenantId: string,
    month: number,
    year: number
  ): Promise<VisitorAnalyticsData> {
    try {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      // Get daily analytics for the month
      const dailyAnalytics = await prisma.visitorAnalytics.findMany({
        where: {
          tenantId,
          period: AnalyticsPeriod.DAILY,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      // Aggregate monthly metrics
      const monthlyMetrics = this.aggregateAnalytics(dailyAnalytics);

      // Calculate month-over-month growth
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;
      
      const previousMonthStart = new Date(previousYear, previousMonth - 1, 1);
      const previousMonthEnd = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999);

      const previousMonthAnalytics = await prisma.visitorAnalytics.findMany({
        where: {
          tenantId,
          period: AnalyticsPeriod.DAILY,
          date: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        }
      });

      const previousMonthMetrics = this.aggregateAnalytics(previousMonthAnalytics);
      const monthOverMonthGrowth = this.calculateGrowthRate(
        monthlyMetrics.totalVisitors,
        previousMonthMetrics.totalVisitors
      );

      const analytics = {
        ...monthlyMetrics,
        monthOverMonthGrowth
      };

      // Save monthly analytics
      const savedAnalytics = await prisma.visitorAnalytics.upsert({
        where: {
          tenantId_date_period: {
            tenantId,
            date: startOfMonth,
            period: AnalyticsPeriod.MONTHLY
          }
        },
        update: analytics,
        create: {
          tenantId,
          date: startOfMonth,
          period: AnalyticsPeriod.MONTHLY,
          ...analytics
        }
      });

      logger.info('Monthly analytics generated', { 
        tenantId, 
        month, 
        year, 
        totalVisitors: analytics.totalVisitors 
      });

      return this.mapAnalyticsToData(savedAnalytics);
    } catch (error) {
      logger.error('Failed to generate monthly analytics', { 
        tenantId, 
        month, 
        year 
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS RETRIEVAL
  // ============================================================================

  async getAnalytics(
    tenantId: string,
    filters: AnalyticsFilter,
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{ analytics: VisitorAnalyticsData[]; total: number }> {
    try {
      const whereClause: any = {
        tenantId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      };

      if (filters.period) {
        whereClause.period = filters.period;
      }

      const [analytics, total] = await Promise.all([
        prisma.visitorAnalytics.findMany({
          where: whereClause,
          orderBy: { date: 'desc' },
          skip: pagination.skip,
          take: pagination.take
        }),
        prisma.visitorAnalytics.count({ where: whereClause })
      ]);

      return {
        analytics: analytics.map(this.mapAnalyticsToData),
        total
      };
    } catch (error) {
      logger.error('Failed to get analytics', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getVisitorTrends(
    tenantId: string,
    period: AnalyticsPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<VisitorTrends[]> {
    try {
      const analytics = await prisma.visitorAnalytics.findMany({
        where: {
          tenantId,
          period,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      });

      return analytics.map((item, index) => {
        const previousItem = index > 0 ? analytics[index - 1] : null;
        const growthRate = previousItem 
          ? this.calculateGrowthRate(item.totalVisitors, previousItem.totalVisitors)
          : 0;

        return {
          period: this.formatPeriod(item.date, period),
          totalVisitors: item.totalVisitors,
          uniqueVisitors: item.uniqueVisitors,
          averageDuration: item.averageVisitDuration || 0,
          conversionRate: this.calculateConversionRate(item.preRegistrations, item.totalVisitors),
          growthRate
        };
      });
    } catch (error) {
      logger.error('Failed to get visitor trends', { 
        tenantId, 
        period, 
        startDate, 
        endDate 
      }, error as Error);
      throw error;
    }
  }

  async getPeakAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PeakAnalysis> {
    try {
      // Get all visitors in the date range
      const visitors = await prisma.visitor.findMany({
        where: {
          tenantId,
          checkedInAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Analyze peak hours
      const hourCounts = new Array(24).fill(0);
      const hourDurations = new Array(24).fill(0);
      
      visitors.forEach(visitor => {
        if (visitor.checkedInAt) {
          const hour = visitor.checkedInAt.getHours();
          hourCounts[hour]++;
          if (visitor.actualDuration) {
            hourDurations[hour] += visitor.actualDuration;
          }
        }
      });

      const peakHours = hourCounts.map((count, hour) => ({
        hour,
        visitorCount: count,
        averageDuration: count > 0 ? hourDurations[hour] / count : 0
      })).filter(h => h.visitorCount > 0);

      // Analyze peak days
      const dayCounts = new Array(7).fill(0);
      const dayDurations = new Array(7).fill(0);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      visitors.forEach(visitor => {
        if (visitor.checkedInAt) {
          const dayOfWeek = visitor.checkedInAt.getDay();
          dayCounts[dayOfWeek]++;
          if (visitor.actualDuration) {
            dayDurations[dayOfWeek] += visitor.actualDuration;
          }
        }
      });

      const peakDays = dayCounts.map((count, dayOfWeek) => ({
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        visitorCount: count,
        averageDuration: count > 0 ? dayDurations[dayOfWeek] / count : 0
      })).filter(d => d.visitorCount > 0);

      // Analyze seasonal patterns
      const monthCounts = new Array(12).fill(0);
      const monthDurations = new Array(12).fill(0);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      visitors.forEach(visitor => {
        if (visitor.checkedInAt) {
          const month = visitor.checkedInAt.getMonth();
          monthCounts[month]++;
          if (visitor.actualDuration) {
            monthDurations[month] += visitor.actualDuration;
          }
        }
      });

      const seasonalPatterns = monthCounts.map((count, month) => ({
        month: month + 1,
        monthName: monthNames[month],
        visitorCount: count,
        averageDuration: count > 0 ? monthDurations[month] / count : 0
      })).filter(m => m.visitorCount > 0);

      return {
        peakHours: peakHours.sort((a, b) => b.visitorCount - a.visitorCount),
        peakDays: peakDays.sort((a, b) => b.visitorCount - a.visitorCount),
        seasonalPatterns: seasonalPatterns.sort((a, b) => b.visitorCount - a.visitorCount)
      };
    } catch (error) {
      logger.error('Failed to get peak analysis', { 
        tenantId, 
        startDate, 
        endDate 
      }, error as Error);
      throw error;
    }
  }

  async getHostPerformance(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    hostUserId?: string
  ): Promise<HostPerformance[]> {
    try {
      const whereClause: any = {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (hostUserId) {
        whereClause.hostUserId = hostUserId;
      }

      const visitors = await prisma.visitor.findMany({
        where: whereClause,
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          preRegistration: true
        }
      });

      // Group by host
      const hostGroups = new Map<string, any[]>();
      visitors.forEach(visitor => {
        const hostId = visitor.hostUserId;
        if (!hostGroups.has(hostId)) {
          hostGroups.set(hostId, []);
        }
        hostGroups.get(hostId)!.push(visitor);
      });

      const hostPerformance: HostPerformance[] = [];

      for (const [hostId, hostVisitors] of hostGroups) {
        const host = hostVisitors[0].host;
        const totalVisitors = hostVisitors.length;
        
        // Calculate metrics
        const checkedInVisitors = hostVisitors.filter(v => v.checkedInAt);
        const completedVisitors = hostVisitors.filter(v => v.status === VisitorStatus.CHECKED_OUT);
        const onTimeVisitors = hostVisitors.filter(v => 
          v.checkedInAt && v.validFrom && v.checkedInAt <= v.validFrom
        );
        const preRegisteredVisitors = hostVisitors.filter(v => v.preRegistrationId);
        const noShowVisitors = hostVisitors.filter(v => v.status === VisitorStatus.EXPIRED);

        const averageVisitDuration = completedVisitors.length > 0
          ? completedVisitors.reduce((sum, v) => sum + (v.actualDuration || 0), 0) / completedVisitors.length
          : 0;

        const onTimeRate = checkedInVisitors.length > 0 
          ? (onTimeVisitors.length / checkedInVisitors.length) * 100 
          : 0;

        const preRegistrationRate = totalVisitors > 0 
          ? (preRegisteredVisitors.length / totalVisitors) * 100 
          : 0;

        const noShowRate = totalVisitors > 0 
          ? (noShowVisitors.length / totalVisitors) * 100 
          : 0;

        // Calculate average response time (simplified)
        const responseTime = preRegisteredVisitors.length > 0
          ? preRegisteredVisitors.reduce((sum, v) => {
              if (v.preRegistration?.approvedAt && v.preRegistration?.createdAt) {
                return sum + (v.preRegistration.approvedAt.getTime() - v.preRegistration.createdAt.getTime());
              }
              return sum;
            }, 0) / preRegisteredVisitors.length / (1000 * 60) // Convert to minutes
          : 0;

        hostPerformance.push({
          hostId,
          hostName: `${host.firstName} ${host.lastName}`,
          totalVisitors,
          averageVisitDuration,
          onTimeRate,
          preRegistrationRate,
          noShowRate,
          responseTime
        });
      }

      return hostPerformance.sort((a, b) => b.totalVisitors - a.totalVisitors);
    } catch (error) {
      logger.error('Failed to get host performance', { 
        tenantId, 
        startDate, 
        endDate 
      }, error as Error);
      throw error;
    }
  }

  async getConversionFunnel(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConversionFunnel> {
    try {
      // Get pre-registrations
      const preRegistrations = await prisma.visitorPreRegistration.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const approved = await prisma.visitorPreRegistration.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          isApproved: true
        }
      });

      // Get visitors (checked in)
      const checkedIn = await prisma.visitor.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: [VisitorStatus.CHECKED_IN, VisitorStatus.CHECKED_OUT] }
        }
      });

      const completed = await prisma.visitor.count({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: VisitorStatus.CHECKED_OUT
        }
      });

      // Calculate rates
      const approvalRate = preRegistrations > 0 ? (approved / preRegistrations) * 100 : 0;
      const showUpRate = approved > 0 ? (checkedIn / approved) * 100 : 0;
      const completionRate = checkedIn > 0 ? (completed / checkedIn) * 100 : 0;

      return {
        preRegistrations,
        approved,
        checkedIn,
        completed,
        approvalRate,
        showUpRate,
        completionRate
      };
    } catch (error) {
      logger.error('Failed to get conversion funnel', { 
        tenantId, 
        startDate, 
        endDate 
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async calculateAnalytics(
    tenantId: string,
    visitors: any[],
    accessCodeUsage: any[],
    date: Date,
    period: AnalyticsPeriod
  ): Promise<any> {
    const totalVisitors = visitors.length;
    const uniqueVisitors = new Set(visitors.map(v => v.email || `${v.firstName}_${v.lastName}`)).size;
    const returningVisitors = totalVisitors - uniqueVisitors;

    // Calculate timing metrics
    const onTimeArrivals = visitors.filter(v => 
      v.checkedInAt && v.validFrom && v.checkedInAt <= v.validFrom
    ).length;
    
    const lateArrivals = visitors.filter(v => 
      v.checkedInAt && v.validFrom && v.checkedInAt > v.validFrom
    ).length;

    const earlyDepartures = visitors.filter(v => 
      v.checkedOutAt && v.validUntil && v.checkedOutAt < v.validUntil
    ).length;

    const noShows = visitors.filter(v => v.status === VisitorStatus.EXPIRED).length;

    // Calculate visit types
    const preRegistrations = visitors.filter(v => v.preRegistrationId).length;
    const walkIns = totalVisitors - preRegistrations;

    // Calculate average duration
    const completedVisitors = visitors.filter(v => v.actualDuration);
    const averageVisitDuration = completedVisitors.length > 0
      ? completedVisitors.reduce((sum, v) => sum + v.actualDuration, 0) / completedVisitors.length
      : undefined;

    // Purpose breakdown
    const purposeBreakdown: Record<string, number> = {};
    visitors.forEach(v => {
      purposeBreakdown[v.purpose] = (purposeBreakdown[v.purpose] || 0) + 1;
    });

    // Peak hour analysis
    const hourCounts = new Array(24).fill(0);
    visitors.forEach(v => {
      if (v.checkedInAt) {
        const hour = v.checkedInAt.getHours();
        hourCounts[hour]++;
      }
    });

    const maxCount = Math.max(...hourCounts);
    const peakHourIndex = hourCounts.indexOf(maxCount);
    const peakHour = maxCount > 0 ? `${peakHourIndex.toString().padStart(2, '0')}:00` : undefined;

    const busyHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(h => `${h.hour.toString().padStart(2, '0')}:00`);

    // Host utilization
    const hostUtilization: Record<string, number> = {};
    visitors.forEach(v => {
      const hostKey = `${v.host?.firstName || 'Unknown'} ${v.host?.lastName || ''}`.trim();
      hostUtilization[hostKey] = (hostUtilization[hostKey] || 0) + 1;
    });

    // Access code metrics
    const accessCodesGenerated = visitors.reduce((sum, v) => sum + (v.accessCodes?.length || 0), 0);
    const accessCodesUsed = accessCodeUsage.length;

    // Company breakdown
    const companyBreakdown: Record<string, number> = {};
    visitors.forEach(v => {
      const company = v.company || 'Unknown';
      companyBreakdown[company] = (companyBreakdown[company] || 0) + 1;
    });

    // Visitor sources (simplified)
    const visitorSources: Record<string, number> = {
      'Pre-Registration': preRegistrations,
      'Walk-In': walkIns
    };

    // Processing time (simplified)
    const checkInTimes = visitors
      .filter(v => v.checkedInAt && v.createdAt)
      .map(v => (v.checkedInAt.getTime() - v.createdAt.getTime()) / 1000);
    
    const averageProcessingTime = checkInTimes.length > 0
      ? checkInTimes.reduce((sum, time) => sum + time, 0) / checkInTimes.length
      : undefined;

    // Automation rate
    const automatedProcesses = visitors.filter(v => v.preRegistrationId).length;
    const automationRate = totalVisitors > 0 ? (automatedProcesses / totalVisitors) * 100 : undefined;

    return {
      totalVisitors,
      uniqueVisitors,
      returningVisitors,
      averageVisitDuration,
      onTimeArrivals,
      lateArrivals,
      earlyDepartures,
      noShows,
      preRegistrations,
      walkIns,
      purposeBreakdown,
      peakHour,
      busyHours,
      hostUtilization,
      accessCodesGenerated,
      accessCodesUsed,
      companyBreakdown,
      visitorSources,
      averageProcessingTime,
      automationRate
    };
  }

  private aggregateAnalytics(analyticsArray: any[]): any {
    if (analyticsArray.length === 0) {
      return {
        totalVisitors: 0,
        uniqueVisitors: 0,
        returningVisitors: 0,
        onTimeArrivals: 0,
        lateArrivals: 0,
        earlyDepartures: 0,
        noShows: 0,
        preRegistrations: 0,
        walkIns: 0,
        accessCodesGenerated: 0,
        accessCodesUsed: 0,
        purposeBreakdown: {},
        hostUtilization: {},
        companyBreakdown: {},
        visitorSources: {},
        busyHours: []
      };
    }

    const aggregated = analyticsArray.reduce((acc, curr) => {
      acc.totalVisitors += curr.totalVisitors;
      acc.uniqueVisitors += curr.uniqueVisitors;
      acc.returningVisitors += curr.returningVisitors;
      acc.onTimeArrivals += curr.onTimeArrivals;
      acc.lateArrivals += curr.lateArrivals;
      acc.earlyDepartures += curr.earlyDepartures;
      acc.noShows += curr.noShows;
      acc.preRegistrations += curr.preRegistrations;
      acc.walkIns += curr.walkIns;
      acc.accessCodesGenerated += curr.accessCodesGenerated;
      acc.accessCodesUsed += curr.accessCodesUsed;

      // Merge objects
      this.mergeBreakdown(acc.purposeBreakdown, curr.purposeBreakdown);
      this.mergeBreakdown(acc.hostUtilization, curr.hostUtilization);
      this.mergeBreakdown(acc.companyBreakdown, curr.companyBreakdown);
      this.mergeBreakdown(acc.visitorSources, curr.visitorSources);

      return acc;
    }, {
      totalVisitors: 0,
      uniqueVisitors: 0,
      returningVisitors: 0,
      onTimeArrivals: 0,
      lateArrivals: 0,
      earlyDepartures: 0,
      noShows: 0,
      preRegistrations: 0,
      walkIns: 0,
      accessCodesGenerated: 0,
      accessCodesUsed: 0,
      purposeBreakdown: {},
      hostUtilization: {},
      companyBreakdown: {},
      visitorSources: {},
      busyHours: []
    });

    // Calculate average duration
    const durationsWithValues = analyticsArray.filter(a => a.averageVisitDuration);
    if (durationsWithValues.length > 0) {
      aggregated.averageVisitDuration = durationsWithValues.reduce(
        (sum, a) => sum + a.averageVisitDuration, 0
      ) / durationsWithValues.length;
    }

    return aggregated;
  }

  private mergeBreakdown(target: Record<string, number>, source: Record<string, number>): void {
    Object.entries(source).forEach(([key, value]) => {
      target[key] = (target[key] || 0) + value;
    });
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculateConversionRate(preRegistrations: number, totalVisitors: number): number {
    return totalVisitors > 0 ? (preRegistrations / totalVisitors) * 100 : 0;
  }

  private formatPeriod(date: Date, period: AnalyticsPeriod): string {
    switch (period) {
      case AnalyticsPeriod.DAILY:
        return date.toISOString().split('T')[0];
      case AnalyticsPeriod.WEEKLY:
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Week of ${weekStart.toISOString().split('T')[0]}`;
      case AnalyticsPeriod.MONTHLY:
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case AnalyticsPeriod.QUARTERLY:
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case AnalyticsPeriod.YEARLY:
        return date.getFullYear().toString();
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private mapAnalyticsToData(analytics: any): VisitorAnalyticsData {
    return {
      id: analytics.id,
      date: analytics.date,
      period: analytics.period,
      totalVisitors: analytics.totalVisitors,
      uniqueVisitors: analytics.uniqueVisitors,
      returningVisitors: analytics.returningVisitors,
      averageVisitDuration: analytics.averageVisitDuration,
      onTimeArrivals: analytics.onTimeArrivals,
      lateArrivals: analytics.lateArrivals,
      earlyDepartures: analytics.earlyDepartures,
      noShows: analytics.noShows,
      preRegistrations: analytics.preRegistrations,
      walkIns: analytics.walkIns,
      purposeBreakdown: analytics.purposeBreakdown,
      peakHour: analytics.peakHour,
      peakDay: analytics.peakDay,
      busyHours: analytics.busyHours,
      hostUtilization: analytics.hostUtilization,
      accessCodesGenerated: analytics.accessCodesGenerated,
      accessCodesUsed: analytics.accessCodesUsed,
      companyBreakdown: analytics.companyBreakdown,
      visitorSources: analytics.visitorSources,
      averageProcessingTime: analytics.averageProcessingTime,
      automationRate: analytics.automationRate,
      weekOverWeekGrowth: analytics.weekOverWeekGrowth,
      monthOverMonthGrowth: analytics.monthOverMonthGrowth,
      createdAt: analytics.createdAt,
      updatedAt: analytics.updatedAt
    };
  }
}

export const visitorAnalyticsService = new VisitorAnalyticsService();
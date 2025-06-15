import { prisma } from '../lib/prisma';
import { ServiceCategory, ServiceType } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface PricingTier {
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: number;
  discountPercentage?: number;
}

export interface DynamicPricingRequest {
  serviceId: string;
  quantity: number;
  requestedDeliveryTime?: Date;
  userId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface PricingResult {
  basePrice: number;
  quantity: number;
  subtotal: number;
  appliedTier?: PricingTier;
  demandMultiplier: number;
  timeMultiplier: number;
  priorityMultiplier: number;
  volumeDiscount: number;
  finalPrice: number;
  savings: number;
  breakdown: Array<{
    description: string;
    amount: number;
    type: 'base' | 'multiplier' | 'discount' | 'fee';
  }>;
}

export interface BulkPricingRule {
  id: string;
  tenantId: string;
  serviceId?: string;
  category?: ServiceCategory;
  serviceType?: ServiceType;
  minQuantity: number;
  discountPercentage: number;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

export interface DemandPricingConfig {
  tenantId: string;
  serviceId: string;
  enableDemandPricing: boolean;
  demandThresholds: Array<{
    requestsPerHour: number;
    multiplier: number;
  }>;
  timeBasedPricing: Array<{
    startHour: number;
    endHour: number;
    multiplier: number;
    daysOfWeek: number[]; // 0-6, 0 = Sunday
  }>;
}

export interface PricingAnalytics {
  averageOrderValue: number;
  totalRevenue: number;
  pricingEfficiency: number; // % of orders using optimal pricing
  demandPricingImpact: number;
  volumeDiscountUtilization: number;
  priceElasticity: number;
  revenueByPriceRange: Array<{
    priceRange: string;
    orderCount: number;
    revenue: number;
  }>;
  optimalPriceRecommendations: Array<{
    serviceId: string;
    serviceName: string;
    currentPrice: number;
    recommendedPrice: number;
    expectedImpact: string;
  }>;
}

// ============================================================================
// SERVICE PRICING SERVICE
// ============================================================================

export class ServicePricingService {

  // ============================================================================
  // DYNAMIC PRICING ENGINE
  // ============================================================================

  async calculatePrice(
    tenantId: string,
    request: DynamicPricingRequest
  ): Promise<PricingResult> {
    try {
      // Get service details
      const service = await prisma.service.findFirst({
        where: {
          id: request.serviceId,
          tenantId,
          isActive: true,
        },
      });

      if (!service) {
        throw new Error('Service not found');
      }

      const basePrice = Number(service.price);
      const quantity = request.quantity;
      let subtotal = basePrice * quantity;

      const breakdown: PricingResult['breakdown'] = [
        {
          description: 'Base price',
          amount: basePrice,
          type: 'base',
        },
      ];

      // Apply pricing tier if available
      let appliedTier: PricingTier | undefined;
      if (service.dynamicPricing && service.pricingTiers) {
        appliedTier = this.findApplicablePricingTier(
          Array.isArray(service.pricingTiers) ? service.pricingTiers : [],
          quantity
        );

        if (appliedTier) {
          subtotal = appliedTier.pricePerUnit * quantity;
          breakdown.push({
            description: `Volume pricing (${quantity} units)`,
            amount: appliedTier.pricePerUnit - basePrice,
            type: 'discount',
          });
        }
      }

      // Calculate demand multiplier
      const demandMultiplier = await this.calculateDemandMultiplier(
        tenantId,
        request.serviceId,
        request.requestedDeliveryTime
      );

      // Calculate time-based multiplier
      const timeMultiplier = this.calculateTimeMultiplier(
        request.requestedDeliveryTime
      );

      // Calculate priority multiplier
      const priorityMultiplier = this.calculatePriorityMultiplier(request.priority);

      // Apply multipliers
      let finalPrice = subtotal;
      
      if (demandMultiplier !== 1) {
        finalPrice *= demandMultiplier;
        breakdown.push({
          description: `Demand adjustment (${demandMultiplier > 1 ? 'high' : 'low'} demand)`,
          amount: subtotal * (demandMultiplier - 1),
          type: demandMultiplier > 1 ? 'fee' : 'discount',
        });
      }

      if (timeMultiplier !== 1) {
        finalPrice *= timeMultiplier;
        breakdown.push({
          description: `Time-based adjustment`,
          amount: finalPrice * (timeMultiplier - 1) / timeMultiplier,
          type: timeMultiplier > 1 ? 'fee' : 'discount',
        });
      }

      if (priorityMultiplier !== 1) {
        finalPrice *= priorityMultiplier;
        breakdown.push({
          description: `Priority adjustment`,
          amount: finalPrice * (priorityMultiplier - 1) / priorityMultiplier,
          type: 'fee',
        });
      }

      // Calculate volume discount
      const volumeDiscount = await this.calculateVolumeDiscount(
        tenantId,
        service,
        quantity
      );

      if (volumeDiscount > 0) {
        finalPrice -= volumeDiscount;
        breakdown.push({
          description: 'Volume discount',
          amount: -volumeDiscount,
          type: 'discount',
        });
      }

      const savings = Math.max(0, (basePrice * quantity) - finalPrice);

      return {
        basePrice,
        quantity,
        subtotal,
        appliedTier,
        demandMultiplier,
        timeMultiplier,
        priorityMultiplier,
        volumeDiscount,
        finalPrice: Math.max(0, finalPrice),
        savings,
        breakdown,
      };
    } catch (error) {
      logger.error('Failed to calculate price', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async bulkCalculatePrice(
    tenantId: string,
    requests: DynamicPricingRequest[]
  ): Promise<PricingResult[]> {
    try {
      const results = await Promise.all(
        requests.map(request => this.calculatePrice(tenantId, request))
      );

      return results;
    } catch (error) {
      logger.error('Failed to bulk calculate prices', { tenantId, requestCount: requests.length }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // PRICING CONFIGURATION
  // ============================================================================

  async updateServicePricingConfig(
    tenantId: string,
    serviceId: string,
    config: {
      price?: number;
      pricingTiers?: PricingTier[];
      dynamicPricing?: boolean;
      minimumOrder?: number;
    }
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (config.price !== undefined) {
        updateData.price = config.price;
      }

      if (config.pricingTiers !== undefined) {
        updateData.pricingTiers = config.pricingTiers;
      }

      if (config.dynamicPricing !== undefined) {
        updateData.dynamicPricing = config.dynamicPricing;
      }

      if (config.minimumOrder !== undefined) {
        updateData.minimumOrder = config.minimumOrder;
      }

      await prisma.service.update({
        where: {
          id: serviceId,
          tenantId,
        },
        data: updateData,
      });

      logger.info('Service pricing config updated', { tenantId, serviceId, config });
    } catch (error) {
      logger.error('Failed to update service pricing config', { tenantId, serviceId, config }, error as Error);
      throw error;
    }
  }

  async createBulkPricingRule(
    tenantId: string,
    rule: Omit<BulkPricingRule, 'id' | 'tenantId'>
  ): Promise<BulkPricingRule> {
    try {
      // For this implementation, we'll store bulk pricing rules in the service metadata
      // In a production system, you might want a dedicated BulkPricingRule model
      
      const ruleData = {
        id: `rule_${Date.now()}`,
        tenantId,
        ...rule,
      };

      // This is a simplified implementation
      // In production, you'd want proper rule storage and conflict resolution
      logger.info('Bulk pricing rule created', { tenantId, rule: ruleData });
      
      return ruleData as BulkPricingRule;
    } catch (error) {
      logger.error('Failed to create bulk pricing rule', { tenantId, rule }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // PRICING OPTIMIZATION
  // ============================================================================

  async analyzePricingPerformance(
    tenantId: string,
    serviceId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PricingAnalytics> {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      const whereClause: any = {
        tenantId,
        ...dateFilter,
      };

      if (serviceId) {
        whereClause.serviceId = serviceId;
      }

      const requests = await prisma.serviceRequest.findMany({
        where: whereClause,
        include: {
          service: true,
        },
      });

      if (requests.length === 0) {
        return {
          averageOrderValue: 0,
          totalRevenue: 0,
          pricingEfficiency: 0,
          demandPricingImpact: 0,
          volumeDiscountUtilization: 0,
          priceElasticity: 0,
          revenueByPriceRange: [],
          optimalPriceRecommendations: [],
        };
      }

      // Calculate basic metrics
      const totalRevenue = requests.reduce((sum, req) => sum + Number(req.totalAmount), 0);
      const averageOrderValue = totalRevenue / requests.length;

      // Analyze price ranges
      const priceRanges = [
        { min: 0, max: 10, label: '$0-$10' },
        { min: 10, max: 50, label: '$10-$50' },
        { min: 50, max: 100, label: '$50-$100' },
        { min: 100, max: 500, label: '$100-$500' },
        { min: 500, max: Infinity, label: '$500+' },
      ];

      const revenueByPriceRange = priceRanges.map(range => {
        const rangeRequests = requests.filter(req => {
          const amount = Number(req.totalAmount);
          return amount >= range.min && amount < range.max;
        });

        return {
          priceRange: range.label,
          orderCount: rangeRequests.length,
          revenue: rangeRequests.reduce((sum, req) => sum + Number(req.totalAmount), 0),
        };
      });

      // Calculate pricing efficiency (simplified)
      const dynamicPricingUsage = requests.filter(req => req.service.dynamicPricing).length;
      const pricingEfficiency = requests.length > 0 ? (dynamicPricingUsage / requests.length) * 100 : 0;

      // Generate optimization recommendations
      const servicePerformance = new Map<string, {
        requests: any[];
        revenue: number;
        avgPrice: number;
      }>();

      requests.forEach(req => {
        const serviceId = req.serviceId;
        const existing = servicePerformance.get(serviceId) || {
          requests: [],
          revenue: 0,
          avgPrice: 0,
        };
        
        existing.requests.push(req);
        existing.revenue += Number(req.totalAmount);
        servicePerformance.set(serviceId, existing);
      });

      const optimalPriceRecommendations = Array.from(servicePerformance.entries())
        .map(([serviceId, performance]) => {
          const avgPrice = performance.revenue / performance.requests.length;
          const service = performance.requests[0].service;
          
          // Simple recommendation logic
          let recommendedPrice = Number(service.price);
          let expectedImpact = 'Maintain current pricing';

          if (performance.requests.length > 20 && avgPrice > Number(service.price) * 1.2) {
            recommendedPrice = Number(service.price) * 1.1;
            expectedImpact = 'Increase revenue by 10-15%';
          } else if (performance.requests.length < 5 && avgPrice < Number(service.price) * 0.8) {
            recommendedPrice = Number(service.price) * 0.9;
            expectedImpact = 'Increase demand by 20-30%';
          }

          return {
            serviceId,
            serviceName: service.name,
            currentPrice: Number(service.price),
            recommendedPrice,
            expectedImpact,
          };
        })
        .filter(rec => rec.recommendedPrice !== rec.currentPrice)
        .slice(0, 5);

      return {
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pricingEfficiency: Math.round(pricingEfficiency * 100) / 100,
        demandPricingImpact: 0, // Would need historical comparison
        volumeDiscountUtilization: 0, // Would need volume discount tracking
        priceElasticity: 0, // Would need price change analysis
        revenueByPriceRange,
        optimalPriceRecommendations,
      };
    } catch (error) {
      logger.error('Failed to analyze pricing performance', { tenantId, serviceId, startDate, endDate }, error as Error);
      throw error;
    }
  }

  async optimizePriceForService(
    tenantId: string,
    serviceId: string,
    targetMetric: 'revenue' | 'volume' | 'profit'
  ): Promise<{
    currentPrice: number;
    recommendedPrice: number;
    expectedChange: string;
    confidence: number;
  }> {
    try {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, tenantId },
      });

      if (!service) {
        throw new Error('Service not found');
      }

      const analytics = await this.analyzePricingPerformance(tenantId, serviceId);
      const currentPrice = Number(service.price);

      // Simplified optimization algorithm
      let recommendedPrice = currentPrice;
      let expectedChange = 'No change recommended';
      let confidence = 0.5;

      const recommendation = analytics.optimalPriceRecommendations.find(
        rec => rec.serviceId === serviceId
      );

      if (recommendation) {
        recommendedPrice = recommendation.recommendedPrice;
        expectedChange = recommendation.expectedImpact;
        confidence = 0.75;
      }

      return {
        currentPrice,
        recommendedPrice,
        expectedChange,
        confidence,
      };
    } catch (error) {
      logger.error('Failed to optimize price for service', { tenantId, serviceId, targetMetric }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // PRICING STRATEGIES
  // ============================================================================

  async applySeasonalPricing(
    tenantId: string,
    serviceIds: string[],
    seasonalMultiplier: number,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    try {
      // In a production system, you'd store seasonal pricing rules
      // For now, we'll update the service metadata to include seasonal info
      
      await Promise.all(
        serviceIds.map(serviceId =>
          prisma.service.update({
            where: { id: serviceId, tenantId },
            data: {
              metadata: {
                seasonalPricing: {
                  multiplier: seasonalMultiplier,
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  appliedAt: new Date().toISOString(),
                },
              },
            },
          })
        )
      );

      logger.info('Seasonal pricing applied', { 
        tenantId, 
        serviceCount: serviceIds.length, 
        multiplier: seasonalMultiplier,
        period: { startDate, endDate }
      });
    } catch (error) {
      logger.error('Failed to apply seasonal pricing', { tenantId, serviceIds, seasonalMultiplier }, error as Error);
      throw error;
    }
  }

  async applyPromotionalPricing(
    tenantId: string,
    serviceId: string,
    discountPercentage: number,
    validUntil: Date,
    conditions?: {
      minimumQuantity?: number;
      maxUses?: number;
      userSegment?: string;
    }
  ): Promise<string> {
    try {
      const promoCode = `PROMO_${Date.now()}`;
      
      // Store promotional pricing in service metadata
      await prisma.service.update({
        where: { id: serviceId, tenantId },
        data: {
          metadata: {
            promotionalPricing: {
              code: promoCode,
              discountPercentage,
              validUntil: validUntil.toISOString(),
              conditions: conditions || {},
              createdAt: new Date().toISOString(),
              isActive: true,
            },
          },
        },
      });

      logger.info('Promotional pricing applied', { 
        tenantId, 
        serviceId, 
        promoCode,
        discountPercentage,
        validUntil 
      });

      return promoCode;
    } catch (error) {
      logger.error('Failed to apply promotional pricing', { tenantId, serviceId, discountPercentage }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private findApplicablePricingTier(
    pricingTiers: any[],
    quantity: number
  ): PricingTier | undefined {
    return pricingTiers
      .filter(tier => 
        quantity >= tier.minQuantity && 
        (!tier.maxQuantity || quantity <= tier.maxQuantity)
      )
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  }

  private async calculateDemandMultiplier(
    tenantId: string,
    serviceId: string,
    requestedDeliveryTime?: Date
  ): Promise<number> {
    try {
      if (!requestedDeliveryTime) return 1;

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Count recent requests for this service
      const recentRequests = await prisma.serviceRequest.count({
        where: {
          tenantId,
          serviceId,
          createdAt: { gte: oneHourAgo },
        },
      });

      // Simple demand-based pricing
      if (recentRequests > 10) return 1.3; // High demand
      if (recentRequests > 5) return 1.15; // Medium demand
      if (recentRequests < 2) return 0.9; // Low demand
      
      return 1; // Normal demand
    } catch (error) {
      logger.error('Failed to calculate demand multiplier', { tenantId, serviceId }, error as Error);
      return 1;
    }
  }

  private calculateTimeMultiplier(requestedDeliveryTime?: Date): number {
    if (!requestedDeliveryTime) return 1;

    const now = new Date();
    const timeDiff = requestedDeliveryTime.getTime() - now.getTime();
    const hoursUntilDelivery = timeDiff / (1000 * 60 * 60);

    // Rush order pricing
    if (hoursUntilDelivery < 1) return 2.0; // Same hour
    if (hoursUntilDelivery < 4) return 1.5; // Same day rush
    if (hoursUntilDelivery < 24) return 1.2; // Next day
    if (hoursUntilDelivery > 168) return 0.95; // More than a week ahead

    return 1;
  }

  private calculatePriorityMultiplier(priority?: string): number {
    switch (priority) {
      case 'URGENT':
        return 1.5;
      case 'HIGH':
        return 1.2;
      case 'LOW':
        return 0.9;
      default:
        return 1;
    }
  }

  private async calculateVolumeDiscount(
    tenantId: string,
    service: any,
    quantity: number
  ): Promise<number> {
    try {
      // Look for bulk pricing rules (simplified implementation)
      if (quantity >= 100) return service.price * quantity * 0.1; // 10% discount
      if (quantity >= 50) return service.price * quantity * 0.05; // 5% discount
      if (quantity >= 20) return service.price * quantity * 0.02; // 2% discount
      
      return 0;
    } catch (error) {
      logger.error('Failed to calculate volume discount', { tenantId, quantity }, error as Error);
      return 0;
    }
  }
}

export const servicePricingService = new ServicePricingService();
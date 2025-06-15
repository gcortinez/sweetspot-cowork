import { prisma } from '../lib/prisma';
import {
  ServiceCategory,
  ServiceType,
  ServiceAvailability,
  Service,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  serviceType: ServiceType;
  availability: ServiceAvailability;
  price: number;
  unit: string;
  maxQuantity?: number;
  requiresApproval: boolean;
  estimatedDeliveryTime?: string;
  instructions?: string;
  tags: string[];
  metadata: Record<string, any>;
  pricingTiers: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
    discountPercentage?: number;
  }>;
  dynamicPricing: boolean;
  minimumOrder: number;
  isActive: boolean;
  averageRating?: number;
  totalReviews: number;
  totalRequests: number;
  providersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceFilter {
  category?: ServiceCategory;
  serviceType?: ServiceType;
  availability?: ServiceAvailability;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  requiresApproval?: boolean;
  tags?: string[];
  search?: string;
}

export interface ServiceCreateRequest {
  name: string;
  description?: string;
  category: ServiceCategory;
  serviceType: ServiceType;
  availability: ServiceAvailability;
  price: number;
  unit?: string;
  maxQuantity?: number;
  requiresApproval?: boolean;
  estimatedDeliveryTime?: string;
  instructions?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  pricingTiers?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
    discountPercentage?: number;
  }>;
  dynamicPricing?: boolean;
  minimumOrder?: number;
}

export interface ServiceUpdateRequest {
  name?: string;
  description?: string;
  category?: ServiceCategory;
  serviceType?: ServiceType;
  availability?: ServiceAvailability;
  price?: number;
  unit?: string;
  maxQuantity?: number;
  requiresApproval?: boolean;
  estimatedDeliveryTime?: string;
  instructions?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  pricingTiers?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
    discountPercentage?: number;
  }>;
  dynamicPricing?: boolean;
  minimumOrder?: number;
  isActive?: boolean;
}

export interface ServiceAnalytics {
  totalServices: number;
  activeServices: number;
  byCategory: Array<{
    category: ServiceCategory;
    count: number;
    totalRevenue: number;
  }>;
  byType: Array<{
    type: ServiceType;
    count: number;
    averagePrice: number;
  }>;
  popularServices: Array<{
    id: string;
    name: string;
    requestCount: number;
    revenue: number;
    rating: number;
  }>;
  revenueMetrics: {
    totalRevenue: number;
    averageOrderValue: number;
    monthlyGrowth: number;
  };
}

// ============================================================================
// SERVICE CATALOG SERVICE
// ============================================================================

export class ServiceCatalogService {

  // ============================================================================
  // SERVICE CRUD OPERATIONS
  // ============================================================================

  async createService(tenantId: string, data: ServiceCreateRequest): Promise<ServiceCatalogItem> {
    try {
      const service = await prisma.service.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description,
          category: data.category,
          serviceType: data.serviceType,
          availability: data.availability,
          price: new Prisma.Decimal(data.price),
          unit: data.unit || 'unit',
          maxQuantity: data.maxQuantity,
          requiresApproval: data.requiresApproval || false,
          estimatedDeliveryTime: data.estimatedDeliveryTime,
          instructions: data.instructions,
          tags: data.tags || [],
          metadata: data.metadata || {},
          pricingTiers: data.pricingTiers || [],
          dynamicPricing: data.dynamicPricing || false,
          minimumOrder: data.minimumOrder || 1,
        },
        include: {
          reviews: true,
          requests: true,
          providers: true,
        },
      });

      return this.mapServiceToItem(service);
    } catch (error) {
      logger.error('Failed to create service', { tenantId, data }, error as Error);
      throw error;
    }
  }

  async updateService(
    tenantId: string,
    serviceId: string,
    data: ServiceUpdateRequest
  ): Promise<ServiceCatalogItem> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
      if (data.availability !== undefined) updateData.availability = data.availability;
      if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.maxQuantity !== undefined) updateData.maxQuantity = data.maxQuantity;
      if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
      if (data.estimatedDeliveryTime !== undefined) updateData.estimatedDeliveryTime = data.estimatedDeliveryTime;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      if (data.pricingTiers !== undefined) updateData.pricingTiers = data.pricingTiers;
      if (data.dynamicPricing !== undefined) updateData.dynamicPricing = data.dynamicPricing;
      if (data.minimumOrder !== undefined) updateData.minimumOrder = data.minimumOrder;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const service = await prisma.service.update({
        where: {
          id: serviceId,
          tenantId,
        },
        data: updateData,
        include: {
          reviews: true,
          requests: true,
          providers: true,
        },
      });

      return this.mapServiceToItem(service);
    } catch (error) {
      logger.error('Failed to update service', { tenantId, serviceId, data }, error as Error);
      throw error;
    }
  }

  async deleteService(tenantId: string, serviceId: string): Promise<void> {
    try {
      await prisma.service.delete({
        where: {
          id: serviceId,
          tenantId,
        },
      });

      logger.info('Service deleted successfully', { tenantId, serviceId });
    } catch (error) {
      logger.error('Failed to delete service', { tenantId, serviceId }, error as Error);
      throw error;
    }
  }

  async getServiceById(tenantId: string, serviceId: string): Promise<ServiceCatalogItem | null> {
    try {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          tenantId,
        },
        include: {
          reviews: true,
          requests: true,
          providers: true,
        },
      });

      return service ? this.mapServiceToItem(service) : null;
    } catch (error) {
      logger.error('Failed to get service by ID', { tenantId, serviceId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // SERVICE CATALOG BROWSING
  // ============================================================================

  async getServiceCatalog(
    tenantId: string,
    filters: ServiceFilter = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    services: ServiceCatalogItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause = this.buildServiceWhereClause(tenantId, filters);
      
      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where: whereClause,
          include: {
            reviews: true,
            requests: true,
            providers: true,
          },
          orderBy: [
            { isActive: 'desc' },
            { name: 'asc' },
          ],
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.service.count({ where: whereClause }),
      ]);

      const catalogItems = services.map(service => this.mapServiceToItem(service));
      const hasMore = (pagination.skip || 0) + catalogItems.length < total;

      return {
        services: catalogItems,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get service catalog', { tenantId, filters, pagination }, error as Error);
      throw error;
    }
  }

  async getServicesByCategory(
    tenantId: string,
    category: ServiceCategory,
    includeInactive = false
  ): Promise<ServiceCatalogItem[]> {
    try {
      const services = await prisma.service.findMany({
        where: {
          tenantId,
          category,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          reviews: true,
          requests: true,
          providers: true,
        },
        orderBy: { name: 'asc' },
      });

      return services.map(service => this.mapServiceToItem(service));
    } catch (error) {
      logger.error('Failed to get services by category', { tenantId, category }, error as Error);
      throw error;
    }
  }

  async getFeaturedServices(
    tenantId: string,
    limit = 10
  ): Promise<ServiceCatalogItem[]> {
    try {
      // Get featured services based on popularity and rating
      const services = await prisma.service.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        include: {
          reviews: true,
          requests: true,
          providers: true,
        },
        take: limit,
      });

      const servicesWithStats = services.map(service => {
        const item = this.mapServiceToItem(service);
        // Calculate popularity score (requests * rating)
        const popularityScore = item.totalRequests * (item.averageRating || 0);
        return { ...item, popularityScore };
      });

      // Sort by popularity score and return top items
      return servicesWithStats
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get featured services', { tenantId }, error as Error);
      throw error;
    }
  }

  async searchServices(
    tenantId: string,
    searchTerm: string,
    filters: ServiceFilter = {}
  ): Promise<ServiceCatalogItem[]> {
    try {
      const whereClause = this.buildServiceWhereClause(tenantId, {
        ...filters,
        search: searchTerm,
      });

      const services = await prisma.service.findMany({
        where: whereClause,
        include: {
          reviews: true,
          requests: true,
          providers: true,
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' },
        ],
      });

      return services.map(service => this.mapServiceToItem(service));
    } catch (error) {
      logger.error('Failed to search services', { tenantId, searchTerm, filters }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // SERVICE ANALYTICS
  // ============================================================================

  async getServiceAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceAnalytics> {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      const [services, requests] = await Promise.all([
        prisma.service.findMany({
          where: { tenantId },
          include: {
            reviews: true,
            requests: {
              where: dateFilter,
            },
          },
        }),
        prisma.serviceRequest.findMany({
          where: {
            tenantId,
            ...dateFilter,
          },
          include: {
            service: true,
          },
        }),
      ]);

      const totalServices = services.length;
      const activeServices = services.filter(s => s.isActive).length;

      // Group by category
      const categoryStats = new Map<ServiceCategory, { count: number; totalRevenue: number }>();
      services.forEach(service => {
        const existing = categoryStats.get(service.category) || { count: 0, totalRevenue: 0 };
        const revenue = service.requests.reduce((sum, req) => sum + Number(req.totalAmount), 0);
        categoryStats.set(service.category, {
          count: existing.count + 1,
          totalRevenue: existing.totalRevenue + revenue,
        });
      });

      const byCategory = Array.from(categoryStats.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        totalRevenue: stats.totalRevenue,
      }));

      // Group by type
      const typeStats = new Map<ServiceType, { count: number; totalPrice: number }>();
      services.forEach(service => {
        const existing = typeStats.get(service.serviceType) || { count: 0, totalPrice: 0 };
        typeStats.set(service.serviceType, {
          count: existing.count + 1,
          totalPrice: existing.totalPrice + Number(service.price),
        });
      });

      const byType = Array.from(typeStats.entries()).map(([type, stats]) => ({
        type,
        count: stats.count,
        averagePrice: stats.count > 0 ? stats.totalPrice / stats.count : 0,
      }));

      // Popular services
      const serviceRequestCounts = new Map<string, number>();
      const serviceRevenues = new Map<string, number>();
      requests.forEach(request => {
        const currentCount = serviceRequestCounts.get(request.serviceId) || 0;
        const currentRevenue = serviceRevenues.get(request.serviceId) || 0;
        serviceRequestCounts.set(request.serviceId, currentCount + 1);
        serviceRevenues.set(request.serviceId, currentRevenue + Number(request.totalAmount));
      });

      const popularServices = services
        .map(service => {
          const requestCount = serviceRequestCounts.get(service.id) || 0;
          const revenue = serviceRevenues.get(service.id) || 0;
          const avgRating = service.reviews.length > 0
            ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length
            : 0;

          return {
            id: service.id,
            name: service.name,
            requestCount,
            revenue,
            rating: avgRating,
          };
        })
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10);

      // Revenue metrics
      const totalRevenue = requests.reduce((sum, req) => sum + Number(req.totalAmount), 0);
      const averageOrderValue = requests.length > 0 ? totalRevenue / requests.length : 0;

      // Calculate monthly growth (simplified)
      const monthlyGrowth = 0; // Would need historical data for accurate calculation

      return {
        totalServices,
        activeServices,
        byCategory,
        byType,
        popularServices,
        revenueMetrics: {
          totalRevenue,
          averageOrderValue,
          monthlyGrowth,
        },
      };
    } catch (error) {
      logger.error('Failed to get service analytics', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildServiceWhereClause(tenantId: string, filters: ServiceFilter): any {
    const whereClause: any = { tenantId };

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.serviceType) {
      whereClause.serviceType = filters.serviceType;
    }

    if (filters.availability) {
      whereClause.availability = filters.availability;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      whereClause.price = {};
      if (filters.minPrice !== undefined) {
        whereClause.price.gte = new Prisma.Decimal(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        whereClause.price.lte = new Prisma.Decimal(filters.maxPrice);
      }
    }

    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters.requiresApproval !== undefined) {
      whereClause.requiresApproval = filters.requiresApproval;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = {
        hasAll: filters.tags,
      };
    }

    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return whereClause;
  }

  private mapServiceToItem(service: any): ServiceCatalogItem {
    const averageRating = service.reviews.length > 0
      ? service.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / service.reviews.length
      : undefined;

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      serviceType: service.serviceType,
      availability: service.availability,
      price: Number(service.price),
      unit: service.unit,
      maxQuantity: service.maxQuantity,
      requiresApproval: service.requiresApproval,
      estimatedDeliveryTime: service.estimatedDeliveryTime,
      instructions: service.instructions,
      tags: Array.isArray(service.tags) ? service.tags : [],
      metadata: service.metadata || {},
      pricingTiers: Array.isArray(service.pricingTiers) ? service.pricingTiers : [],
      dynamicPricing: service.dynamicPricing,
      minimumOrder: service.minimumOrder,
      isActive: service.isActive,
      averageRating,
      totalReviews: service.reviews.length,
      totalRequests: service.requests.length,
      providersCount: service.providers.length,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

export const serviceCatalogService = new ServiceCatalogService();
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicePricingService = exports.ServicePricingService = void 0;
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../utils/logger");
class ServicePricingService {
    async calculatePrice(tenantId, request) {
        try {
            const service = await prisma_1.prisma.service.findFirst({
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
            const breakdown = [
                {
                    description: 'Base price',
                    amount: basePrice,
                    type: 'base',
                },
            ];
            let appliedTier;
            if (service.dynamicPricing && service.pricingTiers) {
                appliedTier = this.findApplicablePricingTier(Array.isArray(service.pricingTiers) ? service.pricingTiers : [], quantity);
                if (appliedTier) {
                    subtotal = appliedTier.pricePerUnit * quantity;
                    breakdown.push({
                        description: `Volume pricing (${quantity} units)`,
                        amount: appliedTier.pricePerUnit - basePrice,
                        type: 'discount',
                    });
                }
            }
            const demandMultiplier = await this.calculateDemandMultiplier(tenantId, request.serviceId, request.requestedDeliveryTime);
            const timeMultiplier = this.calculateTimeMultiplier(request.requestedDeliveryTime);
            const priorityMultiplier = this.calculatePriorityMultiplier(request.priority);
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
            const volumeDiscount = await this.calculateVolumeDiscount(tenantId, service, quantity);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate price', { tenantId, request }, error);
            throw error;
        }
    }
    async bulkCalculatePrice(tenantId, requests) {
        try {
            const results = await Promise.all(requests.map(request => this.calculatePrice(tenantId, request)));
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to bulk calculate prices', { tenantId, requestCount: requests.length }, error);
            throw error;
        }
    }
    async updateServicePricingConfig(tenantId, serviceId, config) {
        try {
            const updateData = {};
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
            await prisma_1.prisma.service.update({
                where: {
                    id: serviceId,
                    tenantId,
                },
                data: updateData,
            });
            logger_1.logger.info('Service pricing config updated', { tenantId, serviceId, config });
        }
        catch (error) {
            logger_1.logger.error('Failed to update service pricing config', { tenantId, serviceId, config }, error);
            throw error;
        }
    }
    async createBulkPricingRule(tenantId, rule) {
        try {
            const ruleData = {
                id: `rule_${Date.now()}`,
                tenantId,
                ...rule,
            };
            logger_1.logger.info('Bulk pricing rule created', { tenantId, rule: ruleData });
            return ruleData;
        }
        catch (error) {
            logger_1.logger.error('Failed to create bulk pricing rule', { tenantId, rule }, error);
            throw error;
        }
    }
    async analyzePricingPerformance(tenantId, serviceId, startDate, endDate) {
        try {
            const dateFilter = startDate && endDate ? {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            } : {};
            const whereClause = {
                tenantId,
                ...dateFilter,
            };
            if (serviceId) {
                whereClause.serviceId = serviceId;
            }
            const requests = await prisma_1.prisma.serviceRequest.findMany({
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
            const totalRevenue = requests.reduce((sum, req) => sum + Number(req.totalAmount), 0);
            const averageOrderValue = totalRevenue / requests.length;
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
            const dynamicPricingUsage = requests.filter(req => req.service.dynamicPricing).length;
            const pricingEfficiency = requests.length > 0 ? (dynamicPricingUsage / requests.length) * 100 : 0;
            const servicePerformance = new Map();
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
                let recommendedPrice = Number(service.price);
                let expectedImpact = 'Maintain current pricing';
                if (performance.requests.length > 20 && avgPrice > Number(service.price) * 1.2) {
                    recommendedPrice = Number(service.price) * 1.1;
                    expectedImpact = 'Increase revenue by 10-15%';
                }
                else if (performance.requests.length < 5 && avgPrice < Number(service.price) * 0.8) {
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
                demandPricingImpact: 0,
                volumeDiscountUtilization: 0,
                priceElasticity: 0,
                revenueByPriceRange,
                optimalPriceRecommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze pricing performance', { tenantId, serviceId, startDate, endDate }, error);
            throw error;
        }
    }
    async optimizePriceForService(tenantId, serviceId, targetMetric) {
        try {
            const service = await prisma_1.prisma.service.findFirst({
                where: { id: serviceId, tenantId },
            });
            if (!service) {
                throw new Error('Service not found');
            }
            const analytics = await this.analyzePricingPerformance(tenantId, serviceId);
            const currentPrice = Number(service.price);
            let recommendedPrice = currentPrice;
            let expectedChange = 'No change recommended';
            let confidence = 0.5;
            const recommendation = analytics.optimalPriceRecommendations.find(rec => rec.serviceId === serviceId);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize price for service', { tenantId, serviceId, targetMetric }, error);
            throw error;
        }
    }
    async applySeasonalPricing(tenantId, serviceIds, seasonalMultiplier, startDate, endDate) {
        try {
            await Promise.all(serviceIds.map(serviceId => prisma_1.prisma.service.update({
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
            })));
            logger_1.logger.info('Seasonal pricing applied', {
                tenantId,
                serviceCount: serviceIds.length,
                multiplier: seasonalMultiplier,
                period: { startDate, endDate }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to apply seasonal pricing', { tenantId, serviceIds, seasonalMultiplier }, error);
            throw error;
        }
    }
    async applyPromotionalPricing(tenantId, serviceId, discountPercentage, validUntil, conditions) {
        try {
            const promoCode = `PROMO_${Date.now()}`;
            await prisma_1.prisma.service.update({
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
            logger_1.logger.info('Promotional pricing applied', {
                tenantId,
                serviceId,
                promoCode,
                discountPercentage,
                validUntil
            });
            return promoCode;
        }
        catch (error) {
            logger_1.logger.error('Failed to apply promotional pricing', { tenantId, serviceId, discountPercentage }, error);
            throw error;
        }
    }
    findApplicablePricingTier(pricingTiers, quantity) {
        return pricingTiers
            .filter(tier => quantity >= tier.minQuantity &&
            (!tier.maxQuantity || quantity <= tier.maxQuantity))
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    }
    async calculateDemandMultiplier(tenantId, serviceId, requestedDeliveryTime) {
        try {
            if (!requestedDeliveryTime)
                return 1;
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const recentRequests = await prisma_1.prisma.serviceRequest.count({
                where: {
                    tenantId,
                    serviceId,
                    createdAt: { gte: oneHourAgo },
                },
            });
            if (recentRequests > 10)
                return 1.3;
            if (recentRequests > 5)
                return 1.15;
            if (recentRequests < 2)
                return 0.9;
            return 1;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate demand multiplier', { tenantId, serviceId }, error);
            return 1;
        }
    }
    calculateTimeMultiplier(requestedDeliveryTime) {
        if (!requestedDeliveryTime)
            return 1;
        const now = new Date();
        const timeDiff = requestedDeliveryTime.getTime() - now.getTime();
        const hoursUntilDelivery = timeDiff / (1000 * 60 * 60);
        if (hoursUntilDelivery < 1)
            return 2.0;
        if (hoursUntilDelivery < 4)
            return 1.5;
        if (hoursUntilDelivery < 24)
            return 1.2;
        if (hoursUntilDelivery > 168)
            return 0.95;
        return 1;
    }
    calculatePriorityMultiplier(priority) {
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
    async calculateVolumeDiscount(tenantId, service, quantity) {
        try {
            if (quantity >= 100)
                return service.price * quantity * 0.1;
            if (quantity >= 50)
                return service.price * quantity * 0.05;
            if (quantity >= 20)
                return service.price * quantity * 0.02;
            return 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate volume discount', { tenantId, quantity }, error);
            return 0;
        }
    }
}
exports.ServicePricingService = ServicePricingService;
exports.servicePricingService = new ServicePricingService();
//# sourceMappingURL=servicePricingService.js.map
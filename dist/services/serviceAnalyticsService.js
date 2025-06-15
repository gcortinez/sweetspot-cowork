"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceAnalyticsService = exports.ServiceAnalyticsService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class ServiceAnalyticsService {
    async trackServiceUsage(tenantId, data) {
        try {
            await prisma_1.prisma.serviceRequest.update({
                where: { id: data.requestId },
                data: {
                    metadata: {
                        ...data.metadata,
                        trackingEvents: {
                            [data.action]: {
                                timestamp: data.timestamp.toISOString(),
                                userId: data.userId,
                            },
                        },
                    },
                },
            });
            logger_1.logger.debug('Service usage tracked', { tenantId, action: data.action, serviceId: data.serviceId });
        }
        catch (error) {
            logger_1.logger.error('Failed to track service usage', { tenantId, data }, error);
        }
    }
    async generateUsageReport(tenantId, startDate, endDate, serviceIds) {
        try {
            const whereClause = {
                tenantId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (serviceIds && serviceIds.length > 0) {
                whereClause.serviceId = { in: serviceIds };
            }
            const requests = await prisma_1.prisma.serviceRequest.findMany({
                where: whereClause,
                include: {
                    service: true,
                    reviews: true,
                },
            });
            const serviceMetrics = new Map();
            requests.forEach(request => {
                const serviceId = request.serviceId;
                if (!serviceMetrics.has(serviceId)) {
                    serviceMetrics.set(serviceId, {
                        serviceId,
                        serviceName: request.service.name,
                        category: request.service.category,
                        type: request.service.serviceType,
                        requests: [],
                        reviews: [],
                    });
                }
                const metrics = serviceMetrics.get(serviceId);
                metrics.requests.push(request);
                metrics.reviews.push(...request.reviews);
            });
            const results = [];
            for (const [serviceId, data] of serviceMetrics) {
                const totalRequests = data.requests.length;
                const completedRequests = data.requests.filter((r) => r.status === client_1.RequestStatus.COMPLETED).length;
                const cancelledRequests = data.requests.filter((r) => r.status === client_1.RequestStatus.CANCELLED).length;
                const responseTimes = data.requests
                    .filter((r) => r.assignedTo && r.createdAt)
                    .map((r) => {
                    const approvalTime = r.approvedAt || r.createdAt;
                    return (new Date(approvalTime).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
                });
                const averageResponseTime = responseTimes.length > 0
                    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
                    : 0;
                const completionTimes = data.requests
                    .filter((r) => r.completedAt && r.createdAt)
                    .map((r) => (new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60));
                const averageCompletionTime = completionTimes.length > 0
                    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
                    : 0;
                const totalRevenue = data.requests.reduce((sum, r) => sum + Number(r.totalAmount), 0);
                const averageOrderValue = totalRequests > 0 ? totalRevenue / totalRequests : 0;
                const customerSatisfaction = data.reviews.length > 0
                    ? data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length
                    : 0;
                const utilizationRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
                const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
                const firstHalfRequests = data.requests.filter((r) => new Date(r.createdAt) < midpoint).length;
                const secondHalfRequests = data.requests.filter((r) => new Date(r.createdAt) >= midpoint).length;
                let trendDirection = 'STABLE';
                if (secondHalfRequests > firstHalfRequests * 1.1)
                    trendDirection = 'UP';
                else if (secondHalfRequests < firstHalfRequests * 0.9)
                    trendDirection = 'DOWN';
                results.push({
                    serviceId,
                    serviceName: data.serviceName,
                    category: data.category,
                    type: data.type,
                    totalRequests,
                    completedRequests,
                    cancelledRequests,
                    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
                    averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                    customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
                    utilizationRate: Math.round(utilizationRate * 100) / 100,
                    trendDirection,
                    periodComparison: {
                        requestsChange: 0,
                        revenueChange: 0,
                    },
                });
            }
            return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate usage report', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
    async generateDashboardData(tenantId, startDate, endDate) {
        try {
            const [services, requests, reviews] = await Promise.all([
                prisma_1.prisma.service.findMany({
                    where: { tenantId },
                }),
                prisma_1.prisma.serviceRequest.findMany({
                    where: {
                        tenantId,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    include: {
                        service: true,
                        user: true,
                    },
                }),
                prisma_1.prisma.serviceReview.findMany({
                    where: {
                        tenantId,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
            ]);
            const totalServices = services.length;
            const activeServices = services.filter(s => s.isActive).length;
            const totalRequests = requests.length;
            const totalRevenue = requests.reduce((sum, r) => sum + Number(r.totalAmount), 0);
            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
            const completedRequests = requests.filter(r => r.status === client_1.RequestStatus.COMPLETED).length;
            const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
            const usageMetrics = await this.generateUsageReport(tenantId, startDate, endDate);
            const topPerformingServices = usageMetrics.slice(0, 10);
            const categoryStats = new Map();
            requests.forEach(request => {
                const category = request.service.category;
                const existing = categoryStats.get(category) || {
                    requestCount: 0,
                    revenue: 0,
                    ratings: [],
                };
                existing.requestCount++;
                existing.revenue += Number(request.totalAmount);
                const serviceReviews = reviews.filter(r => r.serviceId === request.serviceId);
                existing.ratings.push(...serviceReviews.map(r => r.rating));
                categoryStats.set(category, existing);
            });
            const categoryBreakdown = Array.from(categoryStats.entries()).map(([category, stats]) => ({
                category,
                requestCount: stats.requestCount,
                revenue: stats.revenue,
                averageRating: stats.ratings.length > 0
                    ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length
                    : 0,
                marketShare: totalRequests > 0 ? (stats.requestCount / totalRequests) * 100 : 0,
            }));
            const requestTrends = this.generateDailyTrends(requests, startDate, endDate);
            const userStats = new Map();
            requests.forEach(request => {
                const userId = request.userId;
                const existing = userStats.get(userId) || {
                    user: request.user,
                    requests: [],
                    totalSpend: 0,
                };
                existing.requests.push(request);
                existing.totalSpend += Number(request.totalAmount);
                userStats.set(userId, existing);
            });
            const userSegmentAnalysis = [
                {
                    segment: 'High Value Users',
                    userCount: Array.from(userStats.values()).filter(u => u.totalSpend > 500).length,
                    averageSpend: 750,
                    favoriteServices: ['Printing', 'Coffee', 'Meeting Rooms'],
                },
                {
                    segment: 'Regular Users',
                    userCount: Array.from(userStats.values()).filter(u => u.totalSpend > 100 && u.totalSpend <= 500).length,
                    averageSpend: 250,
                    favoriteServices: ['Coffee', 'Printing'],
                },
                {
                    segment: 'Occasional Users',
                    userCount: Array.from(userStats.values()).filter(u => u.totalSpend <= 100).length,
                    averageSpend: 50,
                    favoriteServices: ['Coffee'],
                },
            ];
            const pendingApprovals = requests.filter(r => r.status === client_1.RequestStatus.PENDING).length;
            const now = new Date();
            const overdueRequests = requests.filter(r => r.status === client_1.RequestStatus.IN_PROGRESS &&
                r.scheduledDeliveryTime &&
                r.scheduledDeliveryTime < now).length;
            return {
                overview: {
                    totalServices,
                    activeServices,
                    totalRequests,
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    averageRating: Math.round(averageRating * 100) / 100,
                    completionRate: Math.round(completionRate * 100) / 100,
                },
                topPerformingServices,
                categoryBreakdown,
                requestTrends,
                userSegmentAnalysis,
                operationalMetrics: {
                    averageResponseTime: usageMetrics.length > 0
                        ? usageMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / usageMetrics.length
                        : 0,
                    averageCompletionTime: usageMetrics.length > 0
                        ? usageMetrics.reduce((sum, m) => sum + m.averageCompletionTime, 0) / usageMetrics.length
                        : 0,
                    staffUtilization: 85,
                    pendingApprovals,
                    overdueRequests,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate dashboard data', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
    async generateRecommendations(tenantId, timeframe = 'LAST_MONTH') {
        try {
            const endDate = new Date();
            const startDate = new Date();
            switch (timeframe) {
                case 'LAST_WEEK':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'LAST_MONTH':
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case 'LAST_QUARTER':
                    startDate.setMonth(endDate.getMonth() - 3);
                    break;
            }
            const usageMetrics = await this.generateUsageReport(tenantId, startDate, endDate);
            const dashboardData = await this.generateDashboardData(tenantId, startDate, endDate);
            const recommendations = [];
            usageMetrics.forEach(metric => {
                if (metric.utilizationRate > 90 && metric.customerSatisfaction > 4) {
                    recommendations.push({
                        type: 'PRICING',
                        priority: 'MEDIUM',
                        serviceId: metric.serviceId,
                        serviceName: metric.serviceName,
                        title: 'Consider Price Increase',
                        description: `${metric.serviceName} has high utilization (${metric.utilizationRate}%) and satisfaction (${metric.customerSatisfaction}/5). Consider increasing price.`,
                        expectedImpact: '10-20% revenue increase',
                        actionItems: [
                            'Analyze competitor pricing',
                            'Test 10% price increase with A/B testing',
                            'Monitor demand elasticity',
                        ],
                        metrics: {
                            currentUtilization: metric.utilizationRate,
                            satisfaction: metric.customerSatisfaction,
                        },
                    });
                }
                if (metric.utilizationRate < 30 && metric.trendDirection === 'DOWN') {
                    recommendations.push({
                        type: 'PROMOTION',
                        priority: 'HIGH',
                        serviceId: metric.serviceId,
                        serviceName: metric.serviceName,
                        title: 'Boost Low-Performing Service',
                        description: `${metric.serviceName} has low utilization (${metric.utilizationRate}%) and declining trend. Consider promotional pricing.`,
                        expectedImpact: '30-50% demand increase',
                        actionItems: [
                            'Create limited-time discount campaign',
                            'Bundle with popular services',
                            'Improve service description and visibility',
                        ],
                        metrics: {
                            currentUtilization: metric.utilizationRate,
                            trendDirection: metric.trendDirection,
                        },
                    });
                }
            });
            const lowSatisfactionServices = usageMetrics.filter(m => m.customerSatisfaction < 3 && m.totalRequests > 5);
            lowSatisfactionServices.forEach(metric => {
                recommendations.push({
                    type: 'QUALITY',
                    priority: 'CRITICAL',
                    serviceId: metric.serviceId,
                    serviceName: metric.serviceName,
                    title: 'Address Quality Issues',
                    description: `${metric.serviceName} has low satisfaction rating (${metric.customerSatisfaction}/5). Immediate quality improvement needed.`,
                    expectedImpact: 'Prevent customer churn',
                    actionItems: [
                        'Review negative feedback',
                        'Retrain service providers',
                        'Implement quality checkpoints',
                        'Follow up with dissatisfied customers',
                    ],
                    metrics: {
                        satisfaction: metric.customerSatisfaction,
                        requestCount: metric.totalRequests,
                    },
                });
            });
            if (dashboardData.operationalMetrics.overdueRequests > 5) {
                recommendations.push({
                    type: 'CAPACITY',
                    priority: 'HIGH',
                    title: 'Increase Service Capacity',
                    description: `${dashboardData.operationalMetrics.overdueRequests} overdue requests indicate capacity constraints.`,
                    expectedImpact: 'Improve delivery times by 40%',
                    actionItems: [
                        'Hire additional service providers',
                        'Optimize workflow processes',
                        'Implement better scheduling system',
                        'Consider outsourcing peak demand',
                    ],
                    metrics: {
                        overdueRequests: dashboardData.operationalMetrics.overdueRequests,
                        averageCompletionTime: dashboardData.operationalMetrics.averageCompletionTime,
                    },
                });
            }
            const highPerformingCategories = dashboardData.categoryBreakdown
                .filter(cat => cat.averageRating > 4 && cat.marketShare > 20)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3);
            highPerformingCategories.forEach(category => {
                recommendations.push({
                    type: 'EXPANSION',
                    priority: 'MEDIUM',
                    title: `Expand ${category.category} Services`,
                    description: `${category.category} category performs well with ${category.averageRating}/5 rating and ${Math.round(category.marketShare)}% market share.`,
                    expectedImpact: '25-40% category revenue increase',
                    actionItems: [
                        'Research additional service offerings',
                        'Survey customers for specific needs',
                        'Pilot new services in this category',
                        'Partner with specialized providers',
                    ],
                    metrics: {
                        marketShare: category.marketShare,
                        rating: category.averageRating,
                        revenue: category.revenue,
                    },
                });
            });
            return recommendations
                .sort((a, b) => {
                const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
                .slice(0, 10);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate recommendations', { tenantId, timeframe }, error);
            throw error;
        }
    }
    async generateAdvancedAnalytics(tenantId, analysisType = 'ALL') {
        try {
            const analytics = {};
            if (analysisType === 'DEMAND_FORECAST' || analysisType === 'ALL') {
                analytics.demandForecasting = await this.generateDemandForecast(tenantId);
            }
            if (analysisType === 'PRICE_OPTIMIZATION' || analysisType === 'ALL') {
                analytics.priceOptimization = await this.generatePriceOptimization(tenantId);
            }
            if (analysisType === 'CUSTOMER_SEGMENTS' || analysisType === 'ALL') {
                analytics.customerSegments = await this.generateCustomerSegments(tenantId);
            }
            if (analysisType === 'MARKET_OPPORTUNITIES' || analysisType === 'ALL') {
                analytics.marketOpportunities = await this.generateMarketOpportunities(tenantId);
            }
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate advanced analytics', { tenantId, analysisType }, error);
            throw error;
        }
    }
    generateDailyTrends(requests, startDate, endDate) {
        const dailyStats = new Map();
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyStats.set(dateKey, {
                date: dateKey,
                totalRequests: 0,
                completedRequests: 0,
                revenue: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        requests.forEach(request => {
            const dateKey = request.createdAt.toISOString().split('T')[0];
            const stats = dailyStats.get(dateKey);
            if (stats) {
                stats.totalRequests++;
                if (request.status === client_1.RequestStatus.COMPLETED) {
                    stats.completedRequests++;
                }
                stats.revenue += Number(request.totalAmount);
            }
        });
        return Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    async generateDemandForecast(tenantId) {
        const services = await prisma_1.prisma.service.findMany({
            where: { tenantId, isActive: true },
            include: {
                requests: {
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
            },
        });
        return services.map(service => ({
            serviceId: service.id,
            serviceName: service.name,
            predictedDemand: service.requests.length * 1.2,
            confidenceLevel: 0.75,
            recommendedCapacity: Math.ceil(service.requests.length * 1.3),
        }));
    }
    async generatePriceOptimization(tenantId) {
        const services = await prisma_1.prisma.service.findMany({
            where: { tenantId, isActive: true },
            include: {
                requests: true,
                reviews: true,
            },
        });
        return services.map(service => {
            const avgRating = service.reviews.length > 0
                ? service.reviews.reduce((sum, r) => sum + r.rating, 0) / service.reviews.length
                : 0;
            const demandLevel = service.requests.length;
            let priceMultiplier = 1;
            if (avgRating > 4 && demandLevel > 20) {
                priceMultiplier = 1.15;
            }
            else if (avgRating < 3 || demandLevel < 5) {
                priceMultiplier = 0.9;
            }
            return {
                serviceId: service.id,
                serviceName: service.name,
                currentPrice: Number(service.price),
                optimalPrice: Math.round(Number(service.price) * priceMultiplier * 100) / 100,
                expectedRevenueLift: (priceMultiplier - 1) * 100,
            };
        });
    }
    async generateCustomerSegments(tenantId) {
        return [
            {
                segmentName: 'Enterprise Clients',
                characteristics: ['High volume orders', 'Regular usage', 'Premium services'],
                servicePreferences: [
                    { serviceId: 'printing', serviceName: 'Printing Services', usageFrequency: 0.8 },
                    { serviceId: 'meeting', serviceName: 'Meeting Room Services', usageFrequency: 0.6 },
                ],
                spendingPattern: {
                    averageMonthlySpend: 1500,
                    seasonality: 'Q4 peak',
                },
            },
            {
                segmentName: 'Small Businesses',
                characteristics: ['Moderate usage', 'Price-sensitive', 'Basic services'],
                servicePreferences: [
                    { serviceId: 'coffee', serviceName: 'Coffee Service', usageFrequency: 0.9 },
                    { serviceId: 'printing', serviceName: 'Printing Services', usageFrequency: 0.4 },
                ],
                spendingPattern: {
                    averageMonthlySpend: 300,
                    seasonality: 'Stable year-round',
                },
            },
        ];
    }
    async generateMarketOpportunities(tenantId) {
        return [
            {
                category: client_1.ServiceCategory.WELLNESS,
                gapDescription: 'Limited wellness services despite high demand for work-life balance',
                potentialRevenue: 25000,
                implementationComplexity: 'MEDIUM',
            },
            {
                category: client_1.ServiceCategory.EVENT_SERVICES,
                gapDescription: 'No corporate event planning services',
                potentialRevenue: 40000,
                implementationComplexity: 'HIGH',
            },
        ];
    }
}
exports.ServiceAnalyticsService = ServiceAnalyticsService;
exports.serviceAnalyticsService = new ServiceAnalyticsService();
//# sourceMappingURL=serviceAnalyticsService.js.map
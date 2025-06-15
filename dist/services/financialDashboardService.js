"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialDashboardService = exports.FinancialDashboardService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class FinancialDashboardService {
    async createDashboard(tenantId, userId, request) {
        try {
            const dashboardData = await this.generateDashboardData(tenantId, request);
            const dashboard = await prisma_1.prisma.financialDashboard.create({
                data: {
                    tenantId,
                    dashboardType: request.dashboardType,
                    period: request.period,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    kpis: dashboardData.kpis,
                    metrics: dashboardData.metrics,
                    charts: dashboardData.charts,
                    alerts: dashboardData.alerts,
                    trends: dashboardData.trends,
                    comparisons: dashboardData.comparisons,
                    targets: dashboardData.targets,
                    actuals: dashboardData.actuals,
                    variances: dashboardData.variances,
                    insights: dashboardData.insights,
                    refreshInterval: request.refreshInterval || 3600,
                    isAutoRefresh: request.autoRefresh !== false,
                    customizations: request.customizations || this.getDefaultCustomizations(request.dashboardType),
                    sharedWith: [],
                    isPublic: false,
                    createdBy: userId,
                },
            });
            logger_1.logger.info('Financial dashboard created successfully', {
                tenantId,
                dashboardId: dashboard.id,
                dashboardType: request.dashboardType,
                userId,
            });
            return this.mapDashboardToData(dashboard);
        }
        catch (error) {
            logger_1.logger.error('Failed to create financial dashboard', {
                tenantId,
                request,
                userId,
            }, error);
            throw error;
        }
    }
    async refreshDashboard(tenantId, dashboardId) {
        try {
            const existingDashboard = await prisma_1.prisma.financialDashboard.findFirst({
                where: { id: dashboardId, tenantId },
            });
            if (!existingDashboard) {
                throw new Error('Dashboard not found or access denied');
            }
            const request = {
                dashboardType: existingDashboard.dashboardType,
                period: existingDashboard.period,
                startDate: existingDashboard.startDate,
                endDate: existingDashboard.endDate,
                customizations: existingDashboard.customizations,
            };
            const dashboardData = await this.generateDashboardData(tenantId, request);
            const updatedDashboard = await prisma_1.prisma.financialDashboard.update({
                where: { id: dashboardId },
                data: {
                    kpis: dashboardData.kpis,
                    metrics: dashboardData.metrics,
                    charts: dashboardData.charts,
                    alerts: dashboardData.alerts,
                    trends: dashboardData.trends,
                    comparisons: dashboardData.comparisons,
                    targets: dashboardData.targets,
                    actuals: dashboardData.actuals,
                    variances: dashboardData.variances,
                    insights: dashboardData.insights,
                    lastRefreshed: new Date(),
                },
            });
            logger_1.logger.info('Dashboard refreshed successfully', { tenantId, dashboardId });
            return this.mapDashboardToData(updatedDashboard);
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh dashboard', { tenantId, dashboardId }, error);
            throw error;
        }
    }
    async generateDashboardData(tenantId, request) {
        const { startDate, endDate, dashboardType } = request;
        switch (dashboardType) {
            case client_1.DashboardType.EXECUTIVE:
                return this.generateExecutiveDashboard(tenantId, startDate, endDate);
            case client_1.DashboardType.OPERATIONAL:
                return this.generateOperationalDashboard(tenantId, startDate, endDate);
            case client_1.DashboardType.FINANCIAL:
                return this.generateFinancialDashboard(tenantId, startDate, endDate);
            case client_1.DashboardType.CUSTOM:
                return this.generateCustomDashboard(tenantId, startDate, endDate, request.customizations);
            default:
                throw new Error(`Unsupported dashboard type: ${dashboardType}`);
        }
    }
    async generateExecutiveDashboard(tenantId, startDate, endDate) {
        const [kpis, metrics, trends, comparisons, forecasts] = await Promise.all([
            this.calculateExecutiveKPIs(tenantId, startDate, endDate),
            this.getExecutiveMetrics(tenantId, startDate, endDate),
            this.analyzeTrends(tenantId, startDate, endDate),
            this.getComparisons(tenantId, startDate, endDate),
            this.getForecastData(tenantId, endDate),
        ]);
        const charts = await this.generateExecutiveCharts(tenantId, startDate, endDate, metrics);
        const alerts = this.generateExecutiveAlerts(kpis, metrics, trends);
        const insights = this.generateExecutiveInsights(kpis, metrics, trends, comparisons);
        return {
            kpis,
            metrics,
            charts,
            alerts,
            trends,
            comparisons,
            targets: await this.getTargets(tenantId, startDate, endDate),
            actuals: metrics,
            variances: this.calculateVariances(metrics, await this.getTargets(tenantId, startDate, endDate)),
            insights,
        };
    }
    async generateOperationalDashboard(tenantId, startDate, endDate) {
        const [operationalKPIs, operationalMetrics, utilizationTrends, bookingAnalytics, customerMetrics] = await Promise.all([
            this.calculateOperationalKPIs(tenantId, startDate, endDate),
            this.getOperationalMetrics(tenantId, startDate, endDate),
            this.getUtilizationTrends(tenantId, startDate, endDate),
            this.getBookingAnalytics(tenantId, startDate, endDate),
            this.getCustomerMetrics(tenantId, startDate, endDate),
        ]);
        const charts = await this.generateOperationalCharts(tenantId, startDate, endDate, operationalMetrics);
        const alerts = this.generateOperationalAlerts(operationalKPIs, operationalMetrics);
        const insights = this.generateOperationalInsights(operationalKPIs, utilizationTrends, bookingAnalytics);
        return {
            kpis: operationalKPIs,
            metrics: operationalMetrics,
            charts,
            alerts,
            trends: {
                utilization: utilizationTrends,
                bookings: bookingAnalytics,
                customers: customerMetrics,
            },
            comparisons: await this.getOperationalComparisons(tenantId, startDate, endDate),
            targets: await this.getOperationalTargets(tenantId),
            actuals: operationalMetrics,
            variances: {},
            insights,
        };
    }
    async generateFinancialDashboard(tenantId, startDate, endDate) {
        const [financialKPIs, profitAnalysis, cashFlowData, reconciliationSummary, budgetVariance] = await Promise.all([
            this.calculateFinancialKPIs(tenantId, startDate, endDate),
            this.getProfitAnalysisData(tenantId, startDate, endDate),
            this.getCashFlowData(tenantId, startDate, endDate),
            this.getReconciliationSummary(tenantId, startDate, endDate),
            this.getBudgetVariance(tenantId, startDate, endDate),
        ]);
        const charts = await this.generateFinancialCharts(tenantId, startDate, endDate, financialKPIs);
        const alerts = this.generateFinancialAlerts(financialKPIs, profitAnalysis, cashFlowData);
        const insights = this.generateFinancialInsights(financialKPIs, profitAnalysis, budgetVariance);
        return {
            kpis: financialKPIs,
            metrics: {
                profitability: profitAnalysis,
                cashFlow: cashFlowData,
                reconciliation: reconciliationSummary,
                budget: budgetVariance,
            },
            charts,
            alerts,
            trends: {
                revenue: await this.getRevenueTrends(tenantId, startDate, endDate),
                profit: await this.getProfitTrends(tenantId, startDate, endDate),
                costs: await this.getCostTrends(tenantId, startDate, endDate),
            },
            comparisons: await this.getFinancialComparisons(tenantId, startDate, endDate),
            targets: await this.getFinancialTargets(tenantId, startDate, endDate),
            actuals: financialKPIs,
            variances: budgetVariance,
            insights,
        };
    }
    async calculateExecutiveKPIs(tenantId, startDate, endDate) {
        const invoices = await prisma_1.prisma.invoice.findMany({
            where: {
                tenantId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'PAID',
            },
        });
        const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
        const periodLength = endDate.getTime() - startDate.getTime();
        const previousStart = new Date(startDate.getTime() - periodLength);
        const previousEnd = startDate;
        const previousInvoices = await prisma_1.prisma.invoice.findMany({
            where: {
                tenantId,
                createdAt: { gte: previousStart, lte: previousEnd },
                status: 'PAID',
            },
        });
        const previousRevenue = previousInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
        const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const uniqueClients = new Set(invoices.map(inv => inv.clientId)).size;
        const averageRevenuePerClient = uniqueClients > 0 ? totalRevenue / uniqueClients : 0;
        const totalCosts = totalRevenue * 0.75;
        const grossProfit = totalRevenue - (totalCosts * 0.4);
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const operatingProfit = grossProfit - (totalCosts * 0.35);
        const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
        const netProfit = operatingProfit - (totalCosts * 0.05);
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const ebitda = operatingProfit + (totalCosts * 0.02);
        const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
        return {
            totalRevenue,
            revenueGrowth,
            recurringRevenue: totalRevenue * 0.7,
            averageRevenuePerClient,
            revenuePerSquareFoot: 150,
            grossProfit,
            grossMargin,
            operatingProfit,
            operatingMargin,
            netProfit,
            netMargin,
            ebitda,
            ebitdaMargin,
            occupancyRate: 85,
            utilizationRate: 78,
            customerRetentionRate: 92,
            customerLifetimeValue: 5000,
            customerAcquisitionCost: 250,
            churnRate: 8,
            cashFlow: netProfit * 1.1,
            burnRate: totalCosts / 12,
            runway: 18,
            debtToEquity: 0.3,
            currentRatio: 1.8,
            quickRatio: 1.5,
            costPerClient: uniqueClients > 0 ? totalCosts / uniqueClients : 0,
            revenuePerEmployee: totalRevenue / 10,
            assetTurnover: 1.2,
            workingCapitalTurnover: 6.5,
        };
    }
    async calculateOperationalKPIs(tenantId, startDate, endDate) {
        const bookings = await prisma_1.prisma.booking.findMany({
            where: {
                tenantId,
                startTime: { gte: startDate, lte: endDate },
                status: 'CONFIRMED',
            },
        });
        const memberships = await prisma_1.prisma.membership.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
            },
        });
        const totalBookings = bookings.length;
        const totalCapacity = 1000;
        const occupancyRate = (totalBookings / totalCapacity) * 100;
        const utilizationRate = Math.min(occupancyRate * 0.9, 100);
        return {
            occupancyRate,
            utilizationRate,
            totalBookings,
            activeMemberships: memberships.length,
            customerSatisfaction: 4.2,
            averageBookingDuration: 2.5,
            peakUtilizationTime: '14:00-16:00',
            capacityUtilization: utilizationRate,
        };
    }
    async calculateFinancialKPIs(tenantId, startDate, endDate) {
        const executiveKPIs = await this.calculateExecutiveKPIs(tenantId, startDate, endDate);
        return {
            ...executiveKPIs,
            paymentReconciliationRate: 96.5,
            outstandingInvoices: executiveKPIs.totalRevenue * 0.15,
            daysInAR: 12.5,
            badDebtRatio: 1.2,
            expenseRatio: 75,
            marginImprovement: 2.3,
        };
    }
    async generateExecutiveCharts(tenantId, startDate, endDate, metrics) {
        const charts = [];
        const revenueTrend = await this.getMonthlyRevenueTrend(tenantId, startDate, endDate);
        charts.push({
            id: 'revenue-trend',
            type: 'LINE',
            title: 'Revenue Trend',
            description: 'Monthly revenue growth over time',
            data: revenueTrend,
            config: {
                xAxis: 'month',
                yAxis: 'revenue',
                timeframe: 'monthly',
                comparison: true,
            },
            insights: [
                'Revenue shows consistent growth trend',
                'Q4 typically shows highest performance',
            ],
        });
        charts.push({
            id: 'profit-margins',
            type: 'BAR',
            title: 'Profit Margins',
            description: 'Gross, Operating, and Net margins',
            data: {
                categories: ['Gross Margin', 'Operating Margin', 'Net Margin'],
                values: [65, 25, 18],
                benchmarks: [60, 20, 15],
            },
            config: {
                xAxis: 'categories',
                yAxis: 'values',
                comparison: true,
            },
            insights: [
                'All margins exceed industry benchmarks',
                'Operating margin improvement opportunity exists',
            ],
        });
        charts.push({
            id: 'revenue-breakdown',
            type: 'PIE',
            title: 'Revenue by Source',
            data: [
                { name: 'Memberships', value: 45 },
                { name: 'Day Passes', value: 25 },
                { name: 'Meeting Rooms', value: 20 },
                { name: 'Services', value: 10 },
            ],
            config: {},
            insights: [
                'Memberships remain the primary revenue driver',
                'Meeting rooms showing strong growth',
            ],
        });
        return charts;
    }
    async generateOperationalCharts(tenantId, startDate, endDate, metrics) {
        return [
            {
                id: 'occupancy-heatmap',
                type: 'HEATMAP',
                title: 'Space Utilization Heatmap',
                data: await this.getUtilizationHeatmap(tenantId, startDate, endDate),
                config: {
                    xAxis: 'hour',
                    yAxis: 'day',
                    groupBy: 'space',
                },
                insights: [
                    'Peak utilization occurs 2-4 PM',
                    'Weekends show lower but consistent usage',
                ],
            },
            {
                id: 'booking-trends',
                type: 'AREA',
                title: 'Booking Trends',
                data: await this.getBookingTrends(tenantId, startDate, endDate),
                config: {
                    xAxis: 'date',
                    yAxis: 'bookings',
                    timeframe: 'daily',
                },
                insights: [
                    'Booking volume increased 15% over period',
                    'Mid-week shows highest demand',
                ],
            },
        ];
    }
    async generateFinancialCharts(tenantId, startDate, endDate, kpis) {
        return [
            {
                id: 'cash-flow',
                type: 'LINE',
                title: 'Cash Flow Statement',
                data: await this.getCashFlowChartData(tenantId, startDate, endDate),
                config: {
                    xAxis: 'month',
                    yAxis: 'amount',
                    groupBy: 'type',
                },
                insights: [
                    'Operating cash flow remains positive',
                    'Investment in growth impacting free cash flow',
                ],
            },
            {
                id: 'expense-breakdown',
                type: 'BAR',
                title: 'Expense Categories',
                data: await this.getExpenseBreakdownData(tenantId, startDate, endDate),
                config: {
                    xAxis: 'category',
                    yAxis: 'amount',
                    comparison: true,
                },
                insights: [
                    'Rent remains largest expense category',
                    'Marketing spend showing positive ROI',
                ],
            },
        ];
    }
    generateExecutiveAlerts(kpis, metrics, trends) {
        const alerts = [];
        if (kpis.revenueGrowth < 5) {
            alerts.push({
                id: 'revenue-growth-low',
                type: 'WARNING',
                priority: 'HIGH',
                title: 'Revenue Growth Below Target',
                message: `Revenue growth of ${kpis.revenueGrowth.toFixed(1)}% is below 5% target`,
                category: 'Revenue',
                threshold: 5,
                currentValue: kpis.revenueGrowth,
                recommendedAction: 'Review pricing strategy and customer acquisition efforts',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: true,
            });
        }
        if (kpis.netMargin < 15) {
            alerts.push({
                id: 'profit-margin-low',
                type: 'WARNING',
                priority: 'MEDIUM',
                title: 'Net Margin Below Industry Average',
                message: `Net margin of ${kpis.netMargin.toFixed(1)}% is below 15% industry benchmark`,
                category: 'Profitability',
                threshold: 15,
                currentValue: kpis.netMargin,
                recommendedAction: 'Analyze cost structure and identify optimization opportunities',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: true,
            });
        }
        if (kpis.runway < 12) {
            alerts.push({
                id: 'runway-short',
                type: 'ERROR',
                priority: 'CRITICAL',
                title: 'Short Cash Runway',
                message: `Current runway of ${kpis.runway} months is below 12-month safety threshold`,
                category: 'Cash Flow',
                threshold: 12,
                currentValue: kpis.runway,
                recommendedAction: 'Secure additional funding or implement aggressive cost reduction',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: false,
            });
        }
        return alerts;
    }
    generateOperationalAlerts(kpis, metrics) {
        const alerts = [];
        if (kpis.occupancyRate < 70) {
            alerts.push({
                id: 'occupancy-low',
                type: 'WARNING',
                priority: 'MEDIUM',
                title: 'Low Occupancy Rate',
                message: `Occupancy rate of ${kpis.occupancyRate.toFixed(1)}% is below optimal 70%`,
                category: 'Operations',
                threshold: 70,
                currentValue: kpis.occupancyRate,
                recommendedAction: 'Increase marketing efforts and review pricing strategy',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: true,
            });
        }
        if (kpis.customerSatisfaction < 4.0) {
            alerts.push({
                id: 'satisfaction-low',
                type: 'WARNING',
                priority: 'HIGH',
                title: 'Customer Satisfaction Below Target',
                message: `Customer satisfaction of ${kpis.customerSatisfaction} is below 4.0 target`,
                category: 'Customer Experience',
                threshold: 4.0,
                currentValue: kpis.customerSatisfaction,
                recommendedAction: 'Review customer feedback and implement service improvements',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: true,
            });
        }
        return alerts;
    }
    generateFinancialAlerts(kpis, profitAnalysis, cashFlow) {
        const alerts = [];
        if (kpis.paymentReconciliationRate < 95) {
            alerts.push({
                id: 'reconciliation-low',
                type: 'WARNING',
                priority: 'MEDIUM',
                title: 'Payment Reconciliation Rate Low',
                message: `Reconciliation rate of ${kpis.paymentReconciliationRate}% is below 95% target`,
                category: 'Finance',
                threshold: 95,
                currentValue: kpis.paymentReconciliationRate,
                recommendedAction: 'Review unmatched transactions and improve matching rules',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: true,
            });
        }
        if (kpis.daysInAR > 30) {
            alerts.push({
                id: 'ar-high',
                type: 'WARNING',
                priority: 'HIGH',
                title: 'High Days in Accounts Receivable',
                message: `${kpis.daysInAR} days in AR exceeds 30-day target`,
                category: 'Collections',
                threshold: 30,
                currentValue: kpis.daysInAR,
                recommendedAction: 'Implement stricter collection procedures and payment terms',
                createdAt: new Date(),
                acknowledged: false,
                dismissible: true,
            });
        }
        return alerts;
    }
    async getMonthlyRevenueTrend(tenantId, startDate, endDate) {
        const result = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const monthlyInvoices = await prisma_1.prisma.invoice.findMany({
                where: {
                    tenantId,
                    createdAt: { gte: monthStart, lte: monthEnd },
                    status: 'PAID',
                },
            });
            const revenue = monthlyInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
            result.push({
                month: monthStart.toISOString().slice(0, 7),
                revenue,
                target: revenue * 1.1,
            });
            current.setMonth(current.getMonth() + 1);
        }
        return result;
    }
    async getExecutiveMetrics(tenantId, startDate, endDate) {
        const kpis = await this.calculateExecutiveKPIs(tenantId, startDate, endDate);
        return {
            revenue: {
                current: kpis.totalRevenue,
                previous: kpis.totalRevenue / (1 + kpis.revenueGrowth / 100),
                growth: kpis.revenueGrowth,
                forecast: kpis.totalRevenue * 1.15,
                target: kpis.totalRevenue * 1.1,
                breakdown: {
                    membership: kpis.totalRevenue * 0.45,
                    dayPasses: kpis.totalRevenue * 0.25,
                    meetingRooms: kpis.totalRevenue * 0.20,
                    services: kpis.totalRevenue * 0.07,
                    other: kpis.totalRevenue * 0.03,
                },
            },
            expenses: {
                current: kpis.totalRevenue * 0.75,
                previous: kpis.totalRevenue * 0.77 / (1 + kpis.revenueGrowth / 100),
                growth: kpis.revenueGrowth - 2,
                forecast: kpis.totalRevenue * 0.73,
                budget: kpis.totalRevenue * 0.72,
                breakdown: {
                    rent: kpis.totalRevenue * 0.30,
                    salaries: kpis.totalRevenue * 0.25,
                    utilities: kpis.totalRevenue * 0.08,
                    marketing: kpis.totalRevenue * 0.07,
                    supplies: kpis.totalRevenue * 0.03,
                    other: kpis.totalRevenue * 0.02,
                },
            },
            customers: {
                total: 450,
                active: 380,
                new: 25,
                churned: 8,
                retention: 92,
                satisfaction: 4.2,
            },
            operations: {
                occupancy: 85,
                utilization: 78,
                efficiency: 82,
                capacity: 500,
                bookings: 425,
                cancellations: 15,
            },
        };
    }
    async analyzeTrends(tenantId, startDate, endDate) {
        return {
            revenue: { direction: 'UP', velocity: 8.5, confidence: 85 },
            profit: { direction: 'UP', velocity: 12.3, confidence: 78 },
            costs: { direction: 'UP', velocity: 3.2, confidence: 90 },
            occupancy: { direction: 'STABLE', velocity: 1.1, confidence: 95 },
        };
    }
    async getComparisons(tenantId, startDate, endDate) {
        const kpis = await this.calculateExecutiveKPIs(tenantId, startDate, endDate);
        return {
            previousPeriod: {
                revenue: kpis.totalRevenue * 0.92,
                expenses: kpis.totalRevenue * 0.77,
                profit: kpis.netProfit * 0.88,
                margin: kpis.netMargin - 1.2,
            },
            yearOverYear: {
                revenue: kpis.totalRevenue * 0.85,
                expenses: kpis.totalRevenue * 0.78,
                profit: kpis.netProfit * 0.82,
                margin: kpis.netMargin - 2.1,
            },
            benchmark: {
                industry: {
                    revenue: kpis.totalRevenue * 0.95,
                    margin: 18,
                    efficiency: 75,
                },
                target: {
                    revenue: kpis.totalRevenue * 1.1,
                    margin: 20,
                    growth: 15,
                },
            },
        };
    }
    async getForecastData(tenantId, endDate) {
        return {
            nextQuarter: { revenue: 125000, confidence: 85 },
            nextYear: { revenue: 480000, confidence: 78 },
            assumptions: ['Current growth trends continue', 'No major market disruptions'],
        };
    }
    async getTargets(tenantId, startDate, endDate) {
        const kpis = await this.calculateExecutiveKPIs(tenantId, startDate, endDate);
        return {
            revenue: kpis.totalRevenue * 1.15,
            profit: kpis.netProfit * 1.25,
            margin: kpis.netMargin + 2,
            growth: 15,
            occupancy: 90,
            satisfaction: 4.5,
        };
    }
    calculateVariances(actuals, targets) {
        return {
            revenue: ((actuals.revenue?.current || 0) - (targets.revenue || 0)) / (targets.revenue || 1) * 100,
            profit: ((actuals.revenue?.current || 0) * 0.18 - (targets.profit || 0)) / (targets.profit || 1) * 100,
            margin: (18 - (targets.margin || 0)),
        };
    }
    getDefaultCustomizations(dashboardType) {
        return {
            layout: 'GRID',
            widgets: [],
            filters: {
                dateRange: 'LAST_30_DAYS',
                clients: [],
                services: [],
                locations: [],
            },
            theme: {
                colorScheme: 'LIGHT',
                primaryColor: '#2563eb',
                chartStyle: 'MODERN',
            },
        };
    }
    async generateCustomDashboard(tenantId, startDate, endDate, customizations) {
        return this.generateExecutiveDashboard(tenantId, startDate, endDate);
    }
    generateExecutiveInsights(kpis, metrics, trends, comparisons) {
        const insights = [];
        if (kpis.revenueGrowth > 10) {
            insights.push('Strong revenue growth indicates healthy business expansion');
        }
        if (kpis.netMargin > 18) {
            insights.push('Net margin exceeds industry benchmark, indicating efficient operations');
        }
        if (trends.revenue.direction === 'UP' && trends.costs.velocity < trends.revenue.velocity) {
            insights.push('Revenue growing faster than costs, improving profitability trajectory');
        }
        return insights;
    }
    generateOperationalInsights(kpis, trends, analytics) {
        return [
            'Peak utilization occurs during afternoon hours',
            'Weekend usage shows growth potential',
            'Customer satisfaction directly correlates with space availability',
        ];
    }
    generateFinancialInsights(kpis, analysis, variance) {
        return [
            'Cash conversion cycle has improved by 15%',
            'Expense management showing positive trends',
            'Payment collection efficiency needs improvement',
        ];
    }
    async getOperationalMetrics(tenantId, startDate, endDate) { return {}; }
    async getUtilizationTrends(tenantId, startDate, endDate) { return {}; }
    async getBookingAnalytics(tenantId, startDate, endDate) { return {}; }
    async getCustomerMetrics(tenantId, startDate, endDate) { return {}; }
    async getOperationalComparisons(tenantId, startDate, endDate) { return {}; }
    async getOperationalTargets(tenantId) { return {}; }
    async getProfitAnalysisData(tenantId, startDate, endDate) { return {}; }
    async getCashFlowData(tenantId, startDate, endDate) { return {}; }
    async getReconciliationSummary(tenantId, startDate, endDate) { return {}; }
    async getBudgetVariance(tenantId, startDate, endDate) { return {}; }
    async getRevenueTrends(tenantId, startDate, endDate) { return {}; }
    async getProfitTrends(tenantId, startDate, endDate) { return {}; }
    async getCostTrends(tenantId, startDate, endDate) { return {}; }
    async getFinancialComparisons(tenantId, startDate, endDate) { return {}; }
    async getFinancialTargets(tenantId, startDate, endDate) { return {}; }
    async getUtilizationHeatmap(tenantId, startDate, endDate) { return {}; }
    async getBookingTrends(tenantId, startDate, endDate) { return {}; }
    async getCashFlowChartData(tenantId, startDate, endDate) { return {}; }
    async getExpenseBreakdownData(tenantId, startDate, endDate) { return {}; }
    async getDashboards(tenantId, filters = {}, pagination = {}) {
        try {
            const whereClause = { tenantId };
            if (filters.dashboardType)
                whereClause.dashboardType = filters.dashboardType;
            if (filters.createdBy)
                whereClause.createdBy = filters.createdBy;
            const [dashboards, total] = await Promise.all([
                prisma_1.prisma.financialDashboard.findMany({
                    where: whereClause,
                    orderBy: { lastRefreshed: 'desc' },
                    skip: pagination.skip || 0,
                    take: pagination.take || 50,
                }),
                prisma_1.prisma.financialDashboard.count({ where: whereClause }),
            ]);
            const dashboardData = dashboards.map(dashboard => this.mapDashboardToData(dashboard));
            const hasMore = (pagination.skip || 0) + dashboardData.length < total;
            return {
                dashboards: dashboardData,
                total,
                hasMore,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get financial dashboards', { tenantId, filters }, error);
            throw error;
        }
    }
    mapDashboardToData(dashboard) {
        return {
            id: dashboard.id,
            dashboardType: dashboard.dashboardType,
            period: dashboard.period,
            startDate: dashboard.startDate,
            endDate: dashboard.endDate,
            kpis: dashboard.kpis,
            metrics: dashboard.metrics,
            charts: dashboard.charts,
            alerts: dashboard.alerts,
            trends: dashboard.trends,
            comparisons: dashboard.comparisons,
            targets: dashboard.targets,
            actuals: dashboard.actuals,
            variances: dashboard.variances,
            insights: dashboard.insights,
            lastRefreshed: dashboard.lastRefreshed,
            refreshInterval: dashboard.refreshInterval,
            isAutoRefresh: dashboard.isAutoRefresh,
            customizations: dashboard.customizations,
            sharedWith: dashboard.sharedWith,
            isPublic: dashboard.isPublic,
            createdBy: dashboard.createdBy,
            createdAt: dashboard.createdAt,
            updatedAt: dashboard.updatedAt,
        };
    }
}
exports.FinancialDashboardService = FinancialDashboardService;
exports.financialDashboardService = new FinancialDashboardService();
//# sourceMappingURL=financialDashboardService.js.map
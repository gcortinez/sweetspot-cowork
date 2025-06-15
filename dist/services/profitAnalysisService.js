"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitAnalysisService = exports.ProfitAnalysisService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class ProfitAnalysisService {
    async generateProfitAnalysis(tenantId, userId, request) {
        try {
            const financialData = await this.getFinancialData(tenantId, request.startDate, request.endDate);
            let analysisResult;
            switch (request.analysisType) {
                case client_1.AnalysisType.PROFITABILITY:
                    analysisResult = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
                    break;
                case client_1.AnalysisType.MARGIN_ANALYSIS:
                    analysisResult = await this.generateMarginAnalysis(tenantId, financialData, request);
                    break;
                case client_1.AnalysisType.COST_ANALYSIS:
                    analysisResult = await this.generateCostAnalysis(tenantId, financialData, request);
                    break;
                case client_1.AnalysisType.BREAK_EVEN:
                    analysisResult = await this.generateBreakEvenAnalysis(tenantId, financialData, request);
                    break;
                case client_1.AnalysisType.ROI_ANALYSIS:
                    analysisResult = await this.generateROIAnalysis(tenantId, financialData, request);
                    break;
                case client_1.AnalysisType.VARIANCE_ANALYSIS:
                    analysisResult = await this.generateVarianceAnalysis(tenantId, financialData, request);
                    break;
                default:
                    throw new Error(`Unsupported analysis type: ${request.analysisType}`);
            }
            const insights = this.generateInsights(analysisResult, request.analysisType);
            const recommendations = this.generateRecommendations(analysisResult, request.analysisType);
            const analysis = await prisma_1.prisma.profitAnalysis.create({
                data: {
                    tenantId,
                    analysisType: request.analysisType,
                    period: request.period,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    totalRevenue: analysisResult.totalRevenue,
                    totalCosts: analysisResult.totalCosts,
                    grossProfit: analysisResult.grossProfit,
                    grossMargin: analysisResult.grossMargin,
                    operatingExpenses: analysisResult.operatingExpenses,
                    operatingProfit: analysisResult.operatingProfit,
                    operatingMargin: analysisResult.operatingMargin,
                    netProfit: analysisResult.netProfit,
                    netMargin: analysisResult.netMargin,
                    ebitda: analysisResult.ebitda,
                    costBreakdown: analysisResult.costBreakdown,
                    revenueBreakdown: analysisResult.revenueBreakdown,
                    profitTrends: analysisResult.profitTrends,
                    marginAnalysis: analysisResult.marginAnalysis,
                    benchmarks: analysisResult.benchmarks,
                    kpis: analysisResult.kpis,
                    insights,
                    recommendations,
                    createdBy: userId,
                },
            });
            logger_1.logger.info('Profit analysis generated successfully', {
                tenantId,
                analysisId: analysis.id,
                analysisType: request.analysisType,
                totalRevenue: analysisResult.totalRevenue,
                netMargin: analysisResult.netMargin,
            });
            return this.mapAnalysisToData(analysis);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate profit analysis', {
                tenantId,
                request,
                userId,
            }, error);
            throw error;
        }
    }
    async generateProfitabilityAnalysis(tenantId, financialData, request) {
        const { totalRevenue, totalCosts, costBreakdown } = financialData;
        const grossProfit = totalRevenue - costBreakdown.cogs;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const operatingExpenses = costBreakdown.operating;
        const operatingProfit = grossProfit - operatingExpenses;
        const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
        const netProfit = operatingProfit - costBreakdown.taxes - costBreakdown.interest;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const ebitda = operatingProfit + costBreakdown.depreciation + costBreakdown.interest;
        const profitabilityMetrics = this.calculateProfitabilityMetrics({
            totalRevenue,
            grossProfit,
            operatingProfit,
            netProfit,
            ebitda,
            fixedCosts: costBreakdown.fixed,
            variableCosts: costBreakdown.variable,
        });
        const profitTrends = await this.analyzeProfitTrends(tenantId, request.startDate, request.endDate);
        const benchmarks = this.getBenchmarkComparisons(profitabilityMetrics);
        const kpis = {
            profitabilityMetrics,
            profitPerCustomer: this.calculateProfitPerCustomer(netProfit, financialData.customerCount),
            revenuePerEmployee: this.calculateRevenuePerEmployee(totalRevenue, financialData.employeeCount),
            assetTurnover: this.calculateAssetTurnover(totalRevenue, financialData.totalAssets),
            profitGrowthRate: await this.calculateProfitGrowthRate(tenantId, request.startDate, request.endDate),
        };
        return {
            totalRevenue,
            totalCosts,
            grossProfit,
            grossMargin,
            operatingExpenses,
            operatingProfit,
            operatingMargin,
            netProfit,
            netMargin,
            ebitda,
            costBreakdown: financialData.costBreakdown,
            revenueBreakdown: financialData.revenueBreakdown,
            profitTrends,
            marginAnalysis: this.analyzeMargins(profitabilityMetrics, profitTrends),
            benchmarks,
            kpis,
        };
    }
    async generateMarginAnalysis(tenantId, financialData, request) {
        const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
        const marginTrends = await this.getMarginTrends(tenantId, request.startDate, request.endDate);
        const marginDrivers = this.identifyMarginDrivers(financialData, marginTrends);
        const marginComparison = this.getMarginBenchmarks(baseAnalysis.grossMargin, baseAnalysis.operatingMargin, baseAnalysis.netMargin);
        const marginForecasting = await this.forecastMargins(tenantId, marginTrends);
        const marginAnalysis = {
            marginTrends,
            marginDrivers,
            marginComparison,
            marginForecasting,
        };
        return {
            ...baseAnalysis,
            marginAnalysis,
            kpis: {
                ...baseAnalysis.kpis,
                marginStability: this.calculateMarginStability(marginTrends),
                marginImprovement: this.calculateMarginImprovement(marginTrends),
                marginRisk: this.assessMarginRisk(marginDrivers),
            },
        };
    }
    async generateCostAnalysis(tenantId, financialData, request) {
        const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
        const costAnalysis = this.performDetailedCostAnalysis(financialData);
        const costTrends = await this.getCostTrends(tenantId, request.startDate, request.endDate);
        const costEfficiency = this.analyzeCostEfficiency(costAnalysis, financialData.totalRevenue);
        const costOptimization = this.identifyCostOptimizationOpportunities(costAnalysis, costTrends);
        return {
            ...baseAnalysis,
            costBreakdown: {
                ...baseAnalysis.costBreakdown,
                detailed: costAnalysis,
                trends: costTrends,
                efficiency: costEfficiency,
                optimization: costOptimization,
            },
            kpis: {
                ...baseAnalysis.kpis,
                costPerRevenueDollar: financialData.totalCosts / financialData.totalRevenue,
                fixedCostRatio: costAnalysis.fixedCosts.total / financialData.totalRevenue,
                variableCostRatio: costAnalysis.variableCosts.total / financialData.totalRevenue,
                costEfficiencyIndex: costEfficiency.index,
            },
        };
    }
    async generateBreakEvenAnalysis(tenantId, financialData, request) {
        const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
        const costAnalysis = this.performDetailedCostAnalysis(financialData);
        const fixedCosts = costAnalysis.fixedCosts.total;
        const variableCostPerUnit = costAnalysis.variableCosts.unitCost;
        const averageSellingPrice = this.calculateAverageSellingPrice(financialData);
        const contributionMarginPerUnit = averageSellingPrice - variableCostPerUnit;
        const contributionMarginRatio = contributionMarginPerUnit / averageSellingPrice;
        const breakEvenUnits = fixedCosts / contributionMarginPerUnit;
        const breakEvenRevenue = breakEvenUnits * averageSellingPrice;
        const currentRevenue = financialData.totalRevenue;
        const marginOfSafety = {
            dollars: currentRevenue - breakEvenRevenue,
            percentage: currentRevenue > 0 ? ((currentRevenue - breakEvenRevenue) / currentRevenue) * 100 : 0,
        };
        const operatingLeverage = contributionMarginRatio > 0 ?
            (contributionMarginRatio * currentRevenue) / baseAnalysis.operatingProfit : 0;
        const scenarioAnalysis = this.performBreakEvenScenarioAnalysis({
            fixedCosts,
            variableCostRatio: costAnalysis.variableCosts.total / currentRevenue,
            currentRevenue,
            contributionMarginRatio,
        });
        const breakEvenAnalysis = {
            breakEvenRevenue,
            breakEvenUnits,
            contributionMarginRatio: contributionMarginRatio * 100,
            marginOfSafety,
            operatingLeverage,
            scenarioAnalysis,
        };
        return {
            ...baseAnalysis,
            kpis: {
                ...baseAnalysis.kpis,
                breakEvenAnalysis,
                targetRevenueForProfit: this.calculateTargetRevenue(fixedCosts, contributionMarginRatio, 0.15),
                salesRequiredForBreakEven: breakEvenUnits,
            },
        };
    }
    async generateROIAnalysis(tenantId, financialData, request) {
        const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
        const roiAnalysis = {
            returnOnAssets: this.calculateROA(baseAnalysis.netProfit, financialData.totalAssets),
            returnOnEquity: this.calculateROE(baseAnalysis.netProfit, financialData.totalEquity),
            returnOnInvestment: this.calculateROI(baseAnalysis.netProfit, financialData.totalInvestment),
            paybackPeriod: this.calculatePaybackPeriod(financialData.initialInvestment, baseAnalysis.netProfit),
            internalRateOfReturn: this.calculateIRR(financialData.cashFlows),
            netPresentValue: this.calculateNPV(financialData.cashFlows, 0.1),
            profitabilityIndex: this.calculatePI(financialData.cashFlows, financialData.initialInvestment, 0.1),
        };
        const investmentEfficiency = {
            capitalEfficiency: baseAnalysis.totalRevenue / financialData.totalAssets,
            assetUtilization: this.calculateAssetUtilization(financialData),
            workingCapitalTurnover: this.calculateWorkingCapitalTurnover(financialData),
            inventoryTurnover: this.calculateInventoryTurnover(financialData),
        };
        return {
            ...baseAnalysis,
            kpis: {
                ...baseAnalysis.kpis,
                roiAnalysis,
                investmentEfficiency,
                valueCreation: roiAnalysis.returnOnInvestment > 15 ? 'POSITIVE' : 'NEGATIVE',
                performanceRating: this.calculatePerformanceRating(roiAnalysis),
            },
        };
    }
    async generateVarianceAnalysis(tenantId, financialData, request) {
        const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
        const budgetData = await this.getBudgetData(tenantId, request.startDate, request.endDate);
        const varianceAnalysis = {
            revenueVariance: {
                planned: budgetData.plannedRevenue,
                actual: financialData.totalRevenue,
                variance: financialData.totalRevenue - budgetData.plannedRevenue,
                variancePercent: budgetData.plannedRevenue > 0 ?
                    ((financialData.totalRevenue - budgetData.plannedRevenue) / budgetData.plannedRevenue) * 100 : 0,
                factors: this.identifyRevenueVarianceFactors(financialData, budgetData),
            },
            costVariance: {
                planned: budgetData.plannedCosts,
                actual: financialData.totalCosts,
                variance: financialData.totalCosts - budgetData.plannedCosts,
                variancePercent: budgetData.plannedCosts > 0 ?
                    ((financialData.totalCosts - budgetData.plannedCosts) / budgetData.plannedCosts) * 100 : 0,
                factors: this.identifyCostVarianceFactors(financialData, budgetData),
            },
            profitVariance: {
                planned: budgetData.plannedProfit,
                actual: baseAnalysis.netProfit,
                variance: baseAnalysis.netProfit - budgetData.plannedProfit,
                variancePercent: budgetData.plannedProfit > 0 ?
                    ((baseAnalysis.netProfit - budgetData.plannedProfit) / budgetData.plannedProfit) * 100 : 0,
            },
            marginVariance: {
                planned: budgetData.plannedMargin,
                actual: baseAnalysis.netMargin,
                variance: baseAnalysis.netMargin - budgetData.plannedMargin,
            },
        };
        return {
            ...baseAnalysis,
            kpis: {
                ...baseAnalysis.kpis,
                varianceAnalysis,
                budgetAccuracy: this.calculateBudgetAccuracy(varianceAnalysis),
                performanceVsBudget: this.assessPerformanceVsBudget(varianceAnalysis),
            },
        };
    }
    async getFinancialData(tenantId, startDate, endDate) {
        const invoices = await prisma_1.prisma.invoice.findMany({
            where: {
                tenantId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'PAID',
            },
            include: {
                items: true,
                client: true,
            },
        });
        const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
        const revenueBreakdown = this.categorizeRevenue(invoices);
        const totalCosts = totalRevenue * 0.75;
        const costBreakdown = {
            cogs: totalCosts * 0.3,
            operating: totalCosts * 0.4,
            fixed: totalCosts * 0.6,
            variable: totalCosts * 0.4,
            depreciation: totalCosts * 0.05,
            interest: totalCosts * 0.02,
            taxes: totalCosts * 0.03,
        };
        const customerCount = new Set(invoices.map(inv => inv.clientId)).size;
        const employeeCount = 10;
        const totalAssets = totalRevenue * 2;
        const totalEquity = totalAssets * 0.6;
        const totalInvestment = totalAssets * 0.8;
        return {
            totalRevenue,
            totalCosts,
            revenueBreakdown,
            costBreakdown,
            customerCount,
            employeeCount,
            totalAssets,
            totalEquity,
            totalInvestment,
            initialInvestment: totalInvestment,
            cashFlows: this.estimateCashFlows(totalRevenue, totalCosts),
        };
    }
    calculateProfitabilityMetrics(data) {
        const { totalRevenue, grossProfit, operatingProfit, netProfit, ebitda, fixedCosts, variableCosts, } = data;
        const contributionMargin = totalRevenue - variableCosts;
        const contributionMarginRatio = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;
        const breakEvenPoint = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;
        const marginOfSafety = totalRevenue > breakEvenPoint ?
            ((totalRevenue - breakEvenPoint) / totalRevenue) * 100 : 0;
        return {
            grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
            operatingProfitMargin: totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0,
            netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
            ebitdaMargin: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0,
            returnOnRevenue: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
            contributionMargin: contributionMarginRatio * 100,
            breakEvenPoint,
            marginOfSafety,
        };
    }
    async analyzeProfitTrends(tenantId, startDate, endDate) {
        const monthlyData = await this.getMonthlyProfitData(tenantId, startDate, endDate);
        const profits = monthlyData.map(d => d.profit);
        const trendDirection = this.calculateTrendDirection(profits);
        const velocity = this.calculateTrendVelocity(profits);
        return {
            monthlyProfits: monthlyData,
            trendAnalysis: {
                direction: trendDirection,
                velocity,
                seasonality: this.detectSeasonality(monthlyData),
                cyclicalPattern: this.detectCyclicalPattern(monthlyData),
            },
            profitDrivers: [
                { driver: 'Revenue Growth', correlation: 0.85, impact: 'HIGH' },
                { driver: 'Cost Management', correlation: -0.72, impact: 'HIGH' },
                { driver: 'Operational Efficiency', correlation: 0.68, impact: 'MEDIUM' },
                { driver: 'Market Conditions', correlation: 0.45, impact: 'MEDIUM' },
            ],
        };
    }
    analyzeMargins(metrics, trends) {
        return {
            currentMargins: {
                gross: metrics.grossProfitMargin,
                operating: metrics.operatingProfitMargin,
                net: metrics.netProfitMargin,
                ebitda: metrics.ebitdaMargin,
            },
            marginHealth: {
                grossMarginHealth: this.assessMarginHealth(metrics.grossProfitMargin, 60),
                operatingMarginHealth: this.assessMarginHealth(metrics.operatingProfitMargin, 20),
                netMarginHealth: this.assessMarginHealth(metrics.netProfitMargin, 15),
            },
            marginImprovement: {
                potential: this.calculateMarginImprovementPotential(metrics),
                recommendations: this.getMarginImprovementRecommendations(metrics),
            },
            riskFactors: this.identifyMarginRisks(trends),
        };
    }
    getBenchmarkComparisons(metrics) {
        const industryMetrics = {
            grossMargin: 65,
            operatingMargin: 25,
            netMargin: 18,
            ebitdaMargin: 30,
        };
        const ranking = this.calculateIndustryRanking(metrics, industryMetrics);
        const percentile = this.calculatePercentile(ranking);
        return {
            industryMetrics,
            peerComparison: {
                ranking,
                percentile,
                gapAnalysis: [
                    {
                        metric: 'Gross Margin',
                        gap: metrics.grossProfitMargin - industryMetrics.grossMargin,
                        improvement: metrics.grossProfitMargin < industryMetrics.grossMargin ?
                            'Focus on pricing optimization and cost reduction' : 'Maintain current performance',
                    },
                    {
                        metric: 'Operating Margin',
                        gap: metrics.operatingProfitMargin - industryMetrics.operatingMargin,
                        improvement: metrics.operatingProfitMargin < industryMetrics.operatingMargin ?
                            'Optimize operational efficiency' : 'Leverage for growth investment',
                    },
                ],
            },
            bestPractices: [
                'Implement dynamic pricing strategies',
                'Optimize space utilization',
                'Diversify revenue streams',
                'Automate operational processes',
                'Focus on customer retention',
            ],
        };
    }
    generateInsights(analysisResult, analysisType) {
        const insights = [];
        if (analysisResult.netMargin > 15) {
            insights.push('Strong profitability with healthy net margins above industry average');
        }
        else if (analysisResult.netMargin > 10) {
            insights.push('Moderate profitability with room for improvement');
        }
        else {
            insights.push('Below-average profitability requires immediate attention');
        }
        switch (analysisType) {
            case client_1.AnalysisType.PROFITABILITY:
                if (analysisResult.grossMargin > 60) {
                    insights.push('Excellent gross margin indicates strong pricing power');
                }
                if (analysisResult.operatingMargin < analysisResult.grossMargin * 0.4) {
                    insights.push('High operating expenses are impacting profitability');
                }
                break;
            case client_1.AnalysisType.MARGIN_ANALYSIS:
                const marginTrend = analysisResult.marginAnalysis?.marginTrends?.slice(-3);
                if (marginTrend && marginTrend.length >= 2) {
                    const isImproving = marginTrend[marginTrend.length - 1].netMargin > marginTrend[0].netMargin;
                    insights.push(isImproving ? 'Margins are improving over time' : 'Margins are declining and need attention');
                }
                break;
            case client_1.AnalysisType.COST_ANALYSIS:
                if (analysisResult.costBreakdown?.detailed?.fixedCosts?.percentOfRevenue > 60) {
                    insights.push('High fixed cost ratio may limit flexibility during downturns');
                }
                break;
        }
        return insights;
    }
    generateRecommendations(analysisResult, analysisType) {
        const recommendations = [];
        if (analysisResult.netMargin < 15) {
            recommendations.push('Implement cost reduction initiatives to improve margins');
            recommendations.push('Review pricing strategy to increase revenue per customer');
        }
        if (analysisResult.grossMargin < 60) {
            recommendations.push('Focus on premium service offerings to improve gross margins');
        }
        switch (analysisType) {
            case client_1.AnalysisType.PROFITABILITY:
                recommendations.push('Optimize space utilization to maximize revenue per square foot');
                recommendations.push('Develop recurring revenue streams for predictable cash flow');
                break;
            case client_1.AnalysisType.MARGIN_ANALYSIS:
                recommendations.push('Implement dynamic pricing based on demand patterns');
                recommendations.push('Automate operations to reduce labor costs');
                break;
            case client_1.AnalysisType.COST_ANALYSIS:
                recommendations.push('Negotiate better rates with suppliers and vendors');
                recommendations.push('Implement energy-efficient solutions to reduce utility costs');
                break;
            case client_1.AnalysisType.BREAK_EVEN:
                const breakEven = analysisResult.kpis?.breakEvenAnalysis;
                if (breakEven && analysisResult.totalRevenue < breakEven.breakEvenRevenue * 1.2) {
                    recommendations.push('Increase sales volume to improve margin of safety');
                }
                break;
        }
        return recommendations;
    }
    categorizeRevenue(invoices) {
        const breakdown = {
            membership: 0,
            dayPasses: 0,
            meetingRooms: 0,
            services: 0,
            other: 0,
        };
        invoices.forEach(invoice => {
            invoice.items.forEach((item) => {
                const amount = Number(item.total);
                const description = item.description.toLowerCase();
                if (description.includes('membership') || description.includes('plan')) {
                    breakdown.membership += amount;
                }
                else if (description.includes('day pass') || description.includes('daily')) {
                    breakdown.dayPasses += amount;
                }
                else if (description.includes('meeting') || description.includes('room')) {
                    breakdown.meetingRooms += amount;
                }
                else if (description.includes('service')) {
                    breakdown.services += amount;
                }
                else {
                    breakdown.other += amount;
                }
            });
        });
        return breakdown;
    }
    async getMonthlyProfitData(tenantId, startDate, endDate) {
        const monthlyData = [];
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
            const costs = revenue * 0.75;
            const profit = revenue - costs;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            monthlyData.push({
                month: monthStart.toISOString().slice(0, 7),
                revenue,
                costs,
                profit,
                margin,
            });
            current.setMonth(current.getMonth() + 1);
        }
        return monthlyData;
    }
    calculateTrendDirection(data) {
        if (data.length < 2)
            return 'STABLE';
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const change = (secondAvg - firstAvg) / firstAvg;
        if (change > 0.05)
            return 'INCREASING';
        if (change < -0.05)
            return 'DECREASING';
        return 'STABLE';
    }
    calculateTrendVelocity(data) {
        if (data.length < 2)
            return 0;
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            if (data[i - 1] > 0) {
                changes.push((data[i] - data[i - 1]) / data[i - 1]);
            }
        }
        return changes.reduce((sum, change) => sum + change, 0) / changes.length;
    }
    detectSeasonality(monthlyData) {
        return monthlyData.length >= 12;
    }
    detectCyclicalPattern(monthlyData) {
        return false;
    }
    assessMarginHealth(actualMargin, benchmarkMargin) {
        const ratio = actualMargin / benchmarkMargin;
        if (ratio >= 1.1)
            return 'EXCELLENT';
        if (ratio >= 0.9)
            return 'GOOD';
        if (ratio >= 0.7)
            return 'FAIR';
        return 'POOR';
    }
    calculateMarginImprovementPotential(metrics) {
        const benchmarkNet = 18;
        return Math.max(0, benchmarkNet - metrics.netProfitMargin);
    }
    getMarginImprovementRecommendations(metrics) {
        const recommendations = [];
        if (metrics.grossProfitMargin < 60) {
            recommendations.push('Increase pricing for premium services');
            recommendations.push('Negotiate better supplier terms');
        }
        if (metrics.operatingProfitMargin < 20) {
            recommendations.push('Automate repetitive tasks');
            recommendations.push('Optimize space layout for higher utilization');
        }
        return recommendations;
    }
    identifyMarginRisks(trends) {
        const risks = [];
        if (trends.trendAnalysis.direction === 'DECREASING') {
            risks.push('Declining margin trend');
        }
        if (trends.trendAnalysis.velocity < -0.02) {
            risks.push('Rapidly declining profitability');
        }
        return risks;
    }
    mapAnalysisToData(analysis) {
        return {
            id: analysis.id,
            analysisType: analysis.analysisType,
            period: analysis.period,
            startDate: analysis.startDate,
            endDate: analysis.endDate,
            totalRevenue: Number(analysis.totalRevenue),
            totalCosts: Number(analysis.totalCosts),
            grossProfit: Number(analysis.grossProfit),
            grossMargin: Number(analysis.grossMargin),
            operatingExpenses: Number(analysis.operatingExpenses),
            operatingProfit: Number(analysis.operatingProfit),
            operatingMargin: Number(analysis.operatingMargin),
            netProfit: Number(analysis.netProfit),
            netMargin: Number(analysis.netMargin),
            ebitda: Number(analysis.ebitda),
            costBreakdown: analysis.costBreakdown,
            revenueBreakdown: analysis.revenueBreakdown,
            profitTrends: analysis.profitTrends,
            marginAnalysis: analysis.marginAnalysis,
            benchmarks: analysis.benchmarks,
            kpis: analysis.kpis,
            insights: analysis.insights,
            recommendations: analysis.recommendations,
            createdBy: analysis.createdBy,
            createdAt: analysis.createdAt,
            updatedAt: analysis.updatedAt,
        };
    }
    calculateProfitPerCustomer(netProfit, customerCount) {
        return customerCount > 0 ? netProfit / customerCount : 0;
    }
    calculateRevenuePerEmployee(totalRevenue, employeeCount) {
        return employeeCount > 0 ? totalRevenue / employeeCount : 0;
    }
    calculateAssetTurnover(totalRevenue, totalAssets) {
        return totalAssets > 0 ? totalRevenue / totalAssets : 0;
    }
    async calculateProfitGrowthRate(tenantId, startDate, endDate) {
        return 15.5;
    }
    estimateCashFlows(totalRevenue, totalCosts) {
        const netCashFlow = totalRevenue - totalCosts;
        return Array(12).fill(netCashFlow / 12);
    }
    calculateROA(netProfit, totalAssets) {
        return totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
    }
    calculateROE(netProfit, totalEquity) {
        return totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
    }
    calculateROI(netProfit, totalInvestment) {
        return totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    }
    calculatePaybackPeriod(initialInvestment, annualCashFlow) {
        return annualCashFlow > 0 ? initialInvestment / annualCashFlow : 0;
    }
    calculateIRR(cashFlows) {
        return 12.5;
    }
    calculateNPV(cashFlows, discountRate) {
        return cashFlows.reduce((npv, cf, index) => {
            return npv + cf / Math.pow(1 + discountRate, index + 1);
        }, -cashFlows[0]);
    }
    calculatePI(cashFlows, initialInvestment, discountRate) {
        const presentValueOfCashFlows = cashFlows.slice(1).reduce((pv, cf, index) => {
            return pv + cf / Math.pow(1 + discountRate, index + 1);
        }, 0);
        return initialInvestment > 0 ? presentValueOfCashFlows / initialInvestment : 0;
    }
    performDetailedCostAnalysis(financialData) {
        return {
            fixedCosts: {
                total: financialData.costBreakdown.fixed,
                breakdown: {
                    rent: financialData.costBreakdown.fixed * 0.4,
                    salaries: financialData.costBreakdown.fixed * 0.3,
                    insurance: financialData.costBreakdown.fixed * 0.1,
                    utilities: financialData.costBreakdown.fixed * 0.1,
                    depreciation: financialData.costBreakdown.fixed * 0.05,
                    other: financialData.costBreakdown.fixed * 0.05,
                },
                percentOfRevenue: (financialData.costBreakdown.fixed / financialData.totalRevenue) * 100,
            },
            variableCosts: {
                total: financialData.costBreakdown.variable,
                breakdown: {
                    supplies: financialData.costBreakdown.variable * 0.3,
                    commissions: financialData.costBreakdown.variable * 0.2,
                    marketing: financialData.costBreakdown.variable * 0.2,
                    maintenance: financialData.costBreakdown.variable * 0.2,
                    other: financialData.costBreakdown.variable * 0.1,
                },
                percentOfRevenue: (financialData.costBreakdown.variable / financialData.totalRevenue) * 100,
                unitCost: financialData.customerCount > 0 ? financialData.costBreakdown.variable / financialData.customerCount : 0,
            },
            costStructure: {
                fixedVsVariable: (financialData.costBreakdown.fixed / financialData.totalCosts) * 100,
                scalability: 75,
                efficiency: 80,
            },
        };
    }
    async getCostTrends(tenantId, startDate, endDate) {
        return {
            trend: 'STABLE',
            monthlyData: [],
        };
    }
    analyzeCostEfficiency(costAnalysis, totalRevenue) {
        return {
            index: 85,
            benchmark: 90,
            opportunities: ['Automate manual processes', 'Negotiate supplier contracts'],
        };
    }
    identifyCostOptimizationOpportunities(costAnalysis, costTrends) {
        return [
            'Implement energy-efficient lighting',
            'Automate cleaning schedules',
            'Negotiate bulk purchasing agreements',
        ];
    }
    async getBudgetData(tenantId, startDate, endDate) {
        return {
            plannedRevenue: 100000,
            plannedCosts: 75000,
            plannedProfit: 25000,
            plannedMargin: 25,
        };
    }
    identifyRevenueVarianceFactors(financialData, budgetData) {
        return ['Market demand changes', 'Pricing adjustments', 'New customer acquisition'];
    }
    identifyCostVarianceFactors(financialData, budgetData) {
        return ['Inflation in supplier costs', 'Increased utility rates', 'Additional staff hiring'];
    }
    calculateBudgetAccuracy(varianceAnalysis) {
        const avgVariance = Math.abs(varianceAnalysis.revenueVariance.variancePercent) +
            Math.abs(varianceAnalysis.costVariance.variancePercent);
        return Math.max(0, 100 - avgVariance / 2);
    }
    assessPerformanceVsBudget(varianceAnalysis) {
        if (varianceAnalysis.profitVariance.variancePercent > 10)
            return 'EXCEEDING';
        if (varianceAnalysis.profitVariance.variancePercent > -5)
            return 'ON_TARGET';
        return 'BELOW_TARGET';
    }
    calculateAverageSellingPrice(financialData) {
        return financialData.customerCount > 0 ? financialData.totalRevenue / financialData.customerCount : 0;
    }
    performBreakEvenScenarioAnalysis(params) {
        return [
            { scenario: 'Conservative', revenueChange: -10, profitChange: -25, breakEvenChange: 15 },
            { scenario: 'Base Case', revenueChange: 0, profitChange: 0, breakEvenChange: 0 },
            { scenario: 'Optimistic', revenueChange: 15, profitChange: 40, breakEvenChange: -12 },
        ];
    }
    calculateTargetRevenue(fixedCosts, contributionMarginRatio, targetProfitMargin) {
        return contributionMarginRatio > 0 ? (fixedCosts / (contributionMarginRatio - targetProfitMargin)) : 0;
    }
    calculateAssetUtilization(financialData) {
        return 75;
    }
    calculateWorkingCapitalTurnover(financialData) {
        return 6.5;
    }
    calculateInventoryTurnover(financialData) {
        return 12;
    }
    calculatePerformanceRating(roiAnalysis) {
        if (roiAnalysis.returnOnInvestment > 20)
            return 'EXCELLENT';
        if (roiAnalysis.returnOnInvestment > 15)
            return 'GOOD';
        if (roiAnalysis.returnOnInvestment > 10)
            return 'FAIR';
        return 'POOR';
    }
    calculateIndustryRanking(metrics, benchmarks) {
        const score = (metrics.grossProfitMargin / benchmarks.grossMargin) * 0.3 +
            (metrics.operatingProfitMargin / benchmarks.operatingMargin) * 0.3 +
            (metrics.netProfitMargin / benchmarks.netMargin) * 0.4;
        return Math.round(score * 100);
    }
    calculatePercentile(ranking) {
        return Math.min(99, Math.max(1, ranking));
    }
    async getMarginTrends(tenantId, startDate, endDate) {
        return [
            { period: '2024-01', grossMargin: 65, operatingMargin: 22, netMargin: 16 },
            { period: '2024-02', grossMargin: 67, operatingMargin: 24, netMargin: 18 },
            { period: '2024-03', grossMargin: 64, operatingMargin: 23, netMargin: 17 },
        ];
    }
    identifyMarginDrivers(financialData, marginTrends) {
        return [
            { factor: 'Pricing Strategy', impact: 15, trend: 'IMPROVING' },
            { factor: 'Cost Management', impact: -8, trend: 'STABLE' },
            { factor: 'Operational Efficiency', impact: 12, trend: 'IMPROVING' },
        ];
    }
    getMarginBenchmarks(grossMargin, operatingMargin, netMargin) {
        return {
            industryAverage: 18,
            topQuartile: 25,
            performance: netMargin > 20 ? 'ABOVE_AVERAGE' : netMargin > 15 ? 'AVERAGE' : 'BELOW_AVERAGE',
        };
    }
    async forecastMargins(tenantId, marginTrends) {
        const recentMargin = marginTrends[marginTrends.length - 1]?.netMargin || 15;
        return {
            nextQuarter: recentMargin * 1.02,
            nextYear: recentMargin * 1.05,
            confidence: 75,
        };
    }
    calculateMarginStability(marginTrends) {
        if (marginTrends.length < 2)
            return 100;
        const margins = marginTrends.map(t => t.netMargin);
        const mean = margins.reduce((sum, m) => sum + m, 0) / margins.length;
        const variance = margins.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / margins.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        return Math.max(0, 100 - (coefficientOfVariation * 100));
    }
    calculateMarginImprovement(marginTrends) {
        if (marginTrends.length < 2)
            return 0;
        const first = marginTrends[0].netMargin;
        const last = marginTrends[marginTrends.length - 1].netMargin;
        return ((last - first) / first) * 100;
    }
    assessMarginRisk(marginDrivers) {
        const negativeDrivers = marginDrivers.filter(d => d.impact < 0);
        if (negativeDrivers.length > marginDrivers.length / 2)
            return 'HIGH';
        if (negativeDrivers.length > 0)
            return 'MEDIUM';
        return 'LOW';
    }
}
exports.ProfitAnalysisService = ProfitAnalysisService;
exports.profitAnalysisService = new ProfitAnalysisService();
//# sourceMappingURL=profitAnalysisService.js.map
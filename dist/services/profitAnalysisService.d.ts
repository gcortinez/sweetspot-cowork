import { AnalysisType, ReportPeriod } from '@prisma/client';
export interface ProfitAnalysisData {
    id: string;
    analysisType: AnalysisType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    grossMargin: number;
    operatingExpenses: number;
    operatingProfit: number;
    operatingMargin: number;
    netProfit: number;
    netMargin: number;
    ebitda: number;
    costBreakdown: any;
    revenueBreakdown: any;
    profitTrends: any;
    marginAnalysis: any;
    benchmarks: any;
    kpis: any;
    insights: string[];
    recommendations: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateProfitAnalysisRequest {
    analysisType: AnalysisType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    compareWith?: {
        startDate: Date;
        endDate: Date;
    };
    includeForecasting?: boolean;
}
export interface ProfitabilityMetrics {
    grossProfitMargin: number;
    operatingProfitMargin: number;
    netProfitMargin: number;
    ebitdaMargin: number;
    returnOnRevenue: number;
    contributionMargin: number;
    breakEvenPoint: number;
    marginOfSafety: number;
}
export interface CostAnalysis {
    fixedCosts: {
        total: number;
        breakdown: {
            rent: number;
            salaries: number;
            insurance: number;
            utilities: number;
            depreciation: number;
            other: number;
        };
        percentOfRevenue: number;
    };
    variableCosts: {
        total: number;
        breakdown: {
            supplies: number;
            commissions: number;
            marketing: number;
            maintenance: number;
            other: number;
        };
        percentOfRevenue: number;
        unitCost: number;
    };
    costStructure: {
        fixedVsVariable: number;
        scalability: number;
        efficiency: number;
    };
}
export interface MarginAnalysis {
    marginTrends: Array<{
        period: string;
        grossMargin: number;
        operatingMargin: number;
        netMargin: number;
    }>;
    marginDrivers: Array<{
        factor: string;
        impact: number;
        trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    }>;
    marginComparison: {
        industryAverage: number;
        topQuartile: number;
        performance: 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE';
    };
    marginForecasting: {
        nextQuarter: number;
        nextYear: number;
        confidence: number;
    };
}
export interface BreakEvenAnalysis {
    breakEvenRevenue: number;
    breakEvenUnits: number;
    contributionMarginRatio: number;
    marginOfSafety: {
        dollars: number;
        percentage: number;
    };
    operatingLeverage: number;
    scenarioAnalysis: Array<{
        scenario: string;
        revenueChange: number;
        profitChange: number;
        breakEvenChange: number;
    }>;
}
export interface ROIAnalysis {
    returnOnAssets: number;
    returnOnEquity: number;
    returnOnInvestment: number;
    paybackPeriod: number;
    internalRateOfReturn: number;
    netPresentValue: number;
    profitabilityIndex: number;
}
export interface VarianceAnalysis {
    revenueVariance: {
        planned: number;
        actual: number;
        variance: number;
        variancePercent: number;
        factors: string[];
    };
    costVariance: {
        planned: number;
        actual: number;
        variance: number;
        variancePercent: number;
        factors: string[];
    };
    profitVariance: {
        planned: number;
        actual: number;
        variance: number;
        variancePercent: number;
    };
    marginVariance: {
        planned: number;
        actual: number;
        variance: number;
    };
}
export interface ProfitTrends {
    monthlyProfits: Array<{
        month: string;
        revenue: number;
        costs: number;
        profit: number;
        margin: number;
    }>;
    trendAnalysis: {
        direction: 'INCREASING' | 'DECREASING' | 'STABLE';
        velocity: number;
        seasonality: boolean;
        cyclicalPattern: boolean;
    };
    profitDrivers: Array<{
        driver: string;
        correlation: number;
        impact: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
}
export interface BenchmarkComparison {
    industryMetrics: {
        grossMargin: number;
        operatingMargin: number;
        netMargin: number;
        ebitdaMargin: number;
    };
    peerComparison: {
        ranking: number;
        percentile: number;
        gapAnalysis: Array<{
            metric: string;
            gap: number;
            improvement: string;
        }>;
    };
    bestPractices: string[];
}
export declare class ProfitAnalysisService {
    generateProfitAnalysis(tenantId: string, userId: string, request: CreateProfitAnalysisRequest): Promise<ProfitAnalysisData>;
    private generateProfitabilityAnalysis;
    private generateMarginAnalysis;
    private generateCostAnalysis;
    private generateBreakEvenAnalysis;
    private generateROIAnalysis;
    private generateVarianceAnalysis;
    private getFinancialData;
    private calculateProfitabilityMetrics;
    private analyzeProfitTrends;
    private analyzeMargins;
    private getBenchmarkComparisons;
    private generateInsights;
    private generateRecommendations;
    private categorizeRevenue;
    private getMonthlyProfitData;
    private calculateTrendDirection;
    private calculateTrendVelocity;
    private detectSeasonality;
    private detectCyclicalPattern;
    private assessMarginHealth;
    private calculateMarginImprovementPotential;
    private getMarginImprovementRecommendations;
    private identifyMarginRisks;
    private mapAnalysisToData;
    private calculateProfitPerCustomer;
    private calculateRevenuePerEmployee;
    private calculateAssetTurnover;
    private calculateProfitGrowthRate;
    private estimateCashFlows;
    private calculateROA;
    private calculateROE;
    private calculateROI;
    private calculatePaybackPeriod;
    private calculateIRR;
    private calculateNPV;
    private calculatePI;
    private performDetailedCostAnalysis;
    private getCostTrends;
    private analyzeCostEfficiency;
    private identifyCostOptimizationOpportunities;
    private getBudgetData;
    private identifyRevenueVarianceFactors;
    private identifyCostVarianceFactors;
    private calculateBudgetAccuracy;
    private assessPerformanceVsBudget;
    private calculateAverageSellingPrice;
    private performBreakEvenScenarioAnalysis;
    private calculateTargetRevenue;
    private calculateAssetUtilization;
    private calculateWorkingCapitalTurnover;
    private calculateInventoryTurnover;
    private calculatePerformanceRating;
    private calculateIndustryRanking;
    private calculatePercentile;
    private getMarginTrends;
    private identifyMarginDrivers;
    private getMarginBenchmarks;
    private forecastMargins;
    private calculateMarginStability;
    private calculateMarginImprovement;
    private assessMarginRisk;
}
export declare const profitAnalysisService: ProfitAnalysisService;
//# sourceMappingURL=profitAnalysisService.d.ts.map
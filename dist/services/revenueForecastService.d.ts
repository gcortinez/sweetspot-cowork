import { ForecastType, ForecastPeriod, ForecastMethod, ForecastStatus } from '@prisma/client';
export interface RevenueForecastData {
    id: string;
    forecastType: ForecastType;
    period: ForecastPeriod;
    startDate: Date;
    endDate: Date;
    baseRevenue: number;
    projectedRevenue: number;
    confidence: number;
    methodology: ForecastMethod;
    parameters: any;
    assumptions: string[];
    risks: string[];
    trends: any;
    seasonality: any;
    accuracy?: number;
    status: ForecastStatus;
    notes?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateForecastRequest {
    forecastType: ForecastType;
    period: ForecastPeriod;
    startDate: Date;
    endDate: Date;
    methodology: ForecastMethod;
    customParameters?: Record<string, any>;
    notes?: string;
}
export interface ForecastParameters {
    slope?: number;
    intercept?: number;
    rSquared?: number;
    windowSize?: number;
    weights?: number[];
    alpha?: number;
    beta?: number;
    gamma?: number;
    seasonalPeriod?: number;
    trendComponent?: number[];
    seasonalComponent?: number[];
    modelType?: string;
    features?: string[];
    accuracy?: number;
    expertWeights?: number[];
    scenarios?: any[];
}
export interface TimeSeriesData {
    date: Date;
    value: number;
    metadata?: any;
}
export interface SeasonalityAnalysis {
    seasonalStrength: number;
    peakMonths: number[];
    lowMonths: number[];
    seasonalIndices: {
        month: number;
        index: number;
    }[];
    yearOverYearGrowth: number[];
}
export interface TrendAnalysis {
    trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
    trendStrength: number;
    changePoints: Date[];
    volatility: number;
    cyclicalPatterns: any[];
}
export interface ForecastValidation {
    mape: number;
    mae: number;
    rmse: number;
    correlation: number;
    accuracyScore: number;
}
export declare class RevenueForecastService {
    generateForecast(tenantId: string, userId: string, request: CreateForecastRequest): Promise<RevenueForecastData>;
    private generateForecastByMethod;
    private linearRegressionForecast;
    private movingAverageForecast;
    private exponentialSmoothingForecast;
    private seasonalDecompositionForecast;
    private machineLearningForecast;
    private expertJudgmentForecast;
    private getHistoricalData;
    private getRevenueData;
    private getExpenseData;
    private getProfitData;
    private getCashFlowData;
    private getOccupancyData;
    private getMembershipData;
    private calculateBaseRevenue;
    private analyzeTrends;
    private analyzeSeasonality;
    private generateAssumptions;
    private identifyRisks;
    private getDefaultWindowSize;
    private decomposeTimeSeries;
    private calculateMovingAverage;
    private calculateSeasonalComponent;
    private forecastTrend;
    private calculateVariance;
    private calculateVolatility;
    private extractFeatures;
    private calculateGrowthRate;
    private calculateMedian;
    private calculateSeasonalityStrength;
    private calculateHistoricalAccuracy;
    getForecasts(tenantId: string, filters?: {
        forecastType?: ForecastType;
        period?: ForecastPeriod;
        methodology?: ForecastMethod;
        status?: ForecastStatus;
    }, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        forecasts: RevenueForecastData[];
        total: number;
        hasMore: boolean;
    }>;
    updateForecastAccuracy(tenantId: string, forecastId: string, actualValue: number): Promise<void>;
    private mapForecastToData;
}
export declare const revenueForecastService: RevenueForecastService;
//# sourceMappingURL=revenueForecastService.d.ts.map
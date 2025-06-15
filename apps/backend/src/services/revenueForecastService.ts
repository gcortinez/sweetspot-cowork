import { prisma } from '../lib/prisma';
import {
  ForecastType,
  ForecastPeriod,
  ForecastMethod,
  ForecastStatus,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

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
  // Linear Regression
  slope?: number;
  intercept?: number;
  rSquared?: number;
  
  // Moving Average
  windowSize?: number;
  weights?: number[];
  
  // Exponential Smoothing
  alpha?: number;
  beta?: number;
  gamma?: number;
  
  // Seasonal Decomposition
  seasonalPeriod?: number;
  trendComponent?: number[];
  seasonalComponent?: number[];
  
  // Machine Learning
  modelType?: string;
  features?: string[];
  accuracy?: number;
  
  // Expert Judgment
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
  seasonalIndices: { month: number; index: number }[];
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
  mape: number; // Mean Absolute Percentage Error
  mae: number;  // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  correlation: number;
  accuracyScore: number;
}

// ============================================================================
// REVENUE FORECAST SERVICE
// ============================================================================

export class RevenueForecastService {

  // ============================================================================
  // FORECAST GENERATION
  // ============================================================================

  async generateForecast(
    tenantId: string,
    userId: string,
    request: CreateForecastRequest
  ): Promise<RevenueForecastData> {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalData(tenantId, request.forecastType, request.startDate);
      
      // Generate forecast based on methodology
      const forecastResult = await this.generateForecastByMethod(
        historicalData,
        request.methodology,
        request.period,
        request.endDate,
        request.customParameters
      );

      // Calculate base revenue (average of last 3 months)
      const baseRevenue = this.calculateBaseRevenue(historicalData);

      // Analyze trends and seasonality
      const trends = await this.analyzeTrends(historicalData);
      const seasonality = await this.analyzeSeasonality(historicalData);

      // Generate assumptions and risks
      const assumptions = this.generateAssumptions(request.methodology, trends, seasonality);
      const risks = this.identifyRisks(forecastResult, trends);

      // Create forecast record
      const forecast = await prisma.revenueForcast.create({
        data: {
          tenantId,
          forecastType: request.forecastType,
          period: request.period,
          startDate: request.startDate,
          endDate: request.endDate,
          baseRevenue,
          projectedRevenue: forecastResult.projectedValue,
          confidence: forecastResult.confidence,
          methodology: request.methodology,
          parameters: forecastResult.parameters,
          assumptions,
          risks,
          trends,
          seasonality,
          notes: request.notes,
          createdBy: userId,
        },
      });

      logger.info('Revenue forecast generated successfully', {
        tenantId,
        forecastId: forecast.id,
        methodology: request.methodology,
        projectedRevenue: forecastResult.projectedValue,
      });

      return this.mapForecastToData(forecast);
    } catch (error) {
      logger.error('Failed to generate revenue forecast', {
        tenantId,
        request,
        userId,
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // FORECASTING METHODS
  // ============================================================================

  private async generateForecastByMethod(
    historicalData: TimeSeriesData[],
    method: ForecastMethod,
    period: ForecastPeriod,
    endDate: Date,
    customParameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    switch (method) {
      case ForecastMethod.LINEAR_REGRESSION:
        return this.linearRegressionForecast(historicalData, endDate, customParameters);
      case ForecastMethod.MOVING_AVERAGE:
        return this.movingAverageForecast(historicalData, period, customParameters);
      case ForecastMethod.EXPONENTIAL_SMOOTHING:
        return this.exponentialSmoothingForecast(historicalData, period, customParameters);
      case ForecastMethod.SEASONAL_DECOMPOSITION:
        return this.seasonalDecompositionForecast(historicalData, period, customParameters);
      case ForecastMethod.MACHINE_LEARNING:
        return this.machineLearningForecast(historicalData, period, customParameters);
      case ForecastMethod.EXPERT_JUDGMENT:
        return this.expertJudgmentForecast(historicalData, period, customParameters);
      default:
        throw new Error(`Unsupported forecast method: ${method}`);
    }
  }

  // ============================================================================
  // LINEAR REGRESSION FORECASTING
  // ============================================================================

  private linearRegressionForecast(
    data: TimeSeriesData[],
    endDate: Date,
    parameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    // Prepare data for regression
    const x = data.map((_, index) => index);
    const y = data.map(point => point.value);

    // Calculate linear regression coefficients
    const n = data.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, index) => sum + val * y[index], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = y.reduce((sum, val, index) => {
      const predicted = slope * x[index] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Calculate forecast period length
    const startDate = data[0].date;
    const forecastPeriods = Math.ceil((endDate.getTime() - data[data.length - 1].date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    // Project future values
    const projectionPoints: TimeSeriesData[] = [];
    for (let i = 1; i <= forecastPeriods; i++) {
      const futureIndex = data.length + i - 1;
      const projectedValue = slope * futureIndex + intercept;
      const projectionDate = new Date(data[data.length - 1].date);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      projectionPoints.push({
        date: projectionDate,
        value: Math.max(0, projectedValue), // Ensure non-negative
      });
    }

    const finalProjectedValue = projectionPoints[projectionPoints.length - 1]?.value || 0;
    
    // Calculate confidence based on R-squared and data quality
    const confidence = Math.min(95, Math.max(30, rSquared * 100));

    return Promise.resolve({
      projectedValue: finalProjectedValue,
      confidence,
      parameters: {
        slope,
        intercept,
        rSquared,
      },
      projectionPoints,
    });
  }

  // ============================================================================
  // MOVING AVERAGE FORECASTING
  // ============================================================================

  private movingAverageForecast(
    data: TimeSeriesData[],
    period: ForecastPeriod,
    parameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    const windowSize = parameters?.windowSize || this.getDefaultWindowSize(period);
    const weights = parameters?.weights || Array(windowSize).fill(1 / windowSize);

    // Calculate weighted moving average
    const recentData = data.slice(-windowSize);
    const projectedValue = recentData.reduce((sum, point, index) => {
      return sum + point.value * weights[index];
    }, 0);

    // Calculate confidence based on variance of recent data
    const recentValues = recentData.map(point => point.value);
    const mean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    const confidence = Math.max(40, 90 - (coefficientOfVariation * 100));

    // Generate projection points
    const projectionPoints: TimeSeriesData[] = [];
    const lastDate = data[data.length - 1].date;
    
    // For moving average, we typically project the same value forward
    for (let i = 1; i <= 12; i++) { // Project 12 months forward
      const projectionDate = new Date(lastDate);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      projectionPoints.push({
        date: projectionDate,
        value: projectedValue,
      });
    }

    return Promise.resolve({
      projectedValue,
      confidence,
      parameters: {
        windowSize,
        weights,
      },
      projectionPoints,
    });
  }

  // ============================================================================
  // EXPONENTIAL SMOOTHING FORECASTING
  // ============================================================================

  private exponentialSmoothingForecast(
    data: TimeSeriesData[],
    period: ForecastPeriod,
    parameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    const alpha = parameters?.alpha || 0.3; // Smoothing parameter for level
    const beta = parameters?.beta || 0.1;   // Smoothing parameter for trend
    const gamma = parameters?.gamma || 0.2; // Smoothing parameter for seasonality

    // Initialize
    let level = data[0].value;
    let trend = 0;
    const seasonalPeriod = 12; // Monthly seasonality
    const seasonal: number[] = new Array(seasonalPeriod).fill(1);

    // Apply Holt-Winters exponential smoothing
    const smoothedValues: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const actual = data[i].value;
      const seasonIndex = i % seasonalPeriod;
      
      // Update components
      const previousLevel = level;
      level = alpha * (actual / seasonal[seasonIndex]) + (1 - alpha) * (level + trend);
      trend = beta * (level - previousLevel) + (1 - beta) * trend;
      seasonal[seasonIndex] = gamma * (actual / level) + (1 - gamma) * seasonal[seasonIndex];
      
      smoothedValues.push(level * seasonal[seasonIndex]);
    }

    // Forecast future values
    const projectionPoints: TimeSeriesData[] = [];
    const forecastHorizon = 12; // 12 months ahead
    
    for (let h = 1; h <= forecastHorizon; h++) {
      const seasonIndex = (data.length + h - 1) % seasonalPeriod;
      const forecastValue = (level + h * trend) * seasonal[seasonIndex];
      
      const projectionDate = new Date(data[data.length - 1].date);
      projectionDate.setMonth(projectionDate.getMonth() + h);
      
      projectionPoints.push({
        date: projectionDate,
        value: Math.max(0, forecastValue),
      });
    }

    const projectedValue = projectionPoints[projectionPoints.length - 1]?.value || 0;

    // Calculate confidence based on fit quality
    const mse = data.reduce((sum, point, index) => {
      if (index < smoothedValues.length) {
        return sum + Math.pow(point.value - smoothedValues[index], 2);
      }
      return sum;
    }, 0) / data.length;
    
    const meanValue = data.reduce((sum, point) => sum + point.value, 0) / data.length;
    const mape = Math.sqrt(mse) / meanValue * 100;
    const confidence = Math.max(50, 95 - mape);

    return Promise.resolve({
      projectedValue,
      confidence,
      parameters: {
        alpha,
        beta,
        gamma,
      },
      projectionPoints,
    });
  }

  // ============================================================================
  // SEASONAL DECOMPOSITION FORECASTING
  // ============================================================================

  private seasonalDecompositionForecast(
    data: TimeSeriesData[],
    period: ForecastPeriod,
    parameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    const seasonalPeriod = parameters?.seasonalPeriod || 12;
    
    // Decompose time series into trend, seasonal, and residual components
    const decomposition = this.decomposeTimeSeries(data, seasonalPeriod);
    
    // Forecast trend component using linear regression
    const trendForecast = this.forecastTrend(decomposition.trend, 12);
    
    // Apply seasonal pattern
    const projectionPoints: TimeSeriesData[] = [];
    
    for (let h = 1; h <= 12; h++) {
      const seasonIndex = (data.length + h - 1) % seasonalPeriod;
      const trendValue = trendForecast[h - 1] || trendForecast[trendForecast.length - 1];
      const seasonalMultiplier = decomposition.seasonal[seasonIndex];
      const forecastValue = trendValue * seasonalMultiplier;
      
      const projectionDate = new Date(data[data.length - 1].date);
      projectionDate.setMonth(projectionDate.getMonth() + h);
      
      projectionPoints.push({
        date: projectionDate,
        value: Math.max(0, forecastValue),
      });
    }

    const projectedValue = projectionPoints[projectionPoints.length - 1]?.value || 0;
    
    // Calculate confidence based on decomposition quality
    const residualVariance = this.calculateVariance(decomposition.residual);
    const dataVariance = this.calculateVariance(data.map(d => d.value));
    const explainedVariance = 1 - (residualVariance / dataVariance);
    const confidence = Math.max(45, explainedVariance * 100);

    return Promise.resolve({
      projectedValue,
      confidence,
      parameters: {
        seasonalPeriod,
        trendComponent: decomposition.trend,
        seasonalComponent: decomposition.seasonal,
      },
      projectionPoints,
    });
  }

  // ============================================================================
  // MACHINE LEARNING FORECASTING
  // ============================================================================

  private machineLearningForecast(
    data: TimeSeriesData[],
    period: ForecastPeriod,
    parameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    // Simplified ML approach - in production would use actual ML libraries
    const features = this.extractFeatures(data);
    
    // Use ensemble of simple models
    const linearForecast = this.linearRegressionForecast(data, new Date(), parameters);
    const maForecast = this.movingAverageForecast(data, period, parameters);
    const esForecast = this.exponentialSmoothingForecast(data, period, parameters);
    
    return Promise.all([linearForecast, maForecast, esForecast]).then(([linear, ma, es]) => {
      // Weighted ensemble
      const weights = [0.4, 0.3, 0.3]; // Favor linear regression
      const projectedValue = (linear.projectedValue * weights[0] + 
                             ma.projectedValue * weights[1] + 
                             es.projectedValue * weights[2]);
      
      const confidence = (linear.confidence * weights[0] + 
                         ma.confidence * weights[1] + 
                         es.confidence * weights[2]);

      // Generate ensemble projection points
      const projectionPoints: TimeSeriesData[] = [];
      const maxLength = Math.max(linear.projectionPoints.length, ma.projectionPoints.length, es.projectionPoints.length);
      
      for (let i = 0; i < maxLength; i++) {
        const linearVal = linear.projectionPoints[i]?.value || linear.projectedValue;
        const maVal = ma.projectionPoints[i]?.value || ma.projectedValue;
        const esVal = es.projectionPoints[i]?.value || es.projectedValue;
        
        const ensembleValue = linearVal * weights[0] + maVal * weights[1] + esVal * weights[2];
        const date = linear.projectionPoints[i]?.date || 
                    ma.projectionPoints[i]?.date || 
                    es.projectionPoints[i]?.date;
        
        if (date) {
          projectionPoints.push({
            date,
            value: ensembleValue,
          });
        }
      }

      return {
        projectedValue,
        confidence,
        parameters: {
          modelType: 'ensemble',
          features: features.map(f => f.name),
          accuracy: confidence,
        },
        projectionPoints,
      };
    });
  }

  // ============================================================================
  // EXPERT JUDGMENT FORECASTING
  // ============================================================================

  private expertJudgmentForecast(
    data: TimeSeriesData[],
    period: ForecastPeriod,
    parameters?: Record<string, any>
  ): Promise<{
    projectedValue: number;
    confidence: number;
    parameters: ForecastParameters;
    projectionPoints: TimeSeriesData[];
  }> {
    // Base forecast on recent trend
    const recentData = data.slice(-6); // Last 6 months
    const recentGrowth = this.calculateGrowthRate(recentData);
    const baseValue = data[data.length - 1].value;
    
    // Apply expert scenarios
    const scenarios = parameters?.scenarios || [
      { name: 'conservative', multiplier: 1 + (recentGrowth * 0.5), weight: 0.3 },
      { name: 'realistic', multiplier: 1 + recentGrowth, weight: 0.5 },
      { name: 'optimistic', multiplier: 1 + (recentGrowth * 1.5), weight: 0.2 },
    ];

    // Calculate weighted forecast
    const projectedValue = scenarios.reduce((sum, scenario) => {
      return sum + (baseValue * scenario.multiplier * scenario.weight);
    }, 0);

    // Generate projection points with scenario ranges
    const projectionPoints: TimeSeriesData[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const monthlyGrowth = Math.pow(projectedValue / baseValue, 1/12) - 1;
      const forecastValue = baseValue * Math.pow(1 + monthlyGrowth, i);
      
      const projectionDate = new Date(data[data.length - 1].date);
      projectionDate.setMonth(projectionDate.getMonth() + i);
      
      projectionPoints.push({
        date: projectionDate,
        value: forecastValue,
      });
    }

    // Confidence based on historical accuracy and data quality
    const historicalAccuracy = this.calculateHistoricalAccuracy(data);
    const confidence = Math.min(85, Math.max(60, historicalAccuracy * 100));

    return Promise.resolve({
      projectedValue,
      confidence,
      parameters: {
        expertWeights: scenarios.map(s => s.weight),
        scenarios,
      },
      projectionPoints,
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getHistoricalData(
    tenantId: string,
    forecastType: ForecastType,
    startDate: Date
  ): Promise<TimeSeriesData[]> {
    // Get data for the last 24 months before startDate
    const dataStartDate = new Date(startDate);
    dataStartDate.setMonth(dataStartDate.getMonth() - 24);

    switch (forecastType) {
      case ForecastType.REVENUE:
        return this.getRevenueData(tenantId, dataStartDate, startDate);
      case ForecastType.EXPENSE:
        return this.getExpenseData(tenantId, dataStartDate, startDate);
      case ForecastType.PROFIT:
        return this.getProfitData(tenantId, dataStartDate, startDate);
      case ForecastType.CASH_FLOW:
        return this.getCashFlowData(tenantId, dataStartDate, startDate);
      case ForecastType.OCCUPANCY:
        return this.getOccupancyData(tenantId, dataStartDate, startDate);
      case ForecastType.MEMBERSHIP:
        return this.getMembershipData(tenantId, dataStartDate, startDate);
      default:
        throw new Error(`Unsupported forecast type: ${forecastType}`);
    }
  }

  private async getRevenueData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(total), 0) as total
      FROM invoices 
      WHERE tenant_id = ${tenantId}
        AND status = 'PAID'
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `;

    return monthlyRevenue.map(row => ({
      date: new Date(row.month),
      value: Number(row.total),
    }));
  }

  private async getExpenseData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    // Simplified - in production would have expense tracking
    const revenueData = await this.getRevenueData(tenantId, startDate, endDate);
    return revenueData.map(point => ({
      date: point.date,
      value: point.value * 0.75, // Assume 75% expense ratio
    }));
  }

  private async getProfitData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    const revenueData = await this.getRevenueData(tenantId, startDate, endDate);
    return revenueData.map(point => ({
      date: point.date,
      value: point.value * 0.25, // Assume 25% profit margin
    }));
  }

  private async getCashFlowData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    const monthlyPayments = await prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT 
        DATE_TRUNC('month', processed_at) as month,
        COALESCE(SUM(amount), 0) as total
      FROM payments 
      WHERE tenant_id = ${tenantId}
        AND status = 'COMPLETED'
        AND processed_at >= ${startDate}
        AND processed_at <= ${endDate}
      GROUP BY DATE_TRUNC('month', processed_at)
      ORDER BY month
    `;

    return monthlyPayments.map(row => ({
      date: new Date(row.month),
      value: Number(row.total),
    }));
  }

  private async getOccupancyData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    // Simplified occupancy calculation based on bookings
    const monthlyBookings = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT 
        DATE_TRUNC('month', start_time) as month,
        COUNT(*) as count
      FROM bookings 
      WHERE tenant_id = ${tenantId}
        AND status = 'CONFIRMED'
        AND start_time >= ${startDate}
        AND start_time <= ${endDate}
      GROUP BY DATE_TRUNC('month', start_time)
      ORDER BY month
    `;

    return monthlyBookings.map(row => ({
      date: new Date(row.month),
      value: Number(row.count),
    }));
  }

  private async getMembershipData(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    const monthlyMemberships = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
      FROM memberships 
      WHERE tenant_id = ${tenantId}
        AND status = 'ACTIVE'
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `;

    return monthlyMemberships.map(row => ({
      date: new Date(row.month),
      value: Number(row.count),
    }));
  }

  private calculateBaseRevenue(data: TimeSeriesData[]): number {
    const recentData = data.slice(-3); // Last 3 months
    return recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length;
  }

  private async analyzeTrends(data: TimeSeriesData[]): Promise<TrendAnalysis> {
    const values = data.map(d => d.value);
    const growthRates = [];
    
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        growthRates.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const trendDirection = avgGrowthRate > 0.02 ? 'INCREASING' : 
                          avgGrowthRate < -0.02 ? 'DECREASING' : 'STABLE';
    
    const volatility = this.calculateVolatility(values);
    const trendStrength = Math.abs(avgGrowthRate) * 100;

    return {
      trendDirection,
      trendStrength,
      changePoints: [], // Simplified
      volatility,
      cyclicalPatterns: [],
    };
  }

  private async analyzeSeasonality(data: TimeSeriesData[]): Promise<SeasonalityAnalysis> {
    if (data.length < 12) {
      return {
        seasonalStrength: 0,
        peakMonths: [],
        lowMonths: [],
        seasonalIndices: [],
        yearOverYearGrowth: [],
      };
    }

    // Calculate monthly averages
    const monthlyData = new Array(12).fill(0).map(() => ({ sum: 0, count: 0 }));
    
    data.forEach(point => {
      const month = point.date.getMonth();
      monthlyData[month].sum += point.value;
      monthlyData[month].count += 1;
    });

    const monthlyAverages = monthlyData.map(month => 
      month.count > 0 ? month.sum / month.count : 0
    );

    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    
    const seasonalIndices = monthlyAverages.map((avg, month) => ({
      month: month + 1,
      index: overallAverage > 0 ? avg / overallAverage : 1,
    }));

    // Find peak and low months
    const peakMonths = seasonalIndices
      .filter(si => si.index > 1.1)
      .map(si => si.month);
    
    const lowMonths = seasonalIndices
      .filter(si => si.index < 0.9)
      .map(si => si.month);

    // Calculate seasonal strength
    const variance = monthlyAverages.reduce((sum, avg) => 
      sum + Math.pow(avg - overallAverage, 2), 0) / 12;
    const seasonalStrength = overallAverage > 0 ? Math.sqrt(variance) / overallAverage : 0;

    return {
      seasonalStrength: seasonalStrength * 100,
      peakMonths,
      lowMonths,
      seasonalIndices,
      yearOverYearGrowth: [], // Simplified
    };
  }

  private generateAssumptions(
    method: ForecastMethod,
    trends: TrendAnalysis,
    seasonality: SeasonalityAnalysis
  ): string[] {
    const assumptions = [
      'Historical patterns will continue',
      'No major external disruptions',
      'Current market conditions remain stable',
    ];

    if (method === ForecastMethod.LINEAR_REGRESSION) {
      assumptions.push('Linear relationship holds');
    }

    if (seasonality.seasonalStrength > 20) {
      assumptions.push('Seasonal patterns remain consistent');
    }

    if (trends.trendDirection !== 'STABLE') {
      assumptions.push(`${trends.trendDirection.toLowerCase()} trend continues`);
    }

    return assumptions;
  }

  private identifyRisks(
    forecastResult: any,
    trends: TrendAnalysis
  ): string[] {
    const risks = [];

    if (forecastResult.confidence < 70) {
      risks.push('Low forecast confidence due to data volatility');
    }

    if (trends.volatility > 0.3) {
      risks.push('High historical volatility may impact accuracy');
    }

    if (trends.trendDirection === 'DECREASING') {
      risks.push('Declining trend may continue or worsen');
    }

    risks.push('Economic conditions may change');
    risks.push('Competition may impact performance');
    risks.push('Seasonal variations may be more pronounced');

    return risks;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getDefaultWindowSize(period: ForecastPeriod): number {
    switch (period) {
      case ForecastPeriod.MONTHLY: return 3;
      case ForecastPeriod.QUARTERLY: return 4;
      case ForecastPeriod.ANNUALLY: return 2;
      case ForecastPeriod.ROLLING_12_MONTHS: return 12;
      default: return 6;
    }
  }

  private decomposeTimeSeries(data: TimeSeriesData[], seasonalPeriod: number) {
    const values = data.map(d => d.value);
    const trend = this.calculateMovingAverage(values, seasonalPeriod);
    const seasonal = this.calculateSeasonalComponent(values, trend, seasonalPeriod);
    const residual = values.map((val, i) => val - trend[i] - seasonal[i % seasonalPeriod]);

    return { trend, seasonal, residual };
  }

  private calculateMovingAverage(data: number[], window: number): number[] {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.ceil(window / 2));
      const sum = data.slice(start, end).reduce((sum, val) => sum + val, 0);
      result.push(sum / (end - start));
    }
    return result;
  }

  private calculateSeasonalComponent(values: number[], trend: number[], period: number): number[] {
    const seasonal = new Array(period).fill(0);
    const counts = new Array(period).fill(0);

    for (let i = 0; i < values.length; i++) {
      const seasonIndex = i % period;
      if (trend[i] > 0) {
        seasonal[seasonIndex] += values[i] - trend[i];
        counts[seasonIndex]++;
      }
    }

    // Average seasonal components
    for (let i = 0; i < period; i++) {
      if (counts[i] > 0) {
        seasonal[i] /= counts[i];
      }
    }

    return seasonal;
  }

  private forecastTrend(trend: number[], horizon: number): number[] {
    // Use linear regression on trend component
    const x = trend.map((_, i) => i);
    const y = trend;
    
    const n = trend.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, index) => sum + val * y[index], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
      forecast.push(slope * (n + i) + intercept);
    }

    return forecast;
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  }

  private calculateVolatility(data: number[]): number {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] > 0) {
        returns.push(Math.log(data[i] / data[i - 1]));
      }
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private extractFeatures(data: TimeSeriesData[]): Array<{ name: string; value: number }> {
    const values = data.map(d => d.value);
    
    return [
      { name: 'trend', value: this.calculateGrowthRate(data) },
      { name: 'volatility', value: this.calculateVolatility(values) },
      { name: 'mean', value: values.reduce((sum, val) => sum + val, 0) / values.length },
      { name: 'median', value: this.calculateMedian(values) },
      { name: 'seasonality', value: this.calculateSeasonalityStrength(data) },
    ];
  }

  private calculateGrowthRate(data: TimeSeriesData[]): number {
    if (data.length < 2) return 0;
    const first = data[0].value;
    const last = data[data.length - 1].value;
    return first > 0 ? (last - first) / first : 0;
  }

  private calculateMedian(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  private calculateSeasonalityStrength(data: TimeSeriesData[]): number {
    if (data.length < 12) return 0;
    
    const monthlyValues = new Array(12).fill(0).map(() => []);
    data.forEach(point => {
      const month = point.date.getMonth();
      monthlyValues[month].push(point.value);
    });

    const monthlyAverages = monthlyValues.map(values => 
      values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
    );

    const overallMean = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    const variance = monthlyAverages.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / 12;
    
    return overallMean > 0 ? Math.sqrt(variance) / overallMean : 0;
  }

  private calculateHistoricalAccuracy(data: TimeSeriesData[]): number {
    // Simplified accuracy calculation
    const volatility = this.calculateVolatility(data.map(d => d.value));
    return Math.max(0.5, 1 - volatility);
  }

  // ============================================================================
  // FORECAST MANAGEMENT
  // ============================================================================

  async getForecasts(
    tenantId: string,
    filters: {
      forecastType?: ForecastType;
      period?: ForecastPeriod;
      methodology?: ForecastMethod;
      status?: ForecastStatus;
    } = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    forecasts: RevenueForecastData[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause: any = { tenantId };
      
      if (filters.forecastType) whereClause.forecastType = filters.forecastType;
      if (filters.period) whereClause.period = filters.period;
      if (filters.methodology) whereClause.methodology = filters.methodology;
      if (filters.status) whereClause.status = filters.status;

      const [forecasts, total] = await Promise.all([
        prisma.revenueForcast.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.revenueForcast.count({ where: whereClause }),
      ]);

      const forecastData = forecasts.map(forecast => this.mapForecastToData(forecast));
      const hasMore = (pagination.skip || 0) + forecastData.length < total;

      return {
        forecasts: forecastData,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get revenue forecasts', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async updateForecastAccuracy(
    tenantId: string,
    forecastId: string,
    actualValue: number
  ): Promise<void> {
    try {
      const forecast = await prisma.revenueForcast.findFirst({
        where: { id: forecastId, tenantId },
      });

      if (!forecast) {
        throw new Error('Forecast not found');
      }

      const projectedValue = Number(forecast.projectedRevenue);
      const accuracy = projectedValue > 0 ? 
        (1 - Math.abs(actualValue - projectedValue) / projectedValue) * 100 : 0;

      await prisma.revenueForcast.update({
        where: { id: forecastId },
        data: { accuracy },
      });

      logger.info('Forecast accuracy updated', { tenantId, forecastId, accuracy });
    } catch (error) {
      logger.error('Failed to update forecast accuracy', { tenantId, forecastId }, error as Error);
      throw error;
    }
  }

  private mapForecastToData(forecast: any): RevenueForecastData {
    return {
      id: forecast.id,
      forecastType: forecast.forecastType,
      period: forecast.period,
      startDate: forecast.startDate,
      endDate: forecast.endDate,
      baseRevenue: Number(forecast.baseRevenue),
      projectedRevenue: Number(forecast.projectedRevenue),
      confidence: Number(forecast.confidence),
      methodology: forecast.methodology,
      parameters: forecast.parameters,
      assumptions: forecast.assumptions,
      risks: forecast.risks,
      trends: forecast.trends,
      seasonality: forecast.seasonality,
      accuracy: forecast.accuracy ? Number(forecast.accuracy) : undefined,
      status: forecast.status,
      notes: forecast.notes,
      createdBy: forecast.createdBy,
      createdAt: forecast.createdAt,
      updatedAt: forecast.updatedAt,
    };
  }
}

export const revenueForecastService = new RevenueForecastService();
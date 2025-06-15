import { prisma } from '../lib/prisma';
import {
  AnalysisType,
  ReportPeriod,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

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
    fixedVsVariable: number; // % fixed
    scalability: number;     // How costs scale with revenue
    efficiency: number;      // Cost per unit of output
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

// ============================================================================
// PROFIT ANALYSIS SERVICE
// ============================================================================

export class ProfitAnalysisService {

  // ============================================================================
  // MAIN ANALYSIS GENERATION
  // ============================================================================

  async generateProfitAnalysis(
    tenantId: string,
    userId: string,
    request: CreateProfitAnalysisRequest
  ): Promise<ProfitAnalysisData> {
    try {
      // Get financial data for the period
      const financialData = await this.getFinancialData(tenantId, request.startDate, request.endDate);
      
      // Generate analysis based on type
      let analysisResult;
      switch (request.analysisType) {
        case AnalysisType.PROFITABILITY:
          analysisResult = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
          break;
        case AnalysisType.MARGIN_ANALYSIS:
          analysisResult = await this.generateMarginAnalysis(tenantId, financialData, request);
          break;
        case AnalysisType.COST_ANALYSIS:
          analysisResult = await this.generateCostAnalysis(tenantId, financialData, request);
          break;
        case AnalysisType.BREAK_EVEN:
          analysisResult = await this.generateBreakEvenAnalysis(tenantId, financialData, request);
          break;
        case AnalysisType.ROI_ANALYSIS:
          analysisResult = await this.generateROIAnalysis(tenantId, financialData, request);
          break;
        case AnalysisType.VARIANCE_ANALYSIS:
          analysisResult = await this.generateVarianceAnalysis(tenantId, financialData, request);
          break;
        default:
          throw new Error(`Unsupported analysis type: ${request.analysisType}`);
      }

      // Generate insights and recommendations
      const insights = this.generateInsights(analysisResult, request.analysisType);
      const recommendations = this.generateRecommendations(analysisResult, request.analysisType);

      // Save analysis to database
      const analysis = await prisma.profitAnalysis.create({
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

      logger.info('Profit analysis generated successfully', {
        tenantId,
        analysisId: analysis.id,
        analysisType: request.analysisType,
        totalRevenue: analysisResult.totalRevenue,
        netMargin: analysisResult.netMargin,
      });

      return this.mapAnalysisToData(analysis);
    } catch (error) {
      logger.error('Failed to generate profit analysis', {
        tenantId,
        request,
        userId,
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // PROFITABILITY ANALYSIS
  // ============================================================================

  private async generateProfitabilityAnalysis(
    tenantId: string,
    financialData: any,
    request: CreateProfitAnalysisRequest
  ): Promise<any> {
    const { totalRevenue, totalCosts, costBreakdown } = financialData;
    
    // Calculate core profitability metrics
    const grossProfit = totalRevenue - costBreakdown.cogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    const operatingExpenses = costBreakdown.operating;
    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
    
    const netProfit = operatingProfit - costBreakdown.taxes - costBreakdown.interest;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const ebitda = operatingProfit + costBreakdown.depreciation + costBreakdown.interest;

    // Calculate advanced profitability metrics
    const profitabilityMetrics = this.calculateProfitabilityMetrics({
      totalRevenue,
      grossProfit,
      operatingProfit,
      netProfit,
      ebitda,
      fixedCosts: costBreakdown.fixed,
      variableCosts: costBreakdown.variable,
    });

    // Analyze profit trends
    const profitTrends = await this.analyzeProfitTrends(tenantId, request.startDate, request.endDate);
    
    // Get benchmark comparisons
    const benchmarks = this.getBenchmarkComparisons(profitabilityMetrics);

    // Calculate KPIs
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

  // ============================================================================
  // MARGIN ANALYSIS
  // ============================================================================

  private async generateMarginAnalysis(
    tenantId: string,
    financialData: any,
    request: CreateProfitAnalysisRequest
  ): Promise<any> {
    const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
    
    // Deep dive into margin analysis
    const marginTrends = await this.getMarginTrends(tenantId, request.startDate, request.endDate);
    const marginDrivers = this.identifyMarginDrivers(financialData, marginTrends);
    const marginComparison = this.getMarginBenchmarks(baseAnalysis.grossMargin, baseAnalysis.operatingMargin, baseAnalysis.netMargin);
    const marginForecasting = await this.forecastMargins(tenantId, marginTrends);

    const marginAnalysis: MarginAnalysis = {
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

  // ============================================================================
  // COST ANALYSIS
  // ============================================================================

  private async generateCostAnalysis(
    tenantId: string,
    financialData: any,
    request: CreateProfitAnalysisRequest
  ): Promise<any> {
    const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
    
    // Detailed cost analysis
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

  // ============================================================================
  // BREAK-EVEN ANALYSIS
  // ============================================================================

  private async generateBreakEvenAnalysis(
    tenantId: string,
    financialData: any,
    request: CreateProfitAnalysisRequest
  ): Promise<any> {
    const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
    
    // Calculate break-even metrics
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

    // Operating leverage
    const operatingLeverage = contributionMarginRatio > 0 ? 
      (contributionMarginRatio * currentRevenue) / baseAnalysis.operatingProfit : 0;

    // Scenario analysis
    const scenarioAnalysis = this.performBreakEvenScenarioAnalysis({
      fixedCosts,
      variableCostRatio: costAnalysis.variableCosts.total / currentRevenue,
      currentRevenue,
      contributionMarginRatio,
    });

    const breakEvenAnalysis: BreakEvenAnalysis = {
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
        targetRevenueForProfit: this.calculateTargetRevenue(fixedCosts, contributionMarginRatio, 0.15), // 15% profit target
        salesRequiredForBreakEven: breakEvenUnits,
      },
    };
  }

  // ============================================================================
  // ROI ANALYSIS
  // ============================================================================

  private async generateROIAnalysis(
    tenantId: string,
    financialData: any,
    request: CreateProfitAnalysisRequest
  ): Promise<any> {
    const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
    
    // Calculate ROI metrics
    const roiAnalysis: ROIAnalysis = {
      returnOnAssets: this.calculateROA(baseAnalysis.netProfit, financialData.totalAssets),
      returnOnEquity: this.calculateROE(baseAnalysis.netProfit, financialData.totalEquity),
      returnOnInvestment: this.calculateROI(baseAnalysis.netProfit, financialData.totalInvestment),
      paybackPeriod: this.calculatePaybackPeriod(financialData.initialInvestment, baseAnalysis.netProfit),
      internalRateOfReturn: this.calculateIRR(financialData.cashFlows),
      netPresentValue: this.calculateNPV(financialData.cashFlows, 0.1), // 10% discount rate
      profitabilityIndex: this.calculatePI(financialData.cashFlows, financialData.initialInvestment, 0.1),
    };

    // Investment efficiency metrics
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

  // ============================================================================
  // VARIANCE ANALYSIS
  // ============================================================================

  private async generateVarianceAnalysis(
    tenantId: string,
    financialData: any,
    request: CreateProfitAnalysisRequest
  ): Promise<any> {
    const baseAnalysis = await this.generateProfitabilityAnalysis(tenantId, financialData, request);
    
    // Get budget/planned figures
    const budgetData = await this.getBudgetData(tenantId, request.startDate, request.endDate);
    
    // Calculate variances
    const varianceAnalysis: VarianceAnalysis = {
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

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getFinancialData(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    // Get revenue data
    const invoices = await prisma.invoice.findMany({
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

    // Calculate revenue breakdown
    const revenueBreakdown = this.categorizeRevenue(invoices);

    // Estimate costs (in production, this would come from expense tracking)
    const totalCosts = totalRevenue * 0.75; // 75% cost ratio
    const costBreakdown = {
      cogs: totalCosts * 0.3,
      operating: totalCosts * 0.4,
      fixed: totalCosts * 0.6,
      variable: totalCosts * 0.4,
      depreciation: totalCosts * 0.05,
      interest: totalCosts * 0.02,
      taxes: totalCosts * 0.03,
    };

    // Get customer and employee counts (simplified)
    const customerCount = new Set(invoices.map(inv => inv.clientId)).size;
    const employeeCount = 10; // Simplified

    // Simplified asset data
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

  private calculateProfitabilityMetrics(data: any): ProfitabilityMetrics {
    const {
      totalRevenue,
      grossProfit,
      operatingProfit,
      netProfit,
      ebitda,
      fixedCosts,
      variableCosts,
    } = data;

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

  private async analyzeProfitTrends(tenantId: string, startDate: Date, endDate: Date): Promise<ProfitTrends> {
    // Get monthly profit data
    const monthlyData = await this.getMonthlyProfitData(tenantId, startDate, endDate);
    
    // Analyze trends
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

  private analyzeMargins(metrics: ProfitabilityMetrics, trends: ProfitTrends): any {
    return {
      currentMargins: {
        gross: metrics.grossProfitMargin,
        operating: metrics.operatingProfitMargin,
        net: metrics.netProfitMargin,
        ebitda: metrics.ebitdaMargin,
      },
      marginHealth: {
        grossMarginHealth: this.assessMarginHealth(metrics.grossProfitMargin, 60), // 60% benchmark
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

  private getBenchmarkComparisons(metrics: ProfitabilityMetrics): BenchmarkComparison {
    // Industry benchmarks for coworking spaces
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

  private generateInsights(analysisResult: any, analysisType: AnalysisType): string[] {
    const insights = [];
    
    // Common insights
    if (analysisResult.netMargin > 15) {
      insights.push('Strong profitability with healthy net margins above industry average');
    } else if (analysisResult.netMargin > 10) {
      insights.push('Moderate profitability with room for improvement');
    } else {
      insights.push('Below-average profitability requires immediate attention');
    }

    // Type-specific insights
    switch (analysisType) {
      case AnalysisType.PROFITABILITY:
        if (analysisResult.grossMargin > 60) {
          insights.push('Excellent gross margin indicates strong pricing power');
        }
        if (analysisResult.operatingMargin < analysisResult.grossMargin * 0.4) {
          insights.push('High operating expenses are impacting profitability');
        }
        break;

      case AnalysisType.MARGIN_ANALYSIS:
        const marginTrend = analysisResult.marginAnalysis?.marginTrends?.slice(-3);
        if (marginTrend && marginTrend.length >= 2) {
          const isImproving = marginTrend[marginTrend.length - 1].netMargin > marginTrend[0].netMargin;
          insights.push(isImproving ? 'Margins are improving over time' : 'Margins are declining and need attention');
        }
        break;

      case AnalysisType.COST_ANALYSIS:
        if (analysisResult.costBreakdown?.detailed?.fixedCosts?.percentOfRevenue > 60) {
          insights.push('High fixed cost ratio may limit flexibility during downturns');
        }
        break;
    }

    return insights;
  }

  private generateRecommendations(analysisResult: any, analysisType: AnalysisType): string[] {
    const recommendations = [];

    // Common recommendations
    if (analysisResult.netMargin < 15) {
      recommendations.push('Implement cost reduction initiatives to improve margins');
      recommendations.push('Review pricing strategy to increase revenue per customer');
    }

    if (analysisResult.grossMargin < 60) {
      recommendations.push('Focus on premium service offerings to improve gross margins');
    }

    // Type-specific recommendations
    switch (analysisType) {
      case AnalysisType.PROFITABILITY:
        recommendations.push('Optimize space utilization to maximize revenue per square foot');
        recommendations.push('Develop recurring revenue streams for predictable cash flow');
        break;

      case AnalysisType.MARGIN_ANALYSIS:
        recommendations.push('Implement dynamic pricing based on demand patterns');
        recommendations.push('Automate operations to reduce labor costs');
        break;

      case AnalysisType.COST_ANALYSIS:
        recommendations.push('Negotiate better rates with suppliers and vendors');
        recommendations.push('Implement energy-efficient solutions to reduce utility costs');
        break;

      case AnalysisType.BREAK_EVEN:
        const breakEven = analysisResult.kpis?.breakEvenAnalysis;
        if (breakEven && analysisResult.totalRevenue < breakEven.breakEvenRevenue * 1.2) {
          recommendations.push('Increase sales volume to improve margin of safety');
        }
        break;
    }

    return recommendations;
  }

  // Additional utility methods...
  private categorizeRevenue(invoices: any[]): any {
    const breakdown = {
      membership: 0,
      dayPasses: 0,
      meetingRooms: 0,
      services: 0,
      other: 0,
    };

    invoices.forEach(invoice => {
      invoice.items.forEach((item: any) => {
        const amount = Number(item.total);
        const description = item.description.toLowerCase();
        
        if (description.includes('membership') || description.includes('plan')) {
          breakdown.membership += amount;
        } else if (description.includes('day pass') || description.includes('daily')) {
          breakdown.dayPasses += amount;
        } else if (description.includes('meeting') || description.includes('room')) {
          breakdown.meetingRooms += amount;
        } else if (description.includes('service')) {
          breakdown.services += amount;
        } else {
          breakdown.other += amount;
        }
      });
    });

    return breakdown;
  }

  private async getMonthlyProfitData(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Simplified monthly profit calculation
    const monthlyData = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const monthlyInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: 'PAID',
        },
      });

      const revenue = monthlyInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
      const costs = revenue * 0.75; // Simplified
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

  // Additional helper methods would be implemented here...
  private calculateTrendDirection(data: number[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (data.length < 2) return 'STABLE';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'INCREASING';
    if (change < -0.05) return 'DECREASING';
    return 'STABLE';
  }

  private calculateTrendVelocity(data: number[]): number {
    if (data.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] > 0) {
        changes.push((data[i] - data[i - 1]) / data[i - 1]);
      }
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  private detectSeasonality(monthlyData: any[]): boolean {
    // Simplified seasonality detection
    return monthlyData.length >= 12;
  }

  private detectCyclicalPattern(monthlyData: any[]): boolean {
    // Simplified cyclical pattern detection
    return false;
  }

  private assessMarginHealth(actualMargin: number, benchmarkMargin: number): string {
    const ratio = actualMargin / benchmarkMargin;
    if (ratio >= 1.1) return 'EXCELLENT';
    if (ratio >= 0.9) return 'GOOD';
    if (ratio >= 0.7) return 'FAIR';
    return 'POOR';
  }

  private calculateMarginImprovementPotential(metrics: ProfitabilityMetrics): number {
    // Simplified calculation
    const benchmarkNet = 18; // Industry benchmark
    return Math.max(0, benchmarkNet - metrics.netProfitMargin);
  }

  private getMarginImprovementRecommendations(metrics: ProfitabilityMetrics): string[] {
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

  private identifyMarginRisks(trends: ProfitTrends): string[] {
    const risks = [];
    
    if (trends.trendAnalysis.direction === 'DECREASING') {
      risks.push('Declining margin trend');
    }
    
    if (trends.trendAnalysis.velocity < -0.02) {
      risks.push('Rapidly declining profitability');
    }
    
    return risks;
  }

  // More utility methods would be implemented...

  private mapAnalysisToData(analysis: any): ProfitAnalysisData {
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

  // Placeholder implementations for missing methods
  private calculateProfitPerCustomer(netProfit: number, customerCount: number): number {
    return customerCount > 0 ? netProfit / customerCount : 0;
  }

  private calculateRevenuePerEmployee(totalRevenue: number, employeeCount: number): number {
    return employeeCount > 0 ? totalRevenue / employeeCount : 0;
  }

  private calculateAssetTurnover(totalRevenue: number, totalAssets: number): number {
    return totalAssets > 0 ? totalRevenue / totalAssets : 0;
  }

  private async calculateProfitGrowthRate(tenantId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simplified calculation - would compare with previous period
    return 15.5; // Mock 15.5% growth
  }

  private estimateCashFlows(totalRevenue: number, totalCosts: number): number[] {
    const netCashFlow = totalRevenue - totalCosts;
    return Array(12).fill(netCashFlow / 12); // Monthly cash flows
  }

  private calculateROA(netProfit: number, totalAssets: number): number {
    return totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
  }

  private calculateROE(netProfit: number, totalEquity: number): number {
    return totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
  }

  private calculateROI(netProfit: number, totalInvestment: number): number {
    return totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  }

  private calculatePaybackPeriod(initialInvestment: number, annualCashFlow: number): number {
    return annualCashFlow > 0 ? initialInvestment / annualCashFlow : 0;
  }

  private calculateIRR(cashFlows: number[]): number {
    // Simplified IRR calculation - would use proper financial formula
    return 12.5; // Mock 12.5% IRR
  }

  private calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cf, index) => {
      return npv + cf / Math.pow(1 + discountRate, index + 1);
    }, -cashFlows[0]);
  }

  private calculatePI(cashFlows: number[], initialInvestment: number, discountRate: number): number {
    const presentValueOfCashFlows = cashFlows.slice(1).reduce((pv, cf, index) => {
      return pv + cf / Math.pow(1 + discountRate, index + 1);
    }, 0);
    return initialInvestment > 0 ? presentValueOfCashFlows / initialInvestment : 0;
  }

  // Additional placeholder methods...
  private performDetailedCostAnalysis(financialData: any): CostAnalysis {
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
        scalability: 75, // Mock score
        efficiency: 80,  // Mock score
      },
    };
  }

  private async getCostTrends(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock implementation
    return {
      trend: 'STABLE',
      monthlyData: [],
    };
  }

  private analyzeCostEfficiency(costAnalysis: CostAnalysis, totalRevenue: number): any {
    return {
      index: 85, // Mock efficiency index
      benchmark: 90,
      opportunities: ['Automate manual processes', 'Negotiate supplier contracts'],
    };
  }

  private identifyCostOptimizationOpportunities(costAnalysis: CostAnalysis, costTrends: any): string[] {
    return [
      'Implement energy-efficient lighting',
      'Automate cleaning schedules',
      'Negotiate bulk purchasing agreements',
    ];
  }

  private async getBudgetData(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock budget data - in production would come from budget planning
    return {
      plannedRevenue: 100000,
      plannedCosts: 75000,
      plannedProfit: 25000,
      plannedMargin: 25,
    };
  }

  private identifyRevenueVarianceFactors(financialData: any, budgetData: any): string[] {
    return ['Market demand changes', 'Pricing adjustments', 'New customer acquisition'];
  }

  private identifyCostVarianceFactors(financialData: any, budgetData: any): string[] {
    return ['Inflation in supplier costs', 'Increased utility rates', 'Additional staff hiring'];
  }

  private calculateBudgetAccuracy(varianceAnalysis: VarianceAnalysis): number {
    const avgVariance = Math.abs(varianceAnalysis.revenueVariance.variancePercent) + 
                       Math.abs(varianceAnalysis.costVariance.variancePercent);
    return Math.max(0, 100 - avgVariance / 2);
  }

  private assessPerformanceVsBudget(varianceAnalysis: VarianceAnalysis): string {
    if (varianceAnalysis.profitVariance.variancePercent > 10) return 'EXCEEDING';
    if (varianceAnalysis.profitVariance.variancePercent > -5) return 'ON_TARGET';
    return 'BELOW_TARGET';
  }

  // More placeholder implementations would go here...
  private calculateAverageSellingPrice(financialData: any): number {
    return financialData.customerCount > 0 ? financialData.totalRevenue / financialData.customerCount : 0;
  }

  private performBreakEvenScenarioAnalysis(params: any): any[] {
    return [
      { scenario: 'Conservative', revenueChange: -10, profitChange: -25, breakEvenChange: 15 },
      { scenario: 'Base Case', revenueChange: 0, profitChange: 0, breakEvenChange: 0 },
      { scenario: 'Optimistic', revenueChange: 15, profitChange: 40, breakEvenChange: -12 },
    ];
  }

  private calculateTargetRevenue(fixedCosts: number, contributionMarginRatio: number, targetProfitMargin: number): number {
    return contributionMarginRatio > 0 ? (fixedCosts / (contributionMarginRatio - targetProfitMargin)) : 0;
  }

  private calculateAssetUtilization(financialData: any): number {
    return 75; // Mock utilization percentage
  }

  private calculateWorkingCapitalTurnover(financialData: any): number {
    return 6.5; // Mock turnover ratio
  }

  private calculateInventoryTurnover(financialData: any): number {
    return 12; // Mock inventory turnover
  }

  private calculatePerformanceRating(roiAnalysis: ROIAnalysis): string {
    if (roiAnalysis.returnOnInvestment > 20) return 'EXCELLENT';
    if (roiAnalysis.returnOnInvestment > 15) return 'GOOD';
    if (roiAnalysis.returnOnInvestment > 10) return 'FAIR';
    return 'POOR';
  }

  private calculateIndustryRanking(metrics: ProfitabilityMetrics, benchmarks: any): number {
    // Simplified ranking calculation
    const score = (metrics.grossProfitMargin / benchmarks.grossMargin) * 0.3 +
                  (metrics.operatingProfitMargin / benchmarks.operatingMargin) * 0.3 +
                  (metrics.netProfitMargin / benchmarks.netMargin) * 0.4;
    return Math.round(score * 100);
  }

  private calculatePercentile(ranking: number): number {
    return Math.min(99, Math.max(1, ranking));
  }

  private async getMarginTrends(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Mock margin trends data
    return [
      { period: '2024-01', grossMargin: 65, operatingMargin: 22, netMargin: 16 },
      { period: '2024-02', grossMargin: 67, operatingMargin: 24, netMargin: 18 },
      { period: '2024-03', grossMargin: 64, operatingMargin: 23, netMargin: 17 },
    ];
  }

  private identifyMarginDrivers(financialData: any, marginTrends: any[]): any[] {
    return [
      { factor: 'Pricing Strategy', impact: 15, trend: 'IMPROVING' },
      { factor: 'Cost Management', impact: -8, trend: 'STABLE' },
      { factor: 'Operational Efficiency', impact: 12, trend: 'IMPROVING' },
    ];
  }

  private getMarginBenchmarks(grossMargin: number, operatingMargin: number, netMargin: number): any {
    return {
      industryAverage: 18,
      topQuartile: 25,
      performance: netMargin > 20 ? 'ABOVE_AVERAGE' : netMargin > 15 ? 'AVERAGE' : 'BELOW_AVERAGE',
    };
  }

  private async forecastMargins(tenantId: string, marginTrends: any[]): Promise<any> {
    // Simplified margin forecasting
    const recentMargin = marginTrends[marginTrends.length - 1]?.netMargin || 15;
    return {
      nextQuarter: recentMargin * 1.02, // 2% improvement
      nextYear: recentMargin * 1.05,    // 5% improvement
      confidence: 75,
    };
  }

  private calculateMarginStability(marginTrends: any[]): number {
    if (marginTrends.length < 2) return 100;
    
    const margins = marginTrends.map(t => t.netMargin);
    const mean = margins.reduce((sum, m) => sum + m, 0) / margins.length;
    const variance = margins.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / margins.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  private calculateMarginImprovement(marginTrends: any[]): number {
    if (marginTrends.length < 2) return 0;
    
    const first = marginTrends[0].netMargin;
    const last = marginTrends[marginTrends.length - 1].netMargin;
    
    return ((last - first) / first) * 100;
  }

  private assessMarginRisk(marginDrivers: any[]): string {
    const negativeDrivers = marginDrivers.filter(d => d.impact < 0);
    if (negativeDrivers.length > marginDrivers.length / 2) return 'HIGH';
    if (negativeDrivers.length > 0) return 'MEDIUM';
    return 'LOW';
  }
}

export const profitAnalysisService = new ProfitAnalysisService();
import { prisma } from '../lib/prisma';
import {
  ReconciliationType,
  ReconciliationStatus,
  MatchStatus,
  DiscrepancyType,
  ReportPeriod,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface PaymentReconciliationData {
  id: string;
  reconciliationType: ReconciliationType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  bankStatementTotal: number;
  recordedPaymentsTotal: number;
  variance: number;
  status: ReconciliationStatus;
  matchedTransactions: number;
  unmatchedTransactions: number;
  duplicateTransactions: number;
  missingTransactions: number;
  discrepancies: any[];
  adjustments: any[];
  notes?: string;
  reconciliationRules: any;
  autoMatchPercentage: number;
  manualReview: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  reconciledBy: string;
  reconciledAt: Date;
  createdAt: Date;
  updatedAt: Date;
  transactions: PaymentReconciliationItemData[];
}

export interface PaymentReconciliationItemData {
  id: string;
  reconciliationId: string;
  paymentId?: string;
  transactionReference: string;
  bankReference?: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  description?: string;
  matchStatus: MatchStatus;
  matchConfidence: number;
  matchedBy?: string;
  matchedAt?: Date;
  discrepancyType?: DiscrepancyType;
  discrepancyAmount?: number;
  notes?: string;
  requiresAction: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReconciliationRequest {
  reconciliationType: ReconciliationType;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  bankStatementFile?: string;
  reconciliationRules?: ReconciliationRules;
  autoMatch?: boolean;
}

export interface ReconciliationRules {
  amountTolerance: number;        // Tolerance in currency units
  amountTolerancePercent: number; // Tolerance as percentage
  dateTolerance: number;          // Days tolerance for date matching
  descriptionMatching: {
    enabled: boolean;
    minimumSimilarity: number;    // 0-1 score for text similarity
    keywordMatching: boolean;
  };
  referenceMatching: {
    enabled: boolean;
    strictMatching: boolean;      // Exact match vs fuzzy match
  };
  duplicateDetection: {
    enabled: boolean;
    timeWindow: number;           // Hours within which duplicates are detected
  };
  autoApproval: {
    enabled: boolean;
    confidenceThreshold: number;  // Minimum confidence for auto-approval
    amountLimit: number;          // Maximum amount for auto-approval
  };
}

export interface BankTransaction {
  reference: string;
  bankReference?: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  accountNumber?: string;
  routing?: string;
  metadata?: any;
}

export interface MatchingResult {
  paymentId: string;
  confidence: number;
  matchReasons: string[];
  discrepancies: Array<{
    type: DiscrepancyType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    amount?: number;
  }>;
}

export interface ReconciliationSummary {
  totalBankTransactions: number;
  totalRecordedPayments: number;
  matchedCount: number;
  unmatchedBankTransactions: number;
  unmatchedRecordedPayments: number;
  duplicateTransactions: number;
  discrepancyAmount: number;
  reconciliationRate: number;
  autoMatchRate: number;
  averageMatchConfidence: number;
}

export interface ReconciliationReport {
  summary: ReconciliationSummary;
  matchedTransactions: PaymentReconciliationItemData[];
  unmatchedBankTransactions: PaymentReconciliationItemData[];
  unmatchedRecordedPayments: any[];
  duplicates: PaymentReconciliationItemData[];
  discrepancies: Array<{
    type: DiscrepancyType;
    count: number;
    totalAmount: number;
    transactions: PaymentReconciliationItemData[];
  }>;
  recommendations: string[];
}

// ============================================================================
// PAYMENT RECONCILIATION SERVICE
// ============================================================================

export class PaymentReconciliationService {

  // ============================================================================
  // RECONCILIATION CREATION AND PROCESSING
  // ============================================================================

  async createReconciliation(
    tenantId: string,
    userId: string,
    request: CreateReconciliationRequest
  ): Promise<PaymentReconciliationData> {
    try {
      // Get recorded payments for the period
      const recordedPayments = await this.getRecordedPayments(tenantId, request.startDate, request.endDate);
      const recordedPaymentsTotal = recordedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

      // Parse bank statement (if provided) or get from payment gateway
      const bankTransactions = await this.getBankTransactions(tenantId, request);
      const bankStatementTotal = bankTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate initial variance
      const variance = bankStatementTotal - recordedPaymentsTotal;

      // Create reconciliation record
      const reconciliation = await prisma.paymentReconciliation.create({
        data: {
          tenantId,
          reconciliationType: request.reconciliationType,
          period: request.period,
          startDate: request.startDate,
          endDate: request.endDate,
          bankStatementTotal,
          recordedPaymentsTotal,
          variance,
          status: ReconciliationStatus.IN_PROGRESS,
          reconciliationRules: request.reconciliationRules || this.getDefaultRules(),
          reconciledBy: userId,
        },
      });

      // Create reconciliation items from bank transactions
      const reconciliationItems = await this.createReconciliationItems(
        reconciliation.id,
        bankTransactions
      );

      // Perform automatic matching if requested
      if (request.autoMatch !== false) {
        await this.performAutoMatching(
          tenantId,
          reconciliation.id,
          recordedPayments,
          request.reconciliationRules || this.getDefaultRules()
        );
      }

      // Update reconciliation with matching results
      const updatedReconciliation = await this.updateReconciliationSummary(reconciliation.id);

      logger.info('Payment reconciliation created successfully', {
        tenantId,
        reconciliationId: reconciliation.id,
        reconciliationType: request.reconciliationType,
        bankTotal: bankStatementTotal,
        recordedTotal: recordedPaymentsTotal,
        variance,
      });

      return this.mapReconciliationToData(updatedReconciliation);
    } catch (error) {
      logger.error('Failed to create payment reconciliation', {
        tenantId,
        request,
        userId,
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // AUTOMATIC MATCHING ENGINE
  // ============================================================================

  private async performAutoMatching(
    tenantId: string,
    reconciliationId: string,
    recordedPayments: any[],
    rules: ReconciliationRules
  ): Promise<void> {
    try {
      // Get unmatched reconciliation items
      const unmatchedItems = await prisma.paymentReconciliationItem.findMany({
        where: {
          reconciliationId,
          matchStatus: MatchStatus.UNMATCHED,
        },
      });

      let autoMatchedCount = 0;
      const matchResults: Array<{ itemId: string; result: MatchingResult | null }> = [];

      // Process each unmatched item
      for (const item of unmatchedItems) {
        const matchingResult = await this.findBestMatch(item, recordedPayments, rules);
        matchResults.push({ itemId: item.id, result: matchingResult });

        if (matchingResult && matchingResult.confidence >= rules.autoApproval.confidenceThreshold) {
          // Auto-match if confidence is high enough
          await this.matchTransaction(
            item.id,
            matchingResult.paymentId,
            matchingResult.confidence,
            'AUTO_MATCHED',
            `Auto-matched with ${matchingResult.confidence}% confidence: ${matchingResult.matchReasons.join(', ')}`
          );
          autoMatchedCount++;
        }
      }

      // Update reconciliation with auto-match statistics
      const totalItems = unmatchedItems.length;
      const autoMatchPercentage = totalItems > 0 ? (autoMatchedCount / totalItems) * 100 : 0;

      await prisma.paymentReconciliation.update({
        where: { id: reconciliationId },
        data: { autoMatchPercentage },
      });

      logger.info('Auto-matching completed', {
        reconciliationId,
        totalItems,
        autoMatchedCount,
        autoMatchPercentage,
      });
    } catch (error) {
      logger.error('Failed to perform auto-matching', { reconciliationId }, error as Error);
      throw error;
    }
  }

  private async findBestMatch(
    item: any,
    recordedPayments: any[],
    rules: ReconciliationRules
  ): Promise<MatchingResult | null> {
    const candidates: Array<{ payment: any; score: number; reasons: string[]; discrepancies: any[] }> = [];

    // Find potential matches
    for (const payment of recordedPayments) {
      const matchScore = this.calculateMatchScore(item, payment, rules);
      
      if (matchScore.score > 0.3) { // Minimum threshold for consideration
        candidates.push({
          payment,
          score: matchScore.score,
          reasons: matchScore.reasons,
          discrepancies: matchScore.discrepancies,
        });
      }
    }

    // Sort by score and return best match
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length > 0) {
      const bestMatch = candidates[0];
      return {
        paymentId: bestMatch.payment.id,
        confidence: bestMatch.score * 100,
        matchReasons: bestMatch.reasons,
        discrepancies: bestMatch.discrepancies,
      };
    }

    return null;
  }

  private calculateMatchScore(
    item: any,
    payment: any,
    rules: ReconciliationRules
  ): { score: number; reasons: string[]; discrepancies: any[] } {
    let score = 0;
    const reasons: string[] = [];
    const discrepancies: any[] = [];

    // Amount matching (most important factor - 40% weight)
    const amountDiff = Math.abs(item.amount - Number(payment.amount));
    const amountToleranceAbs = rules.amountTolerance;
    const amountTolerancePercent = (Number(payment.amount) * rules.amountTolerancePercent) / 100;
    const amountTolerance = Math.max(amountToleranceAbs, amountTolerancePercent);

    if (amountDiff === 0) {
      score += 0.4;
      reasons.push('Exact amount match');
    } else if (amountDiff <= amountTolerance) {
      const amountScore = 0.4 * (1 - (amountDiff / amountTolerance));
      score += amountScore;
      reasons.push(`Amount within tolerance (${amountDiff.toFixed(2)} difference)`);
    } else {
      discrepancies.push({
        type: DiscrepancyType.AMOUNT_MISMATCH,
        severity: amountDiff > Number(payment.amount) * 0.1 ? 'HIGH' : 'MEDIUM',
        description: `Amount mismatch: ${amountDiff.toFixed(2)}`,
        amount: amountDiff,
      });
    }

    // Date matching (25% weight)
    const dateDiff = Math.abs(
      item.transactionDate.getTime() - payment.processedAt?.getTime() || payment.createdAt.getTime()
    ) / (1000 * 60 * 60 * 24); // Days

    if (dateDiff === 0) {
      score += 0.25;
      reasons.push('Same date');
    } else if (dateDiff <= rules.dateTolerance) {
      const dateScore = 0.25 * (1 - (dateDiff / rules.dateTolerance));
      score += dateScore;
      reasons.push(`Date within tolerance (${Math.round(dateDiff)} days difference)`);
    } else {
      discrepancies.push({
        type: DiscrepancyType.DATE_MISMATCH,
        severity: dateDiff > 7 ? 'HIGH' : 'MEDIUM',
        description: `Date mismatch: ${Math.round(dateDiff)} days difference`,
      });
    }

    // Reference matching (20% weight)
    if (rules.referenceMatching.enabled) {
      const referenceMatch = this.compareReferences(
        item.transactionReference,
        payment.reference,
        rules.referenceMatching.strictMatching
      );

      if (referenceMatch.score > 0.8) {
        score += 0.2;
        reasons.push('Reference match');
      } else if (referenceMatch.score > 0.5) {
        score += 0.1;
        reasons.push('Partial reference match');
      } else {
        discrepancies.push({
          type: DiscrepancyType.REFERENCE_MISMATCH,
          severity: 'LOW',
          description: 'Reference mismatch',
        });
      }
    }

    // Description matching (15% weight)
    if (rules.descriptionMatching.enabled) {
      const descriptionSimilarity = this.calculateTextSimilarity(
        item.description || '',
        payment.reference || ''
      );

      if (descriptionSimilarity >= rules.descriptionMatching.minimumSimilarity) {
        score += 0.15 * descriptionSimilarity;
        reasons.push('Description similarity');
      }
    }

    return { score: Math.min(1, score), reasons, discrepancies };
  }

  // ============================================================================
  // MANUAL MATCHING AND ADJUSTMENTS
  // ============================================================================

  async manualMatch(
    tenantId: string,
    reconciliationItemId: string,
    paymentId: string,
    userId: string,
    notes?: string
  ): Promise<PaymentReconciliationItemData> {
    try {
      // Verify the reconciliation item belongs to the tenant
      const item = await prisma.paymentReconciliationItem.findFirst({
        where: {
          id: reconciliationItemId,
          reconciliation: { tenantId },
        },
        include: { reconciliation: true },
      });

      if (!item) {
        throw new Error('Reconciliation item not found or access denied');
      }

      // Verify the payment belongs to the tenant
      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, tenantId },
      });

      if (!payment) {
        throw new Error('Payment not found or access denied');
      }

      // Update the reconciliation item with manual match
      await this.matchTransaction(
        reconciliationItemId,
        paymentId,
        100, // Manual matches get 100% confidence
        'MANUALLY_MATCHED',
        notes,
        userId
      );

      // Update reconciliation summary
      await this.updateReconciliationSummary(item.reconciliationId);

      logger.info('Manual match created successfully', {
        tenantId,
        reconciliationItemId,
        paymentId,
        userId,
      });

      // Return updated item
      const updatedItem = await prisma.paymentReconciliationItem.findUnique({
        where: { id: reconciliationItemId },
      });

      return this.mapReconciliationItemToData(updatedItem!);
    } catch (error) {
      logger.error('Failed to create manual match', {
        tenantId,
        reconciliationItemId,
        paymentId,
        userId,
      }, error as Error);
      throw error;
    }
  }

  async unmatchTransaction(
    tenantId: string,
    reconciliationItemId: string,
    userId: string,
    reason?: string
  ): Promise<PaymentReconciliationItemData> {
    try {
      const item = await prisma.paymentReconciliationItem.findFirst({
        where: {
          id: reconciliationItemId,
          reconciliation: { tenantId },
        },
        include: { reconciliation: true },
      });

      if (!item) {
        throw new Error('Reconciliation item not found or access denied');
      }

      // Update the reconciliation item
      const updatedItem = await prisma.paymentReconciliationItem.update({
        where: { id: reconciliationItemId },
        data: {
          paymentId: null,
          matchStatus: MatchStatus.UNMATCHED,
          matchConfidence: 0,
          matchedBy: null,
          matchedAt: null,
          notes: reason ? `Unmatched: ${reason}` : 'Manually unmatched',
          requiresAction: true,
        },
      });

      // Update reconciliation summary
      await this.updateReconciliationSummary(item.reconciliationId);

      logger.info('Transaction unmatched successfully', {
        tenantId,
        reconciliationItemId,
        userId,
        reason,
      });

      return this.mapReconciliationItemToData(updatedItem);
    } catch (error) {
      logger.error('Failed to unmatch transaction', {
        tenantId,
        reconciliationItemId,
        userId,
      }, error as Error);
      throw error;
    }
  }

  async addAdjustment(
    tenantId: string,
    reconciliationId: string,
    adjustment: {
      type: 'BANK_ERROR' | 'RECORDING_ERROR' | 'TIMING_DIFFERENCE' | 'FEE' | 'OTHER';
      amount: number;
      description: string;
      reference?: string;
    },
    userId: string
  ): Promise<void> {
    try {
      const reconciliation = await prisma.paymentReconciliation.findFirst({
        where: { id: reconciliationId, tenantId },
      });

      if (!reconciliation) {
        throw new Error('Reconciliation not found or access denied');
      }

      // Add adjustment to the reconciliation
      const adjustments = Array.isArray(reconciliation.adjustments) ? reconciliation.adjustments : [];
      adjustments.push({
        ...adjustment,
        addedBy: userId,
        addedAt: new Date().toISOString(),
        id: `adj_${Date.now()}`,
      });

      await prisma.paymentReconciliation.update({
        where: { id: reconciliationId },
        data: { adjustments },
      });

      // Update reconciliation summary
      await this.updateReconciliationSummary(reconciliationId);

      logger.info('Adjustment added successfully', {
        tenantId,
        reconciliationId,
        adjustment,
        userId,
      });
    } catch (error) {
      logger.error('Failed to add adjustment', {
        tenantId,
        reconciliationId,
        adjustment,
        userId,
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // RECONCILIATION APPROVAL AND COMPLETION
  // ============================================================================

  async approveReconciliation(
    tenantId: string,
    reconciliationId: string,
    userId: string,
    notes?: string
  ): Promise<PaymentReconciliationData> {
    try {
      const reconciliation = await prisma.paymentReconciliation.findFirst({
        where: { id: reconciliationId, tenantId },
        include: { transactions: true },
      });

      if (!reconciliation) {
        throw new Error('Reconciliation not found or access denied');
      }

      if (reconciliation.status !== ReconciliationStatus.REQUIRES_REVIEW) {
        throw new Error('Reconciliation is not ready for approval');
      }

      // Check if there are any unresolved discrepancies
      const unresolvedItems = reconciliation.transactions.filter(
        item => item.requiresAction && item.matchStatus === MatchStatus.UNMATCHED
      );

      if (unresolvedItems.length > 0) {
        throw new Error('Cannot approve reconciliation with unresolved items requiring action');
      }

      // Update reconciliation status
      const updatedReconciliation = await prisma.paymentReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: ReconciliationStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
          notes: notes ? `${reconciliation.notes || ''}\nApproval notes: ${notes}` : reconciliation.notes,
        },
        include: { transactions: true },
      });

      logger.info('Reconciliation approved successfully', {
        tenantId,
        reconciliationId,
        userId,
      });

      return this.mapReconciliationToData(updatedReconciliation);
    } catch (error) {
      logger.error('Failed to approve reconciliation', {
        tenantId,
        reconciliationId,
        userId,
      }, error as Error);
      throw error;
    }
  }

  async rejectReconciliation(
    tenantId: string,
    reconciliationId: string,
    userId: string,
    reason: string
  ): Promise<PaymentReconciliationData> {
    try {
      const updatedReconciliation = await prisma.paymentReconciliation.update({
        where: {
          id: reconciliationId,
          tenantId,
        },
        data: {
          status: ReconciliationStatus.REJECTED,
          notes: `Rejected by ${userId}: ${reason}`,
        },
        include: { transactions: true },
      });

      logger.info('Reconciliation rejected', {
        tenantId,
        reconciliationId,
        userId,
        reason,
      });

      return this.mapReconciliationToData(updatedReconciliation);
    } catch (error) {
      logger.error('Failed to reject reconciliation', {
        tenantId,
        reconciliationId,
        userId,
      }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // RECONCILIATION REPORTING
  // ============================================================================

  async generateReconciliationReport(
    tenantId: string,
    reconciliationId: string
  ): Promise<ReconciliationReport> {
    try {
      const reconciliation = await prisma.paymentReconciliation.findFirst({
        where: { id: reconciliationId, tenantId },
        include: { transactions: true },
      });

      if (!reconciliation) {
        throw new Error('Reconciliation not found or access denied');
      }

      const transactions = reconciliation.transactions.map(tx => this.mapReconciliationItemToData(tx));
      
      // Categorize transactions
      const matchedTransactions = transactions.filter(tx => tx.matchStatus === MatchStatus.MATCHED);
      const unmatchedBankTransactions = transactions.filter(tx => tx.matchStatus === MatchStatus.UNMATCHED);
      const duplicates = transactions.filter(tx => tx.discrepancyType === DiscrepancyType.DUPLICATE_TRANSACTION);

      // Get unmatched recorded payments
      const unmatchedRecordedPayments = await this.getUnmatchedRecordedPayments(
        tenantId,
        reconciliation.startDate,
        reconciliation.endDate,
        reconciliationId
      );

      // Group discrepancies by type
      const discrepancyGroups = new Map<DiscrepancyType, { count: number; totalAmount: number; transactions: any[] }>();
      
      transactions.forEach(tx => {
        if (tx.discrepancyType) {
          const group = discrepancyGroups.get(tx.discrepancyType) || { count: 0, totalAmount: 0, transactions: [] };
          group.count++;
          group.totalAmount += tx.discrepancyAmount || 0;
          group.transactions.push(tx);
          discrepancyGroups.set(tx.discrepancyType, group);
        }
      });

      const discrepancies = Array.from(discrepancyGroups.entries()).map(([type, data]) => ({
        type,
        ...data,
      }));

      // Calculate summary
      const summary: ReconciliationSummary = {
        totalBankTransactions: transactions.length,
        totalRecordedPayments: matchedTransactions.length + unmatchedRecordedPayments.length,
        matchedCount: matchedTransactions.length,
        unmatchedBankTransactions: unmatchedBankTransactions.length,
        unmatchedRecordedPayments: unmatchedRecordedPayments.length,
        duplicateTransactions: duplicates.length,
        discrepancyAmount: Math.abs(Number(reconciliation.variance)),
        reconciliationRate: transactions.length > 0 ? (matchedTransactions.length / transactions.length) * 100 : 0,
        autoMatchRate: Number(reconciliation.autoMatchPercentage),
        averageMatchConfidence: matchedTransactions.length > 0 ? 
          matchedTransactions.reduce((sum, tx) => sum + tx.matchConfidence, 0) / matchedTransactions.length : 0,
      };

      // Generate recommendations
      const recommendations = this.generateReconciliationRecommendations(summary, discrepancies);

      return {
        summary,
        matchedTransactions,
        unmatchedBankTransactions,
        unmatchedRecordedPayments,
        duplicates,
        discrepancies,
        recommendations,
      };
    } catch (error) {
      logger.error('Failed to generate reconciliation report', { tenantId, reconciliationId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getRecordedPayments(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return prisma.payment.findMany({
      where: {
        tenantId,
        processedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      orderBy: { processedAt: 'asc' },
    });
  }

  private async getBankTransactions(tenantId: string, request: CreateReconciliationRequest): Promise<BankTransaction[]> {
    // In production, this would parse bank statement files or connect to banking APIs
    // For now, we'll simulate bank transactions based on recorded payments with some variations
    
    const recordedPayments = await this.getRecordedPayments(tenantId, request.startDate, request.endDate);
    
    const bankTransactions: BankTransaction[] = recordedPayments.map((payment, index) => {
      // Add some variance to simulate real-world discrepancies
      const amountVariance = Math.random() * 2 - 1; // -1 to +1
      const dateVariance = Math.floor(Math.random() * 3) - 1; // -1 to +1 days
      
      const bankDate = new Date(payment.processedAt);
      bankDate.setDate(bankDate.getDate() + dateVariance);
      
      return {
        reference: `BNK${payment.id.slice(-8).toUpperCase()}`,
        bankReference: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: Number(payment.amount) + amountVariance,
        currency: payment.currency,
        date: bankDate,
        description: `TRANSFER ${payment.reference || `PMT${index + 1}`}`,
        metadata: {
          originalPaymentId: payment.id,
          variance: amountVariance,
        },
      };
    });

    // Add some unmatched bank transactions
    if (Math.random() > 0.7) {
      bankTransactions.push({
        reference: `UNK${Date.now()}`,
        amount: Math.random() * 1000 + 100,
        currency: 'USD',
        date: new Date(request.startDate.getTime() + Math.random() * (request.endDate.getTime() - request.startDate.getTime())),
        description: 'UNIDENTIFIED TRANSFER',
      });
    }

    return bankTransactions;
  }

  private async createReconciliationItems(
    reconciliationId: string,
    bankTransactions: BankTransaction[]
  ): Promise<void> {
    const items = bankTransactions.map(tx => ({
      reconciliationId,
      transactionReference: tx.reference,
      bankReference: tx.bankReference,
      amount: tx.amount,
      currency: tx.currency,
      transactionDate: tx.date,
      description: tx.description,
      matchStatus: MatchStatus.UNMATCHED,
      matchConfidence: 0,
      requiresAction: false,
      metadata: tx.metadata || {},
    }));

    await prisma.paymentReconciliationItem.createMany({
      data: items,
    });
  }

  private async matchTransaction(
    itemId: string,
    paymentId: string,
    confidence: number,
    matchStatus: MatchStatus,
    notes?: string,
    userId?: string
  ): Promise<void> {
    await prisma.paymentReconciliationItem.update({
      where: { id: itemId },
      data: {
        paymentId,
        matchStatus,
        matchConfidence: confidence,
        matchedBy: userId,
        matchedAt: new Date(),
        notes,
        requiresAction: false,
      },
    });
  }

  private async updateReconciliationSummary(reconciliationId: string): Promise<any> {
    const reconciliation = await prisma.paymentReconciliation.findUnique({
      where: { id: reconciliationId },
      include: { transactions: true },
    });

    if (!reconciliation) return null;

    const transactions = reconciliation.transactions;
    const matchedCount = transactions.filter(tx => tx.matchStatus === MatchStatus.MATCHED).length;
    const unmatchedCount = transactions.filter(tx => tx.matchStatus === MatchStatus.UNMATCHED).length;
    const duplicateCount = transactions.filter(tx => tx.discrepancyType === DiscrepancyType.DUPLICATE_TRANSACTION).length;
    const missingCount = 0; // Would be calculated from unmatched recorded payments

    // Determine if manual review is required
    const manualReview = unmatchedCount > 0 || duplicateCount > 0 || Math.abs(Number(reconciliation.variance)) > 100;
    
    // Determine status
    let status = reconciliation.status;
    if (status === ReconciliationStatus.IN_PROGRESS) {
      if (manualReview) {
        status = ReconciliationStatus.REQUIRES_REVIEW;
      } else if (unmatchedCount === 0) {
        status = ReconciliationStatus.COMPLETED;
      }
    }

    return prisma.paymentReconciliation.update({
      where: { id: reconciliationId },
      data: {
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount,
        duplicateTransactions: duplicateCount,
        missingTransactions: missingCount,
        manualReview,
        status,
      },
      include: { transactions: true },
    });
  }

  private getDefaultRules(): ReconciliationRules {
    return {
      amountTolerance: 1.0,           // $1 tolerance
      amountTolerancePercent: 0.1,    // 0.1% tolerance
      dateTolerance: 3,               // 3 days tolerance
      descriptionMatching: {
        enabled: true,
        minimumSimilarity: 0.7,
        keywordMatching: true,
      },
      referenceMatching: {
        enabled: true,
        strictMatching: false,
      },
      duplicateDetection: {
        enabled: true,
        timeWindow: 24,               // 24 hours
      },
      autoApproval: {
        enabled: true,
        confidenceThreshold: 95,      // 95% confidence
        amountLimit: 10000,           // $10,000 limit
      },
    };
  }

  private compareReferences(ref1: string, ref2: string, strict: boolean): { score: number } {
    if (!ref1 || !ref2) return { score: 0 };
    
    if (strict) {
      return { score: ref1.toLowerCase() === ref2.toLowerCase() ? 1 : 0 };
    }
    
    // Fuzzy matching
    return { score: this.calculateTextSimilarity(ref1, ref2) };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const str1 = text1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const str2 = text2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (str1 === str2) return 1;
    
    // Simple Levenshtein distance approximation
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / maxLength;
  }

  private async getUnmatchedRecordedPayments(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    reconciliationId: string
  ): Promise<any[]> {
    // Get all recorded payments for the period
    const allPayments = await this.getRecordedPayments(tenantId, startDate, endDate);
    
    // Get matched payment IDs from reconciliation
    const matchedPaymentIds = await prisma.paymentReconciliationItem.findMany({
      where: {
        reconciliationId,
        paymentId: { not: null },
      },
      select: { paymentId: true },
    });

    const matchedIds = new Set(matchedPaymentIds.map(item => item.paymentId));
    
    // Return unmatched payments
    return allPayments.filter(payment => !matchedIds.has(payment.id));
  }

  private generateReconciliationRecommendations(
    summary: ReconciliationSummary,
    discrepancies: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (summary.reconciliationRate < 90) {
      recommendations.push('Reconciliation rate is below 90%. Review matching rules and consider adjusting tolerances.');
    }

    if (summary.autoMatchRate < 70) {
      recommendations.push('Auto-match rate is low. Consider training the matching algorithm or improving transaction descriptions.');
    }

    if (summary.duplicateTransactions > 0) {
      recommendations.push('Duplicate transactions detected. Implement stricter duplicate detection rules.');
    }

    if (summary.discrepancyAmount > 1000) {
      recommendations.push('Large discrepancy amount detected. Investigate potential systematic issues.');
    }

    if (discrepancies.some(d => d.type === DiscrepancyType.AMOUNT_MISMATCH && d.count > 5)) {
      recommendations.push('Multiple amount mismatches detected. Review fee structures and payment processing.');
    }

    if (discrepancies.some(d => d.type === DiscrepancyType.DATE_MISMATCH && d.count > 3)) {
      recommendations.push('Multiple date mismatches detected. Consider adjusting date tolerance or processing delays.');
    }

    return recommendations;
  }

  // ============================================================================
  // MAPPING METHODS
  // ============================================================================

  private mapReconciliationToData(reconciliation: any): PaymentReconciliationData {
    return {
      id: reconciliation.id,
      reconciliationType: reconciliation.reconciliationType,
      period: reconciliation.period,
      startDate: reconciliation.startDate,
      endDate: reconciliation.endDate,
      bankStatementTotal: Number(reconciliation.bankStatementTotal),
      recordedPaymentsTotal: Number(reconciliation.recordedPaymentsTotal),
      variance: Number(reconciliation.variance),
      status: reconciliation.status,
      matchedTransactions: reconciliation.matchedTransactions,
      unmatchedTransactions: reconciliation.unmatchedTransactions,
      duplicateTransactions: reconciliation.duplicateTransactions,
      missingTransactions: reconciliation.missingTransactions,
      discrepancies: reconciliation.discrepancies,
      adjustments: reconciliation.adjustments,
      notes: reconciliation.notes,
      reconciliationRules: reconciliation.reconciliationRules,
      autoMatchPercentage: Number(reconciliation.autoMatchPercentage),
      manualReview: reconciliation.manualReview,
      approvedBy: reconciliation.approvedBy,
      approvedAt: reconciliation.approvedAt,
      reconciledBy: reconciliation.reconciledBy,
      reconciledAt: reconciliation.reconciledAt,
      createdAt: reconciliation.createdAt,
      updatedAt: reconciliation.updatedAt,
      transactions: reconciliation.transactions?.map((tx: any) => this.mapReconciliationItemToData(tx)) || [],
    };
  }

  private mapReconciliationItemToData(item: any): PaymentReconciliationItemData {
    return {
      id: item.id,
      reconciliationId: item.reconciliationId,
      paymentId: item.paymentId,
      transactionReference: item.transactionReference,
      bankReference: item.bankReference,
      amount: Number(item.amount),
      currency: item.currency,
      transactionDate: item.transactionDate,
      description: item.description,
      matchStatus: item.matchStatus,
      matchConfidence: Number(item.matchConfidence),
      matchedBy: item.matchedBy,
      matchedAt: item.matchedAt,
      discrepancyType: item.discrepancyType,
      discrepancyAmount: item.discrepancyAmount ? Number(item.discrepancyAmount) : undefined,
      notes: item.notes,
      requiresAction: item.requiresAction,
      metadata: item.metadata,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  // ============================================================================
  // PUBLIC QUERY METHODS
  // ============================================================================

  async getReconciliations(
    tenantId: string,
    filters: {
      reconciliationType?: ReconciliationType;
      status?: ReconciliationStatus;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    reconciliations: PaymentReconciliationData[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause: any = { tenantId };
      
      if (filters.reconciliationType) whereClause.reconciliationType = filters.reconciliationType;
      if (filters.status) whereClause.status = filters.status;
      if (filters.startDate) whereClause.startDate = { gte: filters.startDate };
      if (filters.endDate) whereClause.endDate = { lte: filters.endDate };

      const [reconciliations, total] = await Promise.all([
        prisma.paymentReconciliation.findMany({
          where: whereClause,
          include: { transactions: true },
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.paymentReconciliation.count({ where: whereClause }),
      ]);

      const reconciliationData = reconciliations.map(rec => this.mapReconciliationToData(rec));
      const hasMore = (pagination.skip || 0) + reconciliationData.length < total;

      return {
        reconciliations: reconciliationData,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get payment reconciliations', { tenantId, filters }, error as Error);
      throw error;
    }
  }

  async getReconciliationById(
    tenantId: string,
    reconciliationId: string
  ): Promise<PaymentReconciliationData | null> {
    try {
      const reconciliation = await prisma.paymentReconciliation.findFirst({
        where: { id: reconciliationId, tenantId },
        include: { transactions: true },
      });

      return reconciliation ? this.mapReconciliationToData(reconciliation) : null;
    } catch (error) {
      logger.error('Failed to get payment reconciliation by ID', { tenantId, reconciliationId }, error as Error);
      throw error;
    }
  }
}

export const paymentReconciliationService = new PaymentReconciliationService();
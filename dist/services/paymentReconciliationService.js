"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentReconciliationService = exports.PaymentReconciliationService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class PaymentReconciliationService {
    async createReconciliation(tenantId, userId, request) {
        try {
            const recordedPayments = await this.getRecordedPayments(tenantId, request.startDate, request.endDate);
            const recordedPaymentsTotal = recordedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            const bankTransactions = await this.getBankTransactions(tenantId, request);
            const bankStatementTotal = bankTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            const variance = bankStatementTotal - recordedPaymentsTotal;
            const reconciliation = await prisma_1.prisma.paymentReconciliation.create({
                data: {
                    tenantId,
                    reconciliationType: request.reconciliationType,
                    period: request.period,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    bankStatementTotal,
                    recordedPaymentsTotal,
                    variance,
                    status: client_1.ReconciliationStatus.IN_PROGRESS,
                    reconciliationRules: request.reconciliationRules || this.getDefaultRules(),
                    reconciledBy: userId,
                },
            });
            const reconciliationItems = await this.createReconciliationItems(reconciliation.id, bankTransactions);
            if (request.autoMatch !== false) {
                await this.performAutoMatching(tenantId, reconciliation.id, recordedPayments, request.reconciliationRules || this.getDefaultRules());
            }
            const updatedReconciliation = await this.updateReconciliationSummary(reconciliation.id);
            logger_1.logger.info('Payment reconciliation created successfully', {
                tenantId,
                reconciliationId: reconciliation.id,
                reconciliationType: request.reconciliationType,
                bankTotal: bankStatementTotal,
                recordedTotal: recordedPaymentsTotal,
                variance,
            });
            return this.mapReconciliationToData(updatedReconciliation);
        }
        catch (error) {
            logger_1.logger.error('Failed to create payment reconciliation', {
                tenantId,
                request,
                userId,
            }, error);
            throw error;
        }
    }
    async performAutoMatching(tenantId, reconciliationId, recordedPayments, rules) {
        try {
            const unmatchedItems = await prisma_1.prisma.paymentReconciliationItem.findMany({
                where: {
                    reconciliationId,
                    matchStatus: client_1.MatchStatus.UNMATCHED,
                },
            });
            let autoMatchedCount = 0;
            const matchResults = [];
            for (const item of unmatchedItems) {
                const matchingResult = await this.findBestMatch(item, recordedPayments, rules);
                matchResults.push({ itemId: item.id, result: matchingResult });
                if (matchingResult && matchingResult.confidence >= rules.autoApproval.confidenceThreshold) {
                    await this.matchTransaction(item.id, matchingResult.paymentId, matchingResult.confidence, 'AUTO_MATCHED', `Auto-matched with ${matchingResult.confidence}% confidence: ${matchingResult.matchReasons.join(', ')}`);
                    autoMatchedCount++;
                }
            }
            const totalItems = unmatchedItems.length;
            const autoMatchPercentage = totalItems > 0 ? (autoMatchedCount / totalItems) * 100 : 0;
            await prisma_1.prisma.paymentReconciliation.update({
                where: { id: reconciliationId },
                data: { autoMatchPercentage },
            });
            logger_1.logger.info('Auto-matching completed', {
                reconciliationId,
                totalItems,
                autoMatchedCount,
                autoMatchPercentage,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to perform auto-matching', { reconciliationId }, error);
            throw error;
        }
    }
    async findBestMatch(item, recordedPayments, rules) {
        const candidates = [];
        for (const payment of recordedPayments) {
            const matchScore = this.calculateMatchScore(item, payment, rules);
            if (matchScore.score > 0.3) {
                candidates.push({
                    payment,
                    score: matchScore.score,
                    reasons: matchScore.reasons,
                    discrepancies: matchScore.discrepancies,
                });
            }
        }
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
    calculateMatchScore(item, payment, rules) {
        let score = 0;
        const reasons = [];
        const discrepancies = [];
        const amountDiff = Math.abs(item.amount - Number(payment.amount));
        const amountToleranceAbs = rules.amountTolerance;
        const amountTolerancePercent = (Number(payment.amount) * rules.amountTolerancePercent) / 100;
        const amountTolerance = Math.max(amountToleranceAbs, amountTolerancePercent);
        if (amountDiff === 0) {
            score += 0.4;
            reasons.push('Exact amount match');
        }
        else if (amountDiff <= amountTolerance) {
            const amountScore = 0.4 * (1 - (amountDiff / amountTolerance));
            score += amountScore;
            reasons.push(`Amount within tolerance (${amountDiff.toFixed(2)} difference)`);
        }
        else {
            discrepancies.push({
                type: client_1.DiscrepancyType.AMOUNT_MISMATCH,
                severity: amountDiff > Number(payment.amount) * 0.1 ? 'HIGH' : 'MEDIUM',
                description: `Amount mismatch: ${amountDiff.toFixed(2)}`,
                amount: amountDiff,
            });
        }
        const dateDiff = Math.abs(item.transactionDate.getTime() - payment.processedAt?.getTime() || payment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (dateDiff === 0) {
            score += 0.25;
            reasons.push('Same date');
        }
        else if (dateDiff <= rules.dateTolerance) {
            const dateScore = 0.25 * (1 - (dateDiff / rules.dateTolerance));
            score += dateScore;
            reasons.push(`Date within tolerance (${Math.round(dateDiff)} days difference)`);
        }
        else {
            discrepancies.push({
                type: client_1.DiscrepancyType.DATE_MISMATCH,
                severity: dateDiff > 7 ? 'HIGH' : 'MEDIUM',
                description: `Date mismatch: ${Math.round(dateDiff)} days difference`,
            });
        }
        if (rules.referenceMatching.enabled) {
            const referenceMatch = this.compareReferences(item.transactionReference, payment.reference, rules.referenceMatching.strictMatching);
            if (referenceMatch.score > 0.8) {
                score += 0.2;
                reasons.push('Reference match');
            }
            else if (referenceMatch.score > 0.5) {
                score += 0.1;
                reasons.push('Partial reference match');
            }
            else {
                discrepancies.push({
                    type: client_1.DiscrepancyType.REFERENCE_MISMATCH,
                    severity: 'LOW',
                    description: 'Reference mismatch',
                });
            }
        }
        if (rules.descriptionMatching.enabled) {
            const descriptionSimilarity = this.calculateTextSimilarity(item.description || '', payment.reference || '');
            if (descriptionSimilarity >= rules.descriptionMatching.minimumSimilarity) {
                score += 0.15 * descriptionSimilarity;
                reasons.push('Description similarity');
            }
        }
        return { score: Math.min(1, score), reasons, discrepancies };
    }
    async manualMatch(tenantId, reconciliationItemId, paymentId, userId, notes) {
        try {
            const item = await prisma_1.prisma.paymentReconciliationItem.findFirst({
                where: {
                    id: reconciliationItemId,
                    reconciliation: { tenantId },
                },
                include: { reconciliation: true },
            });
            if (!item) {
                throw new Error('Reconciliation item not found or access denied');
            }
            const payment = await prisma_1.prisma.payment.findFirst({
                where: { id: paymentId, tenantId },
            });
            if (!payment) {
                throw new Error('Payment not found or access denied');
            }
            await this.matchTransaction(reconciliationItemId, paymentId, 100, 'MANUALLY_MATCHED', notes, userId);
            await this.updateReconciliationSummary(item.reconciliationId);
            logger_1.logger.info('Manual match created successfully', {
                tenantId,
                reconciliationItemId,
                paymentId,
                userId,
            });
            const updatedItem = await prisma_1.prisma.paymentReconciliationItem.findUnique({
                where: { id: reconciliationItemId },
            });
            return this.mapReconciliationItemToData(updatedItem);
        }
        catch (error) {
            logger_1.logger.error('Failed to create manual match', {
                tenantId,
                reconciliationItemId,
                paymentId,
                userId,
            }, error);
            throw error;
        }
    }
    async unmatchTransaction(tenantId, reconciliationItemId, userId, reason) {
        try {
            const item = await prisma_1.prisma.paymentReconciliationItem.findFirst({
                where: {
                    id: reconciliationItemId,
                    reconciliation: { tenantId },
                },
                include: { reconciliation: true },
            });
            if (!item) {
                throw new Error('Reconciliation item not found or access denied');
            }
            const updatedItem = await prisma_1.prisma.paymentReconciliationItem.update({
                where: { id: reconciliationItemId },
                data: {
                    paymentId: null,
                    matchStatus: client_1.MatchStatus.UNMATCHED,
                    matchConfidence: 0,
                    matchedBy: null,
                    matchedAt: null,
                    notes: reason ? `Unmatched: ${reason}` : 'Manually unmatched',
                    requiresAction: true,
                },
            });
            await this.updateReconciliationSummary(item.reconciliationId);
            logger_1.logger.info('Transaction unmatched successfully', {
                tenantId,
                reconciliationItemId,
                userId,
                reason,
            });
            return this.mapReconciliationItemToData(updatedItem);
        }
        catch (error) {
            logger_1.logger.error('Failed to unmatch transaction', {
                tenantId,
                reconciliationItemId,
                userId,
            }, error);
            throw error;
        }
    }
    async addAdjustment(tenantId, reconciliationId, adjustment, userId) {
        try {
            const reconciliation = await prisma_1.prisma.paymentReconciliation.findFirst({
                where: { id: reconciliationId, tenantId },
            });
            if (!reconciliation) {
                throw new Error('Reconciliation not found or access denied');
            }
            const adjustments = Array.isArray(reconciliation.adjustments) ? reconciliation.adjustments : [];
            adjustments.push({
                ...adjustment,
                addedBy: userId,
                addedAt: new Date().toISOString(),
                id: `adj_${Date.now()}`,
            });
            await prisma_1.prisma.paymentReconciliation.update({
                where: { id: reconciliationId },
                data: { adjustments },
            });
            await this.updateReconciliationSummary(reconciliationId);
            logger_1.logger.info('Adjustment added successfully', {
                tenantId,
                reconciliationId,
                adjustment,
                userId,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to add adjustment', {
                tenantId,
                reconciliationId,
                adjustment,
                userId,
            }, error);
            throw error;
        }
    }
    async approveReconciliation(tenantId, reconciliationId, userId, notes) {
        try {
            const reconciliation = await prisma_1.prisma.paymentReconciliation.findFirst({
                where: { id: reconciliationId, tenantId },
                include: { transactions: true },
            });
            if (!reconciliation) {
                throw new Error('Reconciliation not found or access denied');
            }
            if (reconciliation.status !== client_1.ReconciliationStatus.REQUIRES_REVIEW) {
                throw new Error('Reconciliation is not ready for approval');
            }
            const unresolvedItems = reconciliation.transactions.filter(item => item.requiresAction && item.matchStatus === client_1.MatchStatus.UNMATCHED);
            if (unresolvedItems.length > 0) {
                throw new Error('Cannot approve reconciliation with unresolved items requiring action');
            }
            const updatedReconciliation = await prisma_1.prisma.paymentReconciliation.update({
                where: { id: reconciliationId },
                data: {
                    status: client_1.ReconciliationStatus.APPROVED,
                    approvedBy: userId,
                    approvedAt: new Date(),
                    notes: notes ? `${reconciliation.notes || ''}\nApproval notes: ${notes}` : reconciliation.notes,
                },
                include: { transactions: true },
            });
            logger_1.logger.info('Reconciliation approved successfully', {
                tenantId,
                reconciliationId,
                userId,
            });
            return this.mapReconciliationToData(updatedReconciliation);
        }
        catch (error) {
            logger_1.logger.error('Failed to approve reconciliation', {
                tenantId,
                reconciliationId,
                userId,
            }, error);
            throw error;
        }
    }
    async rejectReconciliation(tenantId, reconciliationId, userId, reason) {
        try {
            const updatedReconciliation = await prisma_1.prisma.paymentReconciliation.update({
                where: {
                    id: reconciliationId,
                    tenantId,
                },
                data: {
                    status: client_1.ReconciliationStatus.REJECTED,
                    notes: `Rejected by ${userId}: ${reason}`,
                },
                include: { transactions: true },
            });
            logger_1.logger.info('Reconciliation rejected', {
                tenantId,
                reconciliationId,
                userId,
                reason,
            });
            return this.mapReconciliationToData(updatedReconciliation);
        }
        catch (error) {
            logger_1.logger.error('Failed to reject reconciliation', {
                tenantId,
                reconciliationId,
                userId,
            }, error);
            throw error;
        }
    }
    async generateReconciliationReport(tenantId, reconciliationId) {
        try {
            const reconciliation = await prisma_1.prisma.paymentReconciliation.findFirst({
                where: { id: reconciliationId, tenantId },
                include: { transactions: true },
            });
            if (!reconciliation) {
                throw new Error('Reconciliation not found or access denied');
            }
            const transactions = reconciliation.transactions.map(tx => this.mapReconciliationItemToData(tx));
            const matchedTransactions = transactions.filter(tx => tx.matchStatus === client_1.MatchStatus.MATCHED);
            const unmatchedBankTransactions = transactions.filter(tx => tx.matchStatus === client_1.MatchStatus.UNMATCHED);
            const duplicates = transactions.filter(tx => tx.discrepancyType === client_1.DiscrepancyType.DUPLICATE_TRANSACTION);
            const unmatchedRecordedPayments = await this.getUnmatchedRecordedPayments(tenantId, reconciliation.startDate, reconciliation.endDate, reconciliationId);
            const discrepancyGroups = new Map();
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
            const summary = {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to generate reconciliation report', { tenantId, reconciliationId }, error);
            throw error;
        }
    }
    async getRecordedPayments(tenantId, startDate, endDate) {
        return prisma_1.prisma.payment.findMany({
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
    async getBankTransactions(tenantId, request) {
        const recordedPayments = await this.getRecordedPayments(tenantId, request.startDate, request.endDate);
        const bankTransactions = recordedPayments.map((payment, index) => {
            const amountVariance = Math.random() * 2 - 1;
            const dateVariance = Math.floor(Math.random() * 3) - 1;
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
    async createReconciliationItems(reconciliationId, bankTransactions) {
        const items = bankTransactions.map(tx => ({
            reconciliationId,
            transactionReference: tx.reference,
            bankReference: tx.bankReference,
            amount: tx.amount,
            currency: tx.currency,
            transactionDate: tx.date,
            description: tx.description,
            matchStatus: client_1.MatchStatus.UNMATCHED,
            matchConfidence: 0,
            requiresAction: false,
            metadata: tx.metadata || {},
        }));
        await prisma_1.prisma.paymentReconciliationItem.createMany({
            data: items,
        });
    }
    async matchTransaction(itemId, paymentId, confidence, matchStatus, notes, userId) {
        await prisma_1.prisma.paymentReconciliationItem.update({
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
    async updateReconciliationSummary(reconciliationId) {
        const reconciliation = await prisma_1.prisma.paymentReconciliation.findUnique({
            where: { id: reconciliationId },
            include: { transactions: true },
        });
        if (!reconciliation)
            return null;
        const transactions = reconciliation.transactions;
        const matchedCount = transactions.filter(tx => tx.matchStatus === client_1.MatchStatus.MATCHED).length;
        const unmatchedCount = transactions.filter(tx => tx.matchStatus === client_1.MatchStatus.UNMATCHED).length;
        const duplicateCount = transactions.filter(tx => tx.discrepancyType === client_1.DiscrepancyType.DUPLICATE_TRANSACTION).length;
        const missingCount = 0;
        const manualReview = unmatchedCount > 0 || duplicateCount > 0 || Math.abs(Number(reconciliation.variance)) > 100;
        let status = reconciliation.status;
        if (status === client_1.ReconciliationStatus.IN_PROGRESS) {
            if (manualReview) {
                status = client_1.ReconciliationStatus.REQUIRES_REVIEW;
            }
            else if (unmatchedCount === 0) {
                status = client_1.ReconciliationStatus.COMPLETED;
            }
        }
        return prisma_1.prisma.paymentReconciliation.update({
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
    getDefaultRules() {
        return {
            amountTolerance: 1.0,
            amountTolerancePercent: 0.1,
            dateTolerance: 3,
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
                timeWindow: 24,
            },
            autoApproval: {
                enabled: true,
                confidenceThreshold: 95,
                amountLimit: 10000,
            },
        };
    }
    compareReferences(ref1, ref2, strict) {
        if (!ref1 || !ref2)
            return { score: 0 };
        if (strict) {
            return { score: ref1.toLowerCase() === ref2.toLowerCase() ? 1 : 0 };
        }
        return { score: this.calculateTextSimilarity(ref1, ref2) };
    }
    calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2)
            return 0;
        const str1 = text1.toLowerCase().replace(/[^a-z0-9]/g, '');
        const str2 = text2.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (str1 === str2)
            return 1;
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0)
            return 1;
        let matches = 0;
        for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
            if (str1[i] === str2[i])
                matches++;
        }
        return matches / maxLength;
    }
    async getUnmatchedRecordedPayments(tenantId, startDate, endDate, reconciliationId) {
        const allPayments = await this.getRecordedPayments(tenantId, startDate, endDate);
        const matchedPaymentIds = await prisma_1.prisma.paymentReconciliationItem.findMany({
            where: {
                reconciliationId,
                paymentId: { not: null },
            },
            select: { paymentId: true },
        });
        const matchedIds = new Set(matchedPaymentIds.map(item => item.paymentId));
        return allPayments.filter(payment => !matchedIds.has(payment.id));
    }
    generateReconciliationRecommendations(summary, discrepancies) {
        const recommendations = [];
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
        if (discrepancies.some(d => d.type === client_1.DiscrepancyType.AMOUNT_MISMATCH && d.count > 5)) {
            recommendations.push('Multiple amount mismatches detected. Review fee structures and payment processing.');
        }
        if (discrepancies.some(d => d.type === client_1.DiscrepancyType.DATE_MISMATCH && d.count > 3)) {
            recommendations.push('Multiple date mismatches detected. Consider adjusting date tolerance or processing delays.');
        }
        return recommendations;
    }
    mapReconciliationToData(reconciliation) {
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
            transactions: reconciliation.transactions?.map((tx) => this.mapReconciliationItemToData(tx)) || [],
        };
    }
    mapReconciliationItemToData(item) {
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
    async getReconciliations(tenantId, filters = {}, pagination = {}) {
        try {
            const whereClause = { tenantId };
            if (filters.reconciliationType)
                whereClause.reconciliationType = filters.reconciliationType;
            if (filters.status)
                whereClause.status = filters.status;
            if (filters.startDate)
                whereClause.startDate = { gte: filters.startDate };
            if (filters.endDate)
                whereClause.endDate = { lte: filters.endDate };
            const [reconciliations, total] = await Promise.all([
                prisma_1.prisma.paymentReconciliation.findMany({
                    where: whereClause,
                    include: { transactions: true },
                    orderBy: { createdAt: 'desc' },
                    skip: pagination.skip || 0,
                    take: pagination.take || 50,
                }),
                prisma_1.prisma.paymentReconciliation.count({ where: whereClause }),
            ]);
            const reconciliationData = reconciliations.map(rec => this.mapReconciliationToData(rec));
            const hasMore = (pagination.skip || 0) + reconciliationData.length < total;
            return {
                reconciliations: reconciliationData,
                total,
                hasMore,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get payment reconciliations', { tenantId, filters }, error);
            throw error;
        }
    }
    async getReconciliationById(tenantId, reconciliationId) {
        try {
            const reconciliation = await prisma_1.prisma.paymentReconciliation.findFirst({
                where: { id: reconciliationId, tenantId },
                include: { transactions: true },
            });
            return reconciliation ? this.mapReconciliationToData(reconciliation) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get payment reconciliation by ID', { tenantId, reconciliationId }, error);
            throw error;
        }
    }
}
exports.PaymentReconciliationService = PaymentReconciliationService;
exports.paymentReconciliationService = new PaymentReconciliationService();
//# sourceMappingURL=paymentReconciliationService.js.map
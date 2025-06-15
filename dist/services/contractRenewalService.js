"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractRenewalService = exports.NotificationType = exports.RenewalType = exports.RenewalTrigger = void 0;
const errors_1 = require("../utils/errors");
const contractLifecycleService_1 = require("./contractLifecycleService");
var RenewalTrigger;
(function (RenewalTrigger) {
    RenewalTrigger["DAYS_BEFORE_EXPIRY"] = "DAYS_BEFORE_EXPIRY";
    RenewalTrigger["MANUAL"] = "MANUAL";
    RenewalTrigger["AUTO_ON_EXPIRY"] = "AUTO_ON_EXPIRY";
})(RenewalTrigger || (exports.RenewalTrigger = RenewalTrigger = {}));
var RenewalType;
(function (RenewalType) {
    RenewalType["EXTEND_CURRENT"] = "EXTEND_CURRENT";
    RenewalType["NEW_CONTRACT"] = "NEW_CONTRACT";
    RenewalType["RENEGOTIATE"] = "RENEGOTIATE";
})(RenewalType || (exports.RenewalType = RenewalType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["SMS"] = "SMS";
    NotificationType["IN_APP"] = "IN_APP";
    NotificationType["WEBHOOK"] = "WEBHOOK";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class ContractRenewalService {
    async createRenewalRule(tenantId, createdBy, data) {
        if (data.trigger === RenewalTrigger.DAYS_BEFORE_EXPIRY && !data.triggerDays) {
            throw new errors_1.ValidationError('Trigger days must be specified for DAYS_BEFORE_EXPIRY trigger');
        }
        if (data.triggerDays && (data.triggerDays < 1 || data.triggerDays > 365)) {
            throw new errors_1.ValidationError('Trigger days must be between 1 and 365');
        }
        if (data.renewalPeriod < 1 || data.renewalPeriod > 120) {
            throw new errors_1.ValidationError('Renewal period must be between 1 and 120 months');
        }
        if (data.priceAdjustment) {
            if (data.priceAdjustment.type === 'PERCENTAGE' &&
                (data.priceAdjustment.value < -50 || data.priceAdjustment.value > 100)) {
                throw new errors_1.ValidationError('Percentage adjustment must be between -50% and 100%');
            }
        }
        const rule = {
            id: this.generateId(),
            tenantId,
            name: data.name,
            description: data.description,
            isActive: true,
            contractTypes: data.contractTypes,
            trigger: data.trigger,
            triggerDays: data.triggerDays,
            renewalType: data.renewalType,
            autoApprove: data.autoApprove,
            renewalPeriod: data.renewalPeriod,
            priceAdjustment: data.priceAdjustment,
            notificationSettings: data.notificationSettings,
            conditions: data.conditions,
            metadata: data.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
        };
        return rule;
    }
    async getRenewalRules(tenantId) {
        return [
            {
                id: 'rule-1',
                tenantId,
                name: 'Standard Membership Auto-Renewal',
                description: 'Automatically renew membership contracts 30 days before expiry',
                isActive: true,
                contractTypes: ['MEMBERSHIP'],
                trigger: RenewalTrigger.DAYS_BEFORE_EXPIRY,
                triggerDays: 30,
                renewalType: RenewalType.EXTEND_CURRENT,
                autoApprove: true,
                renewalPeriod: 12,
                priceAdjustment: {
                    type: 'PERCENTAGE',
                    value: 5,
                },
                notificationSettings: {
                    enabled: true,
                    types: [NotificationType.EMAIL, NotificationType.IN_APP],
                    recipients: ['admin@company.com'],
                    template: 'renewal-notification',
                },
                conditions: {
                    minContractValue: 100,
                },
                metadata: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                createdBy: 'user-admin',
            },
            {
                id: 'rule-2',
                tenantId,
                name: 'Premium Contract Manual Review',
                description: 'High-value contracts require manual approval for renewal',
                isActive: true,
                contractTypes: ['MEMBERSHIP', 'SERVICE'],
                trigger: RenewalTrigger.DAYS_BEFORE_EXPIRY,
                triggerDays: 60,
                renewalType: RenewalType.RENEGOTIATE,
                autoApprove: false,
                renewalPeriod: 12,
                notificationSettings: {
                    enabled: true,
                    types: [NotificationType.EMAIL],
                    recipients: ['manager@company.com', 'admin@company.com'],
                },
                conditions: {
                    minContractValue: 1000,
                },
                metadata: {},
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                createdBy: 'user-admin',
            },
        ];
    }
    async updateRenewalRule(tenantId, ruleId, updates) {
        const rules = await this.getRenewalRules(tenantId);
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) {
            throw new errors_1.NotFoundError('Renewal rule not found');
        }
        if (updates.triggerDays && (updates.triggerDays < 1 || updates.triggerDays > 365)) {
            throw new errors_1.ValidationError('Trigger days must be between 1 and 365');
        }
        const updatedRule = {
            ...rule,
            ...updates,
            updatedAt: new Date(),
        };
        return updatedRule;
    }
    async deleteRenewalRule(tenantId, ruleId) {
        const rules = await this.getRenewalRules(tenantId);
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) {
            throw new errors_1.NotFoundError('Renewal rule not found');
        }
        const proposals = await this.getRenewalProposals(tenantId, {
            page: 1,
            limit: 1,
            ruleId,
            status: contractLifecycleService_1.RenewalStatus.PENDING,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        if (proposals.proposals.length > 0) {
            throw new errors_1.ValidationError('Cannot delete rule with pending renewal proposals');
        }
        return { success: true };
    }
    async createRenewalProposal(tenantId, contractId, createdBy, ruleId) {
        const contract = await contractLifecycleService_1.contractLifecycleService.getContractById(tenantId, contractId);
        if (!contract.endDate) {
            throw new errors_1.ValidationError('Contract must have an end date to create renewal proposal');
        }
        if (contract.status !== contractLifecycleService_1.ContractStatus.ACTIVE) {
            throw new errors_1.ValidationError('Only active contracts can be renewed');
        }
        const existingProposals = await this.getRenewalProposals(tenantId, {
            page: 1,
            limit: 1,
            contractId,
            status: contractLifecycleService_1.RenewalStatus.PENDING,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        if (existingProposals.proposals.length > 0) {
            throw new errors_1.ValidationError('Contract already has a pending renewal proposal');
        }
        let applicableRule;
        if (ruleId) {
            const rules = await this.getRenewalRules(tenantId);
            applicableRule = rules.find(r => r.id === ruleId);
            if (!applicableRule) {
                throw new errors_1.NotFoundError('Renewal rule not found');
            }
        }
        else {
            applicableRule = await this.findApplicableRule(tenantId, contract);
        }
        const proposedStartDate = new Date(contract.endDate);
        const proposedEndDate = new Date(proposedStartDate);
        proposedEndDate.setMonth(proposedEndDate.getMonth() + (applicableRule?.renewalPeriod || 12));
        let proposedValue = contract.value;
        let priceAdjustment;
        if (applicableRule?.priceAdjustment && contract.value) {
            const adjustment = applicableRule.priceAdjustment;
            if (adjustment.type === 'PERCENTAGE') {
                proposedValue = contract.value * (1 + adjustment.value / 100);
                priceAdjustment = {
                    type: adjustment.type,
                    value: adjustment.value,
                    reason: `Automatic ${adjustment.value}% adjustment per renewal rule`,
                };
            }
            else if (adjustment.type === 'FIXED_AMOUNT') {
                proposedValue = contract.value + adjustment.value;
                priceAdjustment = {
                    type: adjustment.type,
                    value: adjustment.value,
                    reason: `Fixed amount adjustment of ${adjustment.value} per renewal rule`,
                };
            }
        }
        const proposal = {
            id: this.generateId(),
            contractId,
            ruleId: applicableRule?.id,
            tenantId,
            currentContractEndDate: contract.endDate,
            proposedStartDate,
            proposedEndDate,
            renewalPeriod: applicableRule?.renewalPeriod || 12,
            currentValue: contract.value,
            proposedValue,
            priceAdjustment,
            status: applicableRule?.autoApprove ? contractLifecycleService_1.RenewalStatus.AUTO_RENEWED : contractLifecycleService_1.RenewalStatus.PENDING,
            renewalType: applicableRule?.renewalType || RenewalType.EXTEND_CURRENT,
            metadata: {
                ruleApplied: applicableRule?.name,
                autoGenerated: !ruleId,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy,
        };
        if (applicableRule?.autoApprove) {
            proposal.approvedBy = 'system';
            proposal.approvedAt = new Date();
            proposal.processedAt = new Date();
        }
        if (applicableRule?.notificationSettings.enabled) {
            await this.sendRenewalNotifications(proposal, applicableRule, 'PROPOSAL_CREATED');
        }
        return proposal;
    }
    async getRenewalProposals(tenantId, query) {
        const mockProposals = [
            {
                id: 'proposal-1',
                contractId: 'contract-1',
                ruleId: 'rule-1',
                tenantId,
                currentContractEndDate: new Date('2024-12-31'),
                proposedStartDate: new Date('2025-01-01'),
                proposedEndDate: new Date('2025-12-31'),
                renewalPeriod: 12,
                currentValue: 299,
                proposedValue: 314,
                priceAdjustment: {
                    type: 'PERCENTAGE',
                    value: 5,
                    reason: 'Automatic 5% adjustment per renewal rule',
                },
                status: contractLifecycleService_1.RenewalStatus.AUTO_RENEWED,
                renewalType: RenewalType.EXTEND_CURRENT,
                approvedBy: 'system',
                approvedAt: new Date(),
                processedAt: new Date(),
                metadata: {
                    ruleApplied: 'Standard Membership Auto-Renewal',
                    autoGenerated: true,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
            },
            {
                id: 'proposal-2',
                contractId: 'contract-2',
                ruleId: 'rule-2',
                tenantId,
                currentContractEndDate: new Date('2024-03-15'),
                proposedStartDate: new Date('2024-03-16'),
                proposedEndDate: new Date('2025-03-15'),
                renewalPeriod: 12,
                currentValue: 1500,
                proposedValue: 1500,
                status: contractLifecycleService_1.RenewalStatus.PENDING,
                renewalType: RenewalType.RENEGOTIATE,
                notes: 'High-value contract requires manager approval',
                metadata: {
                    ruleApplied: 'Premium Contract Manual Review',
                    autoGenerated: true,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
            },
        ];
        let filteredProposals = mockProposals;
        if (query.status) {
            filteredProposals = filteredProposals.filter(p => p.status === query.status);
        }
        if (query.contractId) {
            filteredProposals = filteredProposals.filter(p => p.contractId === query.contractId);
        }
        if (query.ruleId) {
            filteredProposals = filteredProposals.filter(p => p.ruleId === query.ruleId);
        }
        const offset = (query.page - 1) * query.limit;
        const paginatedProposals = filteredProposals.slice(offset, offset + query.limit);
        return {
            proposals: paginatedProposals,
            pagination: {
                page: query.page,
                limit: query.limit,
                total: filteredProposals.length,
                pages: Math.ceil(filteredProposals.length / query.limit),
            },
        };
    }
    async processRenewalProposal(tenantId, proposalId, processedBy, data) {
        const proposals = await this.getRenewalProposals(tenantId, {
            page: 1,
            limit: 100,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        const proposal = proposals.proposals.find(p => p.id === proposalId);
        if (!proposal) {
            throw new errors_1.NotFoundError('Renewal proposal not found');
        }
        if (proposal.status !== contractLifecycleService_1.RenewalStatus.PENDING) {
            throw new errors_1.ValidationError('Only pending proposals can be processed');
        }
        const updatedProposal = {
            ...proposal,
            status: data.action === 'APPROVE' ? contractLifecycleService_1.RenewalStatus.APPROVED : contractLifecycleService_1.RenewalStatus.DECLINED,
            notes: data.notes || proposal.notes,
            processedAt: new Date(),
            updatedAt: new Date(),
        };
        if (data.action === 'APPROVE') {
            updatedProposal.approvedBy = processedBy;
            updatedProposal.approvedAt = new Date();
            if (data.modifyTerms) {
                if (data.newValue)
                    updatedProposal.proposedValue = data.newValue;
                if (data.newEndDate)
                    updatedProposal.proposedEndDate = data.newEndDate;
            }
            await this.executeRenewal(tenantId, updatedProposal, processedBy);
        }
        else {
            updatedProposal.declinedBy = processedBy;
            updatedProposal.declinedAt = new Date();
            updatedProposal.declineReason = data.declineReason;
        }
        return updatedProposal;
    }
    async checkAndCreateRenewals(tenantId) {
        const rules = await this.getRenewalRules(tenantId);
        const activeRules = rules.filter(r => r.isActive);
        let created = 0;
        let processed = 0;
        let notifications = 0;
        for (const rule of activeRules) {
            if (rule.trigger === RenewalTrigger.DAYS_BEFORE_EXPIRY && rule.triggerDays) {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + rule.triggerDays);
                const expiringContracts = await contractLifecycleService_1.contractLifecycleService.getExpiringContracts(tenantId, rule.triggerDays + 5);
                for (const contract of expiringContracts) {
                    if (contract.endDate && this.isContractEligibleForRule(contract, rule)) {
                        const daysDiff = Math.ceil((contract.endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                        if (daysDiff <= rule.triggerDays && daysDiff >= rule.triggerDays - 1) {
                            try {
                                const existingProposals = await this.getRenewalProposals(tenantId, {
                                    page: 1,
                                    limit: 1,
                                    contractId: contract.id,
                                    sortBy: 'createdAt',
                                    sortOrder: 'desc',
                                });
                                if (existingProposals.proposals.length === 0) {
                                    const proposal = await this.createRenewalProposal(tenantId, contract.id, 'system', rule.id);
                                    created++;
                                    if (proposal.status === contractLifecycleService_1.RenewalStatus.AUTO_RENEWED) {
                                        processed++;
                                    }
                                    if (rule.notificationSettings.enabled) {
                                        notifications++;
                                    }
                                }
                            }
                            catch (error) {
                                console.error(`Failed to create renewal for contract ${contract.id}:`, error);
                            }
                        }
                    }
                }
            }
        }
        return { created, processed, notifications };
    }
    async getRenewalStats(tenantId) {
        const proposals = await this.getRenewalProposals(tenantId, {
            page: 1,
            limit: 1000,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        const totalProposals = proposals.proposals.length;
        const pendingApproval = proposals.proposals.filter(p => p.status === contractLifecycleService_1.RenewalStatus.PENDING).length;
        const autoApproved = proposals.proposals.filter(p => p.status === contractLifecycleService_1.RenewalStatus.AUTO_RENEWED).length;
        const declined = proposals.proposals.filter(p => p.status === contractLifecycleService_1.RenewalStatus.DECLINED).length;
        const processed = proposals.proposals.filter(p => p.processedAt).length;
        const successRate = totalProposals > 0 ?
            ((autoApproved + proposals.proposals.filter(p => p.status === contractLifecycleService_1.RenewalStatus.APPROVED).length) / totalProposals) * 100 : 0;
        const upcomingContracts = await contractLifecycleService_1.contractLifecycleService.getExpiringContracts(tenantId, 60);
        const rules = await this.getRenewalRules(tenantId);
        const upcomingRenewals = upcomingContracts.map(contract => {
            const daysUntilExpiry = contract.endDate ?
                Math.ceil((contract.endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
            const hasActiveRule = rules.some(rule => rule.isActive && this.isContractEligibleForRule(contract, rule));
            return {
                contractId: contract.id,
                contractTitle: contract.title,
                clientName: contract.parties.find(p => p.role === 'CLIENT')?.name || 'Unknown',
                expiryDate: contract.endDate,
                daysUntilExpiry,
                hasActiveRule,
            };
        });
        return {
            totalProposals,
            pendingApproval,
            autoApproved,
            declined,
            processed,
            successRate,
            byStatus: [
                { status: contractLifecycleService_1.RenewalStatus.PENDING, count: pendingApproval, percentage: (pendingApproval / totalProposals) * 100 },
                { status: contractLifecycleService_1.RenewalStatus.AUTO_RENEWED, count: autoApproved, percentage: (autoApproved / totalProposals) * 100 },
                { status: contractLifecycleService_1.RenewalStatus.APPROVED, count: proposals.proposals.filter(p => p.status === contractLifecycleService_1.RenewalStatus.APPROVED).length, percentage: 0 },
                { status: contractLifecycleService_1.RenewalStatus.DECLINED, count: declined, percentage: (declined / totalProposals) * 100 },
            ],
            byRenewalType: [
                { type: RenewalType.EXTEND_CURRENT, count: 0, successRate: 0 },
                { type: RenewalType.NEW_CONTRACT, count: 0, successRate: 0 },
                { type: RenewalType.RENEGOTIATE, count: 0, successRate: 0 },
            ],
            upcomingRenewals,
            recentActivity: [],
        };
    }
    async findApplicableRule(tenantId, contract) {
        const rules = await this.getRenewalRules(tenantId);
        return rules.find(rule => rule.isActive && this.isContractEligibleForRule(contract, rule));
    }
    isContractEligibleForRule(contract, rule) {
        if (!rule.contractTypes.includes(contract.type)) {
            return false;
        }
        if (rule.conditions) {
            const conditions = rule.conditions;
            if (contract.value) {
                if (conditions.minContractValue && contract.value < conditions.minContractValue) {
                    return false;
                }
                if (conditions.maxContractValue && contract.value > conditions.maxContractValue) {
                    return false;
                }
            }
            const clientId = contract.parties?.find((p) => p.role === 'CLIENT')?.clientId;
            if (clientId && conditions.excludeClientIds?.includes(clientId)) {
                return false;
            }
        }
        return true;
    }
    async executeRenewal(tenantId, proposal, executedBy) {
        const originalContract = await contractLifecycleService_1.contractLifecycleService.getContractById(tenantId, proposal.contractId);
        if (proposal.renewalType === RenewalType.EXTEND_CURRENT) {
            await contractLifecycleService_1.contractLifecycleService.updateContract(tenantId, proposal.contractId, {
                endDate: proposal.proposedEndDate,
                value: proposal.proposedValue,
            });
        }
        else if (proposal.renewalType === RenewalType.NEW_CONTRACT) {
            await contractLifecycleService_1.contractLifecycleService.createContract(tenantId, executedBy, {
                type: originalContract.type,
                title: `${originalContract.title} (Renewed)`,
                content: originalContract.content,
                parties: originalContract.parties,
                terms: originalContract.terms,
                startDate: proposal.proposedStartDate,
                endDate: proposal.proposedEndDate,
                autoRenewal: originalContract.autoRenewal,
                renewalPeriod: originalContract.renewalPeriod,
                value: proposal.proposedValue,
                currency: originalContract.currency,
                metadata: {
                    ...originalContract.metadata,
                    renewedFrom: proposal.contractId,
                    renewalProposalId: proposal.id,
                },
            });
            await contractLifecycleService_1.contractLifecycleService.terminateContract(tenantId, proposal.contractId, executedBy, 'Contract renewed with new contract');
        }
    }
    async sendRenewalNotifications(proposal, rule, eventType) {
        console.log(`Sending renewal notification: ${eventType}`, {
            proposalId: proposal.id,
            contractId: proposal.contractId,
            recipients: rule.notificationSettings.recipients,
            types: rule.notificationSettings.types,
        });
    }
    generateId() {
        return `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.contractRenewalService = new ContractRenewalService();
//# sourceMappingURL=contractRenewalService.js.map
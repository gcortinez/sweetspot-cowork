import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import { contractLifecycleService, ContractStatus, RenewalStatus } from './contractLifecycleService';

export enum RenewalTrigger {
  DAYS_BEFORE_EXPIRY = 'DAYS_BEFORE_EXPIRY',
  MANUAL = 'MANUAL',
  AUTO_ON_EXPIRY = 'AUTO_ON_EXPIRY'
}

export enum RenewalType {
  EXTEND_CURRENT = 'EXTEND_CURRENT',
  NEW_CONTRACT = 'NEW_CONTRACT',
  RENEGOTIATE = 'RENEGOTIATE'
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK'
}

interface RenewalRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  contractTypes: string[]; // Contract types this rule applies to
  trigger: RenewalTrigger;
  triggerDays?: number; // Days before expiry for trigger
  renewalType: RenewalType;
  autoApprove: boolean;
  renewalPeriod: number; // months
  priceAdjustment?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
  };
  notificationSettings: {
    enabled: boolean;
    types: NotificationType[];
    recipients: string[]; // email addresses or user IDs
    template?: string;
  };
  conditions?: {
    minContractValue?: number;
    maxContractValue?: number;
    clientTypes?: string[];
    excludeClientIds?: string[];
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface CreateRenewalRuleData {
  name: string;
  description?: string;
  contractTypes: string[];
  trigger: RenewalTrigger;
  triggerDays?: number;
  renewalType: RenewalType;
  autoApprove: boolean;
  renewalPeriod: number;
  priceAdjustment?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
  };
  notificationSettings: {
    enabled: boolean;
    types: NotificationType[];
    recipients: string[];
    template?: string;
  };
  conditions?: {
    minContractValue?: number;
    maxContractValue?: number;
    clientTypes?: string[];
    excludeClientIds?: string[];
  };
  metadata?: Record<string, any>;
  isActive?: boolean;
}

interface RenewalProposal {
  id: string;
  contractId: string;
  ruleId?: string;
  tenantId: string;
  currentContractEndDate: Date;
  proposedStartDate: Date;
  proposedEndDate: Date;
  renewalPeriod: number;
  currentValue?: number;
  proposedValue?: number;
  priceAdjustment?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    reason: string;
  };
  status: RenewalStatus;
  renewalType: RenewalType;
  terms?: string[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  declinedBy?: string;
  declinedAt?: Date;
  declineReason?: string;
  processedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ProcessRenewalData {
  action: 'APPROVE' | 'DECLINE';
  notes?: string;
  declineReason?: string;
  modifyTerms?: boolean;
  newValue?: number;
  newEndDate?: Date;
}

interface RenewalQuery {
  page: number;
  limit: number;
  status?: RenewalStatus;
  contractId?: string;
  ruleId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface RenewalStats {
  totalProposals: number;
  pendingApproval: number;
  autoApproved: number;
  declined: number;
  processed: number;
  successRate: number;
  byStatus: Array<{
    status: RenewalStatus;
    count: number;
    percentage: number;
  }>;
  byRenewalType: Array<{
    type: RenewalType;
    count: number;
    successRate: number;
  }>;
  upcomingRenewals: Array<{
    contractId: string;
    contractTitle: string;
    clientName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
    hasActiveRule: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    contractId: string;
    action: string;
    performedBy: string;
    performedAt: Date;
  }>;
}

class ContractRenewalService {
  async createRenewalRule(
    tenantId: string,
    createdBy: string,
    data: CreateRenewalRuleData
  ): Promise<RenewalRule> {
    // Validate trigger configuration
    if (data.trigger === RenewalTrigger.DAYS_BEFORE_EXPIRY && !data.triggerDays) {
      throw new ValidationError('Trigger days must be specified for DAYS_BEFORE_EXPIRY trigger');
    }

    if (data.triggerDays && (data.triggerDays < 1 || data.triggerDays > 365)) {
      throw new ValidationError('Trigger days must be between 1 and 365');
    }

    // Validate renewal period
    if (data.renewalPeriod < 1 || data.renewalPeriod > 120) {
      throw new ValidationError('Renewal period must be between 1 and 120 months');
    }

    // Validate price adjustment
    if (data.priceAdjustment) {
      if (data.priceAdjustment.type === 'PERCENTAGE' && 
          (data.priceAdjustment.value < -50 || data.priceAdjustment.value > 100)) {
        throw new ValidationError('Percentage adjustment must be between -50% and 100%');
      }
    }

    const rule: RenewalRule = {
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

  async getRenewalRules(tenantId: string): Promise<RenewalRule[]> {
    // Mock implementation
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
          value: 5, // 5% increase
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

  async updateRenewalRule(
    tenantId: string,
    ruleId: string,
    updates: Partial<CreateRenewalRuleData>
  ): Promise<RenewalRule> {
    const rules = await this.getRenewalRules(tenantId);
    const rule = rules.find(r => r.id === ruleId);

    if (!rule) {
      throw new NotFoundError('Renewal rule not found');
    }

    // Validate updates similar to create
    if (updates.triggerDays && (updates.triggerDays < 1 || updates.triggerDays > 365)) {
      throw new ValidationError('Trigger days must be between 1 and 365');
    }

    const updatedRule: RenewalRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };

    return updatedRule;
  }

  async deleteRenewalRule(tenantId: string, ruleId: string): Promise<{ success: boolean }> {
    const rules = await this.getRenewalRules(tenantId);
    const rule = rules.find(r => r.id === ruleId);

    if (!rule) {
      throw new NotFoundError('Renewal rule not found');
    }

    // Check if rule has pending proposals
    const proposals = await this.getRenewalProposals(tenantId, { 
      page: 1, 
      limit: 1, 
      ruleId, 
      status: RenewalStatus.PENDING,
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    });

    if (proposals.proposals.length > 0) {
      throw new ValidationError('Cannot delete rule with pending renewal proposals');
    }

    return { success: true };
  }

  async createRenewalProposal(
    tenantId: string,
    contractId: string,
    createdBy: string,
    ruleId?: string
  ): Promise<RenewalProposal> {
    // Get contract details
    const contract = await contractLifecycleService.getContractById(tenantId, contractId);

    if (!contract.endDate) {
      throw new ValidationError('Contract must have an end date to create renewal proposal');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ValidationError('Only active contracts can be renewed');
    }

    // Check if there's already a pending renewal for this contract
    const existingProposals = await this.getRenewalProposals(tenantId, {
      page: 1,
      limit: 1,
      contractId,
      status: RenewalStatus.PENDING,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    if (existingProposals.proposals.length > 0) {
      throw new ValidationError('Contract already has a pending renewal proposal');
    }

    // Get applicable rule if not specified
    let applicableRule: RenewalRule | undefined;
    if (ruleId) {
      const rules = await this.getRenewalRules(tenantId);
      applicableRule = rules.find(r => r.id === ruleId);
      if (!applicableRule) {
        throw new NotFoundError('Renewal rule not found');
      }
    } else {
      applicableRule = await this.findApplicableRule(tenantId, contract);
    }

    // Calculate renewal details
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
      } else if (adjustment.type === 'FIXED_AMOUNT') {
        proposedValue = contract.value + adjustment.value;
        priceAdjustment = {
          type: adjustment.type,
          value: adjustment.value,
          reason: `Fixed amount adjustment of ${adjustment.value} per renewal rule`,
        };
      }
    }

    const proposal: RenewalProposal = {
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
      status: applicableRule?.autoApprove ? RenewalStatus.AUTO_RENEWED : RenewalStatus.PENDING,
      renewalType: applicableRule?.renewalType || RenewalType.EXTEND_CURRENT,
      metadata: {
        ruleApplied: applicableRule?.name,
        autoGenerated: !ruleId,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    // Auto-approve if rule allows it
    if (applicableRule?.autoApprove) {
      proposal.approvedBy = 'system';
      proposal.approvedAt = new Date();
      proposal.processedAt = new Date();
    }

    // Send notifications if configured
    if (applicableRule?.notificationSettings.enabled) {
      await this.sendRenewalNotifications(proposal, applicableRule, 'PROPOSAL_CREATED');
    }

    return proposal;
  }

  async getRenewalProposals(
    tenantId: string,
    query: RenewalQuery
  ): Promise<{
    proposals: RenewalProposal[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    // Mock implementation
    const mockProposals: RenewalProposal[] = [
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
        proposedValue: 314, // 5% increase
        priceAdjustment: {
          type: 'PERCENTAGE',
          value: 5,
          reason: 'Automatic 5% adjustment per renewal rule',
        },
        status: RenewalStatus.AUTO_RENEWED,
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
        status: RenewalStatus.PENDING,
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

    // Apply filters
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

    // Apply pagination
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

  async processRenewalProposal(
    tenantId: string,
    proposalId: string,
    processedBy: string,
    data: ProcessRenewalData
  ): Promise<RenewalProposal> {
    const proposals = await this.getRenewalProposals(tenantId, {
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const proposal = proposals.proposals.find(p => p.id === proposalId);

    if (!proposal) {
      throw new NotFoundError('Renewal proposal not found');
    }

    if (proposal.status !== RenewalStatus.PENDING) {
      throw new ValidationError('Only pending proposals can be processed');
    }

    const updatedProposal: RenewalProposal = {
      ...proposal,
      status: data.action === 'APPROVE' ? RenewalStatus.APPROVED : RenewalStatus.DECLINED,
      notes: data.notes || proposal.notes,
      processedAt: new Date(),
      updatedAt: new Date(),
    };

    if (data.action === 'APPROVE') {
      updatedProposal.approvedBy = processedBy;
      updatedProposal.approvedAt = new Date();

      // Apply modifications if requested
      if (data.modifyTerms) {
        if (data.newValue) updatedProposal.proposedValue = data.newValue;
        if (data.newEndDate) updatedProposal.proposedEndDate = data.newEndDate;
      }

      // Execute the renewal (create new contract or extend current)
      await this.executeRenewal(tenantId, updatedProposal, processedBy);
    } else {
      updatedProposal.declinedBy = processedBy;
      updatedProposal.declinedAt = new Date();
      updatedProposal.declineReason = data.declineReason;
    }

    return updatedProposal;
  }

  async checkAndCreateRenewals(tenantId: string): Promise<{
    created: number;
    processed: number;
    notifications: number;
  }> {
    const rules = await this.getRenewalRules(tenantId);
    const activeRules = rules.filter(r => r.isActive);

    let created = 0;
    let processed = 0;
    let notifications = 0;

    for (const rule of activeRules) {
      if (rule.trigger === RenewalTrigger.DAYS_BEFORE_EXPIRY && rule.triggerDays) {
        // Find contracts that match this rule's criteria and timing
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + rule.triggerDays);

        // Get contracts expiring around the target date
        const expiringContracts = await contractLifecycleService.getExpiringContracts(
          tenantId,
          rule.triggerDays + 5 // Small buffer
        );

        for (const contract of expiringContracts) {
          if (contract.endDate && this.isContractEligibleForRule(contract, rule)) {
            const daysDiff = Math.ceil(
              (contract.endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
            );

            // Check if this contract should trigger renewal today
            if (daysDiff <= rule.triggerDays && daysDiff >= rule.triggerDays - 1) {
              try {
                // Check if proposal already exists
                const existingProposals = await this.getRenewalProposals(tenantId, {
                  page: 1,
                  limit: 1,
                  contractId: contract.id,
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                });

                if (existingProposals.proposals.length === 0) {
                  const proposal = await this.createRenewalProposal(
                    tenantId,
                    contract.id,
                    'system',
                    rule.id
                  );
                  created++;

                  if (proposal.status === RenewalStatus.AUTO_RENEWED) {
                    processed++;
                  }

                  if (rule.notificationSettings.enabled) {
                    notifications++;
                  }
                }
              } catch (error) {
                console.error(`Failed to create renewal for contract ${contract.id}:`, error);
              }
            }
          }
        }
      }
    }

    return { created, processed, notifications };
  }

  async getRenewalStats(tenantId: string): Promise<RenewalStats> {
    const proposals = await this.getRenewalProposals(tenantId, {
      page: 1,
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const totalProposals = proposals.proposals.length;
    const pendingApproval = proposals.proposals.filter(p => p.status === RenewalStatus.PENDING).length;
    const autoApproved = proposals.proposals.filter(p => p.status === RenewalStatus.AUTO_RENEWED).length;
    const declined = proposals.proposals.filter(p => p.status === RenewalStatus.DECLINED).length;
    const processed = proposals.proposals.filter(p => p.processedAt).length;

    const successRate = totalProposals > 0 ? 
      ((autoApproved + proposals.proposals.filter(p => p.status === RenewalStatus.APPROVED).length) / totalProposals) * 100 : 0;

    // Get upcoming renewals (next 60 days)
    const upcomingContracts = await contractLifecycleService.getExpiringContracts(tenantId, 60);
    const rules = await this.getRenewalRules(tenantId);

    const upcomingRenewals = upcomingContracts.map(contract => {
      const daysUntilExpiry = contract.endDate ? 
        Math.ceil((contract.endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
      
      const hasActiveRule = rules.some(rule => 
        rule.isActive && this.isContractEligibleForRule(contract, rule)
      );

      return {
        contractId: contract.id,
        contractTitle: contract.title,
        clientName: contract.parties.find(p => p.role === 'CLIENT')?.name || 'Unknown',
        expiryDate: contract.endDate!,
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
        { status: RenewalStatus.PENDING, count: pendingApproval, percentage: (pendingApproval / totalProposals) * 100 },
        { status: RenewalStatus.AUTO_RENEWED, count: autoApproved, percentage: (autoApproved / totalProposals) * 100 },
        { status: RenewalStatus.APPROVED, count: proposals.proposals.filter(p => p.status === RenewalStatus.APPROVED).length, percentage: 0 },
        { status: RenewalStatus.DECLINED, count: declined, percentage: (declined / totalProposals) * 100 },
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

  private async findApplicableRule(tenantId: string, contract: any): Promise<RenewalRule | undefined> {
    const rules = await this.getRenewalRules(tenantId);
    
    return rules.find(rule => 
      rule.isActive && this.isContractEligibleForRule(contract, rule)
    );
  }

  private isContractEligibleForRule(contract: any, rule: RenewalRule): boolean {
    // Check contract type
    if (!rule.contractTypes.includes(contract.type)) {
      return false;
    }

    // Check conditions
    if (rule.conditions) {
      const conditions = rule.conditions;

      // Check value constraints
      if (contract.value) {
        if (conditions.minContractValue && contract.value < conditions.minContractValue) {
          return false;
        }
        if (conditions.maxContractValue && contract.value > conditions.maxContractValue) {
          return false;
        }
      }

      // Check excluded clients
      const clientId = contract.parties?.find((p: any) => p.role === 'CLIENT')?.clientId;
      if (clientId && conditions.excludeClientIds?.includes(clientId)) {
        return false;
      }
    }

    return true;
  }

  private async executeRenewal(
    tenantId: string,
    proposal: RenewalProposal,
    executedBy: string
  ): Promise<void> {
    // Get original contract
    const originalContract = await contractLifecycleService.getContractById(tenantId, proposal.contractId);

    if (proposal.renewalType === RenewalType.EXTEND_CURRENT) {
      // Extend the current contract
      await contractLifecycleService.updateContract(tenantId, proposal.contractId, {
        endDate: proposal.proposedEndDate,
        value: proposal.proposedValue,
      });
    } else if (proposal.renewalType === RenewalType.NEW_CONTRACT) {
      // Create a new contract
      await contractLifecycleService.createContract(tenantId, executedBy, {
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

      // Mark original contract as expired
      await contractLifecycleService.terminateContract(
        tenantId,
        proposal.contractId,
        executedBy,
        'Contract renewed with new contract'
      );
    }
  }

  private async sendRenewalNotifications(
    proposal: RenewalProposal,
    rule: RenewalRule,
    eventType: string
  ): Promise<void> {
    // In a real implementation, this would send actual notifications
    console.log(`Sending renewal notification: ${eventType}`, {
      proposalId: proposal.id,
      contractId: proposal.contractId,
      recipients: rule.notificationSettings.recipients,
      types: rule.notificationSettings.types,
    });
  }

  private generateId(): string {
    return `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const contractRenewalService = new ContractRenewalService();
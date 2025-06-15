import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED'
}

export enum ContractType {
  MEMBERSHIP = 'MEMBERSHIP',
  SERVICE = 'SERVICE',
  EVENT_SPACE = 'EVENT_SPACE',
  MEETING_ROOM = 'MEETING_ROOM',
  CUSTOM = 'CUSTOM'
}

export enum RenewalStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  AUTO_RENEWED = 'AUTO_RENEWED'
}

interface ContractParty {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'COMPANY';
  signedAt?: Date;
  userId?: string;
  clientId?: string;
}

interface ContractTerm {
  id: string;
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
}

interface CreateContractData {
  templateId?: string;
  quotationId?: string;
  opportunityId?: string;
  type: ContractType;
  title: string;
  content: string;
  parties: ContractParty[];
  terms: ContractTerm[];
  startDate: Date;
  endDate?: Date;
  autoRenewal: boolean;
  renewalPeriod?: number; // months
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

interface UpdateContractData {
  title?: string;
  content?: string;
  parties?: ContractParty[];
  terms?: ContractTerm[];
  startDate?: Date;
  endDate?: Date;
  autoRenewal?: boolean;
  renewalPeriod?: number;
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

interface ContractQuery {
  page: number;
  limit: number;
  status?: ContractStatus;
  type?: ContractType;
  clientId?: string;
  templateId?: string;
  dateFrom?: string;
  dateTo?: string;
  expiringDays?: number; // contracts expiring in X days
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Contract {
  id: string;
  tenantId: string;
  templateId?: string;
  quotationId?: string;
  opportunityId?: string;
  type: ContractType;
  title: string;
  content: string;
  status: ContractStatus;
  parties: ContractParty[];
  terms: ContractTerm[];
  startDate: Date;
  endDate?: Date;
  autoRenewal: boolean;
  renewalPeriod?: number;
  renewalStatus: RenewalStatus;
  value?: number;
  currency?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  terminatedAt?: Date;
  createdBy: string;
  signatureWorkflowId?: string;
}

interface ContractActivity {
  id: string;
  contractId: string;
  type: string;
  description: string;
  performedBy: string;
  performedAt: Date;
  metadata: Record<string, any>;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingSignature: number;
  expiringThisMonth: number;
  byStatus: Array<{
    status: ContractStatus;
    count: number;
    percentage: number;
  }>;
  byType: Array<{
    type: ContractType;
    count: number;
    value: number;
  }>;
  recentActivity: ContractActivity[];
  totalValue: number;
  monthlyValue: number;
}

class ContractLifecycleService {
  async createContract(
    tenantId: string, 
    createdBy: string, 
    data: CreateContractData
  ): Promise<Contract> {
    // Validate parties
    this.validateContractParties(data.parties);

    // Validate dates
    if (data.endDate && data.startDate >= data.endDate) {
      throw new ValidationError('End date must be after start date');
    }

    const contract: Contract = {
      id: this.generateId(),
      tenantId,
      templateId: data.templateId,
      quotationId: data.quotationId,
      opportunityId: data.opportunityId,
      type: data.type,
      title: data.title,
      content: data.content,
      status: ContractStatus.DRAFT,
      parties: data.parties,
      terms: data.terms,
      startDate: data.startDate,
      endDate: data.endDate,
      autoRenewal: data.autoRenewal,
      renewalPeriod: data.renewalPeriod,
      renewalStatus: RenewalStatus.NONE,
      value: data.value,
      currency: data.currency || 'USD',
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    // Create activity log
    await this.createActivity(contract.id, 'CONTRACT_CREATED', `Contract "${data.title}" created`, createdBy, {
      type: data.type,
      parties: data.parties.length,
      value: data.value,
    });

    return contract;
  }

  async getContracts(
    tenantId: string, 
    query: ContractQuery
  ): Promise<{
    contracts: Contract[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    // Mock implementation - in reality this would query the database
    const mockContracts: Contract[] = [
      {
        id: 'contract-1',
        tenantId,
        templateId: 'template-1',
        type: ContractType.MEMBERSHIP,
        title: 'Hot Desk Membership - John Doe',
        content: 'Standard membership contract content...',
        status: ContractStatus.ACTIVE,
        parties: [
          {
            id: 'party-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'CLIENT',
            signedAt: new Date('2024-01-15'),
            clientId: 'client-1',
          },
          {
            id: 'party-2',
            name: 'SweetSpot Coworking',
            email: 'admin@sweetspot.com',
            role: 'COMPANY',
            signedAt: new Date('2024-01-15'),
            userId: 'user-admin',
          },
        ],
        terms: [
          {
            id: 'term-1',
            title: 'Access Hours',
            content: 'Member has access Monday-Friday 9AM-6PM',
            order: 1,
            isRequired: true,
          },
          {
            id: 'term-2',
            title: 'Payment Terms',
            content: 'Monthly payment due on the 1st of each month',
            order: 2,
            isRequired: true,
          },
        ],
        startDate: new Date('2024-01-15'),
        endDate: new Date('2025-01-15'),
        autoRenewal: true,
        renewalPeriod: 12,
        renewalStatus: RenewalStatus.NONE,
        value: 299,
        currency: 'USD',
        metadata: { plan: 'hot-desk', duration: '12-months' },
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        activatedAt: new Date('2024-01-15'),
        createdBy: 'user-admin',
        signatureWorkflowId: 'workflow-1',
      },
      {
        id: 'contract-2',
        tenantId,
        type: ContractType.EVENT_SPACE,
        title: 'Conference Room Rental - ABC Corp',
        content: 'Event space rental agreement...',
        status: ContractStatus.PENDING_SIGNATURE,
        parties: [
          {
            id: 'party-3',
            name: 'ABC Corp',
            email: 'contact@abccorp.com',
            role: 'CLIENT',
            clientId: 'client-2',
          },
          {
            id: 'party-4',
            name: 'SweetSpot Coworking',
            email: 'admin@sweetspot.com',
            role: 'COMPANY',
            signedAt: new Date(),
            userId: 'user-admin',
          },
        ],
        terms: [
          {
            id: 'term-3',
            title: 'Event Date',
            content: 'Event scheduled for March 15, 2024, 2PM-6PM',
            order: 1,
            isRequired: true,
          },
          {
            id: 'term-4',
            title: 'Cancellation Policy',
            content: 'Cancellation allowed up to 48 hours before event',
            order: 2,
            isRequired: true,
          },
        ],
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-15'),
        autoRenewal: false,
        renewalStatus: RenewalStatus.NONE,
        value: 500,
        currency: 'USD',
        metadata: { eventType: 'conference', capacity: 50 },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-admin',
        signatureWorkflowId: 'workflow-2',
      },
    ];

    // Apply filters
    let filteredContracts = mockContracts;

    if (query.status) {
      filteredContracts = filteredContracts.filter(c => c.status === query.status);
    }

    if (query.type) {
      filteredContracts = filteredContracts.filter(c => c.type === query.type);
    }

    if (query.clientId) {
      filteredContracts = filteredContracts.filter(c => 
        c.parties.some(p => p.clientId === query.clientId)
      );
    }

    if (query.expiringDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + query.expiringDays);
      
      filteredContracts = filteredContracts.filter(c => 
        c.endDate && c.endDate <= futureDate && c.endDate > new Date()
      );
    }

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    const paginatedContracts = filteredContracts.slice(offset, offset + query.limit);

    return {
      contracts: paginatedContracts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredContracts.length,
        pages: Math.ceil(filteredContracts.length / query.limit),
      },
    };
  }

  async getContractById(tenantId: string, contractId: string): Promise<Contract> {
    const contracts = await this.getContracts(tenantId, { 
      page: 1, 
      limit: 100, 
      sortBy: 'createdAt', 
      sortOrder: 'desc' 
    });
    
    const contract = contracts.contracts.find(c => c.id === contractId);

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    return contract;
  }

  async updateContract(
    tenantId: string, 
    contractId: string, 
    data: UpdateContractData
  ): Promise<Contract> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status === ContractStatus.TERMINATED || contract.status === ContractStatus.CANCELLED) {
      throw new ValidationError('Cannot update terminated or cancelled contract');
    }

    if (data.parties) {
      this.validateContractParties(data.parties);
    }

    if (data.endDate && data.startDate && data.startDate >= data.endDate) {
      throw new ValidationError('End date must be after start date');
    }

    const updatedContract: Contract = {
      ...contract,
      ...data,
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'CONTRACT_UPDATED', 'Contract updated', '', {
      updatedFields: Object.keys(data),
    });

    return updatedContract;
  }

  async activateContract(
    tenantId: string, 
    contractId: string, 
    activatedBy: string
  ): Promise<Contract> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new ValidationError('Only contracts pending signature can be activated');
    }

    // Check if all required parties have signed
    const unsignedParties = contract.parties.filter(p => !p.signedAt);
    if (unsignedParties.length > 0) {
      throw new ValidationError('All parties must sign before contract can be activated');
    }

    const updatedContract: Contract = {
      ...contract,
      status: ContractStatus.ACTIVE,
      activatedAt: new Date(),
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'CONTRACT_ACTIVATED', 'Contract activated and is now in effect', activatedBy, {
      activatedAt: updatedContract.activatedAt,
    });

    return updatedContract;
  }

  async suspendContract(
    tenantId: string, 
    contractId: string, 
    suspendedBy: string,
    reason?: string
  ): Promise<Contract> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ValidationError('Only active contracts can be suspended');
    }

    const updatedContract: Contract = {
      ...contract,
      status: ContractStatus.SUSPENDED,
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'CONTRACT_SUSPENDED', `Contract suspended. Reason: ${reason || 'No reason provided'}`, suspendedBy, {
      reason,
      suspendedAt: new Date(),
    });

    return updatedContract;
  }

  async reactivateContract(
    tenantId: string, 
    contractId: string, 
    reactivatedBy: string
  ): Promise<Contract> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status !== ContractStatus.SUSPENDED) {
      throw new ValidationError('Only suspended contracts can be reactivated');
    }

    const updatedContract: Contract = {
      ...contract,
      status: ContractStatus.ACTIVE,
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'CONTRACT_REACTIVATED', 'Contract reactivated', reactivatedBy, {
      reactivatedAt: new Date(),
    });

    return updatedContract;
  }

  async terminateContract(
    tenantId: string, 
    contractId: string, 
    terminatedBy: string,
    reason?: string,
    terminationDate?: Date
  ): Promise<Contract> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status === ContractStatus.TERMINATED || contract.status === ContractStatus.CANCELLED) {
      throw new ValidationError('Contract is already terminated or cancelled');
    }

    const updatedContract: Contract = {
      ...contract,
      status: ContractStatus.TERMINATED,
      terminatedAt: terminationDate || new Date(),
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'CONTRACT_TERMINATED', `Contract terminated. Reason: ${reason || 'No reason provided'}`, terminatedBy, {
      reason,
      terminatedAt: updatedContract.terminatedAt,
    });

    return updatedContract;
  }

  async cancelContract(
    tenantId: string, 
    contractId: string, 
    cancelledBy: string,
    reason?: string
  ): Promise<Contract> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status === ContractStatus.ACTIVE) {
      throw new ValidationError('Active contracts must be terminated, not cancelled');
    }

    const updatedContract: Contract = {
      ...contract,
      status: ContractStatus.CANCELLED,
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'CONTRACT_CANCELLED', `Contract cancelled. Reason: ${reason || 'No reason provided'}`, cancelledBy, {
      reason,
      cancelledAt: new Date(),
    });

    return updatedContract;
  }

  async getContractActivity(tenantId: string, contractId: string): Promise<ContractActivity[]> {
    // Mock implementation
    return [
      {
        id: 'activity-1',
        contractId,
        type: 'CONTRACT_CREATED',
        description: 'Contract created',
        performedBy: 'user-admin',
        performedAt: new Date('2024-01-10'),
        metadata: { type: 'MEMBERSHIP', value: 299 },
      },
      {
        id: 'activity-2',
        contractId,
        type: 'CONTRACT_ACTIVATED',
        description: 'Contract activated and is now in effect',
        performedBy: 'user-admin',
        performedAt: new Date('2024-01-15'),
        metadata: { activatedAt: new Date('2024-01-15') },
      },
    ];
  }

  async getContractStats(tenantId: string): Promise<ContractStats> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Mock implementation
    const mockStats: ContractStats = {
      totalContracts: 45,
      activeContracts: 32,
      pendingSignature: 8,
      expiringThisMonth: 5,
      byStatus: [
        { status: ContractStatus.ACTIVE, count: 32, percentage: 71.1 },
        { status: ContractStatus.PENDING_SIGNATURE, count: 8, percentage: 17.8 },
        { status: ContractStatus.DRAFT, count: 3, percentage: 6.7 },
        { status: ContractStatus.EXPIRED, count: 2, percentage: 4.4 },
      ],
      byType: [
        { type: ContractType.MEMBERSHIP, count: 28, value: 8372 },
        { type: ContractType.EVENT_SPACE, count: 12, value: 6000 },
        { type: ContractType.MEETING_ROOM, count: 3, value: 450 },
        { type: ContractType.SERVICE, count: 2, value: 800 },
      ],
      recentActivity: [
        {
          id: 'activity-recent-1',
          contractId: 'contract-1',
          type: 'CONTRACT_ACTIVATED',
          description: 'Membership contract activated for John Doe',
          performedBy: 'user-admin',
          performedAt: new Date(),
          metadata: {},
        },
        {
          id: 'activity-recent-2',
          contractId: 'contract-2',
          type: 'CONTRACT_CREATED',
          description: 'Event space contract created for ABC Corp',
          performedBy: 'user-manager',
          performedAt: new Date(),
          metadata: {},
        },
      ],
      totalValue: 15622,
      monthlyValue: 8372,
    };

    return mockStats;
  }

  async getExpiringContracts(
    tenantId: string, 
    days: number = 30
  ): Promise<Contract[]> {
    const query: ContractQuery = {
      page: 1,
      limit: 100,
      expiringDays: days,
      sortBy: 'endDate',
      sortOrder: 'asc',
    };

    const result = await this.getContracts(tenantId, query);
    return result.contracts;
  }

  async sendContractForSignature(
    tenantId: string, 
    contractId: string, 
    sentBy: string
  ): Promise<{ success: boolean; workflowId: string }> {
    const contract = await this.getContractById(tenantId, contractId);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new ValidationError('Only draft contracts can be sent for signature');
    }

    // In a real implementation, this would create a signature workflow
    const workflowId = `workflow_${Date.now()}`;

    // Update contract status
    const updatedContract: Contract = {
      ...contract,
      status: ContractStatus.PENDING_SIGNATURE,
      signatureWorkflowId: workflowId,
      updatedAt: new Date(),
    };

    // Create activity log
    await this.createActivity(contractId, 'SIGNATURE_REQUESTED', 'Contract sent for signature', sentBy, {
      workflowId,
      parties: contract.parties.map(p => ({ name: p.name, email: p.email })),
    });

    return {
      success: true,
      workflowId,
    };
  }

  private validateContractParties(parties: ContractParty[]): void {
    if (parties.length < 2) {
      throw new ValidationError('Contract must have at least 2 parties');
    }

    const emails = parties.map(p => p.email.toLowerCase());
    if (new Set(emails).size !== emails.length) {
      throw new ValidationError('Party emails must be unique');
    }

    const hasClient = parties.some(p => p.role === 'CLIENT');
    const hasCompany = parties.some(p => p.role === 'COMPANY');

    if (!hasClient || !hasCompany) {
      throw new ValidationError('Contract must have at least one CLIENT and one COMPANY party');
    }
  }

  private async createActivity(
    contractId: string, 
    type: string, 
    description: string, 
    performedBy: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const activity: ContractActivity = {
      id: this.generateId(),
      contractId,
      type,
      description,
      performedBy,
      performedAt: new Date(),
      metadata,
    };

    // In a real implementation, this would be stored in database
    console.log('Contract activity created:', activity);
  }

  private generateId(): string {
    return `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const contractLifecycleService = new ContractLifecycleService();
import { prisma } from '../lib/prisma';
import {
  RequestPriority,
  RequestStatus,
  ServiceRequest,
  Prisma
} from '@prisma/client';
import { logger } from '../utils/logger';
import { serviceCatalogService } from './serviceCatalogService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface ServiceRequestItem {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedBy: string;
  quantity: number;
  totalAmount: number;
  priority: RequestPriority;
  status: RequestStatus;
  requestedDeliveryTime?: Date;
  scheduledDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  customizations: Record<string, any>;
  attachments: string[];
  requiresApproval: boolean;
  approvedBy?: string;
  approverName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  assignedTo?: string;
  assigneeName?: string;
  progressNotes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryTime?: string;
  statusHistory: Array<{
    status: RequestStatus;
    changedBy: string;
    changedByName: string;
    reason?: string;
    notes?: string;
    timestamp: Date;
  }>;
}

export interface CreateServiceRequestData {
  serviceId: string;
  userId: string;
  quantity?: number;
  priority?: RequestPriority;
  requestedDeliveryTime?: Date;
  notes?: string;
  customizations?: Record<string, any>;
  attachments?: string[];
}

export interface UpdateServiceRequestData {
  quantity?: number;
  priority?: RequestPriority;
  requestedDeliveryTime?: Date;
  scheduledDeliveryTime?: Date;
  notes?: string;
  customizations?: Record<string, any>;
  attachments?: string[];
  progressNotes?: string;
}

export interface ProcessApprovalData {
  approve: boolean;
  reason?: string;
  notes?: string;
  scheduledDeliveryTime?: Date;
}

export interface AssignRequestData {
  assignedTo: string;
  notes?: string;
}

export interface UpdateProgressData {
  progressNotes: string;
  attachments?: string[];
}

export interface CompleteRequestData {
  actualDeliveryTime?: Date;
  notes?: string;
  attachments?: string[];
}

export interface ServiceRequestFilters {
  status?: RequestStatus[];
  priority?: RequestPriority[];
  serviceId?: string;
  userId?: string;
  assignedTo?: string;
  approvedBy?: string;
  requiresApproval?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface ServiceRequestStats {
  total: number;
  byStatus: Array<{
    status: RequestStatus;
    count: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: RequestPriority;
    count: number;
    percentage: number;
  }>;
  averageProcessingTime: number; // in hours
  completionRate: number;
  pendingApprovals: number;
  overdueRequests: number;
}

// ============================================================================
// SERVICE REQUEST SERVICE
// ============================================================================

export class ServiceRequestService {

  // ============================================================================
  // REQUEST CRUD OPERATIONS
  // ============================================================================

  async createServiceRequest(
    tenantId: string,
    data: CreateServiceRequestData
  ): Promise<ServiceRequestItem> {
    try {
      // Get service details for pricing and approval requirements
      const service = await serviceCatalogService.getServiceById(tenantId, data.serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      if (!service.isActive) {
        throw new Error('Service is not available');
      }

      // Validate quantity limits
      const quantity = data.quantity || 1;
      if (service.maxQuantity && quantity > service.maxQuantity) {
        throw new Error(`Maximum quantity allowed: ${service.maxQuantity}`);
      }

      if (quantity < service.minimumOrder) {
        throw new Error(`Minimum order quantity: ${service.minimumOrder}`);
      }

      // Calculate total amount based on pricing tiers
      const totalAmount = this.calculateTotalAmount(service, quantity);

      // Determine if approval is required
      const requiresApproval = service.requiresApproval;
      const initialStatus = requiresApproval ? RequestStatus.PENDING : RequestStatus.APPROVED;

      const serviceRequest = await prisma.$transaction(async (tx) => {
        // Create the service request
        const request = await tx.serviceRequest.create({
          data: {
            tenantId,
            serviceId: data.serviceId,
            userId: data.userId,
            requestedBy: data.userId,
            quantity,
            totalAmount: new Prisma.Decimal(totalAmount),
            priority: data.priority || RequestPriority.NORMAL,
            status: initialStatus,
            requestedDeliveryTime: data.requestedDeliveryTime,
            notes: data.notes,
            customizations: data.customizations || {},
            attachments: data.attachments || [],
            requiresApproval,
          },
          include: {
            service: true,
            user: true,
            approver: true,
            assignee: true,
            statusHistory: {
              include: {
                user: true,
              },
              orderBy: { timestamp: 'desc' },
            },
          },
        });

        // Create initial status history entry
        await tx.serviceRequestStatusHistory.create({
          data: {
            serviceRequestId: request.id,
            status: initialStatus,
            changedBy: data.userId,
            reason: 'Service request created',
          },
        });

        return request;
      });

      return this.mapRequestToItem(serviceRequest);
    } catch (error) {
      logger.error('Failed to create service request', { tenantId, data }, error as Error);
      throw error;
    }
  }

  async updateServiceRequest(
    tenantId: string,
    requestId: string,
    userId: string,
    data: UpdateServiceRequestData
  ): Promise<ServiceRequestItem> {
    try {
      // Verify the request exists and user can modify it
      const existingRequest = await prisma.serviceRequest.findFirst({
        where: {
          id: requestId,
          tenantId,
          userId, // Only the requester can update
          status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] }, // Only modifiable statuses
        },
        include: { service: true },
      });

      if (!existingRequest) {
        throw new Error('Service request not found or cannot be modified');
      }

      // Recalculate total if quantity changed
      let totalAmount = Number(existingRequest.totalAmount);
      if (data.quantity && data.quantity !== existingRequest.quantity) {
        const service = await serviceCatalogService.getServiceById(tenantId, existingRequest.serviceId);
        if (service) {
          totalAmount = this.calculateTotalAmount(service, data.quantity);
        }
      }

      const updateData: any = {};
      if (data.quantity !== undefined) {
        updateData.quantity = data.quantity;
        updateData.totalAmount = new Prisma.Decimal(totalAmount);
      }
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.requestedDeliveryTime !== undefined) updateData.requestedDeliveryTime = data.requestedDeliveryTime;
      if (data.scheduledDeliveryTime !== undefined) updateData.scheduledDeliveryTime = data.scheduledDeliveryTime;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.customizations !== undefined) updateData.customizations = data.customizations;
      if (data.attachments !== undefined) updateData.attachments = data.attachments;
      if (data.progressNotes !== undefined) updateData.progressNotes = data.progressNotes;

      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          service: true,
          user: true,
          approver: true,
          assignee: true,
          statusHistory: {
            include: {
              user: true,
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      return this.mapRequestToItem(updatedRequest);
    } catch (error) {
      logger.error('Failed to update service request', { tenantId, requestId, userId, data }, error as Error);
      throw error;
    }
  }

  async cancelServiceRequest(
    tenantId: string,
    requestId: string,
    userId: string,
    reason?: string
  ): Promise<ServiceRequestItem> {
    try {
      return await this.updateRequestStatus(
        tenantId,
        requestId,
        RequestStatus.CANCELLED,
        userId,
        reason || 'Cancelled by user'
      );
    } catch (error) {
      logger.error('Failed to cancel service request', { tenantId, requestId, userId }, error as Error);
      throw error;
    }
  }

  async getServiceRequestById(
    tenantId: string,
    requestId: string
  ): Promise<ServiceRequestItem | null> {
    try {
      const request = await prisma.serviceRequest.findFirst({
        where: {
          id: requestId,
          tenantId,
        },
        include: {
          service: true,
          user: true,
          approver: true,
          assignee: true,
          statusHistory: {
            include: {
              user: true,
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      return request ? this.mapRequestToItem(request) : null;
    } catch (error) {
      logger.error('Failed to get service request by ID', { tenantId, requestId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // REQUEST WORKFLOW MANAGEMENT
  // ============================================================================

  async processApproval(
    tenantId: string,
    requestId: string,
    approverId: string,
    data: ProcessApprovalData
  ): Promise<ServiceRequestItem> {
    try {
      const request = await prisma.serviceRequest.findFirst({
        where: {
          id: requestId,
          tenantId,
          status: RequestStatus.PENDING,
          requiresApproval: true,
        },
      });

      if (!request) {
        throw new Error('Service request not found or not pending approval');
      }

      const newStatus = data.approve ? RequestStatus.APPROVED : RequestStatus.REJECTED;
      const updateData: any = {
        status: newStatus,
        approvedBy: approverId,
        approvedAt: new Date(),
      };

      if (!data.approve && data.reason) {
        updateData.rejectionReason = data.reason;
      }

      if (data.scheduledDeliveryTime) {
        updateData.scheduledDeliveryTime = data.scheduledDeliveryTime;
      }

      const updatedRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.serviceRequest.update({
          where: { id: requestId },
          data: updateData,
          include: {
            service: true,
            user: true,
            approver: true,
            assignee: true,
            statusHistory: {
              include: {
                user: true,
              },
              orderBy: { timestamp: 'desc' },
            },
          },
        });

        // Add status history entry
        await tx.serviceRequestStatusHistory.create({
          data: {
            serviceRequestId: requestId,
            status: newStatus,
            changedBy: approverId,
            reason: data.reason,
            notes: data.notes,
          },
        });

        return updated;
      });

      return this.mapRequestToItem(updatedRequest);
    } catch (error) {
      logger.error('Failed to process approval', { tenantId, requestId, approverId, data }, error as Error);
      throw error;
    }
  }

  async assignServiceRequest(
    tenantId: string,
    requestId: string,
    assignerId: string,
    data: AssignRequestData
  ): Promise<ServiceRequestItem> {
    try {
      const updatedRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.serviceRequest.update({
          where: {
            id: requestId,
            tenantId,
            status: { in: [RequestStatus.APPROVED, RequestStatus.IN_PROGRESS] },
          },
          data: {
            assignedTo: data.assignedTo,
            status: RequestStatus.IN_PROGRESS,
            progressNotes: data.notes,
          },
          include: {
            service: true,
            user: true,
            approver: true,
            assignee: true,
            statusHistory: {
              include: {
                user: true,
              },
              orderBy: { timestamp: 'desc' },
            },
          },
        });

        // Add status history entry
        await tx.serviceRequestStatusHistory.create({
          data: {
            serviceRequestId: requestId,
            status: RequestStatus.IN_PROGRESS,
            changedBy: assignerId,
            reason: 'Request assigned',
            notes: data.notes,
          },
        });

        return updated;
      });

      return this.mapRequestToItem(updatedRequest);
    } catch (error) {
      logger.error('Failed to assign service request', { tenantId, requestId, assignerId, data }, error as Error);
      throw error;
    }
  }

  async updateProgress(
    tenantId: string,
    requestId: string,
    userId: string,
    data: UpdateProgressData
  ): Promise<ServiceRequestItem> {
    try {
      const updatedRequest = await prisma.serviceRequest.update({
        where: {
          id: requestId,
          tenantId,
          assignedTo: userId, // Only assigned user can update progress
          status: RequestStatus.IN_PROGRESS,
        },
        data: {
          progressNotes: data.progressNotes,
          ...(data.attachments && { attachments: data.attachments }),
        },
        include: {
          service: true,
          user: true,
          approver: true,
          assignee: true,
          statusHistory: {
            include: {
              user: true,
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      return this.mapRequestToItem(updatedRequest);
    } catch (error) {
      logger.error('Failed to update progress', { tenantId, requestId, userId, data }, error as Error);
      throw error;
    }
  }

  async completeServiceRequest(
    tenantId: string,
    requestId: string,
    userId: string,
    data: CompleteRequestData
  ): Promise<ServiceRequestItem> {
    try {
      return await this.updateRequestStatus(
        tenantId,
        requestId,
        RequestStatus.COMPLETED,
        userId,
        'Service request completed',
        {
          completedAt: new Date(),
          actualDeliveryTime: data.actualDeliveryTime || new Date(),
          progressNotes: data.notes,
          ...(data.attachments && { attachments: data.attachments }),
        }
      );
    } catch (error) {
      logger.error('Failed to complete service request', { tenantId, requestId, userId, data }, error as Error);
      throw error;
    }
  }

  async putOnHold(
    tenantId: string,
    requestId: string,
    userId: string,
    reason: string
  ): Promise<ServiceRequestItem> {
    try {
      return await this.updateRequestStatus(
        tenantId,
        requestId,
        RequestStatus.ON_HOLD,
        userId,
        reason
      );
    } catch (error) {
      logger.error('Failed to put service request on hold', { tenantId, requestId, userId, reason }, error as Error);
      throw error;
    }
  }

  async resumeFromHold(
    tenantId: string,
    requestId: string,
    userId: string,
    reason?: string
  ): Promise<ServiceRequestItem> {
    try {
      return await this.updateRequestStatus(
        tenantId,
        requestId,
        RequestStatus.IN_PROGRESS,
        userId,
        reason || 'Resumed from hold'
      );
    } catch (error) {
      logger.error('Failed to resume service request from hold', { tenantId, requestId, userId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // REQUEST QUERYING AND FILTERING
  // ============================================================================

  async getServiceRequests(
    tenantId: string,
    filters: ServiceRequestFilters = {},
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    requests: ServiceRequestItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const whereClause = this.buildRequestWhereClause(tenantId, filters);

      const [requests, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereClause,
          include: {
            service: true,
            user: true,
            approver: true,
            assignee: true,
            statusHistory: {
              include: {
                user: true,
              },
              orderBy: { timestamp: 'desc' },
            },
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          skip: pagination.skip || 0,
          take: pagination.take || 50,
        }),
        prisma.serviceRequest.count({ where: whereClause }),
      ]);

      const requestItems = requests.map(request => this.mapRequestToItem(request));
      const hasMore = (pagination.skip || 0) + requestItems.length < total;

      return {
        requests: requestItems,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Failed to get service requests', { tenantId, filters, pagination }, error as Error);
      throw error;
    }
  }

  async getMyServiceRequests(
    tenantId: string,
    userId: string,
    filters: Omit<ServiceRequestFilters, 'userId'> = {}
  ): Promise<ServiceRequestItem[]> {
    try {
      const result = await this.getServiceRequests(tenantId, { ...filters, userId });
      return result.requests;
    } catch (error) {
      logger.error('Failed to get user service requests', { tenantId, userId, filters }, error as Error);
      throw error;
    }
  }

  async getPendingApprovals(
    tenantId: string,
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    requests: ServiceRequestItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      return await this.getServiceRequests(
        tenantId,
        { status: [RequestStatus.PENDING] },
        pagination
      );
    } catch (error) {
      logger.error('Failed to get pending approvals', { tenantId }, error as Error);
      throw error;
    }
  }

  async getAssignedRequests(
    tenantId: string,
    userId: string,
    pagination: { skip?: number; take?: number } = {}
  ): Promise<{
    requests: ServiceRequestItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      return await this.getServiceRequests(
        tenantId,
        { assignedTo: userId, status: [RequestStatus.IN_PROGRESS, RequestStatus.ON_HOLD] },
        pagination
      );
    } catch (error) {
      logger.error('Failed to get assigned requests', { tenantId, userId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getServiceRequestStats(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceRequestStats> {
    try {
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      const requests = await prisma.serviceRequest.findMany({
        where: {
          tenantId,
          ...dateFilter,
        },
        include: {
          statusHistory: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      const total = requests.length;

      // Group by status
      const statusCounts = new Map<RequestStatus, number>();
      requests.forEach(request => {
        const current = statusCounts.get(request.status) || 0;
        statusCounts.set(request.status, current + 1);
      });

      const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));

      // Group by priority
      const priorityCounts = new Map<RequestPriority, number>();
      requests.forEach(request => {
        const current = priorityCounts.get(request.priority) || 0;
        priorityCounts.set(request.priority, current + 1);
      });

      const byPriority = Array.from(priorityCounts.entries()).map(([priority, count]) => ({
        priority,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));

      // Calculate average processing time
      const completedRequests = requests.filter(r => r.completedAt);
      const avgProcessingTime = completedRequests.length > 0
        ? completedRequests.reduce((sum, request) => {
            const processingTime = request.completedAt!.getTime() - request.createdAt.getTime();
            return sum + processingTime;
          }, 0) / completedRequests.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Calculate completion rate
      const completionRate = total > 0 
        ? (completedRequests.length / total) * 100 
        : 0;

      // Count pending approvals
      const pendingApprovals = requests.filter(r => r.status === RequestStatus.PENDING).length;

      // Count overdue requests (simplified - requests older than 24 hours without completion)
      const now = new Date();
      const overdueRequests = requests.filter(r => 
        !r.completedAt && 
        (now.getTime() - r.createdAt.getTime()) > (24 * 60 * 60 * 1000)
      ).length;

      return {
        total,
        byStatus,
        byPriority,
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        pendingApprovals,
        overdueRequests,
      };
    } catch (error) {
      logger.error('Failed to get service request stats', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async updateRequestStatus(
    tenantId: string,
    requestId: string,
    newStatus: RequestStatus,
    userId: string,
    reason: string,
    additionalData: any = {}
  ): Promise<ServiceRequestItem> {
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.update({
        where: {
          id: requestId,
          tenantId,
        },
        data: {
          status: newStatus,
          ...additionalData,
        },
        include: {
          service: true,
          user: true,
          approver: true,
          assignee: true,
          statusHistory: {
            include: {
              user: true,
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      // Add status history entry
      await tx.serviceRequestStatusHistory.create({
        data: {
          serviceRequestId: requestId,
          status: newStatus,
          changedBy: userId,
          reason,
        },
      });

      return updated;
    });

    return this.mapRequestToItem(updatedRequest);
  }

  private calculateTotalAmount(service: any, quantity: number): number {
    if (!service.dynamicPricing || !service.pricingTiers || service.pricingTiers.length === 0) {
      return service.price * quantity;
    }

    // Find applicable pricing tier
    const applicableTier = service.pricingTiers
      .filter((tier: any) => 
        quantity >= tier.minQuantity && 
        (!tier.maxQuantity || quantity <= tier.maxQuantity)
      )
      .sort((a: any, b: any) => b.minQuantity - a.minQuantity)[0];

    if (applicableTier) {
      return applicableTier.pricePerUnit * quantity;
    }

    return service.price * quantity;
  }

  private buildRequestWhereClause(tenantId: string, filters: ServiceRequestFilters): any {
    const whereClause: any = { tenantId };

    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      whereClause.priority = { in: filters.priority };
    }

    if (filters.serviceId) {
      whereClause.serviceId = filters.serviceId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.assignedTo) {
      whereClause.assignedTo = filters.assignedTo;
    }

    if (filters.approvedBy) {
      whereClause.approvedBy = filters.approvedBy;
    }

    if (filters.requiresApproval !== undefined) {
      whereClause.requiresApproval = filters.requiresApproval;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    if (filters.search) {
      whereClause.OR = [
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { service: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return whereClause;
  }

  private mapRequestToItem(request: any): ServiceRequestItem {
    return {
      id: request.id,
      serviceId: request.serviceId,
      serviceName: request.service.name,
      serviceCategory: request.service.category,
      userId: request.userId,
      userName: `${request.user.firstName} ${request.user.lastName}`,
      userEmail: request.user.email,
      requestedBy: request.requestedBy,
      quantity: request.quantity,
      totalAmount: Number(request.totalAmount),
      priority: request.priority,
      status: request.status,
      requestedDeliveryTime: request.requestedDeliveryTime,
      scheduledDeliveryTime: request.scheduledDeliveryTime,
      actualDeliveryTime: request.actualDeliveryTime,
      notes: request.notes,
      customizations: request.customizations || {},
      attachments: Array.isArray(request.attachments) ? request.attachments : [],
      requiresApproval: request.requiresApproval,
      approvedBy: request.approvedBy,
      approverName: request.approver ? `${request.approver.firstName} ${request.approver.lastName}` : undefined,
      approvedAt: request.approvedAt,
      rejectionReason: request.rejectionReason,
      assignedTo: request.assignedTo,
      assigneeName: request.assignee ? `${request.assignee.firstName} ${request.assignee.lastName}` : undefined,
      progressNotes: request.progressNotes,
      completedAt: request.completedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      estimatedDeliveryTime: request.service.estimatedDeliveryTime,
      statusHistory: request.statusHistory.map((history: any) => ({
        status: history.status,
        changedBy: history.changedBy,
        changedByName: `${history.user.firstName} ${history.user.lastName}`,
        reason: history.reason,
        notes: history.notes,
        timestamp: history.timestamp,
      })),
    };
  }
}

export const serviceRequestService = new ServiceRequestService();
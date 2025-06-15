"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRequestService = exports.ServiceRequestService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const serviceCatalogService_1 = require("./serviceCatalogService");
class ServiceRequestService {
    async createServiceRequest(tenantId, data) {
        try {
            const service = await serviceCatalogService_1.serviceCatalogService.getServiceById(tenantId, data.serviceId);
            if (!service) {
                throw new Error('Service not found');
            }
            if (!service.isActive) {
                throw new Error('Service is not available');
            }
            const quantity = data.quantity || 1;
            if (service.maxQuantity && quantity > service.maxQuantity) {
                throw new Error(`Maximum quantity allowed: ${service.maxQuantity}`);
            }
            if (quantity < service.minimumOrder) {
                throw new Error(`Minimum order quantity: ${service.minimumOrder}`);
            }
            const totalAmount = this.calculateTotalAmount(service, quantity);
            const requiresApproval = service.requiresApproval;
            const initialStatus = requiresApproval ? client_1.RequestStatus.PENDING : client_1.RequestStatus.APPROVED;
            const serviceRequest = await prisma_1.prisma.$transaction(async (tx) => {
                const request = await tx.serviceRequest.create({
                    data: {
                        tenantId,
                        serviceId: data.serviceId,
                        userId: data.userId,
                        requestedBy: data.userId,
                        quantity,
                        totalAmount: new client_1.Prisma.Decimal(totalAmount),
                        priority: data.priority || client_1.RequestPriority.NORMAL,
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
        }
        catch (error) {
            logger_1.logger.error('Failed to create service request', { tenantId, data }, error);
            throw error;
        }
    }
    async updateServiceRequest(tenantId, requestId, userId, data) {
        try {
            const existingRequest = await prisma_1.prisma.serviceRequest.findFirst({
                where: {
                    id: requestId,
                    tenantId,
                    userId,
                    status: { in: [client_1.RequestStatus.PENDING, client_1.RequestStatus.APPROVED] },
                },
                include: { service: true },
            });
            if (!existingRequest) {
                throw new Error('Service request not found or cannot be modified');
            }
            let totalAmount = Number(existingRequest.totalAmount);
            if (data.quantity && data.quantity !== existingRequest.quantity) {
                const service = await serviceCatalogService_1.serviceCatalogService.getServiceById(tenantId, existingRequest.serviceId);
                if (service) {
                    totalAmount = this.calculateTotalAmount(service, data.quantity);
                }
            }
            const updateData = {};
            if (data.quantity !== undefined) {
                updateData.quantity = data.quantity;
                updateData.totalAmount = new client_1.Prisma.Decimal(totalAmount);
            }
            if (data.priority !== undefined)
                updateData.priority = data.priority;
            if (data.requestedDeliveryTime !== undefined)
                updateData.requestedDeliveryTime = data.requestedDeliveryTime;
            if (data.scheduledDeliveryTime !== undefined)
                updateData.scheduledDeliveryTime = data.scheduledDeliveryTime;
            if (data.notes !== undefined)
                updateData.notes = data.notes;
            if (data.customizations !== undefined)
                updateData.customizations = data.customizations;
            if (data.attachments !== undefined)
                updateData.attachments = data.attachments;
            if (data.progressNotes !== undefined)
                updateData.progressNotes = data.progressNotes;
            const updatedRequest = await prisma_1.prisma.serviceRequest.update({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to update service request', { tenantId, requestId, userId, data }, error);
            throw error;
        }
    }
    async cancelServiceRequest(tenantId, requestId, userId, reason) {
        try {
            return await this.updateRequestStatus(tenantId, requestId, client_1.RequestStatus.CANCELLED, userId, reason || 'Cancelled by user');
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel service request', { tenantId, requestId, userId }, error);
            throw error;
        }
    }
    async getServiceRequestById(tenantId, requestId) {
        try {
            const request = await prisma_1.prisma.serviceRequest.findFirst({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get service request by ID', { tenantId, requestId }, error);
            throw error;
        }
    }
    async processApproval(tenantId, requestId, approverId, data) {
        try {
            const request = await prisma_1.prisma.serviceRequest.findFirst({
                where: {
                    id: requestId,
                    tenantId,
                    status: client_1.RequestStatus.PENDING,
                    requiresApproval: true,
                },
            });
            if (!request) {
                throw new Error('Service request not found or not pending approval');
            }
            const newStatus = data.approve ? client_1.RequestStatus.APPROVED : client_1.RequestStatus.REJECTED;
            const updateData = {
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
            const updatedRequest = await prisma_1.prisma.$transaction(async (tx) => {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to process approval', { tenantId, requestId, approverId, data }, error);
            throw error;
        }
    }
    async assignServiceRequest(tenantId, requestId, assignerId, data) {
        try {
            const updatedRequest = await prisma_1.prisma.$transaction(async (tx) => {
                const updated = await tx.serviceRequest.update({
                    where: {
                        id: requestId,
                        tenantId,
                        status: { in: [client_1.RequestStatus.APPROVED, client_1.RequestStatus.IN_PROGRESS] },
                    },
                    data: {
                        assignedTo: data.assignedTo,
                        status: client_1.RequestStatus.IN_PROGRESS,
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
                await tx.serviceRequestStatusHistory.create({
                    data: {
                        serviceRequestId: requestId,
                        status: client_1.RequestStatus.IN_PROGRESS,
                        changedBy: assignerId,
                        reason: 'Request assigned',
                        notes: data.notes,
                    },
                });
                return updated;
            });
            return this.mapRequestToItem(updatedRequest);
        }
        catch (error) {
            logger_1.logger.error('Failed to assign service request', { tenantId, requestId, assignerId, data }, error);
            throw error;
        }
    }
    async updateProgress(tenantId, requestId, userId, data) {
        try {
            const updatedRequest = await prisma_1.prisma.serviceRequest.update({
                where: {
                    id: requestId,
                    tenantId,
                    assignedTo: userId,
                    status: client_1.RequestStatus.IN_PROGRESS,
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
        }
        catch (error) {
            logger_1.logger.error('Failed to update progress', { tenantId, requestId, userId, data }, error);
            throw error;
        }
    }
    async completeServiceRequest(tenantId, requestId, userId, data) {
        try {
            return await this.updateRequestStatus(tenantId, requestId, client_1.RequestStatus.COMPLETED, userId, 'Service request completed', {
                completedAt: new Date(),
                actualDeliveryTime: data.actualDeliveryTime || new Date(),
                progressNotes: data.notes,
                ...(data.attachments && { attachments: data.attachments }),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to complete service request', { tenantId, requestId, userId, data }, error);
            throw error;
        }
    }
    async putOnHold(tenantId, requestId, userId, reason) {
        try {
            return await this.updateRequestStatus(tenantId, requestId, client_1.RequestStatus.ON_HOLD, userId, reason);
        }
        catch (error) {
            logger_1.logger.error('Failed to put service request on hold', { tenantId, requestId, userId, reason }, error);
            throw error;
        }
    }
    async resumeFromHold(tenantId, requestId, userId, reason) {
        try {
            return await this.updateRequestStatus(tenantId, requestId, client_1.RequestStatus.IN_PROGRESS, userId, reason || 'Resumed from hold');
        }
        catch (error) {
            logger_1.logger.error('Failed to resume service request from hold', { tenantId, requestId, userId }, error);
            throw error;
        }
    }
    async getServiceRequests(tenantId, filters = {}, pagination = {}) {
        try {
            const whereClause = this.buildRequestWhereClause(tenantId, filters);
            const [requests, total] = await Promise.all([
                prisma_1.prisma.serviceRequest.findMany({
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
                prisma_1.prisma.serviceRequest.count({ where: whereClause }),
            ]);
            const requestItems = requests.map(request => this.mapRequestToItem(request));
            const hasMore = (pagination.skip || 0) + requestItems.length < total;
            return {
                requests: requestItems,
                total,
                hasMore,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get service requests', { tenantId, filters, pagination }, error);
            throw error;
        }
    }
    async getMyServiceRequests(tenantId, userId, filters = {}) {
        try {
            const result = await this.getServiceRequests(tenantId, { ...filters, userId });
            return result.requests;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user service requests', { tenantId, userId, filters }, error);
            throw error;
        }
    }
    async getPendingApprovals(tenantId, pagination = {}) {
        try {
            return await this.getServiceRequests(tenantId, { status: [client_1.RequestStatus.PENDING] }, pagination);
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending approvals', { tenantId }, error);
            throw error;
        }
    }
    async getAssignedRequests(tenantId, userId, pagination = {}) {
        try {
            return await this.getServiceRequests(tenantId, { assignedTo: userId, status: [client_1.RequestStatus.IN_PROGRESS, client_1.RequestStatus.ON_HOLD] }, pagination);
        }
        catch (error) {
            logger_1.logger.error('Failed to get assigned requests', { tenantId, userId }, error);
            throw error;
        }
    }
    async getServiceRequestStats(tenantId, startDate, endDate) {
        try {
            const dateFilter = startDate && endDate ? {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            } : {};
            const requests = await prisma_1.prisma.serviceRequest.findMany({
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
            const statusCounts = new Map();
            requests.forEach(request => {
                const current = statusCounts.get(request.status) || 0;
                statusCounts.set(request.status, current + 1);
            });
            const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
                status,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0,
            }));
            const priorityCounts = new Map();
            requests.forEach(request => {
                const current = priorityCounts.get(request.priority) || 0;
                priorityCounts.set(request.priority, current + 1);
            });
            const byPriority = Array.from(priorityCounts.entries()).map(([priority, count]) => ({
                priority,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0,
            }));
            const completedRequests = requests.filter(r => r.completedAt);
            const avgProcessingTime = completedRequests.length > 0
                ? completedRequests.reduce((sum, request) => {
                    const processingTime = request.completedAt.getTime() - request.createdAt.getTime();
                    return sum + processingTime;
                }, 0) / completedRequests.length / (1000 * 60 * 60)
                : 0;
            const completionRate = total > 0
                ? (completedRequests.length / total) * 100
                : 0;
            const pendingApprovals = requests.filter(r => r.status === client_1.RequestStatus.PENDING).length;
            const now = new Date();
            const overdueRequests = requests.filter(r => !r.completedAt &&
                (now.getTime() - r.createdAt.getTime()) > (24 * 60 * 60 * 1000)).length;
            return {
                total,
                byStatus,
                byPriority,
                averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
                completionRate: Math.round(completionRate * 100) / 100,
                pendingApprovals,
                overdueRequests,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get service request stats', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
    async updateRequestStatus(tenantId, requestId, newStatus, userId, reason, additionalData = {}) {
        const updatedRequest = await prisma_1.prisma.$transaction(async (tx) => {
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
    calculateTotalAmount(service, quantity) {
        if (!service.dynamicPricing || !service.pricingTiers || service.pricingTiers.length === 0) {
            return service.price * quantity;
        }
        const applicableTier = service.pricingTiers
            .filter((tier) => quantity >= tier.minQuantity &&
            (!tier.maxQuantity || quantity <= tier.maxQuantity))
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];
        if (applicableTier) {
            return applicableTier.pricePerUnit * quantity;
        }
        return service.price * quantity;
    }
    buildRequestWhereClause(tenantId, filters) {
        const whereClause = { tenantId };
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
    mapRequestToItem(request) {
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
            statusHistory: request.statusHistory.map((history) => ({
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
exports.ServiceRequestService = ServiceRequestService;
exports.serviceRequestService = new ServiceRequestService();
//# sourceMappingURL=serviceRequestService.js.map
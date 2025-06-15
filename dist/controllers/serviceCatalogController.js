"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignedRequests = exports.getPendingApprovals = exports.getRecommendations = exports.getDashboardData = exports.getServiceAnalytics = exports.calculatePrice = exports.completeServiceRequest = exports.updateProgress = exports.assignServiceRequest = exports.processApproval = exports.getMyServiceRequests = exports.getServiceRequests = exports.getServiceRequest = exports.cancelServiceRequest = exports.updateServiceRequest = exports.createServiceRequest = exports.searchServices = exports.getFeaturedServices = exports.getServicesByCategory = exports.getServiceCatalog = exports.getService = exports.deleteService = exports.updateService = exports.createService = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const serviceCatalogService_1 = require("../services/serviceCatalogService");
const serviceRequestService_1 = require("../services/serviceRequestService");
const servicePricingService_1 = require("../services/servicePricingService");
const serviceAnalyticsService_1 = require("../services/serviceAnalyticsService");
const client_1 = require("@prisma/client");
const createServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(client_1.ServiceCategory),
    serviceType: zod_1.z.nativeEnum(client_1.ServiceType),
    availability: zod_1.z.nativeEnum(client_1.ServiceAvailability),
    price: zod_1.z.number().positive(),
    unit: zod_1.z.string().optional(),
    maxQuantity: zod_1.z.number().positive().optional(),
    requiresApproval: zod_1.z.boolean().optional(),
    estimatedDeliveryTime: zod_1.z.string().optional(),
    instructions: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    pricingTiers: zod_1.z.array(zod_1.z.object({
        minQuantity: zod_1.z.number().positive(),
        maxQuantity: zod_1.z.number().positive().optional(),
        pricePerUnit: zod_1.z.number().positive(),
        discountPercentage: zod_1.z.number().min(0).max(100).optional(),
    })).optional(),
    dynamicPricing: zod_1.z.boolean().optional(),
    minimumOrder: zod_1.z.number().positive().optional(),
});
const updateServiceSchema = createServiceSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
const createServiceRequestSchema = zod_1.z.object({
    serviceId: zod_1.z.string(),
    quantity: zod_1.z.number().positive().optional(),
    priority: zod_1.z.nativeEnum(client_1.RequestPriority).optional(),
    requestedDeliveryTime: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
    customizations: zod_1.z.record(zod_1.z.any()).optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
});
const processApprovalSchema = zod_1.z.object({
    approve: zod_1.z.boolean(),
    reason: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    scheduledDeliveryTime: zod_1.z.string().datetime().optional(),
});
const assignRequestSchema = zod_1.z.object({
    assignedTo: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
const updateProgressSchema = zod_1.z.object({
    progressNotes: zod_1.z.string(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
});
const completeRequestSchema = zod_1.z.object({
    actualDeliveryTime: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.string()).optional(),
});
const calculatePriceSchema = zod_1.z.object({
    serviceId: zod_1.z.string(),
    quantity: zod_1.z.number().positive(),
    requestedDeliveryTime: zod_1.z.string().datetime().optional(),
    priority: zod_1.z.nativeEnum(client_1.RequestPriority).optional(),
});
const createService = async (req, res) => {
    try {
        const { tenantId } = req;
        const validatedData = createServiceSchema.parse(req.body);
        const service = await serviceCatalogService_1.serviceCatalogService.createService(tenantId, validatedData);
        logger_1.logger.info('Service created successfully', { tenantId, serviceId: service.id, userId: req.userId });
        return response_1.ResponseHelper.success(res, service, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create service', { tenantId: req.tenantId, userId: req.userId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid service data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create service');
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { serviceId } = req.params;
        const validatedData = updateServiceSchema.parse(req.body);
        const service = await serviceCatalogService_1.serviceCatalogService.updateService(tenantId, serviceId, validatedData);
        logger_1.logger.info('Service updated successfully', { tenantId, serviceId, userId });
        return response_1.ResponseHelper.success(res, service);
    }
    catch (error) {
        logger_1.logger.error('Failed to update service', { tenantId: req.tenantId, serviceId: req.params.serviceId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid service data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to update service');
    }
};
exports.updateService = updateService;
const deleteService = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { serviceId } = req.params;
        await serviceCatalogService_1.serviceCatalogService.deleteService(tenantId, serviceId);
        logger_1.logger.info('Service deleted successfully', { tenantId, serviceId, userId });
        return response_1.ResponseHelper.success(res, { message: 'Service deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete service', { tenantId: req.tenantId, serviceId: req.params.serviceId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to delete service');
    }
};
exports.deleteService = deleteService;
const getService = async (req, res) => {
    try {
        const { tenantId } = req;
        const { serviceId } = req.params;
        const service = await serviceCatalogService_1.serviceCatalogService.getServiceById(tenantId, serviceId);
        if (!service) {
            return response_1.ResponseHelper.notFound(res, 'Service not found');
        }
        return response_1.ResponseHelper.success(res, service);
    }
    catch (error) {
        logger_1.logger.error('Failed to get service', { tenantId: req.tenantId, serviceId: req.params.serviceId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get service');
    }
};
exports.getService = getService;
const getServiceCatalog = async (req, res) => {
    try {
        const { tenantId } = req;
        const { category, serviceType, availability, minPrice, maxPrice, isActive, requiresApproval, tags, search, skip, take, } = req.query;
        const filters = {};
        if (category)
            filters.category = category;
        if (serviceType)
            filters.serviceType = serviceType;
        if (availability)
            filters.availability = availability;
        if (minPrice)
            filters.minPrice = parseFloat(minPrice);
        if (maxPrice)
            filters.maxPrice = parseFloat(maxPrice);
        if (isActive !== undefined)
            filters.isActive = isActive === 'true';
        if (requiresApproval !== undefined)
            filters.requiresApproval = requiresApproval === 'true';
        if (tags)
            filters.tags = Array.isArray(tags) ? tags : [tags];
        if (search)
            filters.search = search;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await serviceCatalogService_1.serviceCatalogService.getServiceCatalog(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get service catalog', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get service catalog');
    }
};
exports.getServiceCatalog = getServiceCatalog;
const getServicesByCategory = async (req, res) => {
    try {
        const { tenantId } = req;
        const { category } = req.params;
        const { includeInactive } = req.query;
        const services = await serviceCatalogService_1.serviceCatalogService.getServicesByCategory(tenantId, category, includeInactive === 'true');
        return response_1.ResponseHelper.success(res, services);
    }
    catch (error) {
        logger_1.logger.error('Failed to get services by category', { tenantId: req.tenantId, category: req.params.category }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get services by category');
    }
};
exports.getServicesByCategory = getServicesByCategory;
const getFeaturedServices = async (req, res) => {
    try {
        const { tenantId } = req;
        const { limit } = req.query;
        const services = await serviceCatalogService_1.serviceCatalogService.getFeaturedServices(tenantId, limit ? parseInt(limit) : undefined);
        return response_1.ResponseHelper.success(res, services);
    }
    catch (error) {
        logger_1.logger.error('Failed to get featured services', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get featured services');
    }
};
exports.getFeaturedServices = getFeaturedServices;
const searchServices = async (req, res) => {
    try {
        const { tenantId } = req;
        const { q: searchTerm, category, serviceType, minPrice, maxPrice } = req.query;
        if (!searchTerm) {
            return response_1.ResponseHelper.badRequest(res, 'Search term is required');
        }
        const filters = {};
        if (category)
            filters.category = category;
        if (serviceType)
            filters.serviceType = serviceType;
        if (minPrice)
            filters.minPrice = parseFloat(minPrice);
        if (maxPrice)
            filters.maxPrice = parseFloat(maxPrice);
        const services = await serviceCatalogService_1.serviceCatalogService.searchServices(tenantId, searchTerm, filters);
        return response_1.ResponseHelper.success(res, services);
    }
    catch (error) {
        logger_1.logger.error('Failed to search services', { tenantId: req.tenantId, searchTerm: req.query.q }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to search services');
    }
};
exports.searchServices = searchServices;
const createServiceRequest = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = createServiceRequestSchema.parse(req.body);
        const requestData = {
            ...validatedData,
            userId,
            requestedDeliveryTime: validatedData.requestedDeliveryTime
                ? new Date(validatedData.requestedDeliveryTime)
                : undefined,
        };
        const serviceRequest = await serviceRequestService_1.serviceRequestService.createServiceRequest(tenantId, requestData);
        await serviceAnalyticsService_1.serviceAnalyticsService.trackServiceUsage(tenantId, {
            serviceId: validatedData.serviceId,
            userId,
            requestId: serviceRequest.id,
            action: 'REQUEST_CREATED',
            metadata: { quantity: validatedData.quantity || 1 },
            timestamp: new Date(),
        });
        logger_1.logger.info('Service request created successfully', { tenantId, requestId: serviceRequest.id, userId });
        return response_1.ResponseHelper.success(res, serviceRequest, 201);
    }
    catch (error) {
        logger_1.logger.error('Failed to create service request', { tenantId: req.tenantId, userId: req.userId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid service request data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to create service request');
    }
};
exports.createServiceRequest = createServiceRequest;
const updateServiceRequest = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { requestId } = req.params;
        const validatedData = updateServiceSchema.partial().parse(req.body);
        const updateData = {
            ...validatedData,
            requestedDeliveryTime: validatedData.requestedDeliveryTime
                ? new Date(validatedData.requestedDeliveryTime)
                : undefined,
        };
        const serviceRequest = await serviceRequestService_1.serviceRequestService.updateServiceRequest(tenantId, requestId, userId, updateData);
        logger_1.logger.info('Service request updated successfully', { tenantId, requestId, userId });
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to update service request', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to update service request');
    }
};
exports.updateServiceRequest = updateServiceRequest;
const cancelServiceRequest = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { requestId } = req.params;
        const { reason } = req.body;
        const serviceRequest = await serviceRequestService_1.serviceRequestService.cancelServiceRequest(tenantId, requestId, userId, reason);
        await serviceAnalyticsService_1.serviceAnalyticsService.trackServiceUsage(tenantId, {
            serviceId: serviceRequest.serviceId,
            userId,
            requestId,
            action: 'REQUEST_CANCELLED',
            metadata: { reason },
            timestamp: new Date(),
        });
        logger_1.logger.info('Service request cancelled successfully', { tenantId, requestId, userId });
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel service request', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to cancel service request');
    }
};
exports.cancelServiceRequest = cancelServiceRequest;
const getServiceRequest = async (req, res) => {
    try {
        const { tenantId } = req;
        const { requestId } = req.params;
        const serviceRequest = await serviceRequestService_1.serviceRequestService.getServiceRequestById(tenantId, requestId);
        if (!serviceRequest) {
            return response_1.ResponseHelper.notFound(res, 'Service request not found');
        }
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to get service request', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get service request');
    }
};
exports.getServiceRequest = getServiceRequest;
const getServiceRequests = async (req, res) => {
    try {
        const { tenantId } = req;
        const { status, priority, serviceId, userId, assignedTo, search, skip, take, } = req.query;
        const filters = {};
        if (status)
            filters.status = Array.isArray(status) ? status : [status];
        if (priority)
            filters.priority = Array.isArray(priority) ? priority : [priority];
        if (serviceId)
            filters.serviceId = serviceId;
        if (userId)
            filters.userId = userId;
        if (assignedTo)
            filters.assignedTo = assignedTo;
        if (search)
            filters.search = search;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await serviceRequestService_1.serviceRequestService.getServiceRequests(tenantId, filters, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get service requests', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get service requests');
    }
};
exports.getServiceRequests = getServiceRequests;
const getMyServiceRequests = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { status, serviceId } = req.query;
        const filters = {};
        if (status)
            filters.status = Array.isArray(status) ? status : [status];
        if (serviceId)
            filters.serviceId = serviceId;
        const requests = await serviceRequestService_1.serviceRequestService.getMyServiceRequests(tenantId, userId, filters);
        return response_1.ResponseHelper.success(res, requests);
    }
    catch (error) {
        logger_1.logger.error('Failed to get user service requests', { tenantId: req.tenantId, userId: req.userId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get user service requests');
    }
};
exports.getMyServiceRequests = getMyServiceRequests;
const processApproval = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { requestId } = req.params;
        const validatedData = processApprovalSchema.parse(req.body);
        const approvalData = {
            ...validatedData,
            scheduledDeliveryTime: validatedData.scheduledDeliveryTime
                ? new Date(validatedData.scheduledDeliveryTime)
                : undefined,
        };
        const serviceRequest = await serviceRequestService_1.serviceRequestService.processApproval(tenantId, requestId, userId, approvalData);
        await serviceAnalyticsService_1.serviceAnalyticsService.trackServiceUsage(tenantId, {
            serviceId: serviceRequest.serviceId,
            userId,
            requestId,
            action: 'REQUEST_APPROVED',
            metadata: { approved: validatedData.approve },
            timestamp: new Date(),
        });
        logger_1.logger.info('Service request approval processed', { tenantId, requestId, approved: validatedData.approve, userId });
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to process approval', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid approval data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to process approval');
    }
};
exports.processApproval = processApproval;
const assignServiceRequest = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { requestId } = req.params;
        const validatedData = assignRequestSchema.parse(req.body);
        const serviceRequest = await serviceRequestService_1.serviceRequestService.assignServiceRequest(tenantId, requestId, userId, validatedData);
        await serviceAnalyticsService_1.serviceAnalyticsService.trackServiceUsage(tenantId, {
            serviceId: serviceRequest.serviceId,
            userId,
            requestId,
            action: 'REQUEST_STARTED',
            metadata: { assignedTo: validatedData.assignedTo },
            timestamp: new Date(),
        });
        logger_1.logger.info('Service request assigned successfully', { tenantId, requestId, assignedTo: validatedData.assignedTo, userId });
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to assign service request', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid assignment data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to assign service request');
    }
};
exports.assignServiceRequest = assignServiceRequest;
const updateProgress = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { requestId } = req.params;
        const validatedData = updateProgressSchema.parse(req.body);
        const serviceRequest = await serviceRequestService_1.serviceRequestService.updateProgress(tenantId, requestId, userId, validatedData);
        logger_1.logger.info('Service request progress updated', { tenantId, requestId, userId });
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to update progress', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid progress data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to update progress');
    }
};
exports.updateProgress = updateProgress;
const completeServiceRequest = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { requestId } = req.params;
        const validatedData = completeRequestSchema.parse(req.body);
        const completionData = {
            ...validatedData,
            actualDeliveryTime: validatedData.actualDeliveryTime
                ? new Date(validatedData.actualDeliveryTime)
                : undefined,
        };
        const serviceRequest = await serviceRequestService_1.serviceRequestService.completeServiceRequest(tenantId, requestId, userId, completionData);
        await serviceAnalyticsService_1.serviceAnalyticsService.trackServiceUsage(tenantId, {
            serviceId: serviceRequest.serviceId,
            userId,
            requestId,
            action: 'REQUEST_COMPLETED',
            metadata: {},
            timestamp: new Date(),
        });
        logger_1.logger.info('Service request completed successfully', { tenantId, requestId, userId });
        return response_1.ResponseHelper.success(res, serviceRequest);
    }
    catch (error) {
        logger_1.logger.error('Failed to complete service request', { tenantId: req.tenantId, requestId: req.params.requestId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid completion data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to complete service request');
    }
};
exports.completeServiceRequest = completeServiceRequest;
const calculatePrice = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const validatedData = calculatePriceSchema.parse(req.body);
        const pricingRequest = {
            ...validatedData,
            userId,
            requestedDeliveryTime: validatedData.requestedDeliveryTime
                ? new Date(validatedData.requestedDeliveryTime)
                : undefined,
        };
        const pricing = await servicePricingService_1.servicePricingService.calculatePrice(tenantId, pricingRequest);
        return response_1.ResponseHelper.success(res, pricing);
    }
    catch (error) {
        logger_1.logger.error('Failed to calculate price', { tenantId: req.tenantId, userId: req.userId }, error);
        if (error instanceof zod_1.z.ZodError) {
            return response_1.ResponseHelper.badRequest(res, 'Invalid pricing request data', error.errors);
        }
        return response_1.ResponseHelper.internalError(res, 'Failed to calculate price');
    }
};
exports.calculatePrice = calculatePrice;
const getServiceAnalytics = async (req, res) => {
    try {
        const { tenantId } = req;
        const { serviceId, startDate, endDate } = req.query;
        const analytics = await serviceCatalogService_1.serviceCatalogService.getServiceAnalytics(tenantId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return response_1.ResponseHelper.success(res, analytics);
    }
    catch (error) {
        logger_1.logger.error('Failed to get service analytics', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get service analytics');
    }
};
exports.getServiceAnalytics = getServiceAnalytics;
const getDashboardData = async (req, res) => {
    try {
        const { tenantId } = req;
        const { startDate, endDate } = req.query;
        const defaultEndDate = new Date();
        const defaultStartDate = new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dashboardData = await serviceAnalyticsService_1.serviceAnalyticsService.generateDashboardData(tenantId, startDate ? new Date(startDate) : defaultStartDate, endDate ? new Date(endDate) : defaultEndDate);
        return response_1.ResponseHelper.success(res, dashboardData);
    }
    catch (error) {
        logger_1.logger.error('Failed to get dashboard data', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get dashboard data');
    }
};
exports.getDashboardData = getDashboardData;
const getRecommendations = async (req, res) => {
    try {
        const { tenantId } = req;
        const { timeframe } = req.query;
        const recommendations = await serviceAnalyticsService_1.serviceAnalyticsService.generateRecommendations(tenantId, timeframe);
        return response_1.ResponseHelper.success(res, recommendations);
    }
    catch (error) {
        logger_1.logger.error('Failed to get recommendations', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get recommendations');
    }
};
exports.getRecommendations = getRecommendations;
const getPendingApprovals = async (req, res) => {
    try {
        const { tenantId } = req;
        const { skip, take } = req.query;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await serviceRequestService_1.serviceRequestService.getPendingApprovals(tenantId, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get pending approvals', { tenantId: req.tenantId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get pending approvals');
    }
};
exports.getPendingApprovals = getPendingApprovals;
const getAssignedRequests = async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { skip, take } = req.query;
        const pagination = {
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        };
        const result = await serviceRequestService_1.serviceRequestService.getAssignedRequests(tenantId, userId, pagination);
        return response_1.ResponseHelper.success(res, result);
    }
    catch (error) {
        logger_1.logger.error('Failed to get assigned requests', { tenantId: req.tenantId, userId: req.userId }, error);
        return response_1.ResponseHelper.internalError(res, 'Failed to get assigned requests');
    }
};
exports.getAssignedRequests = getAssignedRequests;
//# sourceMappingURL=serviceCatalogController.js.map
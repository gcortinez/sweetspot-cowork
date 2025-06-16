import { Response } from "express";
import { z } from "zod";
import { ResponseHelper } from "../utils/response";
import {
  BaseRequest,
  AuthenticatedRequest,
  ErrorCode,
  HttpStatusCode,
} from "../types/api";
import { logger } from "../utils/logger";
import { serviceCatalogService } from "../services/serviceCatalogService";
import { serviceRequestService } from "../services/serviceRequestService";
import { servicePricingService } from "../services/servicePricingService";
import { serviceAnalyticsService } from "../services/serviceAnalyticsService";
import {
  ServiceCategory,
  ServiceType,
  ServiceAvailability,
  RequestPriority,
} from "@prisma/client";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.nativeEnum(ServiceCategory),
  serviceType: z.nativeEnum(ServiceType),
  availability: z.nativeEnum(ServiceAvailability),
  price: z.number().positive(),
  unit: z.string().optional(),
  maxQuantity: z.number().positive().optional(),
  requiresApproval: z.boolean().optional(),
  estimatedDeliveryTime: z.string().optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  pricingTiers: z
    .array(
      z.object({
        minQuantity: z.number().positive(),
        maxQuantity: z.number().positive().optional(),
        pricePerUnit: z.number().positive(),
        discountPercentage: z.number().min(0).max(100).optional(),
      })
    )
    .optional(),
  dynamicPricing: z.boolean().optional(),
  minimumOrder: z.number().positive().optional(),
});

const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const createServiceRequestSchema = z.object({
  serviceId: z.string(),
  quantity: z.number().positive().optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
  requestedDeliveryTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  customizations: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
});

const processApprovalSchema = z.object({
  approve: z.boolean(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  scheduledDeliveryTime: z.string().datetime().optional(),
});

const assignRequestSchema = z.object({
  assignedTo: z.string(),
  notes: z.string().optional(),
});

const updateProgressSchema = z.object({
  progressNotes: z.string(),
  attachments: z.array(z.string()).optional(),
});

const completeRequestSchema = z.object({
  actualDeliveryTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const updateServiceRequestSchema = z.object({
  serviceId: z.string(),
  quantity: z.number().positive().optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
  requestedDeliveryTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  customizations: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
});

const calculatePriceSchema = z.object({
  serviceId: z.string(),
  quantity: z.number().positive(),
  requestedDeliveryTime: z.string().datetime().optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
});

// ============================================================================
// SERVICE CATALOG MANAGEMENT
// ============================================================================

export const createService = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const validatedData = createServiceSchema.parse(req.body);

    const service = await serviceCatalogService.createService(
      tenantId,
      validatedData
    );

    logger.info("Service created successfully", {
      tenantId,
      serviceId: service.id,
      userId: req.userId,
    });
    return ResponseHelper.success(
      res,
      service,
      "Service created successfully",
      HttpStatusCode.CREATED
    );
  } catch (error) {
    logger.error(
      "Failed to create service",
      { tenantId: req.tenantId, userId: req.userId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid service data",
        error.errors
      );
    }

    return ResponseHelper.internalError(res, "Failed to create service");
  }
};

export const updateService = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { serviceId } = req.params;
    const validatedData = updateServiceSchema.parse(req.body);

    const service = await serviceCatalogService.updateService(
      tenantId,
      serviceId,
      validatedData
    );

    logger.info("Service updated successfully", {
      tenantId,
      serviceId,
      userId,
    });
    return ResponseHelper.success(res, service);
  } catch (error) {
    logger.error(
      "Failed to update service",
      { tenantId: req.tenantId, serviceId: req.params.serviceId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid service data",
        error.errors
      );
    }

    return ResponseHelper.internalError(res, "Failed to update service");
  }
};

export const deleteService = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { serviceId } = req.params;

    await serviceCatalogService.deleteService(tenantId, serviceId);

    logger.info("Service deleted successfully", {
      tenantId,
      serviceId,
      userId,
    });
    return ResponseHelper.success(res, {
      message: "Service deleted successfully",
    });
  } catch (error) {
    logger.error(
      "Failed to delete service",
      { tenantId: req.tenantId, serviceId: req.params.serviceId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to delete service");
  }
};

export const getService = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { serviceId } = req.params;

    const service = await serviceCatalogService.getServiceById(
      tenantId,
      serviceId
    );

    if (!service) {
      return ResponseHelper.notFound(res, "Service not found");
    }

    return ResponseHelper.success(res, service);
  } catch (error) {
    logger.error(
      "Failed to get service",
      { tenantId: req.tenantId, serviceId: req.params.serviceId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get service");
  }
};

export const getServiceCatalog = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const {
      category,
      serviceType,
      availability,
      minPrice,
      maxPrice,
      isActive,
      requiresApproval,
      tags,
      search,
      skip,
      take,
    } = req.query;

    const filters: any = {};
    if (category) filters.category = category as ServiceCategory;
    if (serviceType) filters.serviceType = serviceType as ServiceType;
    if (availability)
      filters.availability = availability as ServiceAvailability;
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (requiresApproval !== undefined)
      filters.requiresApproval = requiresApproval === "true";
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (search) filters.search = search as string;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await serviceCatalogService.getServiceCatalog(
      tenantId,
      filters,
      pagination
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error(
      "Failed to get service catalog",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get service catalog");
  }
};

export const getServicesByCategory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { category } = req.params;
    const { includeInactive } = req.query;

    const services = await serviceCatalogService.getServicesByCategory(
      tenantId,
      category as ServiceCategory,
      includeInactive === "true"
    );

    return ResponseHelper.success(res, services);
  } catch (error) {
    logger.error(
      "Failed to get services by category",
      { tenantId: req.tenantId, category: req.params.category },
      error as Error
    );
    return ResponseHelper.internalError(
      res,
      "Failed to get services by category"
    );
  }
};

export const getFeaturedServices = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { limit } = req.query;

    const services = await serviceCatalogService.getFeaturedServices(
      tenantId,
      limit ? parseInt(limit as string) : undefined
    );

    return ResponseHelper.success(res, services);
  } catch (error) {
    logger.error(
      "Failed to get featured services",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get featured services");
  }
};

export const searchServices = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const {
      q: searchTerm,
      category,
      serviceType,
      minPrice,
      maxPrice,
    } = req.query;

    if (!searchTerm) {
      return ResponseHelper.badRequest(res, "Search term is required");
    }

    const filters: any = {};
    if (category) filters.category = category as ServiceCategory;
    if (serviceType) filters.serviceType = serviceType as ServiceType;
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

    const services = await serviceCatalogService.searchServices(
      tenantId,
      searchTerm as string,
      filters
    );

    return ResponseHelper.success(res, services);
  } catch (error) {
    logger.error(
      "Failed to search services",
      { tenantId: req.tenantId, searchTerm: req.query.q },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to search services");
  }
};

// ============================================================================
// SERVICE REQUESTS
// ============================================================================

export const createServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    const serviceRequest = await serviceRequestService.createServiceRequest(
      tenantId,
      requestData
    );

    // Track usage
    await serviceAnalyticsService.trackServiceUsage(tenantId, {
      serviceId: validatedData.serviceId,
      userId,
      requestId: serviceRequest.id,
      action: "REQUEST_CREATED",
      metadata: { quantity: validatedData.quantity || 1 },
      timestamp: new Date(),
    });

    logger.info("Service request created successfully", {
      tenantId,
      requestId: serviceRequest.id,
      userId,
    });
    return ResponseHelper.success(
      res,
      serviceRequest,
      "Service request created successfully",
      HttpStatusCode.CREATED
    );
  } catch (error) {
    logger.error(
      "Failed to create service request",
      { tenantId: req.tenantId, userId: req.userId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid service request data",
        error.errors
      );
    }

    return ResponseHelper.internalError(
      res,
      "Failed to create service request"
    );
  }
};

export const updateServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { requestId } = req.params;
    const validatedData = updateServiceRequestSchema.parse(req.body);

    const updateData = {
      ...validatedData,
      requestedDeliveryTime: validatedData.requestedDeliveryTime
        ? new Date(validatedData.requestedDeliveryTime)
        : undefined,
    };

    const serviceRequest = await serviceRequestService.updateServiceRequest(
      tenantId,
      requestId,
      userId,
      updateData
    );

    logger.info("Service request updated successfully", {
      tenantId,
      requestId,
      userId,
    });
    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to update service request",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );
    return ResponseHelper.internalError(
      res,
      "Failed to update service request"
    );
  }
};

export const cancelServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { requestId } = req.params;
    const { reason } = req.body;

    const serviceRequest = await serviceRequestService.cancelServiceRequest(
      tenantId,
      requestId,
      userId,
      reason
    );

    // Track usage
    await serviceAnalyticsService.trackServiceUsage(tenantId, {
      serviceId: serviceRequest.serviceId,
      userId,
      requestId,
      action: "REQUEST_CANCELLED",
      metadata: { reason },
      timestamp: new Date(),
    });

    logger.info("Service request cancelled successfully", {
      tenantId,
      requestId,
      userId,
    });
    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to cancel service request",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );
    return ResponseHelper.internalError(
      res,
      "Failed to cancel service request"
    );
  }
};

export const getServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { requestId } = req.params;

    const serviceRequest = await serviceRequestService.getServiceRequestById(
      tenantId,
      requestId
    );

    if (!serviceRequest) {
      return ResponseHelper.notFound(res, "Service request not found");
    }

    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to get service request",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get service request");
  }
};

export const getServiceRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const {
      status,
      priority,
      serviceId,
      userId,
      assignedTo,
      search,
      skip,
      take,
    } = req.query;

    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (priority)
      filters.priority = Array.isArray(priority) ? priority : [priority];
    if (serviceId) filters.serviceId = serviceId as string;
    if (userId) filters.userId = userId as string;
    if (assignedTo) filters.assignedTo = assignedTo as string;
    if (search) filters.search = search as string;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await serviceRequestService.getServiceRequests(
      tenantId,
      filters,
      pagination
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error(
      "Failed to get service requests",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get service requests");
  }
};

export const getMyServiceRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { status, serviceId } = req.query;

    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (serviceId) filters.serviceId = serviceId as string;

    const requests = await serviceRequestService.getMyServiceRequests(
      tenantId,
      userId,
      filters
    );

    return ResponseHelper.success(res, requests);
  } catch (error) {
    logger.error(
      "Failed to get user service requests",
      { tenantId: req.tenantId, userId: req.userId },
      error as Error
    );
    return ResponseHelper.internalError(
      res,
      "Failed to get user service requests"
    );
  }
};

// ============================================================================
// REQUEST WORKFLOW MANAGEMENT
// ============================================================================

export const processApproval = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    const serviceRequest = await serviceRequestService.processApproval(
      tenantId,
      requestId,
      userId,
      approvalData
    );

    // Track usage
    await serviceAnalyticsService.trackServiceUsage(tenantId, {
      serviceId: serviceRequest.serviceId,
      userId,
      requestId,
      action: "REQUEST_APPROVED",
      metadata: { approved: validatedData.approve },
      timestamp: new Date(),
    });

    logger.info("Service request approval processed", {
      tenantId,
      requestId,
      approved: validatedData.approve,
      userId,
    });
    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to process approval",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid approval data",
        error.errors
      );
    }

    return ResponseHelper.internalError(res, "Failed to process approval");
  }
};

export const assignServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { requestId } = req.params;
    const validatedData = assignRequestSchema.parse(req.body);

    const serviceRequest = await serviceRequestService.assignServiceRequest(
      tenantId,
      requestId,
      userId,
      validatedData
    );

    // Track usage
    await serviceAnalyticsService.trackServiceUsage(tenantId, {
      serviceId: serviceRequest.serviceId,
      userId,
      requestId,
      action: "REQUEST_STARTED",
      metadata: { assignedTo: validatedData.assignedTo },
      timestamp: new Date(),
    });

    logger.info("Service request assigned successfully", {
      tenantId,
      requestId,
      assignedTo: validatedData.assignedTo,
      userId,
    });
    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to assign service request",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid assignment data",
        error.errors
      );
    }

    return ResponseHelper.internalError(
      res,
      "Failed to assign service request"
    );
  }
};

export const updateProgress = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { requestId } = req.params;
    const validatedData = updateProgressSchema.parse(req.body);

    const serviceRequest = await serviceRequestService.updateProgress(
      tenantId,
      requestId,
      userId,
      validatedData
    );

    logger.info("Service request progress updated", {
      tenantId,
      requestId,
      userId,
    });
    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to update progress",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid progress data",
        error.errors
      );
    }

    return ResponseHelper.internalError(res, "Failed to update progress");
  }
};

export const completeServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    const serviceRequest = await serviceRequestService.completeServiceRequest(
      tenantId,
      requestId,
      userId,
      completionData
    );

    // Track usage
    await serviceAnalyticsService.trackServiceUsage(tenantId, {
      serviceId: serviceRequest.serviceId,
      userId,
      requestId,
      action: "REQUEST_COMPLETED",
      metadata: {},
      timestamp: new Date(),
    });

    logger.info("Service request completed successfully", {
      tenantId,
      requestId,
      userId,
    });
    return ResponseHelper.success(res, serviceRequest);
  } catch (error) {
    logger.error(
      "Failed to complete service request",
      { tenantId: req.tenantId, requestId: req.params.requestId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid completion data",
        error.errors
      );
    }

    return ResponseHelper.internalError(
      res,
      "Failed to complete service request"
    );
  }
};

// ============================================================================
// PRICING AND ANALYTICS
// ============================================================================

export const calculatePrice = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    const pricing = await servicePricingService.calculatePrice(
      tenantId,
      pricingRequest
    );

    return ResponseHelper.success(res, pricing);
  } catch (error) {
    logger.error(
      "Failed to calculate price",
      { tenantId: req.tenantId, userId: req.userId },
      error as Error
    );

    if (error instanceof z.ZodError) {
      return ResponseHelper.badRequest(
        res,
        "Invalid pricing request data",
        error.errors
      );
    }

    return ResponseHelper.internalError(res, "Failed to calculate price");
  }
};

export const getServiceAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { serviceId, startDate, endDate } = req.query;

    const analytics = await serviceCatalogService.getServiceAnalytics(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return ResponseHelper.success(res, analytics);
  } catch (error) {
    logger.error(
      "Failed to get service analytics",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get service analytics");
  }
};

export const getDashboardData = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate } = req.query;

    const defaultEndDate = new Date();
    const defaultStartDate = new Date(
      defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000
    ); // Last 30 days

    const dashboardData = await serviceAnalyticsService.generateDashboardData(
      tenantId,
      startDate ? new Date(startDate as string) : defaultStartDate,
      endDate ? new Date(endDate as string) : defaultEndDate
    );

    return ResponseHelper.success(res, dashboardData);
  } catch (error) {
    logger.error(
      "Failed to get dashboard data",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get dashboard data");
  }
};

export const getRecommendations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { timeframe } = req.query;

    const recommendations =
      await serviceAnalyticsService.generateRecommendations(
        tenantId,
        timeframe as any
      );

    return ResponseHelper.success(res, recommendations);
  } catch (error) {
    logger.error(
      "Failed to get recommendations",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get recommendations");
  }
};

export const getPendingApprovals = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId } = req;
    const { skip, take } = req.query;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await serviceRequestService.getPendingApprovals(
      tenantId,
      pagination
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error(
      "Failed to get pending approvals",
      { tenantId: req.tenantId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get pending approvals");
  }
};

export const getAssignedRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req;
    const { skip, take } = req.query;

    const pagination = {
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
    };

    const result = await serviceRequestService.getAssignedRequests(
      tenantId,
      userId,
      pagination
    );

    return ResponseHelper.success(res, result);
  } catch (error) {
    logger.error(
      "Failed to get assigned requests",
      { tenantId: req.tenantId, userId: req.userId },
      error as Error
    );
    return ResponseHelper.internalError(res, "Failed to get assigned requests");
  }
};

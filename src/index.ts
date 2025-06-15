import express, { Request, Response } from "express";
import cors from "cors";
import { config, validateConfig } from "./config";
import { logger } from "./utils/logger";
import { ResponseHelper } from "./utils/response";
import { requestLogger, correlationId } from "./middleware/requestLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { 
  securityHeaders, 
  corsOptions, 
  apiRateLimit, 
  sanitizeInput, 
  requestSizeLimit,
  securityMonitoring 
} from "./middleware/security";
import { 
  httpsRedirect,
  strictTransportSecurity,
  validateTLSConnection,
  secureSessionHandling 
} from "./middleware/tls";
import { 
  enforceHTTPS,
  secureDataTransit 
} from "./middleware/encryption";

// Import routes
import authRoutes from "./routes/auth";
import tenantRoutes from "./routes/tenantRoutes";
import { leadRoutes } from "./routes/leadRoutes";
import { opportunityRoutes } from "./routes/opportunityRoutes";
import { activityRoutes } from "./routes/activityRoutes";
import { conversionRoutes } from "./routes/conversionRoutes";
import { communicationRoutes } from "./routes/communicationRoutes";
import { taskRoutes } from "./routes/taskRoutes";
import { analyticsRoutes } from "./routes/analyticsRoutes";
import { pricingRoutes } from "./routes/pricingRoutes";
import { quotationRoutes } from "./routes/quotationRoutes";
import { contractTemplateRoutes } from "./routes/contractTemplateRoutes";
import { digitalSignatureRoutes } from "./routes/digitalSignatureRoutes";
import { contractLifecycleRoutes } from "./routes/contractLifecycleRoutes";
import { contractRenewalRoutes } from "./routes/contractRenewalRoutes";
import { contractAnalyticsRoutes } from "./routes/contractAnalyticsRoutes";
import accessControlRoutes from "./routes/accessControlRoutes";
import securityRoutes from "./routes/securityRoutes";
import spaceRoutes from "./routes/spaceRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import billingRoutes from "./routes/billing";
import complianceRoutes from "./routes/complianceRoutes";
import threatDetectionRoutes from "./routes/threatDetectionRoutes";
import visitorRoutes from "./routes/visitorRoutes";
import roomManagementRoutes from "./routes/roomManagementRoutes";
import bookingManagementRoutes from "./routes/bookingManagementRoutes";
import serviceCatalogRoutes from "./routes/serviceCatalogRoutes";
import serviceRequestRoutes from "./routes/serviceRequestRoutes";

// Validate configuration before starting
try {
  validateConfig();
} catch (error) {
  logger.error("Configuration validation failed", {}, error as Error);
  process.exit(1);
}

const app = express();

// Trust proxy (important for getting real IP addresses behind reverse proxy)
app.set("trust proxy", 1);

// HTTPS enforcement and TLS security
app.use(httpsRedirect);
app.use(strictTransportSecurity);
app.use(validateTLSConnection);

// Data encryption in transit
app.use(enforceHTTPS);
app.use(secureDataTransit);

// Security middleware
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Request correlation ID
app.use(correlationId);

// Request logging
app.use(requestLogger({
  includeBody: config.environment === "development",
  includeQuery: true,
  excludeHealthCheck: true,
}));

// Security monitoring
app.use(securityMonitoring);

// Rate limiting
app.use(apiRateLimit);

// Request size limiting
app.use(requestSizeLimit);

// Body parsing middleware
app.use(express.json({ 
  limit: `${config.upload.maxFileSize}b`,
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: `${config.upload.maxFileSize}b`,
}));

// Input sanitization
app.use(sanitizeInput);

// Secure session handling
app.use(secureSessionHandling);

// Health check endpoint (before rate limiting)
app.get("/health", (req: Request, res: Response): void => {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "sweetspot-backend",
    version: "1.0.0",
    environment: config.environment,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: config.features,
  };

  logger.debug("Health check requested", { 
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  ResponseHelper.success(res, healthData);
});

// API Info endpoint
app.get("/api", (req: Request, res: Response): void => {
  const apiInfo = {
    name: "SweetSpot Cowork API",
    version: "1.0.0",
    description: "Multi-tenant coworking management platform API",
    environment: config.environment,
    endpoints: {
      auth: "/api/auth",
      tenants: "/api/tenants",
      leads: "/api/leads",
      opportunities: "/api/opportunities",
      activities: "/api/activities",
      conversions: "/api/conversions",
      communications: "/api/communications",
      tasks: "/api/tasks",
      analytics: "/api/analytics",
      pricing: "/api/pricing",
      quotations: "/api/quotations",
      contractTemplates: "/api/contract-templates",
      digitalSignatures: "/api/signatures",
      contracts: "/api/contracts",
      renewals: "/api/renewals",
      contractAnalytics: "/api/analytics/contracts",
      accessControl: "/api/access-control",
      security: "/api/security",
      spaces: "/api/spaces",
      bookings: "/api/bookings",
      billing: "/api/billing",
      compliance: "/api/compliance",
      threatDetection: "/api/threat-detection",
      rooms: "/api/rooms",
      roomBookings: "/api/room-bookings",
      services: "/api/services",
      serviceRequests: "/api/service-requests",
      health: "/health",
    },
    documentation: config.features.enableSwagger ? "/api/docs" : null,
  };

  ResponseHelper.success(res, apiInfo);
});

// API v1 routes
const apiV1 = express.Router();

// Mount route modules
apiV1.use("/auth", authRoutes);
apiV1.use("/tenants", tenantRoutes);
apiV1.use("/leads", leadRoutes);
apiV1.use("/opportunities", opportunityRoutes);
apiV1.use("/activities", activityRoutes);
apiV1.use("/conversions", conversionRoutes);
apiV1.use("/communications", communicationRoutes);
apiV1.use("/tasks", taskRoutes);
apiV1.use("/analytics", analyticsRoutes);
apiV1.use("/pricing", pricingRoutes);
apiV1.use("/quotations", quotationRoutes);
apiV1.use("/contract-templates", contractTemplateRoutes);
apiV1.use("/signatures", digitalSignatureRoutes);
apiV1.use("/contracts", contractLifecycleRoutes);
apiV1.use("/renewals", contractRenewalRoutes);
apiV1.use("/analytics/contracts", contractAnalyticsRoutes);
apiV1.use("/access-control", accessControlRoutes);
apiV1.use("/security", securityRoutes);
apiV1.use("/spaces", spaceRoutes);
apiV1.use("/bookings", bookingRoutes);
apiV1.use("/billing", billingRoutes);
apiV1.use("/compliance", complianceRoutes);
apiV1.use("/threat-detection", threatDetectionRoutes);
apiV1.use("/visitors", visitorRoutes);
apiV1.use("/rooms", roomManagementRoutes);
apiV1.use("/room-bookings", bookingManagementRoutes);
apiV1.use("/services", serviceCatalogRoutes);
apiV1.use("/service-requests", serviceRequestRoutes);

// Mount versioned API
app.use("/api/v1", apiV1);
app.use("/api", apiV1); // Default to v1

// 404 handler for unknown routes
app.use("*", notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", { 
    reason: reason?.toString(),
    promise: promise.toString(),
  });
  process.exit(1);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {}, error);
  process.exit(1);
});

// Start server
const server = app.listen(config.port, () => {
  logger.info("🚀 SweetSpot Backend API started successfully", {
    port: config.port,
    environment: config.environment,
    nodeVersion: process.version,
    pid: process.pid,
  });
  
  console.log(`🚀 SweetSpot Backend API running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔐 Auth API: http://localhost:${config.port}/api/auth`);
  console.log(`🏢 Tenant API: http://localhost:${config.port}/api/tenants`);
  console.log(`👥 Leads API: http://localhost:${config.port}/api/leads`);
  console.log(`💼 Opportunities API: http://localhost:${config.port}/api/opportunities`);
  console.log(`📋 Activities API: http://localhost:${config.port}/api/activities`);
  console.log(`🔄 Conversions API: http://localhost:${config.port}/api/conversions`);
  console.log(`📧 Communications API: http://localhost:${config.port}/api/communications`);
  console.log(`✅ Tasks API: http://localhost:${config.port}/api/tasks`);
  console.log(`📊 Analytics API: http://localhost:${config.port}/api/analytics`);
  console.log(`💰 Pricing API: http://localhost:${config.port}/api/pricing`);
  console.log(`📄 Quotations API: http://localhost:${config.port}/api/quotations`);
  console.log(`📋 Contract Templates API: http://localhost:${config.port}/api/contract-templates`);
  console.log(`✍️ Digital Signatures API: http://localhost:${config.port}/api/signatures`);
  console.log(`📄 Contract Lifecycle API: http://localhost:${config.port}/api/contracts`);
  console.log(`🔄 Contract Renewals API: http://localhost:${config.port}/api/renewals`);
  console.log(`📈 Contract Analytics API: http://localhost:${config.port}/api/analytics/contracts`);
  console.log(`🔐 Access Control API: http://localhost:${config.port}/api/access-control`);
  console.log(`🛡️ Security API: http://localhost:${config.port}/api/security`);
  console.log(`🏢 Spaces API: http://localhost:${config.port}/api/spaces`);
  console.log(`📅 Bookings API: http://localhost:${config.port}/api/bookings`);
  console.log(`💳 Billing API: http://localhost:${config.port}/api/billing`);
  console.log(`📋 Compliance API: http://localhost:${config.port}/api/compliance`);
  console.log(`🔍 Threat Detection API: http://localhost:${config.port}/api/threat-detection`);
  console.log(`🏢 Room Management API: http://localhost:${config.port}/api/rooms`);
  console.log(`📅 Room Bookings API: http://localhost:${config.port}/api/room-bookings`);
  console.log(`🛍️ Service Catalog API: http://localhost:${config.port}/api/services`);
  console.log(`📋 Service Requests API: http://localhost:${config.port}/api/service-requests`);
  console.log(`🌍 Environment: ${config.environment}`);
  
  if (config.features.enableSwagger) {
    console.log(`📚 API Docs: http://localhost:${config.port}/api/docs`);
  }
});

// Handle server errors
server.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${config.port} is already in use`);
  } else {
    logger.error("Server error", {}, error);
  }
  process.exit(1);
});

export default app;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const response_1 = require("./utils/response");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const security_1 = require("./middleware/security");
const tls_1 = require("./middleware/tls");
const encryption_1 = require("./middleware/encryption");
const auth_1 = __importDefault(require("./routes/auth"));
const tenantRoutes_1 = __importDefault(require("./routes/tenantRoutes"));
const leadRoutes_1 = require("./routes/leadRoutes");
const opportunityRoutes_1 = require("./routes/opportunityRoutes");
const activityRoutes_1 = require("./routes/activityRoutes");
const conversionRoutes_1 = require("./routes/conversionRoutes");
const communicationRoutes_1 = require("./routes/communicationRoutes");
const taskRoutes_1 = require("./routes/taskRoutes");
const analyticsRoutes_1 = require("./routes/analyticsRoutes");
const pricingRoutes_1 = require("./routes/pricingRoutes");
const quotationRoutes_1 = require("./routes/quotationRoutes");
const contractTemplateRoutes_1 = require("./routes/contractTemplateRoutes");
const digitalSignatureRoutes_1 = require("./routes/digitalSignatureRoutes");
const contractLifecycleRoutes_1 = require("./routes/contractLifecycleRoutes");
const contractRenewalRoutes_1 = require("./routes/contractRenewalRoutes");
const contractAnalyticsRoutes_1 = require("./routes/contractAnalyticsRoutes");
const accessControlRoutes_1 = __importDefault(require("./routes/accessControlRoutes"));
const securityRoutes_1 = __importDefault(require("./routes/securityRoutes"));
const spaceRoutes_1 = __importDefault(require("./routes/spaceRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const billing_1 = __importDefault(require("./routes/billing"));
const complianceRoutes_1 = __importDefault(require("./routes/complianceRoutes"));
const threatDetectionRoutes_1 = __importDefault(require("./routes/threatDetectionRoutes"));
const visitorRoutes_1 = __importDefault(require("./routes/visitorRoutes"));
const roomManagementRoutes_1 = __importDefault(require("./routes/roomManagementRoutes"));
const bookingManagementRoutes_1 = __importDefault(require("./routes/bookingManagementRoutes"));
const serviceCatalogRoutes_1 = __importDefault(require("./routes/serviceCatalogRoutes"));
const serviceRequestRoutes_1 = __importDefault(require("./routes/serviceRequestRoutes"));
try {
    (0, config_1.validateConfig)();
}
catch (error) {
    logger_1.logger.error("Configuration validation failed", {}, error);
    process.exit(1);
}
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use(tls_1.httpsRedirect);
app.use(tls_1.strictTransportSecurity);
app.use(tls_1.validateTLSConnection);
app.use(encryption_1.enforceHTTPS);
app.use(encryption_1.secureDataTransit);
app.use(security_1.securityHeaders);
app.use((0, cors_1.default)(security_1.corsOptions));
app.use(requestLogger_1.correlationId);
app.use((0, requestLogger_1.requestLogger)({
    includeBody: config_1.config.environment === "development",
    includeQuery: true,
    excludeHealthCheck: true,
}));
app.use(security_1.securityMonitoring);
app.use(security_1.apiRateLimit);
app.use(security_1.requestSizeLimit);
app.use(express_1.default.json({
    limit: `${config_1.config.upload.maxFileSize}b`,
    strict: true,
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: `${config_1.config.upload.maxFileSize}b`,
}));
app.use(security_1.sanitizeInput);
app.use(tls_1.secureSessionHandling);
app.get("/health", (req, res) => {
    const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "sweetspot-backend",
        version: "1.0.0",
        environment: config_1.config.environment,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        features: config_1.config.features,
    };
    logger_1.logger.debug("Health check requested", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });
    return response_1.ResponseHelper.success(res, healthData);
});
app.get("/api", (req, res) => {
    const apiInfo = {
        name: "SweetSpot Cowork API",
        version: "1.0.0",
        description: "Multi-tenant coworking management platform API",
        environment: config_1.config.environment,
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
        documentation: config_1.config.features.enableSwagger ? "/api/docs" : null,
    };
    return response_1.ResponseHelper.success(res, apiInfo);
});
const apiV1 = express_1.default.Router();
apiV1.use("/auth", auth_1.default);
apiV1.use("/tenants", tenantRoutes_1.default);
apiV1.use("/leads", leadRoutes_1.leadRoutes);
apiV1.use("/opportunities", opportunityRoutes_1.opportunityRoutes);
apiV1.use("/activities", activityRoutes_1.activityRoutes);
apiV1.use("/conversions", conversionRoutes_1.conversionRoutes);
apiV1.use("/communications", communicationRoutes_1.communicationRoutes);
apiV1.use("/tasks", taskRoutes_1.taskRoutes);
apiV1.use("/analytics", analyticsRoutes_1.analyticsRoutes);
apiV1.use("/pricing", pricingRoutes_1.pricingRoutes);
apiV1.use("/quotations", quotationRoutes_1.quotationRoutes);
apiV1.use("/contract-templates", contractTemplateRoutes_1.contractTemplateRoutes);
apiV1.use("/signatures", digitalSignatureRoutes_1.digitalSignatureRoutes);
apiV1.use("/contracts", contractLifecycleRoutes_1.contractLifecycleRoutes);
apiV1.use("/renewals", contractRenewalRoutes_1.contractRenewalRoutes);
apiV1.use("/analytics/contracts", contractAnalyticsRoutes_1.contractAnalyticsRoutes);
apiV1.use("/access-control", accessControlRoutes_1.default);
apiV1.use("/security", securityRoutes_1.default);
apiV1.use("/spaces", spaceRoutes_1.default);
apiV1.use("/bookings", bookingRoutes_1.default);
apiV1.use("/billing", billing_1.default);
apiV1.use("/compliance", complianceRoutes_1.default);
apiV1.use("/threat-detection", threatDetectionRoutes_1.default);
apiV1.use("/visitors", visitorRoutes_1.default);
apiV1.use("/rooms", roomManagementRoutes_1.default);
apiV1.use("/room-bookings", bookingManagementRoutes_1.default);
apiV1.use("/services", serviceCatalogRoutes_1.default);
apiV1.use("/service-requests", serviceRequestRoutes_1.default);
app.use("/api/v1", apiV1);
app.use("/api", apiV1);
app.use("*", errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
process.on("SIGTERM", () => {
    logger_1.logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    logger_1.logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
process.on("unhandledRejection", (reason, promise) => {
    logger_1.logger.error("Unhandled Promise Rejection", {
        reason: reason?.toString(),
        promise: promise.toString(),
    });
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    logger_1.logger.error("Uncaught Exception", {}, error);
    process.exit(1);
});
const server = app.listen(config_1.config.port, () => {
    logger_1.logger.info("🚀 SweetSpot Backend API started successfully", {
        port: config_1.config.port,
        environment: config_1.config.environment,
        nodeVersion: process.version,
        pid: process.pid,
    });
    console.log(`🚀 SweetSpot Backend API running on port ${config_1.config.port}`);
    console.log(`📊 Health check: http://localhost:${config_1.config.port}/health`);
    console.log(`🔐 Auth API: http://localhost:${config_1.config.port}/api/auth`);
    console.log(`🏢 Tenant API: http://localhost:${config_1.config.port}/api/tenants`);
    console.log(`👥 Leads API: http://localhost:${config_1.config.port}/api/leads`);
    console.log(`💼 Opportunities API: http://localhost:${config_1.config.port}/api/opportunities`);
    console.log(`📋 Activities API: http://localhost:${config_1.config.port}/api/activities`);
    console.log(`🔄 Conversions API: http://localhost:${config_1.config.port}/api/conversions`);
    console.log(`📧 Communications API: http://localhost:${config_1.config.port}/api/communications`);
    console.log(`✅ Tasks API: http://localhost:${config_1.config.port}/api/tasks`);
    console.log(`📊 Analytics API: http://localhost:${config_1.config.port}/api/analytics`);
    console.log(`💰 Pricing API: http://localhost:${config_1.config.port}/api/pricing`);
    console.log(`📄 Quotations API: http://localhost:${config_1.config.port}/api/quotations`);
    console.log(`📋 Contract Templates API: http://localhost:${config_1.config.port}/api/contract-templates`);
    console.log(`✍️ Digital Signatures API: http://localhost:${config_1.config.port}/api/signatures`);
    console.log(`📄 Contract Lifecycle API: http://localhost:${config_1.config.port}/api/contracts`);
    console.log(`🔄 Contract Renewals API: http://localhost:${config_1.config.port}/api/renewals`);
    console.log(`📈 Contract Analytics API: http://localhost:${config_1.config.port}/api/analytics/contracts`);
    console.log(`🔐 Access Control API: http://localhost:${config_1.config.port}/api/access-control`);
    console.log(`🛡️ Security API: http://localhost:${config_1.config.port}/api/security`);
    console.log(`🏢 Spaces API: http://localhost:${config_1.config.port}/api/spaces`);
    console.log(`📅 Bookings API: http://localhost:${config_1.config.port}/api/bookings`);
    console.log(`💳 Billing API: http://localhost:${config_1.config.port}/api/billing`);
    console.log(`📋 Compliance API: http://localhost:${config_1.config.port}/api/compliance`);
    console.log(`🔍 Threat Detection API: http://localhost:${config_1.config.port}/api/threat-detection`);
    console.log(`🏢 Room Management API: http://localhost:${config_1.config.port}/api/rooms`);
    console.log(`📅 Room Bookings API: http://localhost:${config_1.config.port}/api/room-bookings`);
    console.log(`🛍️ Service Catalog API: http://localhost:${config_1.config.port}/api/services`);
    console.log(`📋 Service Requests API: http://localhost:${config_1.config.port}/api/service-requests`);
    console.log(`🌍 Environment: ${config_1.config.environment}`);
    if (config_1.config.features.enableSwagger) {
        console.log(`📚 API Docs: http://localhost:${config_1.config.port}/api/docs`);
    }
});
server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        logger_1.logger.error(`Port ${config_1.config.port} is already in use`);
    }
    else {
        logger_1.logger.error("Server error", {}, error);
    }
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map
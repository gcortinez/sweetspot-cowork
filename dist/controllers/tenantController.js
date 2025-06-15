"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantController = void 0;
const tenantService_1 = require("../services/tenantService");
const zod_1 = require("zod");
const createTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    slug: zod_1.z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/),
    domain: zod_1.z.string().url().optional(),
    logo: zod_1.z.string().url().optional(),
    description: zod_1.z.string().max(500).optional(),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
    adminUser: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        firstName: zod_1.z.string().min(1).max(50),
        lastName: zod_1.z.string().min(1).max(50),
    }),
});
const updateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    slug: zod_1.z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
    domain: zod_1.z.string().url().optional(),
    logo: zod_1.z.string().url().optional(),
    description: zod_1.z.string().max(500).optional(),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
    status: zod_1.z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});
const paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional(),
    limit: zod_1.z
        .string()
        .transform(Number)
        .pipe(zod_1.z.number().min(1).max(100))
        .optional(),
    status: zod_1.z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});
class TenantController {
    static async createTenant(req, res) {
        try {
            const validatedData = createTenantSchema.parse(req.body);
            if (!tenantService_1.TenantService.validateSlug(validatedData.slug)) {
                res.status(400).json({
                    error: "Invalid slug format",
                    message: "Slug must be lowercase, alphanumeric with hyphens, 3-50 characters",
                    code: "INVALID_SLUG_FORMAT",
                });
                return;
            }
            const tenant = await tenantService_1.TenantService.createTenant(validatedData);
            res.status(201).json({
                success: true,
                data: tenant,
                message: "Tenant created successfully",
            });
        }
        catch (error) {
            console.error("Error creating tenant:", error);
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: "Validation error",
                    details: error.errors,
                    code: "VALIDATION_ERROR",
                });
                return;
            }
            if (error instanceof Error) {
                if (error.message.includes("already exists")) {
                    res.status(409).json({
                        error: error.message,
                        code: "TENANT_ALREADY_EXISTS",
                    });
                    return;
                }
            }
            res.status(500).json({
                error: "Failed to create tenant",
                code: "TENANT_CREATION_ERROR",
            });
        }
    }
    static async getAllTenants(req, res) {
        try {
            const { page = 1, limit = 10, status, } = paginationSchema.parse(req.query);
            const result = await tenantService_1.TenantService.getAllTenants(page, limit, status);
            res.json({
                success: true,
                data: result.tenants,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                },
            });
        }
        catch (error) {
            console.error("Error getting tenants:", error);
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: "Validation error",
                    details: error.errors,
                    code: "VALIDATION_ERROR",
                });
                return;
            }
            res.status(500).json({
                error: "Failed to get tenants",
                code: "TENANT_FETCH_ERROR",
            });
        }
    }
    static async getTenantById(req, res) {
        try {
            const { tenantId } = req.params;
            if (!tenantId) {
                res.status(400).json({
                    error: "Tenant ID is required",
                    code: "MISSING_TENANT_ID",
                });
                return;
            }
            const tenant = await tenantService_1.TenantService.getTenantById(tenantId);
            if (!tenant) {
                res.status(404).json({
                    error: "Tenant not found",
                    code: "TENANT_NOT_FOUND",
                });
                return;
            }
            res.json({
                success: true,
                data: tenant,
            });
        }
        catch (error) {
            console.error("Error getting tenant:", error);
            res.status(500).json({
                error: "Failed to get tenant",
                code: "TENANT_FETCH_ERROR",
            });
        }
    }
    static async getTenantBySlug(req, res) {
        try {
            const { slug } = req.params;
            if (!slug) {
                res.status(400).json({
                    error: "Tenant slug is required",
                    code: "MISSING_TENANT_SLUG",
                });
                return;
            }
            const tenant = await tenantService_1.TenantService.getTenantBySlug(slug);
            if (!tenant) {
                res.status(404).json({
                    error: "Tenant not found",
                    code: "TENANT_NOT_FOUND",
                });
                return;
            }
            res.json({
                success: true,
                data: tenant,
            });
        }
        catch (error) {
            console.error("Error getting tenant by slug:", error);
            res.status(500).json({
                error: "Failed to get tenant",
                code: "TENANT_FETCH_ERROR",
            });
        }
    }
    static async updateTenant(req, res) {
        try {
            const { tenantId } = req.params;
            if (!tenantId) {
                res.status(400).json({
                    error: "Tenant ID is required",
                    code: "MISSING_TENANT_ID",
                });
                return;
            }
            const validatedData = updateTenantSchema.parse(req.body);
            if (validatedData.slug &&
                !tenantService_1.TenantService.validateSlug(validatedData.slug)) {
                res.status(400).json({
                    error: "Invalid slug format",
                    message: "Slug must be lowercase, alphanumeric with hyphens, 3-50 characters",
                    code: "INVALID_SLUG_FORMAT",
                });
                return;
            }
            const tenant = await tenantService_1.TenantService.updateTenant(tenantId, validatedData);
            res.json({
                success: true,
                data: tenant,
                message: "Tenant updated successfully",
            });
        }
        catch (error) {
            console.error("Error updating tenant:", error);
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: "Validation error",
                    details: error.errors,
                    code: "VALIDATION_ERROR",
                });
                return;
            }
            if (error instanceof Error) {
                if (error.message.includes("already exists")) {
                    res.status(409).json({
                        error: error.message,
                        code: "TENANT_ALREADY_EXISTS",
                    });
                    return;
                }
                if (error.message.includes("Failed to get tenant")) {
                    res.status(404).json({
                        error: "Tenant not found",
                        code: "TENANT_NOT_FOUND",
                    });
                    return;
                }
            }
            res.status(500).json({
                error: "Failed to update tenant",
                code: "TENANT_UPDATE_ERROR",
            });
        }
    }
    static async deleteTenant(req, res) {
        try {
            const { tenantId } = req.params;
            const { hard } = req.query;
            if (!tenantId) {
                res.status(400).json({
                    error: "Tenant ID is required",
                    code: "MISSING_TENANT_ID",
                });
                return;
            }
            const hardDelete = hard === "true";
            await tenantService_1.TenantService.deleteTenant(tenantId, hardDelete);
            res.json({
                success: true,
                message: hardDelete
                    ? "Tenant permanently deleted"
                    : "Tenant deactivated successfully",
            });
        }
        catch (error) {
            console.error("Error deleting tenant:", error);
            if (error instanceof Error && error.message.includes("Failed to")) {
                res.status(404).json({
                    error: "Tenant not found",
                    code: "TENANT_NOT_FOUND",
                });
                return;
            }
            res.status(500).json({
                error: "Failed to delete tenant",
                code: "TENANT_DELETE_ERROR",
            });
        }
    }
    static async suspendTenant(req, res) {
        try {
            const { tenantId } = req.params;
            if (!tenantId) {
                res.status(400).json({
                    error: "Tenant ID is required",
                    code: "MISSING_TENANT_ID",
                });
                return;
            }
            const tenant = await tenantService_1.TenantService.suspendTenant(tenantId);
            res.json({
                success: true,
                data: tenant,
                message: "Tenant suspended successfully",
            });
        }
        catch (error) {
            console.error("Error suspending tenant:", error);
            if (error instanceof Error && error.message.includes("Failed to")) {
                res.status(404).json({
                    error: "Tenant not found",
                    code: "TENANT_NOT_FOUND",
                });
                return;
            }
            res.status(500).json({
                error: "Failed to suspend tenant",
                code: "TENANT_SUSPEND_ERROR",
            });
        }
    }
    static async activateTenant(req, res) {
        try {
            const { tenantId } = req.params;
            if (!tenantId) {
                res.status(400).json({
                    error: "Tenant ID is required",
                    code: "MISSING_TENANT_ID",
                });
                return;
            }
            const tenant = await tenantService_1.TenantService.activateTenant(tenantId);
            res.json({
                success: true,
                data: tenant,
                message: "Tenant activated successfully",
            });
        }
        catch (error) {
            console.error("Error activating tenant:", error);
            if (error instanceof Error && error.message.includes("Failed to")) {
                res.status(404).json({
                    error: "Tenant not found",
                    code: "TENANT_NOT_FOUND",
                });
                return;
            }
            res.status(500).json({
                error: "Failed to activate tenant",
                code: "TENANT_ACTIVATE_ERROR",
            });
        }
    }
    static async getTenantStats(req, res) {
        try {
            const { tenantId } = req.params;
            if (!tenantId) {
                res.status(400).json({
                    error: "Tenant ID is required",
                    code: "MISSING_TENANT_ID",
                });
                return;
            }
            const stats = await tenantService_1.TenantService.getTenantStats(tenantId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error("Error getting tenant stats:", error);
            res.status(500).json({
                error: "Failed to get tenant statistics",
                code: "TENANT_STATS_ERROR",
            });
        }
    }
    static async generateSlug(req, res) {
        try {
            const { name } = req.body;
            if (!name || typeof name !== "string") {
                res.status(400).json({
                    error: "Name is required",
                    code: "MISSING_NAME",
                });
                return;
            }
            const slug = await tenantService_1.TenantService.generateSlugFromName(name);
            res.json({
                success: true,
                data: { slug },
            });
        }
        catch (error) {
            console.error("Error generating slug:", error);
            res.status(500).json({
                error: "Failed to generate slug",
                code: "SLUG_GENERATION_ERROR",
            });
        }
    }
    static async checkSlugAvailability(req, res) {
        try {
            const { slug } = req.params;
            if (!slug) {
                res.status(400).json({
                    error: "Slug is required",
                    code: "MISSING_SLUG",
                });
                return;
            }
            if (!tenantService_1.TenantService.validateSlug(slug)) {
                res.status(400).json({
                    error: "Invalid slug format",
                    message: "Slug must be lowercase, alphanumeric with hyphens, 3-50 characters",
                    code: "INVALID_SLUG_FORMAT",
                });
                return;
            }
            const existingTenant = await tenantService_1.TenantService.getTenantBySlug(slug);
            const available = !existingTenant;
            res.json({
                success: true,
                data: {
                    slug,
                    available,
                    message: available ? "Slug is available" : "Slug is already taken",
                },
            });
        }
        catch (error) {
            console.error("Error checking slug availability:", error);
            res.status(500).json({
                error: "Failed to check slug availability",
                code: "SLUG_CHECK_ERROR",
            });
        }
    }
}
exports.TenantController = TenantController;
//# sourceMappingURL=tenantController.js.map
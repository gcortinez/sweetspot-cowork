import { Response } from "express";
import { BaseRequest, ErrorCode } from "../types/api";
import {
  TenantService,
  CreateTenantRequest,
  UpdateTenantRequest,
} from "../services/tenantService";
import { z } from "zod";

// Validation schemas
const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
  adminUser: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
  }),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  domain: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});

/**
 * Tenant Controller
 * Handles HTTP requests for tenant management
 */
export class TenantController {
  /**
   * Create a new tenant
   * POST /api/tenants
   */
  static async createTenant(req: BaseRequest, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = createTenantSchema.parse(req.body);

      // Validate slug format
      if (!TenantService.validateSlug(validatedData.slug)) {
        res.status(400).json({
          error: "Invalid slug format",
          message:
            "Slug must be lowercase, alphanumeric with hyphens, 3-50 characters",
          code: "INVALID_SLUG_FORMAT",
        });
        return;
      }

      // Create tenant
      const tenant = await TenantService.createTenant(validatedData);

      res.status(201).json({
        success: true,
        data: tenant,
        message: "Tenant created successfully",
      });
    } catch (error) {
      console.error("Error creating tenant:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (error instanceof Error) {
        if (error instanceof Error && error.message.includes("already exists")) {
          res.status(409).json({
            error: (error as Error).message,
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

  /**
   * Get all tenants (super admin only)
   * GET /api/tenants
   */
  static async getAllTenants(req: BaseRequest, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const {
        page = 1,
        limit = 10,
        status,
      } = paginationSchema.parse(req.query);

      // Get tenants
      const result = await TenantService.getAllTenants(page, limit, { status });

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
    } catch (error) {
      console.error("Error getting tenants:", error);

      if (error instanceof z.ZodError) {
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

  /**
   * Get tenant by ID
   * GET /api/tenants/:tenantId
   */
  static async getTenantById(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          error: "Tenant ID is required",
          code: "MISSING_TENANT_ID",
        });
        return;
      }

      const tenant = await TenantService.getTenantById(tenantId);

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
    } catch (error) {
      console.error("Error getting tenant:", error);
      res.status(500).json({
        error: "Failed to get tenant",
        code: "TENANT_FETCH_ERROR",
      });
    }
  }

  /**
   * Get tenant by slug
   * GET /api/tenants/slug/:slug
   */
  static async getTenantBySlug(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      if (!slug) {
        res.status(400).json({
          error: "Tenant slug is required",
          code: "MISSING_TENANT_SLUG",
        });
        return;
      }

      const tenant = await TenantService.getTenantBySlug(slug);

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
    } catch (error) {
      console.error("Error getting tenant by slug:", error);
      res.status(500).json({
        error: "Failed to get tenant",
        code: "TENANT_FETCH_ERROR",
      });
    }
  }

  /**
   * Update tenant
   * PUT /api/tenants/:tenantId
   */
  static async updateTenant(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          error: "Tenant ID is required",
          code: "MISSING_TENANT_ID",
        });
        return;
      }

      // Validate request body
      const validatedData = updateTenantSchema.parse(req.body);

      // Validate slug format if provided
      if (
        validatedData.slug &&
        !TenantService.validateSlug(validatedData.slug)
      ) {
        res.status(400).json({
          error: "Invalid slug format",
          message:
            "Slug must be lowercase, alphanumeric with hyphens, 3-50 characters",
          code: "INVALID_SLUG_FORMAT",
        });
        return;
      }

      // Update tenant
      const tenant = await TenantService.updateTenant(tenantId, validatedData);

      res.json({
        success: true,
        data: tenant,
        message: "Tenant updated successfully",
      });
    } catch (error) {
      console.error("Error updating tenant:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (error instanceof Error) {
        if (error instanceof Error && error.message.includes("already exists")) {
          res.status(409).json({
            error: (error as Error).message,
            code: "TENANT_ALREADY_EXISTS",
          });
          return;
        }
        if (error instanceof Error && error.message.includes("Failed to get tenant")) {
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

  /**
   * Delete tenant (soft delete)
   * DELETE /api/tenants/:tenantId
   */
  static async deleteTenant(req: BaseRequest, res: Response): Promise<void> {
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

      await TenantService.deleteTenant(tenantId, hardDelete);

      res.json({
        success: true,
        message: hardDelete
          ? "Tenant permanently deleted"
          : "Tenant deactivated successfully",
      });
    } catch (error) {
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

  /**
   * Suspend tenant
   * POST /api/tenants/:tenantId/suspend
   */
  static async suspendTenant(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          error: "Tenant ID is required",
          code: "MISSING_TENANT_ID",
        });
        return;
      }

      const tenant = await TenantService.suspendTenant(tenantId);

      res.json({
        success: true,
        data: tenant,
        message: "Tenant suspended successfully",
      });
    } catch (error) {
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

  /**
   * Activate tenant
   * POST /api/tenants/:tenantId/activate
   */
  static async activateTenant(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          error: "Tenant ID is required",
          code: "MISSING_TENANT_ID",
        });
        return;
      }

      const tenant = await TenantService.activateTenant(tenantId);

      res.json({
        success: true,
        data: tenant,
        message: "Tenant activated successfully",
      });
    } catch (error) {
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

  /**
   * Get tenant statistics
   * GET /api/tenants/:tenantId/stats
   */
  static async getTenantStats(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          error: "Tenant ID is required",
          code: "MISSING_TENANT_ID",
        });
        return;
      }

      const stats = await TenantService.getTenantStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting tenant stats:", error);
      res.status(500).json({
        error: "Failed to get tenant statistics",
        code: "TENANT_STATS_ERROR",
      });
    }
  }

  /**
   * Generate slug from name
   * POST /api/tenants/generate-slug
   */
  static async generateSlug(req: BaseRequest, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string") {
        res.status(400).json({
          error: "Name is required",
          code: "MISSING_NAME",
        });
        return;
      }

      const slug = await TenantService.generateSlugFromName(name);

      res.json({
        success: true,
        data: { slug },
      });
    } catch (error) {
      console.error("Error generating slug:", error);
      res.status(500).json({
        error: "Failed to generate slug",
        code: "SLUG_GENERATION_ERROR",
      });
    }
  }

  /**
   * Check slug availability
   * GET /api/tenants/check-slug/:slug
   */
  static async checkSlugAvailability(
    req: BaseRequest,
    res: Response
  ): Promise<void> {
    try {
      const { slug } = req.params;

      if (!slug) {
        res.status(400).json({
          error: "Slug is required",
          code: "MISSING_SLUG",
        });
        return;
      }

      // Validate slug format
      if (!TenantService.validateSlug(slug)) {
        res.status(400).json({
          error: "Invalid slug format",
          message:
            "Slug must be lowercase, alphanumeric with hyphens, 3-50 characters",
          code: "INVALID_SLUG_FORMAT",
        });
        return;
      }

      const existingTenant = await TenantService.getTenantBySlug(slug);
      const available = !existingTenant;

      res.json({
        success: true,
        data: {
          slug,
          available,
          message: available ? "Slug is available" : "Slug is already taken",
        },
      });
    } catch (error) {
      console.error("Error checking slug availability:", error);
      res.status(500).json({
        error: "Failed to check slug availability",
        code: "SLUG_CHECK_ERROR",
      });
    }
  }
}

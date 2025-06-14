import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";
import { ResponseHelper } from "./response";
import { logger } from "./logger";

// Validation target types
export type ValidationTarget = "body" | "query" | "params" | "headers";

// Validation options
export interface ValidationOptions {
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

// Create validation middleware
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = "body",
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      
      // Parse and validate data
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const validationErrors = formatZodErrors(result.error);
        
        logger.warn("Validation failed", {
          target,
          errors: validationErrors,
          data: target === "body" ? req.body : data,
          path: req.path,
          method: req.method,
        });

        return ResponseHelper.validationError(
          res,
          "Validation failed",
          { errors: validationErrors },
          validationErrors[0]?.field
        );
      }

      // Replace the original data with validated/transformed data
      req[target] = result.data;
      
      next();
    } catch (error) {
      logger.error("Validation middleware error", {
        target,
        error: error instanceof Error ? error.message : "Unknown error",
      }, error as Error);
      
      return ResponseHelper.internalError(res, "Validation processing failed");
    }
  };
}

// Validate request body
export const validateBody = (schema: ZodSchema, options?: ValidationOptions) => 
  validate(schema, "body", options);

// Validate query parameters
export const validateQuery = (schema: ZodSchema, options?: ValidationOptions) => 
  validate(schema, "query", options);

// Validate URL parameters
export const validateParams = (schema: ZodSchema, options?: ValidationOptions) => 
  validate(schema, "params", options);

// Validate headers
export const validateHeaders = (schema: ZodSchema, options?: ValidationOptions) => 
  validate(schema, "headers", options);

// Format Zod validation errors
export function formatZodErrors(error: ZodError): Array<{
  field: string;
  message: string;
  code: string;
  value?: any;
}> {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
    value: err.code !== "invalid_type" ? err.input : undefined,
  }));
}

// Validate data without middleware (utility function)
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ReturnType<typeof formatZodErrors> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { 
    success: false, 
    errors: formatZodErrors(result.error) 
  };
}

// Async validation wrapper
export async function validateAsync<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Validation failed: ${formatZodErrors(result.error).map(e => e.message).join(", ")}`);
  }
  
  return result.data;
}

// Multi-target validation middleware
export function validateMultiple(validations: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}, options: ValidationOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{
      target: ValidationTarget;
      field: string;
      message: string;
      code: string;
    }> = [];

    // Validate each target
    for (const [target, schema] of Object.entries(validations) as [ValidationTarget, ZodSchema][]) {
      if (schema) {
        const result = schema.safeParse(req[target]);
        
        if (!result.success) {
          const targetErrors = formatZodErrors(result.error).map(err => ({
            target,
            ...err,
          }));
          errors.push(...targetErrors);
        } else {
          // Update request with validated data
          req[target] = result.data;
        }
      }
    }

    if (errors.length > 0) {
      logger.warn("Multi-target validation failed", {
        errors,
        path: req.path,
        method: req.method,
      });

      return ResponseHelper.validationError(
        res,
        "Validation failed",
        { errors },
        errors[0]?.field
      );
    }

    next();
  };
}

// Conditional validation
export function validateConditional(
  condition: (req: Request) => boolean,
  schema: ZodSchema,
  target: ValidationTarget = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return validate(schema, target)(req, res, next);
    }
    next();
  };
}

// File upload validation
export function validateFileUpload(options: {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  required?: boolean;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    const files = req.files;

    if (!file && !files && options.required) {
      return ResponseHelper.badRequest(res, "File upload is required");
    }

    if (!file && !files) {
      return next();
    }

    const filesToValidate = file ? [file] : Array.isArray(files) ? files : Object.values(files).flat();

    for (const uploadedFile of filesToValidate) {
      // Check file size
      if (options.maxSize && uploadedFile.size > options.maxSize) {
        return ResponseHelper.fileTooLarge(res, `${options.maxSize / 1024 / 1024}MB`);
      }

      // Check MIME type
      if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(uploadedFile.mimetype)) {
        return ResponseHelper.invalidFileType(res, options.allowedMimeTypes);
      }
    }

    next();
  };
}

// Create reusable validation schemas for common patterns
export const CommonValidations = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().uuid("Invalid ID format"),
  }),

  // Pagination query validation
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1 && n <= 100).default("10"),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),

  // Search query validation
  search: z.object({
    q: z.string().min(1).max(255).optional(),
    ...CommonValidations.pagination.shape,
  }),

  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine(
    data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    { message: "Start date must be before or equal to end date", path: ["endDate"] }
  ),
};

// Validation error class
export class ValidationError extends Error {
  public errors: ReturnType<typeof formatZodErrors>;

  constructor(zodError: ZodError) {
    const errors = formatZodErrors(zodError);
    super(`Validation failed: ${errors.map(e => e.message).join(", ")}`);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

// Transform helpers for common validation patterns
export const ValidationTransforms = {
  // Trim strings
  trimString: z.string().transform(s => s.trim()),
  
  // Convert string to number
  stringToNumber: z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  
  // Convert string to integer
  stringToInt: z.string().regex(/^\d+$/).transform(Number),
  
  // Convert string to boolean
  stringToBoolean: z.string().regex(/^(true|false|1|0)$/i).transform(s => 
    s.toLowerCase() === "true" || s === "1"
  ),
  
  // Split comma-separated string to array
  csvToArray: z.string().transform(s => s.split(",").map(item => item.trim()).filter(Boolean)),
  
  // Convert to lowercase
  toLowerCase: z.string().transform(s => s.toLowerCase()),
  
  // Convert to uppercase
  toUpperCase: z.string().transform(s => s.toUpperCase()),
};

// Validation middleware factory with common patterns
export const createValidationMiddleware = {
  // Create CRUD validation middleware
  crud: (schemas: {
    create?: ZodSchema;
    update?: ZodSchema;
    query?: ZodSchema;
  }) => ({
    create: schemas.create ? validateBody(schemas.create) : undefined,
    update: schemas.update ? validateBody(schemas.update) : undefined,
    query: schemas.query ? validateQuery(schemas.query) : undefined,
    params: validateParams(CommonValidations.idParam),
  }),

  // Create pagination middleware
  paginated: (querySchema?: ZodSchema) => {
    const schema = querySchema 
      ? querySchema.extend(CommonValidations.pagination.shape)
      : CommonValidations.pagination;
    return validateQuery(schema);
  },

  // Create search middleware
  searchable: (querySchema?: ZodSchema) => {
    const schema = querySchema
      ? querySchema.extend(CommonValidations.search.shape)
      : CommonValidations.search;
    return validateQuery(schema);
  },
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  validateMultiple,
  validateConditional,
  validateFileUpload,
  validateData,
  validateAsync,
  formatZodErrors,
  ValidationError,
  CommonValidations,
  ValidationTransforms,
  createValidationMiddleware,
};
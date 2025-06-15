import { z } from "zod";

// Common field validators
export const idSchema = z.string().uuid("Invalid ID format");

export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email must be less than 255 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL must be less than 2048 characters")
  .optional();

// Date schemas
export const dateSchema = z
  .string()
  .datetime("Invalid date format")
  .or(z.date())
  .transform((val) => (typeof val === "string" ? new Date(val) : val));

export const dateRangeSchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  {
    message: "Start date must be before or equal to end date",
    path: ["to"],
  }
);

// Pagination schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, "Page must be at least 1")
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100")
    .default("10"),
  sortBy: z.string().max(50, "Sort field name too long").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Search schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(255, "Search query too long")
    .optional(),
  ...paginationSchema.shape,
});

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(255, "Street too long"),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: z.string().min(1, "State is required").max(100, "State name too long"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code too long"),
  country: z
    .string()
    .min(2, "Country code required")
    .max(2, "Country code must be 2 characters")
    .regex(/^[A-Z]{2}$/, "Country code must be uppercase letters"),
});

// Money/Currency schemas
export const moneySchema = z.object({
  amount: z
    .number()
    .nonnegative("Amount must be non-negative")
    .max(999999999.99, "Amount too large"),
  currency: z
    .string()
    .length(3, "Currency code must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must be uppercase letters")
    .default("USD"),
});

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required").max(255, "Filename too long"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().positive("File size must be positive").max(10485760, "File too large (max 10MB)"),
  url: urlSchema,
});

// Coordinates schema
export const coordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

// Color schema (hex color)
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format")
  .optional();

// Enum helpers
export const createEnumSchema = <T extends [string, ...string[]]>(
  values: T,
  errorMessage?: string
) => {
  return z.enum(values, {
    errorMap: () => ({
      message: errorMessage || `Must be one of: ${values.join(", ")}`,
    }),
  });
};

// Validation helpers
export const validateRequired = <T>(
  schema: z.ZodSchema<T>,
  fieldName: string
) => {
  return schema.refine((val) => val !== undefined && val !== null, {
    message: `${fieldName} is required`,
  });
};

export const validateOptional = <T>(schema: z.ZodSchema<T>) => {
  return schema.optional().nullable();
};

// Array validation
export const createArraySchema = <T>(
  itemSchema: z.ZodSchema<T>,
  options?: {
    minLength?: number;
    maxLength?: number;
    unique?: boolean;
  }
) => {
  let arraySchema = z.array(itemSchema);

  if (options?.minLength) {
    arraySchema = arraySchema.min(options.minLength, `Array must have at least ${options.minLength} items`);
  }

  if (options?.maxLength) {
    arraySchema = arraySchema.max(options.maxLength, `Array must have at most ${options.maxLength} items`);
  }

  if (options?.unique) {
    arraySchema = arraySchema.refine(
      (arr) => new Set(arr).size === arr.length,
      { message: "Array items must be unique" }
    );
  }

  return arraySchema;
};

// Conditional validation
export const conditionalSchema = <T, U>(
  condition: (data: any) => boolean,
  schema: z.ZodSchema<T>,
  fallbackSchema?: z.ZodSchema<U>
) => {
  return z.any().superRefine((data, ctx) => {
    if (condition(data)) {
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue(issue);
        });
      }
    } else if (fallbackSchema) {
      const result = fallbackSchema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue(issue);
        });
      }
    }
  });
};

// Transform helpers
export const stringToNumber = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
  .transform((val) => parseFloat(val));

export const stringToInt = z
  .string()
  .regex(/^\d+$/, "Must be a valid integer")
  .transform((val) => parseInt(val, 10));

export const stringToBoolean = z
  .string()
  .regex(/^(true|false|1|0)$/i, "Must be a valid boolean")
  .transform((val) => val.toLowerCase() === "true" || val === "1");

export const trimmedString = z
  .string()
  .transform((val) => val.trim());

export const lowercaseString = z
  .string()
  .transform((val) => val.toLowerCase());

export const uppercaseString = z
  .string()
  .transform((val) => val.toUpperCase());

// Metadata schema for flexible data storage
export const metadataSchema = z
  .record(z.any())
  .refine(
    (data) => {
      try {
        JSON.stringify(data);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Metadata must be JSON serializable" }
  )
  .optional();

// Common response schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  meta: z.object({
    timestamp: z.string(),
    version: z.string(),
    requestId: z.string().optional(),
  }),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    field: z.string().optional(),
    timestamp: z.string(),
  }),
  meta: z.object({
    timestamp: z.string(),
    version: z.string(),
    requestId: z.string().optional(),
  }),
});

// Export all schemas
export default {
  idSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  urlSchema,
  dateSchema,
  dateRangeSchema,
  paginationSchema,
  searchSchema,
  addressSchema,
  moneySchema,
  fileUploadSchema,
  coordinatesSchema,
  colorSchema,
  metadataSchema,
  successResponseSchema,
  errorResponseSchema,
};
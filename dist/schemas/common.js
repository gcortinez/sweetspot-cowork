"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseSchema = exports.successResponseSchema = exports.metadataSchema = exports.uppercaseString = exports.lowercaseString = exports.trimmedString = exports.stringToBoolean = exports.stringToInt = exports.stringToNumber = exports.conditionalSchema = exports.createArraySchema = exports.validateOptional = exports.validateRequired = exports.createEnumSchema = exports.colorSchema = exports.coordinatesSchema = exports.fileUploadSchema = exports.moneySchema = exports.addressSchema = exports.searchSchema = exports.paginationSchema = exports.dateRangeSchema = exports.dateSchema = exports.urlSchema = exports.phoneSchema = exports.passwordSchema = exports.emailSchema = exports.idSchema = void 0;
const zod_1 = require("zod");
exports.idSchema = zod_1.z.string().uuid("Invalid ID format");
exports.emailSchema = zod_1.z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters");
exports.passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional();
exports.urlSchema = zod_1.z
    .string()
    .url("Invalid URL format")
    .max(2048, "URL must be less than 2048 characters")
    .optional();
exports.dateSchema = zod_1.z
    .string()
    .datetime("Invalid date format")
    .or(zod_1.z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val));
exports.dateRangeSchema = zod_1.z.object({
    from: exports.dateSchema.optional(),
    to: exports.dateSchema.optional(),
}).refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "Start date must be before or equal to end date",
    path: ["to"],
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .regex(/^\d+$/, "Page must be a positive integer")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1, "Page must be at least 1")
        .default("1"),
    limit: zod_1.z
        .string()
        .regex(/^\d+$/, "Limit must be a positive integer")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100")
        .default("10"),
    sortBy: zod_1.z.string().max(50, "Sort field name too long").optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("asc"),
});
exports.searchSchema = zod_1.z.object({
    query: zod_1.z
        .string()
        .min(1, "Search query cannot be empty")
        .max(255, "Search query too long")
        .optional(),
    ...exports.paginationSchema.shape,
});
exports.addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, "Street is required").max(255, "Street too long"),
    city: zod_1.z.string().min(1, "City is required").max(100, "City name too long"),
    state: zod_1.z.string().min(1, "State is required").max(100, "State name too long"),
    postalCode: zod_1.z
        .string()
        .min(1, "Postal code is required")
        .max(20, "Postal code too long"),
    country: zod_1.z
        .string()
        .min(2, "Country code required")
        .max(2, "Country code must be 2 characters")
        .regex(/^[A-Z]{2}$/, "Country code must be uppercase letters"),
});
exports.moneySchema = zod_1.z.object({
    amount: zod_1.z
        .number()
        .nonnegative("Amount must be non-negative")
        .max(999999999.99, "Amount too large"),
    currency: zod_1.z
        .string()
        .length(3, "Currency code must be 3 characters")
        .regex(/^[A-Z]{3}$/, "Currency code must be uppercase letters")
        .default("USD"),
});
exports.fileUploadSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1, "Filename is required").max(255, "Filename too long"),
    mimeType: zod_1.z.string().min(1, "MIME type is required"),
    size: zod_1.z.number().positive("File size must be positive").max(10485760, "File too large (max 10MB)"),
    url: exports.urlSchema,
});
exports.coordinatesSchema = zod_1.z.object({
    latitude: zod_1.z
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),
    longitude: zod_1.z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180"),
});
exports.colorSchema = zod_1.z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color format")
    .optional();
const createEnumSchema = (values, errorMessage) => {
    return zod_1.z.enum(values, {
        errorMap: () => ({
            message: errorMessage || `Must be one of: ${values.join(", ")}`,
        }),
    });
};
exports.createEnumSchema = createEnumSchema;
const validateRequired = (schema, fieldName) => {
    return schema.refine((val) => val !== undefined && val !== null, {
        message: `${fieldName} is required`,
    });
};
exports.validateRequired = validateRequired;
const validateOptional = (schema) => {
    return schema.optional().nullable();
};
exports.validateOptional = validateOptional;
const createArraySchema = (itemSchema, options) => {
    let arraySchema = zod_1.z.array(itemSchema);
    if (options?.minLength) {
        arraySchema = arraySchema.min(options.minLength, `Array must have at least ${options.minLength} items`);
    }
    if (options?.maxLength) {
        arraySchema = arraySchema.max(options.maxLength, `Array must have at most ${options.maxLength} items`);
    }
    if (options?.unique) {
        arraySchema = arraySchema.refine((arr) => new Set(arr).size === arr.length, { message: "Array items must be unique" });
    }
    return arraySchema;
};
exports.createArraySchema = createArraySchema;
const conditionalSchema = (condition, schema, fallbackSchema) => {
    return zod_1.z.any().superRefine((data, ctx) => {
        if (condition(data)) {
            const result = schema.safeParse(data);
            if (!result.success) {
                result.error.issues.forEach((issue) => {
                    ctx.addIssue(issue);
                });
            }
        }
        else if (fallbackSchema) {
            const result = fallbackSchema.safeParse(data);
            if (!result.success) {
                result.error.issues.forEach((issue) => {
                    ctx.addIssue(issue);
                });
            }
        }
    });
};
exports.conditionalSchema = conditionalSchema;
exports.stringToNumber = zod_1.z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number")
    .transform((val) => parseFloat(val));
exports.stringToInt = zod_1.z
    .string()
    .regex(/^\d+$/, "Must be a valid integer")
    .transform((val) => parseInt(val, 10));
exports.stringToBoolean = zod_1.z
    .string()
    .regex(/^(true|false|1|0)$/i, "Must be a valid boolean")
    .transform((val) => val.toLowerCase() === "true" || val === "1");
exports.trimmedString = zod_1.z
    .string()
    .transform((val) => val.trim());
exports.lowercaseString = zod_1.z
    .string()
    .transform((val) => val.toLowerCase());
exports.uppercaseString = zod_1.z
    .string()
    .transform((val) => val.toUpperCase());
exports.metadataSchema = zod_1.z
    .record(zod_1.z.any())
    .refine((data) => {
    try {
        JSON.stringify(data);
        return true;
    }
    catch {
        return false;
    }
}, { message: "Metadata must be JSON serializable" })
    .optional();
exports.successResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    data: zod_1.z.any(),
    message: zod_1.z.string().optional(),
    meta: zod_1.z.object({
        timestamp: zod_1.z.string(),
        version: zod_1.z.string(),
        requestId: zod_1.z.string().optional(),
    }),
});
exports.errorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.any().optional(),
        field: zod_1.z.string().optional(),
        timestamp: zod_1.z.string(),
    }),
    meta: zod_1.z.object({
        timestamp: zod_1.z.string(),
        version: zod_1.z.string(),
        requestId: zod_1.z.string().optional(),
    }),
});
exports.default = {
    idSchema: exports.idSchema,
    emailSchema: exports.emailSchema,
    passwordSchema: exports.passwordSchema,
    phoneSchema: exports.phoneSchema,
    urlSchema: exports.urlSchema,
    dateSchema: exports.dateSchema,
    dateRangeSchema: exports.dateRangeSchema,
    paginationSchema: exports.paginationSchema,
    searchSchema: exports.searchSchema,
    addressSchema: exports.addressSchema,
    moneySchema: exports.moneySchema,
    fileUploadSchema: exports.fileUploadSchema,
    coordinatesSchema: exports.coordinatesSchema,
    colorSchema: exports.colorSchema,
    metadataSchema: exports.metadataSchema,
    successResponseSchema: exports.successResponseSchema,
    errorResponseSchema: exports.errorResponseSchema,
};
//# sourceMappingURL=common.js.map
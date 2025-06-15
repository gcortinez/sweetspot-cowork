"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidationMiddleware = exports.ValidationTransforms = exports.ValidationError = exports.CommonValidations = exports.validateHeaders = exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
exports.validate = validate;
exports.formatZodErrors = formatZodErrors;
exports.validateData = validateData;
exports.validateAsync = validateAsync;
exports.validateMultiple = validateMultiple;
exports.validateConditional = validateConditional;
exports.validateFileUpload = validateFileUpload;
const zod_1 = require("zod");
const response_1 = require("./response");
const logger_1 = require("./logger");
function validate(schema, target = "body", options = {}) {
    return (req, res, next) => {
        try {
            const data = req[target];
            const result = schema.safeParse(data);
            if (!result.success) {
                const validationErrors = formatZodErrors(result.error);
                logger_1.logger.warn("Validation failed", {
                    target,
                    errors: validationErrors,
                    data: target === "body" ? req.body : data,
                    path: req.path,
                    method: req.method,
                });
                return response_1.ResponseHelper.validationError(res, "Validation failed", { errors: validationErrors }, validationErrors[0]?.field);
            }
            req[target] = result.data;
            next();
        }
        catch (error) {
            logger_1.logger.error("Validation middleware error", {
                target,
                error: error instanceof Error ? error.message : "Unknown error",
            }, error);
            return response_1.ResponseHelper.internalError(res, "Validation processing failed");
        }
    };
}
const validateBody = (schema, options) => validate(schema, "body", options);
exports.validateBody = validateBody;
const validateQuery = (schema, options) => validate(schema, "query", options);
exports.validateQuery = validateQuery;
const validateParams = (schema, options) => validate(schema, "params", options);
exports.validateParams = validateParams;
const validateHeaders = (schema, options) => validate(schema, "headers", options);
exports.validateHeaders = validateHeaders;
function formatZodErrors(error) {
    return error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
        value: err.code !== "invalid_type" ? err.input : undefined,
    }));
}
function validateData(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: formatZodErrors(result.error)
    };
}
async function validateAsync(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Validation failed: ${formatZodErrors(result.error).map(e => e.message).join(", ")}`);
    }
    return result.data;
}
function validateMultiple(validations, options = {}) {
    return (req, res, next) => {
        const errors = [];
        for (const [target, schema] of Object.entries(validations)) {
            if (schema) {
                const result = schema.safeParse(req[target]);
                if (!result.success) {
                    const targetErrors = formatZodErrors(result.error).map(err => ({
                        target,
                        ...err,
                    }));
                    errors.push(...targetErrors);
                }
                else {
                    req[target] = result.data;
                }
            }
        }
        if (errors.length > 0) {
            logger_1.logger.warn("Multi-target validation failed", {
                errors,
                path: req.path,
                method: req.method,
            });
            return response_1.ResponseHelper.validationError(res, "Validation failed", { errors }, errors[0]?.field);
        }
        next();
    };
}
function validateConditional(condition, schema, target = "body") {
    return (req, res, next) => {
        if (condition(req)) {
            return validate(schema, target)(req, res, next);
        }
        next();
    };
}
function validateFileUpload(options) {
    return (req, res, next) => {
        const file = req.file;
        const files = req.files;
        if (!file && !files && options.required) {
            return response_1.ResponseHelper.badRequest(res, "File upload is required");
        }
        if (!file && !files) {
            return next();
        }
        const filesToValidate = file ? [file] : Array.isArray(files) ? files : Object.values(files).flat();
        for (const uploadedFile of filesToValidate) {
            if (options.maxSize && uploadedFile.size > options.maxSize) {
                return response_1.ResponseHelper.fileTooLarge(res, `${options.maxSize / 1024 / 1024}MB`);
            }
            if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(uploadedFile.mimetype)) {
                return response_1.ResponseHelper.invalidFileType(res, options.allowedMimeTypes);
            }
        }
        next();
    };
}
exports.CommonValidations = {
    idParam: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid ID format"),
    }),
    pagination: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1).default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1 && n <= 100).default("10"),
        sortBy: zod_1.z.string().max(50).optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).default("asc"),
    }),
    search: zod_1.z.object({
        q: zod_1.z.string().min(1).max(255).optional(),
        ...exports.CommonValidations.pagination.shape,
    }),
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }).refine(data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate), { message: "Start date must be before or equal to end date", path: ["endDate"] }),
};
class ValidationError extends Error {
    errors;
    constructor(zodError) {
        const errors = formatZodErrors(zodError);
        super(`Validation failed: ${errors.map(e => e.message).join(", ")}`);
        this.name = "ValidationError";
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
exports.ValidationTransforms = {
    trimString: zod_1.z.string().transform(s => s.trim()),
    stringToNumber: zod_1.z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
    stringToInt: zod_1.z.string().regex(/^\d+$/).transform(Number),
    stringToBoolean: zod_1.z.string().regex(/^(true|false|1|0)$/i).transform(s => s.toLowerCase() === "true" || s === "1"),
    csvToArray: zod_1.z.string().transform(s => s.split(",").map(item => item.trim()).filter(Boolean)),
    toLowerCase: zod_1.z.string().transform(s => s.toLowerCase()),
    toUpperCase: zod_1.z.string().transform(s => s.toUpperCase()),
};
exports.createValidationMiddleware = {
    crud: (schemas) => ({
        create: schemas.create ? (0, exports.validateBody)(schemas.create) : undefined,
        update: schemas.update ? (0, exports.validateBody)(schemas.update) : undefined,
        query: schemas.query ? (0, exports.validateQuery)(schemas.query) : undefined,
        params: (0, exports.validateParams)(exports.CommonValidations.idParam),
    }),
    paginated: (querySchema) => {
        const schema = querySchema
            ? querySchema.extend(exports.CommonValidations.pagination.shape)
            : exports.CommonValidations.pagination;
        return (0, exports.validateQuery)(schema);
    },
    searchable: (querySchema) => {
        const schema = querySchema
            ? querySchema.extend(exports.CommonValidations.search.shape)
            : exports.CommonValidations.search;
        return (0, exports.validateQuery)(schema);
    },
};
exports.default = {
    validate,
    validateBody: exports.validateBody,
    validateQuery: exports.validateQuery,
    validateParams: exports.validateParams,
    validateHeaders: exports.validateHeaders,
    validateMultiple,
    validateConditional,
    validateFileUpload,
    validateData,
    validateAsync,
    formatZodErrors,
    ValidationError,
    CommonValidations: exports.CommonValidations,
    ValidationTransforms: exports.ValidationTransforms,
    createValidationMiddleware: exports.createValidationMiddleware,
};
//# sourceMappingURL=validation.js.map
import { z } from 'zod'

/**
 * Common validation schemas and utilities for Server Actions
 */

// Basic field validators
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .transform(s => s.toLowerCase().trim())

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s\'-]*$/, 'Name contains invalid characters')
  .transform(s => s.trim())

// ID validation
export const uuidSchema = z.string().uuid('Invalid ID format')

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(50, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').max(255, 'Search query is too long').optional(),
})

// Date validation
export const dateSchema = z.string().datetime('Invalid date format')

export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).refine(
  data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date', path: ['endDate'] }
)

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
})

// Money/currency schema
export const moneySchema = z.object({
  amount: z.number().min(0, 'Amount cannot be negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
})

// File upload schema
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().min(1, 'File type is required'),
  size: z.number().min(1, 'File size must be greater than 0'),
})

// Coordinates schema
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

// Transform helpers
export const ValidationTransforms = {
  // Trim strings
  trimString: z.string().transform(s => s.trim()),
  
  // Convert string to number
  stringToNumber: z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  
  // Convert string to integer
  stringToInt: z.string().regex(/^\d+$/).transform(Number),
  
  // Convert string to boolean
  stringToBoolean: z.string().regex(/^(true|false|1|0)$/i).transform(s => 
    s.toLowerCase() === 'true' || s === '1'
  ),
  
  // Split comma-separated string to array
  csvToArray: z.string().transform(s => s.split(',').map(item => item.trim()).filter(Boolean)),
  
  // Convert to lowercase
  toLowerCase: z.string().transform(s => s.toLowerCase()),
  
  // Convert to uppercase
  toUpperCase: z.string().transform(s => s.toUpperCase()),
}

// Common validation patterns
export const CommonValidations = {
  // ID parameter validation
  idParam: z.object({
    id: uuidSchema,
  }),

  // Pagination with search
  paginatedSearch: paginationSchema.extend(searchSchema.shape),

  // Date range with pagination
  paginatedDateRange: paginationSchema.extend(dateRangeSchema.shape),

  // Full text search with filters
  searchWithFilters: searchSchema.extend({
    status: z.string().optional(),
    category: z.string().optional(),
    tags: ValidationTransforms.csvToArray.optional(),
  }),
}

// Validation error formatting
export function formatValidationErrors(error: z.ZodError): Array<{
  field: string
  message: string
  code: string
  value?: any
}> {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    value: 'input' in err ? err.input : undefined,
  }))
}

// Validation error class
export class ValidationError extends Error {
  public errors: ReturnType<typeof formatValidationErrors>

  constructor(zodError: z.ZodError) {
    const errors = formatValidationErrors(zodError)
    super(`Validation failed: ${errors.map(e => e.message).join(', ')}`)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

// Validate data utility
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ReturnType<typeof formatValidationErrors> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { 
    success: false, 
    errors: formatValidationErrors(result.error) 
  }
}

// Async validation wrapper
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    throw new ValidationError(result.error)
  }
  
  return result.data
}
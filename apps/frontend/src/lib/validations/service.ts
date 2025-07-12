import { z } from 'zod'

// Enums for service-related fields
export const ServiceTypeSchema = z.enum([
  'SPACE_RENTAL',
  'CATERING',
  'EQUIPMENT',
  'CLEANING',
  'SECURITY',
  'TECHNICAL_SUPPORT',
  'CONCIERGE',
  'PRINTING',
  'MAIL_HANDLING',
  'PARKING',
  'STORAGE',
  'WELLNESS',
  'NETWORKING',
  'CONSULTING',
  'TRAINING',
  'EVENT_PLANNING',
  'VIRTUAL_OFFICE',
  'TELECOMMUNICATIONS',
  'OTHER'
])

export const ServiceStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'MAINTENANCE',
  'TEMPORARILY_UNAVAILABLE',
  'SEASONAL',
  'DISCONTINUED'
])

export const ServiceCategorySchema = z.enum([
  'CORE_SERVICES',
  'ADD_ON_SERVICES',
  'PREMIUM_SERVICES',
  'PACKAGE_SERVICES',
  'CUSTOM_SERVICES',
  'RECURRING_SERVICES'
])

export const BookingModeSchema = z.enum([
  'IMMEDIATE',
  'SCHEDULED',
  'RECURRING',
  'ON_DEMAND',
  'ADVANCE_ONLY'
])

export const ServicePricingSchema = z.object({
  basePrice: z.number().min(0, 'Base price cannot be negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  pricingModel: z.enum(['FIXED', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'PER_PERSON', 'PER_ITEM', 'CUSTOM']),
  minimumCharge: z.number().min(0, 'Minimum charge cannot be negative').optional(),
  maximumCharge: z.number().min(0, 'Maximum charge cannot be negative').optional(),
  setupFee: z.number().min(0, 'Setup fee cannot be negative').optional(),
  cancellationFee: z.number().min(0, 'Cancellation fee cannot be negative').optional(),
  tiers: z.array(z.object({
    minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1'),
    maxQuantity: z.number().int().min(1, 'Maximum quantity must be at least 1').optional(),
    pricePerUnit: z.number().min(0, 'Price per unit cannot be negative'),
    discountPercentage: z.number().min(0).max(100).optional(),
  })).optional(),
})

export const ServiceAvailabilitySchema = z.object({
  isAlwaysAvailable: z.boolean().default(false),
  availableDays: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  availableHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  }).optional(),
  blackoutDates: z.array(z.object({
    start: z.date(),
    end: z.date(),
    reason: z.string().optional(),
  })).optional(),
  capacityLimit: z.number().int().min(1).optional(),
  advanceBookingRequired: z.number().int().min(0, 'Advance booking hours cannot be negative').default(0), // hours
  maxAdvanceBookingDays: z.number().int().min(1).default(90),
})

export const ServiceRequirementSchema = z.object({
  spaceTypes: z.array(z.string()).optional(), // Compatible space types
  minimumSpaceCapacity: z.number().int().min(1).optional(),
  requiredAmenities: z.array(z.string()).optional(),
  requiredEquipment: z.array(z.string()).optional(),
  staffRequired: z.number().int().min(0).default(0),
  setupTime: z.number().min(0).default(0), // in hours
  cleanupTime: z.number().min(0).default(0), // in hours
  specialInstructions: z.string().max(1000).optional(),
})

// Base service schema
export const baseServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  type: ServiceTypeSchema,
  category: ServiceCategorySchema.default('ADD_ON_SERVICES'),
  status: ServiceStatusSchema.default('ACTIVE'),
  bookingMode: BookingModeSchema.default('SCHEDULED'),
  pricing: ServicePricingSchema,
  availability: ServiceAvailabilitySchema,
  requirements: ServiceRequirementSchema.optional(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  tags: z.array(z.string().max(50)).default([]),
  duration: z.object({
    estimated: z.number().positive('Estimated duration must be positive'), // in hours
    minimum: z.number().positive('Minimum duration must be positive').optional(),
    maximum: z.number().positive('Maximum duration must be positive').optional(),
  }).optional(),
  cancellationPolicy: z.string().max(1000, 'Cancellation policy must be less than 1000 characters').optional(),
  termsAndConditions: z.string().max(2000, 'Terms and conditions must be less than 2000 characters').optional(),
  isActive: z.boolean().default(true),
  isBookable: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  allowRecurring: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
})

// Create service schema
export const createServiceSchema = baseServiceSchema

// Update service schema (all fields optional except ID)
export const updateServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
}).merge(baseServiceSchema.partial())

// Delete service schema
export const deleteServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
})

// Get service schema
export const getServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
})

// List services schema
export const listServicesSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: ServiceTypeSchema.optional(),
  category: ServiceCategorySchema.optional(),
  status: ServiceStatusSchema.optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isBookable: z.boolean().optional(),
  sortBy: z.enum(['name', 'type', 'category', 'basePrice', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Service availability check schema
export const checkServiceAvailabilitySchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  date: z.date({
    required_error: 'Date is required',
    invalid_type_error: 'Date must be a valid date',
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  duration: z.number().positive('Duration must be positive').optional(), // in hours
  spaceId: z.string().uuid('Invalid space ID').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
})

// Bulk update services schema
export const bulkUpdateServicesSchema = z.object({
  serviceIds: z.array(z.string().uuid('Invalid service ID')).min(1, 'At least one service ID is required'),
  updates: z.object({
    status: ServiceStatusSchema.optional(),
    category: ServiceCategorySchema.optional(),
    isActive: z.boolean().optional(),
    isBookable: z.boolean().optional(),
    basePrice: z.number().min(0).optional(),
    requiresApproval: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one update field is required',
    }
  ),
})

// Service statistics schema
export const getServiceStatsSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// Service pricing calculation schema
export const calculateServicePricingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  duration: z.number().positive('Duration must be positive').optional(), // in hours
  date: z.date({
    required_error: 'Date is required',
  }),
  clientId: z.string().uuid('Invalid client ID').optional(),
  discountCodes: z.array(z.string()).optional(),
  spaceId: z.string().uuid('Invalid space ID').optional(),
  additionalOptions: z.record(z.any()).optional(),
})

// Service package schema
export const servicePackageSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Package name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  services: z.array(z.object({
    serviceId: z.string().uuid('Invalid service ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
    isRequired: z.boolean().default(true),
    discountPercentage: z.number().min(0).max(100).optional(),
  })).min(1, 'Package must include at least one service'),
  packagePrice: z.number().min(0, 'Package price cannot be negative'),
  discountPercentage: z.number().min(0).max(100, 'Discount cannot exceed 100%').optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  isActive: z.boolean().default(true),
  minimumAdvanceBooking: z.number().int().min(0).default(0), // hours
  cancellationPolicy: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
})

export const createServicePackageSchema = servicePackageSchema.omit({ id: true })
export const updateServicePackageSchema = z.object({
  id: z.string().uuid('Invalid package ID'),
}).merge(servicePackageSchema.partial())

// Type exports
export type ServiceType = z.infer<typeof ServiceTypeSchema>
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>
export type BookingMode = z.infer<typeof BookingModeSchema>
export type ServicePricing = z.infer<typeof ServicePricingSchema>
export type ServiceAvailability = z.infer<typeof ServiceAvailabilitySchema>
export type ServiceRequirement = z.infer<typeof ServiceRequirementSchema>
export type ServicePackage = z.infer<typeof servicePackageSchema>

export type CreateServiceRequest = z.infer<typeof createServiceSchema>
export type UpdateServiceRequest = z.infer<typeof updateServiceSchema>
export type DeleteServiceRequest = z.infer<typeof deleteServiceSchema>
export type GetServiceRequest = z.infer<typeof getServiceSchema>
export type ListServicesRequest = z.infer<typeof listServicesSchema>
export type CheckServiceAvailabilityRequest = z.infer<typeof checkServiceAvailabilitySchema>
export type BulkUpdateServicesRequest = z.infer<typeof bulkUpdateServicesSchema>
export type GetServiceStatsRequest = z.infer<typeof getServiceStatsSchema>
export type CalculateServicePricingRequest = z.infer<typeof calculateServicePricingSchema>
export type CreateServicePackageRequest = z.infer<typeof createServicePackageSchema>
export type UpdateServicePackageRequest = z.infer<typeof updateServicePackageSchema>
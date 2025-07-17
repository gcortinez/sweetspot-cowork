import { z } from 'zod'
import { cuidSchema } from './common'

// Enums matching Prisma schema exactly
export const ServiceCategorySchema = z.enum([
  'PRINTING',
  'COFFEE', 
  'FOOD',
  'PARKING',
  'STORAGE',
  'MAIL',
  'PHONE',
  'INTERNET',
  'CLEANING',
  'BUSINESS_SUPPORT',
  'EVENT_SERVICES',
  'WELLNESS',
  'TRANSPORTATION',
  'CONSULTING',
  'MAINTENANCE'
])

export const ServiceTypeSchema = z.enum([
  'CONSUMABLE',    // Physical items that are consumed (coffee, printing)
  'SUBSCRIPTION',  // Recurring services (internet, phone)
  'ON_DEMAND',     // Services requested as needed (cleaning, maintenance)
  'APPOINTMENT'    // Scheduled services (consulting, wellness)
])

export const ServiceAvailabilitySchema = z.enum([
  'ALWAYS',        // Available 24/7
  'BUSINESS_HOURS', // Available during business hours
  'SCHEDULED',     // Available at specific times
  'ON_REQUEST'     // Available upon request
])

// Base service schema matching Prisma model exactly
export const baseServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: ServiceCategorySchema,
  price: z.number().min(0, 'Price cannot be negative'),
  unit: z.string().min(1, 'Unit is required').default('unit'),
  isActive: z.boolean().default(true),
  
  // Enhanced service catalog fields
  serviceType: ServiceTypeSchema.default('CONSUMABLE'),
  availability: ServiceAvailabilitySchema.default('ALWAYS'),
  maxQuantity: z.number().int().min(1).optional(),
  requiresApproval: z.boolean().default(false),
  estimatedDeliveryTime: z.string().optional(), // e.g., "2 hours", "Next business day"
  instructions: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  
  // Pricing configuration  
  pricingTiers: z.array(z.object({
    minQuantity: z.number().int().min(1),
    discountType: z.enum(['NONE', 'PERCENTAGE', 'FIXED', 'TIER_PRICE']),
    discount: z.number().optional(),
    price: z.number().optional(),
  })).default([]),
  dynamicPricing: z.boolean().default(false),
  minimumOrder: z.number().int().min(1).default(1),
})

// Create service schema
export const createServiceSchema = baseServiceSchema

// Update service schema (all fields optional except ID)
export const updateServiceSchema = z.object({
  id: cuidSchema,
}).merge(baseServiceSchema.partial())

// Delete service schema
export const deleteServiceSchema = z.object({
  id: cuidSchema,
})

// Get service schema
export const getServiceSchema = z.object({
  id: cuidSchema,
})

// List services schema
export const listServicesSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().optional(),
  category: ServiceCategorySchema.optional(),
  serviceType: ServiceTypeSchema.optional(),
  availability: ServiceAvailabilitySchema.optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'category', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  tenantId: cuidSchema.optional(),
})

// Service consumption schema
export const serviceConsumptionSchema = z.object({
  serviceId: cuidSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
})

// Bulk update services schema
export const bulkUpdateServicesSchema = z.object({
  serviceIds: z.array(cuidSchema).min(1, 'At least one service ID is required'),
  updates: z.object({
    category: ServiceCategorySchema.optional(),
    isActive: z.boolean().optional(),
    serviceType: ServiceTypeSchema.optional(),
    availability: ServiceAvailabilitySchema.optional(),
  }),
})

// Service analytics schema  
export const getServiceAnalyticsSchema = z.object({
  serviceId: cuidSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// Service request schema
export const createServiceRequestSchema = z.object({
  serviceId: cuidSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  notes: z.string().optional(),
  requestedDeliveryTime: z.date().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
})

// Export types
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>
export type ServiceType = z.infer<typeof ServiceTypeSchema>
export type ServiceAvailability = z.infer<typeof ServiceAvailabilitySchema>
export type CreateServiceRequest = z.infer<typeof createServiceSchema>
export type UpdateServiceRequest = z.infer<typeof updateServiceSchema>
export type ListServicesRequest = z.infer<typeof listServicesSchema>
export type ServiceConsumptionRequest = z.infer<typeof serviceConsumptionSchema>
export type BulkUpdateServicesRequest = z.infer<typeof bulkUpdateServicesSchema>
export type ServiceAnalyticsRequest = z.infer<typeof getServiceAnalyticsSchema>
export type CreateServiceRequestSchema = z.infer<typeof createServiceRequestSchema>
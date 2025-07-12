import { z } from 'zod'

// Enums for resource-related fields
export const ResourceTypeSchema = z.enum([
  'EQUIPMENT',
  'AMENITY',
  'VEHICLE',
  'ROOM_FEATURE',
  'TECHNOLOGY',
  'FURNITURE',
  'CONSUMABLE',
  'TOOL',
  'SAFETY_EQUIPMENT',
  'CLEANING_SUPPLY',
  'OFFICE_SUPPLY',
  'OTHER'
])

export const ResourceStatusSchema = z.enum([
  'AVAILABLE',
  'IN_USE',
  'RESERVED',
  'MAINTENANCE',
  'OUT_OF_ORDER',
  'DISCONTINUED',
  'LOST_DAMAGED'
])

export const ResourceConditionSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'NEEDS_REPAIR',
  'DAMAGED'
])

export const MaintenanceTypeSchema = z.enum([
  'PREVENTIVE',
  'CORRECTIVE',
  'EMERGENCY',
  'UPGRADE',
  'INSPECTION',
  'CLEANING'
])

export const MaintenanceStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE'
])

// Resource specifications schema
export const ResourceSpecSchema = z.object({
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    unit: z.enum(['cm', 'in', 'm', 'ft']).default('cm'),
  }).optional(),
  weight: z.object({
    value: z.number().positive(),
    unit: z.enum(['kg', 'lb', 'g']).default('kg'),
  }).optional(),
  capacity: z.number().positive().optional(),
  powerRequirements: z.string().max(200).optional(),
  connectivity: z.array(z.string().max(50)).optional(),
  operatingSystem: z.string().max(100).optional(),
  softwareInstalled: z.array(z.string().max(100)).optional(),
  accessories: z.array(z.string().max(100)).optional(),
  manualUrl: z.string().url().optional(),
  warrantyInfo: z.object({
    provider: z.string().max(100),
    expiryDate: z.date(),
    terms: z.string().max(500).optional(),
  }).optional(),
})

// Resource allocation schema
export const ResourceAllocationSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  allocatedBy: z.string().uuid('Invalid user ID'),
  allocatedAt: z.date(),
  expectedReturnAt: z.date().optional(),
  actualReturnAt: z.date().optional(),
  notes: z.string().max(500).optional(),
  checkedOutCondition: ResourceConditionSchema,
  checkedInCondition: ResourceConditionSchema.optional(),
})

// Maintenance record schema
export const MaintenanceRecordSchema = z.object({
  type: MaintenanceTypeSchema,
  description: z.string().min(1, 'Description is required').max(1000),
  scheduledDate: z.date(),
  completedDate: z.date().optional(),
  status: MaintenanceStatusSchema.default('SCHEDULED'),
  performedBy: z.string().max(200).optional(),
  cost: z.number().min(0, 'Cost cannot be negative').optional(),
  partsUsed: z.array(z.object({
    name: z.string().max(100),
    quantity: z.number().int().positive(),
    cost: z.number().min(0).optional(),
  })).optional(),
  beforeCondition: ResourceConditionSchema.optional(),
  afterCondition: ResourceConditionSchema.optional(),
  notes: z.string().max(1000).optional(),
  nextMaintenanceDate: z.date().optional(),
})

// Base resource schema
export const baseResourceSchema = z.object({
  name: z.string().min(1, 'Resource name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: ResourceTypeSchema,
  status: ResourceStatusSchema.default('AVAILABLE'),
  condition: ResourceConditionSchema.default('GOOD'),
  assetTag: z.string().max(50, 'Asset tag must be less than 50 characters').optional(),
  barcode: z.string().max(100, 'Barcode must be less than 100 characters').optional(),
  qrCode: z.string().max(200, 'QR code must be less than 200 characters').optional(),
  location: z.object({
    spaceId: z.string().uuid('Invalid space ID').optional(),
    building: z.string().max(100).optional(),
    floor: z.string().max(50).optional(),
    room: z.string().max(100).optional(),
    coordinates: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    }).optional(),
  }).optional(),
  specifications: ResourceSpecSchema.optional(),
  purchaseInfo: z.object({
    vendor: z.string().max(100),
    purchaseDate: z.date(),
    purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    invoiceNumber: z.string().max(100).optional(),
    warrantyPeriod: z.number().int().min(0).optional(), // in months
  }).optional(),
  financialInfo: z.object({
    currentValue: z.number().min(0, 'Current value cannot be negative').optional(),
    depreciationRate: z.number().min(0).max(100, 'Depreciation rate must be between 0 and 100').optional(), // percentage per year
    lastValuationDate: z.date().optional(),
    insuranceCoverage: z.number().min(0).optional(),
    insuranceProvider: z.string().max(100).optional(),
  }).optional(),
  maintenanceSchedule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'AS_NEEDED']),
    lastMaintenance: z.date().optional(),
    nextMaintenance: z.date().optional(),
    maintenanceInstructions: z.string().max(1000).optional(),
  }).optional(),
  usage: z.object({
    totalUsageHours: z.number().min(0).default(0),
    usageThisMonth: z.number().min(0).default(0),
    maxUsagePerDay: z.number().min(0).optional(),
    requiresTraining: z.boolean().default(false),
    trainingRequired: z.string().max(200).optional(),
  }).optional(),
  availability: z.object({
    isBookable: z.boolean().default(false),
    advanceBookingDays: z.number().int().min(0).default(7),
    maxBookingDuration: z.number().min(0).optional(), // in hours
    bookingIncrements: z.number().positive().default(1), // in hours
    simultaneousUsers: z.number().int().min(1).default(1),
  }).optional(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  documents: z.array(z.object({
    name: z.string().max(100),
    url: z.string().url('Invalid document URL'),
    type: z.enum(['MANUAL', 'WARRANTY', 'INVOICE', 'CERTIFICATE', 'OTHER']),
  })).default([]),
  tags: z.array(z.string().max(50)).default([]),
  isActive: z.boolean().default(true),
  isShared: z.boolean().default(false), // Can be used across multiple spaces
  requiresCheckout: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
})

// Create resource schema
export const createResourceSchema = baseResourceSchema

// Update resource schema (all fields optional except ID)
export const updateResourceSchema = z.object({
  id: z.string().uuid('Invalid resource ID'),
}).merge(baseResourceSchema.partial())

// Delete resource schema
export const deleteResourceSchema = z.object({
  id: z.string().uuid('Invalid resource ID'),
})

// Get resource schema
export const getResourceSchema = z.object({
  id: z.string().uuid('Invalid resource ID'),
})

// List resources schema
export const listResourcesSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: ResourceTypeSchema.optional(),
  status: ResourceStatusSchema.optional(),
  condition: ResourceConditionSchema.optional(),
  spaceId: z.string().uuid().optional(),
  isBookable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'type', 'status', 'condition', 'purchaseDate', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Resource checkout schema
export const checkoutResourceSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  userId: z.string().uuid('Invalid user ID').optional(),
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  expectedReturnAt: z.date().optional(),
  notes: z.string().max(500).optional(),
  checkedOutCondition: ResourceConditionSchema.default('GOOD'),
})

// Resource checkin schema
export const checkinResourceSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  checkedInCondition: ResourceConditionSchema,
  notes: z.string().max(500).optional(),
  damageReport: z.string().max(1000).optional(),
})

// Resource maintenance schema
export const scheduleMaintenanceSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  type: MaintenanceTypeSchema,
  description: z.string().min(1, 'Description is required').max(1000),
  scheduledDate: z.date({
    required_error: 'Scheduled date is required',
  }),
  performedBy: z.string().max(200).optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().max(1000).optional(),
})

export const updateMaintenanceSchema = z.object({
  id: z.string().uuid('Invalid maintenance ID'),
  status: MaintenanceStatusSchema.optional(),
  completedDate: z.date().optional(),
  actualCost: z.number().min(0).optional(),
  partsUsed: z.array(z.object({
    name: z.string().max(100),
    quantity: z.number().int().positive(),
    cost: z.number().min(0).optional(),
  })).optional(),
  beforeCondition: ResourceConditionSchema.optional(),
  afterCondition: ResourceConditionSchema.optional(),
  notes: z.string().max(1000).optional(),
  nextMaintenanceDate: z.date().optional(),
})

// Resource availability check schema
export const checkResourceAvailabilitySchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  startTime: z.date({
    required_error: 'Start time is required',
  }),
  endTime: z.date({
    required_error: 'End time is required',
  }),
  excludeBookingId: z.string().uuid().optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

// Resource usage statistics schema
export const getResourceUsageStatsSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// Bulk operations schema
export const bulkUpdateResourcesSchema = z.object({
  resourceIds: z.array(z.string().uuid('Invalid resource ID')).min(1, 'At least one resource ID is required'),
  updates: z.object({
    status: ResourceStatusSchema.optional(),
    condition: ResourceConditionSchema.optional(),
    location: z.object({
      spaceId: z.string().uuid().optional(),
      building: z.string().max(100).optional(),
      floor: z.string().max(50).optional(),
      room: z.string().max(100).optional(),
    }).optional(),
    isActive: z.boolean().optional(),
    isBookable: z.boolean().optional(),
    tags: z.array(z.string().max(50)).optional(),
    metadata: z.record(z.any()).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one update field is required',
    }
  ),
})

// Resource transfer schema
export const transferResourceSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),
  fromSpaceId: z.string().uuid('Invalid source space ID').optional(),
  toSpaceId: z.string().uuid('Invalid destination space ID'),
  transferredBy: z.string().uuid('Invalid user ID'),
  transferDate: z.date().default(() => new Date()),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

// Type exports
export type ResourceType = z.infer<typeof ResourceTypeSchema>
export type ResourceStatus = z.infer<typeof ResourceStatusSchema>
export type ResourceCondition = z.infer<typeof ResourceConditionSchema>
export type MaintenanceType = z.infer<typeof MaintenanceTypeSchema>
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>
export type ResourceSpec = z.infer<typeof ResourceSpecSchema>
export type ResourceAllocation = z.infer<typeof ResourceAllocationSchema>
export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>

export type CreateResourceRequest = z.infer<typeof createResourceSchema>
export type UpdateResourceRequest = z.infer<typeof updateResourceSchema>
export type DeleteResourceRequest = z.infer<typeof deleteResourceSchema>
export type GetResourceRequest = z.infer<typeof getResourceSchema>
export type ListResourcesRequest = z.infer<typeof listResourcesSchema>
export type CheckoutResourceRequest = z.infer<typeof checkoutResourceSchema>
export type CheckinResourceRequest = z.infer<typeof checkinResourceSchema>
export type ScheduleMaintenanceRequest = z.infer<typeof scheduleMaintenanceSchema>
export type UpdateMaintenanceRequest = z.infer<typeof updateMaintenanceSchema>
export type CheckResourceAvailabilityRequest = z.infer<typeof checkResourceAvailabilitySchema>
export type GetResourceUsageStatsRequest = z.infer<typeof getResourceUsageStatsSchema>
export type BulkUpdateResourcesRequest = z.infer<typeof bulkUpdateResourcesSchema>
export type TransferResourceRequest = z.infer<typeof transferResourceSchema>
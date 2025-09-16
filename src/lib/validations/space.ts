import { z } from 'zod'

// Enums for space-related fields (matches Prisma enum)
export const SpaceTypeSchema = z.enum([
  'MEETING_ROOM',
  'CONFERENCE_ROOM',
  'PHONE_BOOTH',
  'EVENT_SPACE',
  'COMMON_AREA',
  'KITCHEN',
  'LOUNGE'
])

export const SpaceStatusSchema = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'MAINTENANCE',
  'OUT_OF_ORDER',
  'RESERVED',
  'UNAVAILABLE'
])

export const PricingModeSchema = z.enum([
  'HOURLY',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'FIXED',
  'CUSTOM'
])

export const AmenitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Amenity name is required'),
  description: z.string().optional(),
  isIncluded: z.boolean().default(true),
  additionalCost: z.number().min(0, 'Additional cost cannot be negative').optional(),
})

export const LocationSchema = z.object({
  floor: z.string().optional(),
  building: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
})

export const PricingTierSchema = z.object({
  duration: z.number().positive('Duration must be positive'),
  unit: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
  price: z.number().min(0, 'Price cannot be negative'),
  discountPercentage: z.number().min(0).max(100).optional(),
})

export const AvailabilityRuleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isAvailable: z.boolean().default(true),
})

// New schemas for enhanced space management
export const CoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
}).optional()

export const SpaceAvailabilityScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isActive: z.boolean().default(true),
})

export const SpaceMaintenanceScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startTime: z.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a valid date',
  }),
  endTime: z.date({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a valid date',
  }),
  isRecurring: z.boolean().default(false),
  recurrence: z.object({
    pattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    endDate: z.date().optional(),
    occurrences: z.number().int().min(1).optional(),
  }).optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

export const CheckInMethodSchema = z.enum(['QR', 'MANUAL', 'AUTO'])

export const CheckInOutSchema = z.object({
  checkInMethod: CheckInMethodSchema,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const RecurrencePatternSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])

export const BookingRecurrenceSchema = z.object({
  pattern: RecurrencePatternSchema,
  interval: z.number().int().min(1, 'Interval must be at least 1').default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // [1,3,5] for Mon,Wed,Fri
  dayOfMonth: z.number().min(1).max(31).optional(), // For monthly recurrence
  endDate: z.date().optional(),
  occurrences: z.number().int().min(1, 'Occurrences must be at least 1').optional(),
  exceptions: z.array(z.date()).optional(), // Excluded dates
})

// Base space schema
export const baseSpaceSchema = z.object({
  name: z.string().min(1, 'Space name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: SpaceTypeSchema,
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  amenities: z.array(AmenitySchema).default([]),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').optional(),
  isActive: z.boolean().default(true),

  // Enhanced space management fields
  floor: z.string().max(50, 'Floor must be less than 50 characters').optional(),
  zone: z.string().max(50, 'Zone must be less than 50 characters').optional(),
  coordinates: CoordinatesSchema,
  images: z.array(z.string().url('Invalid image URL')).default([]),
  area: z.number().positive('Area must be positive').optional(), // Square meters
  maxAdvanceBooking: z.number().int().min(1, 'Max advance booking must be at least 1 day').default(30), // Days
  minBookingDuration: z.number().int().min(15, 'Min booking duration must be at least 15 minutes').default(60), // Minutes
  maxBookingDuration: z.number().int().min(15, 'Max booking duration must be at least 15 minutes').optional(), // Minutes
  cancellationHours: z.number().int().min(0, 'Cancellation hours cannot be negative').default(24), // Hours
  requiresApproval: z.boolean().default(false),
  allowRecurring: z.boolean().default(true),

  // Legacy fields for backward compatibility
  status: SpaceStatusSchema.default('AVAILABLE'),
  location: LocationSchema.optional(),
  pricingMode: PricingModeSchema.default('HOURLY'),
  basePrice: z.number().min(0, 'Base price cannot be negative').default(0),
  pricingTiers: z.array(PricingTierSchema).default([]),
  availabilityRules: z.array(AvailabilityRuleSchema).default([]),
  minimumBookingDuration: z.number().min(0.25, 'Minimum booking duration must be at least 15 minutes').default(1), // in hours
  maximumBookingDuration: z.number().positive('Maximum booking duration must be positive').optional(), // in hours
  advanceBookingDays: z.number().int().min(0, 'Advance booking days cannot be negative').default(30),
  cancellationPolicy: z.string().max(1000, 'Cancellation policy must be less than 1000 characters').optional(),
  bookingRules: z.string().max(1000, 'Booking rules must be less than 1000 characters').optional(),
  allowMultipleBookings: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
})

// Create space schema
export const createSpaceSchema = baseSpaceSchema

// Update space schema (all fields optional except ID)
export const updateSpaceSchema = z.object({
  id: z.string().uuid('Invalid space ID'),
}).merge(baseSpaceSchema.partial())

// Delete space schema
export const deleteSpaceSchema = z.object({
  id: z.string().uuid('Invalid space ID'),
})

// Get space schema
export const getSpaceSchema = z.object({
  id: z.string().uuid('Invalid space ID'),
})

// List spaces schema
export const listSpacesSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: SpaceTypeSchema.optional(),
  status: SpaceStatusSchema.optional(),
  capacity: z.object({
    min: z.number().int().min(1).optional(),
    max: z.number().int().min(1).optional(),
  }).optional(),
  priceRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  amenities: z.array(z.string()).optional(),
  location: z.object({
    floor: z.string().optional(),
    building: z.string().optional(),
    area: z.string().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'type', 'capacity', 'basePrice', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Space availability check schema
export const checkSpaceAvailabilitySchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  startTime: z.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a valid date',
  }),
  endTime: z.date({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a valid date',
  }),
  excludeBookingId: z.string().uuid().optional(), // Exclude specific booking from conflict check
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

// Bulk update spaces schema
export const bulkUpdateSpacesSchema = z.object({
  spaceIds: z.array(z.string().uuid('Invalid space ID')).min(1, 'At least one space ID is required'),
  updates: z.object({
    status: SpaceStatusSchema.optional(),
    isActive: z.boolean().optional(),
    basePrice: z.number().min(0).optional(),
    pricingMode: PricingModeSchema.optional(),
    requiresApproval: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one update field is required',
    }
  ),
})

// Space statistics schema
export const getSpaceStatsSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

// Space utilization schema
export const getSpaceUtilizationSchema = z.object({
  spaceIds: z.array(z.string().uuid()).optional(),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  granularity: z.enum(['hour', 'day', 'week']).default('day'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Space pricing calculation schema
export const calculateSpacePricingSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  startTime: z.date({
    required_error: 'Start time is required',
  }),
  endTime: z.date({
    required_error: 'End time is required',
  }),
  clientId: z.string().uuid('Invalid client ID').optional(),
  discountCodes: z.array(z.string()).optional(),
  additionalServices: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

// Type exports
export type SpaceType = z.infer<typeof SpaceTypeSchema>
export type SpaceStatus = z.infer<typeof SpaceStatusSchema>
export type PricingMode = z.infer<typeof PricingModeSchema>
export type Amenity = z.infer<typeof AmenitySchema>
export type Location = z.infer<typeof LocationSchema>
export type PricingTier = z.infer<typeof PricingTierSchema>
export type AvailabilityRule = z.infer<typeof AvailabilityRuleSchema>

export type CreateSpaceRequest = z.infer<typeof createSpaceSchema>
export type UpdateSpaceRequest = z.infer<typeof updateSpaceSchema>
export type DeleteSpaceRequest = z.infer<typeof deleteSpaceSchema>
export type GetSpaceRequest = z.infer<typeof getSpaceSchema>
export type ListSpacesRequest = z.infer<typeof listSpacesSchema>
export type CheckSpaceAvailabilityRequest = z.infer<typeof checkSpaceAvailabilitySchema>
export type BulkUpdateSpacesRequest = z.infer<typeof bulkUpdateSpacesSchema>
export type GetSpaceStatsRequest = z.infer<typeof getSpaceStatsSchema>
export type GetSpaceUtilizationRequest = z.infer<typeof getSpaceUtilizationSchema>
export type CalculateSpacePricingRequest = z.infer<typeof calculateSpacePricingSchema>

// Enhanced space management schemas
export const createSpaceAvailabilityScheduleSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
}).merge(SpaceAvailabilityScheduleSchema)

export const updateSpaceAvailabilityScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
}).merge(SpaceAvailabilityScheduleSchema.partial())

export const createSpaceMaintenanceScheduleSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startTime: z.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a valid date',
  }),
  endTime: z.date({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a valid date',
  }),
  isRecurring: z.boolean().default(false),
  recurrence: z.object({
    pattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    endDate: z.date().optional(),
    occurrences: z.number().int().min(1).optional(),
  }).optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

export const updateSpaceMaintenanceScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startTime: z.date({
    invalid_type_error: 'Start time must be a valid date',
  }).optional(),
  endTime: z.date({
    invalid_type_error: 'End time must be a valid date',
  }).optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.object({
    pattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    endDate: z.date().optional(),
    occurrences: z.number().int().min(1).optional(),
  }).optional(),
})

export const createCheckInOutSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  spaceId: z.string().uuid('Invalid space ID'),
}).merge(CheckInOutSchema)

export const performCheckOutSchema = z.object({
  checkInId: z.string().uuid('Invalid check-in ID'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const createBookingWithRecurrenceSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startTime: z.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a valid date',
  }),
  endTime: z.date({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a valid date',
  }),
  recurrence: BookingRecurrenceSchema.optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

export const bulkSpaceImportSchema = z.object({
  spaces: z.array(baseSpaceSchema).min(1, 'At least one space is required'),
  replaceExisting: z.boolean().default(false),
})

export const spaceImageUploadSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  images: z.array(z.object({
    file: z.instanceof(File),
    caption: z.string().max(100, 'Caption must be less than 100 characters').optional(),
  })).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
})

export const generateQRCodeSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  expiresInHours: z.number().int().min(1).max(168).default(24), // 1 hour to 1 week
})

export const validateQRCodeSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
})

export const getOccupancyDataSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID').optional(),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  granularity: z.enum(['hour', 'day', 'week']).default('hour'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Enhanced type exports
export type SpaceAvailabilityScheduleRequest = z.infer<typeof SpaceAvailabilityScheduleSchema>
export type SpaceMaintenanceScheduleRequest = z.infer<typeof SpaceMaintenanceScheduleSchema>
export type CheckInOutRequest = z.infer<typeof CheckInOutSchema>
export type BookingRecurrenceRequest = z.infer<typeof BookingRecurrenceSchema>
export type CreateSpaceAvailabilityScheduleRequest = z.infer<typeof createSpaceAvailabilityScheduleSchema>
export type UpdateSpaceAvailabilityScheduleRequest = z.infer<typeof updateSpaceAvailabilityScheduleSchema>
export type CreateSpaceMaintenanceScheduleRequest = z.infer<typeof createSpaceMaintenanceScheduleSchema>
export type UpdateSpaceMaintenanceScheduleRequest = z.infer<typeof updateSpaceMaintenanceScheduleSchema>
export type CreateCheckInOutRequest = z.infer<typeof createCheckInOutSchema>
export type PerformCheckOutRequest = z.infer<typeof performCheckOutSchema>
export type CreateBookingWithRecurrenceRequest = z.infer<typeof createBookingWithRecurrenceSchema>
export type BulkSpaceImportRequest = z.infer<typeof bulkSpaceImportSchema>
export type SpaceImageUploadRequest = z.infer<typeof spaceImageUploadSchema>
export type GenerateQRCodeRequest = z.infer<typeof generateQRCodeSchema>
export type ValidateQRCodeRequest = z.infer<typeof validateQRCodeSchema>
export type GetOccupancyDataRequest = z.infer<typeof getOccupancyDataSchema>
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>
export type RecurrencePattern = z.infer<typeof RecurrencePatternSchema>
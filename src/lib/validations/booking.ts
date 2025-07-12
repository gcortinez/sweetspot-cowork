import { z } from 'zod'

// Enums for booking-related fields
export const BookingStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS', 
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'MODIFIED'
])

export const BookingTypeSchema = z.enum([
  'SPACE_ONLY',
  'SPACE_WITH_SERVICES',
  'SERVICES_ONLY',
  'PACKAGE',
  'RECURRING',
  'EVENT'
])

export const RecurrenceTypeSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
  'CUSTOM'
])

export const CheckInMethodSchema = z.enum([
  'MANUAL',
  'QR_CODE',
  'RFID',
  'MOBILE_APP',
  'AUTOMATIC'
])

export const CancellationReasonSchema = z.enum([
  'CLIENT_REQUEST',
  'SPACE_UNAVAILABLE',
  'SERVICE_UNAVAILABLE',
  'MAINTENANCE',
  'WEATHER',
  'EMERGENCY',
  'NO_SHOW',
  'PAYMENT_FAILED',
  'POLICY_VIOLATION',
  'OTHER'
])

// Booking participant schema
export const BookingParticipantSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  name: z.string().min(1, 'Participant name is required').max(100),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['ORGANIZER', 'ATTENDEE', 'PRESENTER', 'ASSISTANT']).default('ATTENDEE'),
  isRequired: z.boolean().default(false),
  hasCheckedIn: z.boolean().default(false),
  checkedInAt: z.date().optional(),
})

// Booking service schema
export const BookingServiceSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  notes: z.string().max(500).optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  metadata: z.record(z.any()).optional(),
})

// Recurrence rule schema
export const RecurrenceRuleSchema = z.object({
  type: RecurrenceTypeSchema,
  interval: z.number().int().min(1, 'Interval must be at least 1').default(1),
  endDate: z.date().optional(),
  maxOccurrences: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  exceptions: z.array(z.date()).optional(), // Dates to skip
})

// Base booking object (without refinements)
const baseBookingObject = z.object({
  spaceId: z.string().uuid('Invalid space ID').optional(),
  clientId: z.string().uuid('Invalid client ID'),
  type: BookingTypeSchema.default('SPACE_ONLY'),
  title: z.string().min(1, 'Booking title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  startTime: z.date({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a valid date',
  }),
  endTime: z.date({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a valid date',
  }),
  status: BookingStatusSchema.default('PENDING'),
  participants: z.array(BookingParticipantSchema).default([]),
  services: z.array(BookingServiceSchema).default([]),
  totalAmount: z.number().min(0, 'Total amount cannot be negative').default(0),
  setupTime: z.number().min(0, 'Setup time cannot be negative').default(0), // in minutes
  cleanupTime: z.number().min(0, 'Cleanup time cannot be negative').default(0), // in minutes
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  internalNotes: z.string().max(1000, 'Internal notes must be less than 1000 characters').optional(),
  specialRequests: z.string().max(1000, 'Special requests must be less than 1000 characters').optional(),
  checkInMethod: CheckInMethodSchema.default('MANUAL'),
  isRecurring: z.boolean().default(false),
  recurrenceRule: RecurrenceRuleSchema.optional(),
  parentBookingId: z.string().uuid().optional(), // For recurring bookings
  requiresApproval: z.boolean().default(false),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
  checkedInAt: z.date().optional(),
  checkedOutAt: z.date().optional(),
  cancellationReason: CancellationReasonSchema.optional(),
  cancellationNotes: z.string().max(500).optional(),
  cancelledAt: z.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
})

// Base booking schema with refinements
export const baseBookingSchema = baseBookingObject.refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).refine(
  (data) => !data.isRecurring || data.recurrenceRule,
  {
    message: 'Recurrence rule is required for recurring bookings',
    path: ['recurrenceRule'],
  }
)

// Create booking schema
export const createBookingSchema = baseBookingSchema

// Update booking schema (all fields optional except ID)
export const updateBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
}).merge(baseBookingObject.partial())

// Delete booking schema
export const deleteBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  reason: CancellationReasonSchema.optional(),
  notes: z.string().max(500).optional(),
})

// Get booking schema
export const getBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
})

// List bookings schema
export const listBookingsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  spaceId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: BookingStatusSchema.optional(),
  type: BookingTypeSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isRecurring: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  sortBy: z.enum(['startTime', 'endTime', 'title', 'status', 'totalAmount', 'createdAt', 'updatedAt']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Check booking conflicts schema
export const checkBookingConflictsSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  startTime: z.date({
    required_error: 'Start time is required',
  }),
  endTime: z.date({
    required_error: 'End time is required',
  }),
  excludeBookingId: z.string().uuid().optional(),
  includeSetupCleanup: z.boolean().default(true),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

// Booking check-in schema
export const checkInBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  method: CheckInMethodSchema.default('MANUAL'),
  participantIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(500).optional(),
  actualStartTime: z.date().optional(),
})

// Booking check-out schema
export const checkOutBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  actualEndTime: z.date().optional(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
})

// Booking approval schema
export const approveBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  approved: z.boolean(),
  notes: z.string().max(500).optional(),
})

// Booking modification schema
export const modifyBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  spaceId: z.string().uuid().optional(),
  services: z.array(BookingServiceSchema).optional(),
  participants: z.array(BookingParticipantSchema).optional(),
  notes: z.string().max(1000).optional(),
  reason: z.string().max(500, 'Modification reason must be less than 500 characters'),
}).refine(
  (data) => !data.startTime || !data.endTime || data.endTime > data.startTime,
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
)

// Bulk operations schema
export const bulkUpdateBookingsSchema = z.object({
  bookingIds: z.array(z.string().uuid('Invalid booking ID')).min(1, 'At least one booking ID is required'),
  updates: z.object({
    status: BookingStatusSchema.optional(),
    requiresApproval: z.boolean().optional(),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.any()).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one update field is required',
    }
  ),
})

// Booking statistics schema
export const getBookingStatsSchema = z.object({
  spaceId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  includeRevenue: z.boolean().default(true),
})

// Booking utilization schema
export const getBookingUtilizationSchema = z.object({
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

// Recurring booking generation schema
export const generateRecurringBookingsSchema = z.object({
  templateBookingId: z.string().uuid('Invalid booking ID'),
  generateUntil: z.date({
    required_error: 'Generate until date is required',
  }),
  maxBookings: z.number().int().min(1).max(1000).default(100),
  skipConflicts: z.boolean().default(true),
  notifyConflicts: z.boolean().default(true),
})

// Type exports
export type BookingStatus = z.infer<typeof BookingStatusSchema>
export type BookingType = z.infer<typeof BookingTypeSchema>
export type RecurrenceType = z.infer<typeof RecurrenceTypeSchema>
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>
export type CancellationReason = z.infer<typeof CancellationReasonSchema>
export type BookingParticipant = z.infer<typeof BookingParticipantSchema>
export type BookingService = z.infer<typeof BookingServiceSchema>
export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>

export type CreateBookingRequest = z.infer<typeof createBookingSchema>
export type UpdateBookingRequest = z.infer<typeof updateBookingSchema>
export type DeleteBookingRequest = z.infer<typeof deleteBookingSchema>
export type GetBookingRequest = z.infer<typeof getBookingSchema>
export type ListBookingsRequest = z.infer<typeof listBookingsSchema>
export type CheckBookingConflictsRequest = z.infer<typeof checkBookingConflictsSchema>
export type CheckInBookingRequest = z.infer<typeof checkInBookingSchema>
export type CheckOutBookingRequest = z.infer<typeof checkOutBookingSchema>
export type ApproveBookingRequest = z.infer<typeof approveBookingSchema>
export type ModifyBookingRequest = z.infer<typeof modifyBookingSchema>
export type BulkUpdateBookingsRequest = z.infer<typeof bulkUpdateBookingsSchema>
export type GetBookingStatsRequest = z.infer<typeof getBookingStatsSchema>
export type GetBookingUtilizationRequest = z.infer<typeof getBookingUtilizationSchema>
export type GenerateRecurringBookingsRequest = z.infer<typeof generateRecurringBookingsSchema>
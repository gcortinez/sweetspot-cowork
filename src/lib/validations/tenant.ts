import { z } from 'zod'
import { 
  nameSchema, 
  slugSchema, 
  addressSchema, 
  coordinatesSchema, 
  moneySchema,
  phoneSchema,
  paginationSchema,
  searchSchema 
} from './common'

/**
 * Tenant and workspace validation schemas for Server Actions
 */

// Tenant creation schema
export const createTenantSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  domain: z.string().regex(/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$/, 'Invalid domain format').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  contactInfo: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: phoneSchema,
    website: z.string().url('Invalid website URL').optional(),
  }).optional(),
  businessHours: z.object({
    monday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
    tuesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
    wednesday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
    thursday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
    friday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
    saturday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
    sunday: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      closed: z.boolean().default(false),
    }).optional(),
  }).optional(),
  policies: z.object({
    cancellationPolicy: z.string().max(2000, 'Cancellation policy is too long').optional(),
    accessPolicy: z.string().max(2000, 'Access policy is too long').optional(),
    paymentPolicy: z.string().max(2000, 'Payment policy is too long').optional(),
    generalRules: z.string().max(5000, 'General rules are too long').optional(),
  }).optional(),
  settings: z.object({
    timezone: z.string().default('UTC'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    language: z.string().default('en'),
    dateFormat: z.string().default('MM/DD/YYYY'),
    timeFormat: z.enum(['12h', '24h']).default('12h'),
    bookingAdvanceLimit: z.number().min(1).max(365).default(30), // Days
    bookingCancellationLimit: z.number().min(1).max(48).default(24), // Hours
    autoApproveBookings: z.boolean().default(false),
    requireMembershipForBooking: z.boolean().default(true),
    allowGuestBookings: z.boolean().default(false),
  }).optional(),
})

export type CreateTenantRequest = z.infer<typeof createTenantSchema>

// Tenant update schema
export const updateTenantSchema = createTenantSchema.partial().omit({ slug: true })

export type UpdateTenantRequest = z.infer<typeof updateTenantSchema>

// Tenant filters schema
export const tenantFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  hasCustomDomain: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.enum(['name', 'createdAt', 'status']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type TenantFilters = z.infer<typeof tenantFiltersSchema>

// Space creation schema
export const createTenantSpaceSchema = z.object({
  name: nameSchema,
  type: z.enum(['OFFICE', 'MEETING_ROOM', 'DESK', 'COMMON_AREA', 'PHONE_BOOTH', 'EVENT_SPACE', 'STORAGE']),
  description: z.string().max(1000, 'Description is too long').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(1000, 'Capacity cannot exceed 1000'),
  floor: z.string().max(10, 'Floor identifier is too long').optional(),
  location: z.string().max(255, 'Location description is too long').optional(),
  coordinates: coordinatesSchema.optional(),
  pricing: z.object({
    hourlyRate: z.number().min(0, 'Hourly rate cannot be negative'),
    dailyRate: z.number().min(0, 'Daily rate cannot be negative'),
    weeklyRate: z.number().min(0, 'Weekly rate cannot be negative'),
    monthlyRate: z.number().min(0, 'Monthly rate cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    includedHours: z.number().min(0, 'Included hours cannot be negative').default(0),
    overage: z.number().min(0, 'Overage rate cannot be negative').default(0),
  }),
  amenities: z.array(z.string()).default([]),
  features: z.object({
    hasProjector: z.boolean().default(false),
    hasWhiteboard: z.boolean().default(false),
    hasTV: z.boolean().default(false),
    hasConferencePhone: z.boolean().default(false),
    hasVideoConferencing: z.boolean().default(false),
    hasWiFi: z.boolean().default(true),
    hasAirConditioning: z.boolean().default(false),
    hasHeating: z.boolean().default(false),
    hasWindows: z.boolean().default(false),
    hasNaturalLight: z.boolean().default(false),
    isAccessible: z.boolean().default(false),
    hasParking: z.boolean().default(false),
  }).optional(),
  images: z.array(z.string().url('Invalid image URL')).default([]),
  bookingRules: z.object({
    minBookingDuration: z.number().min(15, 'Minimum booking duration is 15 minutes').default(60), // Minutes
    maxBookingDuration: z.number().min(60, 'Maximum booking duration must be at least 1 hour').default(480), // Minutes
    advanceBookingLimit: z.number().min(1, 'Advance booking limit must be at least 1 day').default(30), // Days
    requiresApproval: z.boolean().default(false),
    allowRecurring: z.boolean().default(true),
    maxRecurringInstances: z.number().min(1).max(365).default(52),
    bufferTime: z.number().min(0).max(60).default(15), // Minutes between bookings
  }).optional(),
  availability: z.object({
    defaultSchedule: z.object({
      monday: z.object({
        available: z.boolean().default(true),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
      tuesday: z.object({
        available: z.boolean().default(true),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
      wednesday: z.object({
        available: z.boolean().default(true),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
      thursday: z.object({
        available: z.boolean().default(true),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
      friday: z.object({
        available: z.boolean().default(true),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
      saturday: z.object({
        available: z.boolean().default(false),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
      sunday: z.object({
        available: z.boolean().default(false),
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('09:00'),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').default('17:00'),
      }),
    }),
    exceptions: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      available: z.boolean(),
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
      reason: z.string().max(255, 'Reason is too long').optional(),
    })).default([]),
  }).optional(),
})

export type CreateTenantSpaceRequest = z.infer<typeof createTenantSpaceSchema>

// Space update schema
export const updateTenantSpaceSchema = createTenantSpaceSchema.partial()

export type UpdateTenantSpaceRequest = z.infer<typeof updateTenantSpaceSchema>

// Space filters schema
export const spaceFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['OFFICE', 'MEETING_ROOM', 'DESK', 'COMMON_AREA', 'PHONE_BOOTH', 'EVENT_SPACE', 'STORAGE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
  floor: z.string().optional(),
  minCapacity: z.number().min(1).optional(),
  maxCapacity: z.number().min(1).optional(),
  minHourlyRate: z.number().min(0).optional(),
  maxHourlyRate: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  hasProjector: z.boolean().optional(),
  hasWhiteboard: z.boolean().optional(),
  hasTV: z.boolean().optional(),
  isAccessible: z.boolean().optional(),
  available: z.boolean().optional(),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
})

export type SpaceFilters = z.infer<typeof spaceFiltersSchema>

// Tenant settings update schema
export const updateTenantSettingsSchema = z.object({
  timezone: z.string().optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  bookingAdvanceLimit: z.number().min(1).max(365).optional(),
  bookingCancellationLimit: z.number().min(1).max(48).optional(),
  autoApproveBookings: z.boolean().optional(),
  requireMembershipForBooking: z.boolean().optional(),
  allowGuestBookings: z.boolean().optional(),
  notifications: z.object({
    emailBookingConfirmation: z.boolean().optional(),
    emailBookingReminder: z.boolean().optional(),
    emailBookingCancellation: z.boolean().optional(),
    smsBookingReminder: z.boolean().optional(),
    pushBookingReminder: z.boolean().optional(),
  }).optional(),
  integrations: z.object({
    googleCalendar: z.boolean().optional(),
    outlookCalendar: z.boolean().optional(),
    slackNotifications: z.boolean().optional(),
    teamsNotifications: z.boolean().optional(),
  }).optional(),
})

export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsSchema>

// Combined pagination and filtering schemas
export const paginatedTenantsSchema = paginationSchema.extend(tenantFiltersSchema.shape)
export const paginatedSpacesSchema = paginationSchema.extend(spaceFiltersSchema.shape)

export type PaginatedTenantsQuery = z.infer<typeof paginatedTenantsSchema>
export type PaginatedSpacesQuery = z.infer<typeof paginatedSpacesSchema>
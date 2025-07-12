import { z } from 'zod'

// Enums for visitor-related fields
export const VisitorTypeSchema = z.enum([
  'GUEST',
  'CLIENT_VISITOR',
  'DELIVERY',
  'CONTRACTOR',
  'INTERVIEW',
  'EVENT_ATTENDEE',
  'VENDOR',
  'MAINTENANCE',
  'GOVERNMENT',
  'OTHER'
])

export const VisitorStatusSchema = z.enum([
  'PRE_REGISTERED',
  'REGISTERED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
  'BLACKLISTED'
])

export const IDTypeSchema = z.enum([
  'DRIVERS_LICENSE',
  'PASSPORT',
  'NATIONAL_ID',
  'COMPANY_ID',
  'OTHER'
])

export const VisitPurposeSchema = z.enum([
  'MEETING',
  'DELIVERY',
  'SERVICE',
  'INTERVIEW',
  'EVENT',
  'TOUR',
  'PERSONAL',
  'OTHER'
])

// Contact information schema
export const ContactInfoSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number must be less than 20 characters'),
  alternatePhone: z.string().max(20).optional(),
  address: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
  }).optional(),
})

// Emergency contact schema
export const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required').max(100),
  relationship: z.string().max(50).optional(),
  phone: z.string().min(1, 'Emergency contact phone is required').max(20),
  alternatePhone: z.string().max(20).optional(),
})

// ID verification schema
export const IDVerificationSchema = z.object({
  type: IDTypeSchema,
  number: z.string().min(1, 'ID number is required').max(100),
  issuingCountry: z.string().max(100).optional(),
  expiryDate: z.date().optional(),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().uuid().optional(),
  documentImageUrl: z.string().url().optional(),
})

// Vehicle information schema
export const VehicleInfoSchema = z.object({
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
  licensePlate: z.string().min(1, 'License plate is required').max(20),
  parkingSpot: z.string().max(50).optional(),
})

// Access permissions schema
export const AccessPermissionsSchema = z.object({
  allowedAreas: z.array(z.string()).default([]),
  restrictedAreas: z.array(z.string()).default([]),
  escortRequired: z.boolean().default(false),
  temporaryBadgeNumber: z.string().max(50).optional(),
  accessCardNumber: z.string().max(50).optional(),
  specialInstructions: z.string().max(500).optional(),
})

// Health and safety schema
export const HealthSafetySchema = z.object({
  healthDeclaration: z.boolean().default(false),
  temperatureCheck: z.object({
    required: z.boolean().default(false),
    value: z.number().optional(),
    checkedAt: z.date().optional(),
    checkedBy: z.string().uuid().optional(),
  }).optional(),
  vaccinationStatus: z.enum(['FULLY_VACCINATED', 'PARTIALLY_VACCINATED', 'NOT_VACCINATED', 'NOT_DISCLOSED']).optional(),
  safetyBriefingCompleted: z.boolean().default(false),
  ndaSigned: z.boolean().default(false),
  photoConsent: z.boolean().default(false),
})

// Base visitor schema
export const baseVisitorSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name must be less than 100 characters'),
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  type: VisitorTypeSchema.default('GUEST'),
  status: VisitorStatusSchema.default('REGISTERED'),
  purpose: VisitPurposeSchema,
  contactInfo: ContactInfoSchema,
  emergencyContact: EmergencyContactSchema.optional(),
  idVerification: IDVerificationSchema.optional(),
  vehicleInfo: VehicleInfoSchema.optional(),
  accessPermissions: AccessPermissionsSchema.default({}),
  healthSafety: HealthSafetySchema.default({}),
  
  // Visit details
  hostUserId: z.string().uuid('Invalid host user ID').optional(),
  hostName: z.string().max(200).optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  expectedArrival: z.date({
    required_error: 'Expected arrival time is required',
  }),
  expectedDeparture: z.date().optional(),
  actualArrival: z.date().optional(),
  actualDeparture: z.date().optional(),
  
  // Additional information
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  specialRequirements: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),
  
  // Pre-registration
  preRegistrationCode: z.string().max(50).optional(),
  preRegisteredBy: z.string().uuid().optional(),
  preRegistrationExpiresAt: z.date().optional(),
  
  // Recurring visits
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    interval: z.number().int().min(1).default(1),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    endDate: z.date().optional(),
    occurrences: z.number().int().min(1).optional(),
  }).optional(),
  
  // Blacklist information
  isBlacklisted: z.boolean().default(false),
  blacklistReason: z.string().max(500).optional(),
  blacklistedAt: z.date().optional(),
  blacklistedBy: z.string().uuid().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
})

// Create visitor schema
export const createVisitorSchema = baseVisitorSchema

// Update visitor schema (all fields optional except ID)
export const updateVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
}).merge(baseVisitorSchema.partial())

// Delete visitor schema
export const deleteVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
})

// Get visitor schema
export const getVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
})

// List visitors schema
export const listVisitorsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: VisitorTypeSchema.optional(),
  status: VisitorStatusSchema.optional(),
  purpose: VisitPurposeSchema.optional(),
  hostUserId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isBlacklisted: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'company', 'expectedArrival', 'actualArrival', 'createdAt', 'updatedAt']).default('expectedArrival'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Check-in visitor schema
export const checkInVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
  actualArrival: z.date().optional(), // Defaults to now if not provided
  badgeNumber: z.string().max(50).optional(),
  accessCardNumber: z.string().max(50).optional(),
  parkingSpot: z.string().max(50).optional(),
  photoUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),
  healthDeclaration: z.boolean().optional(),
  temperature: z.number().optional(),
  notes: z.string().max(500).optional(),
})

// Check-out visitor schema
export const checkOutVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
  actualDeparture: z.date().optional(), // Defaults to now if not provided
  badgeReturned: z.boolean().default(true),
  accessCardReturned: z.boolean().default(true),
  feedback: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
})

// Pre-register visitor schema
export const preRegisterVisitorSchema = baseVisitorSchema.extend({
  sendInvitation: z.boolean().default(true),
  invitationMessage: z.string().max(1000).optional(),
  validityDays: z.number().int().min(1).max(30).default(7),
})

// Blacklist visitor schema
export const blacklistVisitorSchema = z.object({
  id: z.string().uuid('Invalid visitor ID'),
  reason: z.string().min(1, 'Blacklist reason is required').max(500),
  effectiveFrom: z.date().optional(), // Defaults to now
  effectiveUntil: z.date().optional(), // Optional end date for temporary blacklist
  notifyHost: z.boolean().default(true),
})

// Search visitor schema
export const searchVisitorSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(100),
  searchFields: z.array(z.enum(['name', 'email', 'phone', 'company', 'idNumber'])).default(['name', 'email', 'phone', 'company']),
  includeBlacklisted: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(10),
})

// Visitor statistics schema
export const getVisitorStatsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'type', 'purpose', 'host', 'client']).default('day'),
  includeRecurring: z.boolean().default(true),
})

// Type exports
export type VisitorType = z.infer<typeof VisitorTypeSchema>
export type VisitorStatus = z.infer<typeof VisitorStatusSchema>
export type IDType = z.infer<typeof IDTypeSchema>
export type VisitPurpose = z.infer<typeof VisitPurposeSchema>
export type ContactInfo = z.infer<typeof ContactInfoSchema>
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type IDVerification = z.infer<typeof IDVerificationSchema>
export type VehicleInfo = z.infer<typeof VehicleInfoSchema>
export type AccessPermissions = z.infer<typeof AccessPermissionsSchema>
export type HealthSafety = z.infer<typeof HealthSafetySchema>

export type CreateVisitorRequest = z.infer<typeof createVisitorSchema>
export type UpdateVisitorRequest = z.infer<typeof updateVisitorSchema>
export type DeleteVisitorRequest = z.infer<typeof deleteVisitorSchema>
export type GetVisitorRequest = z.infer<typeof getVisitorSchema>
export type ListVisitorsRequest = z.infer<typeof listVisitorsSchema>
export type CheckInVisitorRequest = z.infer<typeof checkInVisitorSchema>
export type CheckOutVisitorRequest = z.infer<typeof checkOutVisitorSchema>
export type PreRegisterVisitorRequest = z.infer<typeof preRegisterVisitorSchema>
export type BlacklistVisitorRequest = z.infer<typeof blacklistVisitorSchema>
export type SearchVisitorRequest = z.infer<typeof searchVisitorSchema>
export type GetVisitorStatsRequest = z.infer<typeof getVisitorStatsSchema>
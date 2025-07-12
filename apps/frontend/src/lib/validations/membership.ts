import { z } from 'zod'

// Enums for membership-related fields
export const MembershipTypeSchema = z.enum([
  'BASIC',
  'PREMIUM',
  'ENTERPRISE',
  'CUSTOM',
  'DAY_PASS',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY'
])

export const MembershipStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED',
  'PENDING_PAYMENT',
  'PENDING_ACTIVATION',
  'GRACE_PERIOD'
])

export const BillingCycleSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'ONE_TIME'
])

export const PlanFeatureSchema = z.enum([
  'DESK_ACCESS',
  'MEETING_ROOMS',
  'PHONE_BOOTHS',
  'PRINTING',
  'MAIL_HANDLING',
  'GUEST_ACCESS',
  'EVENTS_ACCESS',
  'STORAGE',
  'PARKING',
  'WIFI',
  'COFFEE',
  'CLEANING',
  'SECURITY',
  '24_7_ACCESS',
  'PRIORITY_BOOKING',
  'CONCIERGE',
  'KITCHEN_ACCESS'
])

export const AccessLevelSchema = z.enum([
  'BASIC',
  'STANDARD',
  'PREMIUM',
  'UNLIMITED',
  'RESTRICTED'
])

// Membership plan schema
export const membershipPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Plan name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: MembershipTypeSchema,
  billingCycle: BillingCycleSchema,
  
  // Pricing
  basePrice: z.number().min(0, 'Base price cannot be negative'),
  setupFee: z.number().min(0, 'Setup fee cannot be negative').default(0),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  
  // Features and limits
  features: z.array(PlanFeatureSchema).default([]),
  accessLevel: AccessLevelSchema.default('BASIC'),
  maxUsers: z.number().int().min(1, 'Max users must be at least 1').optional(),
  maxSpaces: z.number().int().min(0, 'Max spaces cannot be negative').optional(),
  maxHoursPerMonth: z.number().min(0, 'Max hours cannot be negative').optional(),
  maxBookingsPerMonth: z.number().int().min(0, 'Max bookings cannot be negative').optional(),
  maxGuestsPerDay: z.number().int().min(0, 'Max guests cannot be negative').default(0),
  
  // Access permissions
  allowedSpaceTypes: z.array(z.string()).default([]),
  allowedTimeSlots: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  })).default([]),
  
  // Billing and renewals
  trialPeriodDays: z.number().int().min(0, 'Trial period cannot be negative').default(0),
  gracePeriodDays: z.number().int().min(0, 'Grace period cannot be negative').default(7),
  autoRenewal: z.boolean().default(true),
  cancellationPolicy: z.string().max(1000, 'Cancellation policy must be less than 1000 characters').optional(),
  
  // Contract terms
  minimumCommitmentMonths: z.number().int().min(0, 'Minimum commitment cannot be negative').default(0),
  earlyTerminationFee: z.number().min(0, 'Early termination fee cannot be negative').default(0),
  
  // Discounts and promotions
  discountPercentage: z.number().min(0, 'Discount percentage cannot be negative').max(100, 'Discount percentage cannot exceed 100').default(0),
  discountValidUntil: z.date().optional(),
  promotionalCode: z.string().max(50).optional(),
  
  // Plan availability
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  availableFrom: z.date().optional(),
  availableUntil: z.date().optional(),
  maxSubscriptions: z.number().int().min(0).optional(),
  
  // Add-ons and extras
  availableAddOns: z.array(z.object({
    id: z.string(),
    name: z.string().max(100),
    description: z.string().max(300).optional(),
    price: z.number().min(0),
    billingCycle: BillingCycleSchema,
    isRequired: z.boolean().default(false),
  })).default([]),
  
  metadata: z.record(z.any()).optional(),
})

// Base membership schema
export const baseMembershipSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  clientId: z.string().uuid('Invalid client ID'),
  status: MembershipStatusSchema.default('PENDING_ACTIVATION'),
  
  // Billing and dates
  startDate: z.date(),
  endDate: z.date().optional(),
  nextBillingDate: z.date(),
  lastBillingDate: z.date().optional(),
  trialEndsAt: z.date().optional(),
  
  // Pricing overrides
  customPrice: z.number().min(0, 'Custom price cannot be negative').optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  setupFeeWaived: z.boolean().default(false),
  
  // Usage tracking
  usageThisMonth: z.object({
    hoursUsed: z.number().min(0).default(0),
    bookingsMade: z.number().int().min(0).default(0),
    guestVisits: z.number().int().min(0).default(0),
    servicesUsed: z.number().int().min(0).default(0),
  }).default({}),
  
  // Add-ons
  activeAddOns: z.array(z.object({
    addOnId: z.string(),
    name: z.string().max(100),
    price: z.number().min(0),
    billingCycle: BillingCycleSchema,
    activatedAt: z.date(),
    lastBilledAt: z.date().optional(),
    nextBillingAt: z.date(),
  })).default([]),
  
  // Payment and billing
  paymentMethodId: z.string().optional(),
  autoRenewal: z.boolean().default(true),
  billingAddress: z.object({
    street: z.string().max(200),
    city: z.string().max(100),
    state: z.string().max(100),
    country: z.string().max(100),
    postalCode: z.string().max(20),
  }).optional(),
  
  // Access permissions
  accessOverrides: z.object({
    allowedSpaces: z.array(z.string().uuid()).default([]),
    deniedSpaces: z.array(z.string().uuid()).default([]),
    customTimeSlots: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    })).default([]),
    specialPermissions: z.array(z.string()).default([]),
  }).default({}),
  
  // Terms and conditions
  agreedToTermsAt: z.date().optional(),
  agreedToTermsVersion: z.string().max(50).optional(),
  cancellationRequestedAt: z.date().optional(),
  cancellationReason: z.string().max(500).optional(),
  cancellationEffectiveDate: z.date().optional(),
  
  // Notifications and preferences
  notificationPreferences: z.object({
    billingReminders: z.boolean().default(true),
    usageAlerts: z.boolean().default(true),
    renewalNotifications: z.boolean().default(true),
    promotionalEmails: z.boolean().default(false),
  }).default({}),
  
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  metadata: z.record(z.any()).optional(),
})

// Create membership schema
export const createMembershipPlanSchema = membershipPlanSchema

export const createMembershipSchema = baseMembershipSchema.extend({
  sendWelcomeEmail: z.boolean().default(true),
  prorateBilling: z.boolean().default(true),
})

// Update schemas
export const updateMembershipPlanSchema = z.object({
  id: z.string().uuid('Invalid plan ID'),
}).merge(membershipPlanSchema.partial())

export const updateMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
}).merge(baseMembershipSchema.partial())

// Delete schemas
export const deleteMembershipPlanSchema = z.object({
  id: z.string().uuid('Invalid plan ID'),
  transferExistingMemberships: z.string().uuid().optional(), // Transfer to another plan
})

export const deleteMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
  reason: z.string().max(500).optional(),
  effectiveDate: z.date().optional(),
  refundAmount: z.number().min(0).optional(),
})

// Get schemas
export const getMembershipPlanSchema = z.object({
  id: z.string().uuid('Invalid plan ID'),
})

export const getMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
})

// List schemas
export const listMembershipPlansSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: MembershipTypeSchema.optional(),
  billingCycle: BillingCycleSchema.optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  sortBy: z.enum(['name', 'type', 'basePrice', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listMembershipsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  planId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: MembershipStatusSchema.optional(),
  dueSoon: z.boolean().optional(), // Memberships due for renewal in next 30 days
  overdue: z.boolean().optional(), // Memberships past due
  sortBy: z.enum(['startDate', 'endDate', 'nextBillingDate', 'status', 'createdAt']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Membership operations
export const suspendMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
  reason: z.string().min(1, 'Suspension reason is required').max(500),
  suspendUntil: z.date().optional(),
  notifyClient: z.boolean().default(true),
})

export const reactivateMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
  reason: z.string().max(500).optional(),
  adjustBilling: z.boolean().default(true),
  notifyClient: z.boolean().default(true),
})

export const renewMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
  renewalPeriod: z.number().int().min(1, 'Renewal period must be at least 1 month').default(1),
  customPrice: z.number().min(0).optional(),
  autoProcess: z.boolean().default(true),
})

export const upgradeMembershipSchema = z.object({
  id: z.string().uuid('Invalid membership ID'),
  newPlanId: z.string().uuid('Invalid plan ID'),
  effectiveDate: z.date().optional(), // Defaults to now
  prorateBilling: z.boolean().default(true),
  refundDifference: z.boolean().default(false),
})

export const addMembershipAddOnSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  addOnId: z.string(),
  customPrice: z.number().min(0).optional(),
  activationDate: z.date().optional(),
})

export const removeMembershipAddOnSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  addOnId: z.string(),
  effectiveDate: z.date().optional(),
  refundProratedAmount: z.boolean().default(false),
})

// Usage tracking
export const trackMembershipUsageSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  usageType: z.enum(['HOURS', 'BOOKING', 'GUEST_VISIT', 'SERVICE']),
  amount: z.number().min(0, 'Usage amount cannot be negative'),
  description: z.string().max(200).optional(),
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.any()).optional(),
})

export const getMembershipUsageSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
})

// Analytics and reporting
export const getMembershipAnalyticsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  planIds: z.array(z.string().uuid()).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'plan', 'status']).default('month'),
  includeChurn: z.boolean().default(true),
  includeMRR: z.boolean().default(true), // Monthly Recurring Revenue
})

export const getMembershipMetricsSchema = z.object({
  period: z.enum(['last_30_days', 'last_90_days', 'last_year', 'custom']).default('last_30_days'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  compareWithPreviousPeriod: z.boolean().default(true),
})

// Billing operations
export const processMembershipBillingSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  amount: z.number().min(0, 'Amount cannot be negative').optional(),
  description: z.string().max(200).optional(),
  processImmediately: z.boolean().default(false),
})

export const updateMembershipPaymentMethodSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  setAsDefault: z.boolean().default(true),
})

// Type exports
export type MembershipType = z.infer<typeof MembershipTypeSchema>
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>
export type BillingCycle = z.infer<typeof BillingCycleSchema>
export type PlanFeature = z.infer<typeof PlanFeatureSchema>
export type AccessLevel = z.infer<typeof AccessLevelSchema>

export type CreateMembershipPlanRequest = z.infer<typeof createMembershipPlanSchema>
export type CreateMembershipRequest = z.infer<typeof createMembershipSchema>
export type UpdateMembershipPlanRequest = z.infer<typeof updateMembershipPlanSchema>
export type UpdateMembershipRequest = z.infer<typeof updateMembershipSchema>
export type DeleteMembershipPlanRequest = z.infer<typeof deleteMembershipPlanSchema>
export type DeleteMembershipRequest = z.infer<typeof deleteMembershipSchema>
export type GetMembershipPlanRequest = z.infer<typeof getMembershipPlanSchema>
export type GetMembershipRequest = z.infer<typeof getMembershipSchema>
export type ListMembershipPlansRequest = z.infer<typeof listMembershipPlansSchema>
export type ListMembershipsRequest = z.infer<typeof listMembershipsSchema>
export type SuspendMembershipRequest = z.infer<typeof suspendMembershipSchema>
export type ReactivateMembershipRequest = z.infer<typeof reactivateMembershipSchema>
export type RenewMembershipRequest = z.infer<typeof renewMembershipSchema>
export type UpgradeMembershipRequest = z.infer<typeof upgradeMembershipSchema>
export type AddMembershipAddOnRequest = z.infer<typeof addMembershipAddOnSchema>
export type RemoveMembershipAddOnRequest = z.infer<typeof removeMembershipAddOnSchema>
export type TrackMembershipUsageRequest = z.infer<typeof trackMembershipUsageSchema>
export type GetMembershipUsageRequest = z.infer<typeof getMembershipUsageSchema>
export type GetMembershipAnalyticsRequest = z.infer<typeof getMembershipAnalyticsSchema>
export type GetMembershipMetricsRequest = z.infer<typeof getMembershipMetricsSchema>
export type ProcessMembershipBillingRequest = z.infer<typeof processMembershipBillingSchema>
export type UpdateMembershipPaymentMethodRequest = z.infer<typeof updateMembershipPaymentMethodSchema>
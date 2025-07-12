import { z } from 'zod'
import { 
  nameSchema, 
  addressSchema, 
  phoneSchema, 
  paginationSchema,
  searchSchema,
  uuidSchema,
} from './common'

/**
 * Client (Company/Team) validation schemas for Server Actions
 */

// Client creation schema
export const createClientSchema = z.object({
  name: nameSchema,
  description: z.string().max(1000, 'Description is too long').optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  website: z.string().url('Invalid website URL').optional(),
  industry: z.string().max(100, 'Industry is too long').optional(),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  address: addressSchema.optional(),
  contactInfo: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: phoneSchema,
    contactPerson: z.string().max(100, 'Contact person name is too long').optional(),
  }).optional(),
  settings: z.object({
    allowBookings: z.boolean().default(true),
    maxBookingsPerUser: z.number().min(1).max(100).default(10),
    bookingAdvanceLimit: z.number().min(1).max(365).default(30), // Days
    defaultMembershipType: z.string().optional(),
    customFields: z.record(z.string(), z.any()).optional(),
  }).optional(),
  billingInfo: z.object({
    billingEmail: z.string().email('Invalid billing email format').optional(),
    taxId: z.string().max(50, 'Tax ID is too long').optional(),
    paymentTerms: z.enum(['NET_15', 'NET_30', 'NET_45', 'NET_60']).default('NET_30'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    billingAddress: addressSchema.optional(),
  }).optional(),
})

export type CreateClientRequest = z.infer<typeof createClientSchema>

// Client update schema
export const updateClientSchema = createClientSchema.partial()

export type UpdateClientRequest = z.infer<typeof updateClientSchema>

// Client filters schema
export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  industry: z.string().optional(),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  hasActiveUsers: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.enum(['name', 'createdAt', 'status', 'industry']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type ClientFilters = z.infer<typeof clientFiltersSchema>

// Client membership schema
export const clientMembershipSchema = z.object({
  clientId: uuidSchema,
  userId: uuidSchema,
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
  permissions: z.array(z.string()).default([]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

export type ClientMembershipRequest = z.infer<typeof clientMembershipSchema>

// Client invitation schema
export const clientInvitationSchema = z.object({
  clientId: uuidSchema,
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
  permissions: z.array(z.string()).default([]),
  message: z.string().max(500, 'Invitation message is too long').optional(),
  expiresIn: z.number().min(1).max(168).default(72), // Hours
})

export type ClientInvitationRequest = z.infer<typeof clientInvitationSchema>

// Client settings update schema
export const updateClientSettingsSchema = z.object({
  allowBookings: z.boolean().optional(),
  maxBookingsPerUser: z.number().min(1).max(100).optional(),
  bookingAdvanceLimit: z.number().min(1).max(365).optional(),
  defaultMembershipType: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  notifications: z.object({
    bookingNotifications: z.boolean().optional(),
    invoiceNotifications: z.boolean().optional(),
    eventNotifications: z.boolean().optional(),
  }).optional(),
})

export type UpdateClientSettingsRequest = z.infer<typeof updateClientSettingsSchema>

// Bulk client operations
export const bulkClientOperationSchema = z.object({
  clientIds: z.array(uuidSchema).min(1, 'At least one client ID is required'),
  operation: z.enum(['activate', 'deactivate', 'suspend', 'archive']),
  reason: z.string().max(500, 'Reason is too long').optional(),
})

export type BulkClientOperationRequest = z.infer<typeof bulkClientOperationSchema>

// Combined pagination and filtering schemas
export const paginatedClientsSchema = paginationSchema.extend(clientFiltersSchema.shape)

export type PaginatedClientsQuery = z.infer<typeof paginatedClientsSchema>
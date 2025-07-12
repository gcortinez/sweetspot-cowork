import { z } from 'zod'

/**
 * Validation schemas for Invoice management
 */

// Enums
export const InvoiceStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'PAID',
  'OVERDUE',
  'CANCELLED'
])

// Invoice item schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255, 'Description must be less than 255 characters'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  total: z.number().positive('Total must be positive').optional(), // Will be calculated
})

// Invoice schemas
export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  number: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number must be less than 50 characters').optional(), // Auto-generated if not provided
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  dueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Due date must be a valid date',
  }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  tax: z.number().min(0, 'Tax cannot be negative').default(0),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine(
  (data) => {
    const now = new Date()
    return data.dueDate >= now
  },
  {
    message: 'Due date must be in the future',
    path: ['dueDate'],
  }
)

export const updateInvoiceSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  dueDate: z.date().optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
  tax: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  status: InvoiceStatusSchema.optional(),
}).refine(
  (data) => {
    if (data.dueDate) {
      const now = new Date()
      return data.dueDate >= now
    }
    return true
  },
  {
    message: 'Due date must be in the future',
    path: ['dueDate'],
  }
)

export const invoiceFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  status: InvoiceStatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  search: z.string().optional(), // Search in number, title, description
  overdue: z.boolean().optional(), // Filter overdue invoices
  unpaid: z.boolean().optional(), // Filter unpaid invoices
  currency: z.string().length(3).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['number', 'total', 'dueDate', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Invoice operations
export const sendInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  sendEmail: z.boolean().default(true),
  emailMessage: z.string().max(1000, 'Email message must be less than 1000 characters').optional(),
  reminderDate: z.date().optional(),
})

export const markInvoicePaidSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'OTHER']),
  paymentReference: z.string().max(100).optional(),
  paidAmount: z.number().positive('Paid amount must be positive').optional(), // If different from total
  paidAt: z.date().optional(), // If different from now
  notes: z.string().max(500).optional(),
})

export const bulkInvoiceActionSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1, 'At least one invoice is required'),
  action: z.enum(['send', 'cancel', 'delete', 'mark_overdue']),
  reason: z.string().max(500).optional(),
})

// Invoice statistics filters
export const invoiceStatsFiltersSchema = z.object({
  clientIds: z.array(z.string().uuid()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  status: z.array(InvoiceStatusSchema).optional(),
  currency: z.array(z.string().length(3)).optional(),
  includeRevenue: z.boolean().default(true),
  includeOverdue: z.boolean().default(true),
  includeCollections: z.boolean().default(true),
  groupBy: z.enum(['day', 'week', 'month', 'client', 'status']).default('month'),
})

// Recurring invoice schema
export const createRecurringInvoiceSchema = z.object({
  templateInvoiceId: z.string().uuid('Invalid template invoice ID'),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  interval: z.number().int().positive().default(1), // Every N periods
  startDate: z.date(),
  endDate: z.date().optional(),
  occurrences: z.number().int().positive().optional(), // Max occurrences
  autoSend: z.boolean().default(false),
  dayOfMonth: z.number().int().min(1).max(31).optional(), // For monthly
  dayOfWeek: z.number().int().min(0).max(6).optional(), // For weekly
}).refine(
  (data) => {
    if (data.endDate) {
      return data.endDate > data.startDate
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

// Types derived from schemas
export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceRequest = z.infer<typeof updateInvoiceSchema>
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>
export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type SendInvoiceRequest = z.infer<typeof sendInvoiceSchema>
export type MarkInvoicePaidRequest = z.infer<typeof markInvoicePaidSchema>
export type BulkInvoiceActionRequest = z.infer<typeof bulkInvoiceActionSchema>
export type InvoiceStatsFilters = z.infer<typeof invoiceStatsFiltersSchema>
export type CreateRecurringInvoiceRequest = z.infer<typeof createRecurringInvoiceSchema>
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>
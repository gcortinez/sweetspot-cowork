import { z } from 'zod'

/**
 * Validation schemas for Payment management
 */

// Enums
export const PaymentMethodSchema = z.enum([
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'PAYPAL',
  'STRIPE',
  'OTHER'
])

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
])

// Payment schemas
export const createPaymentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  invoiceId: z.string().uuid('Invalid invoice ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  method: PaymentMethodSchema,
  reference: z.string().max(100, 'Reference must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  processedAt: z.date().optional(), // If different from now
  metadata: z.record(z.any()).optional(), // For payment processor data
})

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  method: PaymentMethodSchema.optional(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  status: PaymentStatusSchema.optional(),
  processedAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
})

export const paymentFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  method: PaymentMethodSchema.optional(),
  status: PaymentStatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  search: z.string().optional(), // Search in reference, description
  currency: z.string().length(3).optional(),
  hasInvoice: z.boolean().optional(), // Filter payments with/without invoice
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['amount', 'processedAt', 'createdAt', 'status', 'method']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Payment processing schemas
export const processPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  processorResponse: z.record(z.any()).optional(),
  transactionId: z.string().max(100).optional(),
  processorFee: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  refundAmount: z.number().positive('Refund amount must be positive').optional(), // Full refund if not specified
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  refundReference: z.string().max(100).optional(),
  notifyClient: z.boolean().default(true),
})

export const bulkPaymentActionSchema = z.object({
  paymentIds: z.array(z.string().uuid()).min(1, 'At least one payment is required'),
  action: z.enum(['cancel', 'complete', 'mark_failed']),
  reason: z.string().max(500).optional(),
  notifyClients: z.boolean().default(false),
})

// Payment reconciliation schemas
export const createReconciliationSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  bankStatementTotal: z.number(),
  reconciliationType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).default('MONTHLY'),
  description: z.string().max(500).optional(),
  autoMatch: z.boolean().default(true),
  toleranceAmount: z.number().min(0).default(0.01), // Tolerance for auto-matching
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

export const matchPaymentSchema = z.object({
  reconciliationItemId: z.string().uuid('Invalid reconciliation item ID'),
  paymentId: z.string().uuid('Invalid payment ID'),
  matchConfidence: z.number().min(0).max(100).default(100),
  notes: z.string().max(500).optional(),
})

// Payment statistics filters
export const paymentStatsFiltersSchema = z.object({
  clientIds: z.array(z.string().uuid()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  status: z.array(PaymentStatusSchema).optional(),
  methods: z.array(PaymentMethodSchema).optional(),
  currency: z.array(z.string().length(3)).optional(),
  includeRefunds: z.boolean().default(true),
  includeFeesAnalysis: z.boolean().default(true),
  includeMethodBreakdown: z.boolean().default(true),
  groupBy: z.enum(['day', 'week', 'month', 'method', 'client']).default('month'),
})

// Payment plan schemas
export const createPaymentPlanSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  totalAmount: z.number().positive('Total amount must be positive'),
  installments: z.number().int().min(2).max(12, 'Maximum 12 installments'),
  frequency: z.enum(['WEEKLY', 'MONTHLY']).default('MONTHLY'),
  startDate: z.date(),
  description: z.string().max(500).optional(),
  autoCharge: z.boolean().default(false),
  reminderDays: z.number().int().min(0).max(30).default(3),
}).refine(
  (data) => {
    const now = new Date()
    return data.startDate >= now
  },
  {
    message: 'Start date must be in the future',
    path: ['startDate'],
  }
)

// Subscription payment schemas
export const createSubscriptionSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  planName: z.string().min(1, 'Plan name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  interval: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  intervalCount: z.number().int().positive().default(1),
  startDate: z.date(),
  endDate: z.date().optional(),
  trialDays: z.number().int().min(0).default(0),
  description: z.string().max(500).optional(),
  autoRenew: z.boolean().default(true),
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
export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>
export type UpdatePaymentRequest = z.infer<typeof updatePaymentSchema>
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>
export type ProcessPaymentRequest = z.infer<typeof processPaymentSchema>
export type RefundPaymentRequest = z.infer<typeof refundPaymentSchema>
export type BulkPaymentActionRequest = z.infer<typeof bulkPaymentActionSchema>
export type CreateReconciliationRequest = z.infer<typeof createReconciliationSchema>
export type MatchPaymentRequest = z.infer<typeof matchPaymentSchema>
export type PaymentStatsFilters = z.infer<typeof paymentStatsFiltersSchema>
export type CreatePaymentPlanRequest = z.infer<typeof createPaymentPlanSchema>
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
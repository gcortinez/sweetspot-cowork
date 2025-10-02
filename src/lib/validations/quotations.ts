import { z } from 'zod'

// Enum schemas for quotation-related fields
export const QuotationStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CONVERTED'
])

export const DiscountTypeSchema = z.enum([
  'FIXED',
  'PERCENTAGE'
])

// Base quotation item schema
export const QuotationItemSchema = z.object({
  id: z.string().optional(),
  serviceId: z.string().optional(), // Optional if it's a custom item
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0'),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  metadata: z.record(z.any()).optional(), // For custom data like service configurations
})

// Create quotation schema
export const CreateQuotationSchema = z.object({
  clientId: z.string().min(1, 'El cliente es requerido'),
  opportunityId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  items: z.array(QuotationItemSchema).min(1, 'Debe incluir al menos un item'),
  discountType: DiscountTypeSchema.default('FIXED'),
  discountValue: z.number().min(0, 'El valor del descuento no puede ser negativo').default(0),
  currency: z.string().default('CLP'),
  validUntil: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return parsedDate > new Date()
  }, 'La fecha de validez debe ser futura'),
  notes: z.string().optional(),
}).refine((data) => {
  // Calculate subtotal from items
  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0)

  // Calculate discount amount
  const discountAmount = data.discountType === 'PERCENTAGE'
    ? (subtotal * data.discountValue) / 100
    : data.discountValue

  // Validate discount doesn't exceed subtotal
  if (discountAmount > subtotal) {
    return false
  }

  // Calculate taxes (19% IVA on subtotal - discount)
  const taxableAmount = subtotal - discountAmount
  const taxes = taxableAmount * 0.19

  // Calculate total
  const total = subtotal - discountAmount + taxes
  return total >= 0
}, 'El descuento no puede ser mayor al subtotal')

// Update quotation schema
export const UpdateQuotationSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
  title: z.string().min(1, 'El título es requerido').optional(),
  description: z.string().optional(),
  items: z.array(QuotationItemSchema).min(1, 'Debe incluir al menos un item').optional(),
  discountType: DiscountTypeSchema.optional(),
  discountValue: z.number().min(0, 'El valor del descuento no puede ser negativo').optional(),
  currency: z.string().optional(),
  validUntil: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return parsedDate > new Date()
  }, 'La fecha de validez debe ser futura').optional(),
  notes: z.string().optional(),
})

// Delete quotation schema
export const DeleteQuotationSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
})

// Get quotation schema
export const GetQuotationSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
})

// List quotations schema
export const ListQuotationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: QuotationStatusSchema.optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  leadId: z.string().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  validUntilAfter: z.string().optional(),
  validUntilBefore: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'number', 'total', 'validUntil']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Change quotation status schema
export const ChangeQuotationStatusSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
  status: QuotationStatusSchema,
  notes: z.string().optional(),
})

// Duplicate quotation schema
export const DuplicateQuotationSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
  title: z.string().min(1, 'El título es requerido').optional(),
  validUntil: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return parsedDate > new Date()
  }, 'La fecha de validez debe ser futura').optional(),
})

// Quotation statistics schema
export const GetQuotationStatsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
})

// Send quotation schema
export const SendQuotationSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
  recipientEmail: z.string().email('Email inválido').optional(),
  subject: z.string().min(1, 'El asunto es requerido').optional(),
  message: z.string().optional(),
  attachPDF: z.boolean().default(true),
})

// Convert quotation to contract schema
export const ConvertQuotationToContractSchema = z.object({
  id: z.string().min(1, 'El ID de la cotización es requerido'),
  startDate: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, 'Fecha de inicio inválida'),
  endDate: z.string().refine((date) => {
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }, 'Fecha de fin inválida').optional(),
  autoRenew: z.boolean().default(false),
  renewalPeriod: z.string().optional(),
  additionalTerms: z.string().optional(),
})

// Add service to quotation schema
export const AddServiceToQuotationSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  serviceId: z.string().min(1, 'El ID del servicio es requerido'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  customPrice: z.number().min(0, 'El precio personalizado debe ser mayor o igual a 0').optional(),
  description: z.string().optional(), // Override service description
})

// Remove service from quotation schema
export const RemoveServiceFromQuotationSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  itemId: z.string().min(1, 'El ID del item es requerido'),
})

// Update quotation item schema
export const UpdateQuotationItemSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  itemId: z.string().min(1, 'El ID del item es requerido'),
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0').optional(),
  unitPrice: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0').optional(),
  description: z.string().optional(),
})

// Apply discount to quotation schema
export const ApplyDiscountToQuotationSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().min(0, 'El valor del descuento debe ser mayor o igual a 0'),
  description: z.string().optional(),
})

// Type exports
export type QuotationStatus = z.infer<typeof QuotationStatusSchema>
export type DiscountType = z.infer<typeof DiscountTypeSchema>
export type QuotationItem = z.infer<typeof QuotationItemSchema>
export type CreateQuotationRequest = z.infer<typeof CreateQuotationSchema>
export type UpdateQuotationRequest = z.infer<typeof UpdateQuotationSchema>
export type DeleteQuotationRequest = z.infer<typeof DeleteQuotationSchema>
export type GetQuotationRequest = z.infer<typeof GetQuotationSchema>
export type ListQuotationsRequest = z.infer<typeof ListQuotationsSchema>
export type ChangeQuotationStatusRequest = z.infer<typeof ChangeQuotationStatusSchema>
export type DuplicateQuotationRequest = z.infer<typeof DuplicateQuotationSchema>
export type GetQuotationStatsRequest = z.infer<typeof GetQuotationStatsSchema>
export type SendQuotationRequest = z.infer<typeof SendQuotationSchema>
export type ConvertQuotationToContractRequest = z.infer<typeof ConvertQuotationToContractSchema>
export type AddServiceToQuotationRequest = z.infer<typeof AddServiceToQuotationSchema>
export type RemoveServiceFromQuotationRequest = z.infer<typeof RemoveServiceFromQuotationSchema>
export type UpdateQuotationItemRequest = z.infer<typeof UpdateQuotationItemSchema>
export type ApplyDiscountToQuotationRequest = z.infer<typeof ApplyDiscountToQuotationSchema>

// Utility functions for quotation calculations
export const calculateQuotationTotals = (
  items: QuotationItem[],
  discountType: 'FIXED' | 'PERCENTAGE' = 'FIXED',
  discountValue: number = 0
) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)

  // Calculate discount amount based on type
  const discountAmount = discountType === 'PERCENTAGE'
    ? (subtotal * discountValue) / 100
    : discountValue

  // Calculate taxable amount (subtotal - discount)
  const taxableAmount = Math.max(0, subtotal - discountAmount)

  // Calculate IVA (19% of taxable amount)
  const taxes = taxableAmount * 0.19

  // Calculate total
  const total = subtotal - discountAmount + taxes

  return {
    subtotal,
    discountType,
    discountValue,
    discounts: discountAmount,
    taxes,
    total: Math.max(0, total) // Ensure total is never negative
  }
}

export const validateQuotationItems = (items: QuotationItem[]) => {
  return items.every(item => {
    const calculatedTotal = item.quantity * item.unitPrice
    return Math.abs(calculatedTotal - item.total) < 0.01 // Allow for floating point precision
  })
}

// Quotation number generation helper
export const generateQuotationNumber = (tenantId: string, sequence: number) => {
  const prefix = 'COT'
  const year = new Date().getFullYear()
  const paddedSequence = sequence.toString().padStart(4, '0')
  return `${prefix}-${year}-${paddedSequence}`
}

// Quotation version helper
export const generateQuotationVersion = (baseNumber: string, version: number) => {
  return `${baseNumber}-v${version}`
}
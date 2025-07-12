import { z } from 'zod'

// Enums for contract-related fields
export const ContractTypeSchema = z.enum([
  'MEMBERSHIP',
  'SERVICE_AGREEMENT',
  'LEASE',
  'VENDOR',
  'EMPLOYMENT',
  'NDA',
  'PARTNERSHIP',
  'MAINTENANCE',
  'LICENSING',
  'OTHER'
])

export const ContractStatusSchema = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
  'CANCELLED',
  'SUSPENDED',
  'RENEWED',
  'AMENDED'
])

export const SignatureStatusSchema = z.enum([
  'PENDING',
  'SIGNED',
  'DECLINED',
  'EXPIRED'
])

export const ContractPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
])

export const RenewalTypeSchema = z.enum([
  'AUTOMATIC',
  'MANUAL',
  'OPT_IN',
  'OPT_OUT',
  'NO_RENEWAL'
])

export const TerminationTypeSchema = z.enum([
  'FOR_CAUSE',
  'WITHOUT_CAUSE',
  'MUTUAL_CONSENT',
  'EXPIRATION',
  'BREACH',
  'CONVENIENCE'
])

// Contract terms and clauses schema
export const ContractTermSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Term title is required').max(200),
  description: z.string().max(2000),
  type: z.enum(['PAYMENT', 'PERFORMANCE', 'TERMINATION', 'LIABILITY', 'CONFIDENTIALITY', 'GENERAL']),
  isRequired: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  parentId: z.string().optional(), // For nested terms
})

// Payment terms schema
export const PaymentTermsSchema = z.object({
  paymentSchedule: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME', 'MILESTONE', 'CUSTOM']),
  paymentDueDays: z.number().int().min(0, 'Payment due days cannot be negative').default(30),
  lateFeePercentage: z.number().min(0, 'Late fee percentage cannot be negative').max(100).default(0),
  lateFeeFixed: z.number().min(0, 'Late fee amount cannot be negative').default(0),
  gracePeriodDays: z.number().int().min(0, 'Grace period cannot be negative').default(0),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100).default(0),
  discountTerms: z.string().max(500).optional(),
  invoicingAddress: z.object({
    street: z.string().max(200),
    city: z.string().max(100),
    state: z.string().max(100),
    country: z.string().max(100),
    postalCode: z.string().max(20),
  }).optional(),
})

// Renewal terms schema
export const RenewalTermsSchema = z.object({
  renewalType: RenewalTypeSchema,
  renewalPeriodMonths: z.number().int().min(1, 'Renewal period must be at least 1 month').default(12),
  renewalNoticeDays: z.number().int().min(0, 'Renewal notice days cannot be negative').default(30),
  priceAdjustmentPercentage: z.number().min(-100, 'Price adjustment cannot exceed -100%').max(1000).default(0),
  maxRenewals: z.number().int().min(0).optional(), // Unlimited if not specified
  renewalTerms: z.string().max(1000).optional(),
})

// Termination terms schema
export const TerminationTermsSchema = z.object({
  terminationNoticeDays: z.number().int().min(0, 'Termination notice days cannot be negative').default(30),
  earlyTerminationFee: z.number().min(0, 'Early termination fee cannot be negative').default(0),
  terminationConditions: z.array(z.string().max(500)).default([]),
  refundPolicy: z.string().max(1000).optional(),
  assetReturnRequirements: z.string().max(1000).optional(),
})

// Signature requirement schema
export const SignatureRequirementSchema = z.object({
  signerName: z.string().min(1, 'Signer name is required').max(200),
  signerEmail: z.string().email('Invalid email address'),
  signerRole: z.string().max(100),
  organizationName: z.string().max(200).optional(),
  isRequired: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  status: SignatureStatusSchema.default('PENDING'),
  signedAt: z.date().optional(),
  signatureImageUrl: z.string().url().optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
  declineReason: z.string().max(500).optional(),
})

// Contract amendment schema
export const ContractAmendmentSchema = z.object({
  title: z.string().min(1, 'Amendment title is required').max(200),
  description: z.string().max(2000),
  amendmentType: z.enum(['PRICE_CHANGE', 'TERM_EXTENSION', 'SCOPE_CHANGE', 'GENERAL']),
  effectiveDate: z.date(),
  oldValue: z.string().max(1000).optional(),
  newValue: z.string().max(1000).optional(),
  reason: z.string().max(1000),
  documentUrl: z.string().url().optional(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
})

// Milestone schema for milestone-based contracts
export const ContractMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(200),
  description: z.string().max(1000),
  dueDate: z.date(),
  amount: z.number().min(0, 'Milestone amount cannot be negative').optional(),
  deliverables: z.array(z.string().max(300)).default([]),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  completedAt: z.date().optional(),
  notes: z.string().max(1000).optional(),
})

// Base contract schema
export const baseContractSchema = z.object({
  title: z.string().min(1, 'Contract title is required').max(200),
  description: z.string().max(2000).optional(),
  type: ContractTypeSchema,
  status: ContractStatusSchema.default('DRAFT'),
  priority: ContractPrioritySchema.default('MEDIUM'),
  
  // Parties involved
  clientId: z.string().uuid('Invalid client ID'),
  vendorId: z.string().uuid('Invalid vendor ID').optional(),
  
  // Contract details
  contractNumber: z.string().max(100).optional(), // Auto-generated if not provided
  version: z.string().max(20).default('1.0'),
  language: z.string().length(2).default('en'), // ISO language code
  jurisdiction: z.string().max(100).optional(),
  governingLaw: z.string().max(200).optional(),
  
  // Dates
  effectiveDate: z.date(),
  expirationDate: z.date().optional(),
  signatureDeadline: z.date().optional(),
  
  // Financial terms
  totalValue: z.number().min(0, 'Total value cannot be negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  paymentTerms: PaymentTermsSchema.optional(),
  
  // Contract terms
  terms: z.array(ContractTermSchema).default([]),
  renewalTerms: RenewalTermsSchema.optional(),
  terminationTerms: TerminationTermsSchema.optional(),
  
  // Documents and attachments
  documentUrl: z.string().url().optional(),
  templateId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    name: z.string().max(200),
    url: z.string().url(),
    type: z.string().max(50),
    size: z.number().int().min(0),
    uploadedAt: z.date(),
  })).default([]),
  
  // Signatures
  signatureRequirements: z.array(SignatureRequirementSchema).default([]),
  
  // Milestones (for milestone-based contracts)
  milestones: z.array(ContractMilestoneSchema).default([]),
  
  // Amendments and modifications
  amendments: z.array(ContractAmendmentSchema).default([]),
  
  // Notifications and reminders
  reminderSettings: z.object({
    expirationReminderDays: z.array(z.number().int().min(0)).default([30, 7, 1]),
    renewalReminderDays: z.array(z.number().int().min(0)).default([60, 30, 7]),
    paymentReminderDays: z.array(z.number().int().min(0)).default([7, 3, 1]),
    milestoneReminderDays: z.array(z.number().int().min(0)).default([7, 3, 1]),
  }).default({}),
  
  // Compliance and legal
  complianceRequirements: z.array(z.string().max(300)).default([]),
  regulatoryFramework: z.string().max(200).optional(),
  confidentialityLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  
  // Performance metrics
  performanceMetrics: z.array(z.object({
    name: z.string().max(100),
    description: z.string().max(300),
    target: z.string().max(100),
    measurement: z.string().max(100),
    frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'MILESTONE']),
  })).default([]),
  
  // Risk management
  riskFactors: z.array(z.object({
    factor: z.string().max(200),
    impact: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    probability: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    mitigation: z.string().max(500),
  })).default([]),
  
  // Integration with other systems
  membershipId: z.string().uuid().optional(), // Link to membership if applicable
  invoiceId: z.string().uuid().optional(), // Link to invoice if applicable
  
  // Workflow and approval
  approvalWorkflow: z.array(z.object({
    stepName: z.string().max(100),
    approverRole: z.string().max(100),
    approverUserId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
    approvedAt: z.date().optional(),
    comments: z.string().max(500).optional(),
  })).default([]),
  
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  metadata: z.record(z.any()).optional(),
})

// Create contract schema
export const createContractSchema = baseContractSchema.extend({
  sendForSignature: z.boolean().default(false),
  generateFromTemplate: z.boolean().default(false),
})

// Update contract schema
export const updateContractSchema = z.object({
  id: z.string().uuid('Invalid contract ID'),
}).merge(baseContractSchema.partial())

// Delete contract schema
export const deleteContractSchema = z.object({
  id: z.string().uuid('Invalid contract ID'),
  reason: z.string().max(500).optional(),
})

// Get contract schema
export const getContractSchema = z.object({
  id: z.string().uuid('Invalid contract ID'),
})

// List contracts schema
export const listContractsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100, 'Search query must be less than 100 characters').optional(),
  type: ContractTypeSchema.optional(),
  status: ContractStatusSchema.optional(),
  priority: ContractPrioritySchema.optional(),
  clientId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  expiringIn: z.number().int().min(0).optional(), // Days
  effectiveDateFrom: z.date().optional(),
  effectiveDateTo: z.date().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['title', 'type', 'status', 'effectiveDate', 'expirationDate', 'totalValue', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Contract operations
export const signContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  signerEmail: z.string().email('Invalid email address'),
  signatureImageUrl: z.string().url().optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
})

export const approveContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  stepName: z.string().max(100),
  approved: z.boolean(),
  comments: z.string().max(500).optional(),
})

export const amendContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  amendment: ContractAmendmentSchema,
  requiresSignature: z.boolean().default(true),
})

export const renewContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  renewalPeriodMonths: z.number().int().min(1).optional(),
  priceAdjustmentPercentage: z.number().min(-100).max(1000).optional(),
  updateTerms: z.boolean().default(false),
  autoApprove: z.boolean().default(false),
})

export const terminateContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  terminationType: TerminationTypeSchema,
  effectiveDate: z.date(),
  reason: z.string().min(1, 'Termination reason is required').max(1000),
  notifyParties: z.boolean().default(true),
  calculatePenalties: z.boolean().default(true),
})

export const suspendContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  reason: z.string().min(1, 'Suspension reason is required').max(500),
  suspendUntil: z.date().optional(),
  notifyParties: z.boolean().default(true),
})

export const reactivateContractSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  reason: z.string().max(500).optional(),
  adjustDates: z.boolean().default(true),
  notifyParties: z.boolean().default(true),
})

// Template management
export const createContractTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional(),
  type: ContractTypeSchema,
  templateContent: z.string().min(1, 'Template content is required'),
  defaultTerms: z.array(ContractTermSchema).default([]),
  placeholders: z.array(z.object({
    key: z.string().max(100),
    label: z.string().max(200),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']),
    required: z.boolean().default(false),
    defaultValue: z.string().max(500).optional(),
    options: z.array(z.string()).optional(), // For SELECT type
  })).default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
})

// Analytics and reporting
export const getContractAnalyticsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'type', 'status', 'client']).default('month'),
  includeValue: z.boolean().default(true),
  includeExpiring: z.boolean().default(true),
})

export const getContractMetricsSchema = z.object({
  period: z.enum(['last_30_days', 'last_90_days', 'last_year', 'custom']).default('last_30_days'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  compareWithPreviousPeriod: z.boolean().default(true),
})

// Type exports
export type ContractType = z.infer<typeof ContractTypeSchema>
export type ContractStatus = z.infer<typeof ContractStatusSchema>
export type SignatureStatus = z.infer<typeof SignatureStatusSchema>
export type ContractPriority = z.infer<typeof ContractPrioritySchema>
export type RenewalType = z.infer<typeof RenewalTypeSchema>
export type TerminationType = z.infer<typeof TerminationTypeSchema>
export type ContractTerm = z.infer<typeof ContractTermSchema>
export type PaymentTerms = z.infer<typeof PaymentTermsSchema>
export type RenewalTerms = z.infer<typeof RenewalTermsSchema>
export type TerminationTerms = z.infer<typeof TerminationTermsSchema>
export type SignatureRequirement = z.infer<typeof SignatureRequirementSchema>
export type ContractAmendment = z.infer<typeof ContractAmendmentSchema>
export type ContractMilestone = z.infer<typeof ContractMilestoneSchema>

export type CreateContractRequest = z.infer<typeof createContractSchema>
export type UpdateContractRequest = z.infer<typeof updateContractSchema>
export type DeleteContractRequest = z.infer<typeof deleteContractSchema>
export type GetContractRequest = z.infer<typeof getContractSchema>
export type ListContractsRequest = z.infer<typeof listContractsSchema>
export type SignContractRequest = z.infer<typeof signContractSchema>
export type ApproveContractRequest = z.infer<typeof approveContractSchema>
export type AmendContractRequest = z.infer<typeof amendContractSchema>
export type RenewContractRequest = z.infer<typeof renewContractSchema>
export type TerminateContractRequest = z.infer<typeof terminateContractSchema>
export type SuspendContractRequest = z.infer<typeof suspendContractSchema>
export type ReactivateContractRequest = z.infer<typeof reactivateContractSchema>
export type CreateContractTemplateRequest = z.infer<typeof createContractTemplateSchema>
export type GetContractAnalyticsRequest = z.infer<typeof getContractAnalyticsSchema>
export type GetContractMetricsRequest = z.infer<typeof getContractMetricsSchema>
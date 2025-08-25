import { z } from 'zod'

// Pipeline stages enum from Prisma schema
export const pipelineStageEnum = z.enum([
  'INITIAL_CONTACT',
  'NEEDS_ANALYSIS', 
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'CONTRACT_REVIEW',
  'CLOSED_WON',
  'CLOSED_LOST',
  'ON_HOLD'
])

// Create opportunity schema
export const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be positive'),
  probability: z.number().int().min(0).max(100).default(0),
  expectedRevenue: z.number().min(0).optional(),
  stage: pipelineStageEnum.default('INITIAL_CONTACT'),
  expectedCloseDate: z.string().datetime().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  assignedToId: z.string().optional(),
  competitorInfo: z.string().optional(),
})

// Update opportunity schema
export const updateOpportunitySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedRevenue: z.number().min(0).optional(),
  stage: pipelineStageEnum.optional(),
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().optional(),
  lostReason: z.string().optional(),
  competitorInfo: z.string().optional(),
  assignedToId: z.string().optional(),
})

// Stage change schema with reason for lost opportunities
export const changeStageSchema = z.object({
  stage: pipelineStageEnum,
  probability: z.number().int().min(0).max(100).optional(),
  lostReason: z.string().optional(),
  actualCloseDate: z.string().datetime().optional(),
})

// Convert lead to opportunity schema
export const convertLeadToOpportunitySchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  value: z.number().min(0, 'Value must be positive'),
  probability: z.number().int().min(0).max(100).default(25),
  expectedCloseDate: z.string().datetime().optional(),
  stage: pipelineStageEnum.default('INITIAL_CONTACT'),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
})

// List opportunities schema
export const listOpportunitiesSchema = z.object({
  stage: pipelineStageEnum.optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  minValue: z.number().min(0).optional(),
  maxValue: z.number().min(0).optional(),
  expectedCloseBefore: z.string().datetime().optional(),
  expectedCloseAfter: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'value', 'expectedCloseDate', 'probability', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

// Opportunity stats schema
export const opportunityStatsSchema = z.object({
  includeProjections: z.boolean().default(true),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
})

// Type exports
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>
export type ChangeStageInput = z.infer<typeof changeStageSchema>
export type ConvertLeadToOpportunityInput = z.infer<typeof convertLeadToOpportunitySchema>
export type ListOpportunitiesInput = z.infer<typeof listOpportunitiesSchema>
export type OpportunityStatsInput = z.infer<typeof opportunityStatsSchema>
export type PipelineStage = z.infer<typeof pipelineStageEnum>

// Stage metadata for UI
export const STAGE_METADATA = {
  INITIAL_CONTACT: {
    label: 'Primer Contacto',
    description: 'Primera interacción con el prospecto calificado',
    color: 'blue',
    probability: 10,
  },
  NEEDS_ANALYSIS: {
    label: 'Análisis de Necesidades',
    description: 'Entendimiento de requerimientos',
    color: 'indigo',
    probability: 25,
  },
  PROPOSAL_SENT: {
    label: 'Propuesta Enviada',
    description: 'Cotización o propuesta enviada',
    color: 'purple',
    probability: 40,
  },
  NEGOTIATION: {
    label: 'Negociación',
    description: 'En fase de negociación',
    color: 'orange',
    probability: 60,
  },
  CONTRACT_REVIEW: {
    label: 'Revisión de Contrato',
    description: 'Contrato bajo revisión',
    color: 'yellow',
    probability: 80,
  },
  CLOSED_WON: {
    label: 'Cerrado Ganado',
    description: 'Cliente adquirido exitosamente',
    color: 'green',
    probability: 100,
  },
  CLOSED_LOST: {
    label: 'Cerrado Perdido',
    description: 'Oportunidad perdida',
    color: 'red',
    probability: 0,
  },
  ON_HOLD: {
    label: 'En Espera',
    description: 'Temporalmente pausada',
    color: 'gray',
    probability: null, // Keep current probability
  },
} as const
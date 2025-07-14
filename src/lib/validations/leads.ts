import { z } from 'zod'

// Validation schemas
export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  qualificationNotes: z.string().optional(),
  assignedToId: z.string().optional(),
})

export const updateLeadSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  qualificationNotes: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'DORMANT']).optional(),
  score: z.number().min(0).max(100).optional(),
  assignedToId: z.string().optional(),
})

export const leadsListSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'DORMANT']).optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
})

// Types
export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadsListInput = z.infer<typeof leadsListSchema>
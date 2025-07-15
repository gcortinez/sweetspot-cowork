import { z } from 'zod'

// Enum values from Prisma schema
export const activityTypeEnum = z.enum([
  'CALL',
  'EMAIL', 
  'MEETING',
  'TASK',
  'NOTE',
  'TOUR',
  'FOLLOW_UP',
  'DOCUMENT'
])

// Create activity schema
export const createActivitySchema = z.object({
  type: activityTypeEnum,
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(),
  location: z.string().optional(),
  outcome: z.string().optional(),
  completedAt: z.string().datetime().optional().nullable(),
})

// Update activity schema
export const updateActivitySchema = z.object({
  type: activityTypeEnum.optional(),
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(),
  location: z.string().optional(),
  outcome: z.string().optional(),
  completedAt: z.string().datetime().optional().nullable(),
})

// List activities schema
export const listActivitiesSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  type: activityTypeEnum.optional(),
  completed: z.boolean().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'type', 'subject']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Type exports
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type ListActivitiesInput = z.infer<typeof listActivitiesSchema>
export type ActivityType = z.infer<typeof activityTypeEnum>
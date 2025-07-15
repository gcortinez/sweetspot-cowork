import { z } from 'zod'

// Client status enum
export const CLIENT_STATUS = {
  LEAD: 'LEAD',
  PROSPECT: 'PROSPECT', 
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CHURNED: 'CHURNED'
} as const

export type ClientStatus = keyof typeof CLIENT_STATUS

// Client status metadata for UI
export const CLIENT_STATUS_METADATA = {
  LEAD: {
    label: 'Prospecto',
    color: 'blue',
    description: 'Contacto inicial, aún no calificado'
  },
  PROSPECT: {
    label: 'Prospecto Calificado',
    color: 'indigo',
    description: 'Prospecto calificado, potencial cliente'
  },
  ACTIVE: {
    label: 'Cliente Activo',
    color: 'green',
    description: 'Cliente activo con servicios contratados'
  },
  INACTIVE: {
    label: 'Cliente Inactivo',
    color: 'yellow',
    description: 'Cliente sin servicios activos'
  },
  CHURNED: {
    label: 'Cliente Perdido',
    color: 'red',
    description: 'Cliente que canceló servicios'
  }
} as const

// Base client schema
const baseClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.nativeEnum(CLIENT_STATUS).default('LEAD'),
  notes: z.string().optional(),
})

// Create client schema
export const createClientSchema = baseClientSchema

// Update client schema (all fields optional except those that should remain required)
export const updateClientSchema = baseClientSchema.partial().extend({
  // These fields can be updated but should maintain their validation when provided
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
})

// List clients schema
export const listClientsSchema = z.object({
  status: z.nativeEnum(CLIENT_STATUS).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'status', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Client stats schema
export const clientStatsSchema = z.object({
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
})

// Convert lead to client schema
export const convertLeadToClientSchema = z.object({
  leadId: z.string(),
  clientData: createClientSchema.partial().extend({
    // Override some fields that might come from the lead
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
  }),
})

// Client search schema
export const clientSearchSchema = z.object({
  query: z.string().min(1, 'La búsqueda debe tener al menos 1 caracter'),
  limit: z.number().min(1).max(50).default(10),
})

// Type exports
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ListClientsInput = z.infer<typeof listClientsSchema>
export type ClientStatsInput = z.infer<typeof clientStatsSchema>
export type ConvertLeadToClientInput = z.infer<typeof convertLeadToClientSchema>
export type ClientSearchInput = z.infer<typeof clientSearchSchema>

// Client with relationships type (for components)
export interface ClientWithRelations {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  taxId?: string
  contactPerson?: string
  status: ClientStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Related data
  _count?: {
    opportunities: number
    leads: number
  }
  opportunities?: Array<{
    id: string
    title: string
    value: number
    stage: string
    createdAt: Date
  }>
}
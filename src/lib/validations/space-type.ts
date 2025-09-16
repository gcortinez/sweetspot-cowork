import { z } from 'zod'

// Space type configuration schemas
export const spaceTypeConfigSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre debe tener menos de 100 caracteres'),
  key: z.string().min(1, 'La clave es requerida').max(50, 'La clave debe tener menos de 50 caracteres')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'La clave debe estar en mayúsculas y puede contener números y guiones bajos'),
  description: z.string().max(500, 'La descripción debe tener menos de 500 caracteres').optional(),
  icon: z.string().max(50, 'El icono debe tener menos de 50 caracteres').optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'El color debe ser un código hexadecimal válido').optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0, 'El orden debe ser un número positivo').default(0),
})

export const createSpaceTypeConfigSchema = spaceTypeConfigSchema

export const updateSpaceTypeConfigSchema = z.object({
  id: z.string().uuid('ID de tipo de espacio inválido'),
}).merge(spaceTypeConfigSchema.partial())

export const deleteSpaceTypeConfigSchema = z.object({
  id: z.string().uuid('ID de tipo de espacio inválido'),
})

export const getSpaceTypeConfigSchema = z.object({
  id: z.string().uuid('ID de tipo de espacio inválido'),
})

export const listSpaceTypeConfigsSchema = z.object({
  page: z.number().int().min(1, 'La página debe ser al menos 1').default(1),
  limit: z.number().int().min(1, 'El límite debe ser al menos 1').max(100, 'El límite no puede exceder 100').default(50),
  search: z.string().max(100, 'La búsqueda debe tener menos de 100 caracteres').optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'key', 'sortOrder', 'createdAt', 'updatedAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const createDefaultSpaceTypesSchema = z.object({
  overwrite: z.boolean().default(false),
})

// Type exports
export type SpaceTypeConfig = z.infer<typeof spaceTypeConfigSchema>
export type CreateSpaceTypeConfigRequest = z.infer<typeof createSpaceTypeConfigSchema>
export type UpdateSpaceTypeConfigRequest = z.infer<typeof updateSpaceTypeConfigSchema>
export type DeleteSpaceTypeConfigRequest = z.infer<typeof deleteSpaceTypeConfigSchema>
export type GetSpaceTypeConfigRequest = z.infer<typeof getSpaceTypeConfigSchema>
export type ListSpaceTypeConfigsRequest = z.infer<typeof listSpaceTypeConfigsSchema>
export type CreateDefaultSpaceTypesRequest = z.infer<typeof createDefaultSpaceTypesSchema>

// Default space types with Spanish names
export const DEFAULT_SPACE_TYPES = [
  {
    key: 'MEETING_ROOM',
    name: 'Sala de Reuniones',
    description: 'Espacios diseñados para reuniones de equipos pequeños a medianos',
    icon: 'users',
    color: '#3B82F6',
    sortOrder: 1,
    isDefault: true,
  },
  {
    key: 'CONFERENCE_ROOM',
    name: 'Sala de Conferencias',
    description: 'Espacios grandes para presentaciones y conferencias',
    icon: 'presentation',
    color: '#8B5CF6',
    sortOrder: 2,
    isDefault: true,
  },
  {
    key: 'PHONE_BOOTH',
    name: 'Cabina Telefónica',
    description: 'Espacios privados para llamadas y videoconferencias',
    icon: 'phone',
    color: '#10B981',
    sortOrder: 3,
    isDefault: true,
  },
  {
    key: 'EVENT_SPACE',
    name: 'Espacio para Eventos',
    description: 'Espacios versátiles para eventos corporativos y sociales',
    icon: 'calendar',
    color: '#F59E0B',
    sortOrder: 4,
    isDefault: true,
  },
  {
    key: 'COMMON_AREA',
    name: 'Área Común',
    description: 'Espacios compartidos para trabajo colaborativo e informal',
    icon: 'coffee',
    color: '#84CC16',
    sortOrder: 5,
    isDefault: true,
  },
  {
    key: 'KITCHEN',
    name: 'Cocina',
    description: 'Espacios para preparación de alimentos y descansos',
    icon: 'utensils',
    color: '#EF4444',
    sortOrder: 6,
    isDefault: true,
  },
  {
    key: 'LOUNGE',
    name: 'Sala de Descanso',
    description: 'Espacios cómodos para relajación y socialización',
    icon: 'sofa',
    color: '#6366F1',
    sortOrder: 7,
    isDefault: true,
  },
] as const

export type DefaultSpaceType = typeof DEFAULT_SPACE_TYPES[number]
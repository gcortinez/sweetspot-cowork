import { z } from 'zod'

// CUID validation regex - matches the pattern used by Prisma cuid()
const CUID_REGEX = /^c[0-9a-z]{24}$/

// Helper function to validate CUID
const cuidValidation = z.string().regex(CUID_REGEX, 'ID inválido')

// Document types enum
export const DOCUMENT_TYPES = {
  general: 'General',
  contract: 'Contrato',
  proposal: 'Propuesta',
  requirement: 'Requisitos',
  technical: 'Documentación Técnica',
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPES

// Schema for document upload
export const uploadDocumentSchema = z.object({
  opportunityId: cuidValidation,
  documentType: z.enum(['general', 'contract', 'proposal', 'requirement', 'technical'] as const)
    .default('general'),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  tags: z.array(z.string()).default([]).optional(),
})

// Schema for document filters
export const documentFilterSchema = z.object({
  opportunityId: cuidValidation,
  documentType: z.enum(['general', 'contract', 'proposal', 'requirement', 'technical'] as const).optional(),
  isActive: z.boolean().default(true).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

// Schema for document deletion
export const deleteDocumentSchema = z.object({
  documentId: z.string().min(1, 'ID de documento requerido'),
})

// File validation constants
export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ],
  allowedExtensions: [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
    '.jpg', '.jpeg', '.png', '.gif', 
    '.txt', '.zip'
  ],
}

// Helper to validate file
export const validateFile = (file: File) => {
  if (!file || file.size === 0) {
    return { success: false, error: 'No se seleccionó archivo' }
  }

  if (file.size > FILE_CONFIG.maxSize) {
    return { 
      success: false, 
      error: `Archivo muy grande. Máximo ${FILE_CONFIG.maxSize / (1024 * 1024)}MB` 
    }
  }

  if (!FILE_CONFIG.allowedTypes.includes(file.type)) {
    return { 
      success: false, 
      error: 'Tipo de archivo no permitido' 
    }
  }

  return { success: true }
}

// Types
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>
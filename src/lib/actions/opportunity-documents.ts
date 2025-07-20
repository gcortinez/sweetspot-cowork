'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { 
  uploadDocumentSchema, 
  documentFilterSchema, 
  deleteDocumentSchema,
  validateFile,
  type UploadDocumentInput,
  type DocumentFilterInput,
  type DeleteDocumentInput
} from '@/lib/validations/documents'
import { 
  storageClient, 
  STORAGE_CONFIG, 
  getFilePath, 
  generateUniqueFileName, 
  getPublicUrl 
} from '@/lib/storage'

// Helper function to get user with tenant info
async function getUserWithTenant() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('No autorizado')
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { 
      id: true, 
      tenantId: true, 
      role: true,
      firstName: true,
      lastName: true,
      email: true
    }
  })

  if (!dbUser || !dbUser.tenantId) {
    throw new Error('Usuario no encontrado o sin tenant asignado')
  }

  return dbUser
}

// Upload document action
export async function uploadOpportunityDocument(
  opportunityId: string,
  formData: FormData
) {
  try {
    const user = await getUserWithTenant()
    const file = formData.get('file') as File
    
    if (!file) {
      return { success: false, error: 'No se proporcionó archivo' }
    }

    // Validate file
    const fileValidation = validateFile(file)
    if (!fileValidation.success) {
      return fileValidation
    }

    // Parse form data
    const input: UploadDocumentInput = {
      opportunityId,
      documentType: (formData.get('documentType') as any) || 'general',
      description: formData.get('description') as string || undefined,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
    }

    // Validate input
    const validatedInput = uploadDocumentSchema.parse(input)

    // Verify opportunity exists and belongs to tenant
    const opportunity = await db.opportunity.findFirst({
      where: { 
        id: validatedInput.opportunityId, 
        tenantId: user.tenantId 
      }
    })

    if (!opportunity) {
      return { success: false, error: 'Oportunidad no encontrada' }
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.name)
    const filePath = getFilePath(user.tenantId, opportunityId, fileName)

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await storageClient.storage
      .from(STORAGE_CONFIG.opportunities.bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: 'Error al subir el archivo' }
    }

    // Get public URL
    const fileUrl = getPublicUrl(STORAGE_CONFIG.opportunities.bucket, filePath)

    // Save metadata to database
    const document = await db.opportunityDocument.create({
      data: {
        opportunityId: validatedInput.opportunityId,
        tenantId: user.tenantId,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl,
        documentType: validatedInput.documentType,
        description: validatedInput.description,
        tags: validatedInput.tags || [],
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    revalidatePath(`/opportunities/${opportunityId}`)
    
    return { 
      success: true, 
      data: document,
      message: 'Documento subido exitosamente'
    }
  } catch (error) {
    console.error('Error uploading document:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Error al subir el documento' }
  }
}

// List documents action
export async function listOpportunityDocuments(input: DocumentFilterInput) {
  try {
    const user = await getUserWithTenant()
    const validatedInput = documentFilterSchema.parse(input)

    // Build where clause
    const where: any = {
      opportunityId: validatedInput.opportunityId,
      tenantId: user.tenantId,
    }

    if (validatedInput.isActive !== undefined) {
      where.isActive = validatedInput.isActive
    }

    if (validatedInput.documentType) {
      where.documentType = validatedInput.documentType
    }

    // Calculate pagination
    const skip = (validatedInput.page - 1) * validatedInput.limit

    // Get documents and count
    const [documents, total] = await Promise.all([
      db.opportunityDocument.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: validatedInput.limit,
      }),
      db.opportunityDocument.count({ where })
    ])

    return { 
      success: true, 
      data: documents,
      pagination: {
        page: validatedInput.page,
        limit: validatedInput.limit,
        total,
        totalPages: Math.ceil(total / validatedInput.limit),
      }
    }
  } catch (error) {
    console.error('Error listing documents:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Error al listar documentos' }
  }
}

// Delete document action
export async function deleteOpportunityDocument(input: DeleteDocumentInput) {
  try {
    const user = await getUserWithTenant()
    const validatedInput = deleteDocumentSchema.parse(input)

    // Find document
    const document = await db.opportunityDocument.findFirst({
      where: { 
        id: validatedInput.documentId, 
        tenantId: user.tenantId 
      }
    })

    if (!document) {
      return { success: false, error: 'Documento no encontrado' }
    }

    // Delete from storage
    const filePath = getFilePath(user.tenantId, document.opportunityId, document.fileName)
    const { error: deleteError } = await storageClient.storage
      .from(STORAGE_CONFIG.opportunities.bucket)
      .remove([filePath])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    await db.opportunityDocument.delete({
      where: { id: validatedInput.documentId }
    })

    revalidatePath(`/opportunities/${document.opportunityId}`)
    
    return { 
      success: true,
      message: 'Documento eliminado exitosamente'
    }
  } catch (error) {
    console.error('Error deleting document:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Error al eliminar el documento' }
  }
}

// Download document action (generates signed URL)
export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const user = await getUserWithTenant()

    // Find document
    const document = await db.opportunityDocument.findFirst({
      where: { 
        id: documentId, 
        tenantId: user.tenantId,
        isActive: true
      }
    })

    if (!document) {
      return { success: false, error: 'Documento no encontrado' }
    }

    // Generate signed URL for download (valid for 5 minutes)
    const filePath = getFilePath(user.tenantId, document.opportunityId, document.fileName)
    const { data, error } = await storageClient.storage
      .from(STORAGE_CONFIG.opportunities.bucket)
      .createSignedUrl(filePath, 300) // 5 minutes

    if (error || !data) {
      console.error('Error generating signed URL:', error)
      return { success: false, error: 'Error al generar enlace de descarga' }
    }

    return { 
      success: true, 
      data: {
        url: data.signedUrl,
        fileName: document.originalName,
        expiresIn: 300 // seconds
      }
    }
  } catch (error) {
    console.error('Error getting download URL:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Error al obtener enlace de descarga' }
  }
}
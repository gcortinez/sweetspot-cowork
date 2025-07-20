import { put, del, head } from '@vercel/blob'

// Storage configuration
export const STORAGE_CONFIG = {
  opportunities: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
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
    ]
  }
} as const

// Helper to get file path for Vercel Blob
export const getFilePath = (tenantId: string, opportunityId: string, fileName: string) => {
  return `opportunities/${tenantId}/${opportunityId}/${fileName}`
}

// Helper to generate unique filename
export const generateUniqueFileName = (originalName: string) => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const extension = originalName.split('.').pop() || 'file'
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  
  return `${timestamp}-${randomString}-${cleanName}.${extension}`
}

// Upload file to Vercel Blob
export async function uploadToBlob(
  filePath: string, 
  file: Buffer | File, 
  contentType: string
) {
  'use server'
  try {
    const blob = await put(filePath, file, {
      access: 'public',
      contentType,
    })
    
    return { success: true, url: blob.url }
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    return { success: false, error: 'Error al subir archivo' }
  }
}

// Delete file from Vercel Blob
export async function deleteFromBlob(url: string) {
  'use server'
  try {
    await del(url)
    return { success: true }
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error)
    return { success: false, error: 'Error al eliminar archivo' }
  }
}

// Check if file exists in Vercel Blob
export async function checkFileExists(url: string) {
  'use server'
  try {
    const result = await head(url)
    return !!result // File exists if head() returns without error
  } catch (error) {
    console.error('Error checking file existence:', error)
    return false
  }
}

// Generate download URL (Vercel Blob URLs are already public)
export async function getDownloadUrl(url: string) {
  'use server'
  // For Vercel Blob, URLs are already public and don't need signing
  // But we can add some validation
  try {
    const exists = await checkFileExists(url)
    if (exists) {
      return { success: true, url }
    } else {
      return { success: false, error: 'Archivo no encontrado' }
    }
  } catch (error) {
    return { success: false, error: 'Error al obtener enlace de descarga' }
  }
}

// No bucket creation needed for Vercel Blob - it's automatic
export async function ensureBucketExists() {
  'use server'
  // Vercel Blob doesn't require bucket creation
  console.log('✅ Vercel Blob Storage is ready (no setup required)')
  return true
}
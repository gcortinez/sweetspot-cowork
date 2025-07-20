'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role key for server-side operations
export const storageClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Storage configuration
export const STORAGE_CONFIG = {
  opportunities: {
    bucket: 'opportunities',
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

// Helper to get file path
export const getFilePath = (tenantId: string, opportunityId: string, fileName: string) => {
  return `${tenantId}/${opportunityId}/${fileName}`
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

// Helper to get public URL
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = storageClient.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Create bucket if it doesn't exist (run this once during setup)
export const ensureBucketExists = async () => {
  const { data: buckets } = await storageClient.storage.listBuckets()
  
  const opportunitiesBucket = buckets?.find(b => b.name === STORAGE_CONFIG.opportunities.bucket)
  
  if (!opportunitiesBucket) {
    const { error } = await storageClient.storage.createBucket(STORAGE_CONFIG.opportunities.bucket, {
      public: false, // Private bucket
      fileSizeLimit: STORAGE_CONFIG.opportunities.maxFileSize,
      allowedMimeTypes: STORAGE_CONFIG.opportunities.allowedMimeTypes,
    })
    
    if (error) {
      console.error('Error creating opportunities bucket:', error)
      return false
    }
    
    // Set bucket policies for authenticated users
    const { error: policyError } = await storageClient.storage
      .from(STORAGE_CONFIG.opportunities.bucket)
      .createSignedUploadUrl('')
      
    console.log('Opportunities bucket created successfully')
    return true
  }
  
  return true
}
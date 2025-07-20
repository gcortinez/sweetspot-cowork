/**
 * Script to verify Vercel Blob Storage configuration
 * Run this to verify that Vercel Blob Storage is properly configured
 */

import { ensureBucketExists } from '../src/lib/storage'

async function setupStorage() {
  console.log('🚀 Verifying Vercel Blob Storage configuration...')
  
  try {
    // Check environment variables
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is not set')
      console.log('Please add BLOB_READ_WRITE_TOKEN to your .env.local file')
      process.exit(1)
    }
    
    const result = await ensureBucketExists()
    
    if (result) {
      console.log('✅ Vercel Blob Storage is properly configured!')
      console.log('📁 Documents will be stored with path structure: opportunities/{tenantId}/{opportunityId}/{fileName}')
    } else {
      console.log('⚠️  Storage verification skipped')
    }
  } catch (error) {
    console.error('❌ Error verifying storage:', error)
    process.exit(1)
  }
}

// Run the setup
setupStorage().then(() => {
  console.log('🎉 Storage verification process finished')
  console.log('ℹ️  You can now upload documents to opportunities!')
  process.exit(0)
})
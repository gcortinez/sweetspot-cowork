import { chromium, FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')

  try {
    // Clean up test data
    await cleanupTestData()

    // Clean up authentication state
    await cleanupAuthState()

    // Clean up test files
    await cleanupTestFiles()

    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid failing the test run
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000')

    // Call cleanup API endpoints
    await page.evaluate(async () => {
      try {
        // Clean up test tenant and associated data
        await fetch('/api/setup/cleanup-test-data', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.warn('Failed to cleanup test data via API:', error)
      }
    })

    console.log('✅ Test data cleanup completed')
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error)
  } finally {
    await browser.close()
  }
}

async function cleanupAuthState() {
  console.log('🔐 Cleaning up authentication state...')

  try {
    const authStatePath = path.join(__dirname, 'auth-state.json')
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath)
      console.log('✅ Authentication state cleaned up')
    }
  } catch (error) {
    console.warn('⚠️ Authentication state cleanup failed:', error)
  }
}

async function cleanupTestFiles() {
  console.log('📁 Cleaning up test files...')

  try {
    const testResultsDir = path.join(__dirname, '..', 'test-results')
    const screenshotsDir = path.join(__dirname, '..', 'test-results', 'screenshots')
    const videosDir = path.join(__dirname, '..', 'test-results', 'videos')

    // Keep test results but clean up old files
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    const now = Date.now()

    const cleanupDirectory = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return

      const files = fs.readdirSync(dirPath)
      files.forEach(file => {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)
        
        if (now - stats.mtime.getTime() > maxAge) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true })
          } else {
            fs.unlinkSync(filePath)
          }
        }
      })
    }

    cleanupDirectory(screenshotsDir)
    cleanupDirectory(videosDir)

    console.log('✅ Test files cleanup completed')
  } catch (error) {
    console.warn('⚠️ Test files cleanup failed:', error)
  }
}

export default globalTeardown
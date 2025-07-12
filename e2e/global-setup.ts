import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Setup test environment
    console.log('📋 Setting up test environment...')

    // Navigate to the application
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000')

    // Wait for the application to load
    await page.waitForSelector('body', { timeout: 30000 })

    // Create test tenant and user if needed
    await setupTestData(page)

    // Store authentication state
    await setupAuthentication(page)

    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any) {
  console.log('🗄️ Setting up test data...')

  try {
    // Create test API endpoint calls to setup data
    const response = await page.evaluate(async () => {
      // Setup test tenant
      const tenantResponse = await fetch('/api/setup/test-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'E2E Test Tenant',
          domain: 'e2e-test.localhost',
          plan: 'PROFESSIONAL',
        }),
      })

      if (!tenantResponse.ok) {
        throw new Error(`Failed to create test tenant: ${tenantResponse.statusText}`)
      }

      const tenant = await tenantResponse.json()

      // Setup test user
      const userResponse = await fetch('/api/setup/test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'e2e-test@example.com',
          name: 'E2E Test User',
          role: 'ADMIN',
          tenantId: tenant.id,
        }),
      })

      if (!userResponse.ok) {
        throw new Error(`Failed to create test user: ${userResponse.statusText}`)
      }

      const user = await userResponse.json()

      return { tenant, user }
    })

    console.log('✅ Test data setup completed')
    return response
  } catch (error) {
    console.warn('⚠️ Test data setup failed, continuing with existing data:', error)
  }
}

async function setupAuthentication(page: any) {
  console.log('🔐 Setting up authentication...')

  try {
    // Navigate to login page
    await page.goto('/auth/login')

    // Fill in test credentials
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com')
    await page.fill('[data-testid="password-input"]', 'test-password-123')

    // Submit login form
    await page.click('[data-testid="login-button"]')

    // Wait for successful login
    await page.waitForURL('/', { timeout: 15000 })

    // Save authentication state
    await page.context().storageState({ path: 'e2e/auth-state.json' })

    console.log('✅ Authentication setup completed')
  } catch (error) {
    console.warn('⚠️ Authentication setup failed, tests may need manual login:', error)
  }
}

export default globalSetup
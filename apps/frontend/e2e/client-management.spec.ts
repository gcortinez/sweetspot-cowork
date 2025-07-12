import { test, expect } from '@playwright/test'

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    // Use stored authentication state
    await page.goto('/')
    
    // Navigate to clients page
    await page.click('[data-testid="nav-clients"]')
    await page.waitForURL('/clients')
  })

  test('should display clients list', async ({ page }) => {
    // Check if clients table is visible
    await expect(page.locator('[data-testid="clients-table"]')).toBeVisible()

    // Check for table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Email")')).toBeVisible()
    await expect(page.locator('th:has-text("Type")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()
  })

  test('should create a new individual client', async ({ page }) => {
    // Click create client button
    await page.click('[data-testid="create-client-button"]')

    // Wait for modal to appear
    await expect(page.locator('[data-testid="client-modal"]')).toBeVisible()

    // Fill in client details
    await page.fill('[data-testid="client-name"]', 'John Doe')
    await page.fill('[data-testid="client-email"]', 'john.doe@example.com')
    await page.fill('[data-testid="client-phone"]', '+1234567890')
    await page.selectOption('[data-testid="client-type"]', 'INDIVIDUAL')

    // Fill in address
    await page.fill('[data-testid="client-street"]', '123 Main St')
    await page.fill('[data-testid="client-city"]', 'Test City')
    await page.fill('[data-testid="client-state"]', 'TS')
    await page.fill('[data-testid="client-zipcode"]', '12345')
    await page.selectOption('[data-testid="client-country"]', 'US')

    // Submit form
    await page.click('[data-testid="save-client-button"]')

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Client created successfully')

    // Verify client appears in table
    await expect(page.locator('[data-testid="clients-table"]')).toContainText('John Doe')
    await expect(page.locator('[data-testid="clients-table"]')).toContainText('john.doe@example.com')
  })

  test('should create a new company client', async ({ page }) => {
    // Click create client button
    await page.click('[data-testid="create-client-button"]')

    // Wait for modal to appear
    await expect(page.locator('[data-testid="client-modal"]')).toBeVisible()

    // Fill in basic details
    await page.fill('[data-testid="client-name"]', 'Acme Corporation')
    await page.fill('[data-testid="client-email"]', 'contact@acme.com')
    await page.fill('[data-testid="client-phone"]', '+1987654321')
    await page.selectOption('[data-testid="client-type"]', 'COMPANY')

    // Company-specific fields should appear
    await expect(page.locator('[data-testid="company-details"]')).toBeVisible()

    // Fill in company details
    await page.fill('[data-testid="company-industry"]', 'Technology')
    await page.fill('[data-testid="company-employees"]', '100')
    await page.fill('[data-testid="company-website"]', 'https://acme.com')
    await page.fill('[data-testid="company-revenue"]', '5000000')

    // Submit form
    await page.click('[data-testid="save-client-button"]')

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Verify client appears in table
    await expect(page.locator('[data-testid="clients-table"]')).toContainText('Acme Corporation')
    await expect(page.locator('[data-testid="clients-table"]')).toContainText('COMPANY')
  })

  test('should search for clients', async ({ page }) => {
    // Type in search box
    await page.fill('[data-testid="client-search"]', 'John')

    // Wait for search results
    await page.waitForTimeout(500) // Debounce delay

    // Check that search results are filtered
    const rows = page.locator('[data-testid="client-row"]')
    const count = await rows.count()

    if (count > 0) {
      // If there are results, they should contain the search term
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i)
        await expect(row).toContainText('John', { ignoreCase: true })
      }
    }
  })

  test('should filter clients by type', async ({ page }) => {
    // Select company filter
    await page.selectOption('[data-testid="client-type-filter"]', 'COMPANY')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Check that all visible clients are companies
    const typeColumns = page.locator('[data-testid="client-type-cell"]')
    const count = await typeColumns.count()

    for (let i = 0; i < count; i++) {
      await expect(typeColumns.nth(i)).toContainText('COMPANY')
    }
  })

  test('should filter clients by status', async ({ page }) => {
    // Select active filter
    await page.selectOption('[data-testid="client-status-filter"]', 'ACTIVE')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Check that all visible clients are active
    const statusColumns = page.locator('[data-testid="client-status-cell"]')
    const count = await statusColumns.count()

    for (let i = 0; i < count; i++) {
      await expect(statusColumns.nth(i)).toContainText('ACTIVE')
    }
  })

  test('should edit a client', async ({ page }) => {
    // Click edit button on first client
    await page.click('[data-testid="client-row"]:first-child [data-testid="edit-client-button"]')

    // Wait for edit modal
    await expect(page.locator('[data-testid="client-modal"]')).toBeVisible()

    // Update client name
    await page.fill('[data-testid="client-name"]', 'John Smith Updated')

    // Save changes
    await page.click('[data-testid="save-client-button"]')

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Verify updated name appears in table
    await expect(page.locator('[data-testid="clients-table"]')).toContainText('John Smith Updated')
  })

  test('should view client details', async ({ page }) => {
    // Click view button on first client
    await page.click('[data-testid="client-row"]:first-child [data-testid="view-client-button"]')

    // Should navigate to client details page
    await page.waitForURL(/\/clients\/[^/]+$/)

    // Check that client details are displayed
    await expect(page.locator('[data-testid="client-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="client-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="client-email"]')).toBeVisible()

    // Check tabs are present
    await expect(page.locator('[data-testid="client-tab-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="client-tab-bookings"]')).toBeVisible()
    await expect(page.locator('[data-testid="client-tab-invoices"]')).toBeVisible()
    await expect(page.locator('[data-testid="client-tab-memberships"]')).toBeVisible()
  })

  test('should delete a client', async ({ page }) => {
    // Click delete button on first client
    await page.click('[data-testid="client-row"]:first-child [data-testid="delete-client-button"]')

    // Wait for confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]')

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Client deleted successfully')
  })

  test('should handle validation errors', async ({ page }) => {
    // Click create client button
    await page.click('[data-testid="create-client-button"]')

    // Try to submit without required fields
    await page.click('[data-testid="save-client-button"]')

    // Check for validation errors
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="client-name-error"]')).toContainText('Name is required')
    await expect(page.locator('[data-testid="client-email-error"]')).toContainText('Email is required')
  })

  test('should handle duplicate email error', async ({ page }) => {
    // Try to create client with existing email
    await page.click('[data-testid="create-client-button"]')

    await page.fill('[data-testid="client-name"]', 'Duplicate Client')
    await page.fill('[data-testid="client-email"]', 'existing@example.com') // Assuming this exists
    await page.selectOption('[data-testid="client-type"]', 'INDIVIDUAL')

    await page.click('[data-testid="save-client-button"]')

    // Check for duplicate email error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Client with this email already exists')
  })

  test('should paginate through clients', async ({ page }) => {
    // Check if pagination is present
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      // Get initial client count
      const initialRows = await page.locator('[data-testid="client-row"]').count()

      // Click next page
      await page.click('[data-testid="pagination-next"]')

      // Wait for page to load
      await page.waitForTimeout(500)

      // Verify different clients are shown
      const newRows = await page.locator('[data-testid="client-row"]').count()
      
      // Could be same count but different clients
      expect(newRows).toBeGreaterThan(0)

      // Go back to first page
      await page.click('[data-testid="pagination-prev"]')
    }
  })

  test('should sort clients by different columns', async ({ page }) => {
    // Click on name column to sort
    await page.click('[data-testid="sort-name"]')

    // Wait for sort to apply
    await page.waitForTimeout(500)

    // Verify sort indicator is shown
    await expect(page.locator('[data-testid="sort-name"] [data-testid="sort-indicator"]')).toBeVisible()

    // Click again to reverse sort
    await page.click('[data-testid="sort-name"]')

    await page.waitForTimeout(500)

    // Sort by email
    await page.click('[data-testid="sort-email"]')

    await page.waitForTimeout(500)

    await expect(page.locator('[data-testid="sort-email"] [data-testid="sort-indicator"]')).toBeVisible()
  })

  test('should export clients list', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-clients-button"]')

    // Wait for download
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toMatch(/clients.*\.(csv|xlsx)$/)
  })
})
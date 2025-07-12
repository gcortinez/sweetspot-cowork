import { z } from 'zod'

/**
 * Test utilities for SweetSpot Cowork application
 */

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  tenantId: 'tenant-123',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockTenant = (overrides = {}) => ({
  id: 'tenant-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Tenant',
  domain: 'test.example.com',
  plan: 'PROFESSIONAL',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockClient = (overrides = {}) => ({
  id: 'client-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  tenantId: 'tenant-123',
  type: 'INDIVIDUAL',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockBooking = (overrides = {}) => ({
  id: 'booking-' + Math.random().toString(36).substr(2, 9),
  clientId: 'client-123',
  spaceId: 'space-123',
  tenantId: 'tenant-123',
  startTime: new Date(),
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
  status: 'CONFIRMED',
  totalAmount: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockInvoice = (overrides = {}) => ({
  id: 'invoice-' + Math.random().toString(36).substr(2, 9),
  number: 'INV-001',
  clientId: 'client-123',
  tenantId: 'tenant-123',
  status: 'PENDING',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
  subtotal: 100,
  taxAmount: 10,
  totalAmount: 110,
  items: JSON.stringify([{
    description: 'Test Service',
    quantity: 1,
    unitPrice: 100,
    total: 100,
  }]),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockMembership = (overrides = {}) => ({
  id: 'membership-' + Math.random().toString(36).substr(2, 9),
  clientId: 'client-123',
  planId: 'plan-123',
  tenantId: 'tenant-123',
  status: 'ACTIVE',
  startDate: new Date(),
  finalPrice: 299,
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  usageThisMonth: JSON.stringify({}),
  activeAddOns: JSON.stringify([]),
  accessOverrides: JSON.stringify({}),
  notificationPreferences: JSON.stringify({}),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockApiKey = (overrides = {}) => ({
  id: 'api-key-' + Math.random().toString(36).substr(2, 9),
  name: 'Test API Key',
  key: 'hashed-key-value',
  prefix: 'sk_',
  tenantId: 'tenant-123',
  scopes: JSON.stringify(['read', 'write']),
  permissions: JSON.stringify({ read: true, write: true, delete: false, admin: false }),
  rateLimit: JSON.stringify({ requestsPerMinute: 100, requestsPerHour: 1000, requestsPerDay: 10000 }),
  allowedIPs: JSON.stringify([]),
  allowedDomains: JSON.stringify([]),
  isActive: true,
  environment: 'DEVELOPMENT',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockWebhook = (overrides = {}) => ({
  id: 'webhook-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Webhook',
  url: 'https://api.example.com/webhook',
  tenantId: 'tenant-123',
  events: JSON.stringify(['CLIENT_CREATED', 'BOOKING_CREATED']),
  eventFilters: JSON.stringify({}),
  httpMethod: 'POST',
  headers: JSON.stringify({ 'Content-Type': 'application/json' }),
  authMethod: 'NONE',
  authConfig: JSON.stringify({}),
  timeout: 30,
  retryAttempts: 3,
  contentType: 'application/json',
  dataFormat: 'JSON',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Validation test helpers
export const expectValidationError = (schema: z.ZodSchema, data: any, expectedPath?: string) => {
  expect(() => schema.parse(data)).toThrow()
  
  try {
    schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (expectedPath) {
        expect(error.errors.some(err => err.path.join('.') === expectedPath)).toBe(true)
      }
      return error.errors
    }
  }
  
  throw new Error('Expected validation error but none was thrown')
}

export const expectValidationSuccess = (schema: z.ZodSchema, data: any) => {
  expect(() => schema.parse(data)).not.toThrow()
  return schema.parse(data)
}

// Mock response helpers
export const createMockActionResult = (success: boolean, data?: any, error?: string, fieldErrors?: any) => ({
  success,
  data,
  error,
  fieldErrors,
})

export const createSuccessResult = (data: any) => createMockActionResult(true, data)
export const createErrorResult = (error: string, fieldErrors?: any) => createMockActionResult(false, undefined, error, fieldErrors)

// Database mock helpers
export const mockPrismaMethod = (model: string, method: string, returnValue: any) => {
  const { prisma } = require('@/lib/prisma')
  const mock = prisma[model]?.[method]
  if (mock && jest.isMockFunction(mock)) {
    mock.mockResolvedValue(returnValue)
  }
  return mock
}

export const mockPrismaError = (model: string, method: string, error: Error) => {
  const { prisma } = require('@/lib/prisma')
  const mock = prisma[model]?.[method]
  if (mock && jest.isMockFunction(mock)) {
    mock.mockRejectedValue(error)
  }
  return mock
}

// Test data generators
export const generateUniqueId = () => 'test-' + Math.random().toString(36).substr(2, 9)

export const generateEmail = (prefix = 'test') => `${prefix}@example.com`

export const generatePhoneNumber = () => '+1' + Math.floor(Math.random() * 9000000000 + 1000000000).toString()

export const generatePastDate = (daysAgo = 30) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

export const generateFutureDate = (daysFromNow = 30) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const retryUntil = async (condition: () => boolean | Promise<boolean>, maxAttempts = 10, delay = 100) => {
  for (let i = 0; i < maxAttempts; i++) {
    if (await condition()) {
      return true
    }
    await waitFor(delay)
  }
  return false
}

// Error simulation helpers
export const simulateNetworkError = () => new Error('Network error')
export const simulateTimeoutError = () => new Error('Timeout error')
export const simulateValidationError = (field: string, message: string) => {
  const error = new z.ZodError([{
    code: z.ZodIssueCode.custom,
    path: [field],
    message,
  }])
  error.name = 'ZodError'
  return error
}

// Performance test helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return {
    result,
    executionTime: end - start,
  }
}

export const expectExecutionTimeUnder = async (fn: () => Promise<any>, maxTime: number) => {
  const { executionTime } = await measureExecutionTime(fn)
  expect(executionTime).toBeLessThan(maxTime)
}

// Test environment helpers
export const setupTestEnvironment = () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.mockPrismaClient()
  })
}

export const cleanupTestEnvironment = () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
}
import { GET, POST } from '@/app/api/clients/route'
import { NextRequest } from 'next/server'
import {
  createMockClient,
  mockPrismaMethod,
  mockPrismaError,
  setupTestEnvironment,
  cleanupTestEnvironment,
} from '../../utils/test-helpers'

// Setup test environment
setupTestEnvironment()
cleanupTestEnvironment()

describe('/api/clients', () => {
  describe('GET', () => {
    it('should return paginated clients list', async () => {
      const mockClients = [
        createMockClient({ name: 'Client 1' }),
        createMockClient({ name: 'Client 2' }),
      ]

      mockPrismaMethod('client', 'count', 2)
      mockPrismaMethod('client', 'findMany', mockClients)

      const request = new NextRequest('http://localhost/api/clients?page=1&limit=10')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.clients).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      })
    })

    it('should handle search queries', async () => {
      const mockClients = [createMockClient({ name: 'John Doe' })]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      const request = new NextRequest('http://localhost/api/clients?search=John')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.clients).toHaveLength(1)
      expect(data.clients[0].name).toContain('John')
    })

    it('should handle filtering by type', async () => {
      const mockClients = [createMockClient({ type: 'COMPANY' })]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      const request = new NextRequest('http://localhost/api/clients?type=COMPANY')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.clients).toHaveLength(1)
      expect(data.clients[0].type).toBe('COMPANY')
    })

    it('should handle filtering by status', async () => {
      const mockClients = [createMockClient({ status: 'ACTIVE' })]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      const request = new NextRequest('http://localhost/api/clients?status=ACTIVE')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.clients[0].status).toBe('ACTIVE')
    })

    it('should handle sorting options', async () => {
      const mockClients = [
        createMockClient({ name: 'A Client', createdAt: new Date('2024-01-01') }),
        createMockClient({ name: 'B Client', createdAt: new Date('2024-01-02') }),
      ]

      mockPrismaMethod('client', 'count', 2)
      mockPrismaMethod('client', 'findMany', mockClients)

      const request = new NextRequest('http://localhost/api/clients?sortBy=createdAt&sortOrder=desc')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.clients).toHaveLength(2)
    })

    it('should handle authentication errors', async () => {
      // Mock unauthenticated context
      const { getTenantContext } = require('@/lib/auth')
      getTenantContext.mockResolvedValue({ tenantId: null, user: null })

      const request = new NextRequest('http://localhost/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should handle database errors', async () => {
      mockPrismaError('client', 'count', new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle invalid query parameters', async () => {
      const request = new NextRequest('http://localhost/api/clients?page=invalid')
      const response = await GET(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('POST', () => {
    it('should create a new client', async () => {
      const mockClient = createMockClient({
        name: 'New Client',
        email: 'new@example.com',
      })

      mockPrismaMethod('client', 'findFirst', null) // No existing client
      mockPrismaMethod('client', 'create', mockClient)

      const clientData = {
        name: 'New Client',
        email: 'new@example.com',
        type: 'INDIVIDUAL',
        phone: '+1234567890',
      }

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.name).toBe('New Client')
      expect(data.email).toBe('new@example.com')
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '', // Required field missing
        email: 'invalid-email', // Invalid email format
        type: 'INVALID_TYPE', // Invalid enum value
      }

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should handle duplicate email errors', async () => {
      const existingClient = createMockClient({ email: 'existing@example.com' })
      mockPrismaMethod('client', 'findFirst', existingClient)

      const clientData = {
        name: 'New Client',
        email: 'existing@example.com',
        type: 'INDIVIDUAL',
      }

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Client with this email already exists')
    })

    it('should handle authentication errors', async () => {
      // Mock unauthenticated context
      const { getTenantContext } = require('@/lib/auth')
      getTenantContext.mockResolvedValue({ tenantId: null, user: null })

      const clientData = {
        name: 'New Client',
        email: 'new@example.com',
        type: 'INDIVIDUAL',
      }

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should handle database errors', async () => {
      mockPrismaMethod('client', 'findFirst', null)
      mockPrismaError('client', 'create', new Error('Database connection failed'))

      const clientData = {
        name: 'New Client',
        email: 'new@example.com',
        type: 'INDIVIDUAL',
      }

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should create client with complete data', async () => {
      const mockClient = createMockClient({
        name: 'Complete Client',
        email: 'complete@example.com',
        type: 'COMPANY',
      })

      mockPrismaMethod('client', 'findFirst', null)
      mockPrismaMethod('client', 'create', mockClient)

      const completeClientData = {
        name: 'Complete Client',
        email: 'complete@example.com',
        phone: '+1234567890',
        type: 'COMPANY',
        address: {
          street: '123 Business Ave',
          city: 'Business City',
          state: 'BC',
          zipCode: '12345',
          country: 'US',
        },
        companyDetails: {
          industry: 'Technology',
          employeeCount: 100,
          website: 'https://example.com',
          annualRevenue: 5000000,
        },
        preferences: {
          communications: {
            email: true,
            sms: false,
            push: true,
          },
          language: 'en',
          timezone: 'America/New_York',
        },
        tags: ['Enterprise', 'Technology'],
        metadata: {
          source: 'website',
          salesRep: 'John Smith',
        },
      }

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(completeClientData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.name).toBe('Complete Client')
      expect(data.type).toBe('COMPANY')
      expect(data.companyDetails).toBeDefined()
      expect(data.address).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockPrismaError('client', 'findMany', new Error('Connection timeout'))

      const request = new NextRequest('http://localhost/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle rate limiting scenarios', async () => {
      // This would typically be handled by middleware
      // but we can test the API response
      const request = new NextRequest('http://localhost/api/clients')
      
      // Simulate many rapid requests
      const promises = Array.from({ length: 10 }, () => GET(request))
      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect([200, 429, 500]).toContain(response.status)
      })
    })
  })
})
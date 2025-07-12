import { 
  createClientAction, 
  listClientsAction, 
  updateClientAction, 
  deleteClientAction 
} from '@/lib/actions/client'
import { 
  createMockClient, 
  createMockTenant, 
  createMockUser,
  mockPrismaMethod,
  mockPrismaError,
  expectValidationError,
  setupTestEnvironment,
  cleanupTestEnvironment,
  createSuccessResult,
  createErrorResult,
} from '../../utils/test-helpers'

// Setup test environment
setupTestEnvironment()
cleanupTestEnvironment()

describe('Client Actions', () => {
  describe('createClientAction', () => {
    it('should create a client successfully', async () => {
      const mockClient = createMockClient()
      const mockTenant = createMockTenant()
      const mockUser = createMockUser()

      // Mock Prisma responses
      mockPrismaMethod('client', 'create', {
        ...mockClient,
        tenant: mockTenant,
        createdByUser: mockUser,
      })

      const clientData = {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '+1234567890',
        type: 'INDIVIDUAL' as const,
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
      }

      const result = await createClientAction(clientData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.name).toBe(clientData.name)
      expect(result.data.email).toBe(clientData.email)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '', // Required field
        email: 'invalid-email', // Invalid email format
        type: 'INVALID_TYPE' as any,
      }

      const result = await createClientAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors).toBeDefined()
    })

    it('should handle database errors', async () => {
      mockPrismaError('client', 'create', new Error('Database connection failed'))

      const clientData = {
        name: 'Test Client',
        email: 'client@example.com',
        type: 'INDIVIDUAL' as const,
      }

      const result = await createClientAction(clientData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create client')
    })

    it('should prevent duplicate email addresses', async () => {
      // Mock existing client with same email
      mockPrismaMethod('client', 'findFirst', createMockClient({ email: 'client@example.com' }))

      const clientData = {
        name: 'Test Client',
        email: 'client@example.com',
        type: 'INDIVIDUAL' as const,
      }

      const result = await createClientAction(clientData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client with this email already exists')
    })

    it('should require authentication', async () => {
      // Mock unauthenticated context
      const { getTenantContext } = require('@/lib/auth')
      getTenantContext.mockResolvedValue({ tenantId: null, user: null })

      const clientData = {
        name: 'Test Client',
        email: 'client@example.com',
        type: 'INDIVIDUAL' as const,
      }

      const result = await createClientAction(clientData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
  })

  describe('listClientsAction', () => {
    it('should list clients with pagination', async () => {
      const mockClients = [
        createMockClient({ name: 'Client 1' }),
        createMockClient({ name: 'Client 2' }),
      ]

      mockPrismaMethod('client', 'count', 2)
      mockPrismaMethod('client', 'findMany', mockClients)

      const result = await listClientsAction({
        page: 1,
        limit: 10,
      })

      expect(result.success).toBe(true)
      expect(result.data.clients).toHaveLength(2)
      expect(result.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      })
    })

    it('should filter clients by search term', async () => {
      const mockClients = [createMockClient({ name: 'John Doe' })]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      const result = await listClientsAction({
        search: 'John',
      })

      expect(result.success).toBe(true)
      expect(result.data.clients).toHaveLength(1)
      expect(result.data.clients[0].name).toContain('John')
    })

    it('should filter clients by type', async () => {
      const mockClients = [createMockClient({ type: 'COMPANY' })]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      const result = await listClientsAction({
        type: 'COMPANY',
      })

      expect(result.success).toBe(true)
      expect(result.data.clients).toHaveLength(1)
      expect(result.data.clients[0].type).toBe('COMPANY')
    })

    it('should filter clients by status', async () => {
      const mockClients = [createMockClient({ status: 'ACTIVE' })]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      const result = await listClientsAction({
        status: 'ACTIVE',
      })

      expect(result.success).toBe(true)
      expect(result.data.clients).toHaveLength(1)
      expect(result.data.clients[0].status).toBe('ACTIVE')
    })
  })

  describe('updateClientAction', () => {
    it('should update a client successfully', async () => {
      const mockClient = createMockClient()
      const updatedClient = { ...mockClient, name: 'Updated Client' }

      mockPrismaMethod('client', 'findFirst', mockClient)
      mockPrismaMethod('client', 'update', updatedClient)

      const updateData = {
        id: mockClient.id,
        name: 'Updated Client',
      }

      const result = await updateClientAction(updateData)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Client')
    })

    it('should handle client not found', async () => {
      mockPrismaMethod('client', 'findFirst', null)

      const updateData = {
        id: 'non-existent-id',
        name: 'Updated Client',
      }

      const result = await updateClientAction(updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client not found')
    })

    it('should prevent email conflicts on update', async () => {
      const mockClient = createMockClient()
      const existingClient = createMockClient({ 
        id: 'different-id', 
        email: 'existing@example.com' 
      })

      mockPrismaMethod('client', 'findFirst', mockClient)
      // Mock existing client with same email but different ID
      mockPrismaMethod('client', 'findFirst', existingClient)

      const updateData = {
        id: mockClient.id,
        email: 'existing@example.com',
      }

      const result = await updateClientAction(updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client with this email already exists')
    })
  })

  describe('deleteClientAction', () => {
    it('should delete a client successfully (soft delete)', async () => {
      const mockClient = createMockClient()
      const deletedClient = { ...mockClient, deletedAt: new Date() }

      mockPrismaMethod('client', 'findFirst', mockClient)
      mockPrismaMethod('client', 'update', deletedClient)

      const result = await deleteClientAction({ id: mockClient.id })

      expect(result.success).toBe(true)
      expect(result.data.message).toBe('Client deleted successfully')
    })

    it('should handle client not found', async () => {
      mockPrismaMethod('client', 'findFirst', null)

      const result = await deleteClientAction({ id: 'non-existent-id' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client not found')
    })

    it('should prevent deletion of clients with active bookings', async () => {
      const mockClient = createMockClient()

      mockPrismaMethod('client', 'findFirst', mockClient)
      mockPrismaMethod('booking', 'count', 3) // Has active bookings

      const result = await deleteClientAction({ id: mockClient.id })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete client with active bookings')
    })

    it('should prevent deletion of clients with active memberships', async () => {
      const mockClient = createMockClient()

      mockPrismaMethod('client', 'findFirst', mockClient)
      mockPrismaMethod('booking', 'count', 0) // No active bookings
      mockPrismaMethod('membership', 'count', 1) // Has active membership

      const result = await deleteClientAction({ id: mockClient.id })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete client with active memberships')
    })

    it('should prevent deletion of clients with unpaid invoices', async () => {
      const mockClient = createMockClient()

      mockPrismaMethod('client', 'findFirst', mockClient)
      mockPrismaMethod('booking', 'count', 0)
      mockPrismaMethod('membership', 'count', 0)
      mockPrismaMethod('invoice', 'count', 2) // Has unpaid invoices

      const result = await deleteClientAction({ id: mockClient.id })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete client with unpaid invoices')
    })
  })

  describe('Error Handling', () => {
    it('should handle Zod validation errors correctly', async () => {
      const invalidData = {
        name: '', // Required
        email: 'not-an-email',
        phone: '123', // Too short
      }

      const result = await createClientAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors.name).toBeDefined()
      expect(result.fieldErrors.email).toBeDefined()
    })

    it('should handle unexpected database errors', async () => {
      mockPrismaError('client', 'create', new Error('Unexpected database error'))

      const validData = {
        name: 'Test Client',
        email: 'test@example.com',
        type: 'INDIVIDUAL' as const,
      }

      const result = await createClientAction(validData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create client')
    })
  })

  describe('Business Logic', () => {
    it('should automatically format phone numbers', async () => {
      const mockClient = createMockClient({ phone: '+1-234-567-8900' })
      
      mockPrismaMethod('client', 'create', mockClient)

      const clientData = {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '(234) 567-8900', // Unformatted phone
        type: 'INDIVIDUAL' as const,
      }

      const result = await createClientAction(clientData)

      expect(result.success).toBe(true)
      // Phone should be formatted consistently
      expect(result.data.phone).toMatch(/^\+1-\d{3}-\d{3}-\d{4}$/)
    })

    it('should handle company-specific fields', async () => {
      const mockClient = createMockClient({
        type: 'COMPANY',
        companyDetails: JSON.stringify({
          industry: 'Technology',
          employeeCount: 50,
          annualRevenue: 1000000,
        }),
      })

      mockPrismaMethod('client', 'create', mockClient)

      const clientData = {
        name: 'Test Company',
        email: 'contact@testcompany.com',
        type: 'COMPANY' as const,
        companyDetails: {
          industry: 'Technology',
          employeeCount: 50,
          annualRevenue: 1000000,
        },
      }

      const result = await createClientAction(clientData)

      expect(result.success).toBe(true)
      expect(result.data.type).toBe('COMPANY')
      expect(result.data.companyDetails).toBeDefined()
      expect(result.data.companyDetails.industry).toBe('Technology')
    })
  })
})
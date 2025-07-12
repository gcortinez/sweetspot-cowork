import {
  createClientSchema,
  updateClientSchema,
  deleteClientSchema,
  listClientsSchema,
  ClientTypeSchema,
  ClientStatusSchema,
} from '@/lib/validations/client'
import {
  expectValidationError,
  expectValidationSuccess,
  generateEmail,
  generatePhoneNumber,
} from '../../utils/test-helpers'

describe('Client Validation Schemas', () => {
  describe('createClientSchema', () => {
    const validClientData = {
      name: 'John Doe',
      email: 'john@example.com',
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

    it('should validate a valid client object', () => {
      const result = expectValidationSuccess(createClientSchema, validClientData)
      expect(result.name).toBe(validClientData.name)
      expect(result.email).toBe(validClientData.email)
      expect(result.type).toBe(validClientData.type)
    })

    it('should require name field', () => {
      const invalidData = { ...validClientData, name: '' }
      expectValidationError(createClientSchema, invalidData, 'name')
    })

    it('should require valid email format', () => {
      const invalidData = { ...validClientData, email: 'invalid-email' }
      expectValidationError(createClientSchema, invalidData, 'email')
    })

    it('should validate phone number format', () => {
      const invalidData = { ...validClientData, phone: '123' }
      expectValidationError(createClientSchema, invalidData, 'phone')
    })

    it('should require valid client type', () => {
      const invalidData = { ...validClientData, type: 'INVALID' as any }
      expectValidationError(createClientSchema, invalidData, 'type')
    })

    it('should validate address fields when provided', () => {
      const invalidData = {
        ...validClientData,
        address: {
          street: '',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
      }
      expectValidationError(createClientSchema, invalidData, 'address.street')
    })

    it('should validate company details for company type', () => {
      const companyData = {
        ...validClientData,
        type: 'COMPANY' as const,
        companyDetails: {
          industry: 'Technology',
          employeeCount: 50,
          website: 'https://example.com',
          annualRevenue: 1000000,
        },
      }
      
      const result = expectValidationSuccess(createClientSchema, companyData)
      expect(result.companyDetails).toBeDefined()
      expect(result.companyDetails.industry).toBe('Technology')
    })

    it('should reject invalid website URL', () => {
      const invalidData = {
        ...validClientData,
        type: 'COMPANY' as const,
        companyDetails: {
          website: 'not-a-url',
        },
      }
      expectValidationError(createClientSchema, invalidData, 'companyDetails.website')
    })

    it('should validate emergency contact information', () => {
      const dataWithEmergency = {
        ...validClientData,
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1987654321',
          relationship: 'Spouse',
        },
      }
      
      const result = expectValidationSuccess(createClientSchema, dataWithEmergency)
      expect(result.emergencyContact).toBeDefined()
      expect(result.emergencyContact.name).toBe('Jane Doe')
    })

    it('should set default values correctly', () => {
      const minimalData = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'INDIVIDUAL' as const,
      }
      
      const result = expectValidationSuccess(createClientSchema, minimalData)
      expect(result.status).toBe('ACTIVE')
      expect(result.isVerified).toBe(false)
      expect(result.tags).toEqual([])
      expect(result.preferences).toBeDefined()
    })

    it('should validate preferences object', () => {
      const dataWithPreferences = {
        ...validClientData,
        preferences: {
          communications: {
            email: true,
            sms: false,
            push: true,
          },
          notifications: {
            bookingReminders: true,
            paymentReminders: true,
            marketingEmails: false,
          },
          language: 'en',
          timezone: 'America/New_York',
        },
      }
      
      const result = expectValidationSuccess(createClientSchema, dataWithPreferences)
      expect(result.preferences.language).toBe('en')
      expect(result.preferences.communications.email).toBe(true)
    })
  })

  describe('updateClientSchema', () => {
    it('should validate update with partial data', () => {
      const updateData = {
        id: 'client-123',
        name: 'Updated Name',
        phone: '+1987654321',
      }
      
      const result = expectValidationSuccess(updateClientSchema, updateData)
      expect(result.id).toBe('client-123')
      expect(result.name).toBe('Updated Name')
    })

    it('should require valid UUID for id', () => {
      const invalidData = {
        id: 'invalid-uuid',
        name: 'Updated Name',
      }
      expectValidationError(updateClientSchema, invalidData, 'id')
    })

    it('should validate partial address updates', () => {
      const updateData = {
        id: 'b8a9c5d2-3f4e-4b6a-8c1d-2e3f4b5a6c7d',
        address: {
          city: 'New City',
          state: 'NY',
        },
      }
      
      const result = expectValidationSuccess(updateClientSchema, updateData)
      expect(result.address.city).toBe('New City')
    })
  })

  describe('deleteClientSchema', () => {
    it('should validate delete request', () => {
      const deleteData = {
        id: 'b8a9c5d2-3f4e-4b6a-8c1d-2e3f4b5a6c7d',
      }
      
      const result = expectValidationSuccess(deleteClientSchema, deleteData)
      expect(result.id).toBe(deleteData.id)
    })

    it('should require valid UUID', () => {
      const invalidData = {
        id: 'not-a-uuid',
      }
      expectValidationError(deleteClientSchema, invalidData, 'id')
    })
  })

  describe('listClientsSchema', () => {
    it('should validate list request with default values', () => {
      const result = expectValidationSuccess(listClientsSchema, {})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.sortBy).toBe('name')
      expect(result.sortOrder).toBe('asc')
    })

    it('should validate pagination parameters', () => {
      const listData = {
        page: 2,
        limit: 50,
      }
      
      const result = expectValidationSuccess(listClientsSchema, listData)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
    })

    it('should validate search and filter parameters', () => {
      const listData = {
        search: 'John Doe',
        type: 'INDIVIDUAL' as const,
        status: 'ACTIVE' as const,
        tags: ['VIP', 'Premium'],
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      }
      
      const result = expectValidationSuccess(listClientsSchema, listData)
      expect(result.search).toBe('John Doe')
      expect(result.type).toBe('INDIVIDUAL')
      expect(result.status).toBe('ACTIVE')
      expect(result.tags).toEqual(['VIP', 'Premium'])
    })

    it('should reject invalid pagination values', () => {
      const invalidData = {
        page: 0, // Must be at least 1
        limit: 101, // Must not exceed 100
      }
      expectValidationError(listClientsSchema, invalidData, 'page')
    })

    it('should reject invalid sort fields', () => {
      const invalidData = {
        sortBy: 'invalid_field' as any,
      }
      expectValidationError(listClientsSchema, invalidData, 'sortBy')
    })
  })

  describe('Enum Schemas', () => {
    describe('ClientTypeSchema', () => {
      it('should accept valid client types', () => {
        expect(() => ClientTypeSchema.parse('INDIVIDUAL')).not.toThrow()
        expect(() => ClientTypeSchema.parse('COMPANY')).not.toThrow()
      })

      it('should reject invalid client types', () => {
        expect(() => ClientTypeSchema.parse('INVALID')).toThrow()
        expect(() => ClientTypeSchema.parse('')).toThrow()
      })
    })

    describe('ClientStatusSchema', () => {
      it('should accept valid client statuses', () => {
        expect(() => ClientStatusSchema.parse('ACTIVE')).not.toThrow()
        expect(() => ClientStatusSchema.parse('INACTIVE')).not.toThrow()
        expect(() => ClientStatusSchema.parse('SUSPENDED')).not.toThrow()
        expect(() => ClientStatusSchema.parse('PENDING_VERIFICATION')).not.toThrow()
      })

      it('should reject invalid client statuses', () => {
        expect(() => ClientStatusSchema.parse('INVALID')).toThrow()
        expect(() => ClientStatusSchema.parse('DELETED')).toThrow()
      })
    })
  })

  describe('Field-specific Validations', () => {
    it('should validate email uniqueness context', () => {
      const clientData = {
        name: 'John Doe',
        email: generateEmail('unique'),
        type: 'INDIVIDUAL' as const,
      }
      
      const result = expectValidationSuccess(createClientSchema, clientData)
      expect(result.email).toContain('@')
    })

    it('should validate phone number formats', () => {
      const validPhoneNumbers = [
        '+1234567890',
        '+1-234-567-8900',
        '+1 (234) 567-8900',
        '(234) 567-8900',
        '234-567-8900',
      ]

      validPhoneNumbers.forEach(phone => {
        const clientData = {
          name: 'John Doe',
          email: generateEmail(),
          phone,
          type: 'INDIVIDUAL' as const,
        }
        expect(() => createClientSchema.parse(clientData)).not.toThrow()
      })
    })

    it('should validate address completeness', () => {
      const incompleteAddress = {
        street: '123 Main St',
        city: 'Test City',
        // Missing state, zipCode, country
      }

      const clientData = {
        name: 'John Doe',
        email: generateEmail(),
        type: 'INDIVIDUAL' as const,
        address: incompleteAddress,
      }

      expectValidationError(createClientSchema, clientData, 'address.state')
    })

    it('should validate tag array limits', () => {
      const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`)
      
      const clientData = {
        name: 'John Doe',
        email: generateEmail(),
        type: 'INDIVIDUAL' as const,
        tags: tooManyTags,
      }

      expectValidationError(createClientSchema, clientData, 'tags')
    })

    it('should validate metadata structure', () => {
      const clientData = {
        name: 'John Doe',
        email: generateEmail(),
        type: 'INDIVIDUAL' as const,
        metadata: {
          customField1: 'value1',
          customField2: 123,
          customField3: true,
          nested: {
            field: 'value',
          },
        },
      }

      const result = expectValidationSuccess(createClientSchema, clientData)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.customField1).toBe('value1')
    })
  })
})
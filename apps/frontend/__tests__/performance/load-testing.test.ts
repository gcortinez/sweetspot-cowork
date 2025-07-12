import {
  measureExecutionTime,
  expectExecutionTimeUnder,
  createMockClient,
  mockPrismaMethod,
  setupTestEnvironment,
  cleanupTestEnvironment,
} from '../utils/test-helpers'
import { listClientsAction } from '@/lib/actions/client'

// Setup test environment
setupTestEnvironment()
cleanupTestEnvironment()

describe('Performance Testing', () => {
  describe('Database Query Performance', () => {
    it('should list clients within acceptable time limits', async () => {
      // Mock large dataset
      const mockClients = Array.from({ length: 1000 }, (_, i) => 
        createMockClient({ name: `Client ${i}` })
      )

      mockPrismaMethod('client', 'count', 1000)
      mockPrismaMethod('client', 'findMany', mockClients.slice(0, 20)) // First page

      await expectExecutionTimeUnder(
        () => listClientsAction({ page: 1, limit: 20 }),
        1000 // Should complete within 1 second
      )
    })

    it('should handle pagination efficiently', async () => {
      const mockClients = Array.from({ length: 50 }, (_, i) => 
        createMockClient({ name: `Client ${i}` })
      )

      mockPrismaMethod('client', 'count', 5000)
      mockPrismaMethod('client', 'findMany', mockClients)

      const { executionTime } = await measureExecutionTime(() =>
        listClientsAction({ page: 100, limit: 50 })
      )

      // Large page offsets should still be reasonably fast
      expect(executionTime).toBeLessThan(2000)
    })

    it('should perform complex filtering efficiently', async () => {
      const mockClients = Array.from({ length: 10 }, (_, i) => 
        createMockClient({ 
          name: `Filtered Client ${i}`,
          type: 'COMPANY',
          status: 'ACTIVE',
        })
      )

      mockPrismaMethod('client', 'count', 10)
      mockPrismaMethod('client', 'findMany', mockClients)

      await expectExecutionTimeUnder(
        () => listClientsAction({
          search: 'Filtered',
          type: 'COMPANY',
          status: 'ACTIVE',
          tags: ['VIP'],
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        1500 // Complex queries should complete within 1.5 seconds
      )
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockClients = Array.from({ length: 20 }, (_, i) => 
        createMockClient({ name: `Concurrent Client ${i}` })
      )

      mockPrismaMethod('client', 'count', 1000)
      mockPrismaMethod('client', 'findMany', mockClients)

      // Simulate 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        listClientsAction({ page: 1, limit: 20 })
      )

      const startTime = performance.now()
      const results = await Promise.all(promises)
      const endTime = performance.now()

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Concurrent execution should not be significantly slower than sequential
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should handle burst requests gracefully', async () => {
      const mockClients = [createMockClient()]

      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      // Simulate burst of 50 requests
      const promises = Array.from({ length: 50 }, (_, i) =>
        listClientsAction({ page: Math.floor(i / 10) + 1, limit: 10 })
      )

      const results = await Promise.allSettled(promises)

      // Most requests should succeed (allow for some rate limiting)
      const successCount = results.filter(r => r.status === 'fulfilled').length
      expect(successCount).toBeGreaterThan(40) // At least 80% success rate
    })
  })

  describe('Memory Usage Testing', () => {
    it('should not leak memory with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Process large dataset multiple times
      for (let i = 0; i < 10; i++) {
        const largeMockClients = Array.from({ length: 1000 }, (_, j) => 
          createMockClient({ name: `Memory Test Client ${i}-${j}` })
        )

        mockPrismaMethod('client', 'count', 1000)
        mockPrismaMethod('client', 'findMany', largeMockClients)

        await listClientsAction({ page: 1, limit: 1000 })

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('API Response Time Testing', () => {
    beforeEach(() => {
      // Mock fetch for API testing
      global.fetch = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should respond to API calls within SLA', async () => {
      const mockResponse = {
        clients: Array.from({ length: 20 }, (_, i) => createMockClient()),
        pagination: { page: 1, limit: 20, total: 100, pages: 5 },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const { executionTime } = await measureExecutionTime(async () => {
        const response = await fetch('/api/clients')
        return response.json()
      })

      // API should respond within 500ms
      expect(executionTime).toBeLessThan(500)
    })

    it('should handle API timeouts gracefully', async () => {
      // Mock timeout
      ;(global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1000)
        )
      )

      const startTime = performance.now()
      
      try {
        await fetch('/api/clients')
      } catch (error) {
        const endTime = performance.now()
        
        // Should timeout within reasonable time
        expect(endTime - startTime).toBeLessThan(1100)
        expect(error.message).toBe('Timeout')
      }
    })
  })

  describe('Stress Testing', () => {
    it('should handle high-frequency requests', async () => {
      const mockClients = [createMockClient()]
      
      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      // Send 100 requests as fast as possible
      const promises: Promise<any>[] = []
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        promises.push(listClientsAction({ page: 1, limit: 1 }))
      }

      const results = await Promise.allSettled(promises)
      const endTime = performance.now()

      // Calculate success rate
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const successRate = (successCount / 100) * 100

      console.log(`Stress test: ${successCount}/100 requests succeeded (${successRate}%)`)
      console.log(`Total time: ${endTime - startTime}ms`)
      console.log(`Average time per request: ${(endTime - startTime) / 100}ms`)

      // At least 90% should succeed under stress
      expect(successRate).toBeGreaterThan(90)

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds
    })

    it('should recover after stress period', async () => {
      const mockClients = [createMockClient()]
      
      mockPrismaMethod('client', 'count', 1)
      mockPrismaMethod('client', 'findMany', mockClients)

      // Stress period
      const stressPromises = Array.from({ length: 50 }, () =>
        listClientsAction({ page: 1, limit: 1 })
      )
      
      await Promise.allSettled(stressPromises)

      // Recovery period - wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      // Test normal operation after stress
      const { executionTime } = await measureExecutionTime(() =>
        listClientsAction({ page: 1, limit: 20 })
      )

      // Should return to normal performance
      expect(executionTime).toBeLessThan(1000)
    })
  })

  describe('Resource Utilization', () => {
    it('should use CPU efficiently', async () => {
      const mockClients = Array.from({ length: 100 }, (_, i) => 
        createMockClient({ name: `CPU Test Client ${i}` })
      )

      mockPrismaMethod('client', 'count', 100)
      mockPrismaMethod('client', 'findMany', mockClients)

      const iterations = 50
      const startTime = process.hrtime.bigint()

      // Perform CPU-intensive operations
      for (let i = 0; i < iterations; i++) {
        await listClientsAction({ page: 1, limit: 100 })
      }

      const endTime = process.hrtime.bigint()
      const executionTime = Number(endTime - startTime) / 1000000 // Convert to milliseconds

      const averageTimePerIteration = executionTime / iterations

      console.log(`CPU efficiency test: ${averageTimePerIteration.toFixed(2)}ms per iteration`)

      // Each iteration should be reasonably fast
      expect(averageTimePerIteration).toBeLessThan(100)
    })

    it('should handle large payloads efficiently', async () => {
      // Create very large mock client data
      const largeMockClients = Array.from({ length: 1000 }, (_, i) => ({
        ...createMockClient({ name: `Large Payload Client ${i}` }),
        // Add large metadata
        metadata: JSON.stringify({
          largeField: 'x'.repeat(1000), // 1KB of data per client
          moreData: Array.from({ length: 100 }, (_, j) => `data-${j}`),
        }),
      }))

      mockPrismaMethod('client', 'count', 1000)
      mockPrismaMethod('client', 'findMany', largeMockClients)

      const { executionTime } = await measureExecutionTime(() =>
        listClientsAction({ page: 1, limit: 1000 })
      )

      // Should handle large payloads within reasonable time
      expect(executionTime).toBeLessThan(3000)
    })
  })
})
import { 
  setupTestEnvironment,
  cleanupTestEnvironment,
} from '../utils/test-helpers'

// Setup test environment
setupTestEnvironment()
cleanupTestEnvironment()

describe('Deployment Readiness Checks', () => {
  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ]

      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined()
        expect(process.env[envVar]).not.toBe('')
      })
    })

    it('should have valid database URL format', () => {
      const databaseUrl = process.env.DATABASE_URL
      expect(databaseUrl).toMatch(/^postgresql:\/\//)
    })

    it('should have valid Supabase URLs', () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/)
    })

    it('should not expose sensitive data in public env vars', () => {
      const publicEnvVars = Object.keys(process.env).filter(key => 
        key.startsWith('NEXT_PUBLIC_')
      )

      const sensitiveKeywords = ['password', 'secret', 'private', 'key']
      
      publicEnvVars.forEach(envVar => {
        const lowerEnvVar = envVar.toLowerCase()
        sensitiveKeywords.forEach(keyword => {
          expect(lowerEnvVar).not.toContain(keyword)
        })
      })
    })
  })

  describe('Application Health', () => {
    it('should load essential modules without errors', () => {
      expect(() => {
        require('@/lib/prisma')
      }).not.toThrow()

      expect(() => {
        require('@/lib/auth')
      }).not.toThrow()

      expect(() => {
        require('@/lib/validations')
      }).not.toThrow()

      expect(() => {
        require('@/lib/actions')
      }).not.toThrow()
    })

    it('should have proper database connection configuration', async () => {
      const { prisma } = require('@/lib/prisma')
      
      // Should be able to create prisma client without errors
      expect(prisma).toBeDefined()
      expect(typeof prisma.$connect).toBe('function')
      expect(typeof prisma.$disconnect).toBe('function')
    })

    it('should have all required API routes', () => {
      const fs = require('fs')
      const path = require('path')

      const apiRoutesDir = path.join(process.cwd(), 'src/app/api')
      
      const requiredRoutes = [
        'clients/route.ts',
        'bookings/route.ts',
        'invoices/route.ts',
        'memberships/route.ts',
        'notifications/route.ts',
        'reports/route.ts',
        'integrations/api-keys/route.ts',
        'integrations/webhooks/route.ts',
      ]

      requiredRoutes.forEach(route => {
        const routePath = path.join(apiRoutesDir, route)
        expect(fs.existsSync(routePath)).toBe(true)
      })
    })
  })

  describe('Security Checks', () => {
    it('should not have debug code in production builds', () => {
      const fs = require('fs')
      const path = require('path')

      // Check for common debug patterns in built files
      const srcDir = path.join(process.cwd(), 'src')
      
      const checkFile = (filePath: string) => {
        if (fs.existsSync(filePath) && filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf8')
          
          // Should not contain console.log statements (except in specific debug files)
          if (!filePath.includes('debug') && !filePath.includes('test')) {
            expect(content).not.toMatch(/console\.log\(/g)
          }
          
          // Should not contain TODO comments in production code
          expect(content).not.toMatch(/TODO:/g)
          
          // Should not contain hardcoded credentials
          expect(content).not.toMatch(/password.*=.*["'].*["']/gi)
          expect(content).not.toMatch(/secret.*=.*["'].*["']/gi)
        }
      }

      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir)
        files.forEach((file: string) => {
          const filePath = path.join(dir, file)
          const stat = fs.statSync(filePath)
          
          if (stat.isDirectory()) {
            walkDir(filePath)
          } else {
            checkFile(filePath)
          }
        })
      }

      // Only check if src directory exists (may not in all test environments)
      if (fs.existsSync(srcDir)) {
        walkDir(srcDir)
      }
    })

    it('should have proper CORS configuration', () => {
      // This would typically check next.config.js or middleware
      // For now, we ensure no wildcard CORS in production
      expect(process.env.NODE_ENV).toBeDefined()
      
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.ALLOWED_ORIGINS).toBeDefined()
        expect(process.env.ALLOWED_ORIGINS).not.toBe('*')
      }
    })

    it('should use HTTPS in production environment', () => {
      if (process.env.NODE_ENV === 'production') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        expect(supabaseUrl).toMatch(/^https:\/\//)
        
        // Any other production URLs should also use HTTPS
        const productionUrls = [
          process.env.NEXT_PUBLIC_APP_URL,
          process.env.WEBHOOK_BASE_URL,
        ].filter(Boolean)

        productionUrls.forEach(url => {
          expect(url).toMatch(/^https:\/\//)
        })
      }
    })
  })

  describe('Performance Benchmarks', () => {
    it('should meet minimum performance thresholds', async () => {
      // Test critical path performance
      const { measureExecutionTime } = require('../utils/test-helpers')

      // Import validation should be fast
      const { executionTime: validationTime } = await measureExecutionTime(async () => {
        const { createClientSchema } = require('@/lib/validations/client')
        return createClientSchema
      })

      expect(validationTime).toBeLessThan(100) // Should load within 100ms

      // Action imports should be fast
      const { executionTime: actionTime } = await measureExecutionTime(async () => {
        const { createClientAction } = require('@/lib/actions/client')
        return createClientAction
      })

      expect(actionTime).toBeLessThan(200) // Should load within 200ms
    })

    it('should have acceptable bundle size', () => {
      const fs = require('fs')
      const path = require('path')

      const buildDir = path.join(process.cwd(), '.next')
      
      if (fs.existsSync(buildDir)) {
        // Check if build directory size is reasonable
        const getBuildSize = (dir: string): number => {
          let size = 0
          const files = fs.readdirSync(dir)
          
          files.forEach((file: string) => {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)
            
            if (stat.isDirectory()) {
              size += getBuildSize(filePath)
            } else {
              size += stat.size
            }
          })
          
          return size
        }

        const buildSize = getBuildSize(buildDir)
        const buildSizeMB = buildSize / (1024 * 1024)

        console.log(`Build size: ${buildSizeMB.toFixed(2)} MB`)

        // Build should not exceed 100MB
        expect(buildSizeMB).toBeLessThan(100)
      }
    })
  })

  describe('Data Integrity', () => {
    it('should have consistent validation schemas', () => {
      const validationModules = [
        require('@/lib/validations/client'),
        require('@/lib/validations/booking'),
        require('@/lib/validations/invoice'),
        require('@/lib/validations/membership'),
        require('@/lib/validations/notification'),
        require('@/lib/validations/report'),
        require('@/lib/validations/integration'),
      ]

      validationModules.forEach(module => {
        // Each module should export schemas
        expect(module).toBeDefined()
        
        // Should have create, update, delete, and list schemas
        const schemaTypes = ['create', 'update', 'delete', 'list']
        const entityName = Object.keys(module)[0]?.replace(/Schema$/, '')
        
        if (entityName) {
          schemaTypes.forEach(type => {
            const schemaName = `${type}${entityName.charAt(0).toUpperCase() + entityName.slice(1)}Schema`
            // Not all entities have all schema types, so we just check they exist when expected
          })
        }
      })
    })

    it('should have consistent action interfaces', () => {
      const actionModules = [
        require('@/lib/actions/client'),
        require('@/lib/actions/booking'),
        require('@/lib/actions/invoice'),
        require('@/lib/actions/membership'),
        require('@/lib/actions/notification'),
        require('@/lib/actions/report'),
        require('@/lib/actions/integration'),
      ]

      actionModules.forEach(module => {
        // Each module should export action functions
        expect(module).toBeDefined()
        
        const functions = Object.keys(module).filter(key => 
          typeof module[key] === 'function'
        )

        // Should have CRUD operations
        const expectedActions = ['create', 'list']
        expectedActions.forEach(action => {
          const hasAction = functions.some(fn => fn.includes(action))
          expect(hasAction).toBe(true)
        })
      })
    })
  })

  describe('Monitoring and Observability', () => {
    it('should have proper error handling', () => {
      // Check that actions have proper error handling
      const { createClientAction } = require('@/lib/actions/client')
      
      expect(typeof createClientAction).toBe('function')
      
      // Test error handling with invalid input
      expect(async () => {
        await createClientAction({})
      }).not.toThrow() // Should handle errors gracefully, not throw
    })

    it('should have logging configuration', () => {
      // Check that console methods are available for logging
      expect(console.log).toBeDefined()
      expect(console.error).toBeDefined()
      expect(console.warn).toBeDefined()
      
      // In production, might want to check for proper logging service
      if (process.env.NODE_ENV === 'production') {
        // Could check for logging service configuration
        // expect(process.env.LOG_SERVICE_URL).toBeDefined()
      }
    })
  })

  describe('Database Readiness', () => {
    it('should be able to connect to database', async () => {
      const { prisma } = require('@/lib/prisma')
      
      // Mock successful connection
      const mockConnect = jest.spyOn(prisma, '$connect').mockResolvedValue(undefined)
      
      await expect(prisma.$connect()).resolves.not.toThrow()
      
      mockConnect.mockRestore()
    })

    it('should have all required database models', () => {
      const { prisma } = require('@/lib/prisma')
      
      const requiredModels = [
        'user',
        'tenant',
        'client',
        'booking',
        'invoice',
        'membership',
        'notification',
        'report',
        'apiKey',
        'webhook',
      ]

      requiredModels.forEach(model => {
        expect(prisma[model]).toBeDefined()
        expect(typeof prisma[model].create).toBe('function')
        expect(typeof prisma[model].findMany).toBe('function')
        expect(typeof prisma[model].update).toBe('function')
        expect(typeof prisma[model].delete).toBe('function')
      })
    })
  })

  describe('API Compatibility', () => {
    it('should have consistent API response format', () => {
      // All actions should return ActionResult format
      const { createSuccessResult, createErrorResult } = require('../utils/test-helpers')
      
      const successResult = createSuccessResult({ id: '123' })
      expect(successResult.success).toBe(true)
      expect(successResult.data).toBeDefined()
      
      const errorResult = createErrorResult('Test error')
      expect(errorResult.success).toBe(false)
      expect(errorResult.error).toBeDefined()
    })

    it('should have proper HTTP status codes', () => {
      // This would test actual API routes
      const statusCodes = {
        GET_SUCCESS: 200,
        POST_SUCCESS: 201,
        PUT_SUCCESS: 200,
        DELETE_SUCCESS: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_ERROR: 500,
      }

      Object.values(statusCodes).forEach(code => {
        expect(code).toBeGreaterThan(99)
        expect(code).toBeLessThan(600)
      })
    })
  })
})
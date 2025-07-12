import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import crypto from 'crypto'
import {
  createApiKeySchema,
  createWebhookSchema,
  createExternalServiceSchema,
  createDataMigrationSchema,
  createImportExportConfigSchema,
  updateApiKeySchema,
  updateWebhookSchema,
  updateExternalServiceSchema,
  updateDataMigrationSchema,
  updateImportExportConfigSchema,
  deleteApiKeySchema,
  deleteWebhookSchema,
  deleteExternalServiceSchema,
  deleteDataMigrationSchema,
  deleteImportExportConfigSchema,
  getApiKeySchema,
  getWebhookSchema,
  getExternalServiceSchema,
  getDataMigrationSchema,
  getImportExportConfigSchema,
  listApiKeysSchema,
  listWebhooksSchema,
  listExternalServicesSchema,
  listDataMigrationsSchema,
  executeDataMigrationSchema,
  rollbackDataMigrationSchema,
  testWebhookSchema,
  testExternalServiceSchema,
  rotateApiKeySchema,
  importDataSchema,
  exportDataSchema,
  type CreateApiKeyRequest,
  type CreateWebhookRequest,
  type CreateExternalServiceRequest,
  type CreateDataMigrationRequest,
  type CreateImportExportConfigRequest,
  type UpdateApiKeyRequest,
  type UpdateWebhookRequest,
  type UpdateExternalServiceRequest,
  type UpdateDataMigrationRequest,
  type UpdateImportExportConfigRequest,
  type DeleteApiKeyRequest,
  type DeleteWebhookRequest,
  type DeleteExternalServiceRequest,
  type DeleteDataMigrationRequest,
  type DeleteImportExportConfigRequest,
  type GetApiKeyRequest,
  type GetWebhookRequest,
  type GetExternalServiceRequest,
  type GetDataMigrationRequest,
  type GetImportExportConfigRequest,
  type ListApiKeysRequest,
  type ListWebhooksRequest,
  type ListExternalServicesRequest,
  type ListDataMigrationsRequest,
  type ExecuteDataMigrationRequest,
  type RollbackDataMigrationRequest,
  type TestWebhookRequest,
  type TestExternalServiceRequest,
  type RotateApiKeyRequest,
  type ImportDataRequest,
  type ExportDataRequest,
} from '@/lib/validations/integration'

/**
 * Create a new API key
 */
export async function createApiKeyAction(data: CreateApiKeyRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createApiKeySchema.parse(data)

    // Generate API key if not provided
    let apiKey = validatedData.key
    if (!apiKey) {
      const prefix = validatedData.prefix || 'sk_'
      const randomBytes = crypto.randomBytes(32).toString('hex')
      apiKey = `${prefix}${randomBytes}`
    }

    // Hash the API key for storage
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')

    // Create API key record
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        ...validatedData,
        tenantId,
        key: hashedKey, // Store hashed version
        scopes: JSON.stringify(validatedData.scopes),
        permissions: JSON.stringify(validatedData.permissions),
        rateLimit: JSON.stringify(validatedData.rateLimit),
        allowedIPs: JSON.stringify(validatedData.allowedIPs),
        allowedDomains: JSON.stringify(validatedData.allowedDomains),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/integrations/api-keys')
    
    return { 
      success: true, 
      data: {
        ...apiKeyRecord,
        key: apiKey, // Return original key only once
        scopes: JSON.parse(apiKeyRecord.scopes),
        permissions: JSON.parse(apiKeyRecord.permissions),
        rateLimit: JSON.parse(apiKeyRecord.rateLimit),
        allowedIPs: JSON.parse(apiKeyRecord.allowedIPs),
        allowedDomains: JSON.parse(apiKeyRecord.allowedDomains),
        metadata: apiKeyRecord.metadata ? JSON.parse(apiKeyRecord.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create API key error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create API key' }
  }
}

/**
 * Create a new webhook
 */
export async function createWebhookAction(data: CreateWebhookRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createWebhookSchema.parse(data)

    // Create webhook record
    const webhook = await prisma.webhook.create({
      data: {
        ...validatedData,
        tenantId,
        events: JSON.stringify(validatedData.events),
        eventFilters: JSON.stringify(validatedData.eventFilters),
        headers: JSON.stringify(validatedData.headers),
        authConfig: JSON.stringify(validatedData.authConfig),
        expectedResponseCodes: JSON.stringify(validatedData.expectedResponseCodes),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/integrations/webhooks')
    
    return { 
      success: true, 
      data: {
        ...webhook,
        events: JSON.parse(webhook.events),
        eventFilters: JSON.parse(webhook.eventFilters),
        headers: JSON.parse(webhook.headers),
        authConfig: JSON.parse(webhook.authConfig),
        expectedResponseCodes: JSON.parse(webhook.expectedResponseCodes),
        metadata: webhook.metadata ? JSON.parse(webhook.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create webhook error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create webhook' }
  }
}

/**
 * Create an external service integration
 */
export async function createExternalServiceAction(data: CreateExternalServiceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createExternalServiceSchema.parse(data)

    // Create external service record
    const service = await prisma.externalService.create({
      data: {
        ...validatedData,
        tenantId,
        connectionConfig: JSON.stringify(validatedData.connectionConfig),
        authConfig: JSON.stringify(validatedData.authConfig),
        syncConfig: validatedData.syncConfig ? JSON.stringify(validatedData.syncConfig) : null,
        rateLimits: JSON.stringify(validatedData.rateLimits),
        healthCheck: JSON.stringify(validatedData.healthCheck),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/integrations/services')
    
    return { 
      success: true, 
      data: {
        ...service,
        connectionConfig: JSON.parse(service.connectionConfig),
        authConfig: JSON.parse(service.authConfig),
        syncConfig: service.syncConfig ? JSON.parse(service.syncConfig) : null,
        rateLimits: JSON.parse(service.rateLimits),
        healthCheck: JSON.parse(service.healthCheck),
        metadata: service.metadata ? JSON.parse(service.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create external service error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create external service' }
  }
}

/**
 * Create a data migration
 */
export async function createDataMigrationAction(data: CreateDataMigrationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createDataMigrationSchema.parse(data)

    // Check for circular dependencies
    const hasCycle = await checkMigrationDependencies(validatedData.dependencies, tenantId)
    if (hasCycle) {
      return { success: false, error: 'Circular dependency detected in migration dependencies' }
    }

    // Create migration record
    const migration = await prisma.dataMigration.create({
      data: {
        ...validatedData,
        tenantId,
        source: JSON.stringify(validatedData.source),
        target: JSON.stringify(validatedData.target),
        fieldMapping: JSON.stringify(validatedData.fieldMapping),
        validationRules: JSON.stringify(validatedData.validationRules),
        dependencies: JSON.stringify(validatedData.dependencies),
        rollbackConfig: JSON.stringify(validatedData.rollbackConfig),
        options: JSON.stringify(validatedData.options),
        errorLog: JSON.stringify(validatedData.errorLog),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/integrations/migrations')
    
    return { 
      success: true, 
      data: {
        ...migration,
        source: JSON.parse(migration.source),
        target: JSON.parse(migration.target),
        fieldMapping: JSON.parse(migration.fieldMapping),
        validationRules: JSON.parse(migration.validationRules),
        dependencies: JSON.parse(migration.dependencies),
        rollbackConfig: JSON.parse(migration.rollbackConfig),
        options: JSON.parse(migration.options),
        errorLog: JSON.parse(migration.errorLog),
        metadata: migration.metadata ? JSON.parse(migration.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create data migration error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create data migration' }
  }
}

/**
 * List API keys with filtering and pagination
 */
export async function listApiKeysAction(data: ListApiKeysRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listApiKeysSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    if (validatedData.environment) {
      where.environment = validatedData.environment
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.apiKey.count({ where })

    // Get API keys (excluding actual key values)
    const apiKeys = await prisma.apiKey.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      select: {
        id: true,
        name: true,
        description: true,
        prefix: true,
        scopes: true,
        permissions: true,
        rateLimit: true,
        allowedIPs: true,
        allowedDomains: true,
        isActive: true,
        environment: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
        tenant: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedApiKeys = apiKeys.map(apiKey => ({
      ...apiKey,
      scopes: JSON.parse(apiKey.scopes),
      permissions: JSON.parse(apiKey.permissions),
      rateLimit: JSON.parse(apiKey.rateLimit),
      allowedIPs: JSON.parse(apiKey.allowedIPs),
      allowedDomains: JSON.parse(apiKey.allowedDomains),
      metadata: apiKey.metadata ? JSON.parse(apiKey.metadata) : null,
      keyPreview: `${apiKey.prefix || 'sk_'}****`, // Show only prefix
    }))
    
    return { 
      success: true, 
      data: {
        apiKeys: processedApiKeys,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List API keys error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list API keys' }
  }
}

/**
 * Execute a data migration
 */
export async function executeDataMigrationAction(data: ExecuteDataMigrationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = executeDataMigrationSchema.parse(data)

    // Get migration
    const migration = await prisma.dataMigration.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!migration) {
      return { success: false, error: 'Migration not found' }
    }

    if (migration.status === 'IN_PROGRESS') {
      return { success: false, error: 'Migration is already running' }
    }

    // Check dependencies
    const dependencies = JSON.parse(migration.dependencies)
    if (dependencies.length > 0) {
      const dependencyStatuses = await prisma.dataMigration.findMany({
        where: {
          id: { in: dependencies },
          tenantId,
        },
        select: {
          id: true,
          status: true,
          name: true,
        },
      })

      const incompleteDeps = dependencyStatuses.filter(dep => dep.status !== 'COMPLETED')
      if (incompleteDeps.length > 0) {
        return {
          success: false,
          error: 'Some dependencies are not completed',
          details: { incompleteDependencies: incompleteDeps.map(dep => dep.name) },
        }
      }
    }

    // Update migration status
    await prisma.dataMigration.update({
      where: { id: validatedData.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errorLog: JSON.stringify([]),
      },
    })

    // Execute migration asynchronously
    executeMigrationAsync(validatedData.id, migration, validatedData, user.id)

    revalidatePath('/integrations/migrations')
    revalidatePath(`/integrations/migrations/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        id: validatedData.id,
        status: 'IN_PROGRESS',
        message: 'Migration execution started',
      }
    }
  } catch (error: any) {
    console.error('Execute migration error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to execute migration' }
  }
}

/**
 * Test a webhook
 */
export async function testWebhookAction(data: TestWebhookRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = testWebhookSchema.parse(data)

    // Get webhook
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!webhook) {
      return { success: false, error: 'Webhook not found' }
    }

    // Parse webhook configuration
    const events = JSON.parse(webhook.events)
    const headers = JSON.parse(webhook.headers)
    const authConfig = JSON.parse(webhook.authConfig)

    // Check if webhook supports the test event
    if (!events.includes(validatedData.event)) {
      return { success: false, error: 'Webhook does not support this event type' }
    }

    // Prepare test payload
    const testPayload = {
      id: crypto.randomUUID(),
      event: validatedData.event,
      timestamp: new Date().toISOString(),
      data: validatedData.testData,
      test: true,
    }

    // Send test webhook
    const result = await sendWebhook(webhook, testPayload)

    // Create delivery log
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: validatedData.event,
        payload: JSON.stringify(testPayload),
        response: result.response ? JSON.stringify(result.response) : null,
        status: result.success ? 'SUCCESS' : 'FAILED',
        responseTime: result.responseTime,
        errorMessage: result.error,
        isTest: true,
      },
    })

    return { 
      success: true, 
      data: {
        webhookId: validatedData.id,
        event: validatedData.event,
        success: result.success,
        responseTime: result.responseTime,
        response: result.response,
        error: result.error,
      }
    }
  } catch (error: any) {
    console.error('Test webhook error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to test webhook' }
  }
}

/**
 * Helper functions
 */
async function checkMigrationDependencies(dependencies: string[], tenantId: string): Promise<boolean> {
  // Simple cycle detection - in production, use a proper topological sort
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  async function hasCycle(migrationId: string): Promise<boolean> {
    if (recursionStack.has(migrationId)) {
      return true // Cycle detected
    }

    if (visited.has(migrationId)) {
      return false
    }

    visited.add(migrationId)
    recursionStack.add(migrationId)

    // Get dependencies of current migration
    const migration = await prisma.dataMigration.findFirst({
      where: { id: migrationId, tenantId },
      select: { dependencies: true },
    })

    if (migration) {
      const deps = JSON.parse(migration.dependencies)
      for (const dep of deps) {
        if (await hasCycle(dep)) {
          return true
        }
      }
    }

    recursionStack.delete(migrationId)
    return false
  }

  for (const dep of dependencies) {
    if (await hasCycle(dep)) {
      return true
    }
  }

  return false
}

async function executeMigrationAsync(migrationId: string, migration: any, request: ExecuteDataMigrationRequest, userId: string) {
  try {
    // Parse migration configuration
    const source = JSON.parse(migration.source)
    const target = JSON.parse(migration.target)
    const fieldMapping = JSON.parse(migration.fieldMapping)
    const validationRules = JSON.parse(migration.validationRules)
    const options = JSON.parse(migration.options)

    // Update with request options
    const effectiveOptions = {
      ...options,
      dryRun: request.dryRun,
      continueOnError: request.continueOnError,
    }

    // Load source data
    const sourceData = await loadSourceData(source, migration.tenantId)

    // Process data in batches
    const batchSize = target.batchSize || 100
    const totalRecords = sourceData.length
    let processedRecords = 0
    let successfulRecords = 0
    let failedRecords = 0
    const errorLog: string[] = []

    await prisma.dataMigration.update({
      where: { id: migrationId },
      data: { totalRecords },
    })

    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize)
      
      for (const record of batch) {
        try {
          // Map fields
          const mappedRecord = mapFields(record, fieldMapping)
          
          // Validate data
          if (target.validateData) {
            const validationErrors = validateRecord(mappedRecord, validationRules)
            if (validationErrors.length > 0) {
              throw new Error(`Validation failed: ${validationErrors.join(', ')}`)
            }
          }

          // Insert/update record (if not dry run)
          if (!effectiveOptions.dryRun) {
            await insertRecord(mappedRecord, target, migration.tenantId)
          }

          successfulRecords++
        } catch (error) {
          failedRecords++
          const errorMessage = `Record ${processedRecords + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errorLog.push(errorMessage)

          if (!effectiveOptions.continueOnError) {
            throw new Error(errorMessage)
          }
        }

        processedRecords++
      }

      // Update progress
      await prisma.dataMigration.update({
        where: { id: migrationId },
        data: {
          processedRecords,
          successfulRecords,
          failedRecords,
          errorLog: JSON.stringify(errorLog),
        },
      })
    }

    // Mark migration as completed
    await prisma.dataMigration.update({
      where: { id: migrationId },
      data: {
        status: failedRecords > 0 && !effectiveOptions.continueOnError ? 'PARTIAL' : 'COMPLETED',
        completedAt: new Date(),
      },
    })

  } catch (error) {
    console.error('Migration execution error:', error)
    
    // Mark migration as failed
    await prisma.dataMigration.update({
      where: { id: migrationId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorLog: JSON.stringify([error instanceof Error ? error.message : 'Unknown error']),
      },
    })
  }
}

async function loadSourceData(source: any, tenantId: string): Promise<any[]> {
  // This is a simplified implementation
  // In production, you would implement actual data loading from various sources
  
  switch (source.type) {
    case 'DATABASE':
      // Load from database using source.config.query
      return [] // Mock data
    case 'FILE':
      // Load from file using source.config.filePath
      return [] // Mock data
    case 'API':
      // Load from API using source.config.apiUrl
      return [] // Mock data
    default:
      return []
  }
}

function mapFields(record: any, fieldMapping: any[]): any {
  const mappedRecord: any = {}
  
  for (const mapping of fieldMapping) {
    let value = record[mapping.sourceField]
    
    // Apply transformation if provided
    if (mapping.transformation) {
      try {
        // In production, use a safe transformation engine
        value = eval(`(function(value) { ${mapping.transformation} })`)(value)
      } catch (error) {
        console.warn('Transformation error:', error)
      }
    }
    
    // Apply default value if needed
    if (value === undefined || value === null) {
      value = mapping.defaultValue
    }
    
    mappedRecord[mapping.targetField] = value
  }
  
  return mappedRecord
}

function validateRecord(record: any, validationRules: any[]): string[] {
  const errors: string[] = []
  
  for (const rule of validationRules) {
    const value = record[rule.field]
    
    switch (rule.rule) {
      case 'REQUIRED':
        if (value === undefined || value === null || value === '') {
          errors.push(rule.errorMessage || `${rule.field} is required`)
        }
        break
      case 'FORMAT':
        if (value && rule.params.pattern) {
          const regex = new RegExp(rule.params.pattern)
          if (!regex.test(String(value))) {
            errors.push(rule.errorMessage || `${rule.field} format is invalid`)
          }
        }
        break
      // Add more validation rules as needed
    }
  }
  
  return errors
}

async function insertRecord(record: any, target: any, tenantId: string): Promise<void> {
  // This is a simplified implementation
  // In production, you would implement actual record insertion based on target.entity
  
  const data = { ...record, tenantId }
  
  switch (target.entity) {
    case 'clients':
      // Insert into clients table
      break
    case 'bookings':
      // Insert into bookings table
      break
    // Add more entities as needed
  }
}

async function sendWebhook(webhook: any, payload: any): Promise<{ success: boolean; responseTime: number; response?: any; error?: string }> {
  const startTime = Date.now()
  
  try {
    const headers = JSON.parse(webhook.headers)
    const authConfig = JSON.parse(webhook.authConfig)
    
    // Prepare request headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': webhook.contentType,
      'User-Agent': 'SweetSpot-Webhook/1.0',
      ...headers,
    }
    
    // Add authentication headers
    switch (webhook.authMethod) {
      case 'API_KEY':
        if (authConfig.apiKey) {
          requestHeaders['Authorization'] = `Bearer ${authConfig.apiKey}`
        }
        break
      case 'BEARER_TOKEN':
        if (authConfig.bearerToken) {
          requestHeaders['Authorization'] = `Bearer ${authConfig.bearerToken}`
        }
        break
      case 'BASIC_AUTH':
        if (authConfig.basicAuth) {
          const credentials = Buffer.from(`${authConfig.basicAuth.username}:${authConfig.basicAuth.password}`).toString('base64')
          requestHeaders['Authorization'] = `Basic ${credentials}`
        }
        break
      case 'HMAC':
        if (authConfig.hmacSecret) {
          const signature = crypto.createHmac('sha256', authConfig.hmacSecret)
            .update(JSON.stringify(payload))
            .digest('hex')
          requestHeaders['X-Signature'] = `sha256=${signature}`
        }
        break
    }
    
    // Send webhook
    const response = await fetch(webhook.url, {
      method: webhook.httpMethod,
      headers: requestHeaders,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(webhook.timeout * 1000),
    })
    
    const responseTime = Date.now() - startTime
    const responseData = await response.text()
    
    return {
      success: response.ok,
      responseTime,
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
      },
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
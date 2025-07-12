import { z } from 'zod'

// Enums for integration-related fields
export const IntegrationTypeSchema = z.enum([
  'WEBHOOK',
  'API',
  'OAUTH2',
  'DATABASE',
  'FILE_SYNC',
  'EMAIL_PROVIDER',
  'SMS_PROVIDER',
  'PAYMENT_GATEWAY',
  'ACCOUNTING_SOFTWARE',
  'CRM',
  'CALENDAR',
  'ACCESS_CONTROL',
  'IOT_DEVICE',
  'CUSTOM'
])

export const IntegrationStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ERROR',
  'PENDING_SETUP',
  'RATE_LIMITED',
  'SUSPENDED',
  'DEPRECATED'
])

export const WebhookEventSchema = z.enum([
  'CLIENT_CREATED',
  'CLIENT_UPDATED',
  'CLIENT_DELETED',
  'BOOKING_CREATED',
  'BOOKING_UPDATED',
  'BOOKING_CANCELLED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'INVOICE_GENERATED',
  'INVOICE_PAID',
  'MEMBERSHIP_CREATED',
  'MEMBERSHIP_RENEWED',
  'MEMBERSHIP_CANCELLED',
  'USER_CREATED',
  'USER_UPDATED',
  'VISITOR_CHECKED_IN',
  'VISITOR_CHECKED_OUT',
  'ACCESS_GRANTED',
  'ACCESS_DENIED',
  'SPACE_OCCUPIED',
  'SPACE_VACATED',
  'MAINTENANCE_SCHEDULED',
  'CUSTOM'
])

export const AuthMethodSchema = z.enum([
  'NONE',
  'API_KEY',
  'BEARER_TOKEN',
  'BASIC_AUTH',
  'OAUTH2',
  'JWT',
  'HMAC',
  'CUSTOM'
])

export const DataFormatSchema = z.enum([
  'JSON',
  'XML',
  'CSV',
  'FORM_DATA',
  'QUERY_STRING',
  'CUSTOM'
])

export const SyncDirectionSchema = z.enum([
  'INBOUND',
  'OUTBOUND',
  'BIDIRECTIONAL'
])

export const MigrationStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'PARTIAL',
  'ROLLED_BACK'
])

// API Key schema
export const apiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(200),
  description: z.string().max(1000).optional(),
  
  // Key configuration
  key: z.string().min(32, 'API key must be at least 32 characters').max(256),
  prefix: z.string().max(20).optional(), // e.g., "sk_", "pk_"
  
  // Permissions and scopes
  scopes: z.array(z.string().max(100)).min(1, 'At least one scope is required'),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    delete: z.boolean().default(false),
    admin: z.boolean().default(false),
  }).default({ read: true, write: false, delete: false, admin: false }),
  
  // Rate limiting
  rateLimit: z.object({
    requestsPerMinute: z.number().int().min(1).max(10000).default(100),
    requestsPerHour: z.number().int().min(1).max(100000).default(1000),
    requestsPerDay: z.number().int().min(1).max(1000000).default(10000),
  }).default({}),
  
  // Access restrictions
  allowedIPs: z.array(z.string().ip()).default([]),
  allowedDomains: z.array(z.string().max(200)).default([]),
  
  // Lifecycle
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  
  // Environment
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']).default('DEVELOPMENT'),
  
  metadata: z.record(z.any()).optional(),
})

// Webhook configuration schema
export const webhookConfigSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').max(200),
  description: z.string().max(1000).optional(),
  url: z.string().url('Invalid webhook URL'),
  
  // Event configuration
  events: z.array(WebhookEventSchema).min(1, 'At least one event is required'),
  eventFilters: z.record(z.any()).default({}),
  
  // HTTP configuration
  httpMethod: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.record(z.string()).default({}),
  
  // Authentication
  authMethod: AuthMethodSchema.default('NONE'),
  authConfig: z.object({
    apiKey: z.string().max(500).optional(),
    bearerToken: z.string().max(1000).optional(),
    basicAuth: z.object({
      username: z.string().max(200),
      password: z.string().max(200),
    }).optional(),
    hmacSecret: z.string().max(500).optional(),
    customHeaders: z.record(z.string()).default({}),
  }).default({}),
  
  // Delivery options
  timeout: z.number().int().min(1).max(300).default(30), // seconds
  retryAttempts: z.number().int().min(0).max(10).default(3),
  retryBackoff: z.enum(['FIXED', 'LINEAR', 'EXPONENTIAL']).default('EXPONENTIAL'),
  
  // Content format
  contentType: z.string().max(100).default('application/json'),
  dataFormat: DataFormatSchema.default('JSON'),
  includeMetadata: z.boolean().default(true),
  
  // Filtering and transformation
  payloadTemplate: z.string().max(10000).optional(),
  responseValidation: z.boolean().default(false),
  expectedResponseCodes: z.array(z.number().int().min(100).max(599)).default([200, 201, 202]),
  
  // Status and monitoring
  isActive: z.boolean().default(true),
  lastTriggered: z.date().optional(),
  successCount: z.number().int().min(0).default(0),
  failureCount: z.number().int().min(0).default(0),
  
  metadata: z.record(z.any()).optional(),
})

// External service integration schema
export const externalServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional(),
  type: IntegrationTypeSchema,
  provider: z.string().max(100), // e.g., "stripe", "quickbooks", "salesforce"
  
  // Connection configuration
  connectionConfig: z.object({
    baseUrl: z.string().url().optional(),
    apiVersion: z.string().max(20).optional(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
    region: z.string().max(50).optional(),
  }).default({}),
  
  // Authentication
  authMethod: AuthMethodSchema,
  authConfig: z.object({
    apiKey: z.string().max(500).optional(),
    clientId: z.string().max(200).optional(),
    clientSecret: z.string().max(500).optional(),
    accessToken: z.string().max(1000).optional(),
    refreshToken: z.string().max(1000).optional(),
    tokenExpiresAt: z.date().optional(),
    additionalParams: z.record(z.string()).default({}),
  }).default({}),
  
  // Data synchronization
  syncConfig: z.object({
    direction: SyncDirectionSchema.default('OUTBOUND'),
    frequency: z.enum(['REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MANUAL']).default('MANUAL'),
    batchSize: z.number().int().min(1).max(1000).default(100),
    fieldMapping: z.record(z.string()).default({}),
    filters: z.record(z.any()).default({}),
    lastSyncAt: z.date().optional(),
  }).optional(),
  
  // Rate limiting and quotas
  rateLimits: z.object({
    requestsPerSecond: z.number().int().min(1).optional(),
    requestsPerMinute: z.number().int().min(1).optional(),
    requestsPerHour: z.number().int().min(1).optional(),
    requestsPerDay: z.number().int().min(1).optional(),
    concurrentRequests: z.number().int().min(1).default(5),
  }).default({}),
  
  // Health monitoring
  healthCheck: z.object({
    enabled: z.boolean().default(true),
    url: z.string().url().optional(),
    interval: z.number().int().min(60).default(300), // seconds
    timeout: z.number().int().min(5).max(60).default(10),
    expectedStatus: z.number().int().min(100).max(599).default(200),
  }).default({}),
  
  // Status and metrics
  status: IntegrationStatusSchema.default('PENDING_SETUP'),
  lastConnectionTest: z.date().optional(),
  lastError: z.string().max(1000).optional(),
  totalRequests: z.number().int().min(0).default(0),
  successfulRequests: z.number().int().min(0).default(0),
  failedRequests: z.number().int().min(0).default(0),
  
  metadata: z.record(z.any()).optional(),
})

// Data migration schema
export const dataMigrationSchema = z.object({
  name: z.string().min(1, 'Migration name is required').max(200),
  description: z.string().max(1000).optional(),
  version: z.string().max(20).default('1.0.0'),
  
  // Source configuration
  source: z.object({
    type: z.enum(['DATABASE', 'FILE', 'API', 'CUSTOM']),
    config: z.object({
      // Database source
      connectionString: z.string().max(1000).optional(),
      database: z.string().max(100).optional(),
      schema: z.string().max(100).optional(),
      table: z.string().max(100).optional(),
      query: z.string().max(10000).optional(),
      
      // File source
      filePath: z.string().max(500).optional(),
      fileFormat: z.enum(['CSV', 'JSON', 'XML', 'EXCEL']).optional(),
      delimiter: z.string().max(5).optional(),
      encoding: z.string().max(20).default('utf-8'),
      
      // API source
      apiUrl: z.string().url().optional(),
      authConfig: z.record(z.any()).default({}),
      headers: z.record(z.string()).default({}),
      
      // Custom source
      customConfig: z.record(z.any()).default({}),
    }),
  }),
  
  // Target configuration
  target: z.object({
    entity: z.string().max(100), // e.g., "clients", "bookings", "users"
    operation: z.enum(['INSERT', 'UPDATE', 'UPSERT', 'DELETE']).default('INSERT'),
    batchSize: z.number().int().min(1).max(1000).default(100),
    validateData: z.boolean().default(true),
    skipErrors: z.boolean().default(false),
  }),
  
  // Field mapping
  fieldMapping: z.array(z.object({
    sourceField: z.string().max(100),
    targetField: z.string().max(100),
    dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'JSON']).default('STRING'),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    transformation: z.string().max(1000).optional(), // JavaScript transformation function
  })).min(1, 'At least one field mapping is required'),
  
  // Validation rules
  validationRules: z.array(z.object({
    field: z.string().max(100),
    rule: z.enum(['REQUIRED', 'UNIQUE', 'FORMAT', 'RANGE', 'CUSTOM']),
    params: z.record(z.any()).default({}),
    errorMessage: z.string().max(500).optional(),
  })).default([]),
  
  // Dependencies
  dependencies: z.array(z.string().uuid()).default([]), // Other migrations that must run first
  
  // Rollback configuration
  rollbackConfig: z.object({
    enabled: z.boolean().default(true),
    strategy: z.enum(['DELETE', 'RESTORE', 'CUSTOM']).default('DELETE'),
    backupData: z.boolean().default(true),
  }).default({}),
  
  // Execution options
  options: z.object({
    dryRun: z.boolean().default(false),
    continueOnError: z.boolean().default(false),
    logLevel: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']).default('INFO'),
    parallel: z.boolean().default(false),
    maxConcurrency: z.number().int().min(1).max(10).default(1),
  }).default({}),
  
  // Progress tracking
  status: MigrationStatusSchema.default('PENDING'),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  totalRecords: z.number().int().min(0).default(0),
  processedRecords: z.number().int().min(0).default(0),
  successfulRecords: z.number().int().min(0).default(0),
  failedRecords: z.number().int().min(0).default(0),
  errorLog: z.array(z.string()).default([]),
  
  metadata: z.record(z.any()).optional(),
})

// Import/Export configuration schema
export const importExportConfigSchema = z.object({
  name: z.string().min(1, 'Configuration name is required').max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['IMPORT', 'EXPORT']),
  
  // Entity configuration
  entity: z.string().max(100), // e.g., "clients", "bookings"
  format: z.enum(['CSV', 'EXCEL', 'JSON', 'XML']),
  
  // Field configuration
  fields: z.array(z.object({
    name: z.string().max(100),
    label: z.string().max(200),
    dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'EMAIL', 'PHONE', 'URL']),
    required: z.boolean().default(false),
    exportOnly: z.boolean().default(false),
    importOnly: z.boolean().default(false),
    defaultValue: z.any().optional(),
    validation: z.object({
      pattern: z.string().max(500).optional(),
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().min(1).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      options: z.array(z.string()).optional(),
    }).optional(),
    transformation: z.string().max(1000).optional(),
  })).min(1, 'At least one field is required'),
  
  // Import options
  importOptions: z.object({
    skipHeaders: z.boolean().default(true),
    delimiter: z.string().max(5).default(','),
    encoding: z.string().max(20).default('utf-8'),
    batchSize: z.number().int().min(1).max(1000).default(100),
    updateExisting: z.boolean().default(false),
    skipDuplicates: z.boolean().default(true),
    validateData: z.boolean().default(true),
  }).optional(),
  
  // Export options
  exportOptions: z.object({
    includeHeaders: z.boolean().default(true),
    delimiter: z.string().max(5).default(','),
    encoding: z.string().max(20).default('utf-8'),
    dateFormat: z.string().max(50).default('YYYY-MM-DD'),
    filters: z.record(z.any()).default({}),
    sortBy: z.string().max(100).optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
    limit: z.number().int().min(1).optional(),
  }).optional(),
  
  // Template configuration
  template: z.object({
    fileName: z.string().max(200).optional(),
    sheetName: z.string().max(100).optional(), // For Excel
    includeExample: z.boolean().default(true),
    customHeaders: z.record(z.string()).default({}),
  }).optional(),
  
  metadata: z.record(z.any()).optional(),
})

// Integration monitoring schema
export const integrationMonitoringSchema = z.object({
  integrationId: z.string().uuid('Invalid integration ID'),
  
  // Monitoring configuration
  alerting: z.object({
    enabled: z.boolean().default(true),
    channels: z.array(z.enum(['EMAIL', 'SMS', 'WEBHOOK', 'SLACK'])).default(['EMAIL']),
    thresholds: z.object({
      errorRate: z.number().min(0).max(100).default(10), // percentage
      responseTime: z.number().min(0).default(5000), // milliseconds
      successRate: z.number().min(0).max(100).default(95), // percentage
    }).default({}),
    recipients: z.array(z.string().email()).default([]),
  }).default({}),
  
  // Metrics collection
  metrics: z.object({
    enabled: z.boolean().default(true),
    retentionDays: z.number().int().min(1).max(365).default(30),
    detailedLogging: z.boolean().default(false),
    collectResponseTimes: z.boolean().default(true),
    collectPayloads: z.boolean().default(false),
  }).default({}),
  
  // Health checks
  healthCheck: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().int().min(60).default(300), // seconds
    timeout: z.number().int().min(5).max(60).default(10),
    consecutiveFailures: z.number().int().min(1).default(3),
    notifyOnRecover: z.boolean().default(true),
  }).default({}),
  
  metadata: z.record(z.any()).optional(),
})

// Create schemas
export const createApiKeySchema = apiKeySchema
export const createWebhookSchema = webhookConfigSchema
export const createExternalServiceSchema = externalServiceSchema
export const createDataMigrationSchema = dataMigrationSchema
export const createImportExportConfigSchema = importExportConfigSchema
export const createIntegrationMonitoringSchema = integrationMonitoringSchema

// Update schemas
export const updateApiKeySchema = z.object({
  id: z.string().uuid('Invalid API key ID'),
}).merge(apiKeySchema.partial())

export const updateWebhookSchema = z.object({
  id: z.string().uuid('Invalid webhook ID'),
}).merge(webhookConfigSchema.partial())

export const updateExternalServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
}).merge(externalServiceSchema.partial())

export const updateDataMigrationSchema = z.object({
  id: z.string().uuid('Invalid migration ID'),
}).merge(dataMigrationSchema.partial())

export const updateImportExportConfigSchema = z.object({
  id: z.string().uuid('Invalid config ID'),
}).merge(importExportConfigSchema.partial())

// Delete schemas
export const deleteApiKeySchema = z.object({
  id: z.string().uuid('Invalid API key ID'),
})

export const deleteWebhookSchema = z.object({
  id: z.string().uuid('Invalid webhook ID'),
})

export const deleteExternalServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
})

export const deleteDataMigrationSchema = z.object({
  id: z.string().uuid('Invalid migration ID'),
})

export const deleteImportExportConfigSchema = z.object({
  id: z.string().uuid('Invalid config ID'),
})

// Get schemas
export const getApiKeySchema = z.object({
  id: z.string().uuid('Invalid API key ID'),
  includeUsageStats: z.boolean().default(false),
})

export const getWebhookSchema = z.object({
  id: z.string().uuid('Invalid webhook ID'),
  includeDeliveries: z.boolean().default(false),
})

export const getExternalServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
  includeMetrics: z.boolean().default(false),
})

export const getDataMigrationSchema = z.object({
  id: z.string().uuid('Invalid migration ID'),
  includeProgress: z.boolean().default(true),
})

export const getImportExportConfigSchema = z.object({
  id: z.string().uuid('Invalid config ID'),
})

// List schemas
export const listApiKeysSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastUsedAt', 'expiresAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listWebhooksSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  events: z.array(WebhookEventSchema).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastTriggered']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listExternalServicesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  type: IntegrationTypeSchema.optional(),
  status: IntegrationStatusSchema.optional(),
  provider: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'type', 'status', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listDataMigrationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  status: MigrationStatusSchema.optional(),
  sortBy: z.enum(['name', 'status', 'createdAt', 'startedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Operation schemas
export const executeDataMigrationSchema = z.object({
  id: z.string().uuid('Invalid migration ID'),
  dryRun: z.boolean().default(false),
  continueOnError: z.boolean().default(false),
})

export const rollbackDataMigrationSchema = z.object({
  id: z.string().uuid('Invalid migration ID'),
  reason: z.string().max(500).optional(),
})

export const testWebhookSchema = z.object({
  id: z.string().uuid('Invalid webhook ID'),
  event: WebhookEventSchema,
  testData: z.record(z.any()).default({}),
})

export const testExternalServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
  testType: z.enum(['CONNECTION', 'AUTHENTICATION', 'API_CALL']).default('CONNECTION'),
})

export const rotateApiKeySchema = z.object({
  id: z.string().uuid('Invalid API key ID'),
  newKey: z.string().min(32).max(256).optional(), // If not provided, will be generated
})

export const importDataSchema = z.object({
  configId: z.string().uuid('Invalid config ID'),
  file: z.string().max(10000000), // Base64 encoded file content
  fileName: z.string().max(200),
  options: z.object({
    dryRun: z.boolean().default(false),
    skipErrors: z.boolean().default(false),
    updateExisting: z.boolean().default(false),
  }).default({}),
})

export const exportDataSchema = z.object({
  configId: z.string().uuid('Invalid config ID'),
  filters: z.record(z.any()).default({}),
  format: z.enum(['CSV', 'EXCEL', 'JSON', 'XML']).optional(),
  options: z.object({
    limit: z.number().int().min(1).optional(),
    includeHeaders: z.boolean().default(true),
  }).default({}),
})

// Type exports
export type IntegrationType = z.infer<typeof IntegrationTypeSchema>
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>
export type WebhookEvent = z.infer<typeof WebhookEventSchema>
export type AuthMethod = z.infer<typeof AuthMethodSchema>
export type DataFormat = z.infer<typeof DataFormatSchema>
export type SyncDirection = z.infer<typeof SyncDirectionSchema>
export type MigrationStatus = z.infer<typeof MigrationStatusSchema>

export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>
export type CreateWebhookRequest = z.infer<typeof createWebhookSchema>
export type CreateExternalServiceRequest = z.infer<typeof createExternalServiceSchema>
export type CreateDataMigrationRequest = z.infer<typeof createDataMigrationSchema>
export type CreateImportExportConfigRequest = z.infer<typeof createImportExportConfigSchema>
export type CreateIntegrationMonitoringRequest = z.infer<typeof createIntegrationMonitoringSchema>

export type UpdateApiKeyRequest = z.infer<typeof updateApiKeySchema>
export type UpdateWebhookRequest = z.infer<typeof updateWebhookSchema>
export type UpdateExternalServiceRequest = z.infer<typeof updateExternalServiceSchema>
export type UpdateDataMigrationRequest = z.infer<typeof updateDataMigrationSchema>
export type UpdateImportExportConfigRequest = z.infer<typeof updateImportExportConfigSchema>

export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeySchema>
export type DeleteWebhookRequest = z.infer<typeof deleteWebhookSchema>
export type DeleteExternalServiceRequest = z.infer<typeof deleteExternalServiceSchema>
export type DeleteDataMigrationRequest = z.infer<typeof deleteDataMigrationSchema>
export type DeleteImportExportConfigRequest = z.infer<typeof deleteImportExportConfigSchema>

export type GetApiKeyRequest = z.infer<typeof getApiKeySchema>
export type GetWebhookRequest = z.infer<typeof getWebhookSchema>
export type GetExternalServiceRequest = z.infer<typeof getExternalServiceSchema>
export type GetDataMigrationRequest = z.infer<typeof getDataMigrationSchema>
export type GetImportExportConfigRequest = z.infer<typeof getImportExportConfigSchema>

export type ListApiKeysRequest = z.infer<typeof listApiKeysSchema>
export type ListWebhooksRequest = z.infer<typeof listWebhooksSchema>
export type ListExternalServicesRequest = z.infer<typeof listExternalServicesSchema>
export type ListDataMigrationsRequest = z.infer<typeof listDataMigrationsSchema>

export type ExecuteDataMigrationRequest = z.infer<typeof executeDataMigrationSchema>
export type RollbackDataMigrationRequest = z.infer<typeof rollbackDataMigrationSchema>
export type TestWebhookRequest = z.infer<typeof testWebhookSchema>
export type TestExternalServiceRequest = z.infer<typeof testExternalServiceSchema>
export type RotateApiKeyRequest = z.infer<typeof rotateApiKeySchema>
export type ImportDataRequest = z.infer<typeof importDataSchema>
export type ExportDataRequest = z.infer<typeof exportDataSchema>
import { z } from 'zod'

// Enums for access control fields
export const AccessTypeSchema = z.enum([
  'ENTRY',
  'EXIT',
  'DENIED',
  'TAILGATE',
  'EMERGENCY',
  'FORCED',
  'TIMEOUT'
])

export const AccessMethodSchema = z.enum([
  'CARD',
  'PIN',
  'BIOMETRIC',
  'MOBILE_APP',
  'QR_CODE',
  'FACIAL_RECOGNITION',
  'MANUAL',
  'TEMPORARY_CODE'
])

export const AccessPointTypeSchema = z.enum([
  'MAIN_ENTRANCE',
  'SIDE_ENTRANCE',
  'EMERGENCY_EXIT',
  'PARKING_GATE',
  'ELEVATOR',
  'FLOOR_ACCESS',
  'ROOM_DOOR',
  'TURNSTILE',
  'BARRIER'
])

export const AccessPointStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'MAINTENANCE',
  'EMERGENCY_OPEN',
  'LOCKED_DOWN',
  'FAULT'
])

export const DoorStatusSchema = z.enum([
  'OPEN',
  'CLOSED',
  'LOCKED',
  'UNLOCKED',
  'FORCED_OPEN',
  'HELD_OPEN',
  'FAULT'
])

export const AlertTypeSchema = z.enum([
  'UNAUTHORIZED_ACCESS',
  'FORCED_ENTRY',
  'DOOR_HELD_OPEN',
  'INVALID_CREDENTIAL',
  'EXPIRED_CREDENTIAL',
  'BLACKLISTED_USER',
  'TAILGATING',
  'EMERGENCY_ACTIVATED',
  'SYSTEM_FAULT'
])

export const AlertSeveritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
])

// Access point configuration schema
export const AccessPointConfigSchema = z.object({
  schedules: z.array(z.object({
    name: z.string().max(100),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    allowedUserTypes: z.array(z.string()).optional(),
    requiresMultiFactor: z.boolean().default(false),
  })).default([]),
  antiPassback: z.object({
    enabled: z.boolean().default(false),
    softAntiPassback: z.boolean().default(true), // Log violation but allow access
    resetTime: z.number().int().min(0).default(30), // minutes
  }).optional(),
  occupancyLimit: z.object({
    enabled: z.boolean().default(false),
    maxOccupancy: z.number().int().min(1),
    currentOccupancy: z.number().int().min(0).default(0),
  }).optional(),
  doorHeldOpenTime: z.number().int().min(0).default(30), // seconds
  unlockDuration: z.number().int().min(1).default(5), // seconds
  requiresEscort: z.boolean().default(false),
  allowedMethods: z.array(AccessMethodSchema).default(['CARD', 'PIN']),
})

// Base access log schema
export const baseAccessLogSchema = z.object({
  type: AccessTypeSchema,
  method: AccessMethodSchema,
  accessPointId: z.string().uuid('Invalid access point ID'),
  userId: z.string().uuid('Invalid user ID').optional(),
  visitorId: z.string().uuid('Invalid visitor ID').optional(),
  credentialUsed: z.string().max(200).optional(),
  
  // Location and device info
  location: z.object({
    building: z.string().max(100).optional(),
    floor: z.string().max(50).optional(),
    zone: z.string().max(100).optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
  deviceInfo: z.object({
    deviceId: z.string().max(100),
    deviceType: z.string().max(50),
    firmwareVersion: z.string().max(50).optional(),
    ipAddress: z.string().max(45).optional(),
  }).optional(),
  
  // Access details
  granted: z.boolean(),
  denialReason: z.string().max(200).optional(),
  tailgateDetected: z.boolean().default(false),
  forcedEntry: z.boolean().default(false),
  emergencyOverride: z.boolean().default(false),
  
  // Additional info
  temperature: z.number().optional(), // For thermal scanning
  photoUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
})

// Base access point schema
export const baseAccessPointSchema = z.object({
  name: z.string().min(1, 'Access point name is required').max(100),
  description: z.string().max(500).optional(),
  type: AccessPointTypeSchema,
  status: AccessPointStatusSchema.default('ACTIVE'),
  
  // Location
  location: z.object({
    building: z.string().max(100),
    floor: z.string().max(50).optional(),
    zone: z.string().max(100).optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  
  // Hardware info
  hardware: z.object({
    manufacturer: z.string().max(100),
    model: z.string().max(100),
    serialNumber: z.string().max(100),
    macAddress: z.string().max(17).optional(),
    ipAddress: z.string().max(45).optional(),
    firmwareVersion: z.string().max(50).optional(),
    installDate: z.date().optional(),
  }).optional(),
  
  // Configuration
  config: AccessPointConfigSchema.default({}),
  
  // Current state
  currentState: z.object({
    doorStatus: DoorStatusSchema.default('CLOSED'),
    lastStatusChange: z.date().optional(),
    online: z.boolean().default(true),
    batteryLevel: z.number().min(0).max(100).optional(),
    signalStrength: z.number().min(0).max(100).optional(),
  }).optional(),
  
  // Maintenance
  maintenanceSchedule: z.object({
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    lastMaintenance: z.date().optional(),
    nextMaintenance: z.date().optional(),
  }).optional(),
  
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
})

// Access credential schema
export const baseAccessCredentialSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  visitorId: z.string().uuid('Invalid visitor ID').optional(),
  credentialType: z.enum(['CARD', 'PIN', 'BIOMETRIC', 'MOBILE', 'TEMPORARY']),
  credentialValue: z.string().min(1, 'Credential value is required').max(200),
  
  // Validity
  isActive: z.boolean().default(true),
  validFrom: z.date().default(() => new Date()),
  validUntil: z.date().optional(),
  
  // Access permissions
  allowedAccessPoints: z.array(z.string().uuid()).default([]),
  deniedAccessPoints: z.array(z.string().uuid()).default([]),
  accessSchedule: z.object({
    timezone: z.string().default('UTC'),
    schedules: z.array(z.object({
      name: z.string().max(100),
      daysOfWeek: z.array(z.number().int().min(0).max(6)),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    })),
  }).optional(),
  
  // Additional restrictions
  maxUses: z.number().int().min(1).optional(),
  currentUses: z.number().int().min(0).default(0),
  requiresPIN: z.boolean().default(false),
  requiresEscort: z.boolean().default(false),
  
  // Metadata
  issuedBy: z.string().uuid().optional(),
  issuedAt: z.date().default(() => new Date()),
  lastUsedAt: z.date().optional(),
  notes: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
})

// Create schemas
export const createAccessLogSchema = baseAccessLogSchema.extend({
  timestamp: z.date().default(() => new Date()),
})

export const createAccessPointSchema = baseAccessPointSchema

export const createAccessCredentialSchema = baseAccessCredentialSchema

// Update schemas
export const updateAccessPointSchema = z.object({
  id: z.string().uuid('Invalid access point ID'),
}).merge(baseAccessPointSchema.partial())

export const updateAccessCredentialSchema = z.object({
  id: z.string().uuid('Invalid credential ID'),
}).merge(baseAccessCredentialSchema.partial())

// Delete schemas
export const deleteAccessPointSchema = z.object({
  id: z.string().uuid('Invalid access point ID'),
})

export const deleteAccessCredentialSchema = z.object({
  id: z.string().uuid('Invalid credential ID'),
})

// Get schemas
export const getAccessPointSchema = z.object({
  id: z.string().uuid('Invalid access point ID'),
})

export const getAccessCredentialSchema = z.object({
  id: z.string().uuid('Invalid credential ID'),
})

// List schemas
export const listAccessLogsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(50),
  type: AccessTypeSchema.optional(),
  method: AccessMethodSchema.optional(),
  accessPointId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  visitorId: z.string().uuid().optional(),
  granted: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sortBy: z.enum(['timestamp', 'type', 'method', 'accessPoint', 'user']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const listAccessPointsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(100).optional(),
  type: AccessPointTypeSchema.optional(),
  status: AccessPointStatusSchema.optional(),
  building: z.string().max(100).optional(),
  floor: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'type', 'status', 'location', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const listAccessCredentialsSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  userId: z.string().uuid().optional(),
  visitorId: z.string().uuid().optional(),
  credentialType: z.enum(['CARD', 'PIN', 'BIOMETRIC', 'MOBILE', 'TEMPORARY']).optional(),
  isActive: z.boolean().optional(),
  isExpired: z.boolean().optional(),
  sortBy: z.enum(['credentialType', 'validFrom', 'validUntil', 'lastUsedAt', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Control schemas
export const controlAccessPointSchema = z.object({
  id: z.string().uuid('Invalid access point ID'),
  action: z.enum(['LOCK', 'UNLOCK', 'EMERGENCY_OPEN', 'RESET', 'RESTART']),
  duration: z.number().int().min(0).optional(), // seconds, 0 = permanent
  reason: z.string().max(200).optional(),
})

export const grantAccessSchema = z.object({
  accessPointId: z.string().uuid('Invalid access point ID'),
  userId: z.string().uuid().optional(),
  visitorId: z.string().uuid().optional(),
  duration: z.number().int().min(1).default(5), // seconds
  reason: z.string().max(200).optional(),
  override: z.boolean().default(false),
})

// Alert schemas
export const createAccessAlertSchema = z.object({
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  accessPointId: z.string().uuid('Invalid access point ID'),
  accessLogId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  visitorId: z.string().uuid().optional(),
  message: z.string().min(1, 'Alert message is required').max(500),
  details: z.record(z.any()).optional(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().uuid().optional(),
  acknowledgedAt: z.date().optional(),
  resolved: z.boolean().default(false),
  resolvedBy: z.string().uuid().optional(),
  resolvedAt: z.date().optional(),
  resolutionNotes: z.string().max(1000).optional(),
})

// Analytics schemas
export const getAccessAnalyticsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month', 'accessPoint', 'user', 'method', 'type']).default('day'),
  accessPointIds: z.array(z.string().uuid()).optional(),
  includeVisitors: z.boolean().default(true),
})

export const getOccupancySchema = z.object({
  building: z.string().max(100).optional(),
  floor: z.string().max(50).optional(),
  zone: z.string().max(100).optional(),
  realTime: z.boolean().default(true),
  historicalDate: z.date().optional(),
})

// Type exports
export type AccessType = z.infer<typeof AccessTypeSchema>
export type AccessMethod = z.infer<typeof AccessMethodSchema>
export type AccessPointType = z.infer<typeof AccessPointTypeSchema>
export type AccessPointStatus = z.infer<typeof AccessPointStatusSchema>
export type DoorStatus = z.infer<typeof DoorStatusSchema>
export type AlertType = z.infer<typeof AlertTypeSchema>
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>
export type AccessPointConfig = z.infer<typeof AccessPointConfigSchema>

export type CreateAccessLogRequest = z.infer<typeof createAccessLogSchema>
export type CreateAccessPointRequest = z.infer<typeof createAccessPointSchema>
export type CreateAccessCredentialRequest = z.infer<typeof createAccessCredentialSchema>
export type UpdateAccessPointRequest = z.infer<typeof updateAccessPointSchema>
export type UpdateAccessCredentialRequest = z.infer<typeof updateAccessCredentialSchema>
export type DeleteAccessPointRequest = z.infer<typeof deleteAccessPointSchema>
export type DeleteAccessCredentialRequest = z.infer<typeof deleteAccessCredentialSchema>
export type GetAccessPointRequest = z.infer<typeof getAccessPointSchema>
export type GetAccessCredentialRequest = z.infer<typeof getAccessCredentialSchema>
export type ListAccessLogsRequest = z.infer<typeof listAccessLogsSchema>
export type ListAccessPointsRequest = z.infer<typeof listAccessPointsSchema>
export type ListAccessCredentialsRequest = z.infer<typeof listAccessCredentialsSchema>
export type ControlAccessPointRequest = z.infer<typeof controlAccessPointSchema>
export type GrantAccessRequest = z.infer<typeof grantAccessSchema>
export type CreateAccessAlertRequest = z.infer<typeof createAccessAlertSchema>
export type GetAccessAnalyticsRequest = z.infer<typeof getAccessAnalyticsSchema>
export type GetOccupancyRequest = z.infer<typeof getOccupancySchema>
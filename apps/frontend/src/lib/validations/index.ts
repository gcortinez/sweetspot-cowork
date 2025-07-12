/**
 * Validation schemas for Server Actions
 * Exported for use throughout the frontend application
 */

// Common validations
export * from './common'

// Authentication validations
export * from './auth'

// Tenant and workspace validations
export * from './tenant'

// Client and company validations
export * from './client'

// Space management validations
export * from './space'

// Service management validations
export * from './service'

// Resource management validations
export * from './resource'

// Booking management validations
export * from './booking'

// Visitor management validations
export * from './visitor'

// Access control validations
export * from './access-control'

// Membership management validations
export * from './membership'

// Contract management validations
export * from './contract'

// Financial management validations
export * from './invoice'
export * from './payment'
export * from './financial-report'

// Notification management validations
export * from './notification'

// Re-export for convenience
export { z } from 'zod'
// Shared enums for the application
// These match the database constraints and Prisma schema

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  COWORK_ADMIN = "COWORK_ADMIN",
  COWORK_USER = "COWORK_USER"
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  SUSPENDED = "SUSPENDED"
}

export enum TenantStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  INACTIVE = "INACTIVE"
}

export enum ClientStatus {
  LEAD = "LEAD",
  PROSPECT = "PROSPECT", 
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CHURNED = "CHURNED"
}
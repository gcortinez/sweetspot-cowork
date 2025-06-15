import { Request } from "express";

// Base API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  timestamp: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  version: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Base request interface with common middleware properties
export interface BaseRequest extends Request {
  requestId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    clientId?: string;
    firstName?: string;
    lastName?: string;
    supabaseId?: string;
  };
  tenant?: {
    id: string;
    name: string;
    domain?: string;
    slug?: string;
  };
}

// Extended Request interface with custom properties
export interface AuthenticatedRequest extends BaseRequest {
  user: NonNullable<BaseRequest['user']>;
  tenant: NonNullable<BaseRequest['tenant']>;
  userId: string; // Convenience property
  tenantId: string; // Convenience property
}

// Pagination Query Parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Common Query Parameters
export interface BaseQuery extends PaginationQuery {
  search?: string;
  filter?: Record<string, any>;
}

// HTTP Status Codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Error Codes
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  
  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Resource errors
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  
  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  CONNECTION_ERROR = "CONNECTION_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INVALID_ROUTE = "INVALID_ROUTE",
  
  // File upload errors
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  UPLOAD_FAILED = "UPLOAD_FAILED",
  
  // Multi-tenant errors
  TENANT_NOT_FOUND = "TENANT_NOT_FOUND",
  INVALID_TENANT = "INVALID_TENANT",
  TENANT_SUSPENDED = "TENANT_SUSPENDED",
}

// Role-based permissions
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  COWORK_ADMIN = "COWORK_ADMIN", 
  CLIENT_ADMIN = "CLIENT_ADMIN",
  END_USER = "END_USER",
  GUEST = "GUEST",
}

// API Versioning
export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  supportedUntil?: string;
}

export const API_VERSIONS = {
  V1: { version: "v1", deprecated: false },
} as const;
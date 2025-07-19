import { UserRole } from "./database";

// Extend Clerk user with our custom metadata
export interface ClerkUserMetadata {
  role: UserRole;
  tenantId?: string | null;
  clientId?: string;
  firstName?: string;
  lastName?: string;
  isOnboarded?: boolean;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    timezone?: string;
  };
}

// Our custom user interface that integrates with Clerk
export interface AuthUser {
  id: string; // Clerk user ID
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  tenantId?: string | null;
  clientId?: string;
  isOnboarded?: boolean;
  clerkUser?: any; // Original Clerk user object
  metadata?: ClerkUserMetadata;
}

// Organization/Tenant mapping for Clerk
export interface ClerkTenant {
  id: string;
  name: string;
  slug: string;
  role: string; // Clerk organization role
  permissions: string[];
}

// Role hierarchy mapping (same as before)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  END_USER: 1,
  CLIENT_ADMIN: 2,
  COWORK_USER: 3,
  COWORK_ADMIN: 4,
  SUPER_ADMIN: 5,
};

// Helper functions for role checking
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Default redirect paths by role
export function getDefaultRedirectForRole(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard";
    case "COWORK_ADMIN":
      return "/dashboard";
    case "COWORK_USER":
      return "/dashboard";
    case "CLIENT_ADMIN":
      return "/dashboard";
    case "END_USER":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
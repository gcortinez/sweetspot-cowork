// Temporary compatibility layer for Clerk migration
// This file re-exports the new Clerk auth context to maintain compatibility

export { 
  useAuth,
  useRoleAccess, 
  usePermissions,
  ClerkAuthProvider as AuthProvider 
} from './clerk-auth-context';

// Legacy compatibility exports
export type { AuthUser } from '@/types/clerk-auth';
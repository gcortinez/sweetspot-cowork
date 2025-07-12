// Server-side auth functions
import { getCurrentUser } from "@/lib/server/auth";

export { 
  getCurrentUser, 
  requireAuth, 
  requireRole,
  AuthService,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
  type SessionInfo,
  type LoginResult
} from "@/lib/server/auth";

/**
 * Get tenant context for server actions
 */
export async function getTenantContext(): Promise<{
  tenantId: string | null;
  user: AuthUser | null;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { tenantId: null, user: null };
    }
    
    return {
      tenantId: user.tenantId,
      user: user,
    };
  } catch (error) {
    console.error('Get tenant context error:', error);
    return { tenantId: null, user: null };
  }
}

// Auth Context and Provider (client-side)
export { AuthProvider, useAuth } from "@/contexts/auth-context";

// Auth Store
export { useAuthStore } from "@/stores/auth-store";

// Auth Guards
export {
  AuthGuard,
  RequireAuth,
  RequireRole,
  RequireMinRole,
  RequireAnyRole,
  GuestOnly,
  RequireAdmin,
  RequireSuperAdmin,
} from "@/components/auth/auth-guard";

// Higher-Order Components
export {
  withAuth,
  withRequireAuth,
  withRequireRole,
  withRequireMinRole,
  withRequireAnyRole,
  withGuestOnly,
  withRequireAdmin,
  withRequireSuperAdmin,
} from "@/components/auth/with-auth";

// Auth Hooks
export {
  useAuthGuard,
  useRequireAuth as useRequireAuthGuard,
  useRequireRole,
  useRequireMinRole,
  useRequireAnyRole,
  useGuestOnly,
  useRequireAdmin,
  useRequireSuperAdmin,
  useRoleAccess,
  usePermissions,
} from "@/hooks/use-auth-guard";

// Auth Forms
export { LoginForm } from "@/components/auth/login-form";
export { RegisterForm } from "@/components/auth/register-form";
export { PasswordResetForm } from "@/components/auth/password-reset-form";
export { AuthLayout } from "@/components/auth/auth-layout";

// Auth API
export { authAPI } from "@/lib/auth-api";

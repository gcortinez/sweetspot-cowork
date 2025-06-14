// Auth Context and Provider
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

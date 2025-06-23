"use client";

// Re-export the main auth hook from context for convenience
export {
  useAuth,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useUserRole,
  useRequireAuth,
} from "@/contexts/auth-context";

// Re-export auth guard hooks
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
} from "./use-auth-guard";

// Re-export store selectors for direct access
export {
  useAuthStore,
  useAuthUser as useAuthUserStore,
  useIsAuthenticated as useIsAuthenticatedStore,
  useAuthLoading as useAuthLoadingStore,
  useAuthError,
  useAuthTokens,
  useAccessToken,
  useRefreshToken,
  useUserRole as useUserRoleStore,
  useCanAccess,
  useHasRole,
  useHasAnyRole,
} from "@/stores/auth-store";

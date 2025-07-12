import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/types/database";

export interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // User data
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  // Error state
  error: string | null;

  // Actions
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;

  // Role helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isRole: (role: UserRole) => boolean;
  getRoleLevel: () => number;
  canAccess: (requiredRole: UserRole) => boolean;
}

// Role hierarchy levels for comparison
const ROLE_LEVELS: Record<UserRole, number> = {
  END_USER: 1,
  CLIENT_ADMIN: 2,
  COWORK_ADMIN: 3,
  SUPER_ADMIN: 4,
};

export const useAuthStore = create<AuthState>()(
  // Remove persist to avoid conflicts with session manager
  // Session manager handles all persistence
  (set, get) => ({
    // Initial state
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    error: null,

    // Actions
    setAuth: (user, accessToken, refreshToken) => {
      set({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        error: null,
        isLoading: false,
      });
    },

    clearAuth: () => {
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        error: null,
        isLoading: false,
      });
    },

    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    setError: (error) => {
      set({ error });
    },

    setInitialized: (initialized) => {
      set({ isInitialized: initialized });
    },

    updateUser: (userData) => {
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: { ...currentUser, ...userData },
        });
      }
    },

    updateTokens: (accessToken, refreshToken) => {
      set({
        accessToken,
        ...(refreshToken && { refreshToken }),
      });
    },

    // Role helper methods
    hasRole: (role) => {
      const user = get().user;
      return user?.role === role;
    },

    hasAnyRole: (roles) => {
      const user = get().user;
      return user ? roles.includes(user.role) : false;
    },

    isRole: (role) => {
      const user = get().user;
      return user?.role === role;
    },

    getRoleLevel: () => {
      const user = get().user;
      return user ? ROLE_LEVELS[user.role] : 0;
    },

    canAccess: (requiredRole) => {
      const user = get().user;
      if (!user) return false;

      const userLevel = ROLE_LEVELS[user.role];
      const requiredLevel = ROLE_LEVELS[requiredRole];

      return userLevel >= requiredLevel;
    },
  })
);

// Selector hooks for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
// Separate token selectors to avoid object recreation
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);

// Keep the combined selector but with proper memoization
export const useAuthTokens = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  
  return React.useMemo(() => ({
    accessToken,
    refreshToken,
  }), [accessToken, refreshToken]);
};

// Role-based selectors
export const useUserRole = () => useAuthStore((state) => state.user?.role);
export const useCanAccess = (requiredRole: UserRole) =>
  useAuthStore((state) => state.canAccess(requiredRole));
export const useHasRole = (role: UserRole) =>
  useAuthStore((state) => state.hasRole(role));
export const useHasAnyRole = (roles: UserRole[]) =>
  useAuthStore((state) => state.hasAnyRole(roles));

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/auth-api";
import { sessionManager, type SessionData } from "@/lib/session-manager";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LoginRequest,
  RegisterRequest,
  AuthUser,
  UserRole,
} from "@/types/database";

interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: AuthUser | null;
  error: string | null;

  // Authentication methods
  login: (
    credentials: LoginRequest
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterRequest
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;

  // Session management
  checkSession: () => Promise<boolean>;
  clearError: () => void;

  // Role helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
  getRoleLevel: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    accessToken,
    refreshToken,
    error,
    setAuth,
    clearAuth,
    setLoading,
    setError,
    setInitialized,
    updateTokens,
    hasRole,
    hasAnyRole,
    canAccess,
    getRoleLevel,
  } = useAuthStore();

  // Initialize auth state on app load
  useEffect(() => {
    if (isInitialized) return;

    const initializeAuth = async () => {
      console.log('🔑 Initializing auth context...');
      setLoading(true);

      try {
        console.log('🔍 Checking for existing session...');
        // Initialize session using session manager
        const session = await sessionManager.initializeSession();

        if (session) {
          console.log('✅ Session restored:', { userId: session.user.id, email: session.user.email });
          // Session restored successfully
          setAuth(session.user, session.accessToken, session.refreshToken);
        } else {
          console.log('❌ No valid session found, clearing auth');
          // No valid session found
          clearAuth();
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
        console.log('🏁 Auth initialization complete');
      }
    };

    initializeAuth();
  }, []); // Empty dependency array to run only once

  // Set up session manager event listeners separately
  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuth();
      router.push("/auth/login");
    };

    const handleSessionRefreshed = (sessionData: SessionData) => {
      setAuth(
        sessionData.user,
        sessionData.accessToken,
        sessionData.refreshToken
      );
    };

    const handleSessionCleared = () => {
      clearAuth();
    };

    sessionManager.on("sessionExpired", handleSessionExpired);
    sessionManager.on("sessionRefreshed", handleSessionRefreshed);
    sessionManager.on("sessionCleared", handleSessionCleared);

    // Cleanup event listeners on unmount
    return () => {
      sessionManager.off("sessionExpired");
      sessionManager.off("sessionRefreshed");
      sessionManager.off("sessionCleared");
    };
  }, []); // Empty dependency array

  // Note: Auto-refresh is now handled by the session manager

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔐 Attempting login with:', { email: credentials.email, hasTenantSlug: !!credentials.tenantSlug });
        const response = await authAPI.login(credentials);
        console.log('📝 Login response:', response);

        if (response.success) {
          // Check if we have multiple tenants to choose from
          if (
            response.tenants &&
            response.tenants.length > 0 &&
            !response.user
          ) {
            // User belongs to multiple tenants - need to handle tenant selection
            // For now, we'll just use the first tenant and login again with it
            // In a real app, you'd show a tenant selection UI
            const firstTenant = response.tenants[0];
            const loginWithTenant = await authAPI.login({
              ...credentials,
              tenantSlug: firstTenant.slug,
            });

            if (
              loginWithTenant.success &&
              loginWithTenant.user &&
              loginWithTenant.accessToken
            ) {
              const sessionData: SessionData = {
                user: loginWithTenant.user,
                accessToken: loginWithTenant.accessToken,
                refreshToken: loginWithTenant.refreshToken,
                expiresAt: Date.now() + 60 * 60 * 1000,
                lastRefresh: Date.now(),
              };

              sessionManager.storeSession(sessionData);
              setAuth(
                loginWithTenant.user,
                loginWithTenant.accessToken,
                loginWithTenant.refreshToken
              );

              // Redirect to the tenant's workspace
              router.push(`/dashboard`);
              return { success: true };
            }
          } else if (response.user && response.accessToken) {
            // Single tenant or tenant was specified - normal login flow
            console.log('👤 User data received:', response.user);
            console.log('🏢 Tenant data:', response.tenant);
            
            const sessionData: SessionData = {
              user: response.user,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              expiresAt: Date.now() + 60 * 60 * 1000,
              lastRefresh: Date.now(),
            };

            sessionManager.storeSession(sessionData);
            setAuth(response.user, response.accessToken, response.refreshToken);


            // Redirect to dashboard
            router.push(`/dashboard`);
            return { success: true };
          }
        }

        const errorMessage = response.error || "Login failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, setError, router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await authAPI.register(data);

        if (response.success && response.user && response.accessToken) {
          // Create session data
          const sessionData: SessionData = {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
            lastRefresh: Date.now(),
          };

          // Store session using session manager
          sessionManager.storeSession(sessionData);

          setAuth(response.user, response.accessToken, response.refreshToken);
          return { success: true };
        } else {
          const errorMessage = response.error || "Registration failed";
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, setError]
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      // Call backend logout if we have a token
      if (accessToken) {
        await authAPI.logout(accessToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local logout even if backend call fails
    } finally {
      // Clear session using session manager
      sessionManager.clearSession();

      // Set flag to prevent redirect on landing page
      localStorage.setItem('recent-logout', 'true');

      clearAuth();
      setLoading(false);
      router.push("/");
    }
  }, [accessToken, clearAuth, setLoading, router]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      return await sessionManager.refreshSession();
    } catch (error) {
      console.error("Token refresh error:", error);
      clearAuth();
      return false;
    }
  }, [clearAuth]);

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (!accessToken) return false;

    try {
      const response = await authAPI.getSession(accessToken);

      if (response.isValid && response.user) {
        // Update user data if needed
        if (JSON.stringify(response.user) !== JSON.stringify(user)) {
          setAuth(response.user, accessToken, refreshToken || undefined);
        }
        return true;
      } else {
        // Session invalid, try refresh
        return await refreshSession();
      }
    } catch (error) {
      console.error("Session check error:", error);
      return await refreshSession();
    }
  }, [accessToken, refreshToken, user, setAuth, refreshSession]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const contextValue: AuthContextType = {
    // State
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    error,

    // Authentication methods
    login,
    register,
    logout,
    refreshSession,

    // Session management
    checkSession,
    clearError,

    // Role helpers
    hasRole,
    hasAnyRole,
    canAccess,
    getRoleLevel,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Additional convenience hooks
export function useAuthUser() {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useAuthLoading() {
  const { isLoading } = useAuth();
  return isLoading;
}

export function useUserRole() {
  const { user } = useAuth();
  return user?.role;
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect once when fully initialized and not authenticated
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.replace("/auth/login"); // Use replace to avoid back button issues
    }
  }, [isAuthenticated, isInitialized]); // Remove isLoading and router from deps

  return { isAuthenticated, isLoading, isInitialized };
}

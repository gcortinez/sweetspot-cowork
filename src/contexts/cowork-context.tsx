"use client";

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { UserCowork } from "@/components/ui/cowork-selector";
import { useAuth } from "@/hooks/use-auth";
import { buildAuthUrl } from "@/lib/api-config";

// API types
interface CoworkContextAPI {
  success: boolean;
  data?: {
    userCoworks: UserCowork[];
    defaultCowork: UserCowork | null;
    isSuperAdmin: boolean;
  };
  error?: string;
}

// Context types
export interface CoworkContextState {
  // Core state
  userCoworks: UserCowork[];
  activeCowork: UserCowork | null;
  isSuperAdmin: boolean;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  fetchUserCoworks: () => Promise<void>;
  changeActiveCowork: (cowork: UserCowork) => Promise<void>;
  refreshContext: () => Promise<void>;
  clearError: () => void;
  
  // Utility methods
  hasMultipleCoworks: boolean;
  canAccessCowork: (coworkId: string) => boolean;
  getCoworkById: (coworkId: string) => UserCowork | null;
  getCurrentCoworkRole: () => string | null;
  
  // Super admin specific helpers
  isSuperAdminWithoutCowork: boolean;
  isSuperAdminWithMultipleCoworks: boolean;
  hasCoworkAccess: boolean;
}

const CoworkContext = createContext<CoworkContextState | null>(null);

// Custom hook to use cowork context
export function useCoworkContext(): CoworkContextState {
  const context = useContext(CoworkContext);
  if (!context) {
    throw new Error("useCoworkContext must be used within a CoworkProvider");
  }
  return context;
}

// Optional context hook that doesn't throw if no provider
export function useCoworkContextOptional(): CoworkContextState | null {
  return useContext(CoworkContext);
}

interface CoworkProviderProps {
  children: ReactNode;
  autoFetch?: boolean;
  persistActiveCowork?: boolean;
}

export function CoworkProvider({ 
  children, 
  autoFetch = true,
  persistActiveCowork = true 
}: CoworkProviderProps) {
  // Core state
  const [userCoworks, setUserCoworks] = useState<UserCowork[]>([]);
  const [activeCowork, setActiveCowork] = useState<UserCowork | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);

  const { user, isLoading: authLoading } = useAuth();

  // Storage keys
  const STORAGE_KEY = 'sweetspot_active_cowork';
  const CACHE_KEY = 'sweetspot_user_coworks';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Utility to get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(activeCowork ? { "x-active-cowork": activeCowork.id } : {}),
    };
  }, [activeCowork]);

  // Load from localStorage on mount
  const loadFromStorage = useCallback(() => {
    if (!persistActiveCowork) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActiveCowork(parsed);
        console.log(`📱 Loaded active cowork from storage: ${parsed.name}`);
      }

      // Load cached coworks if available and not expired
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          setUserCoworks(data.userCoworks || []);
          setIsSuperAdmin(data.isSuperAdmin || false);
          console.log(`📦 Loaded coworks from cache: ${data.userCoworks?.length || 0} items`);
        }
      }
    } catch (err) {
      console.warn("Failed to load from localStorage:", err);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [persistActiveCowork]);

  // Save to localStorage
  const saveToStorage = useCallback((cowork: UserCowork | null) => {
    if (!persistActiveCowork) return;

    try {
      if (cowork) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cowork));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn("Failed to save to localStorage:", err);
    }
  }, [persistActiveCowork]);

  // Cache coworks data
  const cacheCoworks = useCallback((data: CoworkContextAPI['data']) => {
    if (!data) return;

    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.warn("Failed to cache coworks:", err);
    }
  }, []);

  // Fetch user coworks from API
  const fetchUserCoworks = useCallback(async () => {
    if (!user || authLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("No access token found, skipping cowork fetch");
        setIsInitialized(true);
        return;
      }

      console.log(`🔄 Fetching coworks for user: ${user.email}`);

      const response = await fetch(buildAuthUrl("/coworks"), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user coworks: ${response.status} ${response.statusText}`);
      }

      const data: CoworkContextAPI = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch user coworks");
      }

      if (data.data) {
        setUserCoworks(data.data.userCoworks || []);
        setIsSuperAdmin(data.data.isSuperAdmin || false);
        
        // Cache the data
        cacheCoworks(data.data);

        // Handle super admin without any specific cowork assignments
        if (data.data.isSuperAdmin && data.data.userCoworks && data.data.userCoworks.length === 0) {
          console.log("🛡️ Super Admin detected with no specific cowork - enabling global view");
          // Super admin can still operate without a specific cowork
        }

        // Set default cowork if none is active and there's a default
        if (!activeCowork && data.data.defaultCowork) {
          setActiveCowork(data.data.defaultCowork);
          saveToStorage(data.data.defaultCowork);
          console.log(`✅ Set default cowork: ${data.data.defaultCowork.name}`);
        } else if (data.data.userCoworks && data.data.userCoworks.length > 0 && !activeCowork) {
          // If no default but has coworks, set the first one
          const firstCowork = data.data.userCoworks[0];
          setActiveCowork(firstCowork);
          saveToStorage(firstCowork);
          console.log(`✅ Auto-selected first cowork: ${firstCowork.name}`);
        }

        console.log(`✅ Fetched ${data.data.userCoworks?.length || 0} coworks (Super Admin: ${data.data.isSuperAdmin})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching user coworks:", err);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [user, authLoading, getAuthHeaders, activeCowork, saveToStorage, cacheCoworks]);

  // Change active cowork
  const changeActiveCowork = useCallback(async (cowork: UserCowork) => {
    try {
      console.log(`🔄 Changing active cowork to: ${cowork.name}`);
      
      setActiveCowork(cowork);
      saveToStorage(cowork);

      // Notify backend (optional, non-blocking)
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          await fetch(buildAuthUrl("/set-active-cowork"), {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ coworkId: cowork.id }),
          });
        } catch (err) {
          console.warn("Failed to notify backend of cowork change:", err);
        }
      }

      console.log(`✅ Active cowork changed to: ${cowork.name} (${cowork.id})`);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('coworkChanged', { 
        detail: { cowork, isSuperAdmin } 
      }));
      
    } catch (err) {
      console.error("Error changing active cowork:", err);
      setError("Failed to change active cowork");
    }
  }, [saveToStorage, isSuperAdmin]);

  // Refresh context from server
  const refreshContext = useCallback(async () => {
    try {
      setError(null);
      
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("No access token found, cannot refresh context");
        return;
      }

      const response = await fetch(buildAuthUrl("/context"), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh context: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setUserCoworks(data.data.userCoworks || []);
        setIsSuperAdmin(data.data.isSuperAdmin || false);
        
        if (data.data.activeCowork) {
          setActiveCowork(data.data.activeCowork);
          saveToStorage(data.data.activeCowork);
        }

        // Update cache
        cacheCoworks(data.data);
        
        console.log("✅ Context refreshed successfully");
      } else {
        throw new Error(data.error || "Failed to refresh context");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error refreshing context:", err);
    }
  }, [getAuthHeaders, saveToStorage, cacheCoworks]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility methods
  const hasMultipleCoworks = userCoworks.length > 1;

  const canAccessCowork = useCallback((coworkId: string): boolean => {
    if (isSuperAdmin) return true;
    return userCoworks.some(cowork => cowork.id === coworkId);
  }, [userCoworks, isSuperAdmin]);

  const getCoworkById = useCallback((coworkId: string): UserCowork | null => {
    return userCoworks.find(cowork => cowork.id === coworkId) || null;
  }, [userCoworks]);

  const getCurrentCoworkRole = useCallback((): string | null => {
    return activeCowork?.role || null;
  }, [activeCowork]);

  // Super admin specific helpers
  const isSuperAdminWithoutCowork = isSuperAdmin && userCoworks.length === 0;
  const isSuperAdminWithMultipleCoworks = isSuperAdmin && userCoworks.length > 1;
  const hasCoworkAccess = !!activeCowork || (!isSuperAdmin && !!user?.tenantId);

  // Initialize on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Auto-fetch when user is available and not loading
  useEffect(() => {
    if (autoFetch && user && !authLoading && !isInitialized) {
      fetchUserCoworks();
    }
  }, [autoFetch, user, authLoading, isInitialized, fetchUserCoworks]);

  // Listen for auth changes
  useEffect(() => {
    if (!user && isInitialized) {
      // User logged out, clear state
      setUserCoworks([]);
      setActiveCowork(null);
      setIsSuperAdmin(false);
      setIsInitialized(false);
      setError(null);
      
      if (persistActiveCowork) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CACHE_KEY);
      }
      
      console.log("🔄 User logged out, cleared cowork context");
    }
  }, [user, isInitialized, persistActiveCowork]);

  // Validate active cowork is still in user's coworks
  useEffect(() => {
    if (activeCowork && userCoworks.length > 0) {
      const stillHasAccess = canAccessCowork(activeCowork.id);
      if (!stillHasAccess) {
        console.warn(`⚠️ User no longer has access to active cowork: ${activeCowork.name}`);
        setActiveCowork(null);
        saveToStorage(null);
      }
    }
  }, [activeCowork, userCoworks, canAccessCowork, saveToStorage]);

  const contextValue: CoworkContextState = {
    // Core state
    userCoworks,
    activeCowork,
    isSuperAdmin,
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Error handling
    error,
    
    // Actions
    fetchUserCoworks,
    changeActiveCowork,
    refreshContext,
    clearError,
    
    // Utility methods
    hasMultipleCoworks,
    canAccessCowork,
    getCoworkById,
    getCurrentCoworkRole,
    
    // Super admin specific helpers
    isSuperAdminWithoutCowork,
    isSuperAdminWithMultipleCoworks,
    hasCoworkAccess,
  };

  return (
    <CoworkContext.Provider value={contextValue}>
      {children}
    </CoworkContext.Provider>
  );
}

// Higher-order component for conditional rendering based on cowork context
export function withCoworkContext<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireCowork?: boolean;
    requireRole?: string[];
    fallback?: React.ComponentType;
  }
) {
  return function WrappedComponent(props: P) {
    const context = useCoworkContextOptional();
    
    if (!context) {
      if (options?.fallback) {
        const Fallback = options.fallback;
        return <Fallback />;
      }
      return <Component {...props} />;
    }

    if (options?.requireCowork && !context.activeCowork) {
      if (options?.fallback) {
        const Fallback = options.fallback;
        return <Fallback />;
      }
      return null;
    }

    if (options?.requireRole && context.activeCowork) {
      const hasRequiredRole = options.requireRole.includes(context.activeCowork.role);
      if (!hasRequiredRole) {
        if (options?.fallback) {
          const Fallback = options.fallback;
          return <Fallback />;
        }
        return null;
      }
    }

    return <Component {...props} />;
  };
}

// Hook for listening to cowork changes
export function useCoworkChangeListener(callback: (cowork: UserCowork, isSuperAdmin: boolean) => void) {
  useEffect(() => {
    const handleCoworkChange = (event: CustomEvent) => {
      callback(event.detail.cowork, event.detail.isSuperAdmin);
    };

    window.addEventListener('coworkChanged', handleCoworkChange as EventListener);
    
    return () => {
      window.removeEventListener('coworkChanged', handleCoworkChange as EventListener);
    };
  }, [callback]);
}
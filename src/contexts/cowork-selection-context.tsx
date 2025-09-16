"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@/contexts/clerk-auth-context';

// Types
interface Cowork {
  id: string;
  name: string;
  slug: string;
  role?: string;
  status?: string;
}

interface CoworkSelectionContextType {
  // State
  selectedCowork: Cowork | null;
  availableCoworks: Cowork[];
  isLoadingCoworks: boolean;
  isSuperAdmin: boolean;
  isPlatformView: boolean; // True when Super Admin has no cowork selected
  
  // Actions
  selectCowork: (cowork: Cowork | null) => void;
  switchToPlatformView: () => void;
  refreshCoworks: () => Promise<void>;
}

// Context
const CoworkSelectionContext = createContext<CoworkSelectionContextType | undefined>(undefined);

// Provider Props
interface CoworkSelectionProviderProps {
  children: ReactNode;
}

// Storage key for persistence
const SELECTED_COWORK_KEY = 'sweetspot-selected-cowork';

// Provider Component
export function CoworkSelectionProvider({ children }: CoworkSelectionProviderProps) {
  // Clerk user and auth context
  const { user, isLoaded } = useUser();
  const { user: authUser, isAuthenticated, isLoading: isAuthLoading, isInitialized: isAuthInitialized } = useAuth();

  // State
  const [selectedCowork, setSelectedCowork] = useState<Cowork | null>(null);
  const [availableCoworks, setAvailableCoworks] = useState<Cowork[]>([]);
  const [isLoadingCoworks, setIsLoadingCoworks] = useState(true);

  // Computed values - Use auth context instead of Clerk metadata directly
  // SECURITY: Auth context gets role from database, which is secure
  // Don't determine role until auth is fully loaded to prevent incorrect initial state
  const isAuthReady = isAuthInitialized && !isAuthLoading;
  const isSuperAdmin = isAuthReady && authUser?.role === 'SUPER_ADMIN';
  const isPlatformView = isSuperAdmin && selectedCowork === null;
  
  // Debug logging
  useEffect(() => {
    if (user && authUser) {
      console.log('🔍 Cowork Selection Context Debug:', {
        firstName: user.firstName,
        email: user.emailAddresses?.[0]?.emailAddress,
        authUserRole: authUser?.role,
        isSuperAdmin,
        selectedCowork: selectedCowork?.name || 'null',
        isPlatformView,
        isLoadingCoworks,
        isAuthenticated
      });
    }
  }, [user, authUser, isSuperAdmin, selectedCowork, isPlatformView, isLoadingCoworks, isAuthenticated]);

  // Load coworks from API
  const loadCoworks = async () => {
    if (!isLoaded || !user || !isAuthenticated || !isAuthReady) return;
    
    setIsLoadingCoworks(true);
    try {
      const response = await fetch('/api/coworks');
      const data = await response.json();
      
      if (data.success) {
        const coworks = isSuperAdmin ? data.data.allCoworks || [] : data.data.userCoworks || [];
        setAvailableCoworks(coworks);
        
        // For regular users (including COWORK_ADMIN), auto-select their default cowork
        if (!isSuperAdmin && data.data.defaultCowork) {
          setSelectedCowork(data.data.defaultCowork);
        }
        
        // For true SUPER_ADMIN users, start with platform view
        if (isSuperAdmin && authUser?.role === 'SUPER_ADMIN') {
          console.log('🔧 Starting platform view for SUPER_ADMIN');
          setSelectedCowork(null); // Force platform view
          localStorage.setItem(SELECTED_COWORK_KEY, 'platform');
        }
      }
    } catch (error) {
      console.error('Failed to load coworks:', error);
    } finally {
      setIsLoadingCoworks(false);
    }
  };

  // Select a specific cowork
  const selectCowork = (cowork: Cowork | null) => {
    setSelectedCowork(cowork);
    
    // Persist selection for Super Admins
    if (isSuperAdmin) {
      if (cowork) {
        localStorage.setItem(SELECTED_COWORK_KEY, cowork.id);
      } else {
        localStorage.setItem(SELECTED_COWORK_KEY, 'platform');
      }
    }
  };

  // Switch to platform view (Super Admin only)
  const switchToPlatformView = () => {
    if (isSuperAdmin) {
      selectCowork(null);
    }
  };

  // Refresh coworks
  const refreshCoworks = async () => {
    await loadCoworks();
  };

  // Load coworks when user changes or component mounts
  useEffect(() => {
    if (isLoaded && isAuthenticated && authUser && isAuthReady) {
      loadCoworks();
    }
  }, [isLoaded, user?.id, isAuthenticated, authUser?.role, isAuthReady]);

  // Context value
  const contextValue: CoworkSelectionContextType = {
    selectedCowork,
    availableCoworks,
    isLoadingCoworks,
    isSuperAdmin,
    isPlatformView,
    selectCowork,
    switchToPlatformView,
    refreshCoworks,
  };

  return (
    <CoworkSelectionContext.Provider value={contextValue}>
      {children}
    </CoworkSelectionContext.Provider>
  );
}

// Hook to use the context
export function useCoworkSelection() {
  const context = useContext(CoworkSelectionContext);
  if (context === undefined) {
    throw new Error('useCoworkSelection must be used within a CoworkSelectionProvider');
  }
  return context;
}

// Export types
export type { Cowork, CoworkSelectionContextType };
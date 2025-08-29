"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

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
  // Clerk user
  const { user, isLoaded } = useUser();
  
  // State
  const [selectedCowork, setSelectedCowork] = useState<Cowork | null>(null);
  const [availableCoworks, setAvailableCoworks] = useState<Cowork[]>([]);
  const [isLoadingCoworks, setIsLoadingCoworks] = useState(true);
  
  // Computed values
  // Check both private and public metadata for backward compatibility
  const isSuperAdmin = user?.privateMetadata?.role === 'SUPER_ADMIN' || 
                       user?.publicMetadata?.role === 'SUPER_ADMIN';
  const isPlatformView = isSuperAdmin && selectedCowork === null;
  
  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('🔍 Cowork Selection Context Debug:', {
        firstName: user.firstName,
        email: user.emailAddresses?.[0]?.emailAddress,
        publicRole: user.publicMetadata?.role,
        privateRole: user.privateMetadata?.role,
        isSuperAdmin,
        selectedCowork: selectedCowork?.name || 'null',
        isPlatformView,
        isLoadingCoworks
      });
    }
  }, [user, isSuperAdmin, selectedCowork, isPlatformView, isLoadingCoworks]);

  // Load coworks from API
  const loadCoworks = async () => {
    if (!isLoaded || !user) return;
    
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
        if (isSuperAdmin && (user?.privateMetadata?.role === 'SUPER_ADMIN' || user?.publicMetadata?.role === 'SUPER_ADMIN')) {
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
    if (isLoaded) {
      loadCoworks();
    }
  }, [isLoaded, user?.id]);

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
"use client";

import { useCoworkSelection, type Cowork } from '@/contexts/cowork-selection-context';
import { useMemo } from 'react';

/**
 * Enhanced hook that provides additional computed values and utilities
 * for working with cowork selection state
 */
export function useCoworkSelectionHook() {
  const context = useCoworkSelection();

  // Additional computed values
  const computedValues = useMemo(() => {
    const {
      selectedCowork,
      availableCoworks,
      isSuperAdmin,
      isPlatformView,
      isLoadingCoworks
    } = context;

    return {
      // Current view state
      currentView: isPlatformView ? 'platform' : 'cowork',
      hasCoworkSelected: selectedCowork !== null,
      hasMultipleCoworks: availableCoworks.length > 1,
      
      // Current cowork info
      selectedCoworkId: selectedCowork?.id || null,
      selectedCoworkName: selectedCowork?.name || null,
      selectedCoworkSlug: selectedCowork?.slug || null,
      
      // User permissions in current context
      canManageCoworks: isSuperAdmin,
      canSwitchCoworks: isSuperAdmin || availableCoworks.length > 1,
      canAccessPlatformView: isSuperAdmin,
      
      // Loading states
      isInitializing: isLoadingCoworks && availableCoworks.length === 0,
      isReady: !isLoadingCoworks || availableCoworks.length > 0,
      
      // Options for selectors
      coworkOptions: [
        ...(isSuperAdmin ? [{ 
          id: 'platform', 
          name: 'Vista General de la Plataforma', 
          slug: 'platform',
          isPlatform: true 
        }] : []),
        ...availableCoworks.map(cowork => ({
          ...cowork,
          isPlatform: false
        }))
      ],
      
      // Statistics
      totalCoworksCount: availableCoworks.length,
      activeCoworksCount: availableCoworks.filter(c => c.status === 'ACTIVE').length,
    };
  }, [context]);

  // Utility functions
  const utilities = useMemo(() => ({
    // Check if a specific cowork is selected
    isCoworkSelected: (coworkId: string) => 
      context.selectedCowork?.id === coworkId,
    
    // Find a cowork by ID
    findCoworkById: (coworkId: string) => 
      context.availableCoworks.find(c => c.id === coworkId),
    
    // Get cowork by slug
    findCoworkBySlug: (slug: string) => 
      context.availableCoworks.find(c => c.slug === slug),
    
    // Select cowork by ID
    selectCoworkById: (coworkId: string) => {
      const cowork = context.availableCoworks.find(c => c.id === coworkId);
      if (cowork) {
        context.selectCowork(cowork);
        return true;
      }
      return false;
    },
    
    // Toggle between platform view and first available cowork
    toggleView: () => {
      if (context.isSuperAdmin) {
        if (context.isPlatformView && context.availableCoworks.length > 0) {
          context.selectCowork(context.availableCoworks[0]);
        } else {
          context.switchToPlatformView();
        }
      }
    },
    
    // Get display name for current selection
    getCurrentDisplayName: () => {
      if (computedValues.isPlatformView) {
        return 'Vista General de la Plataforma';
      }
      return context.selectedCowork?.name || 'Sin seleccionar';
    },
    
    // Get breadcrumb items for current selection
    getBreadcrumbs: () => {
      const crumbs = [{ name: 'Dashboard', href: '/dashboard' }];
      
      if (context.isSuperAdmin && computedValues.isPlatformView) {
        crumbs.push({ name: 'Vista General', href: '/dashboard' });
      } else if (context.selectedCowork) {
        crumbs.push({ 
          name: context.selectedCowork.name, 
          href: `/dashboard?cowork=${context.selectedCowork.slug}` 
        });
      }
      
      return crumbs;
    }
  }), [context, computedValues]);

  return {
    // Original context values
    ...context,
    
    // Enhanced computed values
    ...computedValues,
    
    // Utility functions
    ...utilities,
  };
}

// Export the main hook as default
export default useCoworkSelectionHook;
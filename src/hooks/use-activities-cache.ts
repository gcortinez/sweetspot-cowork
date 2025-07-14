import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './use-api';

export interface Activity {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'TOUR' | 'FOLLOW_UP' | 'DOCUMENT';
  subject: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  outcome?: string;
  duration?: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  client?: {
    id: string;
    name: string;
    email: string;
  };
  opportunity?: {
    id: string;
    title: string;
    value: number;
    stage: string;
  };
}

interface UseActivitiesParams {
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
  entityType?: 'lead' | 'client' | 'opportunity';
  entityId?: string;
  autoFetch?: boolean;
}

interface CacheEntry {
  data: Activity[];
  timestamp: number;
  key: string;
}

// Global cache with 5 minute TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const activitiesCache = new Map<string, CacheEntry>();

// Helper function to generate cache key
function getCacheKey(params: UseActivitiesParams): string {
  const keys = [];
  if (params.leadId) keys.push(`lead:${params.leadId}`);
  if (params.clientId) keys.push(`client:${params.clientId}`);
  if (params.opportunityId) keys.push(`opportunity:${params.opportunityId}`);
  if (params.entityType && params.entityId) keys.push(`${params.entityType}:${params.entityId}`);
  return keys.join('|') || 'all';
}

// Helper function to check if cache is valid
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

// Helper function to invalidate related cache entries
function invalidateRelatedCache(activityId?: string, leadId?: string) {
  const keysToRemove: string[] = [];
  
  for (const [key, entry] of activitiesCache.entries()) {
    // Remove all cache entries if no specific IDs provided
    if (!activityId && !leadId) {
      keysToRemove.push(key);
    }
    // Remove cache entries related to a specific lead
    else if (leadId && key.includes(`lead:${leadId}`)) {
      keysToRemove.push(key);
    }
    // Remove cache entries that might contain the updated activity
    else if (activityId) {
      // For now, we'll be conservative and clear all cache entries
      // In a more sophisticated implementation, we could track which activities are in which cache entries
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => activitiesCache.delete(key));
}

export function useActivitiesWithCache(params: UseActivitiesParams = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const lastFetchRef = useRef<string>('');

  const fetchActivities = useCallback(async (forceRefresh = false) => {
    if (!params.leadId && !params.clientId && !params.opportunityId && !params.entityId) {
      setActivities([]);
      return;
    }

    const cacheKey = getCacheKey(params);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEntry = activitiesCache.get(cacheKey);
      if (cachedEntry && isCacheValid(cachedEntry)) {
        console.log('🔥 Using cached activities for key:', cacheKey);
        setActivities(cachedEntry.data);
        return;
      }
    }

    // Prevent duplicate requests
    if (lastFetchRef.current === cacheKey && loading) {
      return;
    }

    setLoading(true);
    setError(null);
    lastFetchRef.current = cacheKey;

    try {
      let response;

      if (params.entityType && params.entityId) {
        // Use the specific endpoint for getting activities by entity
        response = await api.get(`/api/v1/activities/by-entity/${params.entityType}/${params.entityId}`);
      } else {
        // Use the general endpoint with query parameters
        const queryParams = new URLSearchParams();
        if (params.leadId) queryParams.append('leadId', params.leadId);
        if (params.clientId) queryParams.append('clientId', params.clientId);
        if (params.opportunityId) queryParams.append('opportunityId', params.opportunityId);
        queryParams.append('sortBy', 'createdAt');
        queryParams.append('sortOrder', 'desc');

        response = await api.get(`/api/v1/activities?${queryParams.toString()}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || 'Error al cargar actividades'}`);
      }

      const data = await response.json();
      console.log('📥 Fresh activities data:', data);

      // Handle different response structures
      let activitiesArray: Activity[] = [];
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          activitiesArray = data.data;
        } else if (data.data.activities && Array.isArray(data.data.activities)) {
          activitiesArray = data.data.activities;
        }
      } else if (Array.isArray(data)) {
        activitiesArray = data;
      }

      // Update cache
      activitiesCache.set(cacheKey, {
        data: activitiesArray,
        timestamp: Date.now(),
        key: cacheKey
      });

      console.log('💾 Cached activities for key:', cacheKey, `(${activitiesArray.length} activities)`);
      setActivities(activitiesArray);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar actividades');
      setActivities([]);
    } finally {
      setLoading(false);
      lastFetchRef.current = '';
    }
  }, [api, params.leadId, params.clientId, params.opportunityId, params.entityType, params.entityId]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchActivities();
    }
  }, [fetchActivities, params.autoFetch]);

  // Function to update a single activity in cache
  const updateActivityInCache = useCallback((updatedActivity: Activity) => {
    const cacheKey = getCacheKey(params);
    const cachedEntry = activitiesCache.get(cacheKey);
    
    if (cachedEntry) {
      const updatedActivities = cachedEntry.data.map(activity =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      );
      
      // Update cache
      activitiesCache.set(cacheKey, {
        ...cachedEntry,
        data: updatedActivities,
        timestamp: Date.now() // Refresh timestamp
      });
      
      // Update local state
      setActivities(updatedActivities);
      console.log('🔄 Updated activity in cache:', updatedActivity.id);
    }
  }, [params]);

  // Function to add a new activity to cache
  const addActivityToCache = useCallback((newActivity: Activity) => {
    const cacheKey = getCacheKey(params);
    const cachedEntry = activitiesCache.get(cacheKey);
    
    if (cachedEntry) {
      const updatedActivities = [newActivity, ...cachedEntry.data];
      
      // Update cache
      activitiesCache.set(cacheKey, {
        ...cachedEntry,
        data: updatedActivities,
        timestamp: Date.now()
      });
      
      // Update local state
      setActivities(updatedActivities);
      console.log('➕ Added new activity to cache:', newActivity.id);
    } else {
      // If no cache, just refresh
      fetchActivities(true);
    }
  }, [params, fetchActivities]);

  // Function to remove an activity from cache
  const removeActivityFromCache = useCallback((activityId: string) => {
    const cacheKey = getCacheKey(params);
    const cachedEntry = activitiesCache.get(cacheKey);
    
    if (cachedEntry) {
      const updatedActivities = cachedEntry.data.filter(activity => activity.id !== activityId);
      
      // Update cache
      activitiesCache.set(cacheKey, {
        ...cachedEntry,
        data: updatedActivities,
        timestamp: Date.now()
      });
      
      // Update local state
      setActivities(updatedActivities);
      console.log('🗑️ Removed activity from cache:', activityId);
    }
  }, [params]);

  const refetch = useCallback((forceRefresh = true) => {
    return fetchActivities(forceRefresh);
  }, [fetchActivities]);

  // Function to clear all cache (useful for logout, etc.)
  const clearCache = useCallback(() => {
    activitiesCache.clear();
    console.log('🧹 Cleared all activities cache');
  }, []);

  return {
    activities,
    loading,
    error,
    refetch,
    fetchActivities,
    updateActivityInCache,
    addActivityToCache,
    removeActivityFromCache,
    clearCache,
    // Expose cache info for debugging
    cacheInfo: {
      key: getCacheKey(params),
      size: activitiesCache.size,
      hasCache: activitiesCache.has(getCacheKey(params))
    }
  };
}

// Export helper for other components to invalidate cache
export { invalidateRelatedCache };
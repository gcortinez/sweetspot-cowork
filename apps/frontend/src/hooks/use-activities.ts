import { useState, useEffect, useCallback } from 'react';
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

export function useActivities(params: UseActivitiesParams = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const fetchActivities = useCallback(async () => {
    if (!params.leadId && !params.clientId && !params.opportunityId && !params.entityId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (params.entityType && params.entityId) {
        // Use the specific endpoint for getting activities by entity
        response = await api.get(`/api/activities/by-entity/${params.entityType}/${params.entityId}`);
      } else {
        // Use the general endpoint with query parameters
        const queryParams = new URLSearchParams();
        if (params.leadId) queryParams.append('leadId', params.leadId);
        if (params.clientId) queryParams.append('clientId', params.clientId);
        if (params.opportunityId) queryParams.append('opportunityId', params.opportunityId);
        queryParams.append('sortBy', 'createdAt');
        queryParams.append('sortOrder', 'desc');

        response = await api.get(`/api/activities?${queryParams.toString()}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || 'Error al cargar actividades'}`);
      }

      const data = await response.json();
      console.log('Activities response:', data);

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

      setActivities(activitiesArray);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar actividades');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [api, params.leadId, params.clientId, params.opportunityId, params.entityType, params.entityId]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchActivities();
    }
  }, [fetchActivities, params.autoFetch]);

  const refetch = useCallback(() => {
    return fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch,
    fetchActivities
  };
}
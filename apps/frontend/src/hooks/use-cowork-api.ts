"use client";

import { useCallback, useMemo } from "react";
import { useCoworkContext } from "@/providers/cowork-provider";

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  skipCoworkHeader?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useCoworkAPI() {
  const { activeCowork, isSuperAdmin } = useCoworkContext();

  // Get headers with cowork context
  const getHeaders = useCallback((options?: ApiOptions) => {
    const token = localStorage.getItem("accessToken");
    const baseHeaders: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Add cowork context header if available and not skipped
    if (activeCowork && !options?.skipCoworkHeader) {
      baseHeaders["x-active-cowork"] = activeCowork.id;
    }

    // Add super admin bypass if applicable
    if (isSuperAdmin) {
      baseHeaders["x-super-admin-bypass"] = "true";
    }

    // Merge with custom headers
    return { ...baseHeaders, ...options?.headers };
  }, [activeCowork, isSuperAdmin]);

  // Generic API call function
  const apiCall = useCallback(async <T = any>(
    endpoint: string,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> => {
    try {
      const headers = getHeaders(options);
      
      const requestOptions: RequestInit = {
        method: options?.method || 'GET',
        headers,
      };

      if (options?.body && options.method !== 'GET') {
        requestOptions.body = JSON.stringify(options.body);
      }

      console.log(`🔄 API Call: ${options?.method || 'GET'} ${endpoint}`, {
        cowork: activeCowork?.name,
        isSuperAdmin,
      });

      const response = await fetch(`http://localhost:3001/api${endpoint}`, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ API Success: ${endpoint}`, data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ API Error: ${endpoint}`, error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [getHeaders, activeCowork, isSuperAdmin]);

  // Specific API methods
  const get = useCallback(<T = any>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiCall<T>(endpoint, { ...options, method: 'GET' }), [apiCall]);

  const post = useCallback(<T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) => 
    apiCall<T>(endpoint, { ...options, method: 'POST', body }), [apiCall]);

  const put = useCallback(<T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) => 
    apiCall<T>(endpoint, { ...options, method: 'PUT', body }), [apiCall]);

  const del = useCallback(<T = any>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }), [apiCall]);

  const patch = useCallback(<T = any>(endpoint: string, body?: any, options?: Omit<ApiOptions, 'method'>) => 
    apiCall<T>(endpoint, { ...options, method: 'PATCH', body }), [apiCall]);

  // Current context info
  const contextInfo = useMemo(() => ({
    activeCowork,
    isSuperAdmin,
    hasActiveCowork: !!activeCowork,
    currentRole: activeCowork?.role || null,
  }), [activeCowork, isSuperAdmin]);

  return {
    // Generic API call
    apiCall,
    
    // HTTP methods
    get,
    post,
    put,
    delete: del,
    patch,
    
    // Context info
    contextInfo,
    
    // Utility methods
    getHeaders,
  };
}

// Hook for specific cowork-scoped operations
export function useCoworkOperations() {
  const api = useCoworkAPI();
  const { activeCowork, isSuperAdmin, canAccessCowork } = useCoworkContext();

  // Ensure user has access to perform operations on a cowork
  const ensureCoworkAccess = useCallback((coworkId?: string): boolean => {
    const targetCoworkId = coworkId || activeCowork?.id;
    
    if (!targetCoworkId) {
      console.warn('No cowork ID provided and no active cowork');
      return false;
    }

    if (isSuperAdmin) {
      return true; // Super admin can access any cowork
    }

    return canAccessCowork(targetCoworkId);
  }, [activeCowork, isSuperAdmin, canAccessCowork]);

  // Operations scoped to current cowork
  const operations = useMemo(() => ({
    // Users in current cowork
    getUsers: () => api.get(`/coworks/${activeCowork?.id}/users`),
    createUser: (userData: any) => api.post(`/coworks/${activeCowork?.id}/users`, userData),
    updateUser: (userId: string, userData: any) => api.put(`/users/${userId}`, userData),
    deleteUser: (userId: string) => api.delete(`/users/${userId}`),

    // Clients in current cowork
    getClients: () => api.get(`/coworks/${activeCowork?.id}/clients`),
    createClient: (clientData: any) => api.post(`/clients`, clientData),
    updateClient: (clientId: string, clientData: any) => api.put(`/clients/${clientId}`, clientData),
    deleteClient: (clientId: string) => api.delete(`/clients/${clientId}`),

    // Spaces in current cowork
    getSpaces: () => api.get(`/spaces`),
    createSpace: (spaceData: any) => api.post(`/spaces`, spaceData),
    updateSpace: (spaceId: string, spaceData: any) => api.put(`/spaces/${spaceId}`, spaceData),
    deleteSpace: (spaceId: string) => api.delete(`/spaces/${spaceId}`),

    // Bookings in current cowork
    getBookings: (params?: any) => api.get(`/bookings${params ? `?${new URLSearchParams(params)}` : ''}`),
    createBooking: (bookingData: any) => api.post(`/bookings`, bookingData),
    updateBooking: (bookingId: string, bookingData: any) => api.put(`/bookings/${bookingId}`, bookingData),
    deleteBooking: (bookingId: string) => api.delete(`/bookings/${bookingId}`),

    // Analytics for current cowork
    getAnalytics: (period?: string) => api.get(`/analytics${period ? `?period=${period}` : ''}`),
    getDashboard: () => api.get(`/analytics/dashboard`),

    // Leads for current cowork
    getLeads: (params?: any) => api.get(`/leads${params ? `?${new URLSearchParams(params)}` : ''}`),
    createLead: (leadData: any) => api.post(`/leads`, leadData),
    updateLead: (leadId: string, leadData: any) => api.put(`/leads/${leadId}`, leadData),
    deleteLead: (leadId: string) => api.delete(`/leads/${leadId}`),

    // Settings for current cowork
    getSettings: () => api.get(`/settings`),
    updateSettings: (settingsData: any) => api.put(`/settings`, settingsData),
  }), [api, activeCowork]);

  return {
    ...operations,
    ensureCoworkAccess,
    contextInfo: api.contextInfo,
  };
}

// Hook for Super Admin operations (cross-cowork)
export function useSuperAdminOperations() {
  const api = useCoworkAPI();
  const { isSuperAdmin } = useCoworkContext();

  if (!isSuperAdmin) {
    throw new Error('useSuperAdminOperations can only be used by Super Admins');
  }

  return {
    // Cowork management
    getAllCoworks: () => api.get('/super-admin/coworks'),
    getCowork: (coworkId: string) => api.get(`/super-admin/coworks/${coworkId}`),
    createCowork: (coworkData: any) => api.post('/super-admin/coworks', coworkData),
    updateCowork: (coworkId: string, coworkData: any) => api.put(`/super-admin/coworks/${coworkId}`, coworkData),
    deleteCowork: (coworkId: string) => api.delete(`/super-admin/coworks/${coworkId}`),
    suspendCowork: (coworkId: string) => api.put(`/super-admin/coworks/${coworkId}/suspend`),
    activateCowork: (coworkId: string) => api.put(`/super-admin/coworks/${coworkId}/activate`),

    // System analytics
    getSystemAnalytics: () => api.get('/super-admin/analytics'),
    getBillingOverview: () => api.get('/super-admin/billing/overview'),
    getSecurityAlerts: () => api.get('/super-admin/security/alerts'),

    // Cross-cowork operations
    getUsersInCowork: (coworkId: string) => api.get(`/super-admin/coworks/${coworkId}/users`),
    getClientsInCowork: (coworkId: string) => api.get(`/super-admin/coworks/${coworkId}/clients`),
  };
}
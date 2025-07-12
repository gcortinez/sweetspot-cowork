import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/contexts/auth-context';
import { getApiBaseUrl } from "@/lib/api-config";

export function useApi() {
  const accessToken = useAuthStore(state => state.accessToken);
  const { logout, refreshSession } = useAuth();
  

  return useMemo(() => {
    const makeRequest = async (url: string, options: RequestInit = {}) => {
      // For activities, use frontend proxy route to avoid CORS issues
      let fullUrl: string;
      if (url.includes('/api/activities')) {
        // Use the frontend Next.js API proxy
        fullUrl = url.startsWith('http') ? url : url;
        console.log('Using frontend proxy for activities:', fullUrl);
      } else {
        // Convert relative URLs to absolute URLs pointing to the backend for other endpoints
        const baseUrl = getApiBaseUrl();
        fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      }
      
      console.log('Making API request to:', fullUrl);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add auth token if available
      let tokenToUse = accessToken;
      
      // If no token in store, try to get from session manager as fallback
      if (!tokenToUse) {
        try {
          const sessionData = JSON.parse(localStorage.getItem('sweetspot-session') || '{}');
          if (sessionData && sessionData.accessToken) {
            tokenToUse = sessionData.accessToken;
            console.log('Using token from localStorage fallback');
          }
        } catch (error) {
          console.error('Error parsing session data from localStorage:', error);
        }
      }
      
      if (tokenToUse) {
        (headers as Record<string, string>).Authorization = `Bearer ${tokenToUse}`;
        console.log('Added Authorization header with token');
      } else {
        console.error('No access token available for API request');
        throw new Error('No access token available. Please log in again.');
      }

      try {
        console.log('Making API request with headers:', headers);
        const response = await fetch(fullUrl, {
          ...options,
          headers,
        });

        console.log('API response:', {
          url: fullUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        // Handle 401 responses by trying to refresh token first
        if (response.status === 401) {
          console.log('Got 401, trying to refresh token...');
          const refreshed = await refreshSession();
          
          if (refreshed) {
            console.log('Token refresh successful, retrying request...');
            // Get the new token and retry the request
            const newToken = useAuthStore.getState().accessToken;
            if (newToken) {
              const newHeaders = {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              };
              
              const retryResponse = await fetch(fullUrl, {
                ...options,
                headers: newHeaders,
              });
              
              console.log('Retry response:', {
                url: fullUrl,
                status: retryResponse.status,
                statusText: retryResponse.statusText,
                ok: retryResponse.ok
              });
              
              return retryResponse;
            }
          }
          
          // If refresh failed or didn't work, logout
          console.log('Token refresh failed, logging out...');
          await logout();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        return response;
      } catch (error) {
        console.error('API request error:', error);
        // Re-throw the error for the calling component to handle
        throw error;
      }
    };

    return {
      get: (url: string, options: RequestInit = {}) =>
        makeRequest(url, { ...options, method: 'GET' }),
      
      post: (url: string, data?: any, options: RequestInit = {}) =>
        makeRequest(url, {
          ...options,
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined,
        }),
      
      put: (url: string, data?: any, options: RequestInit = {}) =>
        makeRequest(url, {
          ...options,
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined,
        }),
      
      delete: (url: string, options: RequestInit = {}) =>
        makeRequest(url, { ...options, method: 'DELETE' }),
    };
  }, [accessToken, logout, refreshSession]);
}
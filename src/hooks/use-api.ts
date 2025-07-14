import { useMemo } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { useAuth } from '@/contexts/auth-context';
import { getApiBaseUrl } from "@/lib/api-config";

export function useApi() {
  const { getToken } = useClerkAuth();
  const { signOut } = useAuth();
  

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

      // Get auth token from Clerk
      const token = await getToken();
      
      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
        console.log('Added Authorization header with Clerk token');
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

        // Handle 401 responses by signing out
        if (response.status === 401) {
          console.log('Got 401, signing out...');
          await signOut();
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
  }, [getToken, signOut]);
}
/**
 * API Configuration utility
 * Centralizes API URL management for consistent behavior across environments
 */

// Get the base URL for API calls
export const getApiBaseUrl = (): string => {
  // For client-side calls, always use the current origin to avoid CORS issues
  if (typeof window !== 'undefined') {
    // In production/preview, use the current origin to avoid CORS
    return window.location.origin;
  }
  
  // For server-side calls, use environment variable or VERCEL_URL
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback
  return 'http://localhost:3000';
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Helper function for auth endpoints specifically
export const buildAuthUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return buildApiUrl(`/api/auth${cleanEndpoint}`);
};

// Export the base URL constant for backwards compatibility
export const API_BASE_URL = getApiBaseUrl();
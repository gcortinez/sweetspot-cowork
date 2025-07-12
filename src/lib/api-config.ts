/**
 * API Configuration utility
 * Centralizes API URL management for consistent behavior across environments
 */

// Get the base URL for API calls
export const getApiBaseUrl = (): string => {
  // For client-side calls, use the environment variable or default to current origin
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
  }
  
  // For server-side calls, use environment variable or localhost for development
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Helper function for auth endpoints specifically
export const buildAuthUrl = (endpoint: string): string => {
  return buildApiUrl(`/api/auth${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
};

// Export the base URL constant for backwards compatibility
export const API_BASE_URL = getApiBaseUrl();
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getDefaultRedirectForRole } from "@/lib/route-guards";

interface AuthRedirectProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthRedirect({ children, fallback }: AuthRedirectProps) {
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Check for logout flag in localStorage
    const recentLogout = localStorage.getItem('recent-logout');
    
    // If there was a recent logout, clear the flag and don't redirect
    if (recentLogout) {
      localStorage.removeItem('recent-logout');
      console.log('🚪 AuthRedirect: Recent logout detected, staying on current page');
      return;
    }
    
    // Only redirect if:
    // 1. Auth is initialized
    // 2. Not currently loading
    // 3. User is authenticated
    // 4. Haven't already redirected
    if (isInitialized && !isLoading && user && !hasRedirected) {
      console.log('🎯 AuthRedirect: Redirecting authenticated user:', user.email, 'Role:', user.role);
      setHasRedirected(true);
      
      const redirectPath = getDefaultRedirectForRole(user.role);
      console.log('📍 AuthRedirect: Redirecting to:', redirectPath);
      
      // Use router.push for navigation
      router.push(redirectPath);
    }
  }, [user, isLoading, isInitialized, hasRedirected, router]);

  // Show loading while auth is initializing
  if (isLoading || !isInitialized) {
    return (
      fallback || (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      )
    );
  }

  // Show redirect loading for authenticated users
  if (user && !hasRedirected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
          <p className="text-xs text-gray-400 mt-2">
            Usuario: {user.email} | Rol: {user.role}
          </p>
        </div>
      </div>
    );
  }

  // Render children for non-authenticated users
  return <>{children}</>;
}
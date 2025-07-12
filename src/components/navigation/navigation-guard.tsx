"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCoworkContextOptional } from "@/contexts/cowork-context";
import { 
  applySuperAdminNavigationGuards, 
  hasRouteAccess,
  isProtectedRoute
} from "@/lib/navigation-guards";

interface NavigationGuardProps {
  children: React.ReactNode;
}

/**
 * Navigation Guard Component
 * Handles automatic redirections based on user role and cowork context
 */
export function NavigationGuard({ children }: NavigationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const coworkContext = useCoworkContextOptional();

  useEffect(() => {
    // Don't run guards while auth is loading
    if (isLoading) return;

    // Don't run guards on auth pages
    if (pathname.startsWith("/auth/")) return;

    // Redirect to login if not authenticated and trying to access protected route
    if (!isAuthenticated && isProtectedRoute(pathname)) {
      router.push("/auth/login");
      return;
    }

    // Don't run guards if no user or no cowork context yet
    if (!user || !coworkContext) return;

    // Apply super admin specific navigation guards
    const redirectPath = applySuperAdminNavigationGuards(user, coworkContext, pathname);
    if (redirectPath) {
      console.log(`🔄 Navigation guard redirect: ${pathname} -> ${redirectPath}`);
      router.push(redirectPath);
      return;
    }

    // Check if user has access to current route
    if (!hasRouteAccess(user, coworkContext, pathname)) {
      console.log(`❌ Access denied to route: ${pathname}`);
      
      // Redirect to appropriate default route
      if (user.role === "SUPER_ADMIN" && coworkContext.isSuperAdminWithoutCowork) {
        router.push("/super-admin");
      } else if (coworkContext.hasCoworkAccess) {
        router.push("/dashboard");
      } else {
        router.push("/profile");
      }
      return;
    }

  }, [
    isLoading, 
    isAuthenticated, 
    user, 
    coworkContext, 
    pathname, 
    router
  ]);

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Inicializando...</span>
        </div>
      </div>
    );
  }

  // Render children if all guards pass
  return <>{children}</>;
}

/**
 * Hook for programmatic navigation with guards
 */
export function useNavigationGuard() {
  const router = useRouter();
  const { user } = useAuth();
  const coworkContext = useCoworkContextOptional();

  const navigateWithGuard = (path: string) => {
    if (!user || !coworkContext) {
      router.push(path);
      return;
    }

    // Check if user has access to the target route
    if (hasRouteAccess(user, coworkContext, path)) {
      router.push(path);
    } else {
      console.warn(`Navigation blocked: User does not have access to ${path}`);
      
      // Redirect to appropriate fallback
      if (user.role === "SUPER_ADMIN" && coworkContext.isSuperAdminWithoutCowork) {
        router.push("/super-admin");
      } else if (coworkContext.hasCoworkAccess) {
        router.push("/dashboard");
      } else {
        router.push("/profile");
      }
    }
  };

  return {
    navigateWithGuard,
    hasAccess: (path: string) => user && coworkContext ? hasRouteAccess(user, coworkContext, path) : false
  };
}
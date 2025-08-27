"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth, useSession } from "@clerk/nextjs";
import { AuthUser, ClerkUserMetadata, getDefaultRedirectForRole } from "@/types/clerk-auth";
import { UserRole } from "@/types/database";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Auth functions
  signOut: () => Promise<void>;
  updateUserMetadata: (metadata: Partial<ClerkUserMetadata>) => Promise<void>;
  
  // Role checking functions
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccess: (minRole: UserRole) => boolean;
  
  // Clerk specific
  clerkUser: any;
  session: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function ClerkAuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { session } = useSession();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!isSignedIn;

  // Convert Clerk user to our AuthUser format
  const convertClerkUser = async (clerkUser: any): Promise<AuthUser | null> => {
    if (!clerkUser) return null;

    try {
      // SECURITY: Get role from database instead of Clerk metadata
      // Clerk metadata is not secure in client-side components
      let role = 'END_USER' as UserRole;
      let tenantId = null;
      let isOnboarded = false;
      
      try {
        // Fetch user data from secure server endpoint
        const response = await fetch('/api/auth/current-user', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            role = data.user.role;
            tenantId = data.user.tenantId;
            isOnboarded = data.user.isOnboarded;
            console.log('🔒 Secure role loaded from database:', role);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch secure user data, using fallback:', error);
        // Fallback to metadata for backward compatibility (insecure)
        const privateMetadata = clerkUser.privateMetadata as ClerkUserMetadata;
        const publicMetadata = clerkUser.publicMetadata as ClerkUserMetadata;
        role = privateMetadata?.role || publicMetadata?.role || 'END_USER';
      }
      
      console.log('🔒 Role resolved from database:', { role, tenantId, isOnboarded });

      // Sync Clerk ID with database
      try {
        console.log('🔗 Syncing Clerk ID with database...');
        const syncResponse = await fetch('/api/auth/sync-clerk-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log('✅ Clerk ID synced:', syncData.message);
        } else {
          console.warn('⚠️ Failed to sync Clerk ID, but continuing...');
        }
      } catch (syncError) {
        console.warn('⚠️ Clerk ID sync failed, but continuing:', syncError);
      }

      // Create user object
      const authUser: AuthUser = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        role: role as UserRole,
        tenantId: tenantId,
        clientId: null, // Will be set from database if needed
        isOnboarded: isOnboarded,
        clerkUser: clerkUser,
        metadata: {
          role: role as UserRole,
          tenantId: tenantId,
          isOnboarded: isOnboarded,
        },
      };

      console.log('✅ User converted:', authUser.email, 'Role:', authUser.role);
      return authUser;

    } catch (error) {
      console.error('Error converting Clerk user:', error);
      setError('Failed to load user data');
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!userLoaded) return; // Wait for Clerk to load

      try {
        console.log('🔑 Initializing Clerk auth context...');
        setIsLoading(true);
        setError(null);

        if (isSignedIn && clerkUser && mounted) {
          console.log('✅ Clerk user found:', clerkUser.emailAddresses[0]?.emailAddress);
          const authUser = await convertClerkUser(clerkUser);
          if (mounted && authUser) {
            console.log('✅ Auth user created:', authUser.email, authUser.role);
            setUser(authUser);
          }
        } else {
          console.log('❌ No Clerk user found');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Authentication error');
        }
      } finally {
        if (mounted) {
          console.log('🏁 Clerk auth initialization complete');
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [userLoaded, isSignedIn, clerkUser]);

  const signOut = async () => {
    try {
      console.log('🚪 Starting Clerk signout...');
      setIsLoading(true);
      
      await clerkSignOut();
      setUser(null);
      setError(null);
      
      console.log('✅ Clerk signout successful');
    } catch (error) {
      console.error('❌ Signout error:', error);
      setError(error instanceof Error ? error.message : 'Signout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserMetadata = async (metadata: Partial<ClerkUserMetadata>) => {
    if (!clerkUser) return;

    try {
      // Update metadata via API route (use private metadata for security)
      const response = await fetch('/api/auth/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: clerkUser.id,
          metadata: {
            ...clerkUser.privateMetadata,
            ...metadata,
          },
          type: 'private'
        })
      });

      if (response.ok) {
        // Update local user state
        if (user) {
          setUser({
            ...user,
            ...metadata,
            metadata: {
              ...user.metadata,
              ...metadata,
            } as ClerkUserMetadata,
          });
        }
      } else {
        throw new Error('Failed to update metadata');
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
      setError('Failed to update user data');
    }
  };

  // Role hierarchy for comparison
  const ROLE_HIERARCHY: Record<UserRole, number> = {
    END_USER: 1,
    COWORK_USER: 2,    // Usuario de cowork - acceso básico al cowork
    CLIENT_ADMIN: 3,   // Admin de cliente - gestiona sus propios clientes
    COWORK_ADMIN: 4,   // Admin de cowork - gestiona el cowork completo
    SUPER_ADMIN: 5,    // Super admin - acceso a toda la plataforma
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(user?.role as UserRole);
  };

  const canAccess = (minRole: UserRole): boolean => {
    if (!user?.role) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    signOut,
    updateUserMetadata,
    hasRole,
    hasAnyRole,
    canAccess,
    clerkUser,
    session,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a ClerkAuthProvider");
  }
  return context;
}

// Compatibility hooks for existing code
export function useRoleAccess() {
  const { user } = useAuth();
  
  return {
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isCoworkAdmin: user?.role === 'COWORK_ADMIN',
    isClientAdmin: user?.role === 'CLIENT_ADMIN',
    isEndUser: user?.role === 'END_USER',
    isAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'COWORK_ADMIN',
  };
}

export function usePermissions() {
  
  return {
    hasPermission: () => true, // Simplified for now
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
    permissions: [],
  };
}
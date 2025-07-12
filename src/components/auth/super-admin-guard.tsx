"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AlertTriangle, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SuperAdminGuard({ children, fallback }: SuperAdminGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      console.log('=== SUPER ADMIN GUARD VERIFICATION ===');
      console.log('Auth loading:', authLoading);
      console.log('User:', user);

      // Wait for auth to complete
      if (authLoading) {
        console.log('Waiting for auth to complete...');
        return;
      }

      // Check if user is authenticated
      if (!user) {
        console.log('❌ No user found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      // Check if user has SUPER_ADMIN role
      if (user.role !== 'SUPER_ADMIN') {
        console.log(`❌ User role is ${user.role}, not SUPER_ADMIN`);
        router.push('/unauthorized');
        return;
      }

      console.log('✅ Super Admin access verified');
      setIsVerifying(false);
    };

    verifyAccess();
  }, [user, authLoading, router]);

  // Show loading while auth is loading
  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Verificando Acceso
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Validando permisos de Super Admin...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show unauthorized if not super admin
  if (!user || user.role !== 'SUPER_ADMIN') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-gray-600">
                Esta sección requiere permisos de <strong>Super Administrador</strong>.
              </p>
              <p className="text-sm text-gray-500">
                Tu rol actual: <span className="font-medium">{user?.role || 'No definido'}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full"
              >
                Ir al Dashboard Principal
              </Button>
              <Button 
                onClick={() => router.back()}
                variant="ghost"
                className="w-full text-gray-600"
              >
                Volver Atrás
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Si necesitas acceso de Super Admin, contacta al administrador del sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if user is super admin
  return <>{children}</>;
}

// Hook for checking super admin status
export function useSuperAdmin() {
  const { user, loading } = useAuth();
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isVerifying = loading;

  return {
    isSuperAdmin,
    isVerifying,
    user,
  };
}
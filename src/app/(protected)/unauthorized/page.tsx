"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home, Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Acceso No Autorizado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-gray-600">
              No tienes permisos para acceder a esta sección del sistema.
            </p>
            {user && (
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Usuario:</strong> {user.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Rol actual:</strong> {user.role}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">¿Necesitas acceso?</h4>
            <p className="text-sm text-gray-600">
              Si crees que deberías tener acceso a esta funcionalidad, contacta al administrador del sistema.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al Dashboard Principal
            </Button>
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver Atrás
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = 'mailto:admin@sweetspot.com?subject=Solicitud de Acceso'}
              className="text-gray-600 hover:text-gray-900"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contactar Administrador
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
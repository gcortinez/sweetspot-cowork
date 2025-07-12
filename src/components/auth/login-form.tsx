"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import type { LoginRequest } from "@/lib/validations/auth";
import { loginSchema } from "@/lib/validations/auth";

type LoginFormData = LoginRequest;

interface LoginFormProps {
  onSuccess?: (user: any, accessToken: string) => void;
  onError?: (error: string) => void;
  defaultTenantSlug?: string;
}

// Mapeo de errores comunes a mensajes amigables
const errorMessages: Record<string, string> = {
  "Invalid credentials": "Email o contraseña incorrectos",
  "Invalid email or password": "Email o contraseña incorrectos",
  "User not found": "No existe una cuenta con este email",
  "Invalid password": "La contraseña es incorrecta",
  "Account disabled": "Tu cuenta ha sido deshabilitada. Contacta al administrador",
  "Account locked": "Tu cuenta está bloqueada temporalmente por seguridad",
  "Email not verified": "Por favor verifica tu email antes de iniciar sesión",
  "Invalid tenant": "El espacio de trabajo especificado no existe",
  "User not member of tenant": "No tienes acceso a este espacio de trabajo",
  "Network request failed": "Error de conexión. Verifica tu internet",
  "Failed to fetch": "No se pudo conectar con el servidor",
  "Network error": "Error de conexión. Verifica tu internet",
  "Too many requests": "Demasiados intentos. Por favor espera unos minutos",
  "No active workspaces found for this user": "No tienes espacios de trabajo activos asociados",
  "User not found in this workspace": "No tienes acceso a este espacio de trabajo",
  "Service temporarily unavailable": "El servicio no está disponible temporalmente. Por favor intenta más tarde",
  "Unexpected token": "Error de conexión con el servidor. Por favor intenta más tarde",
};

function getErrorMessage(error: string): string {
  // Buscar coincidencias parciales en el mensaje de error
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Si no hay coincidencia, devolver un mensaje genérico
  return "Error al iniciar sesión. Por favor intenta nuevamente";
}

export function LoginForm({
  onSuccess,
  onError,
  defaultTenantSlug,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showWorkspaceField, setShowWorkspaceField] = useState(
    !!defaultTenantSlug
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantSlug: defaultTenantSlug || "",
      rememberMe: true,
    },
  });


  const onSubmit = async (data: LoginFormData) => {
    clearError();
    setLocalError(null);
    // Clear any previous form errors
    setError("root", undefined);

    console.log('📝 [FORM-V2] Form data before login:', { email: data.email, hasPassword: !!data.password, tenantSlug: data.tenantSlug, rememberMe: data.rememberMe, allFormKeys: Object.keys(data) });

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        onSuccess?.(null, ""); // Auth context handles user data
      } else {
        const errorMessage = getErrorMessage(
          result.error || "Error al iniciar sesión"
        );
        setLocalError(errorMessage);
        setError("root", { message: errorMessage });
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? getErrorMessage(err.message)
          : "Ocurrió un error inesperado. Por favor intenta más tarde";
      setLocalError(errorMessage);
      setError("root", { message: errorMessage });
      onError?.(errorMessage);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Inicia sesión en tu cuenta
        </h2>
        <p className="text-gray-600">
          Gestiona tu espacio de coworking de forma eficiente
        </p>
      </div>

      {/* Local Error Display - Top of form for visibility */}
      {localError && (
        <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-400 p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">
              {localError}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Workspace Slug - Optional */}
        {showWorkspaceField && (
          <div className="space-y-2">
            <Label htmlFor="tenantSlug" className="text-gray-700 font-medium">
              <div className="flex items-center space-x-2 mb-1">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span>Espacio de trabajo (Opcional)</span>
              </div>
            </Label>
            <Input
              id="tenantSlug"
              type="text"
              placeholder="mi-coworking"
              {...register("tenantSlug")}
              disabled={isLoading}
              className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
            {errors.tenantSlug && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.tenantSlug.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Deja vacío si no perteneces a un espacio específico
            </p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            <div className="flex items-center space-x-2 mb-1">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>Correo electrónico</span>
            </div>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            disabled={isLoading}
            className={`h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${
              errors.email ? "border-red-500" : ""
            }`}
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            <div className="flex items-center space-x-2 mb-1">
              <Lock className="h-4 w-4 text-gray-500" />
              <span>Contraseña</span>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              className={`h-12 px-4 pr-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${
                errors.password ? "border-red-500" : ""
              }`}
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
              <span className="sr-only">
                {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              </span>
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              {...register("rememberMe")}
              disabled={isLoading}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Recordarme
            </Label>
          </div>
          <a
            href="/auth/reset"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Global Error - Make it more prominent */}
        {errors.root && errors.root.message && (
          <div className="rounded-lg bg-red-50 border-2 border-red-300 p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {errors.root.message}
              </p>
              {errors.root.message?.includes("contraseña incorrectos") && (
                <p className="text-xs text-red-600 mt-1">
                  Asegúrate de que tu email y contraseña sean correctos
                </p>
              )}
              {errors.root.message?.includes("conexión") && (
                <p className="text-xs text-red-600 mt-1">
                  Verifica tu conexión a internet e intenta nuevamente
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Also show auth context error if present */}
        {error && !errors.root && (
          <div className="rounded-lg bg-orange-50 border-2 border-orange-300 p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">
                {getErrorMessage(error)}
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            <>
              Iniciar Sesión
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {/* Toggle workspace field */}
        {!defaultTenantSlug && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowWorkspaceField(!showWorkspaceField)}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors"
            >
              {showWorkspaceField
                ? "Ocultar campo de espacio de trabajo"
                : "¿Tienes un espacio de trabajo específico?"}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              ¿Nuevo en SweetSpot?
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center w-full h-12 px-6 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Crear una cuenta gratis
          </a>
        </div>
      </form>
    </div>
  );
}

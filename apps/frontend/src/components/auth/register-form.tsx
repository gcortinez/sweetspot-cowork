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
  User,
  CheckCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import type { RegisterRequest, UserRole } from "@sweetspot/shared";

const registerSchema = z
  .object({
    email: z.string().email("Por favor ingresa un email válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    tenantSlug: z.string().min(1, "El nombre del espacio es requerido"),
    role: z.enum(["END_USER", "CLIENT_ADMIN"] as const).optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: (user: any, accessToken: string) => void;
  onError?: (error: string) => void;
  defaultTenantSlug?: string;
  allowRoleSelection?: boolean;
}

export function RegisterForm({
  onSuccess,
  onError,
  defaultTenantSlug,
  allowRoleSelection = false,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantSlug: defaultTenantSlug || "",
      role: "END_USER",
      acceptTerms: false,
    },
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    clearError();

    try {
      const { confirmPassword, acceptTerms, ...registerData } = data;
      const result = await registerUser(registerData as RegisterRequest);

      if (result.success) {
        onSuccess?.(null, ""); // Auth context handles user data
      } else {
        const errorMessage = result.error || "Error al registrarse";
        setError("root", { message: errorMessage });
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error inesperado";
      setError("root", { message: errorMessage });
      onError?.(errorMessage);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["Muy débil", "Débil", "Regular", "Buena", "Fuerte"];
    return { strength, label: labels[strength - 1] || "" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Crea tu cuenta gratis
        </h2>
        <p className="text-gray-600">
          Sé de los primeros en usar nuestra plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Workspace Slug */}
        <div className="space-y-2">
          <Label htmlFor="tenantSlug" className="text-gray-700 font-medium">
            <div className="flex items-center space-x-2 mb-1">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span>Nombre de tu espacio</span>
            </div>
          </Label>
          <Input
            id="tenantSlug"
            type="text"
            placeholder="mi-coworking-genial"
            {...register("tenantSlug")}
            disabled={isLoading}
            className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
          {errors.tenantSlug && (
            <p className="text-sm text-red-600">{errors.tenantSlug.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Este será el identificador único de tu espacio
          </p>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-700 font-medium">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-gray-500" />
                <span>Nombre</span>
              </div>
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Juan"
              {...register("firstName")}
              disabled={isLoading}
              className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-gray-700 font-medium">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-gray-500" />
                <span>Apellido</span>
              </div>
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Pérez"
              {...register("lastName")}
              disabled={isLoading}
              className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

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
            className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Role Selection */}
        {allowRoleSelection && (
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-700 font-medium">
              <div className="flex items-center space-x-2 mb-1">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>Rol</span>
              </div>
            </Label>
            <select
              id="role"
              {...register("role")}
              disabled={isLoading}
              className="h-12 w-full px-4 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 transition-colors"
            >
              <option value="END_USER">Usuario</option>
              <option value="CLIENT_ADMIN">Administrador</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        )}

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
              placeholder="Crea una contraseña segura"
              {...register("password")}
              disabled={isLoading}
              className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              autoComplete="new-password"
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
          {password && (
            <div className="space-y-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 w-full rounded-full transition-colors ${
                      level <= passwordStrength.strength
                        ? passwordStrength.strength <= 2
                          ? "bg-red-500"
                          : passwordStrength.strength <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.label && (
                <p className="text-xs text-gray-600">
                  Fortaleza: {passwordStrength.label}
                </p>
              )}
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-gray-700 font-medium"
          >
            <div className="flex items-center space-x-2 mb-1">
              <Lock className="h-4 w-4 text-gray-500" />
              <span>Confirmar contraseña</span>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirma tu contraseña"
              {...register("confirmPassword")}
              disabled={isLoading}
              className="h-12 px-4 pr-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
              <span className="sr-only">
                {showConfirmPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"}
              </span>
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              {...register("acceptTerms")}
              disabled={isLoading}
              className="mt-1"
            />
            <Label
              htmlFor="acceptTerms"
              className="text-sm text-gray-600 cursor-pointer leading-relaxed"
            >
              Acepto los{" "}
              <a href="/terms" className="text-blue-600 hover:underline">
                términos y condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                política de privacidad
              </a>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Global Error */}
        {errors.root && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{errors.root.message}</p>
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
              Creando cuenta...
            </>
          ) : (
            <>
              Crear cuenta gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Sin tarjeta de crédito</p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">14 días gratis</p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Cancela cuando quieras</p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              ¿Ya tienes cuenta?
            </span>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center w-full h-12 px-6 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </form>
    </div>
  );
}

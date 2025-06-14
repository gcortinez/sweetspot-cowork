"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import type { LoginRequest } from "@sweetspot/shared";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  tenantSlug: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: (user: any, accessToken: string) => void;
  onError?: (error: string) => void;
  defaultTenantSlug?: string;
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
  const { login, isLoading, error, clearError } = useAuth();
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantSlug: defaultTenantSlug || "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();

    try {
      const result = await login(data as LoginRequest);

      if (result.success) {
        onSuccess?.(null, ""); // Auth context handles user data
      } else {
        const errorMessage = result.error || "Login failed";
        setError("root", { message: errorMessage });
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError("root", { message: errorMessage });
      onError?.(errorMessage);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t("auth.welcomeBack")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("auth.signInDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Workspace Slug - Optional */}
          {showWorkspaceField && (
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">{t("auth.workspace")} ({t("auth.optional")})</Label>
              <Input
                id="tenantSlug"
                type="text"
                placeholder={t("auth.workspacePlaceholder")}
                {...register("tenantSlug")}
                disabled={isLoading}
              />
              {errors.tenantSlug && (
                <p className="text-sm text-destructive">
                  {errors.tenantSlug.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("auth.workspaceHelper")}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.passwordPlaceholder")}
                {...register("password")}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                </span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Global Error */}
          {errors.root && (
            <div className="rounded-md bg-destructive/15 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.signingIn")}
              </>
            ) : (
              t("auth.signIn")
            )}
          </Button>
        </form>

        {/* Toggle workspace field */}
        {!defaultTenantSlug && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowWorkspaceField(!showWorkspaceField)}
              className="text-sm text-primary hover:underline"
            >
              {showWorkspaceField ? t("auth.hideWorkspace") : t("auth.showWorkspace")}
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm">
          <a href="/auth/reset" className="text-primary hover:underline">
            {t("auth.forgotPassword")}
          </a>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <a href="/auth/register" className="text-primary hover:underline">
            {t("auth.signUp")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
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
import { authAPI } from "@/lib/auth-api";
import type { ResetPasswordRequest } from "@sweetspot/shared";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  tenantSlug: z.string().min(1, "Workspace slug is required"),
});

type ResetFormData = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  defaultTenantSlug?: string;
}

export function PasswordResetForm({
  onSuccess,
  onError,
  defaultTenantSlug,
}: PasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      tenantSlug: defaultTenantSlug || "",
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);

    try {
      const response = await authAPI.resetPassword(
        data as ResetPasswordRequest
      );

      if (response.success) {
        setIsSuccess(true);
        onSuccess?.();
      } else {
        const errorMessage = response.error || "Password reset failed";
        setError("root", { message: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError("root", { message: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Check your email
          </CardTitle>
          <CardDescription className="text-center">
            We've sent a password reset link to{" "}
            <strong>{getValues("email")}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              If you don't see the email in your inbox, check your spam folder.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSuccess(false)}
            >
              Send another email
            </Button>
            <div className="text-center text-sm">
              <a href="/auth/login" className="text-primary hover:underline">
                Back to sign in
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Reset password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email and workspace to receive a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Workspace Slug */}
          <div className="space-y-2">
            <Label htmlFor="tenantSlug">Workspace</Label>
            <Input
              id="tenantSlug"
              type="text"
              placeholder="your-workspace"
              {...register("tenantSlug")}
              disabled={isLoading}
            />
            {errors.tenantSlug && (
              <p className="text-sm text-destructive">
                {errors.tenantSlug.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
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
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm">
          <a href="/auth/login" className="text-primary hover:underline">
            Back to sign in
          </a>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-primary hover:underline">
            Sign up
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

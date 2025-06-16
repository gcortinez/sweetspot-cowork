"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { GuestOnly } from "@/components/auth/auth-guard";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLoginSuccess = () => {
    // Auth context handles token storage and user data
    // Redirect to dashboard or intended page
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    router.push(redirectTo);
  };

  const handleLoginError = (error: string) => {
    // Error is already displayed in the form by the LoginForm component
    // No additional action needed here
  };

  return (
    <GuestOnly>
      <AuthLayout
        title="Bienvenido de vuelta"
        description="Accede a tu espacio de trabajo y gestiona tu coworking de manera eficiente. Tu productividad te está esperando."
      >
        <LoginForm onSuccess={handleLoginSuccess} onError={handleLoginError} />
      </AuthLayout>
    </GuestOnly>
  );
}

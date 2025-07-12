"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { GuestOnly } from "@/components/auth/auth-guard";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("workspace");

  const handleRegisterSuccess = () => {
    // Auth context handles token storage and user data
    // Redirect to dashboard or intended page
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    router.push(redirectTo);
  };

  const handleRegisterError = (error: string) => {
    console.error("Registration error:", error);
    // Error is already displayed in the form
  };

  return (
    <GuestOnly>
      <AuthLayout
        title="Únete a SweetSpot"
        description="Crea tu cuenta y comienza a gestionar tu espacio de coworking con herramientas potentes y análisis en tiempo real. Es gratis empezar."
      >
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onError={handleRegisterError}
          defaultTenantSlug={tenantSlug || undefined}
          allowRoleSelection={false} // Can be enabled for admin invites
        />
      </AuthLayout>
    </GuestOnly>
  );
}

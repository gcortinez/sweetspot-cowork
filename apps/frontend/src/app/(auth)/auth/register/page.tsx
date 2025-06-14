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
        title="Join SweetSpot"
        description="Create your account and start managing your coworking space with powerful tools and insights."
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

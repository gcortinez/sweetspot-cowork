"use client";

import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { GuestOnly } from "@/components/auth/auth-guard";

export default function ResetPage() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("workspace");

  const handleResetSuccess = () => {
    console.log("Password reset email sent successfully");
    // Success state is handled within the component
  };

  const handleResetError = (error: string) => {
    console.error("Password reset error:", error);
    // Error is already displayed in the form
  };

  return (
    <GuestOnly>
      <AuthLayout
        title="Reset Your Password"
        description="Don't worry, it happens to the best of us. Enter your email and we'll send you a link to reset your password."
      >
        <PasswordResetForm
          onSuccess={handleResetSuccess}
          onError={handleResetError}
          defaultTenantSlug={tenantSlug || undefined}
        />
      </AuthLayout>
    </GuestOnly>
  );
}

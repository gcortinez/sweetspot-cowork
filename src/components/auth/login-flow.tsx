"use client";

import { LoginForm } from "./login-form";
import { AuthRedirect } from "./auth-redirect";

interface LoginFlowProps {
  defaultTenantSlug?: string;
}

export function LoginFlow({ defaultTenantSlug }: LoginFlowProps) {
  const handleLoginSuccess = (user: any, accessToken: string) => {
    console.log('🎉 LoginFlow: Login successful for user:', user?.email);
    // Don't redirect here - AuthRedirect component will handle it automatically
  };

  const handleLoginError = (error: string) => {
    console.error('❌ LoginFlow: Login error:', error);
    // Error is already handled by LoginForm
  };

  return (
    <AuthRedirect>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <LoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              defaultTenantSlug={defaultTenantSlug}
            />
          </div>
        </div>
      </div>
    </AuthRedirect>
  );
}
"use client";

import { GuestOnly } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { useRouteGuard } from "@/lib/route-guards";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  // Use route guard to ensure guest-only access
  const { isAuthorized } = useRouteGuard(user, isLoading, {
    guestOnly: true,
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authorized (user is authenticated), the route guard will handle redirects
  if (!isAuthorized) {
    return null;
  }

  return <GuestOnly>{children}</GuestOnly>;
}

"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouteGuard } from "@/lib/route-guards";
import { AdminOnly } from "@/components/rbac/role-gate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  // Use route guard to ensure admin access
  const { isAuthorized } = useRouteGuard(user, isLoading, {
    requireAuth: true,
    minRole: "CLIENT_ADMIN",
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

  // If not authorized, the route guard will handle redirects
  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-background">
        {/* Admin Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">
                  Administrative controls and settings
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Role: {user?.role}
              </div>
            </div>
          </div>
        </header>

        {/* Admin Content */}
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </AdminOnly>
  );
}

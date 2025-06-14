"use client";

import { RequireAuth } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/navigation/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simplify - let RequireAuth handle all the authentication logic
  // Remove duplicate route guards that cause conflicts
  return (
    <RequireAuth
      loadingComponent={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <div className="flex h-screen bg-surface-secondary">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}

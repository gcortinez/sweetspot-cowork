"use client";

import { useAuth } from "@/hooks/use-auth";
import { SuperAdminDashboard } from "./super-admin-dashboard";
import { CoworkAdminDashboard } from "./cowork-admin-dashboard";
import { EndUserDashboard } from "./end-user-dashboard";
import { ClientAdminPanel } from "@/components/rbac/admin-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

interface AdaptiveDashboardProps {
  className?: string;
}

export function AdaptiveDashboard({ className = "" }: AdaptiveDashboardProps) {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`min-h-screen bg-background flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <div
        className={`min-h-screen bg-background flex items-center justify-center ${className}`}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please log in to access your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case "SUPER_ADMIN":
      return <SuperAdminDashboard className={className} />;

    case "COWORK_ADMIN":
      return <CoworkAdminDashboard className={className} />;

    case "CLIENT_ADMIN":
      // Client Admin gets a combination of admin tools and user features
      return (
        <div className={`space-y-8 ${className}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Client Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage your team and workspace</p>
          </div>

          {/* Admin Panel for Client Admin specific features */}
          <ClientAdminPanel
            title="Team Management"
            description="Manage your team members and settings"
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Client admin features will be implemented here.
              </p>
            </div>
          </ClientAdminPanel>

          {/* End User features for personal use */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Personal Workspace</h2>
            <EndUserDashboard />
          </div>
        </div>
      );

    case "END_USER":
      return <EndUserDashboard className={className} />;

    default:
      return (
        <div
          className={`min-h-screen bg-background flex items-center justify-center ${className}`}
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Unknown Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your user role ({user.role}) is not recognized. Please contact
                support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
  }
}

// Export individual dashboards for direct use if needed
export { SuperAdminDashboard, CoworkAdminDashboard, EndUserDashboard };

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Shield, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { getDefaultRedirectForRole } from "@/lib/route-guards";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("required");
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Administrator";
      case "COWORK_ADMIN":
        return "Cowork Administrator";
      case "CLIENT_ADMIN":
        return "Client Administrator";
      case "END_USER":
        return "End User";
      default:
        return role;
    }
  };

  const getDefaultRedirect = () => {
    if (user) {
      return getDefaultRedirectForRole(user.role);
    }
    return "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredRole && (
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">Required Access Level:</h4>
              <p className="text-sm text-muted-foreground">
                {getRoleDisplayName(requiredRole)}
              </p>
            </div>
          )}

          {user && (
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">Your Current Access Level:</h4>
              <p className="text-sm text-muted-foreground">
                {getRoleDisplayName(user.role)}
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              If you believe you should have access to this resource, please
              contact your administrator.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href={getDefaultRedirect()}>
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}

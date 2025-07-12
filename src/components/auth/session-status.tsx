"use client";

import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface SessionStatusProps {
  variant?: "card" | "inline" | "minimal";
  showRefreshButton?: boolean;
  className?: string;
}

export function SessionStatus({
  variant = "inline",
  showRefreshButton = true,
  className = "",
}: SessionStatusProps) {
  const { sessionStatus, refreshSession, formatTimeUntilExpiry } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } catch (error) {
      console.error("Failed to refresh session:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!sessionStatus.isValid) {
    return null; // Don't show anything if session is invalid
  }

  const getStatusColor = () => {
    if (sessionStatus.isExpiringSoon) return "text-orange-600";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (sessionStatus.isExpiringSoon) {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
    return <Clock className="h-4 w-4 text-green-600" />;
  };

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon()}
            Session Status
          </CardTitle>
          <CardDescription>
            Your session information and expiry details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {sessionStatus.isExpiringSoon ? "Expiring Soon" : "Active"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expires in:</span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {formatTimeUntilExpiry(sessionStatus.timeUntilExpiry)}
            </span>
          </div>

          {sessionStatus.expiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expires at:</span>
              <span className="text-sm">
                {new Date(sessionStatus.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Session
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        {getStatusIcon()}
        <span className={getStatusColor()}>
          {formatTimeUntilExpiry(sessionStatus.timeUntilExpiry)}
        </span>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-muted-foreground">
          Session expires in:
        </span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {formatTimeUntilExpiry(sessionStatus.timeUntilExpiry)}
        </span>
      </div>

      {showRefreshButton && sessionStatus.isExpiringSoon && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Convenience components for different use cases
export function SessionStatusCard(props: Omit<SessionStatusProps, "variant">) {
  return <SessionStatus {...props} variant="card" />;
}

export function SessionStatusInline(
  props: Omit<SessionStatusProps, "variant">
) {
  return <SessionStatus {...props} variant="inline" />;
}

export function SessionStatusMinimal(
  props: Omit<SessionStatusProps, "variant">
) {
  return <SessionStatus {...props} variant="minimal" />;
}

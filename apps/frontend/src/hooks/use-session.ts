import { useState, useEffect } from "react";
import { sessionManager } from "@/lib/session-manager";

export interface SessionStatus {
  isValid: boolean;
  expiresAt: number | null;
  timeUntilExpiry: number | null;
  isExpiringSoon: boolean;
}

export function useSession() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    isValid: false,
    expiresAt: null,
    timeUntilExpiry: null,
    isExpiringSoon: false,
  });

  useEffect(() => {
    const updateSessionStatus = () => {
      const status = sessionManager.getSessionStatus();
      const isExpiringSoon =
        status.timeUntilExpiry !== null &&
        status.timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

      setSessionStatus({
        ...status,
        isExpiringSoon,
      });
    };

    // Initial update
    updateSessionStatus();

    // Update every minute
    const interval = setInterval(updateSessionStatus, 60 * 1000);

    // Listen to session events
    const handleSessionRefreshed = () => updateSessionStatus();
    const handleSessionCleared = () => updateSessionStatus();
    const handleSessionExpired = () => updateSessionStatus();

    sessionManager.on("sessionRefreshed", handleSessionRefreshed);
    sessionManager.on("sessionCleared", handleSessionCleared);
    sessionManager.on("sessionExpired", handleSessionExpired);

    return () => {
      clearInterval(interval);
      sessionManager.off("sessionRefreshed");
      sessionManager.off("sessionCleared");
      sessionManager.off("sessionExpired");
    };
  }, []);

  const refreshSession = async () => {
    return await sessionManager.refreshSession();
  };

  const clearSession = () => {
    sessionManager.clearSession();
  };

  const formatTimeUntilExpiry = (timeMs: number | null): string => {
    if (timeMs === null || timeMs <= 0) return "Expired";

    const minutes = Math.floor(timeMs / (60 * 1000));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return {
    sessionStatus,
    refreshSession,
    clearSession,
    formatTimeUntilExpiry,
  };
}

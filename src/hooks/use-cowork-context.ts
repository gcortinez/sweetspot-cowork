"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { UserCowork } from "@/components/ui/cowork-selector";

interface CoworkContextData {
  userCoworks: UserCowork[];
  activeCowork: UserCowork | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  fetchUserCoworks: () => Promise<void>;
  changeActiveCowork: (cowork: UserCowork) => Promise<void>;
  refreshContext: () => Promise<void>;
}

const CoworkContext = createContext<CoworkContextData | null>(null);

export function useCoworkContext() {
  const context = useContext(CoworkContext);
  if (!context) {
    throw new Error("useCoworkContext must be used within a CoworkProvider");
  }
  return context;
}

export function useCoworkContextHook() {
  const [userCoworks, setUserCoworks] = useState<UserCowork[]>([]);
  const [activeCowork, setActiveCowork] = useState<UserCowork | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(activeCowork ? { "x-active-cowork": activeCowork.id } : {}),
    };
  }, [activeCowork]);

  const fetchUserCoworks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch("http://localhost:3001/api/auth/coworks", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user coworks: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUserCoworks(data.data.userCoworks || []);
        setIsSuperAdmin(data.data.isSuperAdmin || false);
        
        // Si no hay cowork activo y hay un cowork por defecto, establecerlo
        if (!activeCowork && data.data.defaultCowork) {
          setActiveCowork(data.data.defaultCowork);
          localStorage.setItem("activeCowork", JSON.stringify(data.data.defaultCowork));
        }
      } else {
        throw new Error(data.error || "Failed to fetch user coworks");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching user coworks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCowork]);

  const changeActiveCowork = useCallback(async (cowork: UserCowork) => {
    try {
      setActiveCowork(cowork);

      // Guardar en localStorage para persistencia
      localStorage.setItem("activeCowork", JSON.stringify(cowork));

      // Notificar al backend del cambio (opcional)
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          await fetch("http://localhost:3001/api/auth/set-active-cowork", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ coworkId: cowork.id }),
          });
        } catch (err) {
          console.warn("Failed to notify backend of cowork change:", err);
          // No es crítico si esto falla
        }
      }

      console.log(`✅ Active cowork changed to: ${cowork.name} (${cowork.id})`);
    } catch (err) {
      console.error("Error changing active cowork:", err);
      setError("Failed to change active cowork");
    }
  }, []);

  const refreshContext = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch("http://localhost:3001/api/auth/context", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch context: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUserCoworks(data.data.userCoworks || []);
        setIsSuperAdmin(data.data.isSuperAdmin || false);
        
        if (data.data.activeCowork) {
          setActiveCowork(data.data.activeCowork);
          localStorage.setItem("activeCowork", JSON.stringify(data.data.activeCowork));
        }
      } else {
        throw new Error(data.error || "Failed to fetch context");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error refreshing context:", err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    // Cargar cowork activo del localStorage al inicializar
    const savedActiveCowork = localStorage.getItem("activeCowork");
    if (savedActiveCowork) {
      try {
        const parsed = JSON.parse(savedActiveCowork);
        setActiveCowork(parsed);
      } catch (err) {
        console.error("Error parsing saved active cowork:", err);
        localStorage.removeItem("activeCowork");
      }
    }

    fetchUserCoworks();
  }, [fetchUserCoworks]);

  return {
    userCoworks,
    activeCowork,
    isSuperAdmin,
    isLoading,
    error,
    fetchUserCoworks,
    changeActiveCowork,
    refreshContext,
  };
}

export { CoworkContext };
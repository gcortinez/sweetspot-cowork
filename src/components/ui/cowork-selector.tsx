"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Building2, Check, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface UserCowork {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
}

export interface CoworkSelectorProps {
  userCoworks: UserCowork[];
  activeCowork: UserCowork | null;
  isSuperAdmin: boolean;
  onCoworkChange: (cowork: UserCowork) => void;
  isLoading?: boolean;
  className?: string;
}

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  COWORK_ADMIN: "Admin",
  CLIENT_ADMIN: "Client Admin",
  END_USER: "Usuario",
};

const roleColors = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  COWORK_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  CLIENT_ADMIN: "bg-green-100 text-green-800 border-green-200", 
  END_USER: "bg-gray-100 text-gray-800 border-gray-200",
};

export function CoworkSelector({
  userCoworks,
  activeCowork,
  isSuperAdmin,
  onCoworkChange,
  isLoading = false,
  className,
}: CoworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Si no hay coworks disponibles
  if (!userCoworks || userCoworks.length === 0) {
    if (isSuperAdmin) {
      return (
        <div className={cn("flex items-center gap-3 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200", className)}>
          <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Crown className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-purple-900">Super Admin Global</span>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 w-fit">
              Sin cowork asignado
            </Badge>
          </div>
        </div>
      );
    }
    
    return (
      <div className={cn("flex items-center gap-2 text-gray-500", className)}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Sin coworks asignados</span>
      </div>
    );
  }

  // Si solo hay un cowork, mostrarlo sin dropdown
  if (userCoworks.length === 1 && !isSuperAdmin) {
    const singleCowork = userCoworks[0];
    return (
      <div className={cn("flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border", className)}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{singleCowork.name}</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={cn("text-xs", roleColors[singleCowork.role])}>
                {roleLabels[singleCowork.role]}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-3 px-3 py-2 h-auto justify-between min-w-[200px] bg-white hover:bg-gray-50 border-gray-200",
            isLoading && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              {isSuperAdmin ? (
                <Crown className="h-4 w-4 text-purple-600" />
              ) : (
                <Building2 className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">
                {activeCowork ? activeCowork.name : "Seleccionar cowork"}
              </span>
              {activeCowork && (
                <Badge variant="outline" className={cn("text-xs", roleColors[activeCowork.role])}>
                  {roleLabels[activeCowork.role]}
                </Badge>
              )}
            </div>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-[280px] p-1" 
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5">
          <Users className="h-4 w-4 text-gray-500" />
          <span>Seleccionar Cowork</span>
          {isSuperAdmin && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Super Admin
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        <div className="max-h-[300px] overflow-y-auto">
          {userCoworks.map((cowork) => (
            <DropdownMenuItem
              key={cowork.id}
              className={cn(
                "flex items-center gap-3 px-2 py-3 cursor-pointer focus:bg-blue-50",
                activeCowork?.id === cowork.id && "bg-blue-50 text-blue-900"
              )}
              onClick={() => {
                onCoworkChange(cowork);
                setIsOpen(false);
              }}
            >
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {cowork.name}
                  </span>
                  {activeCowork?.id === cowork.id && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", roleColors[cowork.role])}
                  >
                    {roleLabels[cowork.role]}
                  </Badge>
                  <span className="text-xs text-gray-500 truncate">
                    {cowork.slug}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        {userCoworks.length === 0 && (
          <div className="flex items-center justify-center py-6 text-gray-500">
            <div className="text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hay coworks disponibles</p>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook personalizado para manejar el estado del selector
export function useCoworkSelector() {
  const [userCoworks, setUserCoworks] = useState<UserCowork[]>([]);
  const [activeCowork, setActiveCowork] = useState<UserCowork | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCoworks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/auth/coworks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user coworks');
      }

      const data = await response.json();
      
      if (data.success) {
        setUserCoworks(data.data.userCoworks || []);
        setActiveCowork(data.data.defaultCowork || null);
        setIsSuperAdmin(data.data.isSuperAdmin || false);
      } else {
        throw new Error(data.error || 'Failed to fetch user coworks');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching user coworks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const changeActiveCowork = async (cowork: UserCowork) => {
    try {
      setActiveCowork(cowork);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('activeCowork', JSON.stringify(cowork));
      
      // Aquí podrías hacer una llamada a la API para persistir el cambio
      // await fetch('/api/auth/set-active-cowork', { ... });
      
    } catch (err) {
      console.error('Error changing active cowork:', err);
      setError('Failed to change active cowork');
    }
  };

  useEffect(() => {
    // Cargar cowork activo del localStorage al inicializar
    const savedActiveCowork = localStorage.getItem('activeCowork');
    if (savedActiveCowork) {
      try {
        setActiveCowork(JSON.parse(savedActiveCowork));
      } catch (err) {
        console.error('Error parsing saved active cowork:', err);
      }
    }

    fetchUserCoworks();
  }, []);

  return {
    userCoworks,
    activeCowork,
    isSuperAdmin,
    isLoading,
    error,
    fetchUserCoworks,
    changeActiveCowork,
  };
}
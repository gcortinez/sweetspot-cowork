"use client";

import React from "react";
import { Button } from "./button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./dropdown-menu";
import { useTheme } from "@/contexts/theme-context";
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Crown,
  Building2,
  Home,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: "icon" | "button" | "dropdown";
}

export function ThemeToggle({ 
  className, 
  showLabel = false,
  variant = "icon" 
}: ThemeToggleProps) {
  const { 
    config, 
    setMode, 
    setContext, 
    toggleMode, 
    currentMode,
    isSystemMode 
  } = useTheme();

  const getModeIcon = () => {
    if (isSystemMode) return Monitor;
    return currentMode === 'dark' ? Moon : Sun;
  };

  const getContextIcon = () => {
    switch (config.context) {
      case 'super-admin':
        return Crown;
      case 'cowork':
        return Building2;
      default:
        return Home;
    }
  };

  if (variant === "icon") {
    const ModeIcon = getModeIcon();
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMode}
        className={cn("text-gray-500 hover:text-gray-700", className)}
        title={`Cambiar a modo ${currentMode === 'light' ? 'oscuro' : 'claro'}`}
      >
        <ModeIcon className="h-4 w-4" />
        {showLabel && (
          <span className="ml-2">
            {isSystemMode ? 'Sistema' : currentMode === 'dark' ? 'Oscuro' : 'Claro'}
          </span>
        )}
      </Button>
    );
  }

  if (variant === "button") {
    const ModeIcon = getModeIcon();
    const ContextIcon = getContextIcon();
    
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMode}
          className="flex items-center gap-2"
        >
          <ModeIcon className="h-4 w-4" />
          {showLabel && (
            <span>
              {isSystemMode ? 'Sistema' : currentMode === 'dark' ? 'Oscuro' : 'Claro'}
            </span>
          )}
        </Button>
        
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
          <ContextIcon className="h-3 w-3" />
          {showLabel && (
            <span>
              {config.context === 'super-admin' ? 'Super Admin' : 
               config.context === 'cowork' ? 'Cowork' : 'General'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // variant === "dropdown"
  const ModeIcon = getModeIcon();
  const ContextIcon = getContextIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 text-gray-500 hover:text-gray-700",
            className
          )}
        >
          <div className="flex items-center gap-1">
            <ModeIcon className="h-4 w-4" />
            <ContextIcon className="h-3 w-3" />
          </div>
          {showLabel && <span>Tema</span>}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Configuración de Tema
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
          Modo de Color
        </DropdownMenuLabel>
        
        <DropdownMenuRadioGroup value={config.mode} onValueChange={(value) => setMode(value as ThemeMode)}>
          <DropdownMenuRadioItem value="light" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Claro</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Oscuro</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>Sistema</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
          Contexto Visual
        </DropdownMenuLabel>
        
        <DropdownMenuRadioGroup value={config.context} onValueChange={(value) => setContext(value as ThemeContextType)}>
          <DropdownMenuRadioItem value="default" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>General</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="cowork" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Cowork</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="super-admin" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span>Super Admin</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <div className="text-xs text-gray-500 mb-2">Estado Actual:</div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <ModeIcon className="h-3 w-3" />
              <span className="text-xs">
                {isSystemMode ? 'Sistema' : currentMode === 'dark' ? 'Oscuro' : 'Claro'}
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1">
              <ContextIcon className="h-3 w-3" />
              <span className="text-xs">
                {config.context === 'super-admin' ? 'Super Admin' : 
                 config.context === 'cowork' ? 'Cowork' : 'General'}
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick theme mode toggle for simple use cases
export function QuickThemeToggle({ className }: { className?: string }) {
  const { toggleMode, currentMode } = useTheme();
  const Icon = currentMode === 'dark' ? Sun : Moon;
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMode}
      className={cn("text-gray-500 hover:text-gray-700", className)}
      title={`Cambiar a modo ${currentMode === 'light' ? 'oscuro' : 'claro'}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
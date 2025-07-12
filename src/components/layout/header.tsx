"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CoworkSelector } from "@/components/ui/cowork-selector";
import { ContextBreadcrumbs } from "@/components/ui/context-breadcrumbs";
import { MobileBreadcrumbs } from "@/components/ui/mobile-breadcrumbs";
import { QuickThemeToggle } from "@/components/ui/theme-toggle";
import { useCoworkContextOptional } from "@/providers/cowork-provider";
import { useAuth } from "@/hooks/use-auth";
import {
  Building2,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Crown,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  showMobileMenuButton?: boolean;
}

export function Header({ 
  onMobileMenuToggle, 
  isMobileMenuOpen = false,
  showMobileMenuButton = true 
}: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Cowork context - usar el hook opcional que no lanza errores  
  const coworkContextOptional = useCoworkContextOptional();
  
  // Si no hay contexto, usar valores por defecto
  const coworkContext = coworkContextOptional || {
    userCoworks: [],
    activeCowork: null,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isLoading: false,
    error: null,
    changeActiveCowork: async () => {},
    isInitialized: true,
    fetchUserCoworks: async () => {},
    refreshContext: async () => {},
    clearError: () => {},
    hasMultipleCoworks: false,
    canAccessCowork: () => false,
    getCoworkById: () => null,
    getCurrentCoworkRole: () => null,
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setIsUserMenuOpen(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <header className={cn(
      "border-b shadow-sm sticky top-0 z-40 transition-colors duration-200",
      isSuperAdmin
        ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700"
        : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"
    )}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          {showMobileMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className={cn(
                "lg:hidden transition-colors duration-200",
                isSuperAdmin
                  ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Logo (visible en mobile cuando sidebar está cerrado) */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 lg:hidden group"
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200",
              isSuperAdmin
                ? "bg-gradient-to-br from-purple-600 to-purple-700"
                : "bg-gradient-to-br from-blue-600 to-blue-700"
            )}>
              {isSuperAdmin ? (
                <Crown className="h-4 w-4 text-white" />
              ) : (
                <Building2 className="h-4 w-4 text-white" />
              )}
            </div>
            <span className={cn(
              "text-lg font-bold transition-colors duration-200",
              isSuperAdmin
                ? "text-purple-900 group-hover:text-purple-600 dark:text-purple-100 dark:group-hover:text-purple-300"
                : "text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
            )}>
              SweetSpot
            </span>
          </Link>

          {/* Context Breadcrumbs - Desktop */}
          <ContextBreadcrumbs
            className="hidden md:flex"
            showHomeIcon={true}
            maxItems={4}
            showCoworkBadge={false}
            showRefreshButton={false}
          />

          {/* Mobile Breadcrumbs */}
          <MobileBreadcrumbs className="md:hidden" />
        </div>

        {/* Center Section - Cowork Selector */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-md">
          {coworkContext.userCoworks.length > 0 && (
            <CoworkSelector
              userCoworks={coworkContext.userCoworks}
              activeCowork={coworkContext.activeCowork}
              isSuperAdmin={coworkContext.isSuperAdmin}
              onCoworkChange={coworkContext.changeActiveCowork}
              isLoading={coworkContext.isLoading}
              className="w-full max-w-sm"
            />
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-colors duration-200",
                isSuperAdmin
                  ? "text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-colors duration-200",
                isSuperAdmin
                  ? "text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <Bell className="h-4 w-4" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* Quick Create */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden md:flex transition-colors duration-200",
                isSuperAdmin
                  ? "text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <QuickThemeToggle />
          </div>

          {/* User Menu */}
          <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 h-auto transition-colors duration-200",
                  isSuperAdmin
                    ? "hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shadow-sm",
                    isSuperAdmin
                      ? "bg-gradient-to-br from-purple-600 to-purple-700"
                      : "bg-gradient-to-br from-blue-600 to-blue-700"
                  )}>
                    {isSuperAdmin ? (
                      <Crown className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-sm font-semibold text-white">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={cn(
                      "text-sm font-medium truncate max-w-[120px]",
                      isSuperAdmin
                        ? "text-purple-900 dark:text-purple-100"
                        : "text-gray-900 dark:text-gray-100"
                    )}>
                      {user?.email?.split('@')[0] || "Usuario"}
                    </p>
                    <div className="flex items-center gap-1">
                      {isSuperAdmin && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          Super Admin
                        </Badge>
                      )}
                      {!isSuperAdmin && coworkContext.activeCowork && (
                        <span className="text-xs text-gray-500 truncate">
                          {coworkContext.activeCowork.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-500 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  {isSuperAdmin ? (
                    <Crown className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.email?.split('@')[0] || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />

              {/* Cowork Selector en mobile */}
              <div className="lg:hidden p-2">
                {coworkContext.userCoworks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2 px-2">
                      Cambiar Cowork
                    </p>
                    <CoworkSelector
                      userCoworks={coworkContext.userCoworks}
                      activeCowork={coworkContext.activeCowork}
                      isSuperAdmin={coworkContext.isSuperAdmin}
                      onCoworkChange={coworkContext.changeActiveCowork}
                      isLoading={coworkContext.isLoading}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="lg:hidden" />

              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                  <span className="ml-auto h-2 w-2 bg-red-500 rounded-full"></span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Cowork Selector (sticky debajo del header principal) */}
      <div className="lg:hidden border-t border-gray-100 bg-gray-50 px-4 py-2">
        {coworkContext.userCoworks.length > 0 && (
          <CoworkSelector
            userCoworks={coworkContext.userCoworks}
            activeCowork={coworkContext.activeCowork}
            isSuperAdmin={coworkContext.isSuperAdmin}
            onCoworkChange={coworkContext.changeActiveCowork}
            isLoading={coworkContext.isLoading}
            className="w-full"
          />
        )}
      </div>
    </header>
  );
}
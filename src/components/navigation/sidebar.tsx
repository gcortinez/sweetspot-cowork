"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useCoworkContextOptional } from "@/contexts/cowork-context";
import { CoworkSelector } from "@/components/ui/cowork-selector";
import {
  Calendar,
  Users,
  Building2,
  Settings,
  BarChart3,
  Plus,
  Home,
  CreditCard,
  User,
  Bell,
  HelpCircle,
  LogOut,
  UserCheck,
  Target,
  Activity,
  ArrowRightLeft,
  Shield,
  Database,
  DollarSign,
  Eye,
  Zap,
  TrendingUp,
  FileText,
  Crown,
  ChevronDown,
  ChevronRight,
  Layers,
  Users2,
  Clock,
  Banknote,
  Settings2,
  Headphones
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

// Main navigation sections with better hierarchy
const getCoreItems = (t: (key: string) => string) => [
  {
    title: t("nav.dashboard"),
    href: "/dashboard",
    icon: Home,
    description: "Resumen general",
  },
  {
    title: "Instalaciones",
    href: "/spaces", 
    icon: Building2,
    description: "Gestión de espacios",
  },
  {
    title: t("nav.bookings"),
    href: "/bookings",
    icon: Calendar,
    description: "Reservas y horarios",
  },
  {
    title: "Miembros",
    href: "/members",
    icon: Users2,
    description: "Usuarios y clientes",
  },
];

const getBusinessItems = (t: (key: string) => string) => [
  {
    title: t("nav.analytics"),
    href: "/analytics",
    icon: TrendingUp,
    description: "Métricas y reportes",
  },
  {
    title: "Facturación",
    href: "/billing",
    icon: Banknote,
    description: "Pagos e invoices",
  },
];

const getAdminItems = () => [
  {
    title: "Gestionar Reservas",
    href: "/admin/booking-management",
    icon: Calendar,
    description: "Aprobar y gestionar reservas",
  },
];

const getAccountItems = (t: (key: string) => string) => [
  {
    title: t("nav.profile"),
    href: "/profile",
    icon: User,
    description: "Perfil personal",
  },
  {
    title: t("nav.notifications"),
    href: "/notifications",
    icon: Bell,
    description: "Alertas y avisos",
  },
  {
    title: "Configuración",
    href: "/settings",
    icon: Settings2,
    description: "Preferencias",
  },
];

const getCrmItems = (t: (key: string) => string) => [
  {
    title: "Clientes",
    href: "/clients",
    icon: Building2,
    description: "Gestión de clientes",
  },
  {
    title: "Prospectos",
    href: "/leads",
    icon: UserCheck,
    description: "Leads y contactos",
  },
  {
    title: "Oportunidades",
    href: "/opportunities",
    icon: Target,
    description: "Ventas potenciales",
  },
  {
    title: "Actividades",
    href: "/activities",
    icon: Clock,
    description: "Seguimiento CRM",
  },
  {
    title: "Conversiones",
    href: "/conversions",
    icon: ArrowRightLeft,
    description: "Métricas de venta",
  },
];

const getSupportItems = (t: (key: string) => string) => [
  {
    title: t("nav.help"),
    href: "/help",
    icon: Headphones,
    description: "Centro de ayuda",
  },
];

const getSuperAdminItems = () => [
  {
    title: "Panel Principal",
    href: "/super-admin",
    icon: Crown,
    description: "Dashboard ejecutivo",
  },
  {
    title: "Gestión de Coworks",
    href: "/super-admin/coworks",
    icon: Layers,
    description: "Administrar espacios",
  },
  {
    title: "Analytics del Sistema",
    href: "/super-admin/analytics",
    icon: TrendingUp,
    description: "Métricas globales",
  },
  {
    title: "Facturación Global",
    href: "/super-admin/billing",
    icon: DollarSign,
    description: "Finanzas del sistema",
  },
  {
    title: "Centro de Seguridad",
    href: "/super-admin/security",
    icon: Shield,
    description: "Monitoreo y alertas",
  },
];

// Section component for better organization
interface SidebarSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  colorScheme?: 'default' | 'purple' | 'blue' | 'green';
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  isCollapsible = false,
  defaultExpanded = true,
  colorScheme = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const colorClasses = {
    default: "text-gray-500 dark:text-gray-400",
    purple: "text-purple-600 dark:text-purple-400",
    blue: "text-blue-600 dark:text-blue-400", 
    green: "text-green-600 dark:text-green-400"
  };

  const handleToggle = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="mt-6">
      <div 
        className={cn(
          "px-6 py-2 flex items-center gap-2 cursor-pointer group transition-colors duration-200",
          isCollapsible && "hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg mx-3 px-3"
        )}
        onClick={handleToggle}
      >
        {Icon && <Icon className={cn("h-3 w-3", colorClasses[colorScheme])} />}
        <h3 className={cn(
          "text-xs font-semibold uppercase tracking-wider flex-1",
          colorClasses[colorScheme]
        )}>
          {title}
        </h3>
        {isCollapsible && (
          <div className={cn("transition-transform duration-200", isExpanded ? "rotate-90" : "")}>
            <ChevronRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      {(!isCollapsible || isExpanded) && (
        <div className="mt-1">
          {children}
        </div>
      )}
    </div>
  );
};

// Navigation item component with enhanced design
interface NavigationItemProps {
  item: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
  };
  isActive: boolean;
  onCloseMobile?: () => void;
  colorScheme?: 'default' | 'purple';
  showDescription?: boolean;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ 
  item, 
  isActive, 
  onCloseMobile, 
  colorScheme = 'default',
  showDescription = false 
}) => {
  const Icon = item.icon;
  
  const colorClasses = {
    default: {
      active: "bg-blue-100 text-blue-700 shadow-sm border border-blue-200",
      inactive: "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm",
      icon: isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
    },
    purple: {
      active: "bg-purple-50 text-purple-700 shadow-sm border border-purple-200 border-l-2 border-l-purple-500",
      inactive: "text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm border-l-2 border-l-transparent hover:border-l-purple-300",
      icon: isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600"
    }
  };

  return (
    <Link
      href={item.href}
      onClick={onCloseMobile}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group mx-3",
        isActive ? colorClasses[colorScheme].active : colorClasses[colorScheme].inactive
      )}
    >
      <Icon className={cn("h-5 w-5 transition-colors flex-shrink-0", colorClasses[colorScheme].icon)} />
      <div className="flex-1 min-w-0">
        <span className="block truncate">{item.title}</span>
        {showDescription && item.description && (
          <span className="text-xs text-gray-500 block truncate mt-0.5">
            {item.description}
          </span>
        )}
      </div>
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ className, onCloseMobile }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);

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
    isSuperAdminWithoutCowork: user?.role === 'SUPER_ADMIN' && (!user?.tenantId || user.tenantId === null),
    isSuperAdminWithMultipleCoworks: false,
    hasCoworkAccess: !!user?.tenantId && user?.role !== 'SUPER_ADMIN',
  };

  const handleNewBooking = () => {
    toast({
      title: "Funcionalidad próximamente disponible",
      description: "La funcionalidad de nueva reserva estará disponible en una próxima actualización",
    });
  };

  const coreItems = getCoreItems(t);
  const businessItems = getBusinessItems(t);
  const adminItems = getAdminItems();
  const crmItems = getCrmItems(t);
  const accountItems = getAccountItems(t);
  const supportItems = getSupportItems(t);
  const superAdminItems = getSuperAdminItems();

  // Check user roles
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'COWORK_ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r shadow-md transition-colors duration-200",
        isSuperAdmin
          ? "bg-gradient-to-b from-purple-50 to-purple-25 border-purple-200 dark:from-purple-900/20 dark:to-purple-900/10 dark:border-purple-700"
          : "bg-gradient-to-b from-slate-50 to-white border-gray-200 dark:from-gray-900 dark:to-gray-900 dark:border-gray-700",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className={cn(
        "flex h-16 items-center px-6 border-b shadow-sm transition-colors duration-200",
        isSuperAdmin
          ? "border-purple-200 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/30 dark:to-purple-900/20 dark:border-purple-700"
          : "border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105",
            isSuperAdmin
              ? "bg-gradient-to-br from-purple-600 to-purple-700"
              : "bg-gradient-to-br from-blue-600 to-blue-700"
          )}>
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-lg font-bold transition-colors leading-tight",
              isSuperAdmin
                ? "text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400"
                : "text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
            )}>
              SweetSpot
            </span>
            <span className={cn(
              "text-xs transition-colors",
              isSuperAdmin
                ? "text-gray-500 group-hover:text-purple-500 dark:text-gray-400 dark:group-hover:text-purple-400"
                : "text-gray-500 group-hover:text-blue-500 dark:text-gray-400 dark:group-hover:text-blue-400"
            )}>
              Cowork Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Cowork Context Indicator */}
      {coworkContext.activeCowork && (
        <div className={cn(
          "mx-3 my-3 px-3 py-3 rounded-xl border",
          isSuperAdmin
            ? "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/40 dark:to-purple-900/30 dark:border-purple-700"
            : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/40 dark:to-blue-900/30 dark:border-blue-700"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
              isSuperAdmin ? "bg-purple-500" : "bg-blue-500"
            )}>
              {coworkContext.isSuperAdmin ? (
                <Crown className="h-4 w-4 text-white" />
              ) : (
                <Building2 className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "font-medium truncate text-sm",
                isSuperAdmin
                  ? "text-purple-900 dark:text-purple-100"
                  : "text-blue-900 dark:text-blue-100"
              )}>
                {coworkContext.activeCowork.name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isSuperAdmin ? "bg-purple-500" : "bg-blue-500"
                )}></div>
                <p className={cn(
                  "text-xs",
                  isSuperAdmin
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-blue-600 dark:text-blue-400"
                )}>
                  {coworkContext.isSuperAdmin ? 'Super Admin' : coworkContext.activeCowork.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Button - Only show when user has cowork access */}
      {coworkContext.hasCoworkAccess && (
        <div className={cn("px-3 py-3", !coworkContext.activeCowork && "mt-3")}>
          <Button
            className={cn(
              "w-full justify-start gap-3 h-11 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium rounded-xl hover:scale-[1.02]",
              isSuperAdmin
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            )}
            onClick={handleNewBooking}
          >
            <div className="h-5 w-5 rounded-md bg-white/20 flex items-center justify-center">
              <Plus className="h-3 w-3" />
            </div>
            <span>Nueva Reserva</span>
            <div className="ml-auto">
              <Zap className="h-3 w-3" />
            </div>
          </Button>
        </div>
      )}

      {/* Navigation - Contextual sections based on user role and cowork access */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Super Admin Section - Always first for super admins */}
        {isSuperAdmin && (
          <SidebarSection 
            title="Super Admin" 
            icon={Crown}
            colorScheme="purple"
            isCollapsible={true}
            defaultExpanded={pathname.startsWith('/super-admin') || coworkContext.isSuperAdminWithoutCowork}
          >
            <div className="bg-purple-25 rounded-xl mx-3 p-2 mb-2 dark:bg-purple-900/40">
              <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                <Shield className="h-3 w-3" />
                <span className="font-medium">
                  {coworkContext.isSuperAdminWithoutCowork 
                    ? "Modo Global Activo" 
                    : "Panel Super Admin"}
                </span>
              </div>
            </div>
            <nav className="space-y-1">
              {superAdminItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <NavigationItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    onCloseMobile={onCloseMobile}
                    colorScheme="purple"
                    showDescription={showDescriptions}
                  />
                );
              })}
            </nav>
          </SidebarSection>
        )}

        {/* Cowork Context Selector for Multi-Tenant Super Admins */}
        {isSuperAdmin && coworkContext.isSuperAdminWithMultipleCoworks && (
          <div className="mx-3 mb-4">
            <div className="text-xs font-medium text-gray-600 mb-2 px-1">Seleccionar Cowork</div>
            <CoworkSelector
              userCoworks={coworkContext.userCoworks}
              activeCowork={coworkContext.activeCowork}
              isSuperAdmin={true}
              onCoworkChange={coworkContext.changeActiveCowork}
              isLoading={coworkContext.isLoading}
              className="w-full"
            />
          </div>
        )}

        {/* Cowork Operations Section - Only visible when user has cowork access */}
        {coworkContext.hasCoworkAccess && (
          <>
            {/* Core Cowork Section */}
            <SidebarSection 
              title={coworkContext.activeCowork ? `${coworkContext.activeCowork.name}` : "Cowork"} 
              icon={Building2}
              colorScheme={isSuperAdmin ? "purple" : "blue"}
            >
              <nav className="space-y-1">
                {coreItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <NavigationItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onCloseMobile={onCloseMobile}
                      colorScheme={isSuperAdmin ? "purple" : "default"}
                      showDescription={showDescriptions}
                    />
                  );
                })}
              </nav>
            </SidebarSection>

            {/* Business Management Section */}
            <SidebarSection 
              title="Gestión del Negocio" 
              icon={TrendingUp}
              colorScheme={isSuperAdmin ? "purple" : "green"}
              isCollapsible={true}
              defaultExpanded={pathname.includes('/spaces') || pathname.includes('/users')}
            >
              <nav className="space-y-1">
                {businessItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <NavigationItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onCloseMobile={onCloseMobile}
                      colorScheme={isSuperAdmin ? "purple" : "default"}
                      showDescription={showDescriptions}
                    />
                  );
                })}
              </nav>
            </SidebarSection>

            {/* Administration Section - Only for admins */}
            {isAdmin && (
              <SidebarSection
                title="Administración"
                icon={Shield}
                colorScheme={isSuperAdmin ? "purple" : "blue"}
                isCollapsible={true}
                defaultExpanded={pathname.includes('/admin')}
              >
                <nav className="space-y-1">
                  {adminItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <NavigationItem
                        key={item.href}
                        item={item}
                        isActive={isActive}
                        onCloseMobile={onCloseMobile}
                        colorScheme={isSuperAdmin ? "purple" : "default"}
                        showDescription={showDescriptions}
                      />
                    );
                  })}
                </nav>
              </SidebarSection>
            )}

            {/* CRM Section */}
            <SidebarSection 
              title="CRM & Ventas" 
              icon={Users}
              colorScheme={isSuperAdmin ? "purple" : "default"}
              isCollapsible={true}
              defaultExpanded={pathname.includes('/clients') || pathname.includes('/leads') || pathname.includes('/opportunities')}
            >
              <nav className="space-y-1">
                {crmItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <NavigationItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onCloseMobile={onCloseMobile}
                      colorScheme={isSuperAdmin ? "purple" : "default"}
                      showDescription={showDescriptions}
                    />
                  );
                })}
              </nav>
            </SidebarSection>
          </>
        )}

        {/* Personal Section - Always visible */}
        <SidebarSection 
          title="Personal" 
          icon={User}
          colorScheme={isSuperAdmin ? "purple" : "default"}
          isCollapsible={true}
          defaultExpanded={false}
        >
          <nav className="space-y-1">
            {accountItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <NavigationItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  onCloseMobile={onCloseMobile}
                  colorScheme={isSuperAdmin ? "purple" : "default"}
                  showDescription={showDescriptions}
                />
              );
            })}
          </nav>
        </SidebarSection>

        {/* Support Section - Always visible */}
        <SidebarSection 
          title="Soporte" 
          icon={Headphones}
          colorScheme={isSuperAdmin ? "purple" : "default"}
        >
          <nav className="space-y-1">
            {supportItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <NavigationItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  onCloseMobile={onCloseMobile}
                  colorScheme={isSuperAdmin ? "purple" : "default"}
                  showDescription={showDescriptions}
                />
              );
            })}
          </nav>
        </SidebarSection>
      </div>

      {/* Toggle Descriptions Button */}
      <div className={cn(
        "px-3 py-2 border-t",
        isSuperAdmin
          ? "border-purple-100 dark:border-purple-800"
          : "border-gray-100 dark:border-gray-800"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDescriptions(!showDescriptions)}
          className={cn(
            "w-full justify-start gap-2 text-xs h-8 hover:bg-opacity-80 transition-colors",
            isSuperAdmin
              ? "text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/30"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          )}
        >
          <Eye className="h-3 w-3" />
          {showDescriptions ? 'Ocultar' : 'Mostrar'} descripciones
        </Button>
      </div>

      {/* Language Selector and User Profile */}
      <div className={cn(
        "border-t bg-gradient-to-b transition-colors duration-200",
        isSuperAdmin
          ? "border-purple-200 from-purple-50 to-purple-25 dark:border-purple-700 dark:from-purple-900/20 dark:to-purple-900/10"
          : "border-gray-200 from-white to-gray-50 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800"
      )}>
        {/* Language Selector */}
        <div className="p-3">
          <LanguageSelector />
        </div>
        
        {/* Enhanced User Profile */}
        <div className={cn(
          "p-4 border-t",
          isSuperAdmin
            ? "border-purple-100 dark:border-purple-800"
            : "border-gray-100 dark:border-gray-800"
        )}>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md border",
            isSuperAdmin
              ? "bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 border-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 dark:hover:from-purple-900/40 dark:hover:to-purple-900/30 dark:border-purple-700"
              : "bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-gray-100 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 dark:border-gray-700"
          )}>
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center shadow-lg ring-2",
              isSuperAdmin
                ? "bg-gradient-to-br from-purple-600 to-purple-700 ring-purple-100 dark:ring-purple-800"
                : "bg-gradient-to-br from-blue-600 to-blue-700 ring-white dark:ring-gray-700"
            )}>
              <span className="text-sm font-bold text-white">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.email || "User"}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : (t(`role.${user?.role}`) || t("role.Guest"))}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all duration-200 p-2.5 rounded-xl group-hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
              title={isLoggingOut ? t("action.loggingOut") : t("action.logout")}
            >
              <LogOut className={cn("h-4 w-4 transition-transform duration-200", isLoggingOut && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

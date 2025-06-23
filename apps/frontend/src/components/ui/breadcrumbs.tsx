"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home, Building2, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoworkContextOptional } from "@/providers/cowork-provider";

export interface BreadcrumbItem {
  label: string;
  href?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
  isCoworkContext?: boolean;
  isSuperAdmin?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
  maxItems?: number;
  showCoworkContext?: boolean;
}

export function Breadcrumbs({ 
  items, 
  className,
  showHomeIcon = true,
  maxItems = 4,
  showCoworkContext = true
}: BreadcrumbsProps) {
  // Si hay más items que el máximo, mostrar los primeros, puntos suspensivos y los últimos
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    const firstItems = items.slice(0, 1); // Siempre mostrar el primero
    const lastItems = items.slice(-2); // Mostrar los últimos 2

    return [
      ...firstItems,
      { label: "...", href: null },
      ...lastItems
    ];
  }, [items, maxItems]);

  return (
    <nav 
      className={cn("flex items-center text-sm text-gray-500", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center flex-wrap gap-y-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === "...";
          const Icon = item.icon;

          return (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-gray-400 mx-2 flex-shrink-0" />
              )}
              
              {isEllipsis ? (
                <span className="text-gray-400 px-1">...</span>
              ) : item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 hover:text-gray-700 transition-colors truncate px-1 py-0.5 rounded-md hover:bg-gray-100",
                    index === 0 && showHomeIcon && "hover:text-blue-600",
                    item.isCoworkContext && "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
                    item.isSuperAdmin && "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  )}
                >
                  {index === 0 && showHomeIcon ? (
                    <Home className="h-3 w-3 flex-shrink-0" />
                  ) : Icon ? (
                    <Icon className="h-3 w-3 flex-shrink-0" />
                  ) : null}
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    "flex items-center gap-1 truncate px-1 py-0.5 rounded-md",
                    isLast 
                      ? "font-medium text-gray-900" 
                      : "text-gray-500",
                    isLast && item.isCoworkContext && "text-blue-700 bg-blue-50",
                    isLast && item.isSuperAdmin && "text-purple-700 bg-purple-50"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {index === 0 && showHomeIcon ? (
                    <Home className="h-3 w-3 flex-shrink-0 text-blue-600" />
                  ) : Icon ? (
                    <Icon className="h-3 w-3 flex-shrink-0" />
                  ) : null}
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook mejorado para generar breadcrumbs con contexto de cowork
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const coworkContext = useCoworkContextOptional();
  
  return React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Si hay un cowork activo, agregarlo como primer item
    if (coworkContext?.activeCowork && coworkContext.activeCowork.name) {
      breadcrumbs.push({ 
        label: coworkContext.activeCowork.name, 
        href: '/dashboard',
        icon: coworkContext.isSuperAdmin ? Crown : Building2,
        isCoworkContext: true,
        isSuperAdmin: coworkContext.isSuperAdmin
      });
    } else {
      // Si no hay cowork, usar Dashboard como home
      breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' });
    }

    // Mapeo mejorado de rutas con contexto
    const routeLabels: Record<string, string> = {
      'dashboard': 'Inicio',
      'spaces': 'Instalaciones',
      'bookings': 'Reservas',
      'members': 'Miembros',
      'analytics': 'Analíticas',
      'leads': 'Prospectos',
      'opportunities': 'Oportunidades',
      'activities': 'Actividades',
      'conversions': 'Conversiones',
      'super-admin': 'Panel Sistema',
      'coworks': 'Gestión Coworks',
      'billing': 'Facturación',
      'security': 'Centro de Seguridad',
      'profile': 'Mi Perfil',
      'settings': 'Configuración',
      'notifications': 'Notificaciones',
      'help': 'Centro de Ayuda',
      'new': 'Nuevo',
      'edit': 'Editar',
      'view': 'Detalle',
      'create': 'Crear',
      'context-demo': 'Demo Contexto',
    };

    // Mapa de iconos para rutas especiales
    const routeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
      'super-admin': Shield,
      'security': Shield,
    };

    // Procesar segmentos de la URL con lógica mejorada
    let currentPath = '';
    let isSuperAdminRoute = false;
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Detectar rutas de super admin
      if (segment === 'super-admin') {
        isSuperAdminRoute = true;
      }
      
      // Saltar el primer segmento si es 'dashboard' y ya tenemos cowork context
      if (index === 0 && segment === 'dashboard' && coworkContext?.activeCowork) {
        return;
      }

      // Obtener label inteligente
      let label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Para IDs, intentar obtener nombre más descriptivo
      if (segment.match(/^[a-f0-9-]+$/i) && index > 0) {
        const previousSegment = segments[index - 1];
        if (previousSegment === 'coworks' && coworkContext?.activeCowork?.id === segment) {
          label = coworkContext.activeCowork.name;
        } else {
          label = 'Detalle';
        }
      }
      
      // Determinar si es el último item
      const isLastItem = index === segments.length - 1;
      const icon = routeIcons[segment];
      
      breadcrumbs.push({ 
        label, 
        href: isLastItem ? null : currentPath,
        icon,
        isSuperAdmin: isSuperAdminRoute
      });
    });

    return breadcrumbs;
  }, [pathname, coworkContext?.activeCowork, coworkContext?.isSuperAdmin]);
}

// Componente mejorado con integración de contexto
export function AutoBreadcrumbs({ 
  className,
  showHomeIcon = true,
  maxItems = 4,
  showCoworkContext = true
}: Omit<BreadcrumbsProps, 'items'>) {
  const [pathname, setPathname] = React.useState('');

  React.useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const breadcrumbs = useBreadcrumbs(pathname);

  if (!pathname) return null;

  return (
    <Breadcrumbs
      items={breadcrumbs}
      className={className}
      showHomeIcon={showHomeIcon}
      maxItems={maxItems}
      showCoworkContext={showCoworkContext}
    />
  );
}
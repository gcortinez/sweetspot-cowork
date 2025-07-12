"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs, useBreadcrumbs } from "./breadcrumbs";
import { Badge } from "./badge";
import { Button } from "./button";
import { useCoworkContextOptional } from "@/providers/cowork-provider";
import { Building2, Crown, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextBreadcrumbsProps {
  className?: string;
  showHomeIcon?: boolean;
  maxItems?: number;
  showCoworkBadge?: boolean;
  showRefreshButton?: boolean;
}

export function ContextBreadcrumbs({
  className,
  showHomeIcon = true,
  maxItems = 5,
  showCoworkBadge = true,
  showRefreshButton = false,
}: ContextBreadcrumbsProps) {
  const pathname = usePathname();
  const coworkContext = useCoworkContextOptional();
  const breadcrumbs = useBreadcrumbs(pathname);

  const handleRefresh = async () => {
    if (coworkContext?.refreshContext) {
      await coworkContext.refreshContext();
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs
        items={breadcrumbs}
        showHomeIcon={showHomeIcon}
        maxItems={maxItems}
        showCoworkContext={true}
        className="flex-1"
      />

      {/* Cowork context badge and actions */}
      {showCoworkBadge && coworkContext?.activeCowork && (
        <div className="flex items-center gap-2">
          {/* Active cowork badge */}
          <Badge 
            variant={coworkContext.isSuperAdmin ? "default" : "secondary"}
            className={cn(
              "gap-1 text-xs font-medium",
              coworkContext.isSuperAdmin 
                ? "bg-purple-100 text-purple-700 border-purple-300" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            )}
          >
            {coworkContext.isSuperAdmin ? (
              <Crown className="h-3 w-3" />
            ) : (
              <Building2 className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {coworkContext.isSuperAdmin ? "Super Admin" : coworkContext.activeCowork.role}
            </span>
          </Badge>

          {/* Refresh button */}
          {showRefreshButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={coworkContext.isLoading}
              className="h-7 w-7 p-0"
              title="Actualizar contexto"
            >
              <RefreshCw className={cn(
                "h-3 w-3",
                coworkContext.isLoading && "animate-spin"
              )} />
            </Button>
          )}

          {/* Error indicator */}
          {coworkContext.error && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Error de contexto</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Breadcrumb con animación de transición
export function AnimatedBreadcrumbs({
  className,
  ...props
}: ContextBreadcrumbsProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
        className
      )}
    >
      <ContextBreadcrumbs {...props} />
    </div>
  );
}

// Hook para obtener título de página basado en breadcrumbs
export function usePageTitle(): string {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs(pathname);
  const coworkContext = useCoworkContextOptional();

  return React.useMemo(() => {
    if (breadcrumbs.length === 0) return "SweetSpot";

    const pageParts: string[] = [];
    
    // Última página (actual)
    const currentPage = breadcrumbs[breadcrumbs.length - 1];
    if (currentPage) {
      pageParts.push(currentPage.label);
    }

    // Cowork activo
    if (coworkContext?.activeCowork) {
      pageParts.push(coworkContext.activeCowork.name);
    }

    // Nombre de la aplicación
    pageParts.push("SweetSpot");

    return pageParts.join(" | ");
  }, [breadcrumbs, coworkContext?.activeCowork]);
}
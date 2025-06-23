"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { useBreadcrumbs } from "./breadcrumbs";
import { useCoworkContextOptional } from "@/providers/cowork-provider";
import { 
  ChevronDown, 
  Home, 
  Building2, 
  Crown,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MobileBreadcrumbsProps {
  className?: string;
}

export function MobileBreadcrumbs({ className }: MobileBreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const coworkContext = useCoworkContextOptional();
  const breadcrumbs = useBreadcrumbs(pathname);
  const [isOpen, setIsOpen] = React.useState(false);

  // Obtener el item actual (último breadcrumb)
  const currentItem = breadcrumbs[breadcrumbs.length - 1];
  const previousItem = breadcrumbs[breadcrumbs.length - 2];
  
  // Determinar si podemos navegar hacia atrás
  const canGoBack = breadcrumbs.length > 1 && previousItem?.href;

  const handleBack = () => {
    if (canGoBack && previousItem?.href) {
      router.push(previousItem.href);
    }
  };

  return (
    <div className={cn("flex items-center gap-2 md:hidden", className)}>
      {/* Botón de retroceso */}
      {canGoBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Breadcrumb desplegable */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <span className="flex items-center gap-1">
              {currentItem?.label || "Página"}
              <ChevronDown className="h-3 w-3" />
            </span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {coworkContext?.activeCowork && (
                <>
                  {coworkContext.isSuperAdmin ? (
                    <Crown className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Building2 className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="text-sm font-normal text-gray-600">
                    {coworkContext.activeCowork.name}
                  </span>
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          
          <nav className="mt-4">
            <ul className="space-y-1">
              {breadcrumbs.map((item, index) => {
                const isActive = index === breadcrumbs.length - 1;
                const Icon = item.icon || (index === 0 ? Home : null);
                
                return (
                  <li key={`${item.href}-${index}`}>
                    {item.href && !isActive ? (
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          "hover:bg-gray-100 hover:text-gray-900",
                          item.isCoworkContext && "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
                          item.isSuperAdmin && "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                          isActive 
                            ? "bg-gray-100 text-gray-900 font-medium" 
                            : "text-gray-500"
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <span className="text-xs text-gray-500">Página actual</span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Información adicional del cowork */}
          {coworkContext?.activeCowork && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cowork activo:</span>
                <span className="font-medium">{coworkContext.activeCowork.name}</span>
              </div>
              {coworkContext.hasMultipleCoworks && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    setIsOpen(false);
                    // Abrir selector de cowork
                  }}
                >
                  Cambiar cowork
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
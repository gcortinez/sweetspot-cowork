"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Plus,
  Settings,
  FileText,
  CreditCard,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface QuickActionsProps {
  context?: 'default' | 'cowork' | 'super-admin';
  className?: string;
}

export function QuickActions({ 
  context = 'default',
  className 
}: QuickActionsProps) {
  const getQuickActions = (): QuickAction[] => {
    if (context === 'super-admin') {
      return [
        {
          id: 'create-cowork',
          title: 'Crear Nuevo Cowork',
          description: 'Agregar un nuevo coworking a la plataforma',
          icon: <Building2 className="h-4 w-4" />,
          href: '/super-admin/coworks/create',
          color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40',
        },
        {
          id: 'view-analytics',
          title: 'Ver Analíticas',
          description: 'Dashboard de métricas de la plataforma',
          icon: <TrendingUp className="h-4 w-4" />,
          href: '/super-admin/analytics',
          color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40',
        },
        {
          id: 'manage-users',
          title: 'Gestionar Usuarios',
          description: 'Administrar usuarios de la plataforma',
          icon: <Users className="h-4 w-4" />,
          href: '/super-admin/users',
          color: 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40',
        },
        {
          id: 'system-settings',
          title: 'Configuración',
          description: 'Configuraciones del sistema',
          icon: <Settings className="h-4 w-4" />,
          href: '/super-admin/settings',
          color: 'text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700',
        },
      ];
    }

    // Regular cowork actions
    return [
      {
        id: 'new-booking',
        title: 'Nueva Reserva',
        description: 'Crear una nueva reserva de espacio',
        icon: <Calendar className="h-4 w-4" />,
        href: '/bookings/create',
        color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40',
      },
      {
        id: 'add-member',
        title: 'Agregar Miembro',
        description: 'Registrar un nuevo miembro',
        icon: <Users className="h-4 w-4" />,
        href: '/members/create',
        color: 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40',
      },
      {
        id: 'manage-spaces',
        title: 'Gestionar Espacios',
        description: 'Administrar espacios disponibles',
        icon: <Building2 className="h-4 w-4" />,
        href: '/spaces',
        color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40',
      },
      {
        id: 'create-invoice',
        title: 'Crear Factura',
        description: 'Generar nueva factura',
        icon: <FileText className="h-4 w-4" />,
        href: '/billing/invoices/create',
        color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40',
      },
      {
        id: 'process-payment',
        title: 'Procesar Pago',
        description: 'Registrar un nuevo pago',
        icon: <CreditCard className="h-4 w-4" />,
        href: '/billing/payments/create',
        color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40',
      },
      {
        id: 'view-analytics',
        title: 'Ver Reportes',
        description: 'Analíticas y reportes',
        icon: <TrendingUp className="h-4 w-4" />,
        href: '/analytics',
        color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40',
      },
    ];
  };

  const actions = getQuickActions();

  return (
    <Card className={cn('dashboard-card', className)}>
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center',
            context === 'super-admin' 
              ? 'bg-purple-100 dark:bg-purple-900/30' 
              : context === 'cowork'
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-gray-100 dark:bg-gray-800'
          )}>
            <Zap className={cn(
              'h-4 w-4',
              context === 'super-admin' 
                ? 'text-purple-600 dark:text-purple-400' 
                : context === 'cowork'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
            )} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Acciones Rápidas
          </h3>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full h-auto p-4 justify-start text-left hover:scale-[1.02] transition-all duration-200',
                  action.color
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-0.5 flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1 truncate">
                      {action.title}
                    </p>
                    <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
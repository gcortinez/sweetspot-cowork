"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Crown,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStyles } from '@/contexts/theme-context';
import { Motion, StaggerContainer } from '@/components/ui/motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  context?: 'default' | 'cowork' | 'super-admin';
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  context = 'default',
  className
}: MetricCardProps) {
  const { getContextStyles } = useThemeStyles();
  const contextStyles = getContextStyles(context);

  return (
    <Card className={cn('p-4 sm:p-6 transition-all duration-200 hover:shadow-md hover-lift', className)}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'h-12 w-12 rounded-xl flex items-center justify-center transition-colors',
          context === 'super-admin' 
            ? 'bg-purple-50 dark:bg-purple-900/20' 
            : context === 'cowork'
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'bg-gray-50 dark:bg-gray-800'
        )}>
          <div className={cn(
            'h-6 w-6',
            context === 'super-admin' 
              ? 'text-purple-600 dark:text-purple-400' 
              : context === 'cowork'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
          )}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface DashboardMetricsProps {
  metrics: {
    todayBookings: { count: number; trend: number };
    activeMembers: { count: number; trend: number };
    spaceOccupancy: { occupied: number; total: number; percentage: number };
    monthlyRevenue: { amount: number; trend: number };
  };
  context?: 'default' | 'cowork' | 'super-admin';
  coworkName?: string;
}

export function DashboardMetrics({ 
  metrics, 
  context = 'default',
  coworkName 
}: DashboardMetricsProps) {
  // Validate metrics structure
  if (!metrics || typeof metrics !== 'object') {
    console.error('DashboardMetrics: Invalid metrics data', metrics);
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No hay métricas disponibles</p>
      </div>
    );
  }

  // Provide default values for missing properties
  const safeMetrics = {
    todayBookings: metrics.todayBookings || { count: 0, trend: 0 },
    activeMembers: metrics.activeMembers || { count: 0, trend: 0 },
    spaceOccupancy: metrics.spaceOccupancy || { occupied: 0, total: 0, percentage: 0 },
    monthlyRevenue: metrics.monthlyRevenue || { amount: 0, trend: 0 }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getContextTitle = () => {
    if (context === 'super-admin') {
      return 'Métricas de la Plataforma';
    }
    if (context === 'cowork' && coworkName) {
      return `Métricas de ${coworkName}`;
    }
    return 'Métricas del Dashboard';
  };

  const getContextIcon = () => {
    if (context === 'super-admin') {
      return <Crown className="h-5 w-5" />;
    }
    if (context === 'cowork') {
      return <Building2 className="h-5 w-5" />;
    }
    return <Activity className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center',
          context === 'super-admin' 
            ? 'bg-purple-100 dark:bg-purple-900/30' 
            : context === 'cowork'
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-gray-100 dark:bg-gray-800'
        )}>
          <div className={cn(
            context === 'super-admin' 
              ? 'text-purple-600 dark:text-purple-400' 
              : context === 'cowork'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
          )}>
            {getContextIcon()}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getContextTitle()}
          </h2>
          {context !== 'super-admin' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vista en tiempo real de las métricas principales
            </p>
          )}
        </div>
        {context === 'super-admin' && (
          <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
            Super Admin
          </Badge>
        )}
      </div>

      {/* Metrics Grid */}
      <StaggerContainer stagger={100} animation="scale-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Reservas de Hoy"
            value={safeMetrics.todayBookings.count}
            description="Confirmadas y en progreso"
            trend={{
              value: safeMetrics.todayBookings.trend,
              isPositive: safeMetrics.todayBookings.trend >= 0
            }}
            icon={<Calendar className="h-6 w-6" />}
            context={context}
          />

          <MetricCard
            title="Miembros Activos"
            value={safeMetrics.activeMembers.count}
            description="Con membresías vigentes"
            trend={{
              value: safeMetrics.activeMembers.trend,
              isPositive: safeMetrics.activeMembers.trend >= 0
            }}
            icon={<Users className="h-6 w-6" />}
            context={context}
          />

          <MetricCard
            title="Ocupación de Espacios"
            value={`${safeMetrics.spaceOccupancy.occupied}/${safeMetrics.spaceOccupancy.total}`}
            description={`${safeMetrics.spaceOccupancy.percentage}% de utilización`}
            icon={<Building2 className="h-6 w-6" />}
            context={context}
          />

          <MetricCard
            title="Ingresos del Mes"
            value={formatCurrency(safeMetrics.monthlyRevenue.amount)}
            description="Pagos completados"
            trend={{
              value: safeMetrics.monthlyRevenue.trend,
              isPositive: safeMetrics.monthlyRevenue.trend >= 0
            }}
            icon={<DollarSign className="h-6 w-6" />}
            context={context}
          />
        </div>
      </StaggerContainer>
    </div>
  );
}
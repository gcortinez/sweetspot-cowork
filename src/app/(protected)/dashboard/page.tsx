"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { CoworkPerformanceCard } from "@/components/dashboard/cowork-performance";
import { useCoworkContextOptional } from "@/providers/cowork-provider";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import {
  Plus,
  RefreshCw,
  Crown,
  Building2,
  Activity,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Motion, StaggerContainer, ScrollReveal } from "@/components/ui/motion";
import { LoadingPage, LoadingCard, LoadingGrid } from "@/components/ui/loading";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const coworkContext = useCoworkContextOptional();
  const { config } = useTheme();
  const {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    isSuperAdmin,
    activeCowork
  } = useDashboard();

  const context = isSuperAdmin ? 'super-admin' : activeCowork ? 'cowork' : 'default';
  const contextName = isSuperAdmin ? 'Super Admin' : activeCowork?.name || 'Dashboard';

  const handleDismissAlert = (alertId: string) => {
    // TODO: Implement alert dismissal
    console.log('Dismissing alert:', alertId);
  };

  if (isLoading) {
    return (
      <div className="h-full bg-surface-secondary">
        <Motion animation="fade-in" duration={400}>
          {/* Header Skeleton */}
          <div className="bg-surface-primary border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton" />
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton" />
            </div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton" />
          </div>
          
          {/* Content Skeleton */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Metrics Grid Skeleton */}
            <LoadingGrid items={4} />
            
            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <LoadingCard lines={5} showAvatar />
                <LoadingCard lines={3} />
              </div>
              <div className="space-y-6">
                <LoadingCard lines={4} />
                <LoadingCard lines={6} showAvatar />
                <LoadingCard lines={3} />
              </div>
            </div>
          </div>
        </Motion>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-surface-secondary flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="h-full bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface-secondary transition-theme">
      {/* Header */}
      <Motion animation="fade-in-down" duration={600}>
        <div className="bg-surface-primary border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isSuperAdmin ? (
                  <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                ) : activeCowork ? (
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Activity className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Dashboard {contextName}
                </h1>
                {isSuperAdmin && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                    Super Admin
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {isSuperAdmin 
                  ? 'Vista general de toda la plataforma'
                  : activeCowork 
                    ? `Métricas y gestión de ${activeCowork.name}`
                    : 'Bienvenido al panel de control'
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={refreshMetrics}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button className={cn(
                'w-full sm:w-auto',
                isSuperAdmin 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}>
                <Plus className="h-4 w-4 mr-2" />
                {isSuperAdmin ? 'Nuevo Cowork' : 'Nueva Reserva'}
              </Button>
            </div>
          </div>
        </div>
        </div>
      </Motion>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Dashboard Metrics */}
        <Motion animation="fade-in-up" delay={200}>
          <DashboardMetrics 
            metrics={metrics}
            context={context}
            coworkName={activeCowork?.name}
          />
        </Motion>

        {/* Main Content Grid */}
        <StaggerContainer stagger={150} animation="fade-in-up">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 dashboard-section">
            {/* Main Content - Recent Bookings */}
            <div className="flex-1 lg:flex-[2] space-y-6">
              <RecentBookings 
                bookings={metrics.recentBookings}
                context={context}
              />
              
              {/* Super Admin Performance Cards */}
              {isSuperAdmin && 'coworkPerformance' in metrics && (
                <CoworkPerformanceCard 
                  coworks={metrics.coworkPerformance}
                />
              )}
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 space-y-6">
              {/* Quick Actions */}
              <QuickActions context={context} />
              
              {/* Activity Feed */}
              <ActivityFeed 
                activities={metrics.recentActivities}
                context={context}
              />
              
              {/* Alerts */}
              <AlertsPanel 
                alerts={metrics.alerts}
                context={context}
                onDismissAlert={handleDismissAlert}
              />
            </div>
          </div>
        </StaggerContainer>
      </div>
    </div>
  );
};

export default DashboardPage;

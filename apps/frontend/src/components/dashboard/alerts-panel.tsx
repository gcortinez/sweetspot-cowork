"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight,
  Bell,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Motion, StaggerContainer } from '@/components/ui/motion';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  dismissible?: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  context?: 'default' | 'cowork' | 'super-admin';
  className?: string;
  onDismissAlert?: (alertId: string) => void;
}

export function AlertsPanel({ 
  alerts, 
  context = 'default',
  className,
  onDismissAlert
}: AlertsPanelProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getAlertTextColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'info':
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const getAlertBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: es 
      });
    } catch {
      return timestamp;
    }
  };

  const getAlertTypeName = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'Advertencia';
      case 'error':
        return 'Error';
      case 'success':
        return 'Éxito';
      case 'info':
      default:
        return 'Información';
    }
  };

  const handleDismiss = (alertId: string) => {
    if (onDismissAlert) {
      onDismissAlert(alertId);
    }
  };

  return (
    <Card className={cn('dashboard-card', className)}>
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center',
              context === 'super-admin' 
                ? 'bg-purple-100 dark:bg-purple-900/30' 
                : context === 'cowork'
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
            )}>
              <Bell className={cn(
                'h-4 w-4',
                context === 'super-admin' 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : context === 'cowork'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Alertas y Notificaciones
              </h3>
              {alerts.length > 0 && (
                <Badge className="mt-1 text-xs bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
                  {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
                </Badge>
              )}
            </div>
          </div>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Ver todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay alertas en este momento
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              Te notificaremos cuando haya algo importante
            </p>
          </div>
        ) : (
          <StaggerContainer stagger={120} animation="scale-in" className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-200 hover-lift',
                  getAlertStyles(alert.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          'text-xs',
                          getAlertBadgeVariant(alert.type)
                        )}>
                          {getAlertTypeName(alert.type)}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>
                      {alert.dismissible && onDismissAlert && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                          className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <h4 className={cn(
                      'text-sm font-semibold mb-1',
                      getAlertTextColor(alert.type)
                    )}>
                      {alert.title}
                    </h4>
                    
                    <p className={cn(
                      'text-sm',
                      getAlertTextColor(alert.type)
                    )}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerContainer>
        )}
      </div>
    </Card>
  );
}
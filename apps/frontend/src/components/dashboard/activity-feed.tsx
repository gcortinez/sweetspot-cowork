"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Settings,
  Activity,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Motion, StaggerContainer } from '@/components/ui/motion';

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'member' | 'space' | 'system';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  context?: 'default' | 'cowork' | 'super-admin';
  className?: string;
}

export function ActivityFeed({ 
  activities, 
  context = 'default',
  className 
}: ActivityFeedProps) {
  // Validate activities array
  const safeActivities = Array.isArray(activities) ? activities : [];
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'member':
        return <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'space':
        return <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'payment':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'member':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
      case 'space':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'system':
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
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
              <Activity className={cn(
                'h-4 w-4',
                context === 'super-admin' 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : context === 'cowork'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
              )} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Actividad Reciente
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Ver todo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {safeActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No hay actividad reciente
            </p>
          </div>
        ) : (
          <StaggerContainer stagger={80} animation="slide-in-left" className="space-y-4">
            {safeActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index < safeActivities.length - 1 && (
                  <div className="absolute left-6 top-8 w-px h-12 bg-gray-200 dark:bg-gray-700" />
                )}
                
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'h-12 w-12 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    getActivityColor(activity.type)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.description}
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
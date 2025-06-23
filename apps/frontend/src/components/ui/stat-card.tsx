"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  context?: 'default' | 'cowork' | 'super-admin';
  variant?: 'default' | 'elevated' | 'outline';
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  context = 'default',
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  const isIcon = React.isValidElement(icon);
  const Icon = !isIcon && icon ? icon as LucideIcon : null;

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp className="h-4 w-4" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="h-4 w-4" />;
    } else {
      return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend.value > 0) {
      return 'text-green-600 dark:text-green-400';
    } else if (trend.value < 0) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getIconBackground = () => {
    switch (context) {
      case 'super-admin':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cowork':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Card
      variant={variant}
      context={context}
      interactive={!!onClick}
      className={cn(
        'group relative overflow-hidden',
        onClick && 'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="text-gray-600 dark:text-gray-400 font-medium">
            {title}
          </CardTitle>
          {(Icon || isIcon) && (
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
              getIconBackground()
            )}>
              {Icon ? <Icon className="h-4 w-4" /> : icon}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            {trend && (
              <div className={cn('flex items-center gap-1', getTrendColor())}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {trend.value > 0 && '+'}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}
        </div>
      </CardContent>

      {/* Decorative gradient overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none',
        context === 'super-admin' && 'from-purple-600 to-purple-400',
        context === 'cowork' && 'from-blue-600 to-blue-400',
        context === 'default' && 'from-gray-600 to-gray-400'
      )} />
    </Card>
  );
}
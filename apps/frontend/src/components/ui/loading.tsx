"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  variant = 'default' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const variantClasses = {
    default: 'text-gray-600 dark:text-gray-400',
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )} 
    />
  );
}

interface LoadingDotsProps {
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export function LoadingDots({ className, variant = 'default' }: LoadingDotsProps) {
  const variantClasses = {
    default: 'bg-gray-600 dark:bg-gray-400',
    primary: 'bg-blue-600 dark:bg-blue-400',
    secondary: 'bg-purple-600 dark:bg-purple-400',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-2 rounded-full animate-pulse',
            variantClasses[variant]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

interface LoadingBarProps {
  progress?: number;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
  animated?: boolean;
}

export function LoadingBar({ 
  progress, 
  className,
  variant = 'primary',
  animated = true 
}: LoadingBarProps) {
  const variantClasses = {
    default: 'bg-gray-600 dark:bg-gray-400',
    primary: 'bg-blue-600 dark:bg-blue-400',
    secondary: 'bg-purple-600 dark:bg-purple-400',
  };

  return (
    <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2', className)}>
      <div
        className={cn(
          'h-2 rounded-full transition-all duration-300 ease-out',
          variantClasses[variant],
          animated && 'animate-pulse'
        )}
        style={{
          width: progress !== undefined ? `${progress}%` : '30%',
        }}
      />
    </div>
  );
}

interface LoadingCardProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

export function LoadingCard({ 
  lines = 3, 
  showAvatar = false, 
  className 
}: LoadingCardProps) {
  return (
    <div className={cn('animate-pulse space-y-3 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full loading-skeleton" />
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton" />
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface LoadingGridProps {
  items?: number;
  className?: string;
}

export function LoadingGrid({ items = 4, className }: LoadingGridProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} lines={2} />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export function LoadingPage({ 
  title = 'Cargando...', 
  description = 'Por favor espera un momento',
  variant = 'primary' 
}: LoadingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <LoadingSpinner size="lg" variant={variant} />
        <div className="absolute inset-0 animate-ping">
          <LoadingSpinner size="lg" variant={variant} className="opacity-20" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

interface PulseWaveProps {
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export function PulseWave({ className, variant = 'primary' }: PulseWaveProps) {
  const variantClasses = {
    default: 'border-gray-600 dark:border-gray-400',
    primary: 'border-blue-600 dark:border-blue-400',
    secondary: 'border-purple-600 dark:border-purple-400',
  };

  return (
    <div className={cn('relative w-8 h-8', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 border-2 rounded-full opacity-75 animate-ping',
            variantClasses[variant]
          )}
          style={{
            animationDelay: `${i * 0.5}s`,
            animationDuration: '2s',
          }}
        />
      ))}
      <div className={cn(
        'absolute inset-2 border-2 rounded-full',
        variantClasses[variant]
      )} />
    </div>
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}
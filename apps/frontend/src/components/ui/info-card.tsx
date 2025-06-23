"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, CardBadge } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  image?: {
    src: string;
    alt: string;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  };
  tags?: string[];
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
    icon?: LucideIcon;
  }>;
  context?: 'default' | 'cowork' | 'super-admin';
  variant?: 'default' | 'elevated' | 'outline';
  className?: string;
  onClick?: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function InfoCard({
  title,
  description,
  icon,
  image,
  badge,
  tags,
  actions,
  context = 'default',
  variant = 'default',
  className,
  onClick,
  footer,
  children,
}: InfoCardProps) {
  const isIcon = React.isValidElement(icon);
  const Icon = !isIcon && icon ? icon as LucideIcon : null;

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
        'group relative flex flex-col',
        onClick && 'hover:scale-[1.01] active:scale-[0.99]',
        className
      )}
      onClick={onClick}
    >
      {/* Image */}
      {image && (
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {badge && (
            <CardBadge variant={badge.variant} position="top-right">
              {badge.text}
            </CardBadge>
          )}
        </div>
      )}

      {/* Header */}
      <CardHeader className={cn(
        'flex-row items-start justify-between space-y-0 gap-4',
        !image && badge && 'relative'
      )}>
        <div className="flex-1 space-y-1">
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          {description && (
            <CardDescription className="line-clamp-2">
              {description}
            </CardDescription>
          )}
        </div>
        
        {/* Icon or Badge */}
        {(Icon || isIcon) && (
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            getIconBackground()
          )}>
            {Icon ? <Icon className="h-5 w-5" /> : icon}
          </div>
        )}
        
        {!image && badge && (
          <Badge
            variant="outline"
            className={cn(
              'absolute top-4 right-4',
              badge.variant === 'success' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
              badge.variant === 'warning' && 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
              badge.variant === 'error' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
              badge.variant === 'info' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            )}
          >
            {badge.text}
          </Badge>
        )}
      </CardHeader>

      {/* Content */}
      {(children || tags) && (
        <CardContent className="flex-1">
          {children}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}

      {/* Footer */}
      {(footer || actions) && (
        <CardFooter className="flex-col items-stretch gap-3 pt-4">
          {footer}
          
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.variant || 'default'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={cn(
                      'flex-1 min-w-fit',
                      index === 0 && context === 'super-admin' && 'bg-purple-600 hover:bg-purple-700 text-white',
                      index === 0 && context === 'cowork' && 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                  >
                    {action.label}
                    {ActionIcon && <ActionIcon className="h-4 w-4 ml-2" />}
                  </Button>
                );
              })}
            </div>
          )}
        </CardFooter>
      )}

      {/* Hover indicator */}
      {onClick && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </Card>
  );
}
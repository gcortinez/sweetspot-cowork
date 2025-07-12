"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { ArrowRight, MoreVertical, LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: {
    src?: string;
    alt?: string;
    initials?: string;
    color?: string;
  };
  icon?: LucideIcon | React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  metadata?: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
  }>;
  actions?: Array<{
    label: string;
    onClick: (item: ListItem) => void;
    icon?: LucideIcon;
    destructive?: boolean;
  }>;
  onClick?: () => void;
}

interface ListCardProps {
  title: string;
  description?: string;
  items: ListItem[];
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  viewAllAction?: {
    label?: string;
    onClick: () => void;
  };
  context?: 'default' | 'cowork' | 'super-admin';
  variant?: 'default' | 'elevated' | 'outline';
  className?: string;
  maxItems?: number;
}

export function ListCard({
  title,
  description,
  items,
  emptyState,
  viewAllAction,
  context = 'default',
  variant = 'default',
  className,
  maxItems,
}: ListCardProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const hasMore = maxItems ? items.length > maxItems : false;

  const getAvatarColor = (color?: string, name?: string) => {
    if (color) return color;
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    
    const index = (name || '').length % colors.length;
    return colors[index];
  };

  const renderAvatar = (avatar?: ListItem['avatar']) => {
    if (!avatar) return null;

    if (avatar.src) {
      return (
        <img
          src={avatar.src}
          alt={avatar.alt || ''}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    }

    return (
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm',
        getAvatarColor(avatar.color, avatar.initials)
      )}>
        {avatar.initials}
      </div>
    );
  };

  return (
    <Card
      variant={variant}
      context={context}
      className={cn('flex flex-col', className)}
    >
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            )}
          </div>
          {viewAllAction && items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={viewAllAction.onClick}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {viewAllAction.label || 'Ver todos'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1" noPadding>
        {items.length === 0 && emptyState ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {emptyState.icon && (
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <emptyState.icon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {emptyState.title}
            </h3>
            {emptyState.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {emptyState.description}
              </p>
            )}
            {emptyState.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={emptyState.action.onClick}
              >
                {emptyState.action.label}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayItems.map((item) => {
              const isIcon = React.isValidElement(item.icon);
              const ItemIcon = !isIcon && item.icon ? item.icon as LucideIcon : null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'px-6 py-4 transition-colors',
                    item.onClick && 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                  )}
                  onClick={item.onClick}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar/Icon */}
                    {(item.avatar || item.icon) && (
                      <div className="flex-shrink-0">
                        {item.avatar ? (
                          renderAvatar(item.avatar)
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {ItemIcon ? <ItemIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : item.icon}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.title}
                            </p>
                            {item.badge && (
                              <Badge variant={item.badge.variant || 'default'} className="text-xs">
                                {item.badge.text}
                              </Badge>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {item.subtitle}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.metadata && item.metadata.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-2">
                              {item.metadata.map((meta, index) => {
                                const MetaIcon = meta.icon;
                                return (
                                  <div key={index} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    {MetaIcon && <MetaIcon className="h-3 w-3" />}
                                    <span>{meta.label}:</span>
                                    <span className="font-medium">{meta.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {item.actions && item.actions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {item.actions.map((action, index) => {
                                const ActionIcon = action.icon;
                                return (
                                  <DropdownMenuItem
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(item);
                                    }}
                                    className={action.destructive ? 'text-red-600 dark:text-red-400' : ''}
                                  >
                                    {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                                    {action.label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View more */}
        {hasMore && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={viewAllAction?.onClick}
              className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Ver {items.length - displayItems.length} más
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
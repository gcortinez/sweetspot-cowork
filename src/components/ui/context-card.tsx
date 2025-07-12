"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { useCoworkContextOptional } from '@/providers/cowork-provider';
import { useAuth } from '@/contexts/auth-context';

interface ContextCardProps extends React.ComponentProps<typeof Card> {
  autoContext?: boolean;
  forceContext?: 'default' | 'cowork' | 'super-admin';
}

export const ContextCard = React.forwardRef<
  HTMLDivElement,
  ContextCardProps
>(({ autoContext = true, forceContext, context, ...props }, ref) => {
  const theme = useTheme();
  const coworkContext = useCoworkContextOptional();
  const { user } = useAuth();

  // Determine the context
  let derivedContext: 'default' | 'cowork' | 'super-admin' = 'default';
  
  if (forceContext) {
    derivedContext = forceContext;
  } else if (autoContext) {
    if (user?.role === 'SUPER_ADMIN' && theme.config.context === 'super-admin') {
      derivedContext = 'super-admin';
    } else if (coworkContext?.activeCowork) {
      derivedContext = 'cowork';
    }
  }

  return (
    <Card
      ref={ref}
      context={context || derivedContext}
      {...props}
    />
  );
});

ContextCard.displayName = 'ContextCard';

// Export wrapped versions of Card components
export const ContextCardHeader = CardHeader;
export const ContextCardTitle = CardTitle;
export const ContextCardDescription = CardDescription;
export const ContextCardContent = CardContent;
export const ContextCardFooter = CardFooter;
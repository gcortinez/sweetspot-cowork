"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsVisible(false);
    
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4',
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

interface FadeTransitionProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

export function FadeTransition({ children, show, className }: FadeTransitionProps) {
  return (
    <div
      className={cn(
        'transition-opacity duration-300 ease-out',
        show ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

interface SlideTransitionProps {
  children: React.ReactNode;
  show: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function SlideTransition({ 
  children, 
  show, 
  direction = 'up',
  className 
}: SlideTransitionProps) {
  const getTransformClass = () => {
    const transforms = {
      up: show ? 'translate-y-0' : 'translate-y-4',
      down: show ? 'translate-y-0' : '-translate-y-4',
      left: show ? 'translate-x-0' : 'translate-x-4',
      right: show ? 'translate-x-0' : '-translate-x-4',
    };
    return transforms[direction];
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        show ? 'opacity-100' : 'opacity-0',
        getTransformClass(),
        className
      )}
    >
      {children}
    </div>
  );
}

interface ScaleTransitionProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

export function ScaleTransition({ children, show, className }: ScaleTransitionProps) {
  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out origin-center',
        show 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95',
        className
      )}
    >
      {children}
    </div>
  );
}
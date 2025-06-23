"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-in' | 'fade-in-up' | 'fade-in-down' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'bounce-in';
  delay?: number;
  duration?: number;
  once?: boolean;
  trigger?: 'mount' | 'visible' | 'hover';
  stagger?: number;
}

export function Motion({
  children,
  className,
  animation = 'fade-in',
  delay = 0,
  duration = 500,
  once = true,
  trigger = 'mount',
  stagger = 0,
}: MotionProps) {
  const [isVisible, setIsVisible] = useState(trigger === 'mount');
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger === 'visible' && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && (!once || !hasAnimated)) {
            setTimeout(() => {
              setIsVisible(true);
              setHasAnimated(true);
            }, delay + stagger);
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [trigger, delay, once, hasAnimated, stagger]);

  useEffect(() => {
    if (trigger === 'mount' && (!once || !hasAnimated)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, delay + stagger);

      return () => clearTimeout(timer);
    }
  }, [trigger, delay, once, hasAnimated, stagger]);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';
    
    switch (animation) {
      case 'fade-in':
        return 'animate-fade-in';
      case 'fade-in-up':
        return 'animate-fade-in-up';
      case 'fade-in-down':
        return 'animate-fade-in-down';
      case 'slide-in-left':
        return 'animate-slide-in-left';
      case 'slide-in-right':
        return 'animate-slide-in-right';
      case 'scale-in':
        return 'animate-scale-in';
      case 'bounce-in':
        return 'animate-bounce-in';
      default:
        return 'animate-fade-in';
    }
  };

  const style = {
    animationDuration: `${duration}ms`,
    animationFillMode: 'both',
  };

  if (trigger === 'hover') {
    return (
      <div
        ref={ref}
        className={cn(
          'transition-all duration-300 ease-out opacity-0 hover:opacity-100',
          getAnimationClass(),
          className
        )}
        style={style}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => !once && setIsVisible(false)}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(getAnimationClass(), className)}
      style={style}
    >
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  stagger?: number;
  animation?: MotionProps['animation'];
  className?: string;
}

export function StaggerContainer({
  children,
  stagger = 100,
  animation = 'fade-in-up',
  className,
}: StaggerContainerProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <Motion
          key={index}
          animation={animation}
          stagger={index * stagger}
          trigger="visible"
        >
          {child}
        </Motion>
      ))}
    </div>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: MotionProps['animation'];
  className?: string;
  threshold?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  animation = 'fade-in-up',
  className,
  threshold = 0.1,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <div ref={ref}>
      <Motion
        animation={animation}
        trigger="mount"
        className={cn(isVisible ? 'opacity-100' : 'opacity-0', className)}
      >
        {children}
      </Motion>
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export function LoadingSkeleton({ className, lines = 3, avatar = false }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {avatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full loading-skeleton"></div>
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded loading-skeleton"></div>
        </div>
      )}
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

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  className?: string;
}

export function Transition({
  show,
  children,
  enter = 'transition-all duration-300 ease-out',
  enterFrom = 'opacity-0 scale-95',
  enterTo = 'opacity-100 scale-100',
  leave = 'transition-all duration-200 ease-in',
  leaveFrom = 'opacity-100 scale-100',
  leaveTo = 'opacity-0 scale-95',
  className,
}: TransitionProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Force a reflow
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        isVisible ? enter : leave,
        isVisible ? enterTo : leaveFrom,
        !isVisible && leaveTo,
        !isVisible && !show && enterFrom,
        className
      )}
    >
      {children}
    </div>
  );
}
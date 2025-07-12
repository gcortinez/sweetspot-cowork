"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCoworkContextOptional } from "@/providers/cowork-provider";
import { 
  ThemeManager, 
  ThemeMode, 
  ThemeContext as ThemeContextType, 
  ThemeConfig,
  themeManager 
} from "@/lib/theme";

interface ThemeContextValue {
  config: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setContext: (context: ThemeContextType) => void;
  setAccentColor: (color: string) => void;
  toggleMode: () => void;
  currentMode: 'light' | 'dark';
  isSystemMode: boolean;
  autoDetectContext: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  autoDetect?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultMode = 'light',
  autoDetect = true 
}: ThemeProviderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const coworkContext = useCoworkContextOptional();
  
  const [config, setConfig] = useState<ThemeConfig>(themeManager.getConfig());

  // Auto-detect context based on user role and route
  const autoDetectContext = React.useCallback(() => {
    if (!autoDetect) return;

    let newContext: ThemeContextType = 'default';

    // Super Admin context
    if (user?.role === 'SUPER_ADMIN' && pathname.startsWith('/super-admin')) {
      newContext = 'super-admin';
    }
    // Cowork context
    else if (coworkContext?.activeCowork || user?.role === 'COWORK_ADMIN') {
      newContext = 'cowork';
    }

    if (newContext !== config.context) {
      themeManager.setContext(newContext);
      setConfig(themeManager.getConfig());
    }
  }, [user?.role, pathname, coworkContext?.activeCowork, config.context, autoDetect]);

  // Theme management functions
  const setMode = React.useCallback((mode: ThemeMode) => {
    themeManager.setMode(mode);
    setConfig(themeManager.getConfig());
  }, []);

  const setContext = React.useCallback((context: ThemeContextType) => {
    themeManager.setContext(context);
    setConfig(themeManager.getConfig());
  }, []);

  const setAccentColor = React.useCallback((color: string) => {
    themeManager.setAccentColor(color);
    setConfig(themeManager.getConfig());
  }, []);

  const toggleMode = React.useCallback(() => {
    const currentMode = themeManager.getCurrentMode();
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  }, [setMode]);

  const currentMode = themeManager.getCurrentMode();
  const isSystemMode = config.mode === 'system';

  // Initialize theme on mount
  useEffect(() => {
    const cleanup = themeManager.watchSystemTheme();
    autoDetectContext();
    
    return cleanup;
  }, [autoDetectContext]);

  // Auto-detect context when dependencies change
  useEffect(() => {
    autoDetectContext();
  }, [autoDetectContext]);

  // Listen for cowork changes
  useEffect(() => {
    const handleCoworkChange = () => {
      setTimeout(() => {
        autoDetectContext();
      }, 100); // Small delay to ensure context is updated
    };

    window.addEventListener('coworkChanged', handleCoworkChange);
    
    return () => {
      window.removeEventListener('coworkChanged', handleCoworkChange);
    };
  }, [autoDetectContext]);

  const value: ThemeContextValue = {
    config,
    setMode,
    setContext,
    setAccentColor,
    toggleMode,
    currentMode,
    isSystemMode,
    autoDetectContext,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for theme-aware styling
export function useThemeStyles() {
  const theme = useThemeOptional();
  
  const getContextStyles = React.useCallback((context?: ThemeContextType) => {
    const ctx = context || theme?.config.context || 'default';
    
    const styles = {
      default: {
        primary: 'text-blue-600 bg-blue-50 border-blue-200',
        secondary: 'text-gray-600 bg-gray-50 border-gray-200',
        accent: 'text-blue-700 bg-blue-100 border-blue-300',
      },
      'super-admin': {
        primary: 'text-purple-600 bg-purple-50 border-purple-200',
        secondary: 'text-purple-600 bg-purple-50 border-purple-200',
        accent: 'text-purple-700 bg-purple-100 border-purple-300',
      },
      cowork: {
        primary: 'text-blue-600 bg-blue-50 border-blue-200',
        secondary: 'text-blue-600 bg-blue-50 border-blue-200',
        accent: 'text-blue-700 bg-blue-100 border-blue-300',
      },
    };

    return styles[ctx] || styles.default;
  }, [theme?.config.context]);

  const getButtonStyles = React.useCallback((variant: 'primary' | 'secondary' | 'accent' = 'primary') => {
    const styles = getContextStyles();
    return styles[variant];
  }, [getContextStyles]);

  return {
    getContextStyles,
    getButtonStyles,
    currentContext: theme?.config.context || 'default',
    currentMode: theme?.currentMode || 'light',
  };
}

// Theme-aware component wrapper
export function withTheme<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireContext?: ThemeContextType;
    fallbackContext?: ThemeContextType;
  }
) {
  return function WrappedComponent(props: P) {
    const theme = useThemeOptional();
    
    if (options?.requireContext && theme?.config.context !== options.requireContext) {
      return null;
    }

    return <Component {...props} />;
  };
}
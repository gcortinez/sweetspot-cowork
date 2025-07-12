"use client";

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeContext = 'default' | 'super-admin' | 'cowork';

export interface ThemeConfig {
  mode: ThemeMode;
  context: ThemeContext;
  accentColor: string;
}

export class ThemeManager {
  private static instance: ThemeManager;
  private config: ThemeConfig = {
    mode: 'light',
    context: 'default',
    accentColor: 'blue'
  };

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.applySystemPreference();
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('sweetspot-theme');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('sweetspot-theme', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  }

  private applySystemPreference(): void {
    if (this.config.mode === 'system' && typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark ? 'dark' : 'light');
    }
  }

  private applyTheme(mode: 'light' | 'dark'): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(mode);
    
    // Apply context-specific theme
    this.applyContextTheme();
  }

  private applyContextTheme(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Remove existing context classes
    root.classList.remove('theme-default', 'theme-super-admin', 'theme-cowork');
    
    // Add new context class
    switch (this.config.context) {
      case 'super-admin':
        root.classList.add('theme-super-admin');
        break;
      case 'cowork':
        root.classList.add('theme-cowork');
        break;
      default:
        root.classList.add('theme-default');
        break;
    }
  }

  setMode(mode: ThemeMode): void {
    this.config.mode = mode;
    
    if (mode === 'system') {
      this.applySystemPreference();
    } else {
      this.applyTheme(mode);
    }
    
    this.saveToStorage();
  }

  setContext(context: ThemeContext): void {
    this.config.context = context;
    this.applyContextTheme();
    this.saveToStorage();
  }

  setAccentColor(color: string): void {
    this.config.accentColor = color;
    this.saveToStorage();
  }

  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  getCurrentMode(): 'light' | 'dark' {
    if (this.config.mode === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.config.mode === 'dark' ? 'dark' : 'light';
  }

  // Auto-detect context based on user role and route
  autoDetectContext(userRole?: string, pathname?: string): ThemeContext {
    if (userRole === 'SUPER_ADMIN' && pathname?.startsWith('/super-admin')) {
      return 'super-admin';
    }
    if (pathname?.startsWith('/cowork') || userRole === 'COWORK_ADMIN') {
      return 'cowork';
    }
    return 'default';
  }

  // Initialize theme based on user context
  initializeForUser(userRole?: string, pathname?: string): void {
    const context = this.autoDetectContext(userRole, pathname);
    this.setContext(context);
  }

  // Listen for system theme changes
  watchSystemTheme(): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (this.config.mode === 'system') {
        this.applySystemPreference();
      }
    };

    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
}

// Utility functions
export const themeManager = ThemeManager.getInstance();

export function getThemeColors(context: ThemeContext = 'default') {
  const colors = {
    default: {
      primary: 'hsl(217 91% 60%)',
      secondary: 'hsl(210 20% 96%)',
      accent: 'hsl(210 40% 96%)',
    },
    'super-admin': {
      primary: 'hsl(262 83% 58%)',
      secondary: 'hsl(262 50% 95%)',
      accent: 'hsl(262 100% 98%)',
    },
    cowork: {
      primary: 'hsl(217 91% 60%)',
      secondary: 'hsl(217 50% 95%)',
      accent: 'hsl(217 100% 98%)',
    },
  };

  return colors[context] || colors.default;
}

export function getContextIcon(context: ThemeContext) {
  switch (context) {
    case 'super-admin':
      return 'Crown';
    case 'cowork':
      return 'Building2';
    default:
      return 'Home';
  }
}

export function getContextLabel(context: ThemeContext) {
  switch (context) {
    case 'super-admin':
      return 'Super Admin';
    case 'cowork':
      return 'Cowork';
    default:
      return 'General';
  }
}
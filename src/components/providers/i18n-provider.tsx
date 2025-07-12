"use client";

import { useState, useEffect, ReactNode } from 'react';
import { I18nContext, Language } from '@/lib/i18n';
import { translations } from '@/lib/i18n/translations';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>('es'); // Spanish by default
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedLanguage = localStorage.getItem('sweetspot-language') as Language;
      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.warn('Could not access localStorage:', error);
    }
  }, []);

  // Save language to localStorage when it changes
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('sweetspot-language', lang);
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }
      
      // Fallback to English if key not found in current language
      if (typeof value !== 'string' && language !== 'en') {
        let fallbackValue: any = translations.en;
        for (const k of keys) {
          if (fallbackValue && typeof fallbackValue === 'object') {
            fallbackValue = fallbackValue[k];
          } else {
            fallbackValue = undefined;
            break;
          }
        }
        if (typeof fallbackValue === 'string') {
          return fallbackValue;
        }
      }
      
      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ language: 'es', setLanguage: () => {}, t: (key: string) => key }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}
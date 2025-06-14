"use client";

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n, Language, LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{t('action.language')}</span>
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          {language.toUpperCase()}
        </span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {(Object.entries(LANGUAGES) as [Language, string][]).map(([lang, label]) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors",
                  language === lang && "bg-blue-50 text-blue-700"
                )}
              >
                <span>{label}</span>
                {language === lang && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
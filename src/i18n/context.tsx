import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale, TranslationParams } from './types';
import { translations } from './translations';

const STORAGE_KEY = 'barslogistics-locale';

type Dict = (typeof translations)['ru'];

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
  localeTag: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNested(obj: Dict, key: string): string | undefined {
  const val = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof val === 'string' ? val : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ru';
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const dict = translations[locale];
      const value = getNested(dict, key) ?? getNested(translations.ru, key) ?? key;
      return interpolate(value, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, localeTag: locale === 'en' ? 'en-US' : 'ru-RU' }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().t;
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type Locale =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ja"
  | "zh"
  | "ko"
  | "ar"
  | "hi";

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const locales: LocaleInfo[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr", flag: "🇮🇳" },
];

type TranslationDict = Record<string, string>;
type AllTranslations = Record<string, TranslationDict>;

let translationsCache: AllTranslations | null = null;

async function loadTranslations(): Promise<AllTranslations> {
  if (translationsCache) return translationsCache;
  const mod = await import("./translations/all");
  translationsCache = mod.translations;
  return translationsCache;
}

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [translations, setTranslations] = useState<AllTranslations | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ef_locale") as Locale | null;
    if (saved && locales.some((l) => l.code === saved)) {
      setLocaleState(saved);
    }
    loadTranslations().then(setTranslations);
  }, []);

  useEffect(() => {
    const info = locales.find((l) => l.code === locale);
    if (info) {
      document.documentElement.dir = info.dir;
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("ef_locale", l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      if (!translations) return key;
      let value = translations[locale]?.[key] || translations.en[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [locale, translations]
  );

  const info = locales.find((l) => l.code === locale);

  return (
    <I18nContext.Provider value={{ locale, dir: info?.dir || "ltr", setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

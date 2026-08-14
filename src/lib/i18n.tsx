"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { en } from "./translations/en";

export { locales, type Locale, type LocaleInfo } from "./locales";
import { locales, type Locale } from "./locales";

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

export function I18nProvider({
  children,
  initialLocale,
  initialDict,
}: {
  children: ReactNode;
  /** Locale forced by a locale-routed page (e.g. /es) — makes SSR emit that
   *  language so search engines index all 19 localized surfaces. */
  initialLocale?: Locale;
  /** That locale's dictionary, statically imported server-side. */
  initialDict?: TranslationDict;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");
  const [translations, setTranslations] = useState<AllTranslations | null>(
    initialLocale && initialDict
      ? ({ [initialLocale]: initialDict } as AllTranslations)
      : null
  );

  useEffect(() => {
    const saved = localStorage.getItem("ef_locale") as Locale | null;
    // Apply the saved locale inside the async callback (not synchronously in
    // the effect body) so React doesn't flag a cascading-render setState.
    loadTranslations().then((tr) => {
      setTranslations(tr);
      if (saved && locales.some((l) => l.code === saved)) {
        setLocaleState(saved);
      }
    });
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
      // English ships statically so server-side rendering (and the first client
      // paint) emits real copy instead of raw keys — crawlers and LLM bots that
      // never execute JS see the actual content. The other 18 locales still
      // lazy-load and take over once hydrated.
      let value =
        translations?.[locale]?.[key] ||
        translations?.en?.[key] ||
        en[key] ||
        key;
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

"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useTranslation, locales, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = locales.find((l) => l.code === locale);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-cyber-muted hover:text-foreground hover:bg-cyber-card border border-transparent hover:border-cyber-border transition-all"
        title={t("lang.switchLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">{current?.nativeName || "English"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-cyber-card border border-cyber-border rounded-xl shadow-xl shadow-black/20 py-2 z-50 max-h-80 overflow-y-auto">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code as Locale);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                locale === l.code
                  ? "text-neon-purple bg-neon-purple/5"
                  : "text-cyber-muted hover:text-foreground hover:bg-cyber-dark"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.nativeName}</span>
              {locale === l.code && (
                <span className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

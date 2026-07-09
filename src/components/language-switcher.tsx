"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useTranslation, locales, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = locales.find((l) => l.code === locale);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyber-border text-sm text-cyber-muted hover:text-foreground hover:border-neon-purple/50 transition-all"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current?.nativeName}</span>
        <span className="sm:hidden">{current?.code.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-cyber-card border border-cyber-border rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-cyber-border">
            <p className="text-xs text-cyber-muted font-medium">{t("lang.switchLanguage")}</p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code as Locale);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  locale === l.code
                    ? "bg-neon-purple/10 text-neon-purple"
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
        </div>
      )}
    </div>
  );
}

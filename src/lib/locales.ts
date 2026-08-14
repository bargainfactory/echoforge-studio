/** Locale registry — server-safe (no "use client"), shared by the i18n
 *  provider, locale-routed pages, and the sitemap. */

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
  | "hi"
  | "ru"
  | "it"
  | "id"
  | "tr"
  | "vi"
  | "nl"
  | "pl"
  | "th"
  | "zh-TW";

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
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr", flag: "🇮🇹" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", flag: "🇮🇩" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr", flag: "🇻🇳" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr", flag: "🇵🇱" },
  { code: "th", name: "Thai", nativeName: "ไทย", dir: "ltr", flag: "🇹🇭" },
  { code: "zh-TW", name: "Traditional Chinese", nativeName: "繁體中文", dir: "ltr", flag: "🇹🇼" },
];

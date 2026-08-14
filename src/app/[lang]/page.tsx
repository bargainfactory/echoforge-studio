import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/lib/i18n";
import { locales, type Locale } from "@/lib/locales";
import { translations } from "@/lib/translations/all";
import LandingContent from "@/components/landing-content";

/**
 * Locale-routed landing pages (/es, /pt, /hi, …): the full landing rendered
 * server-side in each of the 19 languages, so every localized surface is
 * indexable. English stays at the root URL.
 */

const NON_EN = locales.filter((l) => l.code !== "en").map((l) => l.code);

const LANGUAGE_ALTERNATES: Record<string, string> = {
  en: "https://virafold.ai/",
  ...Object.fromEntries(NON_EN.map((c) => [c, `https://virafold.ai/${c}`])),
  "x-default": "https://virafold.ai/",
};

export function generateStaticParams() {
  return NON_EN.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = translations[lang];
  if (!dict) return {};
  return {
    title: "Virafold — AI Content Repurposing for Faceless Creators",
    description:
      dict["hero.description"] ??
      "Turn one long-form video into 30+ short-form assets, carousels, newsletters, and TikToks.",
    alternates: {
      canonical: `/${lang}`,
      languages: LANGUAGE_ALTERNATES,
    },
    openGraph: {
      type: "website",
      url: `https://virafold.ai/${lang}`,
      siteName: "Virafold",
      title: "Virafold — AI Content Repurposing for Faceless Creators",
      description: dict["hero.description"] ?? "",
      locale: lang.replace("-", "_"),
    },
  };
}

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!NON_EN.includes(lang as Locale)) notFound();
  return (
    <I18nProvider initialLocale={lang as Locale} initialDict={translations[lang]}>
      <LandingContent />
    </I18nProvider>
  );
}

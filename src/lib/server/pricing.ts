/**
 * Canonical pricing configuration — the single source of truth for plans,
 * one-off packages, and the free-vs-paid comparison strip.
 *
 * This is stored as serializable data (translation KEYS, not resolved text, and
 * icon NAMES, not components) so it can be persisted in SQLite and served over
 * HTTP by /api/pricing. The client resolves keys through i18n and maps icon
 * names to components at render time. Change prices/allotments here (or later,
 * directly in the DB) without touching the presentation layer.
 */

export interface PlanFeatureData {
  key: string;
  included: boolean;
  upgrade?: boolean;
}

export interface PlanData {
  priceId: string;
  nameKey: string;
  descKey: string;
  price: number | "Free";
  periodKey: string;
  icon: string; // "gift" | "rocket" | "zap" | "sparkles" | "crown"
  color: string;
  features: PlanFeatureData[];
  ctaKey: string;
  popular: boolean;
  isFree?: boolean;
}

export interface OneOffData {
  id: string;
  name: string;
  price: number;
  items: string;
}

export interface ComparisonData {
  freeKey: string;
  paidKey: string;
  labelKey: string;
}

export interface PricingConfig {
  plans: PlanData[];
  oneOffs: OneOffData[];
  comparison: ComparisonData[];
}

export const DEFAULT_PRICING: PricingConfig = {
  plans: [
    {
      priceId: "free",
      nameKey: "pricing.freeName",
      descKey: "pricing.freeDesc",
      price: "Free",
      periodKey: "pricing.forever",
      icon: "gift",
      color: "from-gray-500 to-gray-600",
      isFree: true,
      popular: false,
      ctaKey: "pricing.startFree",
      features: [
        { key: "feat.1videoMonth", included: true },
        { key: "feat.3clips", included: true },
        { key: "feat.basicCaptions", included: true },
        { key: "feat.1platform", included: true },
        { key: "feat.720p", included: true },
        { key: "feat.watermark", included: true },
        { key: "feat.7dayTurnaround", included: true },
        { key: "feat.aiVoiceover", included: false, upgrade: true },
        { key: "feat.customBranding", included: false, upgrade: true },
        { key: "feat.dashboardAnalytics", included: false, upgrade: true },
      ],
    },
    {
      priceId: "lite",
      nameKey: "pricing.liteName",
      descKey: "pricing.liteDesc",
      price: 189,
      periodKey: "pricing.month",
      icon: "rocket",
      color: "from-emerald-500 to-cyan-500",
      popular: false,
      ctaKey: "pricing.getStarted",
      features: [
        { key: "feat.2videos", included: true },
        { key: "feat.12clips", included: true },
        { key: "feat.advancedCaptions", included: true },
        { key: "feat.2platforms", included: true },
        { key: "feat.1080p", included: true },
        { key: "feat.noWatermark", included: true },
        { key: "feat.72hTurnaround", included: true },
        { key: "feat.aiVoiceover", included: false, upgrade: true },
        { key: "feat.dashboard", included: false, upgrade: true },
      ],
    },
    {
      priceId: "starter",
      nameKey: "pricing.starterName",
      descKey: "pricing.starterDesc",
      price: 497,
      periodKey: "pricing.month",
      icon: "zap",
      color: "from-electric-blue to-electric-blue-light",
      popular: false,
      ctaKey: "pricing.getStarted",
      features: [
        { key: "feat.4videos", included: true },
        { key: "feat.24clips", included: true },
        { key: "feat.advancedCaptions", included: true },
        { key: "feat.2platforms", included: true },
        { key: "feat.1080p", included: true },
        { key: "feat.noWatermark", included: true },
        { key: "feat.48hTurnaround", included: true },
        { key: "feat.emailSupport", included: true },
        { key: "feat.aiVoiceover", included: false, upgrade: true },
        { key: "feat.dashboard", included: false, upgrade: true },
      ],
    },
    {
      priceId: "creatorPro",
      nameKey: "pricing.proName",
      descKey: "pricing.proDesc",
      price: 997,
      periodKey: "pricing.month",
      icon: "sparkles",
      color: "from-neon-purple to-neon-purple-light",
      popular: true,
      ctaKey: "pricing.startCreating",
      features: [
        { key: "feat.8videos", included: true },
        { key: "feat.52clips", included: true },
        { key: "feat.aiVoiceover", included: true },
        { key: "feat.allPlatforms", included: true },
        { key: "feat.4k", included: true },
        { key: "feat.carouselNewsletter", included: true },
        { key: "feat.24hTurnaround", included: true },
        { key: "feat.dashboard", included: true },
        { key: "feat.slack", included: true },
        { key: "feat.priority", included: true },
      ],
    },
    {
      priceId: "agency",
      nameKey: "pricing.agencyName",
      descKey: "pricing.agencyDesc",
      price: 2497,
      periodKey: "pricing.month",
      icon: "crown",
      color: "from-amber-500 to-amber-600",
      popular: false,
      ctaKey: "pricing.contactSales",
      features: [
        { key: "feat.unlimited", included: true },
        { key: "feat.160clips", included: true },
        { key: "feat.customTemplates", included: true },
        { key: "feat.allPlatforms", included: true },
        { key: "feat.4k", included: true },
        { key: "feat.fullSuite", included: true },
        { key: "feat.sameDayTurnaround", included: true },
        { key: "feat.whiteLabel", included: true },
        { key: "feat.zapier", included: true },
        { key: "feat.apiAccess", included: true },
      ],
    },
  ],
  oneOffs: [
    { id: "single", name: "Single Video Package", price: 199, items: "1 video → 8 assets" },
    { id: "launch", name: "Launch Bundle", price: 999, items: "5 videos → 50+ assets" },
    { id: "course", name: "Course Repurpose", price: 1999, items: "Full course → 100+ assets" },
  ],
  comparison: [
    { freeKey: "pricing.watermarked", paidKey: "pricing.cleanBranded", labelKey: "pricing.yourClips" },
    { freeKey: "pricing.days7", paidKey: "pricing.sameDay", labelKey: "pricing.turnaround" },
    { freeKey: "pricing.clips3", paidKey: "pricing.clips160", labelKey: "pricing.monthlyOutput" },
  ],
};

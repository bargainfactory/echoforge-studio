"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Zap, Crown, Gift, ArrowRight, Lock } from "lucide-react";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";

interface Feature {
  text: string;
  included: boolean;
  upgrade?: boolean;
}

interface Plan {
  name: string;
  description: string;
  price: number | "Free";
  period: string;
  icon: typeof Zap;
  color: string;
  features: Feature[];
  cta: string;
  popular: boolean;
  priceId: string;
  isFree?: boolean;
  upgradeNote?: string;
}

const oneOffs = [
  { name: "Single Video Package", price: 199, items: "1 video → 8 assets" },
  { name: "Launch Bundle", price: 799, items: "5 videos → 50+ assets" },
  { name: "Course Repurpose", price: 1499, items: "Full course → 100+ assets" },
];

export default function Pricing() {
  const router = useRouter();
  const { user, addToast } = useApp();
  const { t } = useTranslation();

  const plans: Plan[] = [
    {
      name: t("pricing.freeName"),
      description: t("pricing.freeDesc"),
      price: "Free",
      period: t("pricing.forever"),
      icon: Gift,
      color: "from-gray-500 to-gray-600",
      isFree: true,
      upgradeNote: t("pricing.noCard"),
      features: [
        { text: t("feat.1videoMonth"), included: true },
        { text: t("feat.3clips"), included: true },
        { text: t("feat.basicCaptions"), included: true },
        { text: t("feat.1platform"), included: true },
        { text: t("feat.720p"), included: true },
        { text: t("feat.watermark"), included: true },
        { text: t("feat.7dayTurnaround"), included: true },
        { text: t("feat.aiVoiceover"), included: false, upgrade: true },
        { text: t("feat.customBranding"), included: false, upgrade: true },
        { text: t("feat.dashboardAnalytics"), included: false, upgrade: true },
      ],
      cta: t("pricing.startFree"),
      popular: false,
      priceId: "free",
    },
    {
      name: t("pricing.starterName"),
      description: t("pricing.starterDesc"),
      price: 497,
      period: t("pricing.month"),
      icon: Zap,
      color: "from-electric-blue to-electric-blue-light",
      features: [
        { text: t("feat.4videos"), included: true },
        { text: t("feat.20clips"), included: true },
        { text: t("feat.advancedCaptions"), included: true },
        { text: t("feat.2platforms"), included: true },
        { text: t("feat.1080p"), included: true },
        { text: t("feat.noWatermark"), included: true },
        { text: t("feat.48hTurnaround"), included: true },
        { text: t("feat.emailSupport"), included: true },
        { text: t("feat.aiVoiceover"), included: false, upgrade: true },
        { text: t("feat.dashboard"), included: false, upgrade: true },
      ],
      cta: t("pricing.getStarted"),
      popular: false,
      priceId: "starter",
    },
    {
      name: t("pricing.proName"),
      description: t("pricing.proDesc"),
      price: 997,
      period: t("pricing.month"),
      icon: Sparkles,
      color: "from-neon-purple to-neon-purple-light",
      features: [
        { text: t("feat.8videos"), included: true },
        { text: t("feat.40clips"), included: true },
        { text: t("feat.aiVoiceover"), included: true },
        { text: t("feat.allPlatforms"), included: true },
        { text: t("feat.4k"), included: true },
        { text: t("feat.carouselNewsletter"), included: true },
        { text: t("feat.24hTurnaround"), included: true },
        { text: t("feat.dashboard"), included: true },
        { text: t("feat.slack"), included: true },
        { text: t("feat.priority"), included: true },
      ],
      cta: t("pricing.startCreating"),
      popular: true,
      priceId: "creatorPro",
    },
    {
      name: t("pricing.agencyName"),
      description: t("pricing.agencyDesc"),
      price: 2497,
      period: t("pricing.month"),
      icon: Crown,
      color: "from-amber-500 to-amber-600",
      features: [
        { text: t("feat.unlimited"), included: true },
        { text: t("feat.100clips"), included: true },
        { text: t("feat.customTemplates"), included: true },
        { text: t("feat.allPlatforms"), included: true },
        { text: t("feat.4k"), included: true },
        { text: t("feat.fullSuite"), included: true },
        { text: t("feat.sameDayTurnaround"), included: true },
        { text: t("feat.whiteLabel"), included: true },
        { text: t("feat.zapier"), included: true },
        { text: t("feat.apiAccess"), included: true },
      ],
      cta: t("pricing.contactSales"),
      popular: false,
      priceId: "agency",
    },
  ];

  const comparisonHighlights = [
    { free: t("pricing.watermarked"), paid: t("pricing.cleanBranded"), label: t("pricing.yourClips") },
    { free: t("pricing.days7"), paid: t("pricing.sameDay"), label: t("pricing.turnaround") },
    { free: t("pricing.clips3"), paid: t("pricing.clips100"), label: t("pricing.monthlyOutput") },
  ];

  function handlePlanClick(plan: Plan) {
    if (plan.priceId === "agency") {
      router.push("/contact");
      return;
    }
    if (plan.isFree) {
      if (user) {
        addToast(t("pricing.alreadyFree"), "info");
      } else {
        addToast(t("pricing.startFree"));
        router.push("/signup");
      }
      return;
    }
    if (!user) {
      addToast(t("pricing.signUpFirst"), "info");
      router.push("/signup");
      return;
    }
    addToast(t("pricing.planSelected", { plan: plan.name }));
    setTimeout(() => {
      addToast(t("pricing.demoMode"), "info");
    }, 1500);
  }

  function handleOneOffClick(pkg: typeof oneOffs[0]) {
    if (!user) {
      addToast(t("pricing.signUpFirst"), "info");
      router.push("/signup");
      return;
    }
    addToast(`${pkg.name} selected — $${pkg.price}`);
    setTimeout(() => {
      addToast("Demo mode: One-time Stripe payment would process here.", "info");
    }, 1500);
  }

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("pricing.title1")} <span className="gradient-text">{t("pricing.title2")}</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            {t("pricing.description")}
          </p>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.priceId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-cyber-card border rounded-2xl p-7 flex flex-col ${
                plan.popular
                  ? "border-neon-purple glow-purple"
                  : plan.isFree
                  ? "border-cyber-border border-dashed"
                  : "border-cyber-border card-hover"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-xs font-medium text-white">
                  {t("pricing.mostPopular")}
                </div>
              )}
              {plan.isFree && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyber-dark border border-cyber-border text-xs font-medium text-cyber-muted">
                  {t("pricing.noCard")}
                </div>
              )}
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
              >
                <plan.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-cyber-muted mb-3">{plan.description}</p>
              <div className="mb-5">
                {plan.price === "Free" ? (
                  <>
                    <span className="text-4xl font-bold text-foreground">$0</span>
                    <span className="text-cyber-muted ml-1">{plan.period}</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-cyber-muted">{plan.period}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-3 rounded-full font-medium text-sm transition-all hover:opacity-90 mb-6 cursor-pointer ${
                  plan.popular
                    ? "bg-gradient-to-r from-neon-purple to-electric-blue text-white"
                    : plan.isFree
                    ? "bg-cyber-dark border border-cyber-border text-foreground hover:border-neon-purple/50 hover:text-neon-purple"
                    : "bg-cyber-dark border border-cyber-border text-foreground hover:border-neon-purple/50"
                }`}
              >
                {plan.cta}
              </button>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2.5 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    ) : feature.upgrade ? (
                      <Lock className="w-4 h-4 text-cyber-muted/40 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-500/40 mt-0.5 shrink-0" />
                    )}
                    <span className={feature.included ? "text-cyber-muted" : "text-cyber-muted/40 line-through"}>
                      {feature.text}
                    </span>
                    {feature.upgrade && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-neon-purple/10 text-neon-purple whitespace-nowrap shrink-0">
                        PRO
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {plan.isFree && (
                <div className="mt-5 pt-4 border-t border-cyber-border">
                  <button
                    onClick={() => handlePlanClick(plans[2])}
                    className="w-full flex items-center justify-center gap-2 text-xs text-neon-purple hover:underline"
                  >
                    {t("pricing.compareWithPro")} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Free vs Paid Comparison Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-gradient-to-r from-neon-purple/5 via-electric-blue/5 to-neon-purple/5 border border-cyber-border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-center text-foreground mb-2">
              {t("pricing.whyUpgrade")}
            </h3>
            <p className="text-sm text-cyber-muted text-center mb-8">
              The free plan proves the value. Paid plans remove the ceiling.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonHighlights.map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-cyber-muted mb-2 uppercase tracking-wider">{item.label}</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <p className="text-sm text-red-400/70 line-through">{item.free}</p>
                      <p className="text-[10px] text-cyber-muted">Free</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neon-purple" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-success">{item.paid}</p>
                      <p className="text-[10px] text-cyber-muted">Paid</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => handlePlanClick(plans[2])}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t("pricing.upgradeToPro")}
              </button>
            </div>
          </div>
        </motion.div>

        {/* One-Off Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-bold text-center mb-8">
            {t("pricing.oneOffPackages")}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {oneOffs.map((pkg) => (
              <button
                key={pkg.name}
                onClick={() => handleOneOffClick(pkg)}
                className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center card-hover cursor-pointer"
              >
                <p className="font-medium text-foreground mb-1">{pkg.name}</p>
                <p className="text-2xl font-bold gradient-text mb-1">${pkg.price}</p>
                <p className="text-sm text-cyber-muted">{pkg.items}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

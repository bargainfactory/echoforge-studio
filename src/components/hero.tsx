"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Sparkles, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import DemoModal from "@/components/demo-modal";
import AuditTeaser from "@/components/audit-teaser";
import { track } from "@/lib/track";

export default function Hero() {
  const { t } = useTranslation();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="relative flex items-center justify-center pt-28 pb-12 lg:pt-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-[128px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_70%)]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {t("hero.badge")}
          </div>

          {/* The audit lead magnet is the hero's centerpiece, directly under the badge. */}
          <AuditTeaser embedded />

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5 mt-8">
            {t("hero.title1")}{" "}
            <span className="gradient-text">{t("hero.title2")}</span>
            <br />
            {t("hero.title3")}
          </h1>
          <p className="text-lg text-cyber-muted max-w-xl mx-auto mb-7">
            {t("hero.description")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              onClick={() => track("cta_start_forging")}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium hover:opacity-90 transition-opacity"
            >
              {t("hero.cta1")}
            </Link>
            <button
              type="button"
              onClick={() => {
                track("cta_see_how");
                setShowDemo(true);
              }}
              className="px-8 py-3.5 rounded-full border border-cyber-border text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              {t("hero.cta2")}
            </button>
          </div>
          <p className="text-xs text-cyber-muted mt-3">{t("hero.noCard")}</p>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 pt-8 border-t border-cyber-border">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-sm text-foreground font-medium">{t("hero.trustRating")}</span>
            </div>
            <div className="text-sm text-cyber-muted">{t("hero.trustCreators")}</div>
            <div className="text-sm text-cyber-muted">{t("hero.trustAssets")}</div>
          </div>
        </motion.div>
      </div>

      <DemoModal open={showDemo} onClose={() => setShowDemo(false)} />
    </section>
  );
}

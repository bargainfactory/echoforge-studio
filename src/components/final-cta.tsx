"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/lib/track";

export default function FinalCta() {
  const { t } = useTranslation();
  return (
    <section className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-neon-purple/30 bg-gradient-to-br from-neon-purple/10 via-cyber-card to-electric-blue/10 p-10 sm:p-14 text-center"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {t("hero.badge")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("finalCta.title1")} <span className="gradient-text">{t("finalCta.title2")}</span>
            </h2>
            <p className="text-cyber-muted max-w-xl mx-auto mb-8">
              {t("finalCta.sub")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                onClick={() => track("cta_final")}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                {t("finalCta.button")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#pricing"
                className="px-8 py-3.5 rounded-full border border-cyber-border text-foreground hover:border-neon-purple/50 transition-colors"
              >
                {t("finalCta.secondary")}
              </Link>
            </div>
            <p className="text-xs text-cyber-muted mt-4">{t("hero.noCard")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

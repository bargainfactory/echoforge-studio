"use client";

import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, Mic2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/**
 * Trust positioning: the three structural guarantees competitors' clip tools
 * don't make — signed provenance, policy-linted output, and a brand voice the
 * engine actually obeys.
 */
export default function TrustPillars() {
  const { t } = useTranslation();

  const pillars = [
    { icon: Fingerprint, title: t("trust.p1t"), desc: t("trust.p1d") },
    { icon: ShieldCheck, title: t("trust.p2t"), desc: t("trust.p2d") },
    { icon: Mic2, title: t("trust.p3t"), desc: t("trust.p3d") },
  ];

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("trust.title")}
          </h2>
          <p className="text-cyber-muted mt-3 max-w-2xl mx-auto">{t("trust.sub")}</p>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-6 hover:border-neon-purple/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-neon-purple" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-cyber-muted leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Film,
  Music,
  Briefcase,
  Mail,
  MessageSquare,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function Services() {
  const { t } = useTranslation();

  // Each card opens its free format-scoped generator. Badges state what the
  // tool does — capability labels, not sample metrics.
  const services = [
    {
      icon: Film,
      title: t("services.youtube"),
      description: t("services.youtubeDesc"),
      stats: "3+ script variants per idea",
      href: "/create/youtube-shorts",
      color: "from-red-500 to-red-600",
    },
    {
      icon: Music,
      title: t("services.tiktok"),
      description: t("services.tiktokDesc"),
      stats: "Hook-first, sub-60s scripts",
      href: "/create/tiktok",
      color: "from-cyan-400 to-cyan-500",
    },
    {
      icon: Briefcase,
      title: t("services.linkedin"),
      description: t("services.linkedinDesc"),
      stats: "Hook + takeaways structure",
      href: "/create/linkedin",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Mail,
      title: t("services.email"),
      description: t("services.emailDesc"),
      stats: "Full edition per upload",
      href: "/create/newsletter",
      color: "from-neon-purple to-neon-purple-light",
    },
    {
      icon: MessageSquare,
      title: t("services.threads"),
      description: t("services.threadsDesc"),
      stats: "8–10 tweets, hook-first",
      href: "/create/thread",
      color: "from-sky-400 to-sky-500",
    },
    {
      icon: LayoutGrid,
      title: t("services.carousel"),
      description: t("services.carouselDesc"),
      stats: "9 slides, ready to design",
      href: "/create/carousel",
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <section id="services" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("services.title1")} <span className="gradient-text">{t("services.title2")}</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            {t("services.description")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={service.href}
                className="group block h-full bg-cyber-card border border-cyber-border rounded-2xl p-6 card-hover hover:border-neon-purple/50 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4`}
                >
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-cyber-muted mb-4">{service.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                    {service.stats}
                  </div>
                  <span className="text-xs text-neon-purple flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("services.createFree")} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

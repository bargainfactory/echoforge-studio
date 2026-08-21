"use client";

import { motion } from "framer-motion";
import { Star, Globe, Layers, Scissors, Gauge } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const stories = [
  {
    name: "Alex Rivera",
    avatar: "AR",
    roleKey: "stories.s1Role",
    quoteKey: "stories.s1Quote",
    metric: "180K subs",
    metricLabelKey: "stories.s1MetricLabel",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    name: "Sarah Chen",
    avatar: "SC",
    roleKey: "stories.s2Role",
    quoteKey: "stories.s2Quote",
    metric: "3x sales",
    metricLabelKey: "stories.s2MetricLabel",
    color: "from-neon-purple to-neon-purple-light",
  },
  {
    name: "Marcus Johnson",
    avatar: "MJ",
    roleKey: "stories.s3Role",
    quoteKey: "stories.s3Quote",
    metric: "$12K/mo",
    metricLabelKey: "stories.s3MetricLabel",
    color: "from-electric-blue to-electric-blue-light",
  },
  {
    name: "Priya Patel",
    avatar: "PP",
    roleKey: "stories.s4Role",
    quoteKey: "stories.s4Quote",
    metric: "500K",
    metricLabelKey: "stories.s4MetricLabel",
    color: "from-pink-500 to-pink-600",
  },
];

export default function SuccessStories() {
  const { t } = useTranslation();

  // Capability facts, not sample metrics — every number here is true of the
  // product today.
  const stats = [
    { icon: Layers, value: "30+", label: t("stories.statAssets") },
    { icon: Globe, value: "19", label: t("stories.statLanguages") },
    { icon: Scissors, value: "60s", label: t("stories.statClips") },
    { icon: Gauge, value: "20s", label: t("stories.statAudit") },
  ];

  return (
    <section id="success-stories" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("stories.title1")} <span className="gradient-text">{t("stories.title2")}</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            {t("stories.description")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {stories.map((story, i) => (
            <motion.div
              key={story.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  {story.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{story.name}</p>
                  <p className="text-sm text-cyber-muted">{t(story.roleKey)}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-cyber-muted mb-4 italic">
                &ldquo;{t(story.quoteKey)}&rdquo;
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-cyber-border">
                <span className="text-xl font-bold gradient-text">{story.metric}</span>
                <span className="text-xs text-cyber-muted">{t(story.metricLabelKey)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cyber-card border border-cyber-border rounded-xl p-6 text-center"
            >
              <stat.icon className="w-6 h-6 text-neon-purple mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-cyber-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

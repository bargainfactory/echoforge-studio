"use client";

import { motion } from "framer-motion";
import {
  Film,
  Music,
  Briefcase,
  Mail,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";

const services = [
  {
    icon: Film,
    title: "YouTube Shorts",
    description:
      "Vertical, captioned clips with motion graphics and AI voiceover. Optimized hooks and retention-boosting edits.",
    stats: "Avg. 12K views/short",
    color: "from-red-500 to-red-600",
  },
  {
    icon: Music,
    title: "TikTok Content",
    description:
      "Trend-aware editing with viral audio pairings, text overlays, and faceless B-roll compositions.",
    stats: "Avg. 8.4% engagement",
    color: "from-cyan-400 to-cyan-500",
  },
  {
    icon: Briefcase,
    title: "LinkedIn Posts",
    description:
      "Authority-building thought leadership posts extracted from your key insights. Carousel-ready.",
    stats: "3x connection growth",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Mail,
    title: "Email Newsletters",
    description:
      "Weekly digests with repurposed highlights, subscriber magnets, and call-to-action blocks.",
    stats: "42% avg open rate",
    color: "from-neon-purple to-neon-purple-light",
  },
  {
    icon: MessageSquare,
    title: "Threads & Twitter",
    description:
      "Multi-part threads with hook-first structure, quote graphics, and engagement triggers.",
    stats: "5x repost rate",
    color: "from-sky-400 to-sky-500",
  },
  {
    icon: LayoutGrid,
    title: "Carousel Design",
    description:
      "Swipeable carousel slides for Instagram and LinkedIn with branded templates and data visuals.",
    stats: "67% save rate",
    color: "from-pink-500 to-pink-600",
  },
];

export default function Services() {
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
            Every Platform. <span className="gradient-text">One Upload.</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            We forge your long-form content into optimized assets for every major
            platform — each tailored for maximum engagement.
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
              className="group bg-cyber-card border border-cyber-border rounded-2xl p-6 card-hover"
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                {service.stats}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

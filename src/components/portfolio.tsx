"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Heart, MessageCircle, Play, X, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const portfolioItems = [
  {
    id: 1,
    title: "AI Productivity Hacks",
    platform: "YouTube Shorts",
    views: "2.4M",
    likes: "89K",
    comments: "3.2K",
    thumbnail: "from-violet-600 via-purple-600 to-indigo-600",
    category: "Tech",
    description: "A faceless short breaking down 5 AI tools that save 10+ hours per week. Uses screen recordings, animated text overlays, and AI-generated voiceover.",
    duration: "0:58",
  },
  {
    id: 2,
    title: "5 Money Rules Nobody Teaches",
    platform: "TikTok",
    views: "1.8M",
    likes: "124K",
    comments: "5.6K",
    thumbnail: "from-emerald-600 via-green-600 to-teal-600",
    category: "Finance",
    description: "High-retention finance clip with kinetic typography, stock footage overlays, and a compelling hook that drove 124K likes.",
    duration: "0:45",
  },
  {
    id: 3,
    title: "The Stoic Morning Routine",
    platform: "Instagram Reels",
    views: "890K",
    likes: "67K",
    comments: "2.1K",
    thumbnail: "from-amber-600 via-orange-600 to-red-600",
    category: "Lifestyle",
    description: "Cinematic B-roll sequences with motivational AI voiceover. Calm, aesthetic editing style optimized for saves and shares.",
    duration: "1:12",
  },
  {
    id: 4,
    title: "How Markets Really Work",
    platform: "YouTube Shorts",
    views: "3.1M",
    likes: "156K",
    comments: "8.4K",
    thumbnail: "from-blue-600 via-cyan-600 to-teal-600",
    category: "Finance",
    description: "Animated explainer using motion graphics to visualize market mechanics. Our highest-performing faceless short to date.",
    duration: "0:52",
  },
  {
    id: 5,
    title: "Python in 60 Seconds",
    platform: "TikTok",
    views: "1.2M",
    likes: "93K",
    comments: "4.7K",
    thumbnail: "from-yellow-500 via-amber-500 to-orange-500",
    category: "Tech",
    description: "Code walkthrough with syntax-highlighted screen capture, zoom animations, and step-by-step AI narration.",
    duration: "1:00",
  },
  {
    id: 6,
    title: "Sleep Science Explained",
    platform: "Instagram Reels",
    views: "670K",
    likes: "45K",
    comments: "1.8K",
    thumbnail: "from-indigo-600 via-blue-600 to-cyan-600",
    category: "Health",
    description: "Data visualization meets storytelling — animated charts and calming visuals explain the science of sleep cycles.",
    duration: "0:48",
  },
];

export default function Portfolio() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<typeof portfolioItems[0] | null>(null);

  return (
    <section id="portfolio" className="py-24 bg-cyber-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("portfolio.title1")} <span className="gradient-text">{t("portfolio.title2")}</span>
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto">
            {t("portfolio.description")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden card-hover cursor-pointer"
              onClick={() => setSelected(item)}
            >
              <div
                className={`relative aspect-[9/16] max-h-64 bg-gradient-to-br ${item.thumbnail} flex items-center justify-center`}
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white font-medium">
                  {item.category}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white">
                  {item.platform}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground mb-3">{item.title}</h3>
                <div className="flex items-center gap-4 text-xs text-cyber-muted">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {item.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {item.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {item.comments}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden w-full max-w-lg"
            >
              <div className={`aspect-video bg-gradient-to-br ${selected.thumbnail} relative flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-white text-sm font-medium">{t("portfolio.preview")} — {selected.duration}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/10 text-neon-purple">{selected.category}</span>
                  <span className="text-xs text-cyber-muted">{selected.platform}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{selected.title}</h3>
                <p className="text-sm text-cyber-muted mb-4">{selected.description}</p>
                <div className="flex items-center gap-6 text-sm text-cyber-muted pb-4 border-b border-cyber-border">
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {selected.views}</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {selected.likes}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {selected.comments}</span>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("portfolio.viewOn", { platform: selected.platform })}
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-4 py-2.5 rounded-xl border border-cyber-border text-sm text-foreground hover:border-neon-purple/50 transition-colors"
                  >
                    {t("portfolio.close")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

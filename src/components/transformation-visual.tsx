"use client";

/**
 * The show-don't-tell hero centerpiece: one recording visually fanning out
 * into a Short, a carousel, a newsletter, and a thread. Pure CSS mockups —
 * no image assets, so it ships weightless and adapts to the theme.
 */

import { motion } from "framer-motion";
import { FileVideo, Play, Mail, MessageSquare, GalleryHorizontalEnd } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const WAVE = [5, 9, 14, 8, 12, 16, 10, 6, 13, 9, 15, 7, 11, 5, 8];

function fade(delay: number) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  };
}

export default function TransformationVisual() {
  const { t } = useTranslation();

  return (
    <div className="relative select-none" aria-hidden="true">
      {/* Source: one recording */}
      <motion.div
        {...fade(0.1)}
        className="mx-auto w-full max-w-[300px] bg-cyber-card border border-cyber-border rounded-2xl p-4 shadow-lg shadow-neon-purple/5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center">
            <FileVideo className="w-4.5 h-4.5 text-neon-purple" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{t("tv.source")}</p>
            <p className="text-[10px] text-cyber-muted">48:12 · podcast_ep24.mp4</p>
          </div>
        </div>
        <div className="flex items-end gap-[3px] h-8">
          {WAVE.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-neon-purple/70 to-electric-blue/70"
              style={{ height: `${h * 2}px` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Fan-out connectors */}
      <motion.div {...fade(0.25)} className="flex justify-center py-1.5">
        <svg width="220" height="34" viewBox="0 0 220 34" fill="none" className="opacity-60">
          <path d="M110 0 C 110 20, 30 12, 24 34" stroke="url(#tvg)" strokeWidth="1.5" />
          <path d="M110 0 C 110 22, 82 16, 80 34" stroke="url(#tvg)" strokeWidth="1.5" />
          <path d="M110 0 C 110 22, 138 16, 140 34" stroke="url(#tvg)" strokeWidth="1.5" />
          <path d="M110 0 C 110 20, 190 12, 196 34" stroke="url(#tvg)" strokeWidth="1.5" />
          <defs>
            <linearGradient id="tvg" x1="0" y1="0" x2="220" y2="0">
              <stop stopColor="#a855f7" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Outputs: the month of content */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Short — 9:16 with caption chips */}
        <motion.div
          {...fade(0.35)}
          className="bg-cyber-card border border-cyber-border rounded-xl p-2 flex flex-col"
        >
          <div className="relative flex-1 min-h-[86px] rounded-lg bg-gradient-to-b from-neon-purple/25 to-electric-blue/20 border border-cyber-border overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-4 h-4 text-white/80 fill-white/80" />
            </div>
            <div className="absolute bottom-2 inset-x-1.5 space-y-1">
              <div className="mx-auto w-3/4 h-1.5 rounded-full bg-white/85" />
              <div className="mx-auto w-1/2 h-1.5 rounded-full bg-white/60" />
            </div>
          </div>
          <p className="text-[9px] text-cyber-muted text-center mt-1.5">{t("tv.short")}</p>
        </motion.div>

        {/* Carousel — square with dots */}
        <motion.div
          {...fade(0.45)}
          className="bg-cyber-card border border-cyber-border rounded-xl p-2 flex flex-col"
        >
          <div className="flex-1 min-h-[86px] rounded-lg bg-cyber-dark border border-cyber-border p-1.5 flex flex-col justify-between">
            <GalleryHorizontalEnd className="w-3.5 h-3.5 text-electric-blue" />
            <div className="space-y-1">
              <div className="w-full h-1 rounded-full bg-foreground/40" />
              <div className="w-2/3 h-1 rounded-full bg-foreground/25" />
            </div>
            <div className="flex justify-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${i === 0 ? "bg-electric-blue" : "bg-cyber-muted/40"}`}
                />
              ))}
            </div>
          </div>
          <p className="text-[9px] text-cyber-muted text-center mt-1.5">{t("tv.carousel")}</p>
        </motion.div>

        {/* Newsletter — lines + button */}
        <motion.div
          {...fade(0.55)}
          className="bg-cyber-card border border-cyber-border rounded-xl p-2 flex flex-col"
        >
          <div className="flex-1 min-h-[86px] rounded-lg bg-cyber-dark border border-cyber-border p-1.5 flex flex-col gap-1">
            <Mail className="w-3.5 h-3.5 text-neon-purple" />
            <div className="w-full h-1 rounded-full bg-foreground/40" />
            <div className="w-5/6 h-1 rounded-full bg-foreground/25" />
            <div className="w-full h-1 rounded-full bg-foreground/25" />
            <div className="mt-auto w-1/2 h-2.5 rounded bg-gradient-to-r from-neon-purple to-electric-blue" />
          </div>
          <p className="text-[9px] text-cyber-muted text-center mt-1.5">{t("tv.newsletter")}</p>
        </motion.div>

        {/* Thread — avatar + stacked posts */}
        <motion.div
          {...fade(0.65)}
          className="bg-cyber-card border border-cyber-border rounded-xl p-2 flex flex-col"
        >
          <div className="flex-1 min-h-[86px] rounded-lg bg-cyber-dark border border-cyber-border p-1.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-neon-purple to-electric-blue" />
              <div className="w-1/2 h-1 rounded-full bg-foreground/40" />
            </div>
            <div className="w-full h-1 rounded-full bg-foreground/25" />
            <div className="w-4/5 h-1 rounded-full bg-foreground/25" />
            <div className="border-l border-cyber-muted/30 ml-1.5 pl-1.5 space-y-1 mt-0.5">
              <div className="w-3/4 h-1 rounded-full bg-foreground/20" />
              <div className="w-2/3 h-1 rounded-full bg-foreground/20" />
            </div>
            <MessageSquare className="w-3 h-3 text-cyber-muted mt-auto" />
          </div>
          <p className="text-[9px] text-cyber-muted text-center mt-1.5">{t("tv.thread")}</p>
        </motion.div>
      </div>

      <motion.p {...fade(0.75)} className="text-center text-[11px] text-cyber-muted mt-3">
        {t("tv.caption")}
      </motion.p>
    </div>
  );
}

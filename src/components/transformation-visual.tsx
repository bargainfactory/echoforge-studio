"use client";

/**
 * The show-don't-tell hero centerpiece: one recording visually fanning out
 * into a Short, a carousel, a newsletter, and a thread. Pure CSS/SVG mockups —
 * no image assets, so it ships weightless and adapts to the theme.
 * Styled to the approved diagram: pill waveform, vine-like connector curves,
 * four roomy output cards with labels inside.
 */

import { motion } from "framer-motion";
import { FileVideo, Play, Mail, MessageSquare, GalleryHorizontalEnd } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const WAVE = [8, 18, 26, 14, 20, 30, 16, 10, 22, 18, 28, 12, 20, 8, 14];

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
        className="mx-auto w-full max-w-[380px] bg-cyber-card border border-cyber-border rounded-2xl p-5 shadow-lg shadow-neon-purple/5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center">
            <FileVideo className="w-5 h-5 text-neon-purple" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{t("tv.source")}</p>
            <p className="text-[11px] text-cyber-muted mt-0.5">48:12 · podcast_ep24.mp4</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-1.5 h-11">
          {WAVE.map((h, i) => (
            <div
              key={i}
              className="w-3 rounded-full bg-gradient-to-t from-electric-blue/80 to-neon-purple/90"
              style={{ height: `${Math.max(10, h * 1.4)}px` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Vine-like fan-out connectors */}
      <motion.div {...fade(0.25)} className="flex justify-center -mt-0.5">
        <svg
          width="100%"
          height="64"
          viewBox="0 0 600 64"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          className="max-w-[600px] opacity-80"
        >
          <path
            d="M300 2 C 300 26, 160 18, 96 58 C 90 62, 84 60, 82 56"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M300 2 C 300 30, 250 26, 230 56 C 227 61, 221 61, 219 57"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M300 2 C 300 30, 350 26, 370 56 C 373 61, 379 61, 381 57"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M300 2 C 300 26, 440 18, 504 58 C 510 62, 516 60, 518 56"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Outputs: the month of content */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1">
        {/* Short — 9:16 with caption bar */}
        <motion.div
          {...fade(0.35)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3 flex flex-col"
        >
          <div className="relative flex-1 min-h-[104px] rounded-xl bg-gradient-to-b from-neon-purple/35 to-cyber-dark border border-cyber-border overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2.5 inset-x-2.5 space-y-1">
              <div className="mx-auto w-4/5 h-2 rounded-full bg-white/90" />
              <div className="mx-auto w-1/2 h-1.5 rounded-full bg-white/50" />
            </div>
          </div>
          <p className="text-[11px] text-cyber-muted text-center mt-2.5">{t("tv.short")}</p>
        </motion.div>

        {/* Carousel — slides with dots */}
        <motion.div
          {...fade(0.45)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3 flex flex-col"
        >
          <div className="flex-1 min-h-[104px] rounded-xl bg-cyber-dark border border-cyber-border p-2.5 flex flex-col justify-between">
            <GalleryHorizontalEnd className="w-4 h-4 text-electric-blue" />
            <div className="space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-foreground/40" />
              <div className="w-2/3 h-1.5 rounded-full bg-foreground/25" />
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-electric-blue" : "bg-cyber-muted/40"}`}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-cyber-muted text-center mt-2.5">{t("tv.carousel")}</p>
        </motion.div>

        {/* Newsletter — lines + button */}
        <motion.div
          {...fade(0.55)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3 flex flex-col"
        >
          <div className="flex-1 min-h-[104px] rounded-xl bg-cyber-dark border border-cyber-border p-2.5 flex flex-col gap-1.5">
            <Mail className="w-4 h-4 text-neon-purple" />
            <div className="w-full h-1.5 rounded-full bg-foreground/40" />
            <div className="w-5/6 h-1.5 rounded-full bg-foreground/25" />
            <div className="w-full h-1.5 rounded-full bg-foreground/25" />
            <div className="mt-auto w-3/5 h-3.5 rounded-md bg-gradient-to-r from-neon-purple to-electric-blue" />
          </div>
          <p className="text-[11px] text-cyber-muted text-center mt-2.5">{t("tv.newsletter")}</p>
        </motion.div>

        {/* Thread — avatar + stacked posts */}
        <motion.div
          {...fade(0.65)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3 flex flex-col"
        >
          <div className="flex-1 min-h-[104px] rounded-xl bg-cyber-dark border border-cyber-border p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-neon-purple to-electric-blue" />
              <div className="w-2/3 h-1.5 rounded-full bg-foreground/40" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-foreground/25" />
            <div className="w-4/5 h-1.5 rounded-full bg-foreground/25" />
            <div className="border-l-2 border-cyber-muted/30 ml-2 pl-2 space-y-1.5 mt-0.5">
              <div className="w-3/4 h-1.5 rounded-full bg-foreground/20" />
              <div className="w-2/3 h-1.5 rounded-full bg-foreground/20" />
            </div>
            <MessageSquare className="w-3.5 h-3.5 text-cyber-muted mt-auto" />
          </div>
          <p className="text-[11px] text-cyber-muted text-center mt-2.5">{t("tv.thread")}</p>
        </motion.div>
      </div>

      <motion.p {...fade(0.75)} className="text-center text-xs text-cyber-muted mt-4">
        {t("tv.caption")}
      </motion.p>
    </div>
  );
}

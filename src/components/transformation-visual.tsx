"use client";

/**
 * The show-don't-tell hero centerpiece: one recording visually fanning out
 * into a Short, a carousel, a newsletter, and a thread. Pure CSS/SVG mockups —
 * no image assets, so it ships weightless and adapts to the theme.
 * Faithful to the approved diagram: symmetric purple→blue waveform, curved
 * connector vines ending in node dots, and four glassy output cards.
 */

import { motion } from "framer-motion";
import { FileVideo, Play, Mail, Layers, MessageCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// Symmetric audio waveform silhouette (center-out bar heights, px).
const WAVE = [
  4, 6, 10, 16, 8, 22, 30, 14, 38, 24, 10, 30, 44, 20, 12, 34, 26, 8, 18, 36,
  46, 22, 12, 28, 38, 16, 8, 20, 30, 10, 6, 4,
];

/** Per-bar color blend from neon purple to electric blue, left → right. */
function barColor(i: number, n: number): string {
  const t = i / (n - 1);
  const a = [168, 85, 247]; // #a855f7
  const b = [59, 130, 246]; // #3b82f6
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

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
        className="mx-auto w-full max-w-[440px] bg-cyber-card border border-neon-purple/25 rounded-3xl p-6 shadow-[0_0_35px_rgba(168,85,247,0.12)]"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple to-fuchsia-600 shadow-lg shadow-neon-purple/30 flex items-center justify-center">
            <FileVideo className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground truncate">{t("tv.source")}</p>
            <p className="text-xs text-cyber-muted mt-0.5">48:12 · podcast_ep24.mp4</p>
          </div>
        </div>
        {/* Mirrored waveform, purple → blue */}
        <div className="flex items-center justify-between gap-[3px] h-14">
          {WAVE.map((h, i) => (
            <div
              key={i}
              className="flex-1 max-w-[5px] rounded-full"
              style={{ height: `${h}px`, backgroundColor: barColor(i, WAVE.length) }}
            />
          ))}
        </div>
      </motion.div>

      {/* Connector vines with node dots */}
      <motion.div {...fade(0.25)} className="flex justify-center -mt-1">
        <svg
          width="100%"
          height="88"
          viewBox="0 0 600 88"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          className="max-w-[600px]"
        >
          <path d="M283 0 C 272 42, 145 30, 80 70" stroke="#9061f9" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
          <path d="M294 0 C 291 46, 236 40, 227 70" stroke="#9061f9" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
          <path d="M306 0 C 309 46, 364 40, 373 70" stroke="#9061f9" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
          <path d="M317 0 C 328 42, 455 30, 520 70" stroke="#9061f9" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
          {[80, 227, 373, 520].map((x) => (
            <circle key={x} cx={x} cy="74" r="5" fill="#a855f7" opacity="0.95" />
          ))}
        </svg>
      </motion.div>

      {/* Outputs: the month of content */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1">
        {/* YouTube Short — glowing thumbnail, ring play, progress bar */}
        <motion.div {...fade(0.35)} className="flex flex-col">
          <div className="bg-cyber-card border border-cyber-border rounded-3xl p-3 flex-1">
            <div className="relative h-full min-h-[120px] rounded-2xl overflow-hidden bg-gradient-to-b from-neon-purple/60 via-purple-800/50 to-purple-950/60">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,rgba(216,180,254,0.5),transparent_60%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-white/90 flex items-center justify-center">
                  <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-3 inset-x-3 h-1.5 rounded-full bg-white/20">
                <div className="h-full w-2/5 rounded-full bg-neon-purple" />
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground/85 text-center mt-3">{t("tv.short")}</p>
        </motion.div>

        {/* Carousel — gradient headline bar, layers, dots */}
        <motion.div {...fade(0.45)} className="flex flex-col">
          <div className="bg-cyber-card border border-cyber-border rounded-3xl p-4 flex-1 flex flex-col min-h-[132px]">
            <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue" />
            <div className="w-3/4 h-2 rounded-full bg-foreground/30 mt-2.5" />
            <div className="w-1/2 h-2 rounded-full bg-foreground/20 mt-2" />
            <div className="flex-1 flex items-center justify-center py-2">
              <Layers className="w-9 h-9 text-electric-blue" />
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === 0 ? "bg-electric-blue" : "bg-cyber-muted/40"}`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-foreground/85 text-center mt-3">{t("tv.carousel")}</p>
        </motion.div>

        {/* Newsletter — envelope, copy lines, gradient send bar */}
        <motion.div {...fade(0.55)} className="flex flex-col">
          <div className="bg-cyber-card border border-cyber-border rounded-3xl p-4 flex-1 flex flex-col min-h-[132px]">
            <div className="flex-1 flex items-center justify-center py-1">
              <Mail className="w-11 h-11 text-neon-purple" strokeWidth={1.7} />
            </div>
            <div className="w-full h-2 rounded-full bg-foreground/30" />
            <div className="w-4/5 h-2 rounded-full bg-foreground/20 mt-2" />
            <div className="w-3/5 h-2 rounded-full bg-foreground/15 mt-2" />
            <div className="w-full h-3 rounded-full bg-foreground/15 mt-3 overflow-hidden">
              <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue" />
            </div>
          </div>
          <p className="text-sm text-foreground/85 text-center mt-3">{t("tv.newsletter")}</p>
        </motion.div>

        {/* X Thread — X badge, post lines, reply bubble */}
        <motion.div {...fade(0.65)} className="flex flex-col">
          <div className="bg-cyber-card border border-cyber-border rounded-3xl p-4 flex-1 flex flex-col min-h-[132px]">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-3">
              <span className="text-white font-extrabold text-lg leading-none">𝕏</span>
            </div>
            <div className="w-full h-2 rounded-full bg-foreground/30" />
            <div className="w-5/6 h-2 rounded-full bg-foreground/22 mt-2" />
            <div className="w-2/3 h-2 rounded-full bg-foreground/18 mt-2" />
            <div className="flex items-center gap-2 mt-auto pt-3">
              <MessageCircle className="w-5 h-5 text-neon-purple" strokeWidth={1.8} />
              <div className="w-1/2 h-2 rounded-full bg-foreground/20" />
            </div>
          </div>
          <p className="text-sm text-foreground/85 text-center mt-3">{t("tv.thread")}</p>
        </motion.div>
      </div>

      <motion.p {...fade(0.75)} className="text-center text-sm text-cyber-muted mt-5">
        {t("tv.caption")}
      </motion.p>
    </div>
  );
}

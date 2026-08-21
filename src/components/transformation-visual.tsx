"use client";

/**
 * The show-don't-tell hero centerpiece: a horizontal recording bar fanning
 * out into four platform cards carrying realistic sample content — concrete
 * fake-real output persuades where abstract bars only decorate. Pure
 * CSS/SVG, no image assets. Sample strings are marketing surface (en).
 */

import { motion } from "framer-motion";
import { Clock, Disc3, Mail, Play, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const WAVE = [
  6, 10, 16, 9, 22, 30, 14, 36, 24, 12, 30, 42, 20, 12, 32, 26, 10, 18, 36,
  44, 22, 12, 28, 38, 16, 8, 20, 30, 12, 24, 34, 15, 9, 26, 18, 8, 14, 6,
];

function barColor(i: number, n: number): string {
  const t = i / (n - 1);
  const a = [168, 85, 247];
  const b = [59, 130, 246];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function fade(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  };
}

export default function TransformationVisual() {
  const { t } = useTranslation();

  return (
    <div className="relative select-none" aria-hidden="true">
      {/* The recording: one horizontal bar, filename to duration */}
      <motion.div
        {...fade(0.05)}
        className="mx-auto w-full max-w-3xl bg-cyber-card border border-neon-purple/30 rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-4 shadow-[0_0_35px_rgba(168,85,247,0.12)]"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-purple to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-neon-purple/30">
          <Disc3 className="w-5 h-5 text-white" />
        </div>
        <div className="shrink-0 min-w-0 hidden sm:block">
          <p className="text-sm font-semibold text-foreground">{t("tv.source")}</p>
          <p className="text-[11px] text-cyber-muted">Podcast_0520.mp3</p>
        </div>
        <div className="flex-1 flex items-center justify-between gap-[3px] h-10 min-w-0">
          {WAVE.map((h, i) => (
            <div
              key={i}
              className="flex-1 max-w-[5px] rounded-full"
              style={{ height: `${Math.max(6, h)}px`, backgroundColor: barColor(i, WAVE.length) }}
            />
          ))}
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyber-dark border border-cyber-border text-xs text-cyber-muted tabular-nums">
          <Clock className="w-3.5 h-3.5" /> 32:18
        </div>
      </motion.div>

      {/* Fan-out connectors */}
      <motion.div {...fade(0.15)} className="flex justify-center -mt-0.5">
        <svg
          width="100%"
          height="72"
          viewBox="0 0 800 72"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          className="max-w-[800px]"
        >
          <path d="M384 0 C 370 34, 170 26, 104 58" stroke="#9061f9" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          <path d="M395 0 C 390 38, 318 32, 302 58" stroke="#9061f9" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          <path d="M405 0 C 410 38, 482 32, 498 58" stroke="#9061f9" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          <path d="M416 0 C 430 34, 630 26, 696 58" stroke="#9061f9" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          {[104, 302, 498, 696].map((x) => (
            <circle key={x} cx={x} cy="62" r="4.5" fill="#a855f7" opacity="0.95" />
          ))}
        </svg>
      </motion.div>

      {/* Four platform cards with fake-real sample output */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {/* YouTube Short */}
        <motion.div
          {...fade(0.25)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3.5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center shrink-0">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </span>
            <p className="text-xs font-semibold text-foreground">{t("tv.short")}</p>
          </div>
          <div className="relative flex-1 min-h-[110px] rounded-xl overflow-hidden bg-gradient-to-b from-neon-purple/50 via-purple-900/40 to-cyber-dark">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-white/85 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
          <div>
            <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-neon-purple to-fuchsia-500" />
            </div>
            <p className="text-[10px] text-cyber-muted mt-1.5 tabular-nums">0:48 / 0:60</p>
          </div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          {...fade(0.35)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3.5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
              in
            </span>
            <p className="text-xs font-semibold text-foreground">{t("tv.carousel")}</p>
          </div>
          <div className="relative flex-1 min-h-[110px]">
            <div className="absolute inset-x-4 top-3 bottom-1 rounded-xl bg-cyber-dark/60 border border-cyber-border" />
            <div className="absolute inset-x-2 top-1.5 bottom-2.5 rounded-xl bg-cyber-dark/80 border border-cyber-border" />
            <div className="absolute inset-x-0 top-0 bottom-4 rounded-xl bg-cyber-dark border border-cyber-border p-3 flex flex-col justify-center">
              <p className="text-2xl font-black text-foreground leading-none">5</p>
              <p className="text-xs font-bold text-foreground mt-1 leading-tight">
                INSIGHTS you can steal
              </p>
            </div>
          </div>
          <p className="text-[10px] text-cyber-muted text-center">• 1/8 •</p>
        </motion.div>

        {/* Newsletter */}
        <motion.div
          {...fade(0.45)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3.5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5 text-neon-purple" />
            </span>
            <p className="text-xs font-semibold text-foreground">{t("tv.newsletter")}</p>
          </div>
          <div className="flex-1 min-h-[110px] rounded-xl bg-cyber-dark border border-cyber-border p-3 flex flex-col items-center justify-center text-center gap-1.5">
            <Mail className="w-7 h-7 text-neon-purple" strokeWidth={1.6} />
            <p className="text-sm font-bold text-foreground leading-tight">Idea to Income</p>
            <p className="text-[10px] text-cyber-muted leading-snug">
              Weekly strategies for faceless creators
            </p>
          </div>
          <div className="h-2 rounded-full bg-cyber-border overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue" />
          </div>
        </motion.div>

        {/* X Thread */}
        <motion.div
          {...fade(0.55)}
          className="bg-cyber-card border border-cyber-border rounded-2xl p-3.5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-cyber-dark border border-cyber-border flex items-center justify-center shrink-0 text-foreground text-xs font-extrabold">
              𝕏
            </span>
            <p className="text-xs font-semibold text-foreground">{t("tv.thread")}</p>
          </div>
          <div className="flex-1 min-h-[110px] rounded-xl bg-cyber-dark border border-cyber-border p-3 flex flex-col gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center text-white text-[9px] font-bold">
              V
            </span>
            <p className="text-[11px] text-foreground/90 leading-snug">
              How I turned one podcast into 30+ assets without showing my face.
            </p>
          </div>
          <p className="text-[10px] text-neon-purple">Thread 🧵 (1/12)</p>
        </motion.div>
      </div>

      <motion.p
        {...fade(0.65)}
        className="text-center text-sm text-cyber-muted mt-5 flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4 text-neon-purple" /> {t("tv.caption")}
      </motion.p>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Sparkles,
  Film,
  FileText,
  Mail,
  MessageSquare,
  Star,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import DemoModal from "@/components/demo-modal";
import { track } from "@/lib/track";

interface TryAsset {
  name: string;
  type: string;
  content: string;
}

function iconFor(type: string) {
  const t = type.toLowerCase();
  if (t.includes("carousel") || t.includes("linkedin")) return FileText;
  if (t.includes("newsletter") || t.includes("email")) return Mail;
  if (t.includes("thread") || t.includes("twitter") || t.includes("x ")) return MessageSquare;
  return Film;
}
const CARD_COLORS = [
  "from-red-500 to-red-600",
  "from-cyan-500 to-cyan-600",
  "from-pink-500 to-rose-600",
  "from-blue-500 to-blue-600",
  "from-neon-purple to-neon-purple-light",
  "from-sky-400 to-sky-500",
];

export default function Hero() {
  const { t, locale } = useTranslation();
  const [showDemo, setShowDemo] = useState(false);

  const [input, setInput] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [assets, setAssets] = useState<TryAsset[]>([]);
  const [expanded, setExpanded] = useState(0);

  // Seed the sample prompt in the chosen language once translations load
  // (render-time adjustment — no effect, no cascading render once seeded).
  if (!seeded && input === "") {
    const prefill = t("hero.tryPrefill");
    if (prefill && prefill !== "hero.tryPrefill") {
      setSeeded(true);
      setInput(prefill);
    }
  }

  const generate = useCallback(async () => {
    if (!input.trim()) return;
    track("try_generate_click", { chars: input.length });
    setStage("loading");
    try {
      const res = await fetch("/api/try", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, locale }),
      });
      const data = await res.json();
      setAssets(data.assets ?? []);
      setExpanded(0);
      setStage("done");
    } catch {
      setStage("idle");
    }
  }, [input, locale]);

  return (
    <section className="relative flex items-center justify-center pt-28 pb-20 lg:pt-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-[128px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_70%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              {t("hero.title1")}{" "}
              <span className="gradient-text">{t("hero.title2")}</span>
              <br />
              {t("hero.title3")}
            </h1>
            <p className="text-lg text-cyber-muted max-w-lg mb-7">
              {t("hero.description")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                onClick={() => track("cta_start_forging")}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium hover:opacity-90 transition-opacity"
              >
                {t("hero.cta1")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  track("cta_see_how");
                  setShowDemo(true);
                }}
                className="px-8 py-3.5 rounded-full border border-cyber-border text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {t("hero.cta2")}
              </button>
            </div>
            <p className="text-xs text-cyber-muted mt-3">{t("hero.noCard")}</p>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 pt-8 border-t border-cyber-border">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-foreground font-medium">{t("hero.trustRating")}</span>
              </div>
              <div className="text-sm text-cyber-muted">{t("hero.trustCreators")}</div>
              <div className="text-sm text-cyber-muted">{t("hero.trustAssets")}</div>
            </div>
          </motion.div>

          {/* Right — real try-it */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-purple/20 to-electric-blue/20 rounded-2xl blur-xl" />
              <div className="relative bg-cyber-card border border-cyber-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-cyber-muted font-mono">echoforge.ai/studio</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success">
                    {t("hero.tryLive")}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {stage !== "done" ? (
                    <motion.div
                      key="input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-sm font-medium text-foreground mb-1">{t("hero.tryTitle")}</p>
                      <p className="text-xs text-cyber-muted mb-3">{t("hero.trySub")}</p>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={5}
                        placeholder={t("hero.tryPlaceholder")}
                        className="w-full px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50 resize-none"
                      />
                      <button
                        onClick={generate}
                        disabled={stage === "loading" || !input.trim()}
                        className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {stage === "loading" ? t("hero.tryLoading") : t("hero.tryBtn")}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-foreground">
                          {t("hero.tryResults", { count: assets.length })}
                        </p>
                        <button
                          onClick={() => setStage("idle")}
                          className="text-xs text-neon-purple hover:underline inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> {t("hero.tryAgain")}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {assets.slice(0, 6).map((a, i) => {
                          const Icon = iconFor(a.type);
                          const open = expanded === i;
                          return (
                            <div
                              key={i}
                              className="rounded-lg bg-cyber-dark border border-cyber-border overflow-hidden"
                            >
                              <button
                                onClick={() => setExpanded(open ? -1 : i)}
                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-cyber-card/40 transition-colors"
                              >
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} flex items-center justify-center shrink-0`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground truncate">{a.name}</p>
                                  <p className="text-xs text-cyber-muted">{a.type}</p>
                                </div>
                              </button>
                              {open && (
                                <pre className="px-3 pb-3 text-[11px] leading-relaxed text-cyber-muted whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                                  {a.content}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <Link
                        href="/signup"
                        onClick={() => track("cta_try_signup")}
                        className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        {t("hero.trySignup")} <ArrowRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <DemoModal open={showDemo} onClose={() => setShowDemo(false)} />
    </section>
  );
}

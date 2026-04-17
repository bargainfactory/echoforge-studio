"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Play,
  Sparkles,
  Film,
  FileText,
  Mail,
  MessageSquare,
  Check,
} from "lucide-react";

const outputTypes = [
  { icon: Film, label: "YouTube Short", duration: "0:58", color: "from-red-500 to-red-600" },
  { icon: Film, label: "TikTok Clip", duration: "0:32", color: "from-cyan-500 to-cyan-600" },
  { icon: FileText, label: "LinkedIn Post", duration: "847 words", color: "from-blue-500 to-blue-600" },
  { icon: Mail, label: "Newsletter", duration: "1,204 words", color: "from-neon-purple to-neon-purple-light" },
  { icon: MessageSquare, label: "Twitter Thread", duration: "12 tweets", color: "from-sky-400 to-sky-500" },
];

export default function Hero() {
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback((name?: string) => {
    if (name) setFileName(name);
    setStage("uploading");
    setTimeout(() => setStage("processing"), 1500);
    setTimeout(() => setStage("done"), 4000);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      simulateUpload(file?.name || "video.mp4");
    },
    [simulateUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) simulateUpload(file.name);
    },
    [simulateUpload]
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-[128px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_70%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Content Engine
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                One Video.{" "}
                <span className="gradient-text">30+ Assets.</span>
                <br />
                Zero Face Required.
              </h1>
              <p className="text-lg text-cyber-muted max-w-lg mb-8">
                Upload your podcast or video and watch our AI instantly forge it into
                shorts, carousels, newsletters, and TikToks — all faceless, all branded,
                all monetizable.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Start Forging Content
                </Link>
                <Link
                  href="/#how-it-works"
                  className="px-8 py-3.5 rounded-full border border-cyber-border text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  See How It Works
                </Link>
              </div>
            </motion.div>
          </div>

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
                  <span className="ml-2 text-xs text-cyber-muted font-mono">
                    echoforge.ai/studio
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <AnimatePresence mode="wait">
                  {stage === "idle" && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? "border-neon-purple bg-neon-purple/5"
                          : "border-cyber-border hover:border-cyber-muted"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 text-cyber-muted mx-auto mb-4" />
                      <p className="text-foreground font-medium mb-1">
                        Drop your video here
                      </p>
                      <p className="text-sm text-cyber-muted">
                        or click to upload — MP4, MOV, MP3
                      </p>
                    </motion.div>
                  )}

                  {stage === "uploading" && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl bg-cyber-dark p-12 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
                      <p className="text-foreground font-medium">Uploading{fileName ? `: ${fileName}` : "..."}
                      </p>
                      <div className="mt-4 h-1.5 bg-cyber-border rounded-full overflow-hidden max-w-xs mx-auto">
                        <motion.div
                          className="h-full bg-gradient-to-r from-neon-purple to-electric-blue rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {stage === "processing" && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl bg-cyber-dark p-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-neon-purple animate-pulse" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">AI Processing</p>
                          <p className="text-xs text-cyber-muted">
                            Analyzing &amp; forging content...
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {["Transcribing audio", "Extracting key moments", "Generating assets"].map(
                          (step, i) => (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.5 }}
                              className="flex items-center gap-3"
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.5 + 0.3 }}
                                className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-success" />
                              </motion.div>
                              <span className="text-sm text-cyber-muted">{step}</span>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}

                  {stage === "done" && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl bg-cyber-dark p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-foreground font-medium">5 Assets Forged</p>
                        <button
                          onClick={() => { setStage("idle"); setFileName(""); }}
                          className="text-xs text-neon-purple hover:underline"
                        >
                          Try Again
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {outputTypes.map((item, i) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-cyber-card border border-cyber-border hover:border-neon-purple/30 transition-colors"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}
                            >
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{item.label}</p>
                            </div>
                            <span className="text-xs text-cyber-muted font-mono">
                              {item.duration}
                            </span>
                            <Check className="w-4 h-4 text-success" />
                          </motion.div>
                        ))}
                      </div>
                      <Link
                        href="/signup"
                        className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
                      >
                        Get Started — Full Access
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

/**
 * The format-scoped generator embedded on /create/[format] pages: type an
 * idea or paste a transcript, get ready-to-post drafts for one vertical.
 * Deterministic engine only (no signup, no cost) — the AI-graded version in
 * the app is the conversion hook.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Loader2, Sparkles } from "lucide-react";
import { track } from "@/lib/track";

interface ToolAsset {
  name: string;
  type: string;
  content: string;
}

export default function CreateTool({
  format,
  placeholder,
  buttonLabel,
}: {
  format: string;
  placeholder: string;
  buttonLabel: string;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<ToolAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const run = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    track(`create_tool_${format}`);
    const res = await fetch("/api/try", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.trim(), format }),
    }).catch(() => null);
    setLoading(false);
    const d = await res?.json().catch(() => null);
    if (res?.ok && Array.isArray(d?.assets) && d.assets.length) {
      setAssets(d.assets);
    } else if (res?.status === 429) {
      setError("Too many requests — give it a minute and try again.");
    } else {
      setError(d?.error || "Could not generate right now — try again.");
    }
  };

  const copy = (i: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-r from-neon-purple via-fuchsia-500 to-electric-blue p-[1.5px] shadow-[0_0_45px_rgba(168,85,247,0.25)]">
        <div className="bg-cyber-card rounded-2xl p-6 sm:p-8">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            rows={4}
            maxLength={6000}
            className="w-full px-4 py-3 bg-cyber-dark border border-neon-purple/40 rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple resize-y"
          />
          <button
            onClick={run}
            disabled={loading || !input.trim()}
            className="mt-3 w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 via-neon-purple to-electric-blue text-white font-semibold text-sm shadow-lg shadow-neon-purple/40 hover:brightness-110 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Generating…" : buttonLabel}
          </button>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>
      </div>

      {assets && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-cyber-muted">
            {assets.length} draft{assets.length === 1 ? "" : "s"} from your input — each takes a
            different angle:
          </p>
          {assets.map((a, i) => (
            <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-neon-purple">{a.type}</span>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{a.name}</p>
                </div>
                <button
                  onClick={() => copy(i, a.content)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-cyber-dark border border-cyber-border text-xs text-cyber-muted hover:text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-1.5"
                >
                  {copied === i ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs text-cyber-muted whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                {a.content}
              </pre>
            </div>
          ))}

          <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Sparkles className="w-6 h-6 text-neon-purple shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                This is the instant engine. Sign up free for the AI-grade version.
              </p>
              <p className="text-xs text-cyber-muted mt-1">
                Your brand voice on every draft, all six formats from one upload, rendered clips
                with captions, and a scheduler that posts it for you.
              </p>
            </div>
            <Link
              href="/signup"
              onClick={() => track(`create_tool_${format}_signup`)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

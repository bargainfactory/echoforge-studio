"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Mic2, Save } from "lucide-react";
// Mic2 doubles as the narration-voice clone affordance below.
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";
import { DEFAULT_VOICE, type BrandVoice } from "@/lib/data";

/**
 * Brand-voice profile editor shown in Settings. Every generation (project
 * uploads and single-asset regenerations) is steered by this profile.
 *
 * Each field offers curated presets so a new creator can build a working
 * voice in five clicks; picking one fills the input, which stays editable.
 */

type PresetKey = "tone" | "audience" | "cta" | "hashtags" | "bannedWords";

const PRESETS: Record<PresetKey, { label: string; value: string }[]> = {
  tone: [
    {
      label: "Confident & direct",
      value:
        "Confident, direct, creator-to-creator. Short punchy sentences. Specific numbers over adjectives. Zero hype-speak.",
    },
    {
      label: "Friendly & conversational",
      value:
        "Warm and conversational, like texting a smart friend. Simple words, contractions, light humor, no jargon.",
    },
    {
      label: "Educational authority",
      value:
        "Clear, structured, teacher energy. Explains the why behind every claim. Calm authority without hype.",
    },
    {
      label: "Bold & contrarian",
      value:
        "Bold, contrarian, opinionated. Short declarative sentences that challenge common advice head-on.",
    },
    {
      label: "Storyteller",
      value:
        "Narrative-first. Opens on a concrete moment, builds tension, lands the lesson in the final line.",
    },
    {
      label: "Minimal & premium",
      value:
        "Sparse and polished — every word earns its place. Understated confidence, no exclamation points.",
    },
  ],
  audience: [
    {
      label: "Faceless creators",
      value:
        "Faceless creators, podcasters, and course creators publishing on YouTube, TikTok, and X.",
    },
    {
      label: "Founders & solopreneurs",
      value: "Bootstrapped founders and solopreneurs building online businesses in public.",
    },
    {
      label: "Coaches & consultants",
      value:
        "Coaches, consultants, and service providers turning expertise into inbound clients.",
    },
    {
      label: "Personal finance",
      value:
        "Retail investors and personal-finance learners who want practical, no-hype money guidance.",
    },
    {
      label: "Health & fitness",
      value: "Busy people building sustainable fitness, nutrition, and wellness habits at home.",
    },
    {
      label: "Tech & AI",
      value:
        "Developers, tech workers, and AI-curious professionals tracking new tools and workflows.",
    },
  ],
  cta: [
    {
      label: "Follow for more",
      value: "Follow for more — a new breakdown like this every week.",
    },
    {
      label: "Newsletter signup",
      value: "Join the free newsletter — one actionable playbook every Monday. Link in bio.",
    },
    { label: "Link in bio", value: "Full guide is linked in my bio — grab it free." },
    {
      label: "Drive comments",
      value: "Comment your biggest question and I'll answer every single one.",
    },
    {
      label: "Free channel audit",
      value: "Run your free channel audit at virafold.ai — no signup, takes 20 seconds.",
    },
  ],
  hashtags: [
    {
      label: "Creator economy",
      value: "#facelesscreator #contentrepurposing #creatoreconomy #contentcreator",
    },
    { label: "Business", value: "#entrepreneur #solopreneur #buildinpublic #smallbusiness" },
    { label: "Finance", value: "#personalfinance #investing #moneytips #financialfreedom" },
    { label: "Fitness", value: "#fitnesstips #healthyhabits #wellnessjourney #homeworkout" },
    { label: "Tech & AI", value: "#ai #aitools #tech #productivity" },
  ],
  bannedWords: [
    {
      label: "Hype-speak",
      value: "game-changer, revolutionary, unleash, skyrocket, secret, hack, guaranteed, overnight",
    },
    {
      label: "Clickbait",
      value: "you won't believe, shocking, gone wrong, exposed, destroyed",
    },
    {
      label: "Corporate jargon",
      value: "synergy, leverage, circle back, best-in-class, cutting-edge",
    },
  ],
};

export default function BrandVoicePanel() {
  const { addToast } = useApp();
  const { t } = useTranslation();
  const [voice, setVoice] = useState<BrandVoice>({ ...DEFAULT_VOICE });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cloneId, setCloneId] = useState<string | null>(null);
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/voice", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d?.voice && setVoice(d.voice))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    fetch("/api/voice/clone", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setCloneId(d?.voiceId ?? null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const doClone = async () => {
    if (!cloneFile || cloning) return;
    setCloning(true);
    try {
      const form = new FormData();
      form.append("file", cloneFile);
      const res = await fetch("/api/voice/clone", { method: "POST", body: form });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.voiceId) {
        setCloneId(d.voiceId);
        setCloneFile(null);
        addToast(t("voice.cloneDone"));
      } else {
        addToast(d?.error ?? t("voice.cloneFailed"), "error");
      }
    } finally {
      setCloning(false);
    }
  };

  const removeClone = async () => {
    await fetch("/api/voice/clone", { method: "DELETE" }).catch(() => {});
    setCloneId(null);
    addToast(t("voice.cloneRemoved"), "info");
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voice),
      });
      if (res.ok) {
        const { voice: v } = await res.json();
        setVoice(v);
        setSaved(true);
        addToast(t("voice.saved"));
        setTimeout(() => setSaved(false), 2000);
      } else {
        addToast(t("voice.saveFailed"), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof Omit<BrandVoice, "emojis">,
    label: string,
    placeholder: string
  ) => {
    const presets = (PRESETS as Partial<Record<string, { label: string; value: string }[]>>)[key];
    return (
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="block text-sm text-cyber-muted">{label}</label>
          {presets && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setVoice({ ...voice, [key]: e.target.value });
              }}
              disabled={loading}
              className="text-[11px] px-2 py-1 bg-cyber-dark border border-cyber-border rounded-lg text-neon-purple focus:outline-none focus:border-neon-purple/50 disabled:opacity-50 cursor-pointer max-w-[150px]"
            >
              <option value="">{t("voice.presets")}</option>
              {presets.map((p) => (
                <option key={p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <input
          type="text"
          value={voice[key]}
          onChange={(e) => setVoice({ ...voice, [key]: e.target.value })}
          placeholder={placeholder}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50 disabled:opacity-50"
        />
      </div>
    );
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Mic2 className="w-4 h-4 text-neon-purple" />
        <h3 className="font-semibold text-foreground">{t("voice.title")}</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-5">{t("voice.desc")}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {field("tone", t("voice.tone"), t("voice.tonePh"))}
        {field("audience", t("voice.audience"), t("voice.audiencePh"))}
        {field("cta", t("voice.cta"), t("voice.ctaPh"))}
        {field("hashtags", t("voice.hashtags"), t("voice.hashtagsPh"))}
        {field("bannedWords", t("voice.banned"), t("voice.bannedPh"))}
        {field("signature", t("voice.signature"), t("voice.signaturePh"))}
      </div>

      <label className="flex items-center justify-between cursor-pointer mt-4">
        <div>
          <p className="text-sm text-foreground">{t("voice.emojis")}</p>
          <p className="text-xs text-cyber-muted">{t("voice.emojisDesc")}</p>
        </div>
        <button
          type="button"
          onClick={() => setVoice({ ...voice, emojis: !voice.emojis })}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${voice.emojis ? "bg-neon-purple" : "bg-cyber-border"}`}
        >
          <div
            className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
            style={{ transform: voice.emojis ? "translateX(22px)" : "translateX(0)", left: "2px" }}
          />
        </button>
      </label>

      {/* Narration voice: clone once, every script video speaks as you */}
      <div className="mt-5 pt-5 border-t border-cyber-border/60">
        <p className="text-sm text-foreground font-medium">{t("voice.cloneTitle")}</p>
        <p className="text-xs text-cyber-muted mt-0.5 mb-3">{t("voice.cloneDesc")}</p>
        {cloneId ? (
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full bg-success/10 border border-success/40 text-success">
              {t("voice.cloneActive")}
            </span>
            <button
              onClick={removeClone}
              className="text-xs text-red-400 hover:underline"
            >
              {t("voice.cloneRemove")}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => setCloneFile(e.target.files?.[0] ?? null)}
              className="text-sm text-cyber-muted file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-cyber-dark file:text-foreground file:text-xs file:cursor-pointer"
            />
            <button
              onClick={doClone}
              disabled={cloning || !cloneFile}
              className="px-4 py-2 rounded-lg bg-cyber-dark border border-neon-purple/40 text-neon-purple text-xs font-medium hover:bg-neon-purple/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic2 className="w-3.5 h-3.5" />}
              {cloning ? t("voice.cloning") : t("voice.cloneBtn")}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving || loading}
        className="mt-5 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? t("dash.saved") : t("voice.save")}
      </button>
    </div>
  );
}

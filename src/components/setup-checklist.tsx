"use client";

/**
 * Live-state activation checklist on Overview: five steps from empty account
 * to first scheduled post, each checkmark driven by real data and each step
 * deep-linking to the tab where it happens. Auto-hides once complete;
 * dismissible early (persisted per browser).
 */

import { useEffect, useState } from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";
import { useConnections } from "@/lib/use-connections";
import type { Project } from "@/lib/data";

const DISMISS_KEY = "vf_checklist_dismissed";

const HYPE_BAN =
  "game-changer, revolutionary, unleash, skyrocket, secret, hack, guaranteed, overnight";

// One click configures a working brand voice for the chosen creator type —
// the "set your brand voice" step goes from a writing exercise to a choice.
const CREATOR_TYPES: {
  key: string;
  label: string;
  emoji: string;
  voice: {
    tone: string;
    audience: string;
    cta: string;
    hashtags: string;
    bannedWords: string;
    signature: string;
    emojis: boolean;
  };
}[] = [
  {
    key: "faceless",
    label: "Faceless creator",
    emoji: "🎭",
    voice: {
      tone: "Confident, direct, creator-to-creator. Short punchy sentences. Specific numbers over adjectives. Zero hype-speak.",
      audience: "Viewers who follow for the content, not the person — hooks and value carry every post.",
      cta: "Follow for more — a new breakdown like this every week.",
      hashtags: "#facelesscreator #contentrepurposing #creatoreconomy #contentcreator",
      bannedWords: HYPE_BAN,
      signature: "",
      emojis: true,
    },
  },
  {
    key: "podcaster",
    label: "Podcaster",
    emoji: "🎙️",
    voice: {
      tone: "Warm and conversational, like the best moments of a good interview. Natural phrasing, real quotes, no corporate polish.",
      audience: "Podcast listeners who want the sharpest takeaways and exchanges from every episode.",
      cta: "Full episode is live now — link in bio.",
      hashtags: "#podcast #podcastclips #interview #newepisode",
      bannedWords: HYPE_BAN,
      signature: "",
      emojis: true,
    },
  },
  {
    key: "coach",
    label: "Coach / consultant",
    emoji: "🎯",
    voice: {
      tone: "Clear, structured, teacher energy. Explains the why behind every claim. Calm authority without hype.",
      audience: "Clients and prospects looking for actionable advice they can apply today.",
      cta: "Join the free newsletter — one actionable playbook every Monday. Link in bio.",
      hashtags: "#coaching #business #entrepreneur #growthmindset",
      bannedWords: HYPE_BAN,
      signature: "",
      emojis: false,
    },
  },
  {
    key: "course",
    label: "Course creator",
    emoji: "📚",
    voice: {
      tone: "Educational and generous — teach one complete concept per post so every asset proves the teaching, not just promises it.",
      audience: "Students and self-learners evaluating whether your teaching style fits them.",
      cta: "The full course goes deeper — link in bio.",
      hashtags: "#onlinecourse #elearning #learnsomethingnew #education",
      bannedWords: HYPE_BAN,
      signature: "",
      emojis: true,
    },
  },
  {
    key: "agency",
    label: "Agency / team",
    emoji: "🏢",
    voice: {
      tone: "Sparse and polished — every word earns its place. Understated confidence, no exclamation points.",
      audience: "Brands and creators evaluating a professional content partner.",
      cta: "Book a call — link in bio.",
      hashtags: "#contentmarketing #socialmediamarketing #agency #b2b",
      bannedWords: HYPE_BAN + ", synergy, leverage, circle back, best-in-class, cutting-edge",
      signature: "",
      emojis: false,
    },
  },
];

interface Step {
  key: string;
  labelKey: string;
  done: boolean;
  tab: string;
}

export default function SetupChecklist({
  projects,
  onNavigate,
}: {
  projects: Project[];
  onNavigate: (tab: string) => void;
}) {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const connections = useConnections();
  const [voiceSet, setVoiceSet] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(true); // avoid flash before mount
  const [applyingType, setApplyingType] = useState<string | null>(null);

  const applyCreatorType = async (typeKey: string) => {
    const ct = CREATOR_TYPES.find((c) => c.key === typeKey);
    if (!ct || applyingType) return;
    setApplyingType(typeKey);
    try {
      const res = await fetch("/api/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ct.voice),
      });
      if (res.ok) {
        setVoiceSet(true);
        addToast(t("cl.typeApplied").replace("{type}", ct.label));
      } else {
        addToast(t("voice.saveFailed"), "error");
      }
    } catch {
      addToast(t("voice.saveFailed"), "error");
    } finally {
      setApplyingType(null);
    }
  };

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    fetch("/api/voice", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const v = d?.voice;
        setVoiceSet(
          Boolean(v && (v.tone || v.audience || v.cta || v.hashtags || v.signature))
        );
      })
      .catch(() => setVoiceSet(false));
    fetch("/api/schedule", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setScheduled(Boolean(d?.posts?.length)))
      .catch(() => setScheduled(false));
  }, []);

  const steps: Step[] = [
    { key: "upload", labelKey: "cl.s1", done: projects.length > 0, tab: "Upload" },
    { key: "voice", labelKey: "cl.s2", done: voiceSet === true, tab: "Settings" },
    {
      key: "review",
      labelKey: "cl.s3",
      done: projects.some((p) => p.status === "published"),
      tab: "Projects",
    },
    {
      key: "connect",
      labelKey: "cl.s4",
      done: Boolean(connections?.some((c) => c.connected)),
      tab: "Settings",
    },
    { key: "schedule", labelKey: "cl.s5", done: scheduled === true, tab: "Schedule" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  // Still loading state, everything done, or dismissed → stay out of the way.
  if (dismissed || voiceSet === null || scheduled === null) return null;
  if (doneCount === steps.length) return null;

  return (
    <div className="bg-cyber-card border border-neon-purple/30 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-semibold text-foreground">{t("cl.title")}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cyber-muted">
            {t("cl.progress")
              .replace("{done}", String(doneCount))
              .replace("{total}", String(steps.length))}
          </span>
          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setDismissed(true);
            }}
            className="text-cyber-muted hover:text-foreground transition-colors"
            title={t("cl.dismiss")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-purple to-electric-blue transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      {/* One-click voice setup by creator type — shown until a voice exists. */}
      {!voiceSet && (
        <div className="mb-4 p-3 rounded-lg bg-cyber-dark border border-cyber-border">
          <p className="text-xs text-cyber-muted mb-2">{t("cl.typePrompt")}</p>
          <div className="flex flex-wrap gap-2">
            {CREATOR_TYPES.map((ct) => (
              <button
                key={ct.key}
                onClick={() => applyCreatorType(ct.key)}
                disabled={applyingType !== null}
                className="px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs text-foreground hover:border-neon-purple/50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {applyingType === ct.key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span aria-hidden="true">{ct.emoji}</span>
                )}
                {ct.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {steps.map((s) => (
          <button
            key={s.key}
            onClick={() => !s.done && onNavigate(s.tab)}
            disabled={s.done}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              s.done
                ? "text-cyber-muted"
                : "text-foreground hover:bg-cyber-dark cursor-pointer"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                s.done
                  ? "bg-success/20 border-success/40 text-success"
                  : "border-cyber-border text-transparent"
              }`}
            >
              <Check className="w-3 h-3" />
            </span>
            <span className={`flex-1 ${s.done ? "line-through" : ""}`}>{t(s.labelKey)}</span>
            {!s.done && <ChevronRight className="w-4 h-4 text-cyber-muted shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

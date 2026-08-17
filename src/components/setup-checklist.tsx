"use client";

/**
 * Live-state activation checklist on Overview: five steps from empty account
 * to first scheduled post, each checkmark driven by real data and each step
 * deep-linking to the tab where it happens. Auto-hides once complete;
 * dismissible early (persisted per browser).
 */

import { useEffect, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useConnections } from "@/lib/use-connections";
import type { Project } from "@/lib/data";

const DISMISS_KEY = "vf_checklist_dismissed";

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
  const connections = useConnections();
  const [voiceSet, setVoiceSet] = useState<boolean | null>(null);
  const [scheduled, setScheduled] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(true); // avoid flash before mount

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

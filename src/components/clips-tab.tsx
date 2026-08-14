"use client";

/**
 * Clip Studio: audit-informed highlight detection + rendered vertical clips.
 * Suggestions are picked to match the creator's own proven winners (post
 * metrics + audit history), then rendered server-side with burned captions
 * and scheduled straight to YouTube/TikTok.
 */

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";
import {
  Calendar,
  Download,
  Film,
  FileVideo,
  Loader2,
  Scissors,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";

interface ClipRow {
  id: string;
  projectId: string;
  title: string;
  startSec: number;
  endSec: number;
  score: number;
  reason: string;
  matched: string | null;
  status: "suggested" | "queued" | "rendering" | "ready" | "failed";
  style: string;
  outputPath: string | null;
  error: string | null;
}

const CLIP_STYLES = [
  { key: "bold", label: "Bold" },
  { key: "neon", label: "Neon" },
  { key: "clean", label: "Clean" },
];

function fmtClipTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-success border-success/40 bg-success/10";
  if (score >= 45) return "text-warning border-warning/40 bg-warning/10";
  return "text-cyber-muted border-cyber-border bg-cyber-dark";
}

export default function ClipsTab() {
  const { addToast } = useApp();
  const { t } = useTranslation();
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [clips, setClips] = useState<ClipRow[]>([]);
  const [selProject, setSelProject] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [engine, setEngine] = useState<string | null>(null);
  const [styleSel, setStyleSel] = useState<Record<string, string>>({});
  const [schedAt, setSchedAt] = useState<Record<string, string>>({});
  const [schedPlatform, setSchedPlatform] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetch("/api/clips", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setProjects(d.projects ?? []);
        setClips(d.clips ?? []);
        setSelProject((cur) => cur || d.projects?.[0]?.id || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while anything is in the render queue so status flips live.
  const hasActive = clips.some((c) => c.status === "queued" || c.status === "rendering");
  useEffect(() => {
    if (!hasActive) return;
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [hasActive, load]);

  const detect = useCallback(async () => {
    if (!selProject || detecting) return;
    setDetecting(true);
    setEngine(null);
    try {
      const res = await fetch(`/api/projects/${selProject}/highlights`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setEngine(data?.engine ?? null);
        addToast(t("clips.found").replace("{n}", String(data?.clips?.length ?? 0)));
        load();
      } else {
        addToast(data?.error || t("clips.detectFailed"), "error");
      }
    } catch {
      addToast(t("clips.detectFailed"), "error");
    } finally {
      setDetecting(false);
    }
  }, [selProject, detecting, addToast, t, load]);

  const render = useCallback(
    async (clip: ClipRow) => {
      const style = styleSel[clip.id] ?? "bold";
      const res = await fetch(`/api/clips/${clip.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      });
      if (res.ok) {
        addToast(t("clips.queued"));
        load();
      } else {
        const data = await res.json().catch(() => null);
        addToast(data?.error || t("clips.renderFailed"), "error");
      }
    },
    [styleSel, addToast, t, load]
  );

  const schedule = useCallback(
    async (clip: ClipRow) => {
      const at = schedAt[clip.id];
      if (!at) return;
      const platform = schedPlatform[clip.id] ?? "YouTube";
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          assetName: clip.title,
          platform,
          scheduledAt: at,
        }),
      });
      if (res.ok) {
        addToast(t("clips.scheduled").replace("{p}", platform));
      } else {
        const data = await res.json().catch(() => null);
        addToast(data?.error || t("clips.scheduleFailed"), "error");
      }
    },
    [schedAt, schedPlatform, addToast, t]
  );

  const remove = useCallback(async (clip: ClipRow) => {
    await fetch(`/api/clips/${clip.id}`, { method: "DELETE" }).catch(() => {});
    setClips((prev) => prev.filter((c) => c.id !== clip.id));
  }, []);

  const projClips = clips.filter((c) => !selProject || c.projectId === selProject);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Scissors className="w-5 h-5 text-neon-purple" /> {t("clips.title")}
        </h2>
        <p className="text-sm text-cyber-muted mt-1">{t("clips.sub")}</p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-8 text-center">
          <FileVideo className="w-8 h-8 text-cyber-muted mx-auto mb-3" />
          <p className="text-sm text-cyber-muted">{t("clips.empty")}</p>
        </div>
      ) : (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] text-cyber-muted mb-1">{t("clips.project")}</label>
            <select
              value={selProject}
              onChange={(e) => setSelProject(e.target.value)}
              className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-foreground focus:outline-none focus:border-neon-purple/50"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={detect}
            disabled={detecting || !selProject}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {detecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {detecting ? t("clips.detecting") : t("clips.detect")}
          </button>
        </div>
      )}

      {engine && (
        <p className="text-[11px] text-cyber-muted">
          {t("clips.engine")}: {engine}
        </p>
      )}

      {projClips.length > 0 && (
        <div className="grid gap-4">
          {projClips.map((clip) => (
            <div
              key={clip.id}
              className="bg-cyber-card border border-cyber-border rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`shrink-0 px-2 py-1 rounded-lg border text-xs font-bold ${scoreColor(clip.score)}`}
                  >
                    {clip.score}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{clip.title}</p>
                    <p className="text-[11px] text-cyber-muted mt-0.5">
                      {fmtClipTime(clip.startSec)}–{fmtClipTime(clip.endSec)} ·{" "}
                      {Math.round(clip.endSec - clip.startSec)}s
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => remove(clip)}
                  className="text-cyber-muted hover:text-danger transition-colors"
                  title={t("clips.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-cyber-muted leading-relaxed">{clip.reason}</p>
              {clip.matched && (
                <p className="text-[11px] text-neon-purple bg-neon-purple/10 border border-neon-purple/30 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  {t("clips.matched")}: {clip.matched}
                </p>
              )}

              {clip.status === "suggested" || clip.status === "failed" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={styleSel[clip.id] ?? clip.style ?? "bold"}
                    onChange={(e) =>
                      setStyleSel((prev) => ({ ...prev, [clip.id]: e.target.value }))
                    }
                    className="px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-purple/50"
                  >
                    {CLIP_STYLES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {t("clips.captions")}: {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => render(clip)}
                    className="px-4 py-2 rounded-lg bg-cyber-dark border border-neon-purple/40 text-xs font-medium text-neon-purple hover:bg-neon-purple/10 transition-colors flex items-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5" />
                    {clip.status === "failed" ? t("clips.retry") : t("clips.render")}
                  </button>
                  {clip.status === "failed" && clip.error && (
                    <span className="text-[11px] text-danger">{clip.error}</span>
                  )}
                </div>
              ) : clip.status === "ready" ? (
                <div className="space-y-3">
                  <video
                    src={`/api/clips/${clip.id}/file`}
                    controls
                    preload="metadata"
                    className="w-full max-w-[240px] rounded-lg border border-cyber-border aspect-[9/16] bg-black"
                  />
                  <div className="flex flex-wrap items-end gap-2">
                    <a
                      href={`/api/clips/${clip.id}/file?download=1`}
                      className="px-3 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-xs text-cyber-muted hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> {t("clips.download")}
                    </a>
                    <select
                      value={schedPlatform[clip.id] ?? "YouTube"}
                      onChange={(e) =>
                        setSchedPlatform((prev) => ({ ...prev, [clip.id]: e.target.value }))
                      }
                      className="px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-purple/50"
                    >
                      {["YouTube", "TikTok"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={schedAt[clip.id] ?? ""}
                      onChange={(e) =>
                        setSchedAt((prev) => ({ ...prev, [clip.id]: e.target.value }))
                      }
                      className="px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-xs text-foreground focus:outline-none focus:border-neon-purple/50"
                    />
                    <button
                      onClick={() => schedule(clip)}
                      disabled={!schedAt[clip.id]}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> {t("clips.schedule")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-electric-blue flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {clip.status === "queued" ? t("clips.queuedStatus") : t("clips.rendering")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

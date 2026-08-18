"use client";

/**
 * Competitor watchlist: pin up to five public channels; each is re-audited
 * weekly, breakouts trigger notifications, and their proven titles feed the
 * creator's generation exemplars as a niche swipe file.
 */

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/context";
import { useTranslation } from "@/lib/i18n";

interface WatchRow {
  id: string;
  handle: string;
  label: string | null;
  lastGrade: number | null;
  lastTop: string | null;
  lastCheckedAt: string | null;
}

function gradeColor(grade: number | null): string {
  if (grade === null) return "text-cyber-muted border-cyber-border";
  if (grade >= 70) return "text-success border-success/40 bg-success/10";
  if (grade >= 45) return "text-warning border-warning/40 bg-warning/10";
  return "text-red-400 border-red-400/40 bg-red-400/10";
}

export default function WatchlistCard() {
  const { addToast } = useApp();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<WatchRow[]>([]);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/watchlist", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.entries && setEntries(d.entries))
      .catch(() => {});
  }, []);

  const add = useCallback(async () => {
    if (!handle.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.entries) {
        setEntries(d.entries);
        setHandle("");
        addToast(t("watch.added"));
      } else {
        addToast(d?.error ?? t("watch.addFailed"), "error");
      }
    } finally {
      setBusy(false);
    }
  }, [handle, busy, addToast, t]);

  const remove = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Eye className="w-4 h-4 text-neon-purple" />
        <h3 className="font-semibold text-foreground">{t("watch.title")}</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-4">{t("watch.sub")}</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("watch.ph")}
          className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded-lg text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
        />
        <button
          onClick={add}
          disabled={busy || !handle.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-electric-blue text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {t("watch.add")}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-cyber-muted">{t("watch.empty")}</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => {
            let top: string[] = [];
            try {
              top = e.lastTop ? (JSON.parse(e.lastTop) as string[]) : [];
            } catch {
              /* ignore */
            }
            return (
              <div
                key={e.id}
                className="flex items-start gap-3 bg-cyber-dark border border-cyber-border rounded-lg p-3"
              >
                <span
                  className={`shrink-0 px-2 py-1 rounded-lg border text-xs font-bold ${gradeColor(e.lastGrade)}`}
                >
                  {e.lastGrade ?? "—"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {e.label ?? e.handle}
                  </p>
                  {top[0] && (
                    <p className="text-[11px] text-cyber-muted mt-0.5 line-clamp-1">
                      {t("watch.topNow")}: {top[0]}
                    </p>
                  )}
                  {e.lastCheckedAt && (
                    <p className="text-[10px] text-cyber-muted/70 mt-0.5">
                      {t("watch.checked")}{" "}
                      {new Date(e.lastCheckedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="text-cyber-muted hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

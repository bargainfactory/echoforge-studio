"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gauge, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/lib/track";

interface PublicAudit {
  label: string;
  grade: number;
  posts: number;
  avgViews: number;
  engagementRate: number;
  sections: { key: string; score: number; note: string }[];
  findings: string[];
  top: { title: string; views: number; hint: string }[];
  bottom: { title: string; views: number; hint: string }[];
}

/** Landing-page lead magnet: free deterministic channel audit, no account.
 *  The LLM-coached full report is the signup hook. */
export default function AuditTeaser() {
  const { t, locale } = useTranslation();
  const [handle, setHandle] = useState("");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<PublicAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!handle.trim() || running) return;
    setRunning(true);
    setError(null);
    track("audit_teaser_run");
    const res = await fetch("/api/audit/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: handle.trim() }),
    }).catch(() => null);
    setRunning(false);
    const d = await res?.json().catch(() => null);
    if (res?.ok && d?.report) {
      setReport(d.report);
    } else if (res?.status === 429) {
      setError(t("padt.errBusy"));
    } else if (res?.status === 503) {
      setError(t("padt.errUnavailable"));
    } else {
      setError(t("padt.err"));
    }
  };

  const gradeColor =
    (report?.grade ?? 0) >= 70
      ? "text-success"
      : (report?.grade ?? 0) >= 45
        ? "text-warning"
        : "text-red-400";

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="audit">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-medium mb-4">
            <Gauge className="w-3.5 h-3.5" /> {t("padt.badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {t("padt.title")}
          </h2>
          <p className="text-cyber-muted max-w-xl mx-auto">{t("padt.sub")}</p>
        </motion.div>

        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder={t("padt.ph")}
              className="flex-1 px-4 py-3 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
            />
            <button
              onClick={run}
              disabled={running || !handle.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
              {running ? t("padt.running") : t("padt.run")}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

          {report && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center">
                  <p className={`text-6xl font-bold ${gradeColor}`}>{report.grade}</p>
                  <p className="text-xs text-cyber-muted mt-1">{t("adt.grade")}</p>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-lg font-semibold text-foreground">{report.label}</p>
                  <p className="text-xs text-cyber-muted mt-1">
                    {report.posts} {t("adt.posts")} · {report.avgViews.toLocaleString(locale)}{" "}
                    {t("adt.avgViews")} · {report.engagementRate}% {t("adt.engagement")}
                  </p>
                </div>
                <div className="w-full sm:w-64 space-y-1.5">
                  {report.sections.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="text-[11px] text-cyber-muted w-24 shrink-0">
                        {t(`adt.sec.${s.key}`)}
                      </span>
                      <div className="flex-1 h-1.5 bg-cyber-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.score >= 70
                              ? "bg-success"
                              : s.score >= 45
                                ? "bg-warning"
                                : "bg-red-400"
                          }`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-cyber-muted w-7 text-right">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {report.findings.length > 0 && (
                <ul className="space-y-1.5">
                  {report.findings.map((f, i) => (
                    <li key={i} className="text-sm text-cyber-muted flex gap-2">
                      <span className="text-neon-purple shrink-0">→</span> {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-success mb-2">{t("adt.top")}</p>
                  {report.top.map((p, i) => (
                    <p key={i} className="text-xs text-cyber-muted mb-1.5 line-clamp-1">
                      ▲ {p.title} — {p.views.toLocaleString(locale)}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-2">{t("adt.bottom")}</p>
                  {report.bottom.map((p, i) => (
                    <p key={i} className="text-xs text-cyber-muted mb-1.5 line-clamp-1">
                      ▽ {p.title} — {p.views.toLocaleString(locale)}
                    </p>
                  ))}
                </div>
              </div>

              {/* The conversion hook */}
              <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Sparkles className="w-6 h-6 text-neon-purple shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t("padt.unlockTitle")}</p>
                  <p className="text-xs text-cyber-muted mt-1">{t("padt.unlockDesc")}</p>
                </div>
                <Link
                  href="/signup"
                  onClick={() => track("audit_teaser_signup_click")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
                >
                  {t("padt.unlockCta")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gauge, Zap, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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

export default function ShareAuditClient({
  report,
  createdAt,
}: {
  report: PublicAudit;
  createdAt: string;
}) {
  const { t, locale } = useTranslation();

  const gradeColor =
    report.grade >= 70 ? "text-success" : report.grade >= 45 ? "text-warning" : "text-red-400";

  return (
    <div className="min-h-screen bg-background px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-medium mb-4">
            <Gauge className="w-3.5 h-3.5" /> {t("padt.badge")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{report.label}</h1>
          <p className="text-xs text-cyber-muted mt-1">
            {new Date(createdAt).toLocaleDateString(locale)}
          </p>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className={`text-6xl font-bold ${gradeColor}`}>{report.grade}</p>
              <p className="text-xs text-cyber-muted mt-1">{t("adt.grade")}</p>
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs text-cyber-muted">
                {report.posts} {t("adt.posts")} · {report.avgViews.toLocaleString(locale)}{" "}
                {t("adt.avgViews")} · {report.engagementRate}% {t("adt.engagement")}
              </p>
              <div className="mt-3 space-y-1.5">
                {report.sections.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="text-[11px] text-cyber-muted w-24 shrink-0">
                      {t(`adt.sec.${s.key}`)}
                    </span>
                    <div className="flex-1 h-1.5 bg-cyber-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.score >= 70 ? "bg-success" : s.score >= 45 ? "bg-warning" : "bg-red-400"
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-cyber-muted w-7 text-right">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {report.findings.length > 0 && (
            <ul className="mt-6 space-y-1.5">
              {report.findings.map((f, i) => (
                <li key={i} className="text-sm text-cyber-muted flex gap-2">
                  <span className="text-neon-purple shrink-0">→</span> {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-foreground mb-3">{t("share.cta")}</p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("padt.run")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-cyber-muted">
          <Zap className="w-3 h-3 text-neon-purple" />
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("pub.poweredBy")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

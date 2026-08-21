"use client";

/**
 * "Your work, yours to keep": one-click exports of all content, the full
 * account data, and direct downloads for rendered videos — with the storage
 * retention policy disclaimed exactly where it matters.
 */

import { useEffect, useState } from "react";
import { Download, FileJson, FileText, HardDrive } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ClipLite {
  id: string;
  title: string;
  kind: string;
  status: string;
}

export default function ExportCard() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<ClipLite[]>([]);

  useEffect(() => {
    fetch("/api/clips", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.clips) return;
        setVideos(
          (d.clips as ClipLite[]).filter((c) => c.status === "ready")
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <HardDrive className="w-4 h-4 text-neon-purple" />
        <h3 className="font-semibold text-foreground">{t("export.title")}</h3>
      </div>
      <p className="text-xs text-cyber-muted mb-4">{t("export.desc")}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        <a
          href="/api/export?format=markdown"
          className="px-4 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-xs font-medium text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-electric-blue" /> {t("export.md")}
        </a>
        <a
          href="/api/export?format=json"
          className="px-4 py-2 rounded-lg bg-cyber-dark border border-cyber-border text-xs font-medium text-foreground hover:border-neon-purple/50 transition-colors flex items-center gap-1.5"
        >
          <FileJson className="w-3.5 h-3.5 text-neon-purple" /> {t("export.json")}
        </a>
      </div>

      <div className="border-t border-cyber-border/60 pt-4">
        <p className="text-xs font-medium text-foreground mb-1">{t("export.videosTitle")}</p>
        <p className="text-[11px] text-warning mb-3">{t("export.retention")}</p>
        {videos.length === 0 ? (
          <p className="text-xs text-cyber-muted">{t("export.noVideos")}</p>
        ) : (
          <div className="space-y-1.5">
            {videos.map((v) => (
              <a
                key={v.id}
                href={`/api/clips/${v.id}/file?download=1`}
                className="flex items-center gap-2 text-xs text-cyber-muted hover:text-foreground transition-colors group"
              >
                <Download className="w-3.5 h-3.5 text-electric-blue shrink-0" />
                <span className="line-clamp-1 group-hover:underline">{v.title}</span>
                <span className="text-[10px] text-cyber-muted/70 shrink-0">
                  {v.kind === "script" ? t("export.kindScript") : t("export.kindClip")}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

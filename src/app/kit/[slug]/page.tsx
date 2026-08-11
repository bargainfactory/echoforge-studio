"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Film, CheckCircle, Loader2, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface KitPage {
  slug: string;
  displayName: string;
  bio: string;
  rates: { platform: string; price: number }[];
}
interface KitStats {
  assets: number;
  published: number;
  platforms: string[];
}

/** Public media kit generated from the creator's real workspace data. */
export default function MediaKitPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [page, setPage] = useState<KitPage | null>(null);
  const [stats, setStats] = useState<KitStats | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ready">("loading");

  useEffect(() => {
    if (!params?.slug) return;
    let active = true;
    fetch(`/api/page/${params.slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d?.page) {
          setPage(d.page);
          setStats(d.stats);
          setState("ready");
        } else {
          setState("missing");
        }
      })
      .catch(() => active && setState("missing"));
    return () => {
      active = false;
    };
  }, [params?.slug]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-neon-purple animate-spin" />
      </div>
    );
  }
  if (state === "missing" || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-cyber-muted">{t("pub.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto space-y-8"
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-neon-purple mb-2">
            {t("pub.mediaKit")}
          </p>
          <h1 className="text-3xl font-bold text-foreground">{page.displayName}</h1>
          {page.bio && <p className="text-sm text-cyber-muted mt-3 max-w-lg mx-auto">{page.bio}</p>}
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 text-center">
              <Film className="w-5 h-5 text-neon-purple mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.assets}</p>
              <p className="text-xs text-cyber-muted mt-1">{t("pub.assetsGenerated")}</p>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 text-center">
              <CheckCircle className="w-5 h-5 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.published}</p>
              <p className="text-xs text-cyber-muted mt-1">{t("pub.postsPublished")}</p>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 text-center col-span-2 sm:col-span-1">
              <p className="text-sm font-medium text-foreground mt-1">
                {stats.platforms.length > 0 ? stats.platforms.join(" · ") : "—"}
              </p>
              <p className="text-xs text-cyber-muted mt-2">{t("pub.platforms")}</p>
            </div>
          </div>
        )}

        {page.rates.length > 0 && (
          <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyber-border">
              <h2 className="font-semibold text-foreground">{t("pub.ratesTitle")}</h2>
            </div>
            <div className="divide-y divide-cyber-border">
              {page.rates.map((r) => (
                <div key={r.platform} className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-sm text-foreground">{r.platform}</span>
                  <span className="text-sm font-bold text-neon-purple">
                    ${r.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href={`/c/${page.slug}`}
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("pub.contact")}
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

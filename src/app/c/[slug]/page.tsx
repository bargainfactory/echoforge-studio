"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PublicPage {
  slug: string;
  displayName: string;
  bio: string;
  links: { label: string; url: string }[];
  rates: { platform: string; price: number }[];
}
interface PublicStats {
  assets: number;
  published: number;
  platforms: string[];
}

/** Public link-in-bio page: /c/[slug]. Collects emails into the creator's list. */
export default function CreatorPublicPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [page, setPage] = useState<PublicPage | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ready">("loading");
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "busy" | "done" | "error">("idle");

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

  const subscribe = async () => {
    if (!email.trim() || subState === "busy") return;
    setSubState("busy");
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: params.slug, email: email.trim() }),
    });
    setSubState(res.ok ? "done" : "error");
  };

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

  const initials = page.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-neon-purple to-electric-blue flex items-center justify-center text-white text-2xl font-bold mb-4">
            {initials}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{page.displayName}</h1>
          {page.bio && <p className="text-sm text-cyber-muted mt-2">{page.bio}</p>}
        </div>

        {stats && (stats.assets > 0 || stats.published > 0) && (
          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{stats.assets}</p>
              <p className="text-[11px] text-cyber-muted">{t("pub.assetsGenerated")}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.published}</p>
              <p className="text-[11px] text-cyber-muted">{t("pub.postsPublished")}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {page.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyber-card border border-cyber-border rounded-xl text-sm font-medium text-foreground hover:border-neon-purple/50 transition-colors"
            >
              {l.label} <ExternalLink className="w-3.5 h-3.5 text-cyber-muted" />
            </a>
          ))}
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-4">
          {subState === "done" ? (
            <p className="text-sm text-success text-center py-1.5">{t("pub.subscribed")}</p>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && subscribe()}
                placeholder={t("pub.subscribePh")}
                className="flex-1 px-3 py-2.5 bg-cyber-dark border border-cyber-border rounded-xl text-sm text-foreground placeholder:text-cyber-muted focus:outline-none focus:border-neon-purple/50"
              />
              <button
                onClick={subscribe}
                disabled={subState === "busy" || !email.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {subState === "busy" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("pub.subscribe")
                )}
              </button>
            </div>
          )}
          {subState === "error" && (
            <p className="text-xs text-red-400 mt-2 text-center">{t("pub.subscribeFailed")}</p>
          )}
        </div>

        {page.rates.length > 0 && (
          <div className="text-center">
            <Link href={`/kit/${page.slug}`} className="text-xs text-neon-purple hover:underline">
              {t("pub.mediaKit")} →
            </Link>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-cyber-muted pt-4">
          <Zap className="w-3 h-3 text-neon-purple" />
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("pub.poweredBy")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

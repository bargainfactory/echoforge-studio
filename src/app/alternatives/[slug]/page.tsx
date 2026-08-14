import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Minus, ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

/**
 * Honest comparison pages for bottom-funnel "X alternative" searches.
 * English-only marketing surfaces; claims kept high-level and positioning-
 * based rather than feature-version claims that go stale.
 */

interface Competitor {
  name: string;
  focus: string;
  intro: string;
  theirStrengths: string[];
  rows: { feature: string; them: boolean; us: boolean }[];
  verdict: string;
}

const COMPETITORS: Record<string, Competitor> = {
  opusclip: {
    name: "OpusClip",
    focus: "AI video clipping",
    intro:
      "OpusClip is one of the best-known AI clipping tools: upload a finished video and it cuts short clips with captions. Virafold plays a different game — it's a creator business OS that starts before your video exists (ideas and scripts) and continues after it's posted (scheduling, audience, revenue). Here's an honest comparison.",
    theirStrengths: [
      "Mature automated video clipping with rendered captions",
      "Polished virality scoring for finished clips",
      "Established brand with a large user base",
    ],
    rows: [
      { feature: "AI clip scripts / repurposed text assets", them: true, us: true },
      { feature: "Idea backlog with hook scoring", them: false, us: true },
      { feature: "Long-form script writing from an idea", them: false, us: true },
      { feature: "Brand voice enforced on every generation", them: false, us: true },
      { feature: "Content calendar with auto-publish scheduler", them: false, us: true },
      { feature: "Evergreen recycling of top assets", them: false, us: true },
      { feature: "Free channel audit with virality grade", them: false, us: true },
      { feature: "Owned audience: subscribers, link-in-bio, media kit", them: false, us: true },
      { feature: "Revenue ledger + brand-deal pipeline", them: false, us: true },
      { feature: "Signed content provenance (C2PA-shaped)", them: false, us: true },
      { feature: "Rendered vertical clips with burned-in captions", them: true, us: true },
      { feature: "Clips picked by YOUR channel's own winning data", them: false, us: true },
      { feature: "A/B hook testing decided by real metrics", them: false, us: true },
      { feature: "19-language product experience", them: false, us: true },
    ],
    verdict:
      "If you only need finished videos cut into captioned clips, OpusClip is excellent at exactly that. If you want one system that runs the whole creator business — ideas, scripts, multi-format assets, scheduling, audience, and money — that's what Virafold is built for.",
  },
  "repurpose-io": {
    name: "Repurpose.io",
    focus: "cross-platform content distribution",
    intro:
      "Repurpose.io moves finished content between platforms automatically — publish on one, it reformats and reposts to others. Virafold starts earlier in the chain: it creates the multi-format content from one idea or transcript, then schedules it, and wraps the business layer around it. Here's the honest comparison.",
    theirStrengths: [
      "Deep automation for moving existing content across platforms",
      "Broad platform connection matrix",
      "Set-and-forget workflows for high-volume publishers",
    ],
    rows: [
      { feature: "Generates new assets from one idea/transcript", them: false, us: true },
      { feature: "Auto-distribution of existing videos across platforms", them: true, us: false },
      { feature: "Renders captioned clips and auto-publishes to YouTube/TikTok", them: false, us: true },
      { feature: "Idea backlog + AI script writing", them: false, us: true },
      { feature: "Brand voice profiles", them: false, us: true },
      { feature: "Content calendar + scheduler", them: true, us: true },
      { feature: "Free channel audit with virality grade", them: false, us: true },
      { feature: "Owned audience: subscribers, link-in-bio, media kit", them: false, us: true },
      { feature: "Revenue ledger + brand-deal CRM", them: false, us: true },
      { feature: "Policy/demonetization lint before publishing", them: false, us: true },
      { feature: "19-language product experience", them: false, us: true },
    ],
    verdict:
      "Repurpose.io answers 'how do I get this video everywhere?' Virafold answers 'how do I turn one idea into a content business?' If your bottleneck is creation and monetization rather than file distribution, Virafold covers the wider surface.",
  },
};

export function generateStaticParams() {
  return Object.keys(COMPETITORS).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = COMPETITORS[slug];
  if (!c) return {};
  const title = `${c.name} Alternative: Virafold — Beyond ${c.focus} | Virafold`;
  const description = `Looking for a ${c.name} alternative? Honest comparison: what ${c.name} does best, what Virafold adds — ideas, scripts, scheduling, audience, and revenue in one creator OS.`;
  return {
    title,
    description,
    alternates: { canonical: `/alternatives/${slug}` },
    openGraph: {
      type: "website",
      url: `https://virafold.ai/alternatives/${slug}`,
      siteName: "Virafold",
      title,
      description,
    },
  };
}

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = COMPETITORS[slug];
  if (!c) notFound();

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Looking for a {c.name} alternative?
          </h1>
          <p className="text-cyber-muted leading-relaxed mb-8">{c.intro}</p>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Where {c.name} genuinely shines
            </h2>
            <ul className="space-y-1.5">
              {c.theirStrengths.map((s) => (
                <li key={s} className="text-sm text-cyber-muted flex gap-2">
                  <Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden mb-8">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-5 py-3 border-b border-cyber-border text-xs font-semibold text-cyber-muted">
              <span>Capability</span>
              <span className="w-16 text-center">{c.name}</span>
              <span className="w-16 text-center text-neon-purple">Virafold</span>
            </div>
            {c.rows.map((r) => (
              <div
                key={r.feature}
                className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-5 py-2.5 border-b border-cyber-border/50 last:border-0 items-center"
              >
                <span className="text-sm text-foreground/90">{r.feature}</span>
                <span className="w-16 flex justify-center">
                  {r.them ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Minus className="w-4 h-4 text-cyber-muted" />
                  )}
                </span>
                <span className="w-16 flex justify-center">
                  {r.us ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Minus className="w-4 h-4 text-cyber-muted" />
                  )}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm text-cyber-muted leading-relaxed mb-8">{c.verdict}</p>

          <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-6 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              See the difference on your own channel
            </p>
            <p className="text-sm text-cyber-muted mb-4">
              Run the free virality audit — no signup — and get your grade in seconds.
            </p>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Audit my channel free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

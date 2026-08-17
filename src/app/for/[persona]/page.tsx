import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

/**
 * Persona landing pages: parallel funnels into the same product. The faceless
 * wedge stays on the homepage; each adjacent segment gets its own door with
 * its own pains, answers, and FAQ schema. All claims map to shipped features.
 */

interface Persona {
  name: string;
  slug: string;
  headline: string;
  sub: string;
  pains: { pain: string; fix: string }[];
  features: string[];
  faq: { q: string; a: string }[];
}

const PERSONAS: Record<string, Persona> = {
  podcasters: {
    name: "Podcasters",
    slug: "podcasters",
    headline: "Every episode is a week of content. Stop leaving it in the archive.",
    sub: "Upload an episode and Virafold transcribes it, finds the most clippable exchanges, renders captioned vertical clips, and writes the newsletter and thread to match — then schedules all of it.",
    pains: [
      {
        pain: "Episodes take hours to make and disappear from feeds in a day.",
        fix: "One upload becomes captioned clips, a newsletter recap, an X thread, and carousel pull-quotes — every episode compounds instead of evaporating.",
      },
      {
        pain: "Finding the best 30 seconds means re-listening to the whole hour.",
        fix: "Highlight detection reads the timestamped transcript and surfaces the moments most likely to travel — scored, with reasons.",
      },
      {
        pain: "Clipping tools don't know your show.",
        fix: "Virafold seeds clip selection with your channel audit and your measured post results, so clips match what already works for your audience.",
      },
    ],
    features: [
      "Automatic transcription with word timestamps",
      "AI highlight detection tuned by your own results",
      "Rendered 9:16 clips with burned-in captions",
      "Newsletter + thread + carousel from the same episode",
      "Schedule straight to YouTube Shorts and TikTok",
      "Owned email list, link-in-bio, and media kit for sponsors",
    ],
    faq: [
      {
        q: "Do I need to edit video myself?",
        a: "No. Virafold cuts, crops to vertical, and burns captions server-side. You preview in the browser, pick a caption style, and render.",
      },
      {
        q: "Does it work with audio-only podcasts?",
        a: "Yes — audio uploads are transcribed the same way and drive text assets (threads, newsletters, carousels). Video episodes additionally unlock rendered clips.",
      },
      {
        q: "How do sponsors fit in?",
        a: "Virafold includes a brand-deal pipeline, a revenue ledger, and an auto-generated media kit page with your rates you can send to any sponsor.",
      },
    ],
  },
  coaches: {
    name: "Coaches",
    slug: "coaches",
    headline: "Your calls are full of content. Turn them into clients.",
    sub: "Record one teaching session and Virafold folds it into a week of posts in your voice — with your call-to-action on every asset — then tracks which topics actually bring people in.",
    pains: [
      {
        pain: "You know content brings clients, but creation time competes with client time.",
        fix: "One recorded session becomes shorts, carousels, an email, and threads — production stops competing with delivery.",
      },
      {
        pain: "Generic AI output doesn't sound like you.",
        fix: "A brand-voice profile — tone, audience, banned words, your CTA — steers every generation, and your proven winners feed future output.",
      },
      {
        pain: "No idea which content converts.",
        fix: "Real post metrics flow back automatically from connected accounts; A/B hook testing settles what resonates with data, not guesses.",
      },
    ],
    features: [
      "Brand voice with your default call-to-action on every asset",
      "Idea backlog with hook scoring — never start from blank",
      "Owned email list with newsletter broadcasts",
      "Link-in-bio page that captures subscribers",
      "A/B hook testing decided by real views",
      "Revenue ledger to track coaching income by stream",
    ],
    faq: [
      {
        q: "I'm not a video editor — how hard is this?",
        a: "Paste a transcript or upload a recording; everything else is generated, previewed, and approved by you in one dashboard. No editing software involved.",
      },
      {
        q: "Can it drive people to my offer, not just get views?",
        a: "Yes — your default CTA is part of your brand voice and lands on generated assets, and the link-in-bio page turns profile visits into an email list you own.",
      },
      {
        q: "What if I only record one session a month?",
        a: "One 45-minute recording typically yields 30+ assets — enough for a month of consistent posting, with evergreen recycling re-queueing your winners automatically.",
      },
    ],
  },
  "course-creators": {
    name: "Course Creators",
    slug: "course-creators",
    headline: "Your course is a content goldmine. Mine it.",
    sub: "Every module you've recorded can market itself — Virafold turns lessons into shorts, carousels, and emails that demonstrate your teaching instead of describing it.",
    pains: [
      {
        pain: "Students can't tell if your teaching style fits before buying.",
        fix: "Clips of actual lessons are the most honest ad — Virafold extracts the clearest teaching moments and captions them for the feed.",
      },
      {
        pain: "Marketing a course means making a second course's worth of content.",
        fix: "The course itself is the content: one module upload becomes a week of posts pointing back at enrollment.",
      },
      {
        pain: "Launches spike, then attention dies.",
        fix: "Evergreen recycling re-queues your best-performing lesson clips automatically, keeping the funnel warm between launches.",
      },
    ],
    features: [
      "Turn recorded modules into captioned vertical clips",
      "Carousels and threads that teach one concept each",
      "Email sequences from your own material",
      "Evergreen recycling keeps proven content circulating",
      "Free channel audit shows which topics pull best",
      "Revenue ledger tracks course income next to content effort",
    ],
    faq: [
      {
        q: "Will clips give away too much of my course?",
        a: "You approve every asset before it ships, and clips are 15–60 second moments — enough to demonstrate value, not enough to replace enrollment.",
      },
      {
        q: "Does it integrate with my course platform?",
        a: "Virafold handles the content and audience side — clips, posts, email list, link-in-bio. Your checkout stays wherever it is; your CTA points to it.",
      },
      {
        q: "Can I test different angles for the same lesson?",
        a: "Yes — one click clones any asset with an alternate hook, both versions publish, and real view counts decide the winner.",
      },
    ],
  },
  agencies: {
    name: "Agencies",
    slug: "agencies",
    headline: "Run every client's content engine from one system.",
    sub: "Repurposing, scheduling, and reporting are the hours that eat agency margin. Virafold automates the pipeline so your team spends time on strategy, not exports.",
    pains: [
      {
        pain: "Every client means another stack of tools and logins.",
        fix: "Generation, clipping, scheduling, audience, and revenue tracking live in one dashboard per workspace.",
      },
      {
        pain: "Repurposing is manual labor billed at strategy rates.",
        fix: "One client recording becomes the month's asset set automatically, in the client's brand voice with their banned words enforced.",
      },
      {
        pain: "Clients ask 'what's working?' and the answer takes a day to compile.",
        fix: "Post metrics flow back automatically and a weekly brief summarizes winners, queue, and revenue — forwardable as-is.",
      },
    ],
    features: [
      "Per-workspace brand voice: tone, CTAs, banned words",
      "Policy/demonetization lint before anything ships",
      "Signed provenance manifest on every asset (C2PA-shaped)",
      "Background scheduler with connected-account delivery",
      "Automatic metrics ingestion and weekly briefs",
      "Brand-deal pipeline and revenue ledger per workspace",
    ],
    faq: [
      {
        q: "How does client approval work?",
        a: "Every generated asset sits in review until approved — nothing publishes without a human decision, and the full edit trail is signed into each asset's provenance record.",
      },
      {
        q: "Can we keep each client's voice separate?",
        a: "Each workspace carries its own brand-voice profile — tone, audience, CTA, hashtags, banned words — enforced on every generation in that workspace.",
      },
      {
        q: "What does reporting look like?",
        a: "Connected accounts report real views, likes, and comments back automatically; the Monday brief compiles winners, the upcoming queue, and booked revenue.",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PERSONAS).map((persona) => ({ persona }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string }>;
}): Promise<Metadata> {
  const { persona } = await params;
  const p = PERSONAS[persona];
  if (!p) return {};
  const title = `Virafold for ${p.name} — ${p.headline}`;
  return {
    title,
    description: p.sub,
    alternates: { canonical: `/for/${p.slug}` },
    openGraph: {
      type: "website",
      url: `https://virafold.ai/for/${p.slug}`,
      siteName: "Virafold",
      title,
      description: p.sub,
    },
  };
}

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await params;
  const p = PERSONAS[persona];
  if (!p) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-neon-purple mb-3">
            Virafold for {p.name}
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            {p.headline}
          </h1>
          <p className="text-lg text-cyber-muted leading-relaxed mb-8">{p.sub}</p>

          <div className="flex flex-wrap gap-3 mb-14">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start free — no card required
            </Link>
            <Link
              href="/audit"
              className="px-6 py-3 rounded-xl border border-cyber-border text-foreground text-sm hover:border-neon-purple/50 transition-colors"
            >
              Run the free channel audit
            </Link>
          </div>

          <div className="space-y-4 mb-14">
            {p.pains.map((item) => (
              <div
                key={item.pain}
                className="bg-cyber-card border border-cyber-border rounded-xl p-5"
              >
                <p className="text-sm font-semibold text-foreground mb-1.5">{item.pain}</p>
                <p className="text-sm text-cyber-muted leading-relaxed">{item.fix}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-foreground mb-4">
            What {p.name.toLowerCase()} get out of the box
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2.5 mb-14">
            {p.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-cyber-muted">
                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-bold text-foreground mb-4">Common questions</h2>
          <div className="space-y-4 mb-14">
            {p.faq.map((f) => (
              <div key={f.q} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">{f.q}</p>
                <p className="text-sm text-cyber-muted leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-6 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              See it on your own channel first
            </p>
            <p className="text-sm text-cyber-muted mb-4">
              The free audit grades your last 25 videos in 20 seconds — no signup.
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

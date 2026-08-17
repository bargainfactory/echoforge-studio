import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CreateTool from "@/components/create-tool";

/**
 * Free format-scoped tool pages — one per vertical from the Services grid.
 * Each targets its own tool-seeker search intent ("YouTube Shorts script
 * generator") and funnels to signup for the AI-grade pipeline.
 */

interface FormatDef {
  name: string;
  h1: string;
  sub: string;
  placeholder: string;
  button: string;
  faq: { q: string; a: string }[];
}

const FORMATS: Record<string, FormatDef> = {
  "youtube-shorts": {
    name: "YouTube Shorts",
    h1: "Free YouTube Shorts Script Generator",
    sub: "Type an idea or paste a transcript — get several Short scripts back, each with a different hook, a body built from your actual words, an on-screen caption, and hashtags.",
    placeholder:
      'Type a topic like "how I edit videos twice as fast" — or paste a transcript for scripts built from your actual words…',
    button: "Generate Short scripts",
    faq: [
      {
        q: "Is this really free?",
        a: "Yes — no signup, no card. It runs Virafold's instant engine with a fair-use rate limit. The signed-in version upgrades to AI-grade output in your brand voice.",
      },
      {
        q: "Where do the scripts come from?",
        a: "From your input. Paste a transcript and the hooks, body, and captions are extracted and restructured from what you actually said — not generic templates.",
      },
      {
        q: "Can Virafold also make the actual video?",
        a: "Inside the app, yes: upload a recording and Clip Studio finds the most clippable moments and renders vertical clips with burned-in captions, ready to schedule to YouTube.",
      },
    ],
  },
  tiktok: {
    name: "TikTok",
    h1: "Free TikTok Script Generator",
    sub: "One idea in, several hook-first TikTok scripts out — each a different angle, with captions and hashtags, built from your words instead of a template.",
    placeholder:
      'Type a topic like "3 pricing mistakes freelancers make" — or paste a transcript…',
    button: "Generate TikTok scripts",
    faq: [
      {
        q: "Is this really free?",
        a: "Yes — no signup, no card. It runs Virafold's instant engine with a fair-use rate limit. The signed-in version upgrades to AI-grade output in your brand voice.",
      },
      {
        q: "Do the scripts follow TikTok's format?",
        a: "Each script opens with a scroll-stopping hook line, keeps the body tight for a sub-60-second read, and ends with a caption plus hashtags.",
      },
      {
        q: "Can it render the video too?",
        a: "In the app: upload a recording, and Clip Studio cuts the best moments into 9:16 clips with burned-in captions you can schedule straight to TikTok.",
      },
    ],
  },
  linkedin: {
    name: "LinkedIn",
    h1: "Free LinkedIn Post Generator",
    sub: "Turn an idea or a transcript into an authority-building LinkedIn post: a strong opening line, numbered takeaways from your actual content, and a closing prompt.",
    placeholder:
      'Type a topic like "what shipping 12 products taught me about focus" — or paste a transcript…',
    button: "Generate LinkedIn post",
    faq: [
      {
        q: "Is this really free?",
        a: "Yes — no signup, no card, fair-use rate limit. Signed in, generation upgrades to AI-grade and follows your saved brand voice and banned-words list.",
      },
      {
        q: "What makes a post 'authority-building'?",
        a: "Structure: a hook that earns the click on 'see more', concrete numbered takeaways rather than platitudes, and a closing line that invites replies.",
      },
      {
        q: "Does Virafold do carousels too?",
        a: "Yes — the carousel generator produces a 9-slide outline, and the full app generates both from every upload alongside newsletters and threads.",
      },
    ],
  },
  newsletter: {
    name: "Newsletter",
    h1: "Free Newsletter Generator",
    sub: "Paste a transcript or type a topic and get a complete newsletter edition: subject line, intro, body from your content, and three numbered takeaways.",
    placeholder:
      'Type a topic like "the 80/20 of growing an email list" — or paste a transcript for an edition built from it…',
    button: "Generate newsletter",
    faq: [
      {
        q: "Is this really free?",
        a: "Yes — no signup, no card, fair-use rate limit. The signed-in version writes in your brand voice with your signature and CTA on every edition.",
      },
      {
        q: "Can I send it from Virafold?",
        a: "In the app, yes: Virafold includes a subscriber list you own, a link-in-bio page that grows it, and newsletter broadcasts.",
      },
      {
        q: "What goes into the edition?",
        a: "A subject line, a short intro, body copy drawn from your input, and a numbered takeaways section — a complete draft you can edit and ship.",
      },
    ],
  },
  thread: {
    name: "X Thread",
    h1: "Free X (Twitter) Thread Generator",
    sub: "One idea becomes a hook-first thread: an opening tweet that stops the scroll, numbered tweets built from your content, and a closing call-to-action.",
    placeholder:
      'Type a topic like "why most side projects die in week 2" — or paste a transcript…',
    button: "Generate thread",
    faq: [
      {
        q: "Is this really free?",
        a: "Yes — no signup, no card, fair-use rate limit. Signed in, threads are AI-graded, follow your brand voice, and can be scheduled and delivered to X automatically.",
      },
      {
        q: "How long are the threads?",
        a: "Typically 8–10 tweets: one hook, the substance in numbered tweets kept under the character limit, and a closer with your call-to-action.",
      },
      {
        q: "Can Virafold post it for me?",
        a: "Yes — connect your X account in the app and the scheduler delivers threads at the time you pick, then pulls the real view counts back automatically.",
      },
    ],
  },
  carousel: {
    name: "Carousel",
    h1: "Free Carousel Generator for LinkedIn & Instagram",
    sub: "Turn one idea into a 9-slide carousel outline: a hook slide, seven content slides distilled from your input, and a CTA slide — ready to drop into any design tool.",
    placeholder:
      'Type a topic like "7 hooks that made my posts take off" — or paste a transcript…',
    button: "Generate carousel",
    faq: [
      {
        q: "Is this really free?",
        a: "Yes — no signup, no card, fair-use rate limit. The signed-in version upgrades to AI-grade slide copy in your brand voice.",
      },
      {
        q: "Does it design the slides?",
        a: "It writes the complete slide-by-slide copy — hook, content slides, CTA — which you paste into Canva, Figma, or any carousel template.",
      },
      {
        q: "Why 9 slides?",
        a: "Hook + seven substance slides + CTA is the structure that consistently earns saves and swipes on LinkedIn and Instagram without padding.",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(FORMATS).map((format) => ({ format }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ format: string }>;
}): Promise<Metadata> {
  const { format } = await params;
  const f = FORMATS[format];
  if (!f) return {};
  const title = `${f.h1} — Free, No Signup | Virafold`;
  return {
    title,
    description: f.sub,
    alternates: { canonical: `/create/${format}` },
    openGraph: {
      type: "website",
      url: `https://virafold.ai/create/${format}`,
      siteName: "Virafold",
      title,
      description: f.sub,
    },
  };
}

export default async function CreateFormatPage({
  params,
}: {
  params: Promise<{ format: string }>;
}) {
  const { format } = await params;
  const f = FORMATS[format];
  if (!f) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: f.faq.map((x) => ({
      "@type": "Question",
      name: x.q,
      acceptedAnswer: { "@type": "Answer", text: x.a },
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
          <p className="text-sm font-medium text-neon-purple mb-3">Free tool · no signup</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            {f.h1}
          </h1>
          <p className="text-lg text-cyber-muted leading-relaxed mb-8">{f.sub}</p>

          <CreateTool format={format} placeholder={f.placeholder} buttonLabel={f.button} />

          <h2 className="text-xl font-bold text-foreground mt-14 mb-4">Common questions</h2>
          <div className="space-y-4 mb-14">
            {f.faq.map((x) => (
              <div key={x.q} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">{x.q}</p>
                <p className="text-sm text-cyber-muted leading-relaxed">{x.a}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-cyber-muted">
            Need every format from one upload — plus clips, scheduling, and an audience you own?{" "}
            <Link href="/product" className="text-neon-purple hover:underline">
              See the full product
            </Link>{" "}
            or{" "}
            <Link href="/audit" className="text-neon-purple hover:underline">
              run the free channel audit
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AuditTeaser from "@/components/audit-teaser";

/**
 * Dedicated landing page for the free audit tool — its own URL so it can rank
 * for "youtube channel audit" queries and receive links independently of the
 * homepage. SEO copy is English (the tool UI itself is fully localized).
 */

export const metadata: Metadata = {
  title: "Free YouTube Channel Audit — Instant Virality Grade | Virafold",
  description:
    "Paste any YouTube channel and get a free virality audit in seconds: a 0-100 grade across hooks, consistency, timing, format, and engagement — plus what your winners have in common. No signup.",
  alternates: { canonical: "/audit" },
  openGraph: {
    type: "website",
    url: "https://virafold.ai/audit",
    siteName: "Virafold",
    title: "Free YouTube Channel Audit — Instant Virality Grade",
    description:
      "A 0-100 virality grade for any channel in seconds: hooks, consistency, timing, format, engagement. Free, no signup.",
  },
};

const faq = [
  {
    q: "What does the audit actually check?",
    a: "It pulls your channel's most recent videos (up to 50) with real view, like, and comment counts, then grades five dimensions: hook strength of your titles, posting consistency, timing patterns among your top performers, title format, and engagement rate versus a healthy benchmark.",
  },
  {
    q: "Is it really free? What's the catch?",
    a: "The grade, section scores, findings, and your top and bottom performers are free with no signup. Creating a free account unlocks the coached report: AI rewrites of your weakest hooks, a 30-day action plan, and your winning titles automatically steering every asset Virafold generates for you.",
  },
  {
    q: "How is the virality grade calculated?",
    a: "It's a weighted 0-100 score: hooks (30%), engagement rate (25%), posting consistency (20%), timing (15%), and title format (10%). The hook score uses the same heuristic Virafold's generation engine uses — questions, numbers, curiosity triggers, and length.",
  },
  {
    q: "Can I audit a competitor's channel?",
    a: "Yes — any public YouTube channel works. Auditing channels you admire is one of the fastest ways to see which title patterns actually drive their views.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function AuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="pt-16">
        <AuditTeaser />

        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
            {[
              ["50 videos analyzed", "Real views, likes, and comments from the YouTube Data API — not estimates."],
              ["5 graded dimensions", "Hooks, consistency, timing, format, and engagement — weighted into one 0-100 grade."],
              ["Winners vs. flops", "Your top and bottom performers side by side, with the pattern that separates them."],
            ].map(([title, desc]) => (
              <div key={title} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                <p className="text-xs text-cyber-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faq.map((f) => (
                <div key={f.q} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{f.q}</h3>
                  <p className="text-sm text-cyber-muted leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Portfolio from "@/components/portfolio";
import SuccessStories from "@/components/success-stories";

export const metadata: Metadata = {
  title: "Examples — Faceless Content in Every Format | Virafold",
  description:
    "Example outputs across formats — Shorts, TikToks, carousels, newsletters, and threads — all produced without showing a face, plus illustrative creator stories.",
  alternates: { canonical: "/examples" },
  openGraph: {
    type: "website",
    url: "https://virafold.ai/examples",
    siteName: "Virafold",
    title: "Examples — Faceless Content in Every Format | Virafold",
    description:
      "Example outputs across formats, all produced without showing a face.",
  },
};

/** Standalone examples page: the portfolio gallery and creator stories with
 *  their own URL, so the nav link opens a real destination. */
export default function ExamplesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Portfolio />
        <SuccessStories />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-6 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              Your channel could be next
            </p>
            <p className="text-sm text-cyber-muted mb-4">
              Run the free audit and see exactly what is holding your content back.
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Services from "@/components/services";
import TrustPillars from "@/components/trust-pillars";

export const metadata: Metadata = {
  title: "Product — Every Platform From One Upload | Virafold",
  description:
    "What Virafold generates from one recording: YouTube Shorts, TikToks, LinkedIn carousels, newsletters, and threads — plus the trust rails that keep every asset safe to publish.",
  alternates: { canonical: "/product" },
  openGraph: {
    type: "website",
    url: "https://virafold.ai/product",
    siteName: "Virafold",
    title: "Product — Every Platform From One Upload | Virafold",
    description:
      "What Virafold generates from one recording, and the trust rails behind every asset.",
  },
};

/** Standalone product page: the landing's Services + Trust sections with
 *  their own URL, so the nav link opens a real destination. */
export default function ProductPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Services />
        <TrustPillars />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
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

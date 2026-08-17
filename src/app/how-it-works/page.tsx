import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HowItWorks from "@/components/how-it-works";
import TryGenerator from "@/components/try-generator";

export const metadata: Metadata = {
  title: "How It Works — From Recording to Published | Virafold",
  description:
    "The Virafold pipeline step by step: upload, AI analysis, smart clipping, visual design, your review, and automatic publishing — then try the generator live, free.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    type: "website",
    url: "https://virafold.ai/how-it-works",
    siteName: "Virafold",
    title: "How It Works — From Recording to Published | Virafold",
    description:
      "The Virafold pipeline step by step — then try the generator live, free.",
  },
};

/** Standalone how-it-works page: the pipeline explainer plus the live
 *  no-signup generator so visitors can feel the flow immediately. */
export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <HowItWorks />
        <TryGenerator />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-r from-neon-purple/10 to-electric-blue/10 border border-neon-purple/30 rounded-xl p-6 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              Ready to run it on a real recording?
            </p>
            <p className="text-sm text-cyber-muted mb-4">
              Start free — no credit card. Upload once and review everything before it ships.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-neon-purple to-electric-blue text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

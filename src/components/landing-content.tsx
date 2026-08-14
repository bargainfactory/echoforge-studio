import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import TryGenerator from "@/components/try-generator";
import HowItWorks from "@/components/how-it-works";
import Portfolio from "@/components/portfolio";
import Services from "@/components/services";
import SuccessStories from "@/components/success-stories";
import Pricing from "@/components/pricing";
import TrustPillars from "@/components/trust-pillars";
import FinalCta from "@/components/final-cta";
import BlogPreview from "@/components/blog-preview";
import Footer from "@/components/footer";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://virafold.ai/#org",
      name: "Virafold",
      url: "https://virafold.ai",
      slogan: "One idea, folded into everything.",
      email: "hello@virafold.ai",
    },
    {
      "@type": "WebSite",
      "@id": "https://virafold.ai/#website",
      url: "https://virafold.ai",
      name: "Virafold",
      publisher: { "@id": "https://virafold.ai/#org" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Virafold",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://virafold.ai",
      description:
        "AI content repurposing platform for faceless creators: turn one long-form input into short-form clips, carousels, newsletters, and threads — then schedule, grow an owned audience, and track revenue.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier available; paid plans with monthly generation allowances.",
      },
      publisher: { "@id": "https://virafold.ai/#org" },
    },
  ],
};

/** The full landing page, shared by / (default locale) and /[lang] routes. */
export default function LandingContent() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      {/* Narrative order: promise → how → feel it → see it → what's inside →
          why trust it → who wins with it → price → close. One CTA per beat. */}
      <main>
        <Hero />
        <HowItWorks />
        <TryGenerator />
        <Portfolio />
        <Services />
        <TrustPillars />
        <SuccessStories />
        <Pricing />
        <FinalCta />
        <BlogPreview />
      </main>
      <Footer />
    </>
  );
}
